import { applyLook, lookField, REVIEW_PALETTES } from "./palettes";
import type { Artboard, Project, SharedSection, ThemeSnapshot, TweakMap, TweakSchema } from "./types";

export const THEME_KEYS = ["look", "accent", "paper", "ink", "radius", "density", "type"] as const;

export function defaultThemeSchema(): TweakSchema {
  return {
    look: lookField("ember"),
    accent: {
      type: "color",
      value: REVIEW_PALETTES.ember.accent,
      label: "Accent",
      group: "color",
    },
    paper: { type: "color", value: REVIEW_PALETTES.ember.paper, label: "Paper", group: "color" },
    ink: { type: "color", value: REVIEW_PALETTES.ember.ink, label: "Ink", group: "color" },
    radius: { type: "range", value: 16, min: 0, max: 48, unit: "px", label: "Radius", group: "layout" },
    density: { type: "range", value: 1, min: 0.75, max: 1.35, step: 0.05, label: "Density", group: "density" },
    type: { type: "range", value: 1, min: 0.8, max: 1.3, step: 0.05, label: "Type scale", group: "type" },
  };
}

export function defaultThemeTweaks(): TweakMap {
  return {
    look: "ember",
    ...REVIEW_PALETTES.ember,
    radius: 16,
    density: 1,
    type: 1,
  };
}

export function defaultSections(): Record<string, SharedSection> {
  return {
    header: { id: "header", label: "Header", layout: "split", visible: true, order: 0, variant: "default" },
    hero: { id: "hero", label: "Hero", layout: "split", visible: true, order: 1, variant: "default" },
    pricing: { id: "pricing", label: "Pricing", layout: "split", visible: true, order: 2, variant: "default" },
    story: { id: "story", label: "About", layout: "split", visible: true, order: 3, variant: "default" },
    cta: { id: "cta", label: "CTA", layout: "split", visible: true, order: 4, variant: "default" },
  };
}

export function sectionKey(id: string, prop: keyof SharedSection): string {
  return `sec:${id}:${prop}`;
}

export function encodeSections(sections: Record<string, SharedSection>): TweakMap {
  const map: TweakMap = {};
  for (const s of Object.values(sections)) {
    map[sectionKey(s.id, "layout")] = s.layout;
    map[sectionKey(s.id, "visible")] = s.visible;
    map[sectionKey(s.id, "order")] = s.order;
    map[sectionKey(s.id, "variant")] = s.variant;
  }
  return map;
}

export function parseSectionKey(key: string): { id: string; prop: "layout" | "visible" | "order" | "variant" } | null {
  const m = /^sec:([a-z0-9-]+):(layout|visible|order|variant)$/.exec(key);
  if (!m) return null;
  return { id: m[1]!, prop: m[2] as "layout" | "visible" | "order" | "variant" };
}

export function applySectionPatch(
  sections: Record<string, SharedSection>,
  id: string,
  prop: "layout" | "visible" | "order" | "variant",
  value: string | number | boolean,
): Record<string, SharedSection> {
  const cur = sections[id] ?? {
    id,
    label: id[0]!.toUpperCase() + id.slice(1),
    layout: "split",
    visible: true,
    order: 0,
    variant: "default",
  };
  return {
    ...sections,
    [id]: {
      ...cur,
      [prop]:
        prop === "visible" ? Boolean(value) : prop === "order" ? Number(value) : String(value),
    },
  };
}

export function moveSectionUp(
  sections: Record<string, SharedSection>,
  id: string,
): Record<string, SharedSection> {
  const target = sections[id];
  if (!target) return sections;
  const others = Object.values(sections).filter((s) => s.id !== id);
  const above = others.filter((s) => s.order < target.order).sort((a, b) => b.order - a.order)[0];
  if (!above) {
    return { ...sections, [id]: { ...target, order: Math.max(0, target.order - 1) } };
  }
  return {
    ...sections,
    [id]: { ...target, order: above.order },
    [above.id]: { ...above, order: target.order },
  };
}

export function sectionSchema(sections: Record<string, SharedSection>): TweakSchema {
  const out: TweakSchema = {};
  for (const s of Object.values(sections)) {
    out[sectionKey(s.id, "layout")] = {
      type: "select",
      value: s.layout,
      options: ["split", "stack", "compact"],
      label: `${s.label} layout`,
      group: "layout",
    };
    out[sectionKey(s.id, "visible")] = {
      type: "boolean",
      value: s.visible,
      label: `Show ${s.label}`,
      group: "layout",
    };
    out[sectionKey(s.id, "variant")] = {
      type: "select",
      value: s.variant,
      options: ["default", "featured", "quiet"],
      label: `${s.label} variant`,
      group: "layout",
    };
  }
  return out;
}

export function boardHasToken(board: Artboard, key: string): boolean {
  return key in board.tweakSchema;
}

export function boardHasSection(board: Pick<Artboard, "source">, id: string): boolean {
  return new RegExp(`data-section=["']${id}["']`).test(board.source);
}

export function isTokenUnlinked(board: Artboard, key: string): boolean {
  return (board.unlinked ?? []).includes(key);
}

export function isSectionUnlinked(board: Artboard, id: string): boolean {
  return (board.unlinkedSections ?? []).includes(id);
}

export function isThemeKey(key: string, themeSchema?: TweakSchema): boolean {
  if (parseSectionKey(key)) return false;
  if (themeSchema && key in themeSchema) return true;
  return (THEME_KEYS as readonly string[]).includes(key);
}

export function linkedBoardIds(project: Project, key: string): string[] {
  const sec = parseSectionKey(key);
  return project.artboards
    .filter((b) => {
      if (sec) return boardHasSection(b, sec.id) && !isSectionUnlinked(b, sec.id);
      return boardHasToken(b, key) && !isTokenUnlinked(b, key);
    })
    .map((b) => b.id);
}

export function linkedBoardCount(project: Project, key: string): number {
  return linkedBoardIds(project, key).length;
}

export function resolveBoardTweaks(
  project: Pick<Project, "theme" | "sections" | "componentTweaks">,
  board: Artboard,
): TweakMap {
  const next = { ...board.tweaks };
  const theme = project.theme ?? {};
  for (const [key, value] of Object.entries(theme)) {
    const usesToken = boardHasToken(board, key) || (isThemeKey(key) && Boolean(board.page));
    if (!isTokenUnlinked(board, key) && usesToken) {
      next[key] = value;
    }
  }
  if (board.kind === "dc" && board.dcPath) {
    const shared = project.componentTweaks?.[board.dcPath];
    if (shared && !isTokenUnlinked(board, "*component")) {
      for (const [k, v] of Object.entries(shared)) {
        if (!isTokenUnlinked(board, k)) next[k] = v;
      }
    }
  }
  for (const [key, value] of Object.entries(encodeSections(project.sections ?? {}))) {
    const sec = parseSectionKey(key);
    if (!sec || !boardHasSection(board, sec.id) || isSectionUnlinked(board, sec.id)) continue;
    next[key] = value;
  }
  return next;
}

export function snapshotTheme(project: Project): ThemeSnapshot {
  return {
    theme: { ...(project.theme ?? {}) },
    sections: structuredClone(project.sections ?? {}),
    componentTweaks: structuredClone(project.componentTweaks ?? {}),
    boards: Object.fromEntries(project.artboards.map((b) => [b.id, { ...b.tweaks }])),
  };
}

export function applyLookToTheme(theme: TweakMap, lookId: string): TweakMap {
  return applyLook(theme, lookId);
}
