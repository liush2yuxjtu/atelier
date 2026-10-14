import { expect, test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";

const media = path.join(process.cwd(), "docs", "media");
const artifacts = path.join(process.cwd(), "e2e", "artifacts");

function copyVideo(src: string, stem: string) {
  fs.mkdirSync(media, { recursive: true });
  fs.mkdirSync(artifacts, { recursive: true });
  const webm = path.join(media, `${stem}.webm`);
  fs.copyFileSync(src, webm);
  fs.copyFileSync(src, path.join(artifacts, `${stem}.webm`));
  try {
    const mp4 = path.join(media, `${stem}.mp4`);
    execSync(`ffmpeg -y -i "${src}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${mp4}"`, {
      stdio: "pipe",
    });
    fs.copyFileSync(mp4, path.join(artifacts, `${stem}.mp4`));
  } catch {
    /* ffmpeg optional */
  }
}

test.use({
  video: { mode: "on", size: { width: 1440, height: 900 } },
});

test("open demo, stream, edit, tweak, compose DC, export", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Chat on the left/i })).toBeVisible();
  await page.getByTestId("open-demo").click();
  await expect(page.getByTestId("studio-app")).toBeVisible();
  await expect(page.getByTestId("library-panel")).toBeVisible();
  await expect(page.getByTestId("artboard-ab-dc-grid")).toBeVisible();
  await page.waitForTimeout(1800);

  await page.getByTestId("chat-input").fill("Poster for a weekend cupping.");
  await page.getByTestId("chat-send").click();
  await expect(page.getByTestId("msg-assistant").last()).toContainText(/Placed a new artboard/i, {
    timeout: 20_000,
  });
  await page.waitForTimeout(1200);

  await page.getByTestId("artboard-title-ab-landing").click();
  await page.getByTestId("mode-edit").click();
  await page.waitForTimeout(700);
  await page.getByTestId("tab-tweaks").click();
  const accent = page.getByTestId("tweak-accent");
  if (await accent.count()) {
    await accent.first().fill("#2f6fed");
  }
  await page.waitForTimeout(500);

  await page.getByTestId("artboard-title-ab-dc-grid").click();
  await expect(page.getByTestId("dc-props-hint")).toBeVisible();
  const headline = page.getByTestId("tweak-headline");
  await headline.fill("Choose this week's roast");
  await page.waitForTimeout(600);

  await page.getByTestId("library-place-PriceCard").click();
  await page.waitForTimeout(800);

  await page.getByTestId("chat-input").fill("Compose a weekend badge design component");
  await page.getByTestId("chat-send").click();
  await expect(page.getByTestId("msg-assistant").last()).toContainText(/WeekendChip/i, {
    timeout: 20_000,
  });
  await expect(page.getByTestId("library-item-WeekendChip")).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1000);

  await page.getByTestId("open-export").click();
  await expect(page.getByTestId("export-dialog")).toBeVisible();
  await page.getByTestId("export-html").click();
  await expect(page.getByText(/Done|Exporting/)).toBeVisible();
  await page.waitForTimeout(800);

  const video = page.video();
  await page.close();
  if (video) {
    const stored = await video.path();
    if (stored && fs.existsSync(stored)) copyVideo(stored, "dc-demo");
  }
});
