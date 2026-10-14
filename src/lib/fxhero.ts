import type { TweakMap, TweakSchema } from "./types";

/**
 * Shared generative hero ("Northbound Atlas"): one canvas scene used by Home,
 * Pricing and About. Every knob is a project-level theme token, so a change on
 * one board repaints all linked boards without restarting the animation.
 */
export const FX_KEYS = [
  "fxAccent2",
  "fxMode",
  "fxSpeed",
  "fxPulse",
  "fxDensity",
  "fxScale",
  "fxGlow",
  "fxTilt",
  "fxGrid",
  "fxArcs",
  "heroLayout",
] as const;

export function fxSchema(): TweakSchema {
  return {
    fxAccent2: { type: "color", value: "#ffb36b", label: "Glow color", group: "look" },
    fxMode: { type: "select", value: "globe", options: ["globe", "flow", "mesh"], label: "Scene", group: "visibility" },
    fxSpeed: { type: "range", value: 1, min: 0, max: 3, step: 0.05, label: "Speed", group: "motion" },
    fxPulse: { type: "range", value: 1.2, min: 0, max: 4, step: 0.1, label: "Pulse rate", group: "motion" },
    fxDensity: { type: "range", value: 1, min: 0.2, max: 2.5, step: 0.05, label: "Particle density", group: "motion" },
    fxScale: { type: "range", value: 1, min: 0.6, max: 1.5, step: 0.05, label: "Scene scale", group: "geometry" },
    fxGlow: { type: "range", value: 1, min: 0, max: 2, step: 0.05, label: "Glow", group: "geometry" },
    fxTilt: { type: "range", value: 18, min: -40, max: 40, step: 1, unit: "deg", label: "Tilt", group: "geometry" },
    fxGrid: { type: "range", value: 0.35, min: 0, max: 1, step: 0.05, label: "Grid opacity", group: "geometry" },
    fxArcs: { type: "boolean", value: true, label: "Arcs & pulses", group: "visibility" },
    heroLayout: { type: "select", value: "split", options: ["split", "stack", "full-bleed"], label: "Stage layout", group: "layout" },
  };
}

export function fxDefaults(): TweakMap {
  return Object.fromEntries(Object.entries(fxSchema()).map(([k, f]) => [k, f.value]));
}

export const FX_CSS = `
  html { --fx-mute: color-mix(in srgb, var(--tweak-ink) 58%, transparent); }
  nav, .sub, .lede, .meta, .name, .price span, footer, .story p, .fxcopy p { color: var(--fx-mute) !important; }
  body { transition: background-color .45s ease, color .45s ease; }
  .tier, .ptier, .card { background: color-mix(in srgb, var(--tweak-ink) 5%, var(--tweak-paper)) !important; transition: background-color .45s ease; }
  h1, h2, .mark, .price { color: var(--tweak-ink); }
  .fxhero { position: relative; display: grid; grid-template-columns: 1.05fr 0.95fr; gap: calc(36px * var(--tweak-density, 1)); align-items: center; }
  .fxcopy { position: relative; z-index: 1; min-width: 0; }
  .fxstage { position: relative; height: 330px; border-radius: var(--tweak-radius, 16px); overflow: hidden;
    background: radial-gradient(120% 90% at 70% 40%, color-mix(in srgb, var(--tweak-accent) 16%, transparent), transparent 70%),
                color-mix(in srgb, var(--tweak-ink) 4%, var(--tweak-paper));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tweak-ink) 9%, transparent), 0 30px 80px -40px color-mix(in srgb, var(--tweak-accent) 60%, transparent);
    transition: height .5s cubic-bezier(.2,.7,.2,1), border-radius .4s ease; }
  .fxband .fxstage { height: 190px; }
  canvas.fx { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  html[data-hero="stack"] .fxhero { grid-template-columns: 1fr; }
  html[data-hero="stack"] .fxstage { height: 210px; }
  html[data-hero="stack"] .fxband .fxstage { height: 120px; }
  html[data-hero="full-bleed"] .fxhero { grid-template-columns: 1fr; min-height: 380px; }
  html[data-hero="full-bleed"] .fxband { min-height: 210px; }
  html[data-hero="full-bleed"] .fxstage { position: absolute; inset: 0; height: auto; border-radius: 0; z-index: 0; box-shadow: none; }
  html[data-hero="full-bleed"] .fxstage::after { content: ""; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(90deg, var(--tweak-paper) 0%, color-mix(in srgb, var(--tweak-paper) 70%, transparent) 38%, transparent 72%); }
  html[data-hero="full-bleed"] .fxcopy { max-width: 560px; }
`;

