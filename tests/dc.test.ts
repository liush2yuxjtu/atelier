import { describe, expect, it } from "vitest";
import {
  dependentsOf,
  findCycle,
  flattenAllSafe,
  interpolate,
  interpolateProps,
  listDcFiles,
  mergeProps,
  parseDc,
  parseDcImports,
  parseDcSchema,
  parsePropsAttr,
  schemaDefaults,
  schemaToTweakSchema,
  setFileProps,
  tweakMapFromSchema,
  wouldCreateCycle,
} from "@/lib/dc";
import { parseAgentOutput, parseStreaming } from "@/lib/agent/parse";
import { createDemoProject } from "@/lib/demo";
import { artboardToStandaloneHtml } from "@/lib/export";
import { filesFromList } from "@/lib/dc";

const BADGE = `<!DOCTYPE html>
<html>
<head>
<script type="application/atelier-dc">
{
  "name": "Badge",
  "preview": { "width": 120, "height": 32 },
  "props": {
    "label": { "type": "text", "default": "Lot", "label": "Label" },
    "accent": { "type": "color", "default": "#c45c26", "label": "Accent" }
  },
  "slots": []
}
</script>
</head>
<body>
  <span data-dc-root style="background:var(--dc-accent)">{{label}}</span>
</body>
</html>`;

const CARD = `<!DOCTYPE html>
<html>
<head>
<script type="application/atelier-dc">
{
  "name": "Card",
  "props": {
    "title": { "type": "text", "default": "Summit", "label": "Title" },
    "accent": { "type": "color", "default": "#111111", "label": "Accent" }
  },
  "slots": ["cta"]
}
</script>
<style>.card{padding:8px}</style>
</head>
<body>
  <article class="card" data-dc-root>
    <dc-import src="Badge.dc.html" props='{"label":"Plan","accent":"{{accent}}"}'></dc-import>
    <h3>{{title}}</h3>
    <slot name="cta"><button>Start</button></slot>
  </article>
</body>
</html>`;

describe("dc parser + schema", () => {
  it("reads typed props, defaults, and slots", () => {
    const schema = parseDcSchema(CARD);
    expect(schema.name).toBe("Card");
    expect(schema.props.title.default).toBe("Summit");
    expect(schema.props.accent.type).toBe("color");
    expect(schema.slots).toEqual(["cta"]);
    expect(schemaDefaults(schema).title).toBe("Summit");
  });

  it("parses dc-import props JSON and slot bodies", () => {
    const imports = parseDcImports(CARD);
    expect(imports).toHaveLength(1);
    expect(imports[0].src).toBe("Badge.dc.html");
    expect(imports[0].props.label).toBe("Plan");
    expect(imports[0].props.accent).toBe("{{accent}}");
  });

  it("parses a props attribute object", () => {
    expect(parsePropsAttr('{"a":1,"b":true,"c":"x"}')).toEqual({ a: 1, b: true, c: "x" });
    expect(parsePropsAttr("not-json")).toEqual({});
  });

  it("returns an empty schema when the block is missing or invalid", () => {
    expect(parseDcSchema("<html></html>").name).toBe("Component");
    expect(parseDcSchema(`<script type="application/atelier-dc">{</script>`).props).toEqual({});
  });

  it("maps schema fields onto the Tweaks panel shape", () => {
    const schema = parseDcSchema(BADGE);
    const tweaks = schemaToTweakSchema(schema);
    expect(tweaks.label.type).toBe("text");
    expect(tweaks.accent.value).toBe("#c45c26");
    expect(tweakMapFromSchema(schema, { label: "X" }).label).toBe("X");
  });
});

