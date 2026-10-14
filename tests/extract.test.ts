import { describe, expect, it } from "vitest";
import { extractFromCss, githubRawUrl, rgbToHex } from "@/lib/extract";

describe("design system extraction", () => {
  it("pulls colors and fonts from CSS", () => {
    const tokens = extractFromCss(
      `body { color: #1a1612; background: #f4efe6; font-family: "Fraunces", serif } .a { color: rgb(196, 92, 38) }`,
    );
    expect(tokens.some((t) => t.kind === "color" && t.value.includes("#1a1612"))).toBe(true);
    expect(tokens.some((t) => t.kind === "font" && t.value === "Fraunces")).toBe(true);
  });

  it("builds a GitHub raw URL", () => {
    expect(githubRawUrl("https://github.com/acme/tokens")).toBe(
      "https://raw.githubusercontent.com/acme/tokens/HEAD/README.md",
    );
    expect(githubRawUrl("not-github")).toBeNull();
  });

  it("converts rgb to hex", () => {
    expect(rgbToHex(196, 92, 38)).toBe("#c45c26");
  });
});
