import type { TweakField } from "./types";

/** Looks a designer pre-generates for a live review. */
export const REVIEW_PALETTES: Record<string, Record<string, string>> = {
  ember: { accent: "#c45c26", paper: "#f4efe6", ink: "#1a1612", fxAccent2: "#e58a3a" },
  moss: { accent: "#3d6b4f", paper: "#eef3ea", ink: "#142018", fxAccent2: "#6fae7e" },
  night: { accent: "#d4a054", paper: "#16141c", ink: "#f4efe6", fxAccent2: "#ffe2a8" },
  signal: { accent: "#2f6fed", paper: "#f3f6fb", ink: "#12141a", fxAccent2: "#18b7e8" },
  aurora: { accent: "#8b7bff", paper: "#0b0a14", ink: "#f1efff", fxAccent2: "#4de2ff" },
};

export const PALETTE_LABELS: Record<string, string> = {
  ember: "Ember",
  moss: "Moss",
  night: "Night",
  signal: "Signal",
  aurora: "Aurora",
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
