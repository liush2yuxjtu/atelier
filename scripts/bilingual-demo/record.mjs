// Real browser capture. No mocked network/model responses or manufactured UI.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
const out=path.resolve(process.argv[2]||'docs/media/runs/bilingual-v1-take1');
const rehearse=process.argv.includes('--rehearse');
const locale=process.env.DEMO_LOCALE||'en';
if(!['en','zh-CN'].includes(locale))throw Error('Unsupported locale');
const expectedBefore=locale==='zh-CN'?'把山野的风味，装进咖啡杯。':'Coffee that tastes like the trail.';
const expectedAfter=locale==='zh-CN'?'每一袋，都有新鲜感':'Bags without the boredom';
if(fs.existsSync(out))throw Error('Refusing to overwrite take '+out);
for(const d of ['frames','evidence'])fs.mkdirSync(path.join(out,d),{recursive:true});
const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const browser=await chromium.launch({...(executablePath?{executablePath}:{}),headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2,locale:'en-US'});
const page=await context.newPage();const errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/chat'))requests.push({url:r.url(),method:r.method()});});
let start=0,startWall=0,stopping=false;const frames=[],markers=[];let capture;
const mark=(label,extra={})=>{const m={elapsed_ms:Math.round(performance.now()-start),label,...extra};markers.push(m);console.log(m);return m;};
const box=async testid=>{const b=await page.getByTestId(testid).first().boundingBox();if(!b||b.x<0||b.y<0||b.x+b.width>1440||b.y+b.height>900)throw Error('Framing failure '+testid+JSON.stringify(b));return b;};
async function move(testid){const b=await box(testid);await page.mouse.move(b.x+b.width*.86,b.y+b.height*.8,{steps:20});await page.waitForTimeout(350);return b;}
const hero=()=>page.getByTestId('artboard-ab-landing').locator('iframe').contentFrame().locator('h1');
try{
 await page.goto(process.env.DEMO_URL||'http://127.0.0.1:43173',{waitUntil:'networkidle'});
 await page.getByTestId('locale-select').selectOption(locale);
 await page.waitForFunction(l=>document.documentElement.lang===l,locale);
 await page.getByTestId('open-demo').click();await page.getByTestId('artboard-ab-dashboard').waitFor();await page.waitForTimeout(1300);
 await page.getByTestId('artboard-title-ab-landing').click();await page.getByTestId('tab-tweaks').click();
 for(let i=0;i<2;i++){await page.getByTestId('zoom-in').click();await page.waitForTimeout(250);}
 await page.waitForTimeout(1200);
 const before=await hero().innerText();if(before!==expectedBefore)throw Error('Unexpected before '+before);
 const boxes={control:await box('tweak-mood-playful'),mood:await box('tweak-mood'),board:await box('artboard-ab-landing'),hero:await hero().boundingBox(),panel:await page.getByTestId('tweak-panel').boundingBox()};
 const registry=await page.evaluate(()=>({native:typeof navigator.modelContext!=='undefined',pluno:typeof globalThis.__PLUNO_WEBMCP_TOOLS__!=='undefined'}));
 fs.writeFileSync(path.join(out,'evidence/discovery.json'),JSON.stringify({viewport:[1440,900],dpr:2,boxes,before,registry,interaction:'Local Zustand state and sandbox postMessage; no API request for Mood change'},null,2));
 await page.evaluate(()=>{const c=document.createElement('div');c.id='__recording_pointer';c.style.cssText='position:fixed;z-index:2147483647;width:24px;height:28px;pointer-events:none;left:900px;top:600px;filter:drop-shadow(0 1px 2px #0008)';c.innerHTML='<svg width="24" height="28" viewBox="0 0 24 28"><path d="M3 2v21l6-6 5 9 3-2-5-9h9z" fill="white" stroke="#181818" stroke-width="1.2"/></svg>';document.documentElement.append(c);addEventListener('mousemove',e=>{c.style.left=e.clientX+'px';c.style.top=e.clientY+'px';},true);});
 await page.screenshot({path:path.join(out,'evidence/before.png')});
 start=performance.now();startWall=Date.now();
 await page.evaluate(wall=>{window.__demoClicks=[];addEventListener('click',e=>window.__demoClicks.push({elapsed_ms:performance.timeOrigin+e.timeStamp-wall,x:e.clientX,y:e.clientY}),true);},startWall);
 if(!rehearse){
  capture=await context.newCDPSession(page);
  capture.on('Page.screencastFrame',event=>{
   if(stopping)return;
   const file=`frames/${String(frames.length).padStart(5,'0')}.jpg`;
   fs.writeFileSync(path.join(out,file),Buffer.from(event.data,'base64'));
   frames.push({file,elapsed_ms:event.metadata.timestamp*1000-startWall,browser_timestamp_s:event.metadata.timestamp});
   void capture.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(error=>{
    if(!stopping)errors.push('Screencast acknowledgement failed: '+String(error));
   });
  });
  await capture.send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:2880,maxHeight:1800,everyNthFrame:1});
 }
 mark('before: native Mood control',{text:before,locale});await page.waitForTimeout(rehearse?100:3200);
 await move('tweak-mood-playful');mark('pointer on Playful');await page.waitForTimeout(rehearse?100:900);
 mark('click Playful',{box:boxes.control});await page.getByTestId('tweak-mood-playful').click({position:{x:boxes.control.width*.86,y:boxes.control.height*.8}});
 await hero().filter({hasText:expectedAfter}).waitFor();
 const result=await hero().innerText();mark('result: same hero rewritten',{result,hero:await hero().boundingBox()});
 await page.waitForTimeout(rehearse?100:700);await page.mouse.move(990,780,{steps:20});mark('pointer parked');
 await page.screenshot({path:path.join(out,'evidence/after.png')});
 await page.waitForTimeout(rehearse?100:6200);mark('end');
 if(requests.length)throw Error('Unexpected model request');
 fs.writeFileSync(path.join(out,'evidence/rehearsal.json'),JSON.stringify({semantics:'PASS',selectors:'PASS',state:'PASS',framing:'PASS',before,result,model_calls:requests.length,page_errors:errors},null,2));
}finally{
 stopping=true;
 if(capture){await capture.send('Page.stopScreencast');await capture.detach();}
 fs.writeFileSync(path.join(out,'evidence/native-clicks.json'),JSON.stringify(await page.evaluate(()=>window.__demoClicks??[]),null,2));
 fs.writeFileSync(path.join(out,'frames.json'),JSON.stringify(frames));
 fs.writeFileSync(path.join(out,'evidence/markers.json'),JSON.stringify(markers,null,2));
 fs.writeFileSync(path.join(out,'evidence/source.json'),JSON.stringify({environment:'local-repository-demo',production_verified:false,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),package:JSON.parse(fs.readFileSync('package.json')).version,hostname:os.hostname(),browser:browser.version(),playwright:JSON.parse(fs.readFileSync('node_modules/playwright/package.json')).version,viewport:[1440,900],dpr:2,ui_locale:locale,new_recording:!rehearse,model_calls:requests.length,scope:'Native Mood control changes prepared demo content; no AI generation claimed',errors},null,2));
 await browser.close();
}
