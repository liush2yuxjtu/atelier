"use client";

import { useEffect, useRef, useState } from "react";
import { useStudio } from "@/lib/store";
import { ArtboardFrame } from "./ArtboardFrame";
import { PresentDock } from "./PresentDock";
import { cn } from "@/lib/cn";
import { kebabTweakKey, tweakAttrValue } from "@/lib/tweak-bind";
import { DC_DRAG_MIME } from "@/lib/dc/types";
import type { Artboard } from "@/lib/types";

type Slot = { x: number; y: number; s: number; w: number; h: number };
const TITLE_H = 30;

/** Present "stage": hero page large on the left, the other two stacked right. */
function presentSlots(pages: Artboard[]): Record<string, Slot> | null {
  if (pages.length !== 3) return null;
  const [a, b, c] = pages as [Artboard, Artboard, Artboard];
  const gap = 56;
  const small = (bd: Artboard) => bd.height + TITLE_H;
  const right = Math.max(b.width, c.width);
  const colH = small(b) + gap + small(c);
  const s = (colH - TITLE_H * 2) / a.height;
  return {
    [a.id]: { x: 0, y: 0, s, w: a.width * s, h: colH },
    [b.id]: { x: a.width * s + gap, y: 0, s: 1, w: right, h: small(b) },
    [c.id]: { x: a.width * s + gap, y: small(b) + gap, s: 1, w: right, h: small(c) },
  };
}

