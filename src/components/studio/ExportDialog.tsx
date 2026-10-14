"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStudio } from "@/lib/store";
import {
  artboardToStandaloneHtml,
  buildZip,
  downloadBlob,
  pngsToPdf,
  pngsToPptx,
  slugify,
  type ExportPng,
} from "@/lib/export";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: Props) {
  const project = useStudio((s) => s.project);
  const [status, setStatus] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  async function collectPngs(): Promise<ExportPng[]> {
    if (!project) return [];
    const results: ExportPng[] = [];
    for (const board of project.artboards) {
      const requestId = nanoid(8);
      const png = await new Promise<ExportPng | null>((resolve) => {
        const t = setTimeout(() => resolve(null), 12000);
        const onResult = (e: Event) => {
          const d = (e as CustomEvent).detail as {
            artboardId: string;
            requestId: string;
            format: string;
            data: string;
            width?: number;
            height?: number;
          };
          if (d.requestId !== requestId) return;
          clearTimeout(t);
          window.removeEventListener("atelier:export-result", onResult);
          resolve({
            id: board.id,
            title: board.title,
            dataUrl: d.data,
            width: d.width ?? board.width * 2,
            height: d.height ?? board.height * 2,
          });
        };
        window.addEventListener("atelier:export-result", onResult);
        window.dispatchEvent(
          new CustomEvent("atelier:export-request", {
            detail: { artboardId: board.id, format: "png", requestId },
          }),
        );
      });
      if (png) results.push(png);
    }
    return results;
  }

  async function run(kind: "html" | "zip" | "pdf" | "png" | "pptx" | "share") {
    if (!project) return;
    setStatus("Exporting…");
    try {
      const name = slugify(project.name) || "atelier";
      if (kind === "html") {
        const board =
          project.artboards.find((b) => b.id === project.selectedArtboardId) ??
          project.artboards[0];
        if (!board) throw new Error("no artboard");
        const html = artboardToStandaloneHtml(board, window.location.origin, project.files);
        downloadBlob(new Blob([html], { type: "text/html" }), `${slugify(board.title)}.html`);
      } else if (kind === "zip") {
        const blob = await buildZip(project, window.location.origin);
        downloadBlob(blob, `${name}.zip`);
      } else if (kind === "png") {
        const pngs = await collectPngs();
        if (pngs[0]) {
          const res = await fetch(pngs[0].dataUrl);
          downloadBlob(await res.blob(), `${name}.png`);
        }
      } else if (kind === "pdf") {
        const pngs = await collectPngs();
        downloadBlob(pngsToPdf(pngs), `${name}.pdf`);
      } else if (kind === "pptx") {
        const pngs = await collectPngs();
        const blob = await pngsToPptx(project, pngs);
        downloadBlob(blob, `${name}.pptx`);
      } else if (kind === "share") {
        const res = await fetch("/api/share", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(project),
        });
        const json = (await res.json()) as { token?: string; error?: string };
        if (!json.token) throw new Error(json.error || "share failed");
        const url = `${window.location.origin}/share/${json.token}`;
        setShareUrl(url);
        await navigator.clipboard?.writeText(url);
      }
      setStatus("Done.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Export failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="export-dialog">
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
          <DialogDescription>
            Page size follows each artboard. PDF and PPTX rasterize the sandboxed frames.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => void run("html")} data-testid="export-html">
            HTML
          </Button>
          <Button variant="secondary" onClick={() => void run("zip")} data-testid="export-zip">
            ZIP
          </Button>
          <Button variant="secondary" onClick={() => void run("png")} data-testid="export-png">
            PNG
          </Button>
          <Button variant="secondary" onClick={() => void run("pdf")} data-testid="export-pdf">
            PDF
          </Button>
          <Button variant="secondary" onClick={() => void run("pptx")} data-testid="export-pptx">
            PPTX
          </Button>
          <Button variant="secondary" onClick={() => void run("share")} data-testid="export-share">
            Share link
          </Button>
        </div>
        {status && <p className="mt-3 text-xs text-stone-400">{status}</p>}
        {shareUrl && (
          <p className="mt-2 break-all font-mono text-xs text-amber-200" data-testid="share-url">
            {shareUrl}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
