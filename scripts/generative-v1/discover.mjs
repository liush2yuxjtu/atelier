import { chromium } from "/tmp/atelier-gen/node_modules/@playwright/test/index.mjs";
import fs from "node:fs"; import path from "node:path";
const OUT = path.join(process.env.HOME, "gen/discovery"); fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1920, height: 1080 }, locale: "en-US" });
const p = await c.newPage();
await p.goto("http://127.0.0.1:43173", { waitUntil: "networkidle" });
await p.evaluate(() => { indexedDB.deleteDatabase("atelier"); localStorage.clear(); }); await p.reload({ waitUntil: "networkidle" });
await p.getByTestId("open-demo").click(); await p.getByTestId("artboard-ab-dashboard").waitFor(); await p.waitForTimeout(2500);
await p.screenshot({ path: OUT + "/00-canvas.png" });
await p.getByTestId("artboard-title-ab-landing").click(); await p.waitForTimeout(800);
await p.getByTestId("tab-tweaks").click().catch(()=>{}); await p.waitForTimeout(800);
await p.screenshot({ path: OUT + "/01-home-tweaks.png" });
const ids = await p.$$eval("[data-testid]", els => els.map(e => { const r = e.getBoundingClientRect(); return [e.dataset.testid, Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), (e.innerText||"").slice(0,40).replace(/\n/g," | ")]; }).filter(x => x[3] > 0));
fs.writeFileSync(OUT + "/testids.json", JSON.stringify(ids, null, 0).replace(/\],\[/g, "],\n["));
const steps = [["tweak-mood-playful","02-playful"],["tweak-socialProof","03-socialoff"],["artboard-title-ab-dashboard","04-dash"],["tweak-metricDensity-dense","05-dense"],["artboard-title-ab-pricing","06-pricing"],["tweak-planCount-4","07-4plans"],["tweak-billing-yearly","08-yearly"],["apply-across-canvas","09-apply"]];
for (const [t, n] of steps) { if (t==="artboard-title-ab-dashboard") await p.mouse.click(1550,470); else await p.getByTestId(t).first().click(); await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/${n}.png` }); }
await p.getByTestId("artboard-title-ab-landing").dispatchEvent("click"); await p.waitForTimeout(500);
for (let i=0;i<3;i++){ await p.getByTestId("zoom-in").click().catch(e=>console.log("zoomerr",e.message.slice(0,80))); await p.waitForTimeout(300);} 
await p.screenshot({ path: OUT + "/10-zoomed.png" });
await p.getByTestId("mode-present").dispatchEvent("click").catch(e=>console.log("nopresent")); await p.waitForTimeout(2500);
await p.screenshot({ path: OUT + "/11-present.png" });
const ids2 = await p.$$eval("[data-testid]", els => els.map(e => { const r = e.getBoundingClientRect(); return [e.dataset.testid, Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), (e.innerText||"").slice(0,40).replace(/\n/g," | ")]; }).filter(x => x[3] > 0));
fs.writeFileSync(OUT + "/testids-present.json", JSON.stringify(ids2).replace(/\],\[/g, "],\n["));
console.log("ok", fs.readdirSync(OUT)); await b.close();
