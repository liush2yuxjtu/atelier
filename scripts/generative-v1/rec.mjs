// generative-v1 GT recorder (adapted from scripts/v7/rec.mjs): deterministic 30 fps capture
// (per frame: __fxStep(1/30) in hero iframes + page screenshot). Story New-A: Home Mood SaaS -> Playful.
import { chromium } from "/tmp/atelier-gen/node_modules/@playwright/test/index.mjs";
import fs from "node:fs"; import path from "node:path";
const TAKE = process.env.TAKE || "generative-v1-take1"; const REH = process.env.REHEARSE === "1";
const RUN = path.join(process.env.HOME, "gen/runs", TAKE); const FR = path.join(RUN, "frames"), EV = path.join(RUN, "evidence");
fs.mkdirSync(FR, { recursive: true }); fs.mkdirSync(EV, { recursive: true });
const FPS = 30, W = 1920, H = 1080, URL = "http://127.0.0.1:43173";
const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, locale: "en-US" });
const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push("pageerror " + e.message));
let n = 0, mx = 1180, my = 760; const markers = []; const beats = {};
const mark = (label, extra = {}) => { const r = { elapsed_ms: Math.round(n * 1000 / FPS), frame: n, label, ...extra }; markers.push(r); console.log(r.elapsed_ms, label); };
let fx = [];
async function findFx() { fx = []; for (const f of p.frames()) { if (await f.evaluate(() => typeof window.__fxStep === "function").catch(() => false)) fx.push(f); } }
async function step() { await Promise.all(fx.map(f => f.evaluate(() => window.__fxStep(1 / 30)).catch(() => {}))); if (!REH) await p.screenshot({ path: path.join(FR, String(n).padStart(5, "0") + ".jpg"), type: "jpeg", quality: 92 }); n++; }
async function hold(s) { for (let i = 0, k = Math.round(s * FPS); i < k; i++) await step(); }
const ease = t => 0.5 - 0.5 * Math.cos(Math.PI * t);
async function glide(x, y, s) { const x0 = mx, y0 = my, k = Math.max(1, Math.round(s * FPS)); for (let i = 1; i <= k; i++) { const e = ease(i / k); mx = x0 + (x - x0) * e; my = y0 + (y - y0) * e; await p.mouse.move(mx, my); await step(); } }
const box = t => p.getByTestId(t).first().boundingBox();
async function click() { await p.mouse.down(); await step(); await p.mouse.up(); await step(); }
async function cursor() { await p.addStyleTag({ content: "*{cursor:none!important}" }); await p.evaluate(([x,y]) => { const c = document.createElement("div"); c.id = "__cur"; c.style.cssText = `position:fixed;z-index:2147483647;width:26px;height:26px;pointer-events:none;left:${x}px;top:${y}px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.55))`; c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path fill="#fafafa" stroke="#1a1612" stroke-width="1.15" d="M3.6 2.8v17.4l5.4-5.1 4.4 8.1 2.6-1.35-4.5-8.15H19.2z"/></svg>'; document.documentElement.appendChild(c); addEventListener("mousemove", e => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true); }, [mx, my]); }
async function heroText() { for (const f of p.frames()) { const t = await f.evaluate(() => { const h = document.querySelector("h1"); const a = document.querySelector("a.btn, .btn, button"); return h && document.body.innerText.includes("This week") ? { h1: h.innerText.replace(/\s+/g, " "), cta: (a?.innerText || "").trim() } : null; }).catch(() => null); if (t) return t; } return null; }
async function shot(name) { await p.screenshot({ path: path.join(EV, name + ".png") }); beats[name] = { frame: n, t: +(n / FPS).toFixed(3) }; }
const mood = () => p.getByTestId("artboard-ab-landing").getAttribute("data-tweak-mood");
try {
  await p.goto(URL, { waitUntil: "networkidle" });
  await p.evaluate(() => { indexedDB.deleteDatabase("atelier"); localStorage.clear(); }); await p.reload({ waitUntil: "networkidle" });
  await p.getByTestId("open-demo").click(); await p.getByTestId("artboard-ab-dashboard").waitFor(); await p.waitForTimeout(2500);
  await p.getByTestId("artboard-title-ab-landing").click(); await p.waitForTimeout(500);
  await p.getByTestId("tab-tweaks").click(); await p.waitForTimeout(400);
  for (let i = 0; i < 3; i++) { await p.getByTestId("zoom-in").click(); await p.waitForTimeout(350); }
  await p.waitForTimeout(1500); await findFx(); await cursor(); await p.mouse.move(mx, my); await p.waitForTimeout(300);
  const body = await p.locator("body").innerText();
  const pre = { ui_language: "en", phrases: ["Prepared for this design", "Mood", "Playful", "Tweaks", "Show social proof", "Apply across canvas"].filter(s => body.includes(s)), cjk: /[\u3400-\u9fff]/.test(body), zoom: await p.getByTestId("zoom-label").innerText(), mood: await mood(), hero: await heroText(), fx_frames: fx.length, url: p.url() };
  await p.screenshot({ path: path.join(EV, "ui-language-preflight.png") }); fs.writeFileSync(path.join(EV, "ui-language-preflight.json"), JSON.stringify(pre, null, 2));
  console.log("preflight", JSON.stringify(pre));
  if (pre.cjk || pre.phrases.length < 6 || pre.mood !== "saas" || !pre.hero?.h1.includes("Coffee")) throw new Error("preflight failed " + JSON.stringify(pre));
  const boxes = {}; for (const t of ["artboard-ab-landing", "tweak-panel", "tweaks-prepared-chip", "tweak-mood", "tweak-mood-saas", "tweak-mood-playful", "tweak-socialProof", "zoom-label"]) boxes[t] = await box(t);
  fs.writeFileSync(path.join(EV, "discovery.json"), JSON.stringify({ viewport: [W, H], boxes }, null, 2));
  // ---- GT ----
  mark("start: Home selected, Tweaks 'Prepared for this design', Mood=SaaS, hero 'Coffee that tastes like the trail.'");
  await hold(0.3); await shot("b0-before"); await hold(1.2);
  const pl = boxes["tweak-mood-playful"]; await glide(pl.x + pl.width / 2, pl.y + pl.height / 2 + 2, 0.9); mark("pointer on Mood > Playful");
  await hold(0.5);
  await click(); mark("click Playful", { mood_after_click: await mood() });
  let k = 0; while (k < 60) { const h = await heroText(); if (h?.h1.includes("Bags")) break; await step(); k++; }
  const hv = await heroText(); mark("hero rewritten visible", { hero: hv, frames_after_click: k, mood: await mood() });
  await hold(0.6); await shot("b3-playful-panel");
  await glide(1210, 780, 0.7); mark("pointer parked off artboard");
  await hold(1.4); await shot("b4-playful-home"); mark("payoff hold start");
  await hold(4.0); await shot("b5-payoff"); mark("end");
} catch (e) { errs.push("script " + String(e)); console.log("ERR", e); await p.screenshot({ path: path.join(EV, "error.png") }).catch(() => {}); process.exitCode = 1; }
finally {
  const post = await p.locator("body").innerText().catch(() => "");
  fs.writeFileSync(path.join(EV, "markers.jsonl"), markers.map(m => JSON.stringify(m)).join("\n") + "\n");
  fs.writeFileSync(path.join(EV, "run.json"), JSON.stringify({ take: TAKE, frames: n, fps: FPS, beats, errs, cjk_ui_post: /[\u3400-\u9fff]/.test(post), source_commit: "b140c08a7c5b631494ac7a2d701459646480ccd4" }, null, 2));
  console.log("frames", n, "errs", JSON.stringify(errs)); await b.close();
}
