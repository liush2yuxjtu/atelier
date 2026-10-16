// Tweaks v7 "New A" GT recorder: deterministic 30 fps capture (per frame __fxStep(1/30) + screenshot).
// Story: one palette click flips Home/Pricing/About; Glow up brightens all heroes; Compare A|B; Save look.
import { chromium } from "/tmp/atelier/node_modules/@playwright/test/index.mjs";
import fs from "node:fs"; import path from "node:path";
const TAKE = process.env.TAKE || "newa-v7-take1"; const REH = process.env.REHEARSE === "1";
const RUN = path.join(process.env.HOME, "v7/runs", TAKE); const FR = path.join(RUN, "frames"), EV = path.join(RUN, "evidence");
fs.mkdirSync(FR, { recursive: true }); fs.mkdirSync(EV, { recursive: true });
const FPS = 30, W = 1920, H = 1080;
const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, locale: "en-US" });
const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push("pageerror " + e.message));
let n = 0, mx = 1500, my = 520; const markers = []; const beats = {};
const mark = (label, extra = {}) => { const r = { elapsed_ms: Math.round(n * 1000 / FPS), frame: n, label, ...extra }; markers.push(r); console.log(r.elapsed_ms, label); };
let fx = [];
async function findFx() { fx = []; for (const f of p.frames()) { if (await f.evaluate(() => typeof window.__fxStep === "function" && !!document.querySelector("canvas.fx")).catch(() => false)) fx.push(f); } }
async function step() { await Promise.all(fx.map(f => f.evaluate(() => window.__fxStep(1 / 30)).catch(() => {}))); if (!REH) await p.screenshot({ path: path.join(FR, String(n).padStart(5, "0") + ".jpg"), type: "jpeg", quality: 92 }); n++; }
async function hold(s) { for (let i = 0, k = Math.round(s * FPS); i < k; i++) await step(); }
const ease = t => 0.5 - 0.5 * Math.cos(Math.PI * t);
async function glide(x, y, s) { const x0 = mx, y0 = my, k = Math.max(1, Math.round(s * FPS)); for (let i = 1; i <= k; i++) { const e = ease(i / k); mx = x0 + (x - x0) * e; my = y0 + (y - y0) * e; await p.mouse.move(mx, my); await step(); } }
async function box(t) { return p.getByTestId(t).first().boundingBox(); }
async function to(t, s) { const bx = await box(t); await glide(bx.x + bx.width / 2, bx.y + bx.height / 2, s); }
async function click() { await p.mouse.down(); await step(); await p.mouse.up(); await step(); }
async function cursor() { await p.addStyleTag({ content: "*{cursor:none!important}" }); await p.evaluate(([x,y]) => { const c = document.createElement("div"); c.id = "__cur"; c.style.cssText = `position:fixed;z-index:2147483647;width:26px;height:26px;pointer-events:none;left:${x}px;top:${y}px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.55))`; c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path fill="#fafafa" stroke="#1a1612" stroke-width="1.15" d="M3.6 2.8v17.4l5.4-5.1 4.4 8.1 2.6-1.35-4.5-8.15H19.2z"/></svg>'; document.documentElement.appendChild(c); addEventListener("mousemove", e => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true); }, [mx, my]); }
const look = () => p.evaluate(() => { const s = window.__atelierStore?.getState?.(); return null; });
try {
  await p.goto("http://127.0.0.1:43174", { waitUntil: "networkidle" });
  await p.evaluate(() => { indexedDB.deleteDatabase("atelier"); localStorage.removeItem("atelier:project-index"); });
  await p.reload({ waitUntil: "networkidle" });
  await p.getByTestId("open-demo").click({ force: true }); await p.getByTestId("artboard-ab-about").waitFor();
  await p.waitForTimeout(1500); await p.getByTestId("artboard-title-ab-landing").click(); await p.waitForTimeout(300);
  await p.getByTestId("mode-present").click({ force: true }); await p.getByTestId("present-dock").waitFor(); await p.waitForTimeout(2500);
  await findFx(); await cursor(); await p.mouse.move(mx, my);
  const body = await p.locator("body").innerText();
  const pre = { ui_language: "en", phrases: ["Compare", "Save look", "Glow", "Aurora", "Exit"].filter(s => body.includes(s)), cjk: /[\u3400-\u9fff]/.test(body), fx_frames: fx.length, ember_active: await p.getByTestId("palette-ember").getAttribute("data-active") };
  await p.screenshot({ path: path.join(EV, "ui-language-preflight.png") }); fs.writeFileSync(path.join(EV, "ui-language-preflight.json"), JSON.stringify(pre, null, 2));
  if (pre.cjk || pre.phrases.length < 4 || fx.length < 3 || pre.ember_active !== "true") throw new Error("preflight failed " + JSON.stringify(pre));
  const boxes = {}; for (const t of ["artboard-ab-landing", "artboard-ab-pricing", "artboard-ab-about", "present-dock", "palette-chips", "palette-aurora", "tweak-fxGlow", "compare-look", "save-look", "linked-count"]) boxes[t] = await box(t);
  fs.writeFileSync(path.join(EV, "discovery.json"), JSON.stringify({ viewport: [W, H], boxes }, null, 2));
  // ---- GT ----
  mark("start: Home/Pricing/About all Ember, heroes running"); await hold(1.2);
  const ch = await box("palette-chips"); await glide(ch.x + ch.width * 0.3, ch.y + ch.height / 2, 1.0); mark("pointer on Palette");
  await hold(0.6); await shot("b0-ember"); mark("gif_window_start");
  await hold(0.8);
  await to("palette-aurora", 0.4); mark("pointer on Aurora"); await click(); mark("click Aurora: all 3 boards flip", { linked: await p.getByTestId("linked-count").innerText().catch(() => null) });
  await hold(2.0); await shot("b1-aurora");
  const gb = await box("tweak-fxGlow"); const th = await p.getByTestId("tweak-fxGlow").locator('[role="slider"]').boundingBox();
  await glide(th.x + th.width / 2, th.y + th.height / 2, 0.45); mark("pointer on Glow");
  await p.mouse.down(); await step(); await glide(gb.x + (gb.width - 50) * 0.92, my, 0.6); await p.mouse.up(); await step(); mark("Glow raised: 3 heroes brighten");
  await hold(0.3); await shot("b2-glow");
  await to("compare-look", 0.45); await click(); mark("Compare on: A (Before, Ember) | B (now)"); await p.getByTestId("compare-split").first().waitFor();
  await hold(3.4); await shot("b3-compare"); mark("gif_window_end");
  await to("save-look", 0.6); await click(); mark("Save look"); await hold(0.4); await shot("b4-saved");
  await glide(1700, 560, 0.8); await hold(3.5); mark("end");
} catch (e) { errs.push("script " + String(e)); console.log("ERR", e); await p.screenshot({ path: path.join(EV, "error.png") }).catch(() => {}); process.exitCode = 1; }
finally {
  const post = await p.locator("body").innerText().catch(() => "");
  fs.writeFileSync(path.join(EV, "markers.jsonl"), markers.map(m => JSON.stringify(m)).join("\n") + "\n");
  fs.writeFileSync(path.join(EV, "run.json"), JSON.stringify({ frames: n, fps: FPS, beats, errs, cjk_ui_post: /[\u3400-\u9fff]/.test(post) }, null, 2));
  console.log("frames", n, "errs", JSON.stringify(errs)); await b.close();
}
async function shot(name) { await p.screenshot({ path: path.join(EV, name + ".png") }); beats[name] = { frame: n, t: n / FPS }; }