export function CanvasView() {
  const project = useStudio((s) => s.project);
  const setCanvas = useStudio((s) => s.setCanvas);
  const selectArtboard = useStudio((s) => s.selectArtboard);
  const updateArtboard = useStudio((s) => s.updateArtboard);
  const placeDc = useStudio((s) => s.placeDc);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [space, setSpace] = useState(false);
  const [panning, setPanning] = useState(false);
  const drag = useRef<{ id: string; ox: number; oy: number; ax: number; ay: number } | null>(null);
  const pan = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const vendorBase = typeof window !== "undefined" ? window.location.origin : "";
  const presenting = Boolean(project?.presenting);
  const hasProject = Boolean(project);

  // Native non-passive wheel listener: React's onWheel is passive, so its
  // preventDefault() logged an error and let ctrl+wheel zoom the whole page.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const canvas = useStudio.getState().project?.canvas;
      if (!canvas) return;
      if (e.ctrlKey || e.metaKey) {
        const delta = -e.deltaY * 0.0015;
        const next = Math.min(2.4, Math.max(0.12, canvas.zoom * (1 + delta)));
        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const wx = (cx - canvas.panX) / canvas.zoom;
        const wy = (cy - canvas.panY) / canvas.zoom;
        setCanvas({ zoom: next, panX: cx - wx * next, panY: cy - wy * next });
      } else {
        setCanvas({ ...canvas, panX: canvas.panX - e.deltaX, panY: canvas.panY - e.deltaY });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [hasProject, setCanvas]);
  const selectedId = project?.selectedArtboardId ?? null;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setSpace(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpace(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (!presenting) return;
    const p = useStudio.getState().project;
    const wrap = wrapRef.current;
    if (!p || !wrap) return;
    const pages = p.artboards.filter((b) => b.page);
    const slots = presentSlots(pages);
    const targets = pages.length ? pages : p.artboards.filter((b) => b.id === selectedId);
    if (!targets.length) return;
    const rects = targets.map((b) =>
      slots?.[b.id] ?? { x: b.x, y: b.y, w: b.width, h: b.height, s: 1 },
    );
    const minX = Math.min(...rects.map((r) => r.x));
    const minY = Math.min(...rects.map((r) => r.y));
    const maxX = Math.max(...rects.map((r) => r.x + r.w));
    const maxY = Math.max(...rects.map((r) => r.y + r.h));
    const rect = wrap.getBoundingClientRect();
    const padX = 32;
    const padY = slots ? 96 : 120;
    const zx = (rect.width - padX * 2) / Math.max(1, maxX - minX);
    const zy = (rect.height - padY * 2) / Math.max(1, maxY - minY);
    const zoom = Math.min(Math.max(0.12, Math.min(zx, zy)), 1.05);
    setCanvas({
      zoom,
      panX: (rect.width - (maxX - minX) * zoom) / 2 - minX * zoom,
      panY: 20 - minY * zoom,
    });
  }, [presenting, selectedId, setCanvas]);

  if (!project) return null;
  const { canvas, selectedArtboardId } = project;
  const prefs = project.canvasPrefs ?? {
    theme: "dark" as const,
    density: "comfortable" as const,
    grid: true,
    snap: false,
    reduceMotion: false,
  };
  const light = prefs.theme === "light";
  const pages = project.artboards.filter((b) => b.page);
  const visibleBoards = presenting
    ? pages.length
      ? pages
      : project.artboards.filter((b) => b.id === selectedArtboardId)
    : project.artboards;
  const slots = presenting ? presentSlots(pages) : null;
  const selectedBoard = project.artboards.find((b) => b.id === selectedArtboardId);
  const compareVariant = project.compareVariantId
    ? selectedBoard?.variants?.find((v) => v.id === project.compareVariantId)
    : undefined;

  function onPointerDown(e: React.PointerEvent) {
    if (space || e.button === 1 || e.altKey) {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      pan.current = { x: canvas.panX, y: canvas.panY, px: e.clientX, py: e.clientY };
      setPanning(true);
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (pan.current) {
      setCanvas({
        ...canvas,
        panX: pan.current.x + (e.clientX - pan.current.px),
        panY: pan.current.y + (e.clientY - pan.current.py),
      });
      return;
    }
    if (drag.current) {
      const z = canvas.zoom;
      let nx = drag.current.ax + (e.clientX - drag.current.ox) / z;
      let ny = drag.current.ay + (e.clientY - drag.current.oy) / z;
      if (useStudio.getState().project?.canvasPrefs?.snap) {
        nx = Math.round(nx / 24) * 24;
        ny = Math.round(ny / 24) * 24;
      }
      updateArtboard(drag.current.id, { x: nx, y: ny });
    }
  }

  function onPointerUp() {
    pan.current = null;
    drag.current = null;
    setPanning(false);
  }

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative h-full w-full overflow-hidden",
        light ? "bg-[#efe8dc]" : "bg-[#121018]",
        space || panning ? "cursor-grab" : "cursor-default",
        prefs.reduceMotion && "[&_*]:!transition-none",
      )}
      data-testid="canvas-view"
      data-canvas-theme={prefs.theme}
      data-canvas-density={prefs.density}
      data-canvas-grid={prefs.grid ? "on" : "off"}
      data-canvas-snap={prefs.snap ? "on" : "off"}
      data-reduce-motion={prefs.reduceMotion ? "on" : "off"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClick={(e) => {
        if (e.target === e.currentTarget) selectArtboard(null);
      }}
      onDragOver={(e) => {
        if (
          e.dataTransfer.types.includes(DC_DRAG_MIME) ||
          e.dataTransfer.types.includes("text/plain")
        ) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={(e) => {
        const path =
          e.dataTransfer.getData(DC_DRAG_MIME) || e.dataTransfer.getData("text/plain");
        if (!path.endsWith(".dc.html")) return;
        e.preventDefault();
        const rect = wrapRef.current?.getBoundingClientRect();
        if (!rect) {
          placeDc(path);
          return;
        }
        const x = (e.clientX - rect.left - canvas.panX) / canvas.zoom;
        const y = (e.clientY - rect.top - canvas.panY) / canvas.zoom;
        placeDc(path, { x, y });
      }}
    >
      {prefs.grid && (
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          data-testid="canvas-grid"
          style={{
            backgroundImage: light
              ? "radial-gradient(circle at 1px 1px, rgba(28,27,22,0.12) 1px, transparent 0)"
              : "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.09) 1px, transparent 0)",
            backgroundSize: `${24 * canvas.zoom}px ${24 * canvas.zoom}px`,
            backgroundPosition: `${canvas.panX}px ${canvas.panY}px`,
          }}
        />
      )}
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${canvas.panX}px, ${canvas.panY}px) scale(${canvas.zoom})`,
        }}
      >
        {visibleBoards.map((board) => {
          const active = board.id === selectedArtboardId;
          const split = Boolean(
            compareVariant && (board.id === selectedArtboardId || (presenting && board.page)),
          );
          return (
            <div
              key={board.id}
              className="absolute"
              style={
                slots?.[board.id]
                  ? {
                      left: slots[board.id]!.x,
                      top: slots[board.id]!.y,
                      transform: `scale(${slots[board.id]!.s})`,
                      transformOrigin: "top left",
                    }
                  : { left: board.x, top: board.y }
              }
              data-testid={`artboard-${board.id}`}
              data-artboard="true"
              data-kind={board.kind}
              data-dc-path={board.dcPath ?? ""}
              {...Object.fromEntries(
                Object.entries(board.tweaks).map(([key, raw]) => [
                  `data-tweak-${kebabTweakKey(key)}`,
                  tweakAttrValue(raw),
                ]),
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <button
                  type="button"
                  data-testid={`artboard-title-${board.id}`}
                  className="cursor-grab rounded px-1 font-mono text-[11px] tracking-wide text-stone-400 hover:text-amber-200"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    selectArtboard(board.id);
                    drag.current = {
                      id: board.id,
                      ox: e.clientX,
                      oy: e.clientY,
                      ax: board.x,
                      ay: board.y,
                    };
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                >
                  {board.title}
                </button>
                {board.kind === "dc" && (
                  <span className="rounded bg-amber-300/15 px-1 text-[9px] font-medium tracking-wide text-amber-200/90 uppercase">
                    DC
                  </span>
                )}
                <span className="text-[10px] text-stone-600">
                  {board.width}×{board.height}
                </span>
                {board.status === "streaming" && (
                  <span className="text-[10px] text-amber-300">streaming</span>
                )}
              </div>
              <div
                className={cn(
                  "rounded-sm shadow-[0_24px_80px_rgba(0,0,0,0.45)] ring-1",
                  active ? "ring-amber-300/80" : "ring-white/10",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  selectArtboard(board.id);
                }}
              >
                {split && compareVariant ? (
                  <div
                    className="relative overflow-hidden"
                    style={{ width: board.width, height: board.height }}
                    data-testid="compare-split"
                  >
                    <div className="absolute inset-0 overflow-hidden" style={{ clipPath: "inset(0 50% 0 0)" }}>
                      <ArtboardFrame
                        board={board}
                        vendorBase={vendorBase}
                        tweaksOverride={{
                          ...(compareVariant.theme ?? compareVariant.tweaks),
                          ...Object.fromEntries(
                            Object.entries(compareVariant.sections ?? {}).flatMap(([sid, s]) => [
                              [`sec:${sid}:layout`, s.layout],
                              [`sec:${sid}:visible`, s.visible],
                              [`sec:${sid}:order`, s.order],
                              [`sec:${sid}:variant`, s.variant],
                            ]),
                          ),
                        }}
                        frameKey="a"
                      />
                    </div>
                    <div className="absolute inset-0 overflow-hidden" style={{ clipPath: "inset(0 0 0 50%)" }}>
                      <ArtboardFrame board={board} vendorBase={vendorBase} frameKey="b" />
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px bg-white/80" />
                    <span className="pointer-events-none absolute top-3 left-3 z-10 rounded bg-black/55 px-1.5 text-[10px] font-semibold text-white">
                      A
                    </span>
                    <span className="pointer-events-none absolute top-3 right-3 z-10 rounded bg-black/55 px-1.5 text-[10px] font-semibold text-white">
                      B
                    </span>
                  </div>
                ) : (
                  <ArtboardFrame board={board} vendorBase={vendorBase} />
                )}
              </div>
              {!presenting &&
                board.comments
                .filter((c) => !c.resolved)
                .map((c) => (
                  <div
                    key={c.id}
                    className="absolute z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-300 text-[10px] font-bold text-stone-950"
                    style={{ left: c.x, top: c.y + 28 }}
                    title={c.body || "Comment"}
                    data-testid={`comment-${c.id}`}
                  >
                    {c.body ? "!" : "+"}
                  </div>
                ))}
            </div>
          );
        })}
      </div>
      {!presenting && (
      <div className="absolute right-3 bottom-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-xs text-stone-300 backdrop-blur">
        <button
          type="button"
          className="px-1 hover:text-white"
          onClick={() => setCanvas({ ...canvas, zoom: Math.max(0.12, canvas.zoom * 0.9) })}
        >
          −
        </button>
        <span data-testid="zoom-label">{Math.round(canvas.zoom * 100)}%</span>
        <button
          type="button"
          data-testid="zoom-in"
          className="px-1 hover:text-white"
          onClick={() => setCanvas({ ...canvas, zoom: Math.min(2.4, canvas.zoom * 1.1) })}
        >
          +
        </button>
        <button
          type="button"
          className="px-1 hover:text-white"
          onClick={() => setCanvas({ panX: 28, panY: 24, zoom: 0.24 })}
        >
          fit
        </button>
      </div>
      )}
      <PresentDock />
    </div>
  );
}
