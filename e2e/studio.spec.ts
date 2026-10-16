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

async function openDemo(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByTestId("open-demo").click();
  await expect(page.getByTestId("studio-app")).toBeVisible();
  await expect(page.getByTestId("canvas-view")).toBeVisible();
  await expect(page.getByTestId("artboard-ab-landing")).toBeVisible();
  await expect(page.locator("[data-artboard=true]")).toHaveCount(8);
  await page.waitForTimeout(2200);
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
    await expect(page.getByTestId("artboard-ab-about")).toBeVisible();
    await expect(page.getByTestId("artboard-ab-dashboard")).toBeVisible();
    await expect(page.getByTestId("artboard-ab-phone")).toBeVisible();
    await expect(page.getByTestId("artboard-ab-dc-grid")).toBeVisible();
    await expect(page.locator("[data-artboard=true]")).toHaveCount(8);
    await page.waitForTimeout(2500);
    save(await page.screenshot({ fullPage: true }), "canvas-multi-artboard.png");
  });

  test("edit mode, tweak panel, and export dialog", async ({ page }) => {
    await openDemo(page);
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
    await openDemo(page);
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
    await openDemo(page);
    const before = await page.locator("[data-artboard=true]").count();
    await page.getByTestId("artboard-title-ab-phone").click();
    await page.getByTestId("duplicate-artboard").click();
    await expect(page.locator("[data-artboard=true]")).toHaveCount(before + 1);
    await page.getByTestId("arrange-artboards").click();
    await expect(page.getByText(/copy/i).first()).toBeVisible();
    save(await page.screenshot({ fullPage: true }), "arranged-artboards.png");
  });

  test("design component library, composed board, and prop tweaks", async ({ page }) => {
    await openDemo(page);
    const library = page.getByTestId("library-panel");
    await expect(library).toBeVisible();
    await expect(page.getByTestId("library-item-Badge")).toBeVisible();
    await expect(page.getByTestId("library-item-PriceCard")).toBeVisible();
    await expect(page.getByTestId("library-item-RoastGrid")).toBeVisible();
    await page.waitForTimeout(800);
    save(await library.screenshot(), "dc-library-panel.png");

    await page.getByTestId("artboard-select-ab-dc-grid").click();
    await expect(page.getByTestId("artboard-ab-dc-grid")).toHaveAttribute("data-kind", "dc");
    await expect(page.getByTestId("tab-tweaks")).toHaveText(/Props/i);
    await page.waitForTimeout(1200);
    save(await page.getByTestId("artboard-ab-dc-grid").screenshot(), "dc-composed.png");
    save(await page.screenshot({ fullPage: true }), "dc-composed-canvas.png");

    await page.getByTestId("tab-tweaks").click();
    await expect(page.getByTestId("dc-props-hint")).toBeVisible();
    const headline = page.getByTestId("tweak-headline");
    await expect(headline).toBeVisible();
    await headline.fill("Pick a cadence");
    await page.waitForTimeout(600);
    save(await page.locator("[data-testid=right-rail]").screenshot(), "dc-props-tweak.png");

    const before = await page.locator("[data-artboard=true]").count();
    await page.getByTestId("library-place-PriceCard").click();
    await expect(page.locator("[data-artboard=true]")).toHaveCount(before + 1);
    await expect(page.getByTestId("tab-tweaks")).toHaveText(/Props/i);
    await expect(page.getByTestId("dc-props-hint")).toContainText("PriceCard");
  });

  test("present mode, moss palette, approve, undo", async ({ page }) => {
    await openDemo(page);
    await page.getByTestId("artboard-title-ab-landing").click();
    await expect(page.getByTestId("palette-chips")).toBeVisible();
    await expect(page.getByTestId("palette-moss")).toBeVisible();

    await page.getByTestId("mode-present").click();
    await expect(page.getByTestId("present-dock")).toBeVisible();
    await expect(page.getByTestId("chat-panel")).toHaveCount(0);
    await expect(page.getByTestId("right-rail")).toHaveCount(0);
    await expect(page.getByTestId("artboard-ab-landing")).toBeVisible();
    await expect(page.getByTestId("artboard-ab-pricing")).toBeVisible();
    await expect(page.getByTestId("artboard-ab-about")).toBeVisible();
    await expect(page.getByTestId("linked-count")).toContainText(/linked in \d+ boards/i);

    await page.getByTestId("generate-knobs").click();
    await page.getByTestId("palette-moss").click();
    await expect(page.getByTestId("palette-moss")).toHaveAttribute("data-active", "true");
    await expect(page.getByTestId("studio-app")).toHaveAttribute("data-theme-look", "moss");

    await page.getByTestId("tweak-undo").click();
    await expect(page.getByTestId("palette-ember")).toHaveAttribute("data-active", "true");
    await page.getByTestId("tweak-redo").click();
    await expect(page.getByTestId("palette-moss")).toHaveAttribute("data-active", "true");

    await page.getByTestId("section-pricing-up").click();
    await expect(page.getByTestId("studio-app")).toHaveAttribute("data-pricing-order", "1");
    await page.getByTestId("section-pricing-stack").click();
    await expect(page.getByTestId("studio-app")).toHaveAttribute("data-pricing-layout", "stack");

    await page.getByTestId("approve-look").click();
    await expect(page.getByTestId("look-approved")).toBeVisible();
    await expect(page.getByText(/^Approved$/).first()).toBeVisible();

    await page.getByTestId("compare-look").click();
    await expect(page.getByTestId("compare-split").first()).toBeVisible();
    await page.getByTestId("compare-look").click();
    save(await page.screenshot({ fullPage: true }), "present-tweaks.png");
  });

  test("unlink isolates a token; push override restores the link", async ({ page }) => {
    await openDemo(page);
    await page.getByTestId("artboard-title-ab-landing").click();
    await page.getByTestId("tab-tweaks").click();
    await expect(page.getByTestId("linked-look")).toContainText(/linked in \d+ boards/i);
    await page.getByTestId("unlink-accent").click();
    await expect(page.getByTestId("unlink-accent")).toHaveText(/Unlinked/i);
    const color = page.getByTestId("tweak-accent").first();
    await color.fill("#2f6fed");
    await page.getByTestId("artboard-title-ab-pricing").click();
    await page.getByTestId("tab-tweaks").click();
    await expect(page.getByTestId("tweak-accent").first()).toHaveValue("#c45c26");
    await page.getByTestId("artboard-title-ab-landing").click();
    await page.getByTestId("push-accent").click();
    await page.getByTestId("artboard-title-ab-pricing").click();
    await expect(page.getByTestId("tweak-accent").first()).toHaveValue("#2f6fed");
  });

  test("generate knobs infers a look on a board without a schema", async ({ page }) => {
    await openDemo(page);
    await page.getByTestId("artboard-title-ab-flow").click();
    await page.getByTestId("generate-knobs").click();
    await expect(page.getByTestId("palette-chips")).toBeVisible();
    await expect(page.getByTestId("palette-night")).toBeVisible();
    const frame = page.frameLocator('[data-testid="artboard-frame-ab-flow"] iframe');
    await expect(frame.getByRole("heading", { name: "How Atelier talks to a board" })).toBeVisible();
    await expect(frame.locator("body")).not.toContainText("@atelier-tweaks");
    await expect(frame.locator("body")).not.toContainText('"look"');
  });

  test("generative tweaks restructure landing, dashboard, and pricing", async ({ page }) => {
    await openDemo(page);
    await page.getByTestId("artboard-title-ab-landing").click();
    await page.getByTestId("tab-tweaks").click();
    await expect(page.getByTestId("tweaks-prepared-chip")).toBeVisible();
    await expect(page.getByTestId("tweak-mood")).toBeVisible();
    await expect(page.getByTestId("tweak-socialProof")).toBeVisible();
    await expect(page.getByTestId("artboard-ab-landing")).toHaveAttribute("data-tweak-mood", "saas");
    await page.getByTestId("tweak-mood-playful").click();
    await expect(page.getByTestId("artboard-ab-landing")).toHaveAttribute("data-tweak-mood", "playful");
    await page.getByTestId("tweak-socialProof").click();
    await expect(page.getByTestId("artboard-ab-landing")).toHaveAttribute("data-tweak-social-proof", "off");

    await page.getByRole("button", { name: "fit" }).click();
    await page.getByTestId("artboard-select-ab-dashboard").click();
    await expect(page.getByTestId("tweak-metricDensity")).toBeVisible();
    await expect(page.getByTestId("tweak-mood")).toHaveCount(0);
    await page.getByTestId("tweak-metricDensity-dense").click();
    await expect(page.getByTestId("artboard-ab-dashboard")).toHaveAttribute(
      "data-tweak-metric-density",
      "dense",
    );

    await page.getByTestId("artboard-select-ab-pricing").click();
    await expect(page.getByTestId("tweak-planCount")).toBeVisible();
    await page.getByTestId("tweak-planCount-4").click();
    await expect(page.getByTestId("artboard-ab-pricing")).toHaveAttribute("data-tweak-plan-count", "4");
    await page.getByTestId("tweak-billing-yearly").click();
    await expect(page.getByTestId("artboard-ab-pricing")).toHaveAttribute("data-tweak-billing", "yearly");

    await page.getByTestId("apply-across-canvas").click();
    await expect(page.getByTestId("global-bar")).toBeVisible();
  });
});
