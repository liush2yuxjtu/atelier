"use client";

import { useRef, useState } from "react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queuedCommentsPrompt, useStudio } from "@/lib/store";
import { parseStreaming } from "@/lib/agent/parse";
import { streamOfflineReply } from "@/lib/agent/offline";
import { hasClientKey } from "@/lib/providers";
import { ATELIER_SYSTEM_PROMPT } from "@/lib/agent/prompt";
import { extractAddTweaksTopic } from "@/lib/add-tweaks";

export function ChatPanel() {
  const project = useStudio((s) => s.project);
  const busy = useStudio((s) => s.busy);
  const settings = useStudio((s) => s.settings);
  const addMessage = useStudio((s) => s.addMessage);
  const appendMessage = useStudio((s) => s.appendMessage);
  const applyParsed = useStudio((s) => s.applyParsed);
  const snapshot = useStudio((s) => s.snapshot);
  const setBusy = useStudio((s) => s.setBusy);
  const updateArtboard = useStudio((s) => s.updateArtboard);
  const persist = useStudio((s) => s.persist);
  const addTweaksFromPrompt = useStudio((s) => s.addTweaksFromPrompt);
  const [text, setText] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);

  if (!project) return null;

  async function send(raw?: string) {
    const content = (raw ?? text).trim();
    if (!content || busy || !project) return;
    setText("");

    const addTopic = extractAddTweaksTopic(content);
    if (addTopic) {
      const boardId = project.selectedArtboardId ?? project.artboards[0]?.id;
      addMessage("user", content);
      const assistantId = addMessage("assistant", "");
      if (!boardId) {
        appendMessage(assistantId, "Select an artboard first, then ask to add more tweaks.");
        return;
      }
      setBusy(true);
      const result = await addTweaksFromPrompt(boardId, addTopic);
      setBusy(false);
      if (result.error) {
        appendMessage(assistantId, result.error);
      } else {
        appendMessage(
          assistantId,
          `Added ${result.addedKeys.length} tweak${result.addedKeys.length === 1 ? "" : "s"} (${result.addedKeys.join(", ")}). Toggle them in the Tweaks panel — no more tokens needed.`,
        );
      }
      persist();
      return;
    }

    addMessage("user", content);
    const assistantId = addMessage("assistant", "");
    setBusy(true);
    let acc = "";
    try {
      const context = buildContext(content);
      if (!hasClientKey(settings) && !process.env.NEXT_PUBLIC_HAS_SERVER_KEY) {
        for await (const chunk of streamOfflineReply(content)) {
          acc += chunk;
          appendMessage(assistantId, chunk);
          applyParsed(parseStreaming(acc), true);
        }
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            settings,
            messages: [
              ...project.messages.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: context },
            ],
          }),
        });
        if (!res.ok || !res.body) {
          const err = await res.text();
          appendMessage(assistantId, `\n\nRequest failed: ${err.slice(0, 400)}`);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          acc += chunk;
          appendMessage(assistantId, chunk);
          applyParsed(parseStreaming(acc), true);
        }
      }
      applyParsed(parseStreaming(acc), false);
      snapshot(`After: ${content.slice(0, 40)}`);
      persist();
      queueMicrotask(() => autoFixIfNeeded());
    } catch (err) {
      appendMessage(
        assistantId,
        `\n\n${err instanceof Error ? err.message : "Generation failed."}`,
      );
    } finally {
      setBusy(false);
    }
  }

  function buildContext(user: string) {
    if (!project) return user;
    const boards = project.artboards
      .map((b) => `- ${b.title} (${b.kind}, ${b.width}×${b.height})`)
      .join("\n");
    return `${user}${queuedCommentsPrompt(project)}\n\nCurrent artboards:\n${boards || "(none)"}`;
  }

  function autoFixIfNeeded() {
    const p = useStudio.getState().project;
    if (!p) return;
    const broken = p.artboards.find((b) => b.error && !b.autoFixed);
    if (!broken) return;
    updateArtboard(broken.id, { status: "fixing", autoFixed: true });
    void send(
      `The artboard titled "${broken.title}" failed to load with this error:\n${broken.error}\nFix the HTML and re-emit the same <artboard title="${broken.title}" ...> keeping layout. Do not apologize at length.`,
    );
  }

  return (
    <aside
      className="flex h-full w-[360px] shrink-0 flex-col border-r border-white/8 bg-[#16141f]"
      data-testid="chat-panel"
    >
      <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
        <Sparkles className="size-4 text-amber-300" />
        <div>
          <div className="text-sm font-medium text-stone-100">Chat</div>
          <div className="text-[11px] text-stone-500">
            {hasClientKey(settings) ? settings.model : "Offline draft model"}
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {project.messages.length === 0 && (
            <div className="rounded-lg border border-white/8 bg-black/20 p-3 text-sm text-stone-400">
              Describe a page, deck, poster, or product UI. I’ll place artboards on the canvas to the right. You can tweak colors without calling me again.
            </div>
          )}
          {project.messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ml-6 rounded-xl bg-amber-200/90 px-3 py-2 text-sm text-stone-950"
                  : "mr-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-300"
              }
              data-testid={`msg-${m.role}`}
            >
              {stripTags(m.content)}
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-amber-200/80">
              <Loader2 className="size-3.5 animate-spin" />
              Writing to the canvas…
            </div>
          )}
        </div>
      </ScrollArea>
      <form
        className="border-t border-white/8 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="rounded-xl border border-white/10 bg-black/30 p-2">
          <textarea
            ref={box}
            data-testid="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Ask for a landing page, a deck, a variant…"
            rows={3}
            className="w-full resize-none bg-transparent text-sm text-stone-100 outline-none placeholder:text-stone-600"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-stone-600">Enter to send</span>
            <Button type="submit" size="sm" disabled={busy || !text.trim()} data-testid="chat-send">
              <ArrowUp className="size-3.5" />
              Send
            </Button>
          </div>
        </div>
        <p className="sr-only">{ATELIER_SYSTEM_PROMPT.slice(0, 20)}</p>
      </form>
    </aside>
  );
}

function stripTags(s: string) {
  return s
    .replace(/<artboard\b[\s\S]*?<\/artboard>/gi, "\n[artboard placed]\n")
    .replace(/<dc-write\b[\s\S]*?<\/dc-write>/gi, "\n[component written]\n")
    .replace(/<dc-set-props\b[\s\S]*?<\/dc-set-props>/gi, "\n[props updated]\n")
    .replace(/<file\b[\s\S]*?<\/file>/gi, "\n[file written]\n")
    .replace(/<resolve-comment[^>]*\/>/gi, "")
    .trim();
}
