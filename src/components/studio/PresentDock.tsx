"use client";

import { Button } from "@/components/ui/button";
import { TweakControls } from "./TweakControls";
import { useStudio } from "@/lib/store";
import { linkedBoardCount } from "@/lib/theme";

export function PresentDock() {
  const project = useStudio((s) => s.project);
  const undoTweaks = useStudio((s) => s.undoTweaks);
  const redoTweaks = useStudio((s) => s.redoTweaks);
  const approveLook = useStudio((s) => s.approveLook);
  const setCompare = useStudio((s) => s.setCompare);
  const setPresenting = useStudio((s) => s.setPresenting);
  const generateKnobs = useStudio((s) => s.generateKnobs);
  const moveSharedSection = useStudio((s) => s.moveSharedSection);
  const setTweaks = useStudio((s) => s.setTweaks);
  if (!project?.presenting) return null;
  const board =
    project.artboards.find((b) => b.id === project.selectedArtboardId) ??
    project.artboards.find((b) => b.page);
  if (!board) return null;
  const comparing = Boolean(project.compareVariantId);
  const before = board.variants?.find((v) => v.label === "Before") ?? board.variants?.[0];
  const linked = linkedBoardCount(project, "look");
  const pricingOrder = project.sections?.pricing?.order ?? 2;
  const pricingLayout = project.sections?.pricing?.layout ?? "split";

  return (
    <div
      className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-3"
      data-testid="present-dock"
    >
      <div className="flex max-w-[min(1180px,100%)] flex-wrap items-end gap-4 rounded-2xl border border-white/12 bg-[#16141f]/95 px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur">
        <TweakControls board={board} compact />
        <div className="flex flex-wrap items-center gap-1.5 border-l border-white/10 pl-3">
          <Button
            size="sm"
            variant="secondary"
            data-testid="generate-knobs"
            onClick={() => generateKnobs(board.id)}
          >
            Generate knobs
          </Button>
          <Button
            size="sm"
            variant={pricingOrder < 2 ? "secondary" : "ghost"}
            data-testid="section-pricing-up"
            data-order={String(pricingOrder)}
            onClick={() => moveSharedSection(board.id, "pricing")}
          >
            Pricing up
          </Button>
          <Button
            size="sm"
            variant={pricingLayout === "stack" ? "secondary" : "ghost"}
            data-testid="section-pricing-stack"
            data-layout={pricingLayout}
            onClick={() =>
              setTweaks(board.id, { ...board.tweaks, "sec:pricing:layout": pricingLayout === "stack" ? "split" : "stack" })
            }
          >
            Pricing stack
          </Button>
          <Button
            size="sm"
            variant="ghost"
            data-testid="tweak-undo"
            disabled={(project.themeUndo ?? []).length === 0 && (board.tweakUndo ?? []).length === 0}
            onClick={() => undoTweaks(board.id)}
          >
            Undo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            data-testid="tweak-redo"
            disabled={(project.themeRedo ?? []).length === 0 && (board.tweakRedo ?? []).length === 0}
            onClick={() => redoTweaks(board.id)}
          >
            Redo
          </Button>
          <Button
            size="sm"
            variant={comparing ? "secondary" : "ghost"}
            data-testid="compare-look"
            data-active={comparing ? "true" : "false"}
            onClick={() => setCompare(comparing ? null : (before?.id ?? null))}
          >
            Compare
          </Button>
          <Button
            size="sm"
            variant="default"
            data-testid="approve-look"
            onClick={() => approveLook(board.id)}
          >
            Approved
          </Button>
          {board.approvedVariantId && (
            <span
              data-testid="look-approved"
              className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold text-emerald-200"
            >
              Approved
            </span>
          )}
          {linked > 1 && (
            <span data-testid="linked-count" className="rounded-full bg-amber-300/15 px-2 py-1 text-[11px] text-amber-100">
              linked in {linked} boards
            </span>
          )}
          <Button size="sm" variant="ghost" data-testid="exit-present" onClick={() => setPresenting(false)}>
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
