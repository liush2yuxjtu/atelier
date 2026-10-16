"use client";

import { useStudio } from "@/lib/store";
import { DEFAULT_CANVAS_PREFS } from "@/lib/types";
import { cn } from "@/lib/cn";

export function GlobalBar() {
  const prefs = useStudio((s) => s.project?.canvasPrefs ?? DEFAULT_CANVAS_PREFS);
  const setCanvasPrefs = useStudio((s) => s.setCanvasPrefs);
  const presenting = useStudio((s) => Boolean(s.project?.presenting));
  if (presenting) return null;

  return (
    <div
      className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/8 bg-[#16141f] px-3 py-1.5 text-[11px] text-stone-300"
      data-testid="global-bar"
      role="toolbar"
      aria-label="Global canvas toggles"
    >
      <span className="font-semibold tracking-[0.14em] text-[10px] uppercase text-amber-200/80">
        Global
      </span>
      <div className="flex overflow-hidden rounded-full border border-white/10">
        <button
          type="button"
          data-testid="global-theme-dark"
          aria-pressed={prefs.theme === "dark"}
          className={cn("px-2 py-0.5", prefs.theme === "dark" && "bg-white/12 text-amber-100")}
          onClick={() => setCanvasPrefs({ theme: "dark" })}
        >
          Dark
        </button>
        <button
          type="button"
          data-testid="global-theme-light"
          aria-pressed={prefs.theme === "light"}
          className={cn("px-2 py-0.5", prefs.theme === "light" && "bg-white/12 text-amber-100")}
          onClick={() => setCanvasPrefs({ theme: "light" })}
        >
          Light
        </button>
      </div>
      <label className="flex items-center gap-1">
        Density
        <select
          data-testid="global-density"
          className="rounded border border-white/10 bg-transparent px-1 py-0.5"
          value={prefs.density}
          onChange={(e) =>
            setCanvasPrefs({
              density: e.target.value as "compact" | "comfortable" | "spacious",
            })
          }
        >
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
          <option value="spacious">Spacious</option>
        </select>
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          data-testid="global-grid"
          checked={prefs.grid}
          onChange={(e) => setCanvasPrefs({ grid: e.target.checked })}
        />
        Grid
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          data-testid="global-snap"
          checked={prefs.snap}
          onChange={(e) => setCanvasPrefs({ snap: e.target.checked })}
        />
        Snap
      </label>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          data-testid="global-reduce-motion"
          checked={prefs.reduceMotion}
          onChange={(e) => setCanvasPrefs({ reduceMotion: e.target.checked })}
        />
        Reduce motion
      </label>
      <span className="ml-auto text-[10px] text-stone-600">canvas chrome · not Tweaks</span>
    </div>
  );
}
