"use client";

import Link from "next/link";
import {
  Copy,
  LayoutGrid,
  MessageSquare,
  MousePointer2,
  Plus,
  Settings2,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudio } from "@/lib/store";
import { cn } from "@/lib/cn";
import type { StudioMode } from "@/lib/types";

interface Props {
  onExport: () => void;
  onSettings: () => void;
  onExtract: () => void;
}

const MODES: { id: StudioMode; label: string; icon: typeof MousePointer2 }[] = [
  { id: "preview", label: "Preview", icon: LayoutGrid },
  { id: "edit", label: "Edit", icon: MousePointer2 },
  { id: "inspect", label: "Inspect", icon: MousePointer2 },
  { id: "comment", label: "Comment", icon: MessageSquare },
];

export function Toolbar({ onExport, onSettings, onExtract }: Props) {
  const project = useStudio((s) => s.project);
  const setMode = useStudio((s) => s.setMode);
  const setName = useStudio((s) => s.setName);
  const addArtboard = useStudio((s) => s.addArtboard);
  const duplicateArtboard = useStudio((s) => s.duplicateArtboard);
  const removeArtboard = useStudio((s) => s.removeArtboard);
  const arrangeArtboards = useStudio((s) => s.arrangeArtboards);

  if (!project) return null;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/8 bg-[#120f18] px-3">
      <Link href="/" className="font-serif text-lg tracking-tight text-amber-100">
        Atelier
      </Link>
      <Input
        data-testid="project-name"
        className="h-7 max-w-[240px] border-transparent bg-transparent text-sm"
        value={project.name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="ml-2 flex rounded-lg bg-black/40 p-0.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            data-testid={`mode-${m.id}`}
            onClick={() => setMode(m.id)}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs",
              project.mode === m.id ? "bg-white/10 text-amber-100" : "text-stone-400 hover:text-stone-200",
            )}
          >
            <m.icon className="size-3.5" />
            {m.label}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          data-testid="add-artboard"
          onClick={() => addArtboard({ title: "New board" })}
        >
          <Plus />
          Artboard
        </Button>
        <Button
          size="icon"
          variant="ghost"
          title="Duplicate"
          data-testid="duplicate-artboard"
          onClick={() => project.selectedArtboardId && duplicateArtboard(project.selectedArtboardId)}
        >
          <Copy />
        </Button>
        <Button size="icon" variant="ghost" title="Arrange" data-testid="arrange-artboards" onClick={arrangeArtboards}>
          <LayoutGrid />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          title="Delete"
          onClick={() => project.selectedArtboardId && removeArtboard(project.selectedArtboardId)}
        >
          <Trash2 />
        </Button>
        <Button size="sm" variant="ghost" onClick={onExtract}>
          Tokens
        </Button>
        <Button size="sm" variant="secondary" data-testid="open-export" onClick={onExport}>
          <Share2 />
          Export
        </Button>
        <Button size="icon" variant="ghost" data-testid="open-settings" onClick={onSettings}>
          <Settings2 />
        </Button>
      </div>
    </header>
  );
}
