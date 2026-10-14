"use client";

import { useEffect, useRef, useState } from "react";
import { useStudio } from "@/lib/store";
import { ArtboardFrame } from "./ArtboardFrame";
import { cn } from "@/lib/cn";

export function CanvasView() {
  const project = useStudio((s) => s.project);
  const setCanvas = useStudio((s) => s.setCanvas);
  const selectArtboard = useStudio((s) => s.selectArtboard);
  const updateArtboard = useStudio((s) => s.updateArtboard);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [space, setSpace] = useState(false);
  const [panning, setPanning] = useState(false);
  const drag = useRef<{ id: string; ox: number; oy: number; ax: number; ay: number } | null>(null);
  const pan = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const vendorBase = typeof window !== "undefined" ? window.location.origin : "";

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

  if (!project) return null;
  const { canvas, artboards, selectedArtboardId } = project;

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY * 0.0015;
      const next = Math.min(2.4, Math.max(0.12, canvas.zoom * (1 + delta)));
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const wx = (cx - canvas.panX) / canvas.zoom;
      const wy = (cy - canvas.panY) / canvas.zoom;
      setCanvas({
        zoom: next,
        panX: cx - wx * next,
        panY: cy - wy * next,
      });
    } else {
      setCanvas({
        ...canvas,
        panX: canvas.panX - e.deltaX,
        panY: canvas.panY - e.deltaY,
      });
    }
  }

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
      const nx = drag.current.ax + (e.clientX - drag.current.ox) / z;
      const ny = drag.current.ay + (e.clientY - drag.current.oy) / z;
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
        "relative h-full w-full overflow-hidden bg-[#121018]",
        space || panning ? "cursor-grab" : "cursor-default",
      )}
      data-testid="canvas-view"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClick={(e) => {
        if (e.target === e.currentTarget) selectArtboard(null);
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.09) 1px, transparent 0)",
          backgroundSize: `${24 * canvas.zoom}px ${24 * canvas.zoom}px`,
          backgroundPosition: `${canvas.panX}px ${canvas.panY}px`,
        }}
      />
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${canvas.panX}px, ${canvas.panY}px) scale(${canvas.zoom})`,
        }}
      >
        {artboards.map((board) => {
          const active = board.id === selectedArtboardId;
          return (
            <div
              key={board.id}
              className="absolute"
              style={{ left: board.x, top: board.y }}
              data-testid={`artboard-${board.id}`}
              data-artboard="true"
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
                <ArtboardFrame board={board} vendorBase={vendorBase} />
              </div>
              {board.comments
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
    </div>
  );
}
