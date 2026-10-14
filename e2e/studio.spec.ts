import { expect, test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const shots = path.join(process.cwd(), "docs", "screenshots");
const artifacts = path.join(process.cwd(), "e2e", "artifacts");

function save(pageShot: Buffer, name: string) {
  fs.mkdirSync(shots, { recursive: true });
  fs.mkdirSync(artifacts, { recursive: true });
  fs.writeFileSync(path.join(shots, name), pageShot);
  fs.writeFileSync(path.join(artifacts, name), pageShot);
}

test.describe("Atelier studio", () => {
  test("landing opens the demo canvas with multiple artboards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Chat on the left/i })).toBeVisible();
    await page.getByTestId("open-demo").click();
    await expect(page).toHaveURL(/\/studio\/demo/);
    await expect(page.getByTestId("studio-app")).toBeVisible();
    await expect(page.getByTestId("canvas-view")).toBeVisible();
    await expect(page.getByTestId("artboard-ab-landing")).toBeVisible();
    await expect(page.getByTestId("artboard-ab-pricing")).toBeVisible();
    await expect(page.getByTestId("artboard-ab-phone")).toBeVisible();
    await expect(page.locator("[data-artboard=true]")).toHaveCount(5);
    await page.waitForTimeout(2500);
    save(await page.screenshot({ fullPage: true }), "canvas-multi-artboard.png");
  });

  test("edit mode, tweak panel, and export dialog", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("open-demo").click();
    await expect(page.getByTestId("studio-app")).toBeVisible();
    await expect(page.locator("[data-artboard=true]")).toHaveCount(5);
    await page.waitForTimeout(2500);
    await page.getByTestId("artboard-title-ab-landing").click();
    await page.getByTestId("mode-edit").click();
    await expect(page.getByTestId("mode-edit")).toHaveClass(/text-amber-100/);
    await page.waitForTimeout(800);
    save(await page.screenshot({ fullPage: true }), "edit-mode.png");

    await page.getByTestId("tab-tweaks").click();
    await expect(page.getByTestId("tweak-panel")).toBeVisible();
    const color = page.getByTestId("tweak-accent");
    if (await color.count()) {
      await color.first().fill("#2f6fed");
    }
    save(await page.locator("[data-testid=right-rail]").screenshot(), "tweak-panel.png");

    await page.getByTestId("open-export").click();
    await expect(page.getByTestId("export-dialog")).toBeVisible();
    save(await page.screenshot({ fullPage: true }), "export-dialog.png");
    await page.getByTestId("export-html").click();
    await expect(page.getByText(/Done|Exporting/)).toBeVisible();
  });

  test("offline chat streams a new artboard onto the canvas", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("open-demo").click();
    await expect(page.getByTestId("chat-panel")).toBeVisible();
    const before = await page.locator("[data-artboard=true]").count();
    await page.getByTestId("chat-input").fill("Poster for a weekend cupping.");
    await page.getByTestId("chat-send").click();
    await expect(page.getByTestId("msg-assistant").last()).toContainText(/Placed a new artboard/i, {
      timeout: 20_000,
    });
    await page.waitForTimeout(1500);
    const after = await page.locator("[data-artboard=true]").count();
    expect(after).toBeGreaterThan(before);
    save(await page.screenshot({ fullPage: true }), "streaming-artboard.png");
  });

  test("duplicate and arrange artboards", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("open-demo").click();
    await expect(page.getByTestId("studio-app")).toBeVisible();
    await expect(page.locator("[data-artboard=true]")).toHaveCount(5);
    const before = await page.locator("[data-artboard=true]").count();
    await page.getByTestId("artboard-title-ab-phone").click();
    await page.getByTestId("duplicate-artboard").click();
    await expect(page.locator("[data-artboard=true]")).toHaveCount(before + 1);
    await page.getByTestId("arrange-artboards").click();
    await expect(page.getByText(/copy/i).first()).toBeVisible();
    save(await page.screenshot({ fullPage: true }), "arranged-artboards.png");
  });
});
