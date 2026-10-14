import { describe, expect, it } from "vitest";
import { applyLook, lookField, REVIEW_PALETTES } from "@/lib/palettes";
import { enrichSchema, inferTweaksSchema } from "@/lib/infer-tweaks";
import { parseTweaksSchema, schemaToMap, mapsEqual } from "@/lib/tweaks";

const MARKUP = `<!DOCTYPE html><html><head>
<style>
:root { --tweak-accent: #c45c26; }
body { background: #f4efe6; color: #1a1612; }
.hero { display: grid; grid-template-columns: 1.1fr 0.9fr; }
h1 { font-size: 72px; }
</style>
</head>
<body>
  <h1 data-tweak="headline">Coffee that tastes like the trail.</h1>
  <button style="background:#c45c26">Get a bag</button>
</body></html>`;

describe("infer review knobs", () => {
  it("infers look, accent, paper, ink, density, type, layout, headline", () => {
    const schema = inferTweaksSchema(MARKUP);
    expect(schema.look?.type).toBe("palette");
    expect(schema.look?.options).toEqual(["ember", "moss", "night", "signal"]);
    expect(schema.accent?.type).toBe("color");
    expect(String(schema.accent?.value).toLowerCase()).toBe("#c45c26");
    expect(schema.paper?.type).toBe("color");
    expect(schema.ink?.type).toBe("color");
    expect(schema.density?.type).toBe("range");
    expect(schema.type?.type).toBe("range");
    expect(schema.layout?.options).toContain("stack");
    expect(schema.headline?.type).toBe("text");
  });

  it("lets a declared schema win over inference", () => {
    const html = `<script type="application/atelier-tweaks">{"accent":{"type":"color","value":"#2f6fed","label":"Accent"},"look":{"type":"palette","value":"signal"}}</script>${MARKUP}`;
    const schema = inferTweaksSchema(html);
    expect(schema.accent?.value).toBe("#2f6fed");
    expect(schema.look?.value).toBe("signal");
    expect(schema.density?.type).toBe("range");
  });

  it("enrichSchema matches infer", () => {
    expect(Object.keys(enrichSchema(MARKUP))).toEqual(Object.keys(inferTweaksSchema(MARKUP)));
  });
});

describe("palette looks", () => {
  it("applies moss as a pack onto accent/paper/ink", () => {
    const next = applyLook({ accent: "#c45c26", paper: "#f4efe6", ink: "#1a1612", look: "ember" }, "moss");
    expect(next.look).toBe("moss");
    expect(next.accent).toBe(REVIEW_PALETTES.moss.accent);
    expect(next.paper).toBe(REVIEW_PALETTES.moss.paper);
    expect(next.ink).toBe(REVIEW_PALETTES.moss.ink);
  });

  it("keeps the previous map so undo can restore it", () => {
    const before = { accent: "#c45c26", look: "ember" };
    const after = applyLook(before, "night");
    expect(before.look).toBe("ember");
    expect(after.look).toBe("night");
    expect(mapsEqual(before, after)).toBe(false);
  });

  it("lookField ships named swatches", () => {
    const field = lookField("ember");
    expect(field.type).toBe("palette");
    expect(field.swatches?.moss?.accent).toBe("#3d6b4f");
  });
});

describe("palette schema parse", () => {
  it("round-trips a palette field with swatches", () => {
    const html = `<script type="application/atelier-tweaks">${JSON.stringify({
      look: lookField("ember"),
    })}</script>`;
    const schema = parseTweaksSchema(html);
    expect(schema.look?.type).toBe("palette");
    expect(schema.look?.swatches?.signal?.accent).toBe("#2f6fed");
    expect(schemaToMap(schema).look).toBe("ember");
  });
});
