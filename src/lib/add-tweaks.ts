import type { ProviderSettings, TweakField, TweakMap, TweakSchema } from "./types";
import { applyTweaksToSource, parseTweaksSchema, schemaToMap } from "./tweaks";
import { kebabTweakKey } from "./tweak-bind";

/** Chat / panel prompts that should open the AI add-tweaks flow. */
export const ADD_TWEAKS_PROMPT_RE = /add more tweaks for\s+(.+)/i;

export interface ElementBinding {
  /** Substring that uniquely identifies an opening tag or markup region. */
  match: string;
  /** Attributes to merge onto the first matching start tag. */
  attrs: Record<string, string>;
}

export interface AddTweaksPayload {
  schema: TweakSchema;
  /** Optional CSS that reacts to html[data-*] / --tweak-* values. */
  css?: string;
  bindings?: ElementBinding[];
}

export interface AddTweaksResult {
  source: string;
  tweakSchema: TweakSchema;
  tweaks: TweakMap;
  addedKeys: string[];
}

export const ADD_TWEAKS_SYSTEM = `You add generative Tweaks knobs to an existing Atelier artboard.
Return ONLY a single JSON object (no markdown fences, no prose) with this shape:
{
  "schema": {
    "camelCaseKey": {
      "type": "select"|"boolean"|"range"|"text"|"color",
      "control": "radio",
      "value": <default>,
      "options": ["a","b"],
      "optionLabels": { "a": "A", "b": "B" },
      "label": "Human label",
      "structural": true,
      "group": "layout"|"visibility"|"copy"|"density"|"type"|"look"|"motion"|"geometry"|"color",
      "min": 0, "max": 2, "step": 0.1
    }
  },
  "css": "optional CSS using html[data-kebab-key=value] or var(--tweak-camelCaseKey)",
  "bindings": [
    { "match": "unique substring near an opening tag", "attrs": { "data-copy-for": "key", "data-copy-a": "…", "data-tweak-show": "key" } }
  ]
}
Rules:
- Emit 2–5 NEW knobs only. Never repeat existing keys listed by the user.
- Prefer select (radio chips) and boolean toggles that visibly restructure copy, show/hide, or layout.
- Every structural select/boolean must have working css and/or bindings so toggling changes the page without regenerating HTML.
- For copy packs use data-copy-for + data-copy-<option> on an existing element (match its opening tag).
- For show/hide use data-tweak-show="<key>" on a section/block.
- Keep keys camelCase, labels short English, options 2–4 values.
- Do not return artboard tags or full HTML documents.`;

export function extractAddTweaksTopic(text: string): string | null {
  const m = text.trim().match(ADD_TWEAKS_PROMPT_RE);
  if (!m?.[1]) return null;
  return m[1].trim().replace(/[.?!\s]+$/g, "") || null;
}

export function buildAddTweaksUserPrompt(opts: {
  topic: string;
  title: string;
  source: string;
  existingKeys: string[];
}): string {
  const truncated =
    opts.source.length > 14000 ? `${opts.source.slice(0, 14000)}\n<!-- truncated -->` : opts.source;
  return `Topic: ${opts.topic}
Artboard title: ${opts.title}
Existing tweak keys (do not reuse): ${opts.existingKeys.join(", ") || "(none)"}

Current HTML:
${truncated}`;
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
  const optionLabels =
    rec.optionLabels && typeof rec.optionLabels === "object" && !Array.isArray(rec.optionLabels)
      ? Object.fromEntries(
          Object.entries(rec.optionLabels as Record<string, unknown>).filter(
            (e): e is [string, string] => typeof e[1] === "string",
          ),
        )
      : undefined;
  return {
    type,
    value: (rec.value as TweakField["value"]) ?? (type === "boolean" ? true : type === "range" ? 1 : ""),
    label: typeof rec.label === "string" ? rec.label : undefined,
    min: typeof rec.min === "number" ? rec.min : undefined,
    max: typeof rec.max === "number" ? rec.max : undefined,
    step: typeof rec.step === "number" ? rec.step : undefined,
    unit: typeof rec.unit === "string" ? rec.unit : undefined,
    options: Array.isArray(rec.options)
      ? rec.options.filter((o): o is string => typeof o === "string" || typeof o === "number").map(String)
      : undefined,
    optionLabels: optionLabels && Object.keys(optionLabels).length ? optionLabels : undefined,
    control:
      rec.control === "radio" || rec.control === "select" || rec.control === "chips"
        ? rec.control
        : type === "select"
          ? "radio"
          : undefined,
    structural: rec.structural === false ? undefined : true,
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
        : type === "boolean"
          ? "visibility"
          : "layout",
  };
}

function isSafeKey(key: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(key);
}

