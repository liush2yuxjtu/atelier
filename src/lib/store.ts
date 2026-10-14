"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  Artboard,
  PinComment,
  Project,
  ProviderSettings,
  StudioMode,
  TweakMap,
  TweakSchema,
  TweakVariant,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { createBlankProject, createDemoProject } from "./demo";
import { loadProject, saveProject } from "./storage";
import { loadSettings, saveSettings } from "./providers";
import { applyTweaksToSource, mapsEqual, schemaToMap } from "./tweaks";
import { applyLook } from "./palettes";
import { enrichSchema } from "./infer-tweaks";
import {
  applySectionPatch,
  defaultSections,
  defaultThemeSchema,
  defaultThemeTweaks,
  encodeSections,
  isSectionUnlinked,
  isThemeKey,
  isTokenUnlinked,
  moveSectionUp,
  THEME_KEYS,
  parseSectionKey,
  resolveBoardTweaks,
  sectionSchema,
  snapshotTheme,
} from "./theme";
import type { SharedSection } from "./types";
import { layoutNewArtboards, parseStreaming, type ParsedCommand } from "./agent/parse";
import {
  dependentsOf,
  filesFromList,
  flattenAllSafe,
  schemaToTweakSchema,
  setFileProps,
  tweakMapFromSchema,
} from "./dc";

interface StudioStore {
  project: Project | null;
  settings: ProviderSettings;
  busy: boolean;
  hydrated: boolean;
  hydrate: (id: string) => Promise<void>;
  persist: () => void;
  setSettings: (s: ProviderSettings) => void;
  setName: (name: string) => void;
  setCanvas: (canvas: Project["canvas"]) => void;
  setMode: (mode: StudioMode) => void;
  selectArtboard: (id: string | null) => void;
  updateArtboard: (id: string, patch: Partial<Artboard>) => void;
  addArtboard: (partial?: Partial<Artboard>) => string;
  duplicateArtboard: (id: string) => string | null;
  removeArtboard: (id: string) => void;
  arrangeArtboards: () => void;
  setTweaks: (id: string, tweaks: TweakMap) => void;
  undoTweaks: (id: string) => void;
  redoTweaks: (id: string) => void;
  applyPalette: (id: string, lookId: string) => void;
  saveVariant: (id: string, label: string) => string | null;
  approveLook: (id: string) => string | null;
  setCompare: (variantId: string | null) => void;
  setPresenting: (on: boolean) => void;
  generateKnobs: (id: string) => void;
  unlinkTweak: (id: string, key: string) => void;
  pushOverride: (id: string, key: string) => void;
  moveSharedSection: (id: string, sectionId: string) => void;
  addComment: (id: string, comment: Omit<PinComment, "id" | "createdAt">) => void;
  resolveComment: (artboardId: string, commentId: string) => void;
  applySelection: (
    artboardId: string,
    sel: { selector: string; text: string; styles: Record<string, string> },
  ) => void;
  applySourceEdit: (artboardId: string, selector: string, kind: "text" | "style", value: string | Record<string, string>) => void;
  snapshot: (label: string) => void;
  restoreVersion: (versionId: string) => void;
  addMessage: (role: Project["messages"][number]["role"], content: string) => string;
  appendMessage: (id: string, chunk: string) => void;
  applyParsed: (parsed: ParsedCommand, streaming: boolean) => void;
  writeFile: (path: string, content: string) => void;
  placeDc: (path: string, at?: { x: number; y: number }) => string | null;
  setBusy: (busy: boolean) => void;
}

const LOOK_PACK_KEYS = ["accent", "paper", "ink", "fxAccent2"];

function touch(p: Project): Project {
  return { ...p, updatedAt: Date.now() };
}

function normalizeProject(p: Project): Project {
  const theme = p.theme ?? defaultThemeTweaks();
  const themeSchema = p.themeSchema ?? defaultThemeSchema();
  const sections = p.sections ?? defaultSections();
  return {
    ...p,
    presenting: p.presenting ?? false,
    compareVariantId: p.compareVariantId ?? null,
    theme,
    themeSchema,
    sections,
    componentTweaks: p.componentTweaks ?? {},
    themeUndo: p.themeUndo ?? [],
    themeRedo: p.themeRedo ?? [],
    artboards: p.artboards.map((b) => ({
      ...b,
      tweakUndo: b.tweakUndo ?? [],
      tweakRedo: b.tweakRedo ?? [],
      variants: b.variants ?? [],
      approvedVariantId: b.approvedVariantId ?? null,
      unlinked: b.unlinked ?? [],
      unlinkedSections: b.unlinkedSections ?? [],
    })),
  };
}

