import type { TweakField, TweakMap, TweakSchema } from "./types";

export const TWEAKS_BEGIN = "/*@atelier-tweaks";
export const TWEAKS_END = "@atelier-tweaks*/";

const SCRIPT_RE =
  /<script[^>]*type=["']application\/atelier-tweaks["'][^>]*>([\s\S]*?)<\/script>/i;

export function extractTweaksBlock(source: string): string | null {
  const script = source.match(SCRIPT_RE);
  if (script?.[1]) return script[1].trim();

  const start = source.indexOf(TWEAKS_BEGIN);
  if (start === -1) return null;
  const end = source.indexOf(TWEAKS_END, start + TWEAKS_BEGIN.length);
  if (end === -1) return null;
  return source.slice(start + TWEAKS_BEGIN.length, end).trim();
}

export function parseTweaksSchema(source: string): TweakSchema {
  const raw = extractTweaksBlock(source);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const schema: TweakSchema = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const field = normalizeField(value);
      if (field) schema[key] = field;
    }
    return schema;
  } catch {
    return {};
  }
}

function normalizeField(value: unknown): TweakField | null {
  if (!value || typeof value !== "object") return null;
  const rec = value as Record<string, unknown>;
  const type = rec.type;
  if (
    type !== "color" &&
    type !== "range" &&
    type !== "text" &&
    type !== "select" &&
    type !== "boolean" &&
    type !== "palette"
  ) {
    return null;
  }
  const presets = Array.isArray(rec.presets)
    ? rec.presets
        .map((p) => {
          if (!p || typeof p !== "object") return null;
          const item = p as Record<string, unknown>;
          if (typeof item.label !== "string" || typeof item.value !== "string") return null;
          return { label: item.label, value: item.value };
        })
        .filter((p): p is { label: string; value: string } => Boolean(p))
    : undefined;
  let swatches: TweakField["swatches"];
  if (rec.swatches && typeof rec.swatches === "object" && !Array.isArray(rec.swatches)) {
    swatches = {};
    for (const [id, pack] of Object.entries(rec.swatches as Record<string, unknown>)) {
      if (!pack || typeof pack !== "object") continue;
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(pack as Record<string, unknown>)) {
        if (typeof v === "string") next[k] = v;
      }
      swatches[id] = next;
    }
  }
  return {
    type,
    value: (rec.value as TweakField["value"]) ?? defaultFor(type),
    label: typeof rec.label === "string" ? rec.label : undefined,
    min: typeof rec.min === "number" ? rec.min : undefined,
    max: typeof rec.max === "number" ? rec.max : undefined,
    step: typeof rec.step === "number" ? rec.step : undefined,
    unit: typeof rec.unit === "string" ? rec.unit : undefined,
    options: Array.isArray(rec.options)
      ? rec.options.filter((o): o is string => typeof o === "string")
      : undefined,
    presets,
    swatches,
    optionLabels: parseOptionLabels(rec.optionLabels),
    control:
      rec.control === "radio" || rec.control === "select" || rec.control === "chips"
        ? rec.control
        : undefined,
    structural: rec.structural === true ? true : undefined,
    group:
      rec.group === "color" ||
      rec.group === "type" ||
      rec.group === "density" ||
      rec.group === "layout" ||
      rec.group === "copy" ||
      rec.group === "look" ||
      rec.group === "motion" ||
      rec.group === "geometry" ||
      rec.group === "visibility"
        ? rec.group
        : undefined,
  };
}

function parseOptionLabels(raw: unknown): TweakField["optionLabels"] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

function defaultFor(type: TweakField["type"]): TweakField["value"] {
  switch (type) {
    case "color":
      return "#111111";
    case "range":
      return 0;
    case "boolean":
      return false;
    case "palette":
      return "ember";
    default:
      return "";
  }
}

export function mapsEqual(a: TweakMap, b: TweakMap): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export function schemaToMap(schema: TweakSchema): TweakMap {
  const map: TweakMap = {};
  for (const [key, field] of Object.entries(schema)) {
    map[key] = field.value;
  }
  return map;
}

export function formatTweakCssValue(
  key: string,
  value: string | number | boolean,
  schema?: TweakSchema,
): string {
  const field = schema?.[key];
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") {
    return field?.unit ? `${value}${field.unit}` : String(value);
  }
  return String(value);
}

export function tweaksToCssVars(
  tweaks: TweakMap,
  schema?: TweakSchema,
): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(tweaks)) {
    vars[`--tweak-${key}`] = formatTweakCssValue(key, value, schema);
  }
  return vars;
}

export function applyTweaksToSource(
  source: string,
  tweaks: TweakMap,
  schema: TweakSchema,
): string {
  const nextSchema: TweakSchema = { ...schema };
  for (const [key, value] of Object.entries(tweaks)) {
    if (nextSchema[key]) {
      nextSchema[key] = { ...nextSchema[key], value };
    }
  }
  const json = JSON.stringify(nextSchema, null, 2);

  if (SCRIPT_RE.test(source)) {
    return source.replace(
      SCRIPT_RE,
      `<script type="application/atelier-tweaks">\n${json}\n</script>`,
    );
  }

  const start = source.indexOf(TWEAKS_BEGIN);
  if (start !== -1) {
    const end = source.indexOf(TWEAKS_END, start);
    if (end !== -1) {
      return (
        source.slice(0, start) +
        `${TWEAKS_BEGIN}\n${json}\n${TWEAKS_END}` +
        source.slice(end + TWEAKS_END.length)
      );
    }
  }

  return `${TWEAKS_BEGIN}\n${json}\n${TWEAKS_END}\n${source}`;
}

export function cssVarsBlock(tweaks: TweakMap, schema?: TweakSchema): string {
  const vars = tweaksToCssVars(tweaks, schema);
  const body = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  return `:root {\n${body}\n}`;
}

export function mergeTweaksIntoHtml(
  html: string,
  tweaks: TweakMap,
  schema: TweakSchema,
): string {
  const withBlock = applyTweaksToSource(html, tweaks, schema);
  const vars = cssVarsBlock(tweaks, schema);
  if (/<style[^>]*data-atelier-tweaks/.test(withBlock)) {
    return withBlock.replace(
      /<style[^>]*data-atelier-tweaks[^>]*>[\s\S]*?<\/style>/,
      `<style data-atelier-tweaks>${vars}</style>`,
    );
  }
  if (/<\/head>/i.test(withBlock)) {
    return withBlock.replace(
      /<\/head>/i,
      `<style data-atelier-tweaks>${vars}</style></head>`,
    );
  }
  return `<style data-atelier-tweaks>${vars}</style>\n${withBlock}`;
}
