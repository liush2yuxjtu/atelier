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
} from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { createBlankProject, createDemoProject } from "./demo";
import { loadProject, saveProject } from "./storage";
import { loadSettings, saveSettings } from "./providers";
import { applyTweaksToSource, parseTweaksSchema, schemaToMap } from "./tweaks";
import { layoutNewArtboards, parseStreaming, type ParsedCommand } from "./agent/parse";

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
  setBusy: (busy: boolean) => void;
}

function touch(p: Project): Project {
  return { ...p, updatedAt: Date.now() };
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
    }
    set({ project, settings, hydrated: true });
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
    const schema = parseTweaksSchema(partial.source || "");
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
    set({
      project: touch({
        ...p,
        artboards: p.artboards.map((b) =>
          b.id === id
            ? {
                ...b,
                tweaks,
                source: applyTweaksToSource(b.source, tweaks, b.tweakSchema),
              }
            : b,
        ),
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
    const positions = layoutNewArtboards(
      artboards,
      parsed.artboards.filter((a) => !artboards.some((e) => e.title === a.title && e.status === "streaming")),
    );
    parsed.artboards.forEach((incoming, i) => {
      const existing = artboards.find((b) => b.title === incoming.title && (b.status === "streaming" || streaming));
      const schema = parseTweaksSchema(incoming.source);
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
    const files = [...p.files];
    for (const f of parsed.files) {
      const idx = files.findIndex((x) => x.path === f.path);
      const row = { path: f.path, content: f.content, updatedAt: Date.now() };
      if (idx >= 0) files[idx] = row;
      else files.push(row);
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
    set({ project: touch({ ...p, files }) });
    get().persist();
  },

  setBusy: (busy) => set({ busy }),
}));

export function queuedCommentsPrompt(project: Project): string {
  const pins = project.artboards.flatMap((b) =>
    b.comments.filter((c) => c.queued && !c.resolved).map((c) => `- [${c.id}] on "${b.title}" (${c.selector ?? "canvas"}): ${c.body}`),
  );
  if (pins.length === 0) return "";
  return `\n\nQueued comments to address:\n${pins.join("\n")}\nResolve with <resolve-comment id="..."/> after you edit.`;
}

export { parseStreaming };
