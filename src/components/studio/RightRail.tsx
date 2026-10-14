"use client";

import { useState } from "react";
import { useStudio } from "@/lib/store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { encodeHost } from "@/lib/protocol";

export function RightRail() {
  const project = useStudio((s) => s.project);
  const setTweaks = useStudio((s) => s.setTweaks);
  const resolveComment = useStudio((s) => s.resolveComment);
  const addComment = useStudio((s) => s.addComment);
  const restoreVersion = useStudio((s) => s.restoreVersion);
  const writeFile = useStudio((s) => s.writeFile);
  const [draft, setDraft] = useState("");

  if (!project) return null;
  const board = project.artboards.find((b) => b.id === project.selectedArtboardId);

  return (
    <aside
      className="flex h-full w-[300px] shrink-0 flex-col border-l border-white/8 bg-[#16141f]"
      data-testid="right-rail"
    >
      <Tabs defaultValue="tweaks" className="flex h-full flex-col">
        <div className="border-b border-white/8 px-3 py-2">
          <TabsList>
            <TabsTrigger value="tweaks" data-testid="tab-tweaks">
              {board?.kind === "dc" ? "Props" : "Tweaks"}
            </TabsTrigger>
            <TabsTrigger value="inspect" data-testid="tab-inspect">
              Inspect
            </TabsTrigger>
            <TabsTrigger value="comments" data-testid="tab-comments">
              Notes
            </TabsTrigger>
            <TabsTrigger value="files" data-testid="tab-files">
              Files
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="tweaks" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-3" data-testid="tweak-panel">
              {!board && <Empty>Select an artboard.</Empty>}
              {board?.kind === "dc" && (
                <p className="text-[11px] leading-relaxed text-stone-500" data-testid="dc-props-hint">
                  Instance props for{" "}
                  <span className="font-mono text-amber-200/80">{board.dcPath}</span>. Changing these
                  does not rewrite the component file.
                </p>
              )}
              {board && Object.keys(board.tweakSchema).length === 0 && (
                <Empty>
                  {board.kind === "dc"
                    ? "This component has an empty prop schema."
                    : "This board has no declared tweaks. Ask the agent to make it tweakable."}
                </Empty>
              )}
              {board &&
                Object.entries(board.tweakSchema).map(([key, field]) => {
                  const value = board.tweaks[key] ?? field.value;
                  return (
                    <div key={key} className="space-y-1.5">
                      <Label>{field.label || key}</Label>
                      {field.type === "color" && (
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            data-testid={`tweak-${key}`}
                            className="h-8 w-8 cursor-pointer rounded border border-white/10 bg-transparent"
                            value={String(value)}
                            onChange={(e) =>
                              setTweaks(board.id, { ...board.tweaks, [key]: e.target.value })
                            }
                          />
                          <Input
                            value={String(value)}
                            onChange={(e) =>
                              setTweaks(board.id, { ...board.tweaks, [key]: e.target.value })
                            }
                          />
                        </div>
                      )}
                      {field.type === "range" && (
                        <div className="flex items-center gap-2">
                          <Slider
                            min={field.min ?? 0}
                            max={field.max ?? 100}
                            step={field.step ?? 1}
                            value={[Number(value)]}
                            onValueChange={([v]) =>
                              setTweaks(board.id, { ...board.tweaks, [key]: v ?? 0 })
                            }
                          />
                          <span className="w-10 text-right text-xs text-stone-400">
                            {value}
                            {field.unit ?? ""}
                          </span>
                        </div>
                      )}
                      {field.type === "text" && (
                        <Input
                          data-testid={`tweak-${key}`}
                          value={String(value)}
                          onChange={(e) =>
                            setTweaks(board.id, { ...board.tweaks, [key]: e.target.value })
                          }
                        />
                      )}
                      {field.type === "boolean" && (
                        <Switch
                          data-testid={`tweak-${key}`}
                          checked={Boolean(value)}
                          onCheckedChange={(v) =>
                            setTweaks(board.id, { ...board.tweaks, [key]: v })
                          }
                        />
                      )}
                      {field.type === "select" && (
                        <select
                          className="h-8 w-full rounded-md border border-white/10 bg-black/30 px-2 text-sm"
                          value={String(value)}
                          onChange={(e) =>
                            setTweaks(board.id, { ...board.tweaks, [key]: e.target.value })
                          }
                        >
                          {(field.options ?? []).map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="inspect" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-3" data-testid="inspector">
              {!project.selectedSelector && <Empty>Click an element in Edit or Inspect mode.</Empty>}
              {project.selectedSelector && (
                <>
                  <div>
                    <Label>Selector</Label>
                    <div className="mt-1 font-mono text-xs text-amber-200/90">
                      {project.selectedSelector}
                    </div>
                  </div>
                  <div>
                    <Label>Text</Label>
                    <Textarea
                      rows={3}
                      value={project.selectedText ?? ""}
                      onChange={(e) => {
                        if (!board || !project.selectedSelector) return;
                        window.dispatchEvent(
                          new MessageEvent("atelier:host-style", { data: true }),
                        );
                        document.querySelectorAll("iframe").forEach((f) => {
                          f.contentWindow?.postMessage(
                            encodeHost(
                              {
                                type: "edit-text",
                                selector: project.selectedSelector!,
                                text: e.target.value,
                              },
                              `${board.id}:${board.version}`,
                            ),
                            "*",
                          );
                        });
                      }}
                    />
                  </div>
                  {project.selectedStyles &&
                    ["color", "backgroundColor", "fontSize", "fontWeight", "borderRadius"].map(
                      (k) => (
                        <div key={k}>
                          <Label>{k}</Label>
                          <Input
                            value={project.selectedStyles?.[k] ?? ""}
                            onChange={(e) => {
                              if (!board || !project.selectedSelector) return;
                              document.querySelectorAll("iframe").forEach((f) => {
                                f.contentWindow?.postMessage(
                                  encodeHost(
                                    {
                                      type: "edit-style",
                                      selector: project.selectedSelector!,
                                      styles: { [k]: e.target.value },
                                    },
                                    `${board.id}:${board.version}`,
                                  ),
                                  "*",
                                );
                              });
                            }}
                          />
                        </div>
                      ),
                    )}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="comments" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-3" data-testid="comments-panel">
              {!board && <Empty>Select an artboard.</Empty>}
              {board?.comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-white/8 bg-black/20 p-2 text-xs"
                >
                  <div className="mb-1 text-stone-500">
                    {c.selector ?? "pin"} · {c.resolved ? "resolved" : "open"}
                  </div>
                  <div className="text-stone-200">{c.body || "(empty pin)"}</div>
                  {!c.resolved && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1"
                      onClick={() => resolveComment(board.id, c.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              ))}
              {board && (
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!draft.trim()) return;
                    addComment(board.id, {
                      x: 40,
                      y: 40,
                      body: draft.trim(),
                      resolved: false,
                      queued: true,
                    });
                    setDraft("");
                  }}
                >
                  <Textarea
                    data-testid="comment-draft"
                    rows={3}
                    placeholder="Pin a note for the next turn…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <Button size="sm" type="submit">
                    Queue comment
                  </Button>
                </form>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="files" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3 p-3" data-testid="files-panel">
              <Label>Project files</Label>
              {project.files.length === 0 && <Empty>No files yet.</Empty>}
              {project.files.map((f) => (
                <details key={f.path} className="rounded-md border border-white/8 bg-black/20 p-2">
                  <summary className="cursor-pointer font-mono text-xs text-amber-200/80">
                    {f.path}
                  </summary>
                  <textarea
                    className="mt-2 h-32 w-full bg-transparent font-mono text-[11px] text-stone-300 outline-none"
                    defaultValue={f.content}
                    onBlur={(e) => writeFile(f.path, e.target.value)}
                  />
                </details>
              ))}
              <Label>History</Label>
              {project.versions.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className="block w-full rounded-md border border-white/8 px-2 py-1.5 text-left text-xs text-stone-300 hover:bg-white/5"
                  onClick={() => restoreVersion(v.id)}
                >
                  {v.label}
                  <span className="ml-2 text-stone-600">
                    {new Date(v.createdAt).toLocaleTimeString()}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-stone-500">{children}</p>;
}
