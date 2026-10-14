"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Artboard } from "@/lib/types";
import { compileArtboard } from "@/lib/sandbox/compile";
import {
  ATELIER_CHANNEL,
  acceptFromFrame,
  encodeHost,
  type FrameToHost,
} from "@/lib/protocol";
import { useStudio } from "@/lib/store";

interface Props {
  board: Artboard;
  vendorBase: string;
}

export function ArtboardFrame({ board, vendorBase }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mode = useStudio((s) => s.project?.mode ?? "preview");
  const updateArtboard = useStudio((s) => s.updateArtboard);
  const applySelection = useStudio((s) => s.applySelection);
  const addComment = useStudio((s) => s.addComment);
  const setTweaks = useStudio((s) => s.setTweaks);
  const selected = useStudio((s) => s.project?.selectedArtboardId === board.id);

  const nonce = `${board.id}:${board.version}`;

  const srcDoc = useMemo(
    () =>
      compileArtboard({
        kind: board.kind,
        source: board.source,
        nonce,
        vendorBase,
        tweaks: board.tweaks,
        tweakSchema: board.tweakSchema,
      }),
    [board.kind, board.source, board.tweaks, board.tweakSchema, nonce, vendorBase],
  );

  const post = useCallback(
    (payload: Parameters<typeof encodeHost>[0]) => {
      iframeRef.current?.contentWindow?.postMessage(encodeHost(payload, nonce), "*");
    },
    [nonce],
  );

  const handleFrame = useCallback(
    (msg: FrameToHost) => {
      switch (msg.type) {
        case "ready":
          post({ type: "init", vendorBase, nonce });
          post({ type: "set-mode", mode });
          post({ type: "apply-tweaks", tweaks: board.tweaks });
          if (
            msg.tweaks &&
            Object.keys(msg.tweaks).length > 0 &&
            Object.keys(board.tweakSchema).length === 0
          ) {
            updateArtboard(board.id, {
              tweakSchema: msg.tweaks as Artboard["tweakSchema"],
            });
          }
          break;
        case "loaded":
          if (board.status !== "ready" || board.error) {
            updateArtboard(board.id, { error: null, status: "ready" });
          }
          break;
        case "error":
          if (board.error !== msg.message) {
            updateArtboard(board.id, { error: msg.message, status: "error" });
          }
          break;
        case "selected":
          applySelection(board.id, {
            selector: msg.selector,
            text: msg.text,
            styles: msg.styles,
          });
          break;
        case "comment-pin":
          addComment(board.id, {
            x: msg.x,
            y: msg.y,
            selector: msg.selector,
            body: "",
            resolved: false,
            queued: true,
          });
          break;
        case "complete":
          void proxyComplete(msg.id, msg.prompt, post);
          break;
        case "export-result":
          window.dispatchEvent(
            new CustomEvent("atelier:export-result", { detail: { artboardId: board.id, ...msg } }),
          );
          break;
        default:
          break;
      }
    },
    [
      addComment,
      applySelection,
      board.error,
      board.id,
      board.status,
      board.tweakSchema,
      board.tweaks,
      mode,
      nonce,
      post,
      updateArtboard,
      vendorBase,
    ],
  );

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const payload = acceptFromFrame(e.data, nonce);
      if (!payload) return;
      handleFrame(payload);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [handleFrame, nonce]);

  useEffect(() => {
    post({ type: "set-mode", mode });
  }, [mode, post]);

  useEffect(() => {
    post({ type: "apply-tweaks", tweaks: board.tweaks });
  }, [board.tweaks, post]);

  useEffect(() => {
    const onExport = (e: Event) => {
      const detail = (e as CustomEvent).detail as { artboardId: string; format: "png" | "html" | "pdf-info"; requestId: string };
      if (detail.artboardId !== board.id) return;
      post({ type: "export", format: detail.format, requestId: detail.requestId });
    };
    window.addEventListener("atelier:export-request", onExport);
    return () => window.removeEventListener("atelier:export-request", onExport);
  }, [board.id, post]);

  void setTweaks;

  return (
    <div
      className="relative overflow-hidden bg-white"
      style={{ width: board.width, height: board.height }}
      data-testid={`artboard-frame-${board.id}`}
    >
      <iframe
        ref={iframeRef}
        title={board.title}
        sandbox="allow-scripts allow-downloads"
        srcDoc={srcDoc}
        className="h-full w-full border-0 bg-white"
        data-selected={selected ? "true" : "false"}
      />
      {board.status === "streaming" && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden">
          <div className="h-full w-1/2 animate-pulse bg-amber-400" />
        </div>
      )}
      {board.error && (
        <div className="absolute inset-x-3 bottom-3 rounded-md bg-red-950/90 px-3 py-2 text-xs text-red-100">
          Load error: {board.error}
        </div>
      )}
    </div>
  );
}

async function proxyComplete(
  id: string,
  prompt: string,
  post: (p: Parameters<typeof encodeHost>[0]) => void,
) {
  try {
    const res = await fetch("/api/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, settings: JSON.parse(localStorage.getItem("atelier:settings") || "{}") }),
    });
    const json = (await res.json()) as { text?: string; error?: string };
    post({ type: "complete-result", id, text: json.text, error: json.error });
  } catch (err) {
    post({
      type: "complete-result",
      id,
      error: err instanceof Error ? err.message : "complete failed",
    });
  }
}

export { ATELIER_CHANNEL };
