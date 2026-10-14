"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStudio } from "@/lib/store";
import { extractColorsFromImageData, extractFromCss, tokensToSystem } from "@/lib/extract";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ExtractDialog({ open, onOpenChange }: Props) {
  const project = useStudio((s) => s.project);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");

  function apply(name: string, source: "image" | "url" | "github", tokens: ReturnType<typeof extractFromCss>) {
    const p = useStudio.getState().project;
    if (!p) return;
    useStudio.setState({
      project: {
        ...p,
        designSystem: tokensToSystem(name, source, tokens),
        updatedAt: Date.now(),
      },
    });
    useStudio.getState().persist();
  }

  async function fromImage(file: File) {
    const bmp = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(320, bmp.width);
    canvas.height = Math.min(320, bmp.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const colors = extractColorsFromImageData(data);
    apply(
      file.name,
      "image",
      colors.map((value, i) => ({ name: `color-${i + 1}`, value, kind: "color" as const })),
    );
    setStatus(`Extracted ${colors.length} colors from ${file.name}.`);
  }

  async function fromRemote() {
    setStatus("Fetching…");
    const res = await fetch("/api/extract", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const json = (await res.json()) as { css?: string; error?: string; name?: string; source?: "url" | "github" };
    if (!json.css) {
      setStatus(json.error || "Nothing extracted");
      return;
    }
    apply(json.name || url, json.source || "url", extractFromCss(json.css));
    setStatus("Tokens placed on this project.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extract a design system</DialogTitle>
          <DialogDescription>
            Pull color and type from an image, a live URL, or a GitHub repo. Tokens land on the project and can be mentioned in chat.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void fromImage(f);
              }}
            />
          </div>
          <div className="space-y-1">
            <Label>URL or GitHub repo</Label>
            <div className="flex gap-2">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
              <Button variant="secondary" onClick={() => void fromRemote()}>
                Fetch
              </Button>
            </div>
          </div>
          {project?.designSystem && (
            <div className="flex flex-wrap gap-2">
              {project.designSystem.tokens
                .filter((t) => t.kind === "color")
                .map((t) => (
                  <span
                    key={t.name}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[11px] text-stone-300"
                  >
                    <span className="h-3 w-3 rounded-full" style={{ background: t.value }} />
                    {t.value}
                  </span>
                ))}
            </div>
          )}
          {status && <p className="text-xs text-stone-400">{status}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
