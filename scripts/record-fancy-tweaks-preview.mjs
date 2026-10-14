import { chromium } from "/tmp/atelier/node_modules/@playwright/test/index.mjs";
import fs from "node:fs";
const OUT = process.env.HOME + "/fx/out"; fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT + "/raw", { recursive: true });
const W=1920,H=1080;
const b = await chromium.launch({ args: ["--use-gl=angle","--enable-gpu-rasterization"] });
const c = await b.newContext({ viewport: { width: W, height: H }, locale: "en-US", recordVideo: { dir: OUT + "/raw", size: { width: W, height: H } } });
const p = await c.newPage(); const t0 = Date.now(); const M = []; const mark = (l) => { M.push({ t: (Date.now() - t0) / 1000, l }); console.log(((Date.now()-t0)/1000).toFixed(2), l); };
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error")errs.push(m.text())});
async function cursor(){ await p.addStyleTag({content:"*{cursor:none!important}"}); await p.evaluate(()=>{const c=document.createElement("div");c.style.cssText="position:fixed;z-index:2147483647;width:24px;height:24px;pointer-events:none;left:960px;top:540px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))";c.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24"><path fill="#fafafa" stroke="#1a1612" stroke-width="1.15" d="M3.6 2.8v17.4l5.4-5.1 4.4 8.1 2.6-1.35-4.5-8.15H19.2z"/></svg>';document.documentElement.appendChild(c);addEventListener("mousemove",e=>{c.style.left=e.clientX+"px";c.style.top=e.clientY+"px"},true);}); }
async function to(loc, steps=18){ await loc.scrollIntoViewIfNeeded(); const bx = await loc.boundingBox(); await p.mouse.move(bx.x+bx.width/2, bx.y+bx.height/2, {steps}); return bx; }
async function drag(key, frac){ const w = p.getByTestId("tweak-"+key); await w.scrollIntoViewIfNeeded(); await p.waitForTimeout(250); const thumb = w.locator('[role="slider"]'); const tb = await to(thumb, 16); const wb = await w.boundingBox(); const x0 = wb.x+6, x1 = wb.x + wb.width - 54; await p.mouse.down(); await p.mouse.move(x0+(x1-x0)*frac, tb.y+tb.height/2, {steps: 30}); await p.mouse.up(); }
async function still(n){ await p.screenshot({ path: `${OUT}/still-${n}.png` }); }
await p.goto("http://127.0.0.1:43173", { waitUntil: "networkidle" });
await p.evaluate(() => { indexedDB.deleteDatabase("atelier"); localStorage.removeItem("atelier:project-index"); });
await p.reload({ waitUntil: "networkidle" });
await p.getByTestId("open-demo").click({ force: true }); await p.getByTestId("artboard-ab-about").waitFor();
await p.waitForTimeout(1200); await cursor();
// frame the three pages
const cv = await p.getByTestId("canvas-view").boundingBox();
await p.mouse.move(cv.x + 20, cv.y + 40); await p.keyboard.down("Control"); for (let i=0;i<2;i++){ await p.mouse.wheel(0, 60); await p.waitForTimeout(60);} await p.keyboard.up("Control");
await p.waitForTimeout(300);
const hb = await p.getByTestId("artboard-ab-landing").boundingBox();
await p.mouse.wheel(hb.x - cv.x - 24, hb.y - cv.y - 30); await p.waitForTimeout(400);
await p.getByTestId("artboard-title-ab-landing").click(); await p.waitForTimeout(800);
mark("baseline running (Ember, globe)"); await still("1-baseline-ember"); await p.waitForTimeout(2200);
await drag("fxSpeed", 0.85); mark("Speed -> high"); await p.waitForTimeout(900);
await drag("fxGlow", 1.0); mark("Glow -> max"); await p.waitForTimeout(900);
await drag("fxDensity", 0.95); mark("Density -> max"); await p.waitForTimeout(900);
const pal = p.getByTestId("palette-aurora"); await to(pal); await pal.click(); mark("Look -> Aurora (dark premium)"); await p.waitForTimeout(1500); await still("2-aurora-max");
const hl = p.getByTestId("tweak-heroLayout"); await to(hl); await hl.selectOption("full-bleed"); mark("Hero layout -> full-bleed"); await p.waitForTimeout(1800); await still("3-aurora-fullbleed");
await p.getByTestId("artboard-title-ab-about").click(); await p.waitForTimeout(600); mark("select About");
const un = p.getByTestId("unlink-fxMode"); await to(un); await un.click(); mark("About: Unlink Scene"); await p.waitForTimeout(700);
await p.getByTestId("artboard-title-ab-landing").click(); await p.waitForTimeout(500);
const md = p.getByTestId("tweak-fxMode"); await to(md); await md.selectOption("flow"); mark("Home: Scene -> flow (Pricing follows, About stays globe)"); await p.waitForTimeout(2200); await still("4-flow-about-unlinked");
await drag("fxTilt", 0.1); mark("Tilt"); await p.waitForTimeout(1500);
mark("end");
fs.writeFileSync(OUT + "/markers.json", JSON.stringify({ M, errs }, null, 2));
const v = p.video(); await p.close(); await c.close(); await b.close(); fs.renameSync(await v.path(), OUT + "/raw/preview.webm"); console.log("errors", JSON.stringify(errs));
