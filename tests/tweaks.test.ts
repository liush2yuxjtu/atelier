import { describe, expect, it } from "vitest";
import { createDemoProject } from "@/lib/demo";
import { compileArtboard } from "@/lib/sandbox/compile";
import {
  TWEAKS_BEGIN,
  TWEAKS_END,
  applyTweaksToSource,
  concealTweaksBlock,
  cssVarsBlock,
  mergeTweaksIntoHtml,
  parseTweaksSchema,
  schemaToMap,
} from "@/lib/tweaks";

function visibleMarkup(html: string): string {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "");
}

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

  it("injects a script into head instead of a visible CSS comment", () => {
    const arch = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body><h2>How Atelier talks to a board</h2></body></html>`;
    const schema = parseTweaksSchema(
      `<script type="application/atelier-tweaks">{"look":{"type":"palette","value":"ember"}}</script>`,
    );
    const next = applyTweaksToSource(arch, { look: "night" }, schema);
    expect(next).not.toContain(TWEAKS_BEGIN);
    expect(next).toContain('<script type="application/atelier-tweaks">');
    expect(next.indexOf("<script type=\"application/atelier-tweaks\">")).toBeLessThan(next.indexOf("</head>"));
    expect(visibleMarkup(next)).toContain("How Atelier talks to a board");
    expect(visibleMarkup(next)).not.toContain("@atelier-tweaks");
    expect(visibleMarkup(next)).not.toMatch(/"type"\s*:\s*"palette"/);
    expect(parseTweaksSchema(next).look?.value).toBe("night");
  });

  it("converts a leftover CSS-comment block so the JSON is not visible text", () => {
    const leaked = `${TWEAKS_BEGIN}
{"headline":{"type":"text","value":"Choose a roast cadence"}}
${TWEAKS_END}
<!DOCTYPE html><html><head></head><body><h2>How Atelier talks to a board</h2></body></html>`;
    const hidden = concealTweaksBlock(leaked);
    expect(hidden).not.toContain(TWEAKS_BEGIN);
    expect(visibleMarkup(hidden)).not.toContain("Choose a roast cadence");
    expect(visibleMarkup(hidden)).toContain("How Atelier talks to a board");
    expect(parseTweaksSchema(hidden).headline?.value).toBe("Choose a roast cadence");
  });

  it("compiled architecture board never paints tweak JSON under the heading", () => {
    const demo = createDemoProject("demo");
    const flow = demo.artboards.find((b) => b.id === "ab-flow")!;
    const schema = {
      look: { type: "palette" as const, value: "ember", label: "Look" },
    };
    const painted = applyTweaksToSource(flow.source, { look: "ember" }, schema);
    const compiled = compileArtboard({
      kind: "html",
      source: painted,
      nonce: "n",
      vendorBase: "",
      tweaks: { look: "ember" },
      tweakSchema: schema,
    });
    const visible = visibleMarkup(compiled);
    expect(visible).toContain("How Atelier talks to a board");
    expect(visible).not.toContain(TWEAKS_BEGIN);
    expect(visible).not.toContain("@atelier-tweaks");
    expect(visible).not.toMatch(/[{,]\s*"look"\s*:/);
    expect(compiled).toContain('<script type="application/atelier-tweaks">');

    const alreadyLeaked = `${TWEAKS_BEGIN}\n${JSON.stringify(schema)}\n${TWEAKS_END}\n${flow.source}`;
    const recovered = compileArtboard({
      kind: "html",
      source: alreadyLeaked,
      nonce: "n",
      vendorBase: "",
      tweaks: { look: "ember" },
      tweakSchema: schema,
    });
    expect(visibleMarkup(recovered)).not.toContain(TWEAKS_BEGIN);
    expect(visibleMarkup(recovered)).toContain("How Atelier talks to a board");
    expect(visibleMarkup(recovered)).not.toMatch(/"type"\s*:\s*"palette"/);
  });
});
