import { lookField, REVIEW_PALETTES } from "./palettes";
import { inferGenerativeSchema } from "./tweak-bind";
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
 * Infer a review schema from markup. Prefer generative knobs prepared for
 * this design (mood, plan count, metric density…) over a CSS inspector.
 * Declared `@atelier-tweaks` fields win.
 */
export function inferTweaksSchema(source: string): TweakSchema {
  const declared = parseTweaksSchema(source);
  const generative = inferGenerativeSchema(source);
  const hexes = [...new Set((source.match(HEX) ?? []).map(expandHex))];
  const colorful = hexes.filter((h) => !isGrayish(h));

  const inferred: TweakSchema = {
    ...generative,
    look: generative.look ?? lookField(typeof declared.look?.value === "string" ? String(declared.look.value) : "ember"),
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
  };

  return { ...inferred, ...declared };
}

export function enrichSchema(source: string): TweakSchema {
  return inferTweaksSchema(source);
}

export function enrichTweaks(source: string, existing?: TweakMap): TweakMap {
  const schema = enrichSchema(source);
  return { ...schemaToMap(schema), ...existing };
}