export const FX_SCRIPT = String.raw`
(function(){
  var P={mode:"globe",speed:1,pulse:1.2,density:1,scale:1,glow:1,tilt:18,grid:.35,arcs:true,accent:"#c45c26",accent2:"#ffb36b",paper:"#f4efe6",ink:"#1a1612",hero:"split"};
  function clamp(v,a,b){return Math.min(b,Math.max(a,v));}
  function num(v,d){var n=parseFloat(v);return isFinite(n)?n:d;}
  function str(v){return String(v==null?"":v).replace(/["']/g,"").trim();}
  function bool(v){v=str(v);return !(v==="0"||v==="false"||v==="");}
  function rgb(h){h=str(h);if(/^#[0-9a-f]{3}$/i.test(h))h="#"+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];var m=/^#([0-9a-f]{6})$/i.exec(h);if(!m)return null;var n=parseInt(m[1],16);return [n>>16&255,n>>8&255,n&255];}
  var MAP={fxSpeed:"speed",fxPulse:"pulse",fxDensity:"density",fxScale:"scale",fxGlow:"glow",fxTilt:"tilt",fxGrid:"grid"};
  var LIM={speed:[0,3],pulse:[0,4],density:[.2,2.5],scale:[.6,1.5],glow:[0,2],tilt:[-40,40],grid:[0,1]};
  function apply(t){
    Object.keys(MAP).forEach(function(k){if(k in t&&str(t[k])!==""){var p=MAP[k];P[p]=clamp(num(t[k],P[p]),LIM[p][0],LIM[p][1]);}});
    if("fxMode" in t&&str(t.fxMode))P.mode=str(t.fxMode);
    if("fxArcs" in t&&t.fxArcs!=null&&str(t.fxArcs)!=="")P.arcs=bool(t.fxArcs);
    ["accent","paper","ink"].forEach(function(k){if(k in t&&rgb(t[k]))P[k]=str(t[k]);});
    if("fxAccent2" in t&&rgb(t.fxAccent2))P.accent2=str(t.fxAccent2);
    if("heroLayout" in t&&str(t.heroLayout))P.hero=str(t.heroLayout);
    document.documentElement.setAttribute("data-hero",P.hero);
  }
  function readVars(){var cs=getComputedStyle(document.documentElement),t={};
    ["fxSpeed","fxPulse","fxDensity","fxScale","fxGlow","fxTilt","fxGrid","fxMode","fxArcs","fxAccent2","accent","paper","ink","heroLayout"].forEach(function(k){var v=cs.getPropertyValue("--tweak-"+k);if(v&&v.trim())t[k]=v.trim();});
    apply(t);}
  window.addEventListener("atelier:tweaks",function(e){apply(e.detail||{});});
  // deterministic pools so density/mode changes never reset the scene
  var seed=7;function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
  var POOL=1400,pts=[];for(var i=0;i<POOL;i++){var y=1-(i+.5)/POOL*2,r=Math.sqrt(1-y*y),th=i*2.399963;pts.push([Math.cos(th)*r,y,Math.sin(th)*r]);}
  var order=pts.map(function(_,i){return i;});for(i=order.length-1;i>0;i--){var j=Math.floor(rnd()*(i+1));var tmp=order[i];order[i]=order[j];order[j]=tmp;}
  var cities=[];for(i=0;i<30;i++)cities.push(pts[order[i*37%POOL]]);
  var arcs=[];for(i=0;i<40;i++){var a=Math.floor(rnd()*30),b=Math.floor(rnd()*30);if(a===b)b=(b+7)%30;arcs.push([a,b,rnd()]);}
  var FL=2600,flow=[];for(i=0;i<FL;i++)flow.push({x:rnd(),y:rnd(),l:rnd()*200,c:rnd()});
  var stages=[];
  function mount(){document.querySelectorAll(".fxstage").forEach(function(st){if(st.__fx)return;var c=document.createElement("canvas");c.className="fx";st.appendChild(c);st.__fx=1;stages.push({el:st,c:c,ctx:c.getContext("2d"),w:0,h:0});});}
  function size(s){var d=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,s.el.clientWidth),h=Math.max(1,s.el.clientHeight);if(s.w!==w||s.h!==h||s.d!==d){s.w=w;s.h=h;s.d=d;s.c.width=Math.round(w*d);s.c.height=Math.round(h*d);}}
  var phase=0,ptime=0,last=0;
  function mix(a,b,t){return [a[0]+(b[0]-a[0])*t|0,a[1]+(b[1]-a[1])*t|0,a[2]+(b[2]-a[2])*t|0];}
  function css(c,al){return "rgba("+c[0]+","+c[1]+","+c[2]+","+clamp(al,0,1).toFixed(3)+")";}
  function rot(v,ry,rx){var x=v[0]*Math.cos(ry)+v[2]*Math.sin(ry),z=-v[0]*Math.sin(ry)+v[2]*Math.cos(ry),y=v[1];var y2=y*Math.cos(rx)-z*Math.sin(rx),z2=y*Math.sin(rx)+z*Math.cos(rx);return [x,y2,z2];}
  function slerp(a,b,t){var d=clamp(a[0]*b[0]+a[1]*b[1]+a[2]*b[2],-1,1),w=Math.acos(d)||1e-4,s=Math.sin(w);var k1=Math.sin((1-t)*w)/s,k2=Math.sin(t*w)/s;return [a[0]*k1+b[0]*k2,a[1]*k1+b[1]*k2,a[2]*k1+b[2]*k2];}
  function globe(s,g,A,B,dark){
    var W=s.c.width,H=s.c.height,d=s.d,full=P.hero==="full-bleed";
    var R=Math.min(W*(full?.34:.46),H*.44)*P.scale,cx=W*(full?.68:.5),cy=H*.52;
    var ry=phase,rx=P.tilt*Math.PI/180;
    function pr(v){var q=rot(v,ry,rx);return [cx+q[0]*R,cy-q[1]*R,q[2]];}
    var halo=g.createRadialGradient(cx,cy,R*.6,cx,cy,R*(1.35+.25*P.glow));halo.addColorStop(0,css(A,.0));halo.addColorStop(.55,css(A,.18*P.glow));halo.addColorStop(1,css(A,0));g.fillStyle=halo;g.fillRect(0,0,W,H);
    var body=g.createRadialGradient(cx-R*.35,cy-R*.4,R*.1,cx,cy,R);body.addColorStop(0,css(mix(A,[255,255,255],.25),dark?.22:.16));body.addColorStop(1,css(A,dark?.05:.03));g.fillStyle=body;g.beginPath();g.arc(cx,cy,R,0,7);g.fill();
    if(P.grid>0){g.lineWidth=Math.max(.6,.8*d);for(var la=-75;la<=75;la+=15){g.beginPath();for(var lo=0;lo<=360;lo+=6){var phi=la*Math.PI/180,th=lo*Math.PI/180,p=pr([Math.cos(phi)*Math.cos(th),Math.sin(phi),Math.cos(phi)*Math.sin(th)]);if(lo===0)g.moveTo(p[0],p[1]);else g.lineTo(p[0],p[1]);}g.strokeStyle=css(mix(A,B,.3),P.grid*(dark?.35:.3));g.stroke();}
      for(lo=0;lo<180;lo+=20){g.beginPath();for(la=0;la<=360;la+=6){phi=la*Math.PI/180;th=lo*Math.PI/180;p=pr([Math.cos(phi)*Math.cos(th),Math.sin(phi),Math.cos(phi)*Math.sin(th)]);if(la===0)g.moveTo(p[0],p[1]);else g.lineTo(p[0],p[1]);}g.stroke();}}
    var n=Math.round(420*P.density);for(var i=0;i<n;i++){var q=pr(pts[order[i%POOL]]),f=(q[2]+1)/2;if(f<.35&&i%2)continue;var sz=(.7+1.5*f)*d*Math.sqrt(P.scale);g.fillStyle=css(mix(A,B,f*.6),.12+.78*f*f);g.fillRect(q[0]-sz/2,q[1]-sz/2,sz,sz);}
    if(dark)g.globalCompositeOperation="lighter";
    if(P.arcs){for(var k=0;k<arcs.length;k++){var a=cities[arcs[k][0]],b=cities[arcs[k][1]],lift=.18+.22*arcs[k][2],seg=28,prev=null;g.lineWidth=(1+.5*P.glow)*d;
      for(var s2=0;s2<=seg;s2++){var t=s2/seg,v=slerp(a,b,t),h=1+lift*Math.sin(Math.PI*t);var pp=pr([v[0]*h,v[1]*h,v[2]*h]);if(prev){g.strokeStyle=css(B,(pp[2]>-.1?.5:.08)*(.5+.25*P.glow));g.beginPath();g.moveTo(prev[0],prev[1]);g.lineTo(pp[0],pp[1]);g.stroke();}prev=pp;}
      for(var m=0;m<2;m++){var tt=(ptime*.35+arcs[k][2]+m*.5)%1,vv=slerp(a,b,tt),hh=1+lift*Math.sin(Math.PI*tt),pq=pr([vv[0]*hh,vv[1]*hh,vv[2]*hh]);if(pq[2]<-.15)continue;var rr=(2+2.5*P.glow)*d;var gl=g.createRadialGradient(pq[0],pq[1],0,pq[0],pq[1],rr*4);gl.addColorStop(0,css([255,255,255],.95));gl.addColorStop(.25,css(B,.8));gl.addColorStop(1,css(B,0));g.fillStyle=gl;g.beginPath();g.arc(pq[0],pq[1],rr*4,0,7);g.fill();}}}
    for(i=0;i<cities.length;i++){q=pr(cities[i]);if(q[2]<-.05)continue;var pul=(Math.sin(ptime*2+i)+1)/2,cr=(1.6+1.6*pul*P.glow)*d*P.scale;g.fillStyle=css(B,.9);g.beginPath();g.arc(q[0],q[1],cr,0,7);g.fill();g.strokeStyle=css(B,.35*(1-pul));g.lineWidth=d;g.beginPath();g.arc(q[0],q[1],cr*(2+3*pul),0,7);g.stroke();}
    g.globalCompositeOperation="source-over";
  }
  function flowScene(s,g,A,B,dark){
    var W=s.c.width,H=s.c.height,d=s.d,n=Math.round(900*P.density);if(n>FL)n=FL;var fr=2.2/P.scale;
    if(P.grid>0){g.fillStyle=css(mix(A,B,.4),P.grid*.5);var st=Math.round(22*d*P.scale);for(var gx=st/2;gx<W;gx+=st)for(var gy=st/2;gy<H;gy+=st)g.fillRect(gx,gy,d,d);}
    if(dark)g.globalCompositeOperation="lighter";g.lineCap="round";
    for(var i=0;i<n;i++){var p=flow[i],x=p.x*W,y=p.y*H;var ang=Math.sin(p.x*fr*3+phase*1.3)*2.2+Math.cos(p.y*fr*4-phase)*1.6;var v=(.0009+.0011*p.c)*(.3+P.speed);p.x+=Math.cos(ang)*v;p.y+=Math.sin(ang)*v*W/H;p.l-=1;
      if(p.x<0||p.x>1||p.y<0||p.y>1||p.l<0){p.x=rnd();p.y=rnd();p.l=80+rnd()*200;continue;}
      var c=mix(A,B,p.c),pul=P.arcs?(Math.sin(ptime*3+p.c*40)+1)/2:0;g.strokeStyle=css(c,.25+.5*p.c+.25*pul);g.lineWidth=(.8+1.6*p.c*P.glow*.6+pul*P.glow)*d*P.scale;g.beginPath();g.moveTo(x,y);g.lineTo(p.x*W-Math.cos(ang)*6*d*P.glow,p.y*H-Math.sin(ang)*6*d*P.glow);g.stroke();}
    g.globalCompositeOperation="source-over";
  }
  function mesh(s,g,A,B,dark){
    var W=s.c.width,H=s.c.height,d=s.d,cols=Math.round(10+14*P.density),rows=Math.round(6+8*P.density),rx=P.tilt*Math.PI/180+.9,amp=.22*P.scale*(.6+.6*P.glow);
    function pr(u,v){var x=(u-.5)*2.4*P.scale,z=(v-.5)*2,y=Math.sin(u*6+phase*2)*Math.cos(v*5-phase*1.4)*amp;var y2=y*Math.cos(rx)-z*Math.sin(rx),z2=y*Math.sin(rx)+z*Math.cos(rx)+3;var f=1.6/z2;return [W/2+x*f*W*.32,H*.55-y2*f*H*.6,z2,y];}
    var grid=[];for(var r=0;r<=rows;r++){grid.push([]);for(var c=0;c<=cols;c++)grid[r].push(pr(c/cols,r/rows));}
    g.lineWidth=Math.max(.7,.9*d);if(dark)g.globalCompositeOperation="lighter";
    for(r=0;r<=rows;r++)for(c=0;c<=cols;c++){var p=grid[r][c],t=clamp(p[3]/amp*.5+.5,0,1),col=mix(A,B,t),al=(.15+P.grid*.6)*(1-r/rows*.5);g.strokeStyle=css(col,al);if(c<cols){g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(grid[r][c+1][0],grid[r][c+1][1]);g.stroke();}if(r<rows){g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(grid[r+1][c][0],grid[r+1][c][1]);g.stroke();}
      g.fillStyle=css(col,.5+.5*t);var sz=(1+2*t*P.glow)*d;g.fillRect(p[0]-sz/2,p[1]-sz/2,sz,sz);}
    if(P.arcs)for(r=0;r<=rows;r+=2){var u=(ptime*.25+r*.137)%1,q=pr(u,r/rows),rr=(3+3*P.glow)*d,gl=g.createRadialGradient(q[0],q[1],0,q[0],q[1],rr*3);gl.addColorStop(0,css([255,255,255],.9));gl.addColorStop(.3,css(B,.7));gl.addColorStop(1,css(B,0));g.fillStyle=gl;g.beginPath();g.arc(q[0],q[1],rr*3,0,7);g.fill();}
    g.globalCompositeOperation="source-over";
  }
  var manual=false;
  function render(dt){
    phase+=dt*P.speed*.35;ptime+=dt*P.pulse;
    var A=rgb(P.accent)||[196,92,38],B=rgb(P.accent2)||[255,179,107],pp=rgb(P.paper)||[244,239,230],dark=(pp[0]*.3+pp[1]*.59+pp[2]*.11)<110;
    for(var i=0;i<stages.length;i++){var s=stages[i];size(s);var g=s.ctx;
      if(P.mode==="flow"){g.globalCompositeOperation="destination-out";g.fillStyle="rgba(0,0,0,.12)";g.fillRect(0,0,s.c.width,s.c.height);g.globalCompositeOperation="source-over";}
      else g.clearRect(0,0,s.c.width,s.c.height);
      try{if(P.mode==="flow")flowScene(s,g,A,B,dark);else if(P.mode==="mesh")mesh(s,g,A,B,dark);else globe(s,g,A,B,dark);}catch(e){}
    }
  }
  function frame(now){
    if(manual)return;
    var dt=last?Math.min(.05,(now-last)/1000):0;last=now;render(dt);
    requestAnimationFrame(frame);
  }
  // Deterministic capture hook: a recorder may call __fxStep(dt) per output
  // frame; the scene then advances exactly dt seconds per frame (no rAF).
  window.__fxStep=function(dt){manual=true;render(clamp(+dt||0,0,.1));return true;};
  function boot(){mount();readVars();requestAnimationFrame(frame);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
`;

export function withFxHero(html: string): string {
  return html
    .replace(/<\/head>/i, `<style data-fx-hero>${FX_CSS}</style></head>`)
    .replace(/<\/body>/i, `<script data-fx-hero>${FX_SCRIPT}</script></body>`);
}