function paintTweaks(b: Artboard, tweaks: TweakMap, files: ReturnType<typeof filesFromList>): Artboard {
  if (mapsEqual(b.tweaks, tweaks)) return b;
  if (b.kind === "dc" && b.dcPath) {
    const flat = flattenAllSafe(b.dcPath, files, tweaks);
    return {
      ...b,
      tweaks,
      dcProps: tweaks,
      source: flat.html,
      version: b.version + 1,
      error: flat.error ?? null,
    };
  }
  return {
    ...b,
    tweaks,
    source: applyTweaksToSource(b.source, tweaks, b.tweakSchema),
  };
}

function withTweaks(b: Artboard, tweaks: TweakMap, files: ReturnType<typeof filesFromList>): Artboard {
  if (mapsEqual(b.tweaks, tweaks)) return b;
  const painted = paintTweaks(b, tweaks, files);
  return {
    ...painted,
    tweakUndo: [...(b.tweakUndo ?? []), b.tweaks].slice(-40),
    tweakRedo: [],
  };
}

function propagate(
  project: Project,
  files: ReturnType<typeof filesFromList>,
  theme: TweakMap,
  sections: Record<string, SharedSection>,
  componentTweaks: Record<string, TweakMap>,
): Artboard[] {
  const layer = { theme, sections, componentTweaks };
  return project.artboards.map((b) => paintTweaks(b, resolveBoardTweaks(layer, b), files));
}

