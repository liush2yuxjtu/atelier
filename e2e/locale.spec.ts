import { test, expect } from "@playwright/test";

test("Chinese Mood controls update Chinese demo copy and preserve the saved project", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("locale-select").selectOption("zh-CN");
  await expect(page.getByTestId("open-demo")).toHaveText(/打开 Northbound 示例/);
  await page.getByTestId("open-demo").click();
  await page.getByTestId("artboard-title-ab-landing").click();
  await page.getByTestId("tab-tweaks").click();
  await expect(page.getByTestId("tweak-mood-playful")).toHaveText("活泼");
  const frame = page.frameLocator('[data-testid="artboard-ab-landing"] iframe');
  await expect(frame.locator("h1")).toHaveText("把山野的风味，装进咖啡杯。");
  await page.getByTestId("tweak-mood-playful").click();
  await expect(frame.locator("h1")).toHaveText("每一袋，都有新鲜感");
  await expect(frame.getByRole("button", { name: "一起开烘" })).toBeVisible();
  await page.getByTestId("locale-select").selectOption("en");
  await expect(page.getByTestId("tweak-mood-playful")).toHaveText("Playful");
  await expect(frame.locator("h1")).toHaveText("每一袋，都有新鲜感");
  await page.reload();
  await expect(page.getByTestId("locale-select")).toHaveValue("en");
  await expect(frame.locator("h1")).toHaveText("每一袋，都有新鲜感");
  await page.getByTestId("locale-select").selectOption("zh-CN");
  await expect(page.getByTestId("tab-tweaks")).toHaveText("微调");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});
