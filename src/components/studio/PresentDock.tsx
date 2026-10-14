"use client";

import { Button } from "@/components/ui/button";
import { TweakControls } from "./TweakControls";
import { useStudio } from "@/lib/store";

export function PresentDock() {
  const project = useStudio((s) => s.project);
  const undoTweaks = useStudio((s) => s.undoTweaks);
  const redoTweaks = useStudio((s) => s.redoTweaks);
  const approveLook = useStudio((s) => s.approveLook);
  const setCompare = useStudio((s) => s.setCompare);
  const setPresenting = useStudio((s) => s.setPresenting);
  if (!project?.presenting) return null;
  const board = project.artboards.find((b) => b.id === project.selectedArtboardId);
  if (!board) return null;
  const comparing = Boolean(project.compareVariantId);
  const before = board.variants?.find((v) => v.label === "Before") ?? board.variants?.[0];

  return (
    <div
      className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-3"
      data-testid="present-dock"
    >
      <div className="flex max-w-[min(1100px,100%)] flex-wrap items-end gap-4 rounded-2xl border border-white/12 bg-[#16141f]/95 px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur">
        <TweakControls board={board} compact />
        <div className="flex flex-wrap items-center gap-1.5 border-l border-white/10 pl-3">
          <Button
            size="sm"
            variant="ghost"
            data-testid="tweak-undo"
            disabled={(board.tweakUndo ?? []).length === 0}
            onClick={() => undoTweaks(board.id)}
          >
            Undo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            data-testid="tweak-redo"
            disabled={(board.tweakRedo ?? []).length === 0}
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
          <Button size="sm" variant="ghost" data-testid="exit-present" onClick={() => setPresenting(false)}>
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
