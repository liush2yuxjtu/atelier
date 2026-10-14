import { describe, expect, it } from "vitest";
import {
  applySectionPatch,
  defaultSections,
  defaultThemeTweaks,
  encodeSections,
  linkedBoardCount,
  moveSectionUp,
  parseSectionKey,
  resolveBoardTweaks,
} from "@/lib/theme";
import { applyLook, REVIEW_PALETTES } from "@/lib/palettes";
import type { Artboard, Project } from "@/lib/types";

function board(partial: Partial<Artboard> & { id: string }): Artboard {
  return {
    title: partial.title ?? partial.id,
    kind: "html",
    source: partial.source ?? `<section data-section="pricing"></section>`,
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    tweaks: { look: "ember", accent: "#c45c26" },
    tweakSchema: {
      look: { type: "palette", value: "ember" },
      accent: { type: "color", value: "#c45c26" },
    },
    comments: [],
    error: null,
    status: "ready",
    autoFixed: false,
    version: 1,
    unlinked: [],
    unlinkedSections: [],
    page: true,
    ...partial,
  };
}

function project(artboards: Artboard[], extra: Partial<Project> = {}): Project {
  return {
    id: "p",
    name: "t",
    createdAt: 0,
    updatedAt: 0,
    artboards,
    files: [],
    versions: [],
    messages: [],
    canvas: { panX: 0, panY: 0, zoom: 1 },
    selectedArtboardId: artboards[0]?.id ?? null,
    selectedSelector: null,
    selectedStyles: null,
    selectedText: null,
    mode: "preview",
    theme: defaultThemeTweaks(),
    sections: defaultSections(),
    componentTweaks: {},
    ...extra,
  };
}

describe("global linked theme", () => {
  it("resolves theme tokens onto every linked board", () => {
    const moss = applyLook(defaultThemeTweaks(), "moss");
    const a = board({ id: "a" });
    const b = board({ id: "b" });
    const p = project([a, b], { theme: moss });
    expect(resolveBoardTweaks(p, a).accent).toBe(REVIEW_PALETTES.moss.accent);
    expect(resolveBoardTweaks(p, b).paper).toBe(REVIEW_PALETTES.moss.paper);
    expect(linkedBoardCount(p, "look")).toBe(2);
  });

  it("unlink keeps a board on its own accent", () => {
    const moss = applyLook(defaultThemeTweaks(), "moss");
    const a = board({ id: "a", unlinked: ["accent"], tweaks: { look: "ember", accent: "#c45c26" } });
    const p = project([a, board({ id: "b" })], { theme: moss });
    expect(resolveBoardTweaks(p, a).accent).toBe("#c45c26");
    expect(resolveBoardTweaks(p, p.artboards[1]!).accent).toBe(REVIEW_PALETTES.moss.accent);
    expect(linkedBoardCount(p, "accent")).toBe(1);
  });

  it("encodes structural section tweaks and move-up swaps order", () => {
    const sections = defaultSections();
    expect(parseSectionKey("sec:pricing:order")).toEqual({ id: "pricing", prop: "order" });
    const encoded = encodeSections(sections);
    expect(encoded["sec:pricing:order"]).toBe(2);
    const moved = moveSectionUp(sections, "pricing");
    expect(moved.pricing?.order).toBeLessThan(sections.pricing!.order);
    const stacked = applySectionPatch(sections, "pricing", "layout", "stack");
    expect(stacked.pricing?.layout).toBe("stack");
  });

  it("does not apply a section change to an unlinked board source check", () => {
    const a = board({
      id: "a",
      source: `<section data-section="pricing"></section>`,
      unlinkedSections: ["pricing"],
    });
    const b = board({ id: "b", source: `<section data-section="pricing"></section>` });
    const p = project([a, b]);
    expect(linkedBoardCount(p, "sec:pricing:order")).toBe(1);
    expect(resolveBoardTweaks(p, a)["sec:pricing:order"]).toBeUndefined();
    expect(resolveBoardTweaks(p, b)["sec:pricing:order"]).toBe(2);
  });

  it("skips section keys on boards that do not contain the section", () => {
    const a = board({ id: "a", source: `<section data-section="header"></section>` });
    const p = project([a]);
    expect(linkedBoardCount(p, "sec:pricing:layout")).toBe(0);
    expect(resolveBoardTweaks(p, a)["sec:pricing:layout"]).toBeUndefined();
    expect(resolveBoardTweaks(p, a)["sec:header:layout"]).toBe("split");
  });
});
