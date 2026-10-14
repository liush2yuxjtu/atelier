import type { TweakField } from "./types";

/** Looks a designer pre-generates for a live review. */
export const REVIEW_PALETTES: Record<string, Record<string, string>> = {
  ember: { accent: "#c45c26", paper: "#f4efe6", ink: "#1a1612" },
  moss: { accent: "#3d6b4f", paper: "#eef3ea", ink: "#142018" },
  night: { accent: "#d4a054", paper: "#16141c", ink: "#f4efe6" },
  signal: { accent: "#2f6fed", paper: "#f3f6fb", ink: "#12141a" },
};

export const PALETTE_LABELS: Record<string, string> = {
  ember: "Ember",
  moss: "Moss",
  night: "Night",
  signal: "Signal",
};

export function lookField(value = "ember"): TweakField {
  return {
    type: "palette",
    value,
    label: "Look",
    group: "color",
    options: Object.keys(REVIEW_PALETTES),
    swatches: REVIEW_PALETTES,
  };
}

export function applyLook(
  tweaks: Record<string, string | number | boolean>,
  lookId: string,
  swatches: Record<string, Record<string, string>> = REVIEW_PALETTES,
): Record<string, string | number | boolean> {
  const pack = swatches[lookId] ?? {};
  return { ...tweaks, look: lookId, ...pack };
}
