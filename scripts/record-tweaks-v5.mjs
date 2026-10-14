// Tweaks v5 GT: one Look change in the Present dock recolors Home, Pricing, About together.
// record-production-feature: pure-screen, English UI, runtime markers aligned to video zero.
import { chromium } from "/tmp/atelier/node_modules/@playwright/test/index.mjs";
import fs from "node:fs"; import path from "node:path";
const TAKE = process.env.TAKE_ID || "tweaks-v5-take1";
const RUN = path.join(process.env.HOME, "tw5x/runs", TAKE);
const RAW = path.join(RUN, "raw"), EV = path.join(RUN, "evidence");
fs.mkdirSync(RAW, { recursive: true }); fs.mkdirSync(EV, { recursive: true });
const markers = []; let t0 = 0;
const mark = (label, extra = {}) => { const r = { elapsed_ms: Date.now() - t0, label, ...extra }; markers.push(r); console.log(r.elapsed_ms, label); };
async function moveTo(page, loc, steps = 18) { const b = await loc.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps }); }
async function cursor(page) {
  await page.addStyleTag({ content: `html,body,*{cursor:none!important}` });
  await page.evaluate(() => { if (document.getElementById("__c")) return; const c = document.createElement("div"); c.id = "__c";
    c.style.cssText = "position:fixed;z-index:2147483647;width:22px;height:22px;pointer-events:none;left:640px;top:440px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))";
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path fill="#fafafa" stroke="#1a1612" stroke-width="1.15" d="M3.6 2.8v17.4l5.4-5.1 4.4 8.1 2.6-1.35-4.5-8.15H19.2z"/></svg>';
    document.documentElement.appendChild(c); addEventListener("mousemove", e => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true); });
}
const boardColors = (page) => page.evaluate(() => Object.fromEntries(["landing","pricing","about"].map(id => {
  const el = document.querySelector(`[data-testid="artboard-ab-${id}"]`); const f = el?.querySelector("iframe");
  let accent = null; try { const d = f?.contentDocument; accent = d ? getComputedStyle(d.documentElement).getPropertyValue("--accent").trim() || null : null; } catch {}
  return [id, accent]; })));
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, locale: "en-US", recordVideo: { dir: RAW, size: { width: 1280, height: 800 } } });
const page = await ctx.newPage(); t0 = Date.now();
try {
  await page.goto("http://127.0.0.1:43173", { waitUntil: "networkidle" });
  await page.evaluate(() => { indexedDB.deleteDatabase("atelier"); localStorage.removeItem("atelier:project-index"); });
  await page.reload({ waitUntil: "networkidle" }); await cursor(page);
  mark("Landing");
  await page.waitForTimeout(1500);
  const open = page.getByTestId("open-demo"); await moveTo(page, open, 20); await page.waitForTimeout(150); await open.click({ force: true });
  for (const id of ["landing","pricing","about"]) await page.getByTestId("artboard-ab-" + id).waitFor();
  await page.waitForTimeout(1200); await cursor(page);
  const body = await page.locator("body").innerText();
  const pre = { ui_language: "en", phrases: ["Preview","Export","Tweaks"].filter(p => body.includes(p)), cjk: /[\u3400-\u9fff]/.test(body) };
  await page.screenshot({ path: path.join(EV, "ui-language-preflight.png") });
  fs.writeFileSync(path.join(EV, "ui-language-preflight.json"), JSON.stringify(pre, null, 2));
  if (pre.cjk || pre.phrases.length < 2) throw new Error("English preflight failed " + JSON.stringify(pre));
  mark("Northbound site: Home, Pricing, About");
  await page.waitForTimeout(1800);
  const title = page.getByTestId("artboard-title-ab-landing"); await moveTo(page, title, 18); await title.click();
  const present = page.getByTestId("mode-present"); await moveTo(page, present, 20); await page.waitForTimeout(150); await present.click({ force: true });
  await page.getByTestId("present-dock").waitFor(); mark("Present");
  await page.mouse.move(640, 450, { steps: 22 });
  await page.waitForTimeout(1200);
  const before = await boardColors(page);
  await page.screenshot({ path: path.join(EV, "before-ember.png") });
  mark("gif_window_start: Ember on all pages", { colors: before });
  await page.waitForTimeout(900);
  const signal = page.getByTestId("palette-signal"); await moveTo(page, signal, 16); await page.waitForTimeout(120);
  mark("pointer on Signal");
  await signal.click(); mark("Look: Signal (one change)");
  await page.waitForTimeout(400);
  const after = await boardColors(page);
  await page.screenshot({ path: path.join(EV, "after-signal.png") });
  mark("All three pages Signal; linked in 3 boards", { colors: after, linked: await page.getByTestId("linked-count").innerText() });
  await page.waitForTimeout(1900);
  const approve = page.getByTestId("approve-look"); await moveTo(page, approve, 20); await page.waitForTimeout(120);
  await approve.click(); await page.getByTestId("look-approved").waitFor(); mark("Approved");
  await page.screenshot({ path: path.join(EV, "approved.png") });
  await page.waitForTimeout(4200); mark("gif_window_end");
  const exit = page.getByTestId("exit-present"); await moveTo(page, exit, 20); await exit.click(); mark("Exit present: studio shows Signal on all pages");
  await page.waitForTimeout(3500); mark("End");
  const post = await page.locator("body").innerText();
  fs.writeFileSync(path.join(EV, "postcheck.json"), JSON.stringify({ cjk_ui: /[\u3400-\u9fff]/.test(post), before, after }, null, 2));
} catch (e) { mark("error", { message: String(e) }); await page.screenshot({ path: path.join(EV, "error.png") }).catch(() => {}); process.exitCode = 1; }
finally {
  fs.writeFileSync(path.join(EV, "markers.jsonl"), markers.map(m => JSON.stringify(m)).join("\n") + "\n");
  const v = page.video(); await page.close(); await ctx.close(); await browser.close();
  const p = await v.path(); fs.renameSync(p, path.join(RAW, "gt.webm")); console.log("raw", path.join(RAW, "gt.webm"));
}
