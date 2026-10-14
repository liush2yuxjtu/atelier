/**
 * Story C (tweaks live client demo) GT.
 * record-production-feature SKILL.md §3 user-story + §5 讲解层.
 * TAKE_ID e.g. tweaks-v4-take1
 * PRESENT=1 uses Present dock + linked theme (v4 research beats).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUN_ID = process.env.TAKE_ID || "tweaks-v4-take1";
const RUN = path.join(ROOT, "docs/media/runs", RUN_ID);
const RAW = path.join(RUN, "raw");
const EVIDENCE = path.join(RUN, "evidence");
const BASE = process.env.ATELIER_URL || "http://127.0.0.1:43173";
const V3 = process.env.PRESENT === "1" || process.env.V3 === "1";
const W = 1280;
const H = 800;

fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(EVIDENCE, { recursive: true });

const markers = [];
let t0 = 0;
function mark(name, extra = {}) {
  const rec = { name, elapsed_ms: Date.now() - t0, ...extra };
  markers.push(rec);
  console.log(`marker ${rec.elapsed_ms}ms  ${name}`);
  return rec;
}

async function moveTo(page, locator, steps = 16) {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`no box for ${locator}`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
}

async function installCursor(page) {
  await page.addStyleTag({ content: `html, body, * { cursor: none !important; }` });
  await page.evaluate(() => {
    if (document.getElementById("__demo_cursor")) return;
    const c = document.createElement("div");
    c.id = "__demo_cursor";
    c.setAttribute("aria-hidden", "true");
    c.style.cssText =
      "position:fixed;z-index:2147483647;width:22px;height:22px;pointer-events:none;left:40px;top:40px;transform:translate(-2px,-1px);filter:drop-shadow(0 1px 2px rgba(0,0,0,.45));";
    c.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24"><path fill="#fafafa" stroke="#1a1612" stroke-width="1.15" d="M3.6 2.8v17.4l5.4-5.1 4.4 8.1 2.6-1.35-4.5-8.15H19.2z"/></svg>';
    document.documentElement.appendChild(c);
    window.addEventListener(
      "mousemove",
      (e) => {
        c.style.left = `${e.clientX}px`;
        c.style.top = `${e.clientY}px`;
      },
      true,
    );
  });
}

async function installStoryLayer(page) {
  await page.evaluate(() => {
    document.getElementById("__story_layer")?.remove();
    const layer = document.createElement("div");
    layer.id = "__story_layer";
    layer.style.cssText = "pointer-events:none;";
    layer.innerHTML = `
      <div id="__story_card" style="display:none;position:fixed;inset:0;z-index:2147483646;background:#120f18;color:#f4efe6;font-family:Georgia,ui-serif,serif;padding:72px 88px;pointer-events:none;">
        <div id="__story_kicker" style="font-family:ui-sans-serif,system-ui;letter-spacing:.18em;font-size:12px;color:#e8c39a;text-transform:uppercase;margin-bottom:18px;"></div>
        <div id="__story_title" style="font-size:40px;line-height:1.18;letter-spacing:-.03em;max-width:22ch;white-space:pre-line;"></div>
        <div id="__story_sub" style="font-family:ui-sans-serif,system-ui;margin-top:22px;font-size:18px;color:#c4b8a8;max-width:38ch;"></div>
      </div>
      <div id="__story_bar" style="display:none;position:fixed;left:0;right:0;top:48px;z-index:2147483646;height:44px;padding:0 22px;align-items:center;background:rgba(18,15,24,.92);color:#f4efe6;font:600 15px/1.2 ui-sans-serif,system-ui;letter-spacing:.015em;border-bottom:1px solid rgba(255,255,255,.1);pointer-events:none;"></div>
    `;
    document.documentElement.appendChild(layer);
    window.__story = {
      card(kicker, title, sub) {
        document.getElementById("__story_kicker").textContent = kicker;
        document.getElementById("__story_title").textContent = title;
        document.getElementById("__story_sub").textContent = sub;
        document.getElementById("__story_card").style.display = "block";
        document.getElementById("__story_bar").style.display = "none";
      },
      bar(text) {
        document.getElementById("__story_card").style.display = "none";
        const bar = document.getElementById("__story_bar");
        bar.textContent = text;
        bar.style.display = "flex";
      },
      hide() {
        document.getElementById("__story_card").style.display = "none";
        document.getElementById("__story_bar").style.display = "none";
      },
    };
  });
}

async function storyCard(page, kicker, title, sub) {
  await page.evaluate(
    ({ kicker, title, sub }) => window.__story.card(kicker, title, sub),
    { kicker, title, sub },
  );
}
async function storyBar(page, text) {
  await page.evaluate((text) => window.__story.bar(text), text);
}
async function storyHide(page) {
  await page.evaluate(() => window.__story.hide());
}

async function assertEnglish(page) {
  const phrases = ["Export", "Preview", "Tweaks", "Artboard"];
  const body = await page.locator("body").innerText();
  const folded = body.toLowerCase();
  const missing = phrases.filter((p) => !folded.includes(p.toLowerCase()));
  const cjk = /[\u3400-\u9fff]/.test(body);
  const shot = path.join(EVIDENCE, "preflight-en.png");
  await page.screenshot({ path: shot, fullPage: false });
  if (missing.length || cjk) {
    throw new Error(`English preflight failed missing=${missing.join(",")} cjk=${cjk}`);
  }
  return { phrases, shot, cjk: false, ui_language: "en" };
}

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  recordVideo: { dir: RAW, size: { width: W, height: H } },
  locale: "en-US",
});
const page = await context.newPage();
t0 = Date.now();

try {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    indexedDB.deleteDatabase("atelier");
    localStorage.removeItem("atelier:project-index");
  });
  await page.reload({ waitUntil: "networkidle" });
  mark("landing");
  await installStoryLayer(page);
  await installCursor(page);

  await storyCard(
    page,
    "How the tools split",
    "Chat = structure\nTweaks = feel\nEdit = exact",
    "Lena is live with the buyer. The site is already on the canvas.",
  );
  mark("thesis_card");
  await page.screenshot({ path: path.join(EVIDENCE, "title-thesis.png") });
  await page.waitForTimeout(2200);
  mark("thesis_card_end");

  await storyCard(
    page,
    "Lena Park · Northbound pitch",
    "“Doesn’t feel right.”",
    "Twenty clicks, not twenty chat messages.",
  );
  mark("open_card");
  await page.screenshot({ path: path.join(EVIDENCE, "title-open.png") });
  await page.waitForTimeout(2200);
  await storyHide(page);
  mark("open_card_end");

  await page.getByTestId("open-demo").click({ force: true });
  await page.getByTestId("studio-app").waitFor({ state: "visible" });
  await page.getByTestId("canvas-view").waitFor({ state: "visible" });
  await page.getByTestId("artboard-ab-landing").waitFor({ state: "visible" });
  await page.getByTestId("artboard-ab-pricing").waitFor({ state: "visible" });
  await page.getByTestId("artboard-ab-about").waitFor({ state: "visible" });
  await page.waitForTimeout(1400);
  await installStoryLayer(page);
  await installCursor(page);
  const preflight = await assertEnglish(page);
  fs.writeFileSync(path.join(EVIDENCE, "preflight.json"), JSON.stringify(preflight, null, 2));
  mark("studio_ready");

  await page.getByTestId("artboard-title-ab-landing").click();
  await page.waitForTimeout(300);

  if (V3) {
    await storyBar(page, "Finished site. Home, Pricing, About — one canvas.");
    const present = page.getByTestId("mode-present");
    await moveTo(page, present, 12);
    await present.click({ force: true });
    mark("present_on");
    await page.getByTestId("present-dock").waitFor({ state: "visible", timeout: 8_000 });
    await expectVisible(page, "artboard-ab-landing");
    await expectVisible(page, "artboard-ab-pricing");
    await expectVisible(page, "artboard-ab-about");
    await expectVisible(page, "linked-count");
    await page.waitForTimeout(500);
    mark("before_state");
    await page.screenshot({ path: path.join(EVIDENCE, "before-state.png") });

    await storyBar(page, "Make it feel more premium.");
    const knobs = page.getByTestId("generate-knobs");
    await moveTo(page, knobs, 12);
    await knobs.click({ force: true });
    mark("generate_knobs");
    await page.waitForTimeout(500);

    const moss = page.getByTestId("palette-moss");
    await moveTo(page, moss, 14);
    await moss.click({ force: true });
    mark("palette_preview");
    await page.waitForTimeout(700);
    const undo = page.getByTestId("tweak-undo");
    await moveTo(page, undo, 10);
    await undo.click({ force: true });
    mark("palette_undo");
    await page.getByTestId("palette-ember").waitFor({ state: "visible" });
    await page.waitForTimeout(400);
    await storyHide(page);

    mark("gif_window_start");
    await page.waitForTimeout(600);
    mark("beat_context_end");

    await moveTo(page, moss, 12);
    await moss.click({ force: true });
    mark("palette_moss");
    await page.waitForTimeout(550);

    const night = page.getByTestId("palette-night");
    await moveTo(page, night, 12);
    await night.click({ force: true });
    mark("palette_night");
    await page.waitForTimeout(550);

    const signal = page.getByTestId("palette-signal");
    await moveTo(page, signal, 12);
    await signal.click({ force: true });
    mark("palette_signal");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(EVIDENCE, "proof-linked.png") });

    const compare = page.getByTestId("compare-look");
    await moveTo(page, compare, 12);
    await compare.click({ force: true });
    mark("compare_on");
    await page.getByTestId("compare-split").first().waitFor({ state: "visible", timeout: 5_000 });
    await page.screenshot({ path: path.join(EVIDENCE, "compare.png") });
    await page.waitForTimeout(900);

    const save = page.getByTestId("save-look");
    await moveTo(page, save, 10);
    await save.click({ force: true });
    mark("save_look");
    await page.waitForTimeout(280);

    const approve = page.getByTestId("approve-look");
    await moveTo(page, approve, 10);
    await approve.click({ force: true });
    mark("approved");
    await page.getByTestId("look-approved").waitFor({ state: "visible", timeout: 5_000 });
    await page.screenshot({ path: path.join(EVIDENCE, "proof-done.png") });
    await page.waitForTimeout(3200);
    mark("proof_hold_end");
    mark("gif_window_end");

    await storyBar(page, "Signed off. Apply it across the site.");
    await page.waitForTimeout(4200);
    mark("after_hold_end");
  } else {
    await storyBar(page, "Doesn’t feel right. Tweak the color.");
    await page.getByTestId("tab-tweaks").click();
    await page.getByTestId("tweak-panel").waitFor({ state: "visible" });
    const accent = page.getByTestId("tweak-accent").first();
    await moveTo(page, accent, 14);
    mark("accent_focus");
    await accent.fill("#2f6fed");
    mark("accent_set");
    await page.waitForTimeout(500);
    await storyBar(page, "They nodded. No regenerate.");
    await page.screenshot({ path: path.join(EVIDENCE, "proof-done.png") });
    await page.waitForTimeout(3600);
    mark("proof_hold_end");
  }

  await page.waitForTimeout(2800);
  mark("walkthrough_hold_end");

  const postText = await page.locator("body").innerText();
  fs.writeFileSync(
    path.join(EVIDENCE, "postcheck.json"),
    JSON.stringify(
      {
        ui_language: "en",
        v3: V3,
        cjk_ui: /[\u3400-\u9fff]/.test(postText),
        visible_tweaks: /linked|approved|palette|moss|night|signal/i.test(postText),
        presenting: await page.getByTestId("present-dock").count(),
        chat_in_present: await page.getByTestId("chat-panel").count(),
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(RUN, "markers.json"),
    JSON.stringify({ t0, markers, story: "C-tweaks-linked", v3: V3 }, null, 2),
  );
} catch (err) {
  mark("error", { message: String(err) });
  fs.writeFileSync(
    path.join(RUN, "markers.json"),
    JSON.stringify({ t0, markers, error: String(err) }, null, 2),
  );
  await page.screenshot({ path: path.join(EVIDENCE, "error.png") }).catch(() => {});
  throw err;
} finally {
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();
  if (video) {
    const stored = await video.path();
    const dest = path.join(RAW, "full.webm");
    if (stored && fs.existsSync(stored)) {
      fs.copyFileSync(stored, dest);
      console.log("raw", dest, fs.statSync(dest).size);
    }
  }
}

async function expectVisible(page, testId) {
  await page.getByTestId(testId).waitFor({ state: "visible", timeout: 8_000 });
}
