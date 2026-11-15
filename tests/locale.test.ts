import { describe, expect, it } from "vitest";
import { translate } from "../src/lib/locale";
import { createDemoProject } from "../src/lib/demo";
import { localizeDemoProject } from "../src/lib/demo-locale";

describe("localized demo content", () => {
  it("keeps authored strings and English projects intact", () => {
    const project = createDemoProject("demo");
    expect(localizeDemoProject(project, "en")).toBe(project);
    expect(translate("zh-CN", "A customer's own title")).toBe("A customer's own title");
    expect(translate("en", "Playful")).toBe("Playful");
  });
  it("localizes native before and after copy while preserving binding identifiers", () => {
    const original = createDemoProject("demo");
    const localized = localizeDemoProject(original, "zh-CN");
    const home = localized.artboards.find((b) => b.id === "ab-landing")!;
    expect(home.source).toContain('lang="zh-CN"');
    expect(home.source).toContain('data-copy-saas="把山野的风味，装进咖啡杯。"');
    expect(home.source).toContain('data-copy-playful="每一袋，都有新鲜感"');
    expect(home.source).toContain('data-copy-playful="一起开烘"');
    expect(home.tweaks.mood).toBe("saas");
    expect(original.artboards[0].source).not.toContain("每一袋，都有新鲜感");
    expect(localized.versions[0].artboards).toEqual(localized.artboards);
    expect(translate("zh-CN", "Playful")).toBe("活泼");
  });
});
