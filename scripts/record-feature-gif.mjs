/**
 * Record Atelier core-flow GT for the email 8s GIF.
 * Contract: my-release-skills skills/record-production-feature/SKILL.md
 * Capture 1280×800, English UI, visible pointer, elapsed_ms markers, immutable raw.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUN_ID = process.env.TAKE_ID || "B-take1";
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
  const y = box.y + box.height * 0.48;
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
    if (box && box.width > 8 && box.x >= minX && box.x <= maxX && box.y > 60 && box.y < 720) {
      return box;
    }
    const dx = box ? Math.max(-280, Math.min(280, 780 - box.x)) : -220;
    await panCanvas(page, dx, box && box.y > 640 ? -80 : 0);
  }
  return locator.boundingBox();
}

async function installCursor(page) {
  await page.addStyleTag({
    content: `html, body, * { cursor: none !important; }`,
  });
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
    const move = (e) => {
      c.style.left = `${e.clientX}px`;
      c.style.top = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", move, true);
    window.addEventListener("mousedown", () => {
      c.style.transform = "translate(-2px,-1px) scale(0.86)";
    }, true);
    window.addEventListener("mouseup", () => {
      c.style.transform = "translate(-2px,-1px) scale(1)";
    }, true);
  });
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
  await page.getByTestId("open-demo").click();
  await page.getByTestId("studio-app").waitFor({ state: "visible" });
  await page.getByTestId("canvas-view").waitFor({ state: "visible" });
  await page.getByTestId("artboard-ab-dc-grid").waitFor({ state: "visible" });
  await page.waitForTimeout(1600);
  await installCursor(page);
  const preflight = await assertEnglish(page);
  fs.writeFileSync(path.join(EVIDENCE, "preflight.json"), JSON.stringify(preflight, null, 2));
  mark("studio_ready");

  const canvas = page.getByTestId("canvas-view");
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.42, { steps: 12 });
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, 80);
  await page.waitForTimeout(160);
  await page.keyboard.up("Control");
  const gridChrome = page.getByTestId("artboard-ab-dc-grid");
  await panUntilOnCanvas(page, gridChrome, { minX: 620, maxX: 980 });
  mark("canvas_framed");

  const chat = page.getByTestId("chat-input");
  await moveTo(page, chat);
  await chat.click();
  await chat.pressSequentially("Cupping poster", { delay: 28 });
  mark("prompt_typed");
  await page.waitForTimeout(400);

  mark("gif_window_start");
  await page.waitForTimeout(900);
  mark("beat_context_end");

  const send = page.getByTestId("chat-send");
  await moveTo(page, send, 20);
  const beforeBoards = await page.locator("[data-artboard=true]").count();
  await send.click();
  mark("send_clicked");
  const posted = page.locator("[data-artboard=true]").nth(beforeBoards);
  await posted.waitFor({ state: "attached", timeout: 20_000 });
  await page.getByText(/Placed a new artboard called/i).waitFor({ timeout: 20_000 });
  await page.waitForTimeout(600);
  mark("artboard_streamed");
  await panUntilOnCanvas(page, posted, { minX: 640, maxX: 1080, tries: 14 });
  mark("streamed_board_in_view");
  await page.waitForTimeout(900);

  await panUntilOnCanvas(page, page.getByTestId("artboard-ab-dc-grid"), { minX: 600, maxX: 1000, tries: 10 });
  const grid = page.getByTestId("artboard-select-ab-dc-grid");
  await moveTo(page, grid, 18);
  await grid.click();
  mark("dc_selected");
  await page.getByTestId("tab-tweaks").click();
  await page.getByTestId("dc-props-hint").waitFor({ state: "visible" });
  const headline = page.getByTestId("tweak-headline");
  await moveTo(page, headline, 14);
  await headline.click({ clickCount: 3 });
  await headline.fill("");
  await headline.pressSequentially("This week's roast", { delay: 22 });
  mark("headline_set");
  await page.waitForTimeout(450);

  const exp = page.getByTestId("open-export");
  await moveTo(page, exp, 16);
  await exp.click();
  await page.getByTestId("export-dialog").waitFor({ state: "visible" });
  mark("export_open");
  const htmlBtn = page.getByTestId("export-html");
  await moveTo(page, htmlBtn, 10);
  await htmlBtn.click();
  await page.getByText("Done.").waitFor({ state: "visible", timeout: 10_000 });
  mark("export_done");
  await page.screenshot({ path: path.join(EVIDENCE, "proof-done.png") });
  await page.waitForTimeout(3400);
  mark("proof_hold_end");
  mark("gif_window_end");

  const postText = await page.locator("body").innerText();
  const postCjkUi = /[\u3400-\u9fff]/.test(postText.replace(/[\s\S]*Roast grid[\s\S]{0,40}/, ""));
  fs.writeFileSync(
    path.join(EVIDENCE, "postcheck.json"),
    JSON.stringify(
      {
        ui_language: "en",
        visible: ["Chat", "Components", "Export", "Done."].every((p) => postText.includes(p)),
        cjk_ui: postCjkUi,
      },
      null,
      2,
    ),
  );

  fs.writeFileSync(path.join(RUN, "markers.json"), JSON.stringify({ t0, markers }, null, 2));
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
