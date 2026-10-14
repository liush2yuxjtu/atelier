import type { DesignSystem, DesignToken } from "./types";

const COLOR_RE = /#(?:[0-9a-fA-F]{3,8})\b|rgba?\([^)]+\)|hsla?\([^)]+\)/g;
const FONT_RE = /font-family:\s*([^;}{]+)/gi;

export function extractColorsFromImageData(data: Uint8ClampedArray, sample = 8): string[] {
  const buckets = new Map<string, number>();
  for (let i = 0; i < data.length; i += 4 * sample) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 200) continue;
    const qr = Math.round(r / 24) * 24;
    const qg = Math.round(g / 24) * 24;
    const qb = Math.round(b / 24) * 24;
    const key = rgbToHex(qr, qg, qb);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([hex]) => hex);
}

export function extractFromCss(css: string): DesignToken[] {
  const tokens: DesignToken[] = [];
  const colors = css.match(new RegExp(COLOR_RE.source, "g")) ?? [];
  const uniqueColors = [...new Set(colors.map(normalizeColor))].slice(0, 12);
  uniqueColors.forEach((value, i) => {
    tokens.push({ name: `color-${i + 1}`, value, kind: "color" });
  });
  const fonts = new Set<string>();
  let m: RegExpExecArray | null;
  const fontRe = new RegExp(FONT_RE.source, "gi");
  while ((m = fontRe.exec(css))) {
    const family = m[1].split(",")[0].replace(/["']/g, "").trim();
    if (family) fonts.add(family);
  }
  [...fonts].slice(0, 4).forEach((value, i) => {
    tokens.push({ name: `font-${i + 1}`, value, kind: "font" });
  });
  return tokens;
}

export function tokensToSystem(
  name: string,
  source: DesignSystem["source"],
  tokens: DesignToken[],
): DesignSystem {
  return { name, source, tokens, extractedAt: Date.now() };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function normalizeColor(c: string): string {
  if (c.startsWith("#") && c.length === 4) {
    return (
      "#" +
      c
        .slice(1)
        .split("")
        .map((ch) => ch + ch)
        .join("")
    );
  }
  return c.toLowerCase();
}

export function githubRawUrl(repoUrl: string, path = "README.md"): string | null {
  const m = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (!m) return null;
  return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/HEAD/${path}`;
}
