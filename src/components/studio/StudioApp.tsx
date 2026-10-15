"use client";

import { useEffect, useState } from "react";
import { useStudio } from "@/lib/store";
import { ChatPanel } from "./ChatPanel";
import { LibraryPanel } from "./LibraryPanel";
import { CanvasView } from "./CanvasView";
import { RightRail } from "./RightRail";
import { Toolbar } from "./Toolbar";
import { GlobalBar } from "./GlobalBar";
import { ExportDialog } from "./ExportDialog";
import { SettingsDialog } from "./SettingsDialog";
import { ExtractDialog } from "./ExtractDialog";
import { TooltipProvider } from "@/components/ui/tooltip";

export function StudioApp({ projectId }: { projectId: string }) {
  const hydrate = useStudio((s) => s.hydrate);
  const hydrated = useStudio((s) => s.hydrated);
  const persist = useStudio((s) => s.persist);
  const presenting = useStudio((s) => Boolean(s.project?.presenting));
  const themeLook = useStudio((s) => String(s.project?.theme?.look ?? ""));
  const pricingOrder = useStudio((s) => s.project?.sections?.pricing?.order ?? 2);
  const pricingLayout = useStudio((s) => s.project?.sections?.pricing?.layout ?? "split");
  const setPresenting = useStudio((s) => s.setPresenting);
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [extractOpen, setExtractOpen] = useState(false);

  useEffect(() => {
    void hydrate(projectId);
  }, [hydrate, projectId]);

  useEffect(() => {
    const t = window.setInterval(() => persist(), 4000);
    return () => window.clearInterval(t);
  }, [persist]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && presenting) setPresenting(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presenting, setPresenting]);

  if (!hydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#120f18] text-sm text-stone-400">
        Opening canvas…
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        className="flex h-dvh flex-col bg-[#120f18] text-stone-100"
        data-testid="studio-app"
        data-theme-look={themeLook}
        data-presenting={presenting ? "true" : "false"}
        data-pricing-order={String(pricingOrder)}
        data-pricing-layout={pricingLayout}
      >
        <Toolbar
          onExport={() => setExportOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onExtract={() => setExtractOpen(true)}
        />
        <GlobalBar />
        <div className="flex min-h-0 flex-1">
          {!presenting && <ChatPanel />}
          {!presenting && <LibraryPanel />}
          <CanvasView />
          {!presenting && <RightRail />}
        </div>
        <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        <ExtractDialog open={extractOpen} onOpenChange={setExtractOpen} />
      </div>
    </TooltipProvider>
  );
}
