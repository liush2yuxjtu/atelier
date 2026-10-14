import { lookField, REVIEW_PALETTES } from "./palettes";
import { parseTweaksSchema, schemaToMap } from "./tweaks";
import type { TweakMap, TweakSchema } from "./types";

const HEX = /#(?:[0-9a-fA-F]{3,8})\b/g;

function expandHex(h: string): string {
  const s = h.toLowerCase();
  if (s.length === 4) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  return s.slice(0, 7);
}

function isGrayish(hex: string): boolean {
  const h = expandHex(hex).slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min < 28;
}

/**
 * Infer a review schema from markup: colors, type scale, density, layout,
 * plus named palette looks. Declared `@atelier-tweaks` fields win.
 */
export function inferTweaksSchema(source: string): TweakSchema {
  const declared = parseTweaksSchema(source);
  const hexes = [...new Set((source.match(HEX) ?? []).map(expandHex))];
  const colorful = hexes.filter((h) => !isGrayish(h));
  const papers = hexes.filter((h) => {
    const n = parseInt(expandHex(h).slice(1), 16);
    return n > 0xd0d0d0;
  });
  const inks = hexes.filter((h) => {
    const n = parseInt(expandHex(h).slice(1), 16);
    return n < 0x404040;
  });

  const inferred: TweakSchema = {
    look: lookField(typeof declared.look?.value === "string" ? String(declared.look.value) : "ember"),
    accent: {
      type: "color",
      value: (declared.accent?.value as string) || colorful[0] || REVIEW_PALETTES.ember.accent,
      label: "Accent",
      group: "color",
      presets: Object.entries(REVIEW_PALETTES).map(([id, pack]) => ({
        label: id[0].toUpperCase() + id.slice(1),
        value: pack.accent,
      })),
    },
    paper: {
      type: "color",
      value: (declared.paper?.value as string) || papers[0] || REVIEW_PALETTES.ember.paper,
      label: "Paper",
      group: "color",
    },
    ink: {
      type: "color",
      value: (declared.ink?.value as string) || inks[0] || REVIEW_PALETTES.ember.ink,
      label: "Ink",
      group: "color",
    },
    radius: {
      type: "range",
      value: typeof declared.radius?.value === "number" ? declared.radius.value : 16,
      min: 0,
      max: 48,
      unit: "px",
      label: "Radius",
      group: "layout",
    },
    density: {
      type: "range",
      value: typeof declared.density?.value === "number" ? declared.density.value : 1,
      min: 0.75,
      max: 1.35,
      step: 0.05,
      label: "Density",
      group: "density",
    },
    type: {
      type: "range",
      value: typeof declared.type?.value === "number" ? declared.type.value : 1,
      min: 0.8,
      max: 1.3,
      step: 0.05,
      label: "Type scale",
      group: "type",
    },
  };

  if (declared.headline || /data-tweak=["']headline["']/.test(source)) {
    inferred.headline = {
      type: "text",
      value: (declared.headline?.value as string) || "",
      label: "Headline",
      group: "copy",
    };
  }

  if (declared.layout || /grid-template-columns/.test(source)) {
    inferred.layout = {
      type: "select",
      value: typeof declared.layout?.value === "string" ? String(declared.layout.value) : "split",
      options: ["split", "stack"],
      label: "Layout",
      group: "layout",
    };
  }

  return { ...inferred, ...declared };
}

export function enrichSchema(source: string): TweakSchema {
  return inferTweaksSchema(source);
}

export function enrichTweaks(source: string, existing?: TweakMap): TweakMap {
  const schema = enrichSchema(source);
  return { ...schemaToMap(schema), ...existing };
}
