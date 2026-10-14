"use client";

import { useMemo } from "react";
import { Boxes, GripVertical, Plus } from "lucide-react";
import { useStudio } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { filesFromList, flattenAllSafe, listDcFiles, parseDcSchema } from "@/lib/dc";
import { DC_DRAG_MIME } from "@/lib/dc/types";

export function LibraryPanel() {
  const project = useStudio((s) => s.project);
  const placeDc = useStudio((s) => s.placeDc);

  const items = useMemo(() => {
    if (!project) return [];
    const map = filesFromList(project.files);
    return listDcFiles(map).map((path) => {
      const schema = parseDcSchema(map[path] ?? "");
      const flat = flattenAllSafe(path, map);
      const preview = schema.preview ?? { width: 320, height: 200 };
      return { path, schema, html: flat.html, preview, error: flat.error };
    });
  }, [project]);

  if (!project) return null;

  return (
    <aside
      className="flex h-full w-[196px] shrink-0 flex-col border-r border-white/8 bg-[#14121c]"
      data-testid="library-panel"
    >
      <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2.5">
        <Boxes className="size-3.5 text-amber-200/80" />
        <div className="text-[11px] font-medium tracking-wide text-stone-300 uppercase">
          Components
        </div>
        <span className="ml-auto font-mono text-[10px] text-stone-600">{items.length}</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-2">
          {items.length === 0 && (
            <p className="px-1 text-[11px] leading-relaxed text-stone-500">
              No <span className="font-mono">.dc.html</span> files yet. Ask the agent to write one,
              or drop a component onto the canvas once it exists.
            </p>
          )}
          {items.map((item) => {
            const scale = Math.min(164 / item.preview.width, 88 / item.preview.height, 1);
            return (
              <div
                key={item.path}
                draggable
                data-testid={`library-item-${item.schema.name}`}
                onDragStart={(e) => {
                  e.dataTransfer.setData(DC_DRAG_MIME, item.path);
                  e.dataTransfer.setData("text/plain", item.path);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="cursor-grab rounded-lg border border-white/8 bg-black/25 p-1.5 active:cursor-grabbing"
              >
                <div className="mb-1 flex items-center gap-1 px-0.5">
                  <GripVertical className="size-3 text-stone-600" />
                  <div className="min-w-0 flex-1 truncate font-mono text-[10px] text-amber-100/90">
                    {item.schema.name}
                  </div>
                </div>
                <div className="relative h-[88px] overflow-hidden rounded-md bg-[#0c0a10] ring-1 ring-white/6">
                  {item.error ? (
                    <p className="p-2 text-[10px] text-red-300">{item.error}</p>
                  ) : (
                    <iframe
                      title={item.schema.name}
                      sandbox="allow-scripts"
                      srcDoc={item.html}
                      className="pointer-events-none origin-top-left border-0 bg-white"
                      style={{
                        width: item.preview.width,
                        height: item.preview.height,
                        transform: `scale(${scale})`,
                      }}
                    />
                  )}
                </div>
                <div className="mt-1.5 flex items-center justify-between px-0.5">
                  <span className="truncate font-mono text-[9px] text-stone-600">{item.path}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 text-[10px]"
                    data-testid={`library-place-${item.schema.name}`}
                    onClick={() => placeDc(item.path)}
                  >
                    <Plus className="size-3" />
                    Place
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
