import { describe, expect, it } from "vitest";
import {
  TWEAKS_BEGIN,
  TWEAKS_END,
  applyTweaksToSource,
  cssVarsBlock,
  mergeTweaksIntoHtml,
  parseTweaksSchema,
  schemaToMap,
} from "@/lib/tweaks";

const SOURCE = `${TWEAKS_BEGIN}
{
  "accent": { "type": "color", "value": "#c45c26", "label": "Accent" },
  "radius": { "type": "range", "value": 16, "min": 0, "max": 40, "unit": "px" },
  "dense": { "type": "boolean", "value": false }
}
${TWEAKS_END}
<html><head></head><body><h1 data-tweak="headline">Hi</h1></body></html>`;

describe("tweaks protocol", () => {
  it("parses a declared schema from the comment block", () => {
    const schema = parseTweaksSchema(SOURCE);
    expect(schema.accent?.type).toBe("color");
    expect(schema.radius?.unit).toBe("px");
    expect(schemaToMap(schema).radius).toBe(16);
  });

  it("parses a script-type block", () => {
    const html = `<script type="application/atelier-tweaks">{"headline":{"type":"text","value":"North"}}</script>`;
    expect(parseTweaksSchema(html).headline?.value).toBe("North");
  });

  it("returns empty schema on invalid JSON", () => {
    expect(parseTweaksSchema(`${TWEAKS_BEGIN}{nope}${TWEAKS_END}`)).toEqual({});
  });

  it("writes tweaks back into the source block", () => {
    const schema = parseTweaksSchema(SOURCE);
    const next = applyTweaksToSource(SOURCE, { accent: "#111111", radius: 8 }, schema);
    const parsed = parseTweaksSchema(next);
    expect(parsed.accent?.value).toBe("#111111");
    expect(parsed.radius?.value).toBe(8);
  });

  it("emits CSS variables with units", () => {
    const css = cssVarsBlock({ radius: 12, accent: "#abc" }, parseTweaksSchema(SOURCE));
    expect(css).toContain("--tweak-radius: 12px");
    expect(css).toContain("--tweak-accent: #abc");
  });

  it("merges a live style tag into HTML", () => {
    const schema = parseTweaksSchema(SOURCE);
    const html = mergeTweaksIntoHtml(SOURCE, { accent: "#00ff00" }, schema);
    expect(html).toContain("data-atelier-tweaks");
    expect(html).toContain("--tweak-accent: #00ff00");
  });
});