export function sanitizeAddTweaksPayload(
  raw: unknown,
  existingKeys: Set<string>,
): AddTweaksPayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;
  const schemaIn = rec.schema;
  if (!schemaIn || typeof schemaIn !== "object" || Array.isArray(schemaIn)) return null;

  const schema: TweakSchema = {};
  for (const [key, value] of Object.entries(schemaIn as Record<string, unknown>)) {
    if (!isSafeKey(key) || existingKeys.has(key)) continue;
    const field = normalizeField(value);
    if (!field) continue;
    if (field.type === "select" && (!field.options || field.options.length < 2)) continue;
    schema[key] = field;
  }
  if (Object.keys(schema).length === 0) return null;

  let css: string | undefined;
  if (typeof rec.css === "string") {
    css = rec.css.replace(/<\/style/gi, "<\\/style").slice(0, 12000);
  }

  const bindings: ElementBinding[] = [];
  if (Array.isArray(rec.bindings)) {
    for (const item of rec.bindings) {
      if (!item || typeof item !== "object") continue;
      const b = item as Record<string, unknown>;
      if (typeof b.match !== "string" || b.match.length < 2 || b.match.length > 240) continue;
      if (!b.attrs || typeof b.attrs !== "object" || Array.isArray(b.attrs)) continue;
      const attrs: Record<string, string> = {};
      for (const [ak, av] of Object.entries(b.attrs as Record<string, unknown>)) {
        if (!/^[\w:-]+$/.test(ak)) continue;
        if (typeof av !== "string" && typeof av !== "number" && typeof av !== "boolean") continue;
        attrs[ak] = String(av).slice(0, 500);
      }
      if (Object.keys(attrs).length) bindings.push({ match: b.match, attrs });
    }
  }

  return { schema, css, bindings: bindings.length ? bindings : undefined };
}

/** Extract first JSON object from model text (tolerant of fences / prose). */
export function parseAddTweaksResponse(text: string, existingKeys: Set<string>): AddTweaksPayload | null {
  const cleaned = text.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [fence?.[1]?.trim(), cleaned].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const direct = tryParseJson(candidate);
    const sanitized = sanitizeAddTweaksPayload(direct, existingKeys);
    if (sanitized) return sanitized;

    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const sliced = tryParseJson(candidate.slice(start, end + 1));
      const ok = sanitizeAddTweaksPayload(sliced, existingKeys);
      if (ok) return ok;
    }
  }
  return null;
}

function tryParseJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function injectAiCss(source: string, css: string): string {
  const tag = `<style data-atelier-ai-tweaks>\n${css}\n</style>`;
  if (/<style[^>]*data-atelier-ai-tweaks[^>]*>[\s\S]*?<\/style>/i.test(source)) {
    return source.replace(/<style[^>]*data-atelier-ai-tweaks[^>]*>[\s\S]*?<\/style>/i, tag);
  }
  if (/<\/head>/i.test(source)) {
    return source.replace(/<\/head>/i, `${tag}</head>`);
  }
  return `${tag}\n${source}`;
}

function mergeAttrsIntoTag(openTag: string, attrs: Record<string, string>): string {
  let tag = openTag;
  for (const [name, value] of Object.entries(attrs)) {
    const re = new RegExp(
      `\\s${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*=\\s*(["'])[\\s\\S]*?\\1`,
      "i",
    );
    const escaped = value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    if (re.test(tag)) {
      // Do not clobber existing generative bindings (mood copy packs, show/hide, counts).
      if (
        name === "data-copy-for" ||
        name === "data-tweak-show" ||
        name === "data-tweak-count" ||
        name.startsWith("data-copy-")
      ) {
        continue;
      }
      tag = tag.replace(re, ` ${name}="${escaped}"`);
    } else {
      tag = tag.replace(/>$/, ` ${name}="${escaped}">`);
    }
  }
  return tag;
}

function applyBindings(source: string, bindings: ElementBinding[]): string {
  let next = source;
  for (const binding of bindings) {
    const idx = next.indexOf(binding.match);
    if (idx < 0) continue;
    // Walk back to nearest '<' before match, then find that tag's '>'
    const openStart = next.lastIndexOf("<", idx);
    if (openStart < 0) continue;
    const openEnd = next.indexOf(">", openStart);
    if (openEnd < 0) continue;
    const openTag = next.slice(openStart, openEnd + 1);
    if (openTag.startsWith("</") || openTag.startsWith("<!")) continue;
    const merged = mergeAttrsIntoTag(openTag, binding.attrs);
    next = next.slice(0, openStart) + merged + next.slice(openEnd + 1);
  }
  return next;
}

/** Merge AI payload into artboard source + schema without dropping existing knobs. */
export function mergeAddTweaks(
  source: string,
  existingSchema: TweakSchema,
  existingTweaks: TweakMap,
  payload: AddTweaksPayload,
): AddTweaksResult {
  const addedKeys = Object.keys(payload.schema);
  const tweakSchema: TweakSchema = { ...existingSchema, ...payload.schema };
  const tweaks: TweakMap = { ...existingTweaks };
  for (const key of addedKeys) {
    tweaks[key] = payload.schema[key]!.value;
  }

  let nextSource = source;
  if (payload.bindings?.length) {
    nextSource = applyBindings(nextSource, payload.bindings);
  }
  if (payload.css?.trim()) {
    nextSource = injectAiCss(nextSource, payload.css.trim());
  }
  nextSource = applyTweaksToSource(nextSource, tweaks, tweakSchema);

  return { source: nextSource, tweakSchema, tweaks, addedKeys };
}