export const useStudio = create<StudioStore>((set, get) => ({
  project: null,
  settings: DEFAULT_SETTINGS,
  busy: false,
  hydrated: false,

  hydrate: async (id: string) => {
    const settings = loadSettings();
    let project = await loadProject(id);
    if (!project) {
      project = id === "demo" ? createDemoProject("demo") : createBlankProject();
      project.id = id === "new" ? project.id : id;
      if (id === "new") {
        /* keep generated id */
      } else {
        project.id = id;
      }
      await saveProject(project);
    } else if (id === "demo" && !project.files.some((f) => f.path === "RoastGrid.dc.html")) {
      project = createDemoProject("demo");
      await saveProject(project);
    } else if (id === "demo") {
      const landing = project.artboards.find((b) => b.id === "ab-landing");
      const about = project.artboards.find((b) => b.id === "ab-about");
      if (!landing?.tweakSchema?.look || !about || !project.theme) {
        project = createDemoProject("demo");
        await saveProject(project);
      }
    }
    set({ project: normalizeProject(project), settings, hydrated: true });
  },

  persist: () => {
    const p = get().project;
    if (p) void saveProject(p);
  },

  setSettings: (s) => {
    saveSettings(s);
    set({ settings: s });
  },

  setName: (name) => {
    const p = get().project;
    if (!p) return;
    set({ project: touch({ ...p, name }) });
    get().persist();
  },

  setCanvas: (canvas) => {
    const p = get().project;
    if (!p) return;
    set({ project: { ...p, canvas } });
  },

  setMode: (mode) => {
    const p = get().project;
    if (!p) return;
    set({ project: { ...p, mode } });
  },

  selectArtboard: (id) => {
    const p = get().project;
    if (!p) return;
    set({
      project: {
        ...p,
        selectedArtboardId: id,
        selectedSelector: null,
        selectedStyles: null,
        selectedText: null,
      },
    });
  },

  updateArtboard: (id, patch) => {
    const p = get().project;
    if (!p) return;
    set({
      project: touch({
        ...p,
        artboards: p.artboards.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      }),
    });
    get().persist();
  },

  addArtboard: (partial = {}) => {
    const p = get().project;
    if (!p) return "";
    const id = partial.id || nanoid(8);
    const schema = enrichSchema(partial.source || "");
    const board: Artboard = {
      id,
      title: partial.title || "Artboard",
      kind: partial.kind || "html",
      source: partial.source || "<!DOCTYPE html><html><body><h1>New artboard</h1></body></html>",
      x: partial.x ?? 80 + p.artboards.length * 40,
      y: partial.y ?? 80 + p.artboards.length * 40,
      width: partial.width ?? 1280,
      height: partial.height ?? 800,
      tweaks: partial.tweaks ?? schemaToMap(schema),
      tweakSchema: partial.tweakSchema ?? schema,
      comments: partial.comments ?? [],
      error: null,
      status: "ready",
      autoFixed: false,
      version: 1,
      dcPath: partial.dcPath,
      dcProps: partial.dcProps,
    };
    set({
      project: touch({
        ...p,
        artboards: [...p.artboards, board],
        selectedArtboardId: id,
      }),
    });
    get().persist();
    return id;
  },

  duplicateArtboard: (id) => {
    const p = get().project;
    if (!p) return null;
    const src = p.artboards.find((b) => b.id === id);
    if (!src) return null;
    const nextId = nanoid(8);
    const copy: Artboard = {
      ...structuredClone(src),
      id: nextId,
      title: src.title + " copy",
      x: src.x + 60,
      y: src.y + 60,
      comments: [],
    };
    set({
      project: touch({
        ...p,
        artboards: [...p.artboards, copy],
        selectedArtboardId: nextId,
      }),
    });
    get().persist();
    return nextId;
  },

  removeArtboard: (id) => {
    const p = get().project;
    if (!p) return;
    set({
      project: touch({
        ...p,
        artboards: p.artboards.filter((b) => b.id !== id),
        selectedArtboardId: p.selectedArtboardId === id ? null : p.selectedArtboardId,
      }),
    });
    get().persist();
  },

  arrangeArtboards: () => {
    const p = get().project;
    if (!p) return;
    let x = 80;
    const y = 80;
    const gap = 80;
    set({
      project: touch({
        ...p,
        artboards: p.artboards.map((b) => {
          const next = { ...b, x, y };
          x += b.width + gap;
          return next;
        }),
      }),
    });
    get().persist();
  },

  setTweaks: (id, tweaks) => {
    const p = get().project;
    if (!p) return;
    const board = p.artboards.find((b) => b.id === id);
    if (!board) return;
    const files = filesFromList(p.files);
    const snap = snapshotTheme(p);
    let theme = { ...(p.theme ?? defaultThemeTweaks()) };
    let sections = { ...(p.sections ?? defaultSections()) };
    let componentTweaks = { ...(p.componentTweaks ?? {}) };

    for (const [key, value] of Object.entries(tweaks)) {
      if (board.tweaks[key] === value) continue;
      const sec = parseSectionKey(key);
      if (sec) {
        if (!isSectionUnlinked(board, sec.id)) {
          sections = applySectionPatch(sections, sec.id, sec.prop, value);
        }
        continue;
      }
      if (board.kind === "dc" && board.dcPath && !isTokenUnlinked(board, "*component") && !isTokenUnlinked(board, key)) {
        componentTweaks = {
          ...componentTweaks,
          [board.dcPath]: { ...(componentTweaks[board.dcPath] ?? {}), [key]: value },
        };
        continue;
      }
      if (isThemeKey(key, p.themeSchema) && !isTokenUnlinked(board, key)) {
        theme = { ...theme, [key]: value };
      }
    }

    const withLocal = p.artboards.map((b) =>
      b.id === id ? { ...b, tweaks: { ...b.tweaks, ...tweaks } } : b,
    );
    const artboards = propagate(
      { ...p, artboards: withLocal, theme, sections, componentTweaks },
      files,
      theme,
      sections,
      componentTweaks,
    ).map((b) =>
      b.id === id
        ? { ...b, tweakUndo: [...(board.tweakUndo ?? []), board.tweaks].slice(-40), tweakRedo: [] }
        : b,
    );

    set({
      project: touch({
        ...p,
        theme,
        sections,
        componentTweaks,
        artboards,
        themeUndo: [...(p.themeUndo ?? []), snap].slice(-40),
        themeRedo: [],
      }),
    });
    get().persist();
  },

  undoTweaks: (id) => {
    const p = get().project;
    if (!p) return;
    const files = filesFromList(p.files);
    const stack = p.themeUndo ?? [];
    if (stack.length > 0) {
      const prev = stack[stack.length - 1]!;
      const now = snapshotTheme(p);
      const artboards = p.artboards.map((b) =>
        paintTweaks(b, prev.boards[b.id] ?? resolveBoardTweaks(prev, b), files),
      );
      set({
        project: touch({
          ...p,
          theme: prev.theme,
          sections: prev.sections,
          componentTweaks: prev.componentTweaks,
          artboards,
          themeUndo: stack.slice(0, -1),
          themeRedo: [now, ...(p.themeRedo ?? [])].slice(0, 40),
        }),
      });
      get().persist();
      return;
    }
    set({
      project: touch({
        ...p,
        artboards: p.artboards.map((b) => {
          if (b.id !== id) return b;
          const local = b.tweakUndo ?? [];
          if (local.length === 0) return b;
          const prev = local[local.length - 1]!;
          const patched = withTweaks(b, prev, files);
          return {
            ...patched,
            tweakUndo: local.slice(0, -1),
            tweakRedo: [b.tweaks, ...(b.tweakRedo ?? [])].slice(0, 40),
          };
        }),
      }),
    });
    get().persist();
  },

  redoTweaks: (id) => {
    const p = get().project;
    if (!p) return;
    const files = filesFromList(p.files);
    const redo = p.themeRedo ?? [];
    if (redo.length > 0) {
      const next = redo[0]!;
      const now = snapshotTheme(p);
      const artboards = p.artboards.map((b) =>
        paintTweaks(b, next.boards[b.id] ?? resolveBoardTweaks(next, b), files),
      );
      set({
        project: touch({
          ...p,
          theme: next.theme,
          sections: next.sections,
          componentTweaks: next.componentTweaks,
          artboards,
          themeUndo: [...(p.themeUndo ?? []), now].slice(-40),
          themeRedo: redo.slice(1),
        }),
      });
      get().persist();
      return;
    }
    set({
      project: touch({
        ...p,
        artboards: p.artboards.map((b) => {
          if (b.id !== id) return b;
          const local = b.tweakRedo ?? [];
          const next = local[0];
          if (!next) return b;
          const applied = withTweaks({ ...b, tweakRedo: [] }, next, files);
          return { ...applied, tweakRedo: local.slice(1) };
        }),
      }),
    });
    get().persist();
  },

  applyPalette: (id, lookId) => {
    const p = get().project;
    if (!p) return;
    const board = p.artboards.find((b) => b.id === id);
    if (!board) return;
    const field = board.tweakSchema.look ?? p.themeSchema?.look;
    const next = applyLook({ ...(p.theme ?? board.tweaks) }, lookId, field?.swatches);
    get().setTweaks(id, { ...board.tweaks, ...next });
  },

  saveVariant: (id, label) => {
    const p = get().project;
    if (!p) return null;
    const variant: TweakVariant = {
      id: nanoid(8),
      label,
      tweaks: { ...(p.artboards.find((b) => b.id === id)?.tweaks ?? {}) },
      createdAt: Date.now(),
      theme: { ...(p.theme ?? {}) },
      sections: structuredClone(p.sections ?? {}),
    };
    set({
      project: touch({
        ...p,
        artboards: p.artboards.map((b) =>
          b.id === id ? { ...b, variants: [variant, ...(b.variants ?? [])].slice(0, 20) } : b,
        ),
      }),
    });
    get().persist();
    return variant.id;
  },

  approveLook: (id) => {
    const saved = get().saveVariant(id, "Approved");
    const p = get().project;
    if (!p || !saved) return null;
    set({
      project: touch({
        ...p,
        compareVariantId: null,
        artboards: p.artboards.map((b) => (b.id === id ? { ...b, approvedVariantId: saved } : b)),
      }),
    });
    get().persist();
    return saved;
  },

  setCompare: (variantId) => {
    const p = get().project;
    if (!p) return;
    set({ project: { ...p, compareVariantId: variantId } });
  },

  setPresenting: (on) => {
    const p = get().project;
    if (!p) return;
    if (on && p.selectedArtboardId) {
      const board = p.artboards.find((b) => b.id === p.selectedArtboardId);
      if (board && !(board.variants ?? []).some((v) => v.label === "Before")) {
        get().saveVariant(p.selectedArtboardId, "Before");
      }
    }
    const next = get().project ?? p;
    set({
      project: {
        ...next,
        presenting: on,
        mode: on ? "preview" : next.mode,
        compareVariantId: on ? next.compareVariantId : null,
      },
    });
  },

  generateKnobs: (id) => {
    const p = get().project;
    if (!p) return;
    const snap = snapshotTheme(p);
    const themeSchema = { ...defaultThemeSchema(), ...(p.themeSchema ?? {}) };
    let theme = { ...defaultThemeTweaks(), ...(p.theme ?? {}) };
    const files = filesFromList(p.files);
    const sections = p.sections ?? defaultSections();
    const structural = sectionSchema(sections);
    const artboards = p.artboards.map((b) => {
      const schema = enrichSchema(b.source);
      const extra =
        b.id === id || b.page
          ? { ...pickThemeFields(schema), ...(b.page ? structural : {}) }
          : {};
      const mergedSchema = { ...b.tweakSchema, ...extra };
      const nextBoard = { ...b, tweakSchema: mergedSchema, tweaks: { ...b.tweaks, ...schemaToMap(extra) } };
      return paintTweaks(nextBoard, resolveBoardTweaks({ theme, sections, componentTweaks: p.componentTweaks ?? {} }, nextBoard), files);
    });
    const source = artboards.find((b) => b.id === id);
    if (source) {
      theme = { ...theme, ...pickThemeValues(source.tweaks) };
    }
    set({
      project: touch({
        ...p,
        theme,
        themeSchema,
        sections: p.sections ?? defaultSections(),
        artboards,
        themeUndo: [...(p.themeUndo ?? []), snap].slice(-40),
        themeRedo: [],
      }),
    });
    get().persist();
  },

  unlinkTweak: (id, key) => {
    const p = get().project;
    if (!p) return;
    set({
      project: touch({
        ...p,
        artboards: p.artboards.map((b) => {
          if (b.id !== id) return b;
          const sec = parseSectionKey(key);
          if (sec) {
            return { ...b, unlinkedSections: [...new Set([...(b.unlinkedSections ?? []), sec.id])] };
          }
          // A Look is a pack (accent, paper, ink, glow): unlinking it detaches the
          // whole pack so "keep this page different" really keeps it different.
          const keys = key === "look" ? [key, ...LOOK_PACK_KEYS] : [key];
          return { ...b, unlinked: [...new Set([...(b.unlinked ?? []), ...keys])] };
        }),
      }),
    });
    get().persist();
  },

  pushOverride: (id, key) => {
    const p = get().project;
    if (!p) return;
    const board = p.artboards.find((b) => b.id === id);
    if (!board) return;
    const files = filesFromList(p.files);
    const snap = snapshotTheme(p);
    const sec = parseSectionKey(key);
    let theme = { ...(p.theme ?? {}) };
    let sections = { ...(p.sections ?? {}) };
    let componentTweaks = { ...(p.componentTweaks ?? {}) };
    let artboards = p.artboards;
    if (sec) {
      const value = board.tweaks[key];
      if (value !== undefined) sections = applySectionPatch(sections, sec.id, sec.prop, value);
      artboards = artboards.map((b) => ({
        ...b,
        unlinkedSections: (b.unlinkedSections ?? []).filter((s) => s !== sec.id),
      }));
    } else if (board.kind === "dc" && board.dcPath) {
      componentTweaks = { ...componentTweaks, [board.dcPath]: { ...board.tweaks } };
      artboards = artboards.map((b) => ({
        ...b,
        unlinked: (b.unlinked ?? []).filter((k) => k !== key && k !== "*component"),
      }));
    } else {
      const keys = key === "look" ? [key, ...LOOK_PACK_KEYS] : [key];
      for (const k of keys) {
        if (board.tweaks[k] !== undefined) theme = { ...theme, [k]: board.tweaks[k] };
      }
      artboards = artboards.map((b) => ({
        ...b,
        unlinked: (b.unlinked ?? []).filter((k) => !keys.includes(k)),
      }));
    }
    const painted = propagate({ ...p, artboards, theme, sections, componentTweaks }, files, theme, sections, componentTweaks);
    set({
      project: touch({
        ...p,
        theme,
        sections,
        componentTweaks,
        artboards: painted,
        themeUndo: [...(p.themeUndo ?? []), snap].slice(-40),
        themeRedo: [],
      }),
    });
    get().persist();
  },

  moveSharedSection: (id, sectionId) => {
    const p = get().project;
    if (!p) return;
    const board = p.artboards.find((b) => b.id === id);
    if (!board || isSectionUnlinked(board, sectionId)) return;
    const snap = snapshotTheme(p);
    const sections = moveSectionUp(p.sections ?? defaultSections(), sectionId);
    const files = filesFromList(p.files);
    const theme = p.theme ?? defaultThemeTweaks();
    const componentTweaks = p.componentTweaks ?? {};
    set({
      project: touch({
        ...p,
        sections,
        artboards: propagate(p, files, theme, sections, componentTweaks),
        themeUndo: [...(p.themeUndo ?? []), snap].slice(-40),
        themeRedo: [],
      }),
    });
    get().persist();
  },

  addComment: (id, comment) => {
    const p = get().project;
    if (!p) return;
    const pin: PinComment = {
      ...comment,
      id: nanoid(8),
      createdAt: Date.now(),
    };
    set({
      project: touch({
        ...p,
        artboards: p.artboards.map((b) =>
          b.id === id ? { ...b, comments: [...b.comments, pin] } : b,
        ),
      }),
    });
    get().persist();
  },

  resolveComment: (artboardId, commentId) => {
    const p = get().project;
    if (!p) return;
    set({
      project: touch({
        ...p,
        artboards: p.artboards.map((b) =>
          b.id === artboardId
            ? {
                ...b,
                comments: b.comments.map((c) =>
                  c.id === commentId ? { ...c, resolved: true, queued: false } : c,
                ),
              }
            : b,
        ),
      }),
    });
    get().persist();
  },

  applySelection: (artboardId, sel) => {
    const p = get().project;
    if (!p) return;
    set({
      project: {
        ...p,
        selectedArtboardId: artboardId,
        selectedSelector: sel.selector,
        selectedText: sel.text,
        selectedStyles: sel.styles,
      },
    });
  },

  applySourceEdit: (artboardId, selector, kind, value) => {
    const p = get().project;
    if (!p) return;
    set({
      project: touch({
        ...p,
        artboards: p.artboards.map((b) => {
          if (b.id !== artboardId) return b;
          if (kind === "text" && typeof value === "string") {
            return { ...b, version: b.version + 1 };
          }
          return { ...b, version: b.version + 1 };
        }),
        selectedText: kind === "text" && typeof value === "string" ? value : p.selectedText,
        selectedStyles:
          kind === "style" && typeof value === "object" ? { ...p.selectedStyles, ...value } : p.selectedStyles,
      }),
    });
    void selector;
    get().persist();
  },

  snapshot: (label) => {
    const p = get().project;
    if (!p) return;
    set({
      project: touch({
        ...p,
        versions: [
          {
            id: nanoid(8),
            label,
            createdAt: Date.now(),
            artboards: structuredClone(p.artboards),
            files: structuredClone(p.files),
          },
          ...p.versions,
        ].slice(0, 40),
      }),
    });
    get().persist();
  },

  restoreVersion: (versionId) => {
    const p = get().project;
    if (!p) return;
    const v = p.versions.find((x) => x.id === versionId);
    if (!v) return;
    set({
      project: touch({
        ...p,
        artboards: structuredClone(v.artboards),
        files: structuredClone(v.files),
      }),
    });
    get().persist();
  },

  addMessage: (role, content) => {
    const p = get().project;
    if (!p) return "";
    const id = nanoid(10);
    set({
      project: touch({
        ...p,
        messages: [...p.messages, { id, role, content, createdAt: Date.now() }],
      }),
    });
    return id;
  },

  appendMessage: (id, chunk) => {
    const p = get().project;
    if (!p) return;
    set({
      project: {
        ...p,
        messages: p.messages.map((m) => (m.id === id ? { ...m, content: m.content + chunk } : m)),
      },
    });
  },

  applyParsed: (parsed, streaming) => {
    const p = get().project;
    if (!p) return;
    let artboards = [...p.artboards];
    const files = [...p.files];
    const changedDc: string[] = [];

    for (const write of parsed.dcWrites) {
      const path = write.path.endsWith(".dc.html") ? write.path : `${write.path}.dc.html`;
      const row = { path, content: write.source, updatedAt: Date.now() };
      const idx = files.findIndex((x) => x.path === path);
      if (idx >= 0) files[idx] = row;
      else files.push(row);
      changedDc.push(path);
      if (write.mount) {
        const map = filesFromList(files);
        const flat = flattenAllSafe(path, map);
        const tweaks = tweakMapFromSchema(flat.schema);
        const existing = artboards.find((b) => b.dcPath === path || b.title === write.title);
        if (existing) {
          artboards = artboards.map((b) =>
            b.id === existing.id
              ? {
                  ...b,
                  title: write.title,
                  kind: "dc" as const,
                  source: flat.html,
                  width: write.width,
                  height: write.height,
                  tweaks: { ...tweaks, ...b.tweaks },
                  tweakSchema: schemaToTweakSchema(flat.schema),
                  dcPath: path,
                  dcProps: { ...tweaks, ...b.dcProps },
                  status: streaming ? "streaming" : "ready",
                  error: flat.error ?? null,
                  version: b.version + 1,
                }
              : b,
          );
        } else {
          const pos = layoutNewArtboards(artboards, [
            { title: write.title, kind: "dc", width: write.width, height: write.height, source: "" },
          ])[0];
          artboards.push({
            id: nanoid(8),
            title: write.title,
            kind: "dc",
            source: flat.html,
            x: pos?.x ?? 80,
            y: pos?.y ?? 80,
            width: write.width,
            height: write.height,
            tweaks,
            tweakSchema: schemaToTweakSchema(flat.schema),
            comments: [],
            error: flat.error ?? null,
            status: streaming ? "streaming" : "ready",
            autoFixed: false,
            version: 1,
            dcPath: path,
            dcProps: tweaks,
          });
        }
      }
    }

    for (const setp of parsed.dcSetProps) {
      if (!setp.path) continue;
      if (setp.instance) {
        artboards = artboards.map((b) => {
          if (b.id !== setp.instance && b.title !== setp.instance) return b;
          const nextProps = { ...(b.dcProps ?? b.tweaks), ...setp.props };
          return { ...b, tweaks: nextProps, dcProps: nextProps };
        });
        const board = artboards.find((b) => b.id === setp.instance || b.title === setp.instance);
        if (board?.dcPath) changedDc.push(board.dcPath);
      } else {
        const idx = files.findIndex((f) => f.path === setp.path);
        if (idx >= 0) {
          files[idx] = {
            ...files[idx],
            content: setFileProps(files[idx].content, setp.props),
            updatedAt: Date.now(),
          };
          changedDc.push(setp.path);
        }
      }
    }

    const positions = layoutNewArtboards(
      artboards,
      parsed.artboards.filter((a) => !artboards.some((e) => e.title === a.title && e.status === "streaming")),
    );
    parsed.artboards.forEach((incoming, i) => {
      const existing = artboards.find((b) => b.title === incoming.title && (b.status === "streaming" || streaming));
      const schema = enrichSchema(incoming.source);
      if (existing) {
        artboards = artboards.map((b) =>
          b.id === existing.id
            ? {
                ...b,
                source: incoming.source,
                kind: incoming.kind,
                width: incoming.width,
                height: incoming.height,
                tweakSchema: schema,
                tweaks: { ...schemaToMap(schema), ...b.tweaks },
                status: streaming ? "streaming" : "ready",
                error: null,
                version: b.version + 1,
                dcPath: incoming.dcPath ?? b.dcPath,
                dcProps: incoming.dcProps ?? b.dcProps,
              }
            : b,
        );
      } else {
        const pos = positions[i] || { x: 80, y: 80 };
        artboards.push({
          id: nanoid(8),
          title: incoming.title,
          kind: incoming.kind,
          source: incoming.source,
          x: pos.x,
          y: pos.y,
          width: incoming.width,
          height: incoming.height,
          tweaks: schemaToMap(schema),
          tweakSchema: schema,
          comments: [],
          error: null,
          status: streaming ? "streaming" : "ready",
          autoFixed: false,
          version: 1,
          dcPath: incoming.dcPath,
          dcProps: incoming.dcProps,
        });
      }
    });
    if (!streaming) {
      artboards = artboards.map((b) => (b.status === "streaming" ? { ...b, status: "ready" } : b));
    }
    for (const id of parsed.resolveCommentIds) {
      artboards = artboards.map((b) => ({
        ...b,
        comments: b.comments.map((c) => (c.id === id ? { ...c, resolved: true, queued: false } : c)),
      }));
    }
    for (const f of parsed.files) {
      const idx = files.findIndex((x) => x.path === f.path);
      const row = { path: f.path, content: f.content, updatedAt: Date.now() };
      if (idx >= 0) files[idx] = row;
      else files.push(row);
      if (f.path.endsWith(".dc.html")) changedDc.push(f.path);
    }

    if (changedDc.length) {
      artboards = recompileDcArtboards(artboards, files, changedDc);
    }

    set({ project: touch({ ...p, artboards, files }) });
    if (!streaming) get().persist();
  },

  writeFile: (path, content) => {
    const p = get().project;
    if (!p) return;
    const files = [...p.files];
    const idx = files.findIndex((f) => f.path === path);
    const row = { path, content, updatedAt: Date.now() };
    if (idx >= 0) files[idx] = row;
    else files.push(row);
    const artboards = path.endsWith(".dc.html")
      ? recompileDcArtboards(p.artboards, files, [path])
      : p.artboards;
    set({ project: touch({ ...p, files, artboards }) });
    get().persist();
  },

  placeDc: (path, at) => {
    const p = get().project;
    if (!p) return null;
    const map = filesFromList(p.files);
    const flat = flattenAllSafe(path, map);
    const schema = flat.schema;
    const tweaks = tweakMapFromSchema(schema);
    const id = nanoid(8);
    const preview = schema.preview ?? { width: 960, height: 640 };
    const laid = layoutNewArtboards(p.artboards, [
      { title: schema.name, kind: "dc", width: preview.width, height: preview.height, source: "" },
    ])[0];
    const pos = at ?? laid ?? { x: 80, y: 80 };
    const board: Artboard = {
      id,
      title: schema.name || path.replace(/\.dc\.html$/i, ""),
      kind: "dc",
      source: flat.html,
      x: pos.x,
      y: pos.y,
      width: preview.width,
      height: preview.height,
      tweaks,
      tweakSchema: schemaToTweakSchema(schema),
      comments: [],
      error: flat.error ?? null,
      status: "ready",
      autoFixed: false,
      version: 1,
      dcPath: path,
      dcProps: tweaks,
    };
    const z = p.canvas.zoom;
    set({
      project: touch({
        ...p,
        artboards: [...p.artboards, board],
        selectedArtboardId: id,
        canvas: {
          ...p.canvas,
          panX: 48 - pos.x * z,
          panY: 48 - pos.y * z,
        },
      }),
    });
    get().persist();
    return id;
  },

  setBusy: (busy) => set({ busy }),
}));

