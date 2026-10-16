// Tweaks v6 GT recorder: deterministic 30 fps frame capture.
// Each output frame: advance every hero scene exactly 1/30 s (__fxStep), move the pointer one
// interpolated step, then screenshot. No screencast => no duplicated / dropped frames.
import { chromium } from "/tmp/atelier/node_modules/@playwright/test/index.mjs";
import fs from "node:fs"; import path from "node:path";
const TAKE = process.env.TAKE || "fancy-v6-take1"; const REH = process.env.REHEARSE === "1";
const RUN = path.join(process.env.HOME, "v6/runs", TAKE); const FR = path.join(RUN, "frames"), EV = path.join(RUN, "evidence");
fs.rmSync(RUN, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true }); fs.mkdirSync(EV, { recursive: true });
const FPS = 30, W = 1920, H = 1080;
const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, locale: "en-US" });
const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push("pageerror " + e.message)); p.on("console", m => { if (m.type() === "error") errs.push("console " + m.text()); });
let n = 0, mx = 960, my = 600; const markers = []; const beats = {};
const mark = (label, extra = {}) => { const r = { elapsed_ms: Math.round(n * 1000 / FPS), frame: n, label, ...extra }; markers.push(r); console.log(r.elapsed_ms, label); };
let fxFrames = [];
async function findFx() { fxFrames = []; for (const f of p.frames()) { const ok = await f.evaluate(() => typeof window.__fxStep === "function" && !!document.querySelector("canvas.fx")).catch(() => false); if (ok) fxFrames.push(f); } }
async function step() {
  await Promise.all(fxFrames.map(f => f.evaluate(() => window.__fxStep(1 / 30)).catch(() => {})));
  if (!REH) await p.screenshot({ path: path.join(FR, String(n).padStart(5, "0") + ".jpg"), type: "jpeg", quality: 92 });
  else if (n % 15 === 0) await new Promise(r => setTimeout(r, 1));
  n++;
}
async function hold(sec) { for (let i = 0, k = Math.round(sec * FPS); i < k; i++) await step(); }
const ease = t => 0.5 - 0.5 * Math.cos(Math.PI * t);
async function glide(x, y, sec) { const x0 = mx, y0 = my, k = Math.max(1, Math.round(sec * FPS)); for (let i = 1; i <= k; i++) { const e = ease(i / k); mx = x0 + (x - x0) * e; my = y0 + (y - y0) * e; await p.mouse.move(mx, my); await step(); } }
async function center(tid, dx = 0) { const bx = await p.getByTestId(tid).first().boundingBox(); return [bx.x + bx.width / 2 + dx, bx.y + bx.height / 2, bx]; }
async function to(tid, sec, dx = 0) { const [x, y] = await center(tid, dx); await glide(x, y, sec); }
async function click() { await p.mouse.down(); await step(); await p.mouse.up(); await step(); }
async function slider(key, frac, sec) { const th = p.getByTestId("tweak-" + key).locator('[role="slider"]'); const tb = await th.boundingBox(); const wb = await p.getByTestId("tweak-" + key).boundingBox(); await glide(tb.x + tb.width / 2, tb.y + tb.height / 2, 0.6); await p.mouse.down(); await step(); const x0 = wb.x + 8, x1 = wb.x + wb.width - 30; await glide(x0 + (x1 - x0) * frac, my, sec); await p.mouse.up(); await step(); }
async function shot(name) { const f = path.join(EV, name + ".png"); await p.screenshot({ path: f }); beats[name] = { frame: n, t: n / FPS }; }
async function cursor() { await p.addStyleTag({ content: "*{cursor:none!important}" }); await p.evaluate(() => { const c = document.createElement("div"); c.id = "__cur"; c.style.cssText = "position:fixed;z-index:2147483647;width:26px;height:26px;pointer-events:none;left:960px;top:600px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.55))"; c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path fill="#fafafa" stroke="#1a1612" stroke-width="1.15" d="M3.6 2.8v17.4l5.4-5.1 4.4 8.1 2.6-1.35-4.5-8.15H19.2z"/></svg>'; document.documentElement.appendChild(c); addEventListener("mousemove", e => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true); }); }
const lookOf = () => Promise.all(["landing", "pricing", "about"].map(id => p.evaluate(id => { const pr = window.__s; return null; }, id)));
try {
  await p.goto("http://127.0.0.1:43173", { waitUntil: "networkidle" });
  await p.evaluate(() => { indexedDB.deleteDatabase("atelier"); localStorage.removeItem("atelier:project-index"); });
  await p.reload({ waitUntil: "networkidle" });
  await p.getByTestId("open-demo").click({ force: true }); await p.getByTestId("artboard-ab-about").waitFor();
  await p.waitForTimeout(1500); await p.getByTestId("artboard-title-ab-landing").click(); await p.waitForTimeout(300);
  await p.getByTestId("mode-present").click({ force: true }); await p.getByTestId("present-dock").waitFor(); await p.waitForTimeout(2500);
  await findFx(); await cursor(); await p.mouse.move(mx, my);
  const body = await p.locator("body").innerText();
  const pre = { ui_language: "en", phrases: ["Present", "Exit present", "Approved", "Speed", "Glow"].filter(s => body.toLowerCase().includes(s.toLowerCase())), cjk: /[\u3400-\u9fff]/.test(body), fx_frames: fxFrames.length };
  await p.screenshot({ path: path.join(EV, "ui-language-preflight.png") }); fs.writeFileSync(path.join(EV, "ui-language-preflight.json"), JSON.stringify(pre, null, 2));
  if (pre.cjk || pre.phrases.length < 3 || fxFrames.length < 3) throw new Error("preflight failed " + JSON.stringify(pre));
  const boxes = {}; for (const t of ["artboard-ab-landing", "artboard-ab-pricing", "artboard-ab-about", "present-dock", "palette-aurora", "palette-ember", "tweak-fxSpeed", "tweak-fxGlow", "tweak-heroLayout", "present-unlink-look", "linked-count", "approve-look"]) boxes[t] = await p.getByTestId(t).first().boundingBox();
  fs.writeFileSync(path.join(EV, "discovery.json"), JSON.stringify({ viewport: [W, H], boxes }, null, 2));
  // ---- GT timeline ----
  mark("start: client review, Present, Ember globe running"); await hold(2.0); await shot("b0-ember");
  await to("tweak-fxSpeed", 0.9); mark("pointer on Speed");
  await slider("fxSpeed", 0.82, 1.0); mark("Speed dragged high");
  await slider("fxGlow", 1.0, 0.9); mark("Glow dragged to max"); await hold(0.4); await shot("b1-speed-glow");
  await to("palette-aurora", 0.7); await click(); mark("Look -> Aurora (all three pages)"); await hold(2.0); await shot("b2-aurora");
  await to("tweak-heroLayout", 0.7); await p.getByTestId("tweak-heroLayout").selectOption("full-bleed"); await step(); mark("Stage layout -> full-bleed"); await hold(2.0); await shot("b3-fullbleed");
  await to("artboard-ab-about", 0.8, 60); await click(); mark("select About"); await hold(0.5);
  await to("present-unlink-look", 0.8); await click(); mark("Unlink About"); await hold(0.5);
  await to("palette-ember", 0.8); await click(); mark("About only -> Ember; linked in 2 boards"); await hold(2.0); await shot("b4-about-unlinked");
  await to("linked-count", 0.6); mark("pointer near linked in 2 boards"); await hold(1.0);
  await to("artboard-ab-landing", 0.8, 200); await click(); mark("select Home"); await hold(0.3);
  await to("approve-look", 0.7); await click(); await p.getByTestId("look-approved").waitFor(); mark("Approved"); await step(); await shot("b5-approved");
  await glide(1500, 600, 0.8); await hold(3.4); mark("end");
} catch (e) { errs.push("script " + String(e)); console.log("ERR", e); await p.screenshot({ path: path.join(EV, "error.png") }).catch(() => {}); process.exitCode = 1; }
finally {
  const post = await p.locator("body").innerText().catch(() => "");
  const linked = await p.getByTestId("linked-count").innerText().catch(() => null);
  fs.writeFileSync(path.join(EV, "markers.jsonl"), markers.map(m => JSON.stringify(m)).join("\n") + "\n");
  fs.writeFileSync(path.join(EV, "run.json"), JSON.stringify({ frames: n, fps: FPS, beats, errs, cjk_ui_post: /[\u3400-\u9fff]/.test(post), linked_end: linked }, null, 2));
  console.log("frames", n, "errs", JSON.stringify(errs)); await b.close();
}
