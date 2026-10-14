/**
 * Story C user-story GT: persona / problem / before-after + title cards.
 * record-production-feature SKILL.md §3 (user-story) + §5 (讲解层 on).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUN_ID = process.env.TAKE_ID || "C-take1";
const RUN = path.join(ROOT, "docs/media/runs", RUN_ID);
const RAW = path.join(RUN, "raw");
const EVIDENCE = path.join(RUN, "evidence");
const BASE = process.env.ATELIER_URL || "http://127.0.0.1:43173";
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

async function panCanvas(page, dx, dy, steps = 18) {
  const canvas = page.getByTestId("canvas-view");
  const box = await canvas.boundingBox();
  const x = box.x + box.width * 0.55;
  const y = box.y + box.height * 0.42;
  await page.mouse.move(x, y, { steps: 8 });
  await page.keyboard.down("Space");
  await page.waitForTimeout(80);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps });
  await page.mouse.up();
  await page.keyboard.up("Space");
  await page.waitForTimeout(120);
}

async function panUntilOnCanvas(page, locator, { minX = 580, maxX = 1050, tries = 10 } = {}) {
  for (let i = 0; i < tries; i++) {
    const box = await locator.boundingBox();
    if (box && box.width > 8 && box.x >= minX && box.x <= maxX && box.y > 60 && box.y < 700) {
      return box;
    }
    const dx = box ? Math.max(-280, Math.min(280, 780 - box.x)) : -220;
    await panCanvas(page, dx, box && box.y > 640 ? -80 : 0);
  }
  return locator.boundingBox();
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
    window.addEventListener("mousemove", (e) => {
      c.style.left = `${e.clientX}px`;
      c.style.top = `${e.clientY}px`;
    }, true);
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
        <div id="__story_title" style="font-size:52px;line-height:1.05;letter-spacing:-.03em;max-width:16ch;"></div>
        <div id="__story_sub" style="font-family:ui-sans-serif,system-ui;margin-top:22px;font-size:18px;color:#c4b8a8;max-width:36ch;"></div>
      </div>
      <div id="__story_bar" style="display:none;position:fixed;left:0;right:0;top:48px;z-index:2147483646;height:44px;padding:0 22px;align-items:center;background:rgba(18,15,24,.92);color:#f4efe6;font:600 15px/1.2 ui-sans-serif,system-ui;letter-spacing:.015em;border-bottom:1px solid rgba(255,255,255,.1);pointer-events:none;"></div>
    `;
    document.documentElement.appendChild(layer);
    window.__story = {
      card(kicker, title, sub) {
        const card = document.getElementById("__story_card");
        const bar = document.getElementById("__story_bar");
        document.getElementById("__story_kicker").textContent = kicker;
        document.getElementById("__story_title").textContent = title;
        document.getElementById("__story_sub").textContent = sub;
        card.style.display = "block";
        bar.style.display = "none";
      },
      bar(text) {
        const card = document.getElementById("__story_card");
        const bar = document.getElementById("__story_bar");
        card.style.display = "none";
        bar.textContent = text;
        bar.style.display = "flex";
        bar.style.pointerEvents = "none";
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
  const phrases = ["Chat", "Components", "Export", "Preview", "Send", "Artboard"];
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
  mark("landing");
  await installStoryLayer(page);
  await installCursor(page);

  await storyCard(
    page,
    "Maya · Northbound roast club",
    "Saturday cupping.",
    "The roast card is still in Figma.",
  );
  mark("open_card");
  await page.screenshot({ path: path.join(EVIDENCE, "title-open.png") });
  await page.waitForTimeout(2800);
  await storyHide(page);
  mark("open_card_end");

  await page.getByTestId("open-demo").click({ force: true });
  await page.getByTestId("studio-app").waitFor({ state: "visible" });
  await page.getByTestId("canvas-view").waitFor({ state: "visible" });
  await page.getByTestId("artboard-ab-dc-grid").waitFor({ state: "visible" });
  await page.waitForTimeout(1800);
  await installStoryLayer(page);
  await installCursor(page);
  const preflight = await assertEnglish(page);
  fs.writeFileSync(path.join(EVIDENCE, "preflight.json"), JSON.stringify(preflight, null, 2));
  mark("studio_ready");

  const canvas = page.getByTestId("canvas-view");
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.42, { steps: 12 });
  await panUntilOnCanvas(page, page.getByTestId("artboard-ab-dc-grid"), { minX: 620, maxX: 980 });
  mark("before_state");
  await storyBar(page, "Saturday cupping. The roast card is still in Figma.");
  await page.screenshot({ path: path.join(EVIDENCE, "before-state.png") });
  await page.waitForTimeout(4200);

  const chat = page.getByTestId("chat-input");
  await moveTo(page, chat);
  await chat.click();
  await chat.pressSequentially("Cupping poster", { delay: 38 });
  mark("prompt_typed");
  await page.waitForTimeout(800);

  mark("gif_window_start");
  await page.waitForTimeout(1100);
  mark("beat_context_end");

  await storyBar(page, "She asks Atelier. The board lands while it writes.");
  const send = page.getByTestId("chat-send");
  await moveTo(page, send, 12);
  const beforeBoards = await page.locator("[data-artboard=true]").count();
  await send.click({ force: true });
  mark("send_clicked");
  const posted = page.locator("[data-artboard=true]").nth(beforeBoards);
  await posted.waitFor({ state: "attached", timeout: 20_000 });
  await page.getByText(/Placed a new artboard called/i).waitFor({ timeout: 20_000 });
  await page.waitForTimeout(160);
  mark("artboard_streamed");
  await panUntilOnCanvas(page, posted, { minX: 640, maxX: 1080, tries: 8 });
  mark("streamed_board_in_view");
  await page.waitForTimeout(180);

  await storyBar(page, "Change the component. No regenerate.");
  await panUntilOnCanvas(page, page.getByTestId("artboard-ab-dc-grid"), {
    minX: 600,
    maxX: 1000,
    tries: 6,
  });
  const grid = page.getByTestId("artboard-select-ab-dc-grid");
  await moveTo(page, grid, 10);
  await grid.click({ force: true });
  mark("dc_selected");
  await page.getByTestId("tab-tweaks").click();
  await page.getByTestId("dc-props-hint").waitFor({ state: "visible" });
  const headline = page.getByTestId("tweak-headline");
  await moveTo(page, headline, 8);
  await headline.click({ clickCount: 3, force: true });
  await headline.fill("");
  await headline.pressSequentially("This week's roast", { delay: 12 });
  mark("headline_set");
  await page.waitForTimeout(120);

  await storyHide(page);
  const exp = page.getByTestId("open-export");
  await moveTo(page, exp, 10);
  await exp.click({ force: true });
  await page.getByTestId("export-dialog").waitFor({ state: "visible" });
  mark("export_open");
  const htmlBtn = page.getByTestId("export-html");
  await moveTo(page, htmlBtn, 8);
  await htmlBtn.click({ force: true });
  await page.getByText("Done.").waitFor({ state: "visible", timeout: 10_000 });
  mark("export_done");
  await storyBar(page, "This week's card. Shipped. No Figma.");
  await page.screenshot({ path: path.join(EVIDENCE, "proof-done.png") });
  await page.waitForTimeout(3600);
  mark("proof_hold_end");
  mark("gif_window_end");
  await page.waitForTimeout(12000);
  mark("walkthrough_hold_end");

  const postText = await page.locator("body").innerText();
  fs.writeFileSync(
    path.join(EVIDENCE, "postcheck.json"),
    JSON.stringify(
      {
        ui_language: "en",
        visible: ["Chat", "Export", "Done."].every((p) => postText.includes(p)),
        captions: ["Saturday cupping", "Shipped. No Figma."],
        cjk_ui: /[\u3400-\u9fff]/.test(postText),
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(path.join(RUN, "markers.json"), JSON.stringify({ t0, markers, story: "C" }, null, 2));
} catch (err) {
  mark("error", { message: String(err) });
  fs.writeFileSync(path.join(RUN, "markers.json"), JSON.stringify({ t0, markers, error: String(err) }, null, 2));
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