function recompileDcArtboards(
  artboards: Artboard[],
  files: Project["files"],
  changedPaths: string[],
): Artboard[] {
  const map = filesFromList(files);
  const affected = new Set<string>();
  for (const path of changedPaths) {
    for (const dep of dependentsOf(map, path)) affected.add(dep);
  }
  return artboards.map((b) => {
    if (b.kind !== "dc" || !b.dcPath || !affected.has(b.dcPath)) return b;
    const flat = flattenAllSafe(b.dcPath, map, b.dcProps ?? b.tweaks);
    return {
      ...b,
      source: flat.html,
      tweakSchema: schemaToTweakSchema(flat.schema),
      version: b.version + 1,
      error: flat.error ?? null,
      status: b.status === "streaming" ? "streaming" : flat.error ? "error" : "ready",
    };
  });
}

function pickThemeFields(schema: TweakSchema): TweakSchema {
  const out: TweakSchema = {};
  for (const k of THEME_KEYS) {
    if (schema[k]) out[k] = schema[k]!;
  }
  return out;
}

function pickThemeValues(tweaks: TweakMap): TweakMap {
  const out: TweakMap = {};
  for (const k of THEME_KEYS) {
    if (tweaks[k] !== undefined) out[k] = tweaks[k]!;
  }
  return out;
}

export function queuedCommentsPrompt(project: Project): string {
  const pins = project.artboards.flatMap((b) =>
    b.comments.filter((c) => c.queued && !c.resolved).map((c) => `- [${c.id}] on "${b.title}" (${c.selector ?? "canvas"}): ${c.body}`),
  );
  if (pins.length === 0) return "";
  return `\n\nQueued comments to address:\n${pins.join("\n")}\nResolve with <resolve-comment id="..."/> after you edit.`;
}

export { parseStreaming };