describe("dc interpolate + flatten", () => {
  it("interpolates dotted holes", () => {
    expect(interpolate("Hi {{user.name}}", { user: { name: "Ada" } })).toBe("Hi Ada");
    expect(interpolate("{{missing}}", {})).toBe("");
  });

  it("resolves parent holes inside child import props", () => {
    expect(interpolateProps({ accent: "{{accent}}" }, { accent: "#2f6fed" })).toEqual({
      accent: "#2f6fed",
    });
  });

  it("inlines imports, fills slots, and strips dc-import from the result", () => {
    const files = { "Badge.dc.html": BADGE, "Card.dc.html": CARD };
    const flat = flattenAllSafe("Card.dc.html", files, { title: "Trail", accent: "#2f6fed" });
    expect(flat.error).toBeUndefined();
    expect(flat.html).toContain("Trail");
    expect(flat.html).toContain("Plan");
    expect(flat.html).toContain("Start");
    expect(flat.html).not.toMatch(/<dc-import/);
    expect(flat.fragment).toContain("data-dc-mount");
    expect(flat.fragment).toContain("--dc-accent:#2f6fed");
    expect(mergeProps(parseDc(CARD).schema, { title: "X" }).title).toBe("X");
  });

  it("flattens the demo RoastGrid without leftover imports", () => {
    const project = createDemoProject("demo");
    const map = filesFromList(project.files);
    const flat = flattenAllSafe("RoastGrid.dc.html", map);
    expect(flat.error).toBeUndefined();
    expect(flat.html).toContain("Trail");
    expect(flat.html).toContain("Summit");
    expect(flat.html).toContain("Camp");
    expect(flat.html).not.toMatch(/<dc-import/);
    expect(listDcFiles(map)).toEqual(["Badge.dc.html", "PriceCard.dc.html", "RoastGrid.dc.html"]);
  });
});

describe("dc cycles + dependents", () => {
  it("detects a two-node import cycle", () => {
    const files = {
      "A.dc.html": `<html><body><dc-import src="B.dc.html"></dc-import></body></html>`,
      "B.dc.html": `<html><body><dc-import src="A.dc.html"></dc-import></body></html>`,
    };
    const cycle = findCycle(files);
    expect(cycle).not.toBeNull();
    expect(cycle?.join(" ")).toMatch(/A\.dc\.html/);
    expect(flattenAllSafe("A.dc.html", files).error).toMatch(/Cycle/);
  });

  it("wouldCreateCycle is true when a new edge closes a loop", () => {
    const files = {
      "A.dc.html": `<html><body></body></html>`,
      "B.dc.html": `<html><body><dc-import src="A.dc.html"></dc-import></body></html>`,
    };
    expect(wouldCreateCycle(files, "A.dc.html", "B.dc.html")).toBe(true);
    expect(wouldCreateCycle(files, "A.dc.html", "Missing.dc.html")).toBe(false);
  });

  it("lists transitive dependents including the file itself", () => {
    const files = {
      "Badge.dc.html": BADGE,
      "Card.dc.html": CARD,
      "Page.dc.html": `<html><body><dc-import src="Card.dc.html"></dc-import></body></html>`,
    };
    const deps = dependentsOf(files, "Badge.dc.html");
    expect(deps.sort()).toEqual(["Badge.dc.html", "Card.dc.html", "Page.dc.html"].sort());
  });
});

describe("dc set_props", () => {
  it("rewrites schema defaults inside the file without dropping markup", () => {
    const next = setFileProps(BADGE, { label: "New lot", accent: "#112233" });
    const schema = parseDcSchema(next);
    expect(schema.props.label.default).toBe("New lot");
    expect(schema.props.accent.default).toBe("#112233");
    expect(next).toContain("data-dc-root");
  });
});

describe("dc agent tools", () => {
  it("parses dc-write and dc-set-props blocks", () => {
    const text = `Writing.

<dc-write path="Chip.dc.html" title="Chip" width="200" height="40" mount="true">
<html><body>hi</body></html>
</dc-write>

<dc-set-props path="Chip.dc.html" instance="ab-1">
{"label":"Hello"}
</dc-set-props>
`;
    const parsed = parseAgentOutput(text);
    expect(parsed.dcWrites).toHaveLength(1);
    expect(parsed.dcWrites[0].path).toBe("Chip.dc.html");
    expect(parsed.dcWrites[0].mount).toBe(true);
    expect(parsed.dcSetProps[0].props.label).toBe("Hello");
    expect(parsed.dcSetProps[0].instance).toBe("ab-1");
    expect(parsed.prose).toContain("Writing.");
    expect(parsed.prose).not.toContain("<dc-write");
  });

  it("streams an unclosed dc-write from the first characters", () => {
    const partial = `<dc-write path="Live.dc.html" title="Live" width="400" height="200">\n<html><body>partial`;
    const parsed = parseStreaming(partial);
    expect(parsed.dcWrites).toHaveLength(1);
    expect(parsed.dcWrites[0].source).toContain("partial");
  });
});

describe("dc export flatten", () => {
  it("emits standalone HTML without dc-import tags", () => {
    const project = createDemoProject("demo");
    const board = project.artboards.find((b) => b.kind === "dc");
    expect(board).toBeTruthy();
    const html = artboardToStandaloneHtml(board!, "", project.files);
    expect(html).not.toMatch(/<dc-import/);
    expect(html).toContain("Trail");
  });
});