/** Topic-based deterministic mock for unit/e2e only — never used by the live demo UI. */
export function mockAddTweaksPayload(topic: string, existingKeys: Set<string>): AddTweaksPayload {
  const base = topic.toLowerCase();
  const schema: TweakSchema = {};
  const bindings: ElementBinding[] = [];
  let css = "";

  if (!existingKeys.has("sectionFocus") && /pric|plan|cadence|tier/.test(base)) {
    schema.sectionFocus = {
      type: "select",
      control: "radio",
      value: "balanced",
      options: ["balanced", "value", "premium"],
      optionLabels: { balanced: "Balanced", value: "Value", premium: "Premium" },
      label: "Section focus",
      structural: true,
      group: "layout",
    };
    css += `html[data-section-focus="value"] .ptier:first-child,
html[data-section-focus="value"] .tier:first-child { outline: 2px solid var(--tweak-accent); transform: scale(1.02); }
html[data-section-focus="premium"] .ptier.featured,
html[data-section-focus="premium"] .tier.featured { box-shadow: 0 18px 40px color-mix(in srgb, var(--tweak-accent) 35%, transparent); }
`;
    bindings.push({
      match: "This week’s cadence",
      attrs: {
        "data-copy-for": "sectionFocus",
        "data-copy-balanced": "This week’s cadence",
        "data-copy-value": "More bag, less spend",
        "data-copy-premium": "Summit-first tasting",
      },
    });
    bindings.push({
      match: "Choose a roast cadence",
      attrs: {
        "data-copy-for": "sectionFocus",
        "data-copy-balanced": "Choose a roast cadence",
        "data-copy-value": "Stretch the bag further",
        "data-copy-premium": "Cadence for connoisseurs",
      },
    });
  }

  if (!existingKeys.has("showFooter") && /footer|trust|proof|social|home|hero|xxxxx|general/.test(base)) {
    schema.showFooter = {
      type: "boolean",
      value: true,
      label: "Show footer strip",
      structural: true,
      group: "visibility",
    };
    bindings.push({ match: "<footer", attrs: { "data-tweak-show": "showFooter" } });
  }

  if (!existingKeys.has("heroVoice") && /hero|headline|copy|voice|home|mood|xxxxx/.test(base)) {
    schema.heroVoice = {
      type: "select",
      control: "radio",
      value: "warm",
      options: ["warm", "direct", "bold"],
      optionLabels: { warm: "Warm", direct: "Direct", bold: "Bold" },
      label: "Hero voice",
      structural: true,
      group: "copy",
    };
    css += `html[data-hero-voice="bold"] h1 { letter-spacing: -0.04em; font-size: 1.05em; }
html[data-hero-voice="direct"] .lede { max-width: 34ch; opacity: 0.92; }
html[data-hero-voice="warm"] .hero-kicker { font-style: italic; }
`;
  }

  if (!existingKeys.has("stripDensity") && Object.keys(schema).length < 2) {
    schema.stripDensity = {
      type: "range",
      value: 1,
      min: 0.8,
      max: 1.3,
      step: 0.05,
      label: "Strip density",
      structural: true,
      group: "density",
    };
    css += `section.plans, section.wrap { padding-block: calc(24px * var(--tweak-stripDensity, 1)); }\n`;
  }

  if (Object.keys(schema).length === 0) {
    schema.extraAccent = {
      type: "boolean",
      value: false,
      label: "Accent outline",
      structural: true,
      group: "visibility",
    };
    css += `html[data-extra-accent="on"] .hero, html[data-extra-accent="on"] .wrap { outline: 2px dashed var(--tweak-accent); outline-offset: 6px; }\n`;
  }

  return { schema, css: css || undefined, bindings: bindings.length ? bindings : undefined };
}

export function resolveAddTweaksServerSettings(body?: Partial<ProviderSettings>): ProviderSettings {
  const dashscope = process.env.DASHSCOPE_API_KEY || "";
  const envKey =
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    dashscope ||
    "";
  const hasDashOnly =
    Boolean(dashscope) &&
    !process.env.ANTHROPIC_API_KEY &&
    !process.env.OPENAI_API_KEY &&
    !process.env.OPENROUTER_API_KEY;

  const provider =
    body?.provider ||
    (process.env.ANTHROPIC_API_KEY
      ? "anthropic"
      : hasDashOnly
        ? "compatible"
        : process.env.OPENROUTER_API_KEY
          ? "openrouter"
          : "openai");

  return {
    provider,
    model:
      body?.model ||
      process.env.ATELIER_MODEL ||
      (hasDashOnly ? "qwen-turbo" : provider === "anthropic" ? "claude-sonnet-4-5" : "gpt-4.1-mini"),
    apiKey: body?.apiKey || envKey,
    baseUrl:
      body?.baseUrl ||
      process.env.OPENAI_BASE_URL ||
      (hasDashOnly ? "https://dashscope.aliyuncs.com/compatible-mode/v1" : ""),
  };
}

export { parseTweaksSchema, kebabTweakKey };
