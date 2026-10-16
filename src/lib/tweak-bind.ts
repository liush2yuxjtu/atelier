import { lookField } from "./palettes";
import { parseTweaksSchema } from "./tweaks";
import type { TweakField, TweakMap, TweakSchema } from "./types";

export type DesignKind = "landing" | "dashboard" | "pricing" | "generic";

export const GENERATIVE_KEYS = new Set([
  "mood",
  "spacing",
  "ctaWeight",
  "socialProof",
  "metricDensity",
  "sparkline",
  "planCount",
  "highlight",
  "billing",
]);

/** Token/inspector knobs — not the generative set prepared for a design. */
export const INSPECTOR_KEYS = new Set(["radius", "density", "type", "headline", "paper", "ink"]);

export function isGenerativeKey(key: string, field?: TweakField): boolean {
  return GENERATIVE_KEYS.has(key) || field?.structural === true;
}

export function kebabTweakKey(key: string): string {
  return String(key)
    .replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
    .replace(/^-/, "");
}

export function tweakAttrValue(value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "on" : "off";
  return String(value);
}

export function optionLabel(field: TweakField, option: string): string {
  if (field.optionLabels?.[option]) return field.optionLabels[option]!;
  if (field.label === "Plan count" || field.label?.toLowerCase().includes("plan")) {
    if (/^\d+$/.test(option)) return `${option} plans`;
  }
  if (option === "saas") return "SaaS";
  if (option.length <= 1) return option;
  return option[0]!.toUpperCase() + option.slice(1);
}

function truthy(value: string | number | boolean | undefined): boolean {
  return value === true || value === 1 || value === "1" || value === "true" || value === "on";
}

/**
 * Live-bind tweak values onto a document: data-* attrs, copy packs, show/hide
 * blocks, and counted children. Does not regenerate markup.
 */
export function applyTweakBindings(doc: Document, tweaks: TweakMap, schema?: TweakSchema): void {
  const root = doc.documentElement;
  const body = doc.body;
  for (const [key, raw] of Object.entries(tweaks)) {
    const field = schema?.[key];
    let css = raw;
    if (typeof css === "boolean") css = css ? "1" : "0";
    else if (typeof css === "number" && field?.unit) css = `${css}${field.unit}`;
    root.style.setProperty(`--tweak-${key}`, String(css));

    const attr = tweakAttrValue(raw);
    const dataKey = kebabTweakKey(key);
    root.setAttribute(`data-${dataKey}`, attr);
    if (body) body.setAttribute(`data-${dataKey}`, attr);

    doc.querySelectorAll(`[data-copy-for="${cssEscape(key)}"]`).forEach((node) => {
      const pack = node.getAttribute(`data-copy-${String(raw)}`);
      if (pack != null) node.textContent = pack;
    });

    doc.querySelectorAll(`[data-tweak-show="${cssEscape(key)}"]`).forEach((node) => {
      const on = truthy(raw);
      if (!(node instanceof Element)) return;
      if (node instanceof HTMLElement) node.hidden = !on;
      (node as HTMLElement).style.display = on ? "" : "none";
    });

    doc.querySelectorAll(`[data-tweak-count="${cssEscape(key)}"]`).forEach((el) => {
      const n = Number(raw);
      Array.from(el.children).forEach((child, i) => {
        if (child instanceof Element) (child as HTMLElement).style.display = i < n ? "" : "none";
      });
    });

    doc.querySelectorAll(`[data-tweak="${cssEscape(key)}"]`).forEach((node) => {
      if (field?.type === "text" || typeof raw === "string") {
        if (!node.hasAttribute("data-copy-for")) node.textContent = String(raw);
      }
    });
  }

  const billing = tweaks.billing;
  if (billing != null) {
    doc.querySelectorAll("[data-price-monthly]").forEach((node) => {
      const monthly = node.getAttribute("data-price-monthly");
      const yearly = node.getAttribute("data-price-yearly");
      const amount = String(billing) === "yearly" ? yearly : monthly;
      if (amount == null) return;
      const unit = node.querySelector("small, .price-unit");
      const prefix = node.querySelector(".price-amount");
      if (prefix) prefix.textContent = amount;
      else if (unit) {
        node.childNodes.forEach((child) => {
          if (child.nodeType === 3) child.textContent = amount + " ";
        });
      } else {
        node.textContent = amount;
      }
    });
  }
}

function cssEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function detectDesignKind(source: string): DesignKind {
  if (/data-copy-editorial|hero-kicker|data-tweak-show=["']socialProof["']/i.test(source)) {
    return "landing";
  }
  if (
    /data-tweak-count=["']planCount["']|data-price-monthly|Choose a roast cadence/i.test(source)
  ) {
    return "pricing";
  }
  if (
    /metric-grid|data-metric-density|data-tweak-show=["']sparkline["']/i.test(source)
  ) {
    return "dashboard";
  }
  if (/data-section=["']hero["']|class=["'][^"']*\bhero\b|hero-card/i.test(source)) {
    return "landing";
  }
  return "generic";
}

function lookFrom(source: string, declared: TweakSchema): TweakField {
  const current =
    typeof declared.look?.value === "string" ? String(declared.look.value) : "ember";
  return lookField(current);
}

export function landingKnobSchema(source: string, declared: TweakSchema): TweakSchema {
  return {
    mood: {
      type: "select",
      control: "radio",
      value: typeof declared.mood?.value === "string" ? String(declared.mood.value) : "saas",
      options: ["editorial", "saas", "playful"],
      optionLabels: { editorial: "Editorial", saas: "SaaS", playful: "Playful" },
      label: "Mood",
      group: "layout",
      structural: true,
    },
    spacing: {
      type: "range",
      value: typeof declared.spacing?.value === "number" ? Number(declared.spacing.value) : 1,
      min: 0.75,
      max: 1.35,
      step: 0.05,
      label: "Spacing intensity",
      group: "density",
      structural: true,
    },
    look: lookFrom(source, declared),
    ctaWeight: {
      type: "select",
      control: "radio",
      value: typeof declared.ctaWeight?.value === "string" ? String(declared.ctaWeight.value) : "bold",
      options: ["regular", "bold"],
      optionLabels: { regular: "Regular", bold: "Bold" },
      label: "CTA weight",
      group: "layout",
      structural: true,
    },
    socialProof: {
      type: "boolean",
      value: declared.socialProof?.value === false ? false : true,
      label: "Show social proof",
      group: "visibility",
      structural: true,
    },
  };
}

export function dashboardKnobSchema(source: string, declared: TweakSchema): TweakSchema {
  return {
    metricDensity: {
      type: "select",
      control: "radio",
      value:
        typeof declared.metricDensity?.value === "string"
          ? String(declared.metricDensity.value)
          : "comfortable",
      options: ["comfortable", "compact", "dense"],
      optionLabels: { comfortable: "Comfortable", compact: "Compact", dense: "Dense" },
      label: "Metric density",
      group: "layout",
      structural: true,
    },
    sparkline: {
      type: "boolean",
      value: declared.sparkline?.value === false ? false : true,
      label: "Accent sparkline",
      group: "visibility",
      structural: true,
    },
    look: lookFrom(source, declared),
  };
}

export function pricingKnobSchema(source: string, declared: TweakSchema): TweakSchema {
  const count =
    typeof declared.planCount?.value === "number"
      ? Number(declared.planCount.value)
      : Number(declared.planCount?.value) || 3;
  return {
    planCount: {
      type: "select",
      control: "radio",
      value: count,
      options: ["2", "3", "4"],
      optionLabels: { "2": "2 plans", "3": "3 plans", "4": "4 plans" },
      label: "Plan count",
      group: "layout",
      structural: true,
    },
    highlight: {
      type: "boolean",
      value: declared.highlight?.value === false ? false : true,
      label: "Highlight recommended",
      group: "visibility",
      structural: true,
    },
    billing: {
      type: "select",
      control: "radio",
      value: typeof declared.billing?.value === "string" ? String(declared.billing.value) : "monthly",
      options: ["monthly", "yearly"],
      optionLabels: { monthly: "Monthly", yearly: "Yearly" },
      label: "Billing",
      group: "layout",
      structural: true,
    },
    look: lookFrom(source, declared),
  };
}

export function genericKnobSchema(source: string, declared: TweakSchema): TweakSchema {
  const schema: TweakSchema = {
    look: lookFrom(source, declared),
  };
  if (declared.headline || /data-tweak=["']headline["']/.test(source)) {
    schema.headline = {
      type: "text",
      value: (declared.headline?.value as string) || "",
      label: "Headline",
      group: "copy",
    };
  }
  if (declared.layout || (/grid-template-columns/.test(source) && !declared.mood)) {
    schema.layout = {
      type: "select",
      control: "radio",
      value: typeof declared.layout?.value === "string" ? String(declared.layout.value) : "split",
      options: ["split", "stack"],
      label: "Layout",
      group: "layout",
      structural: true,
    };
  }
  return schema;
}

export function schemaForKind(kind: DesignKind, source: string, declared: TweakSchema): TweakSchema {
  switch (kind) {
    case "landing":
      return landingKnobSchema(source, declared);
    case "dashboard":
      return dashboardKnobSchema(source, declared);
    case "pricing":
      return pricingKnobSchema(source, declared);
    default:
      return genericKnobSchema(source, declared);
  }
}

/** Infer the contextual knob set prepared for this design. Declared fields win. */
export function inferGenerativeSchema(source: string): TweakSchema {
  const declared = parseTweaksSchema(source);
  const kind = detectDesignKind(source);
  const generated = schemaForKind(kind, source, declared);
  return { ...generated, ...declared };
}

export const CROSS_CANVAS_KEYS = ["look", "accent", "paper", "ink", "fxAccent2"] as const;

export function mapAcrossCanvas(source: TweakMap, target: TweakMap): TweakMap {
  const next = { ...target };
  for (const key of CROSS_CANVAS_KEYS) {
    if (source[key] !== undefined) next[key] = source[key]!;
  }
  return next;
}
