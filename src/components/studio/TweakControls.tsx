"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PALETTE_LABELS } from "@/lib/palettes";
import { useStudio } from "@/lib/store";
import {
  boardHasSection,
  isSectionUnlinked,
  isTokenUnlinked,
  linkedBoardCount,
  parseSectionKey,
  sectionSchema,
} from "@/lib/theme";
import { cn } from "@/lib/cn";
import type { Artboard, TweakField } from "@/lib/types";

const COMPACT_KEYS = new Set(["look", "accent", "density"]);

interface Props {
  board: Artboard;
  compact?: boolean;
}

export function TweakControls({ board, compact }: Props) {
  const project = useStudio((s) => s.project);
  const setTweaks = useStudio((s) => s.setTweaks);
  const applyPalette = useStudio((s) => s.applyPalette);
  const unlinkTweak = useStudio((s) => s.unlinkTweak);
  const pushOverride = useStudio((s) => s.pushOverride);
  const structural = Object.fromEntries(
    Object.entries(sectionSchema(project?.sections ?? {})).filter(([key]) => {
      const sec = parseSectionKey(key);
      return !sec || boardHasSection(board, sec.id);
    }),
  );
  const schema = {
    ...(project?.themeSchema ?? {}),
    ...structural,
    ...board.tweakSchema,
  };
  const entries = Object.entries(schema).filter(([key]) =>
    compact ? COMPACT_KEYS.has(key) : true,
  );

  function setField(key: string, field: TweakField, value: string | number | boolean) {
    if (field.type === "palette" || key === "look") {
      applyPalette(board.id, String(value));
      return;
    }
    setTweaks(board.id, { ...board.tweaks, [key]: value });
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {entries.map(([key, field]) => {
        const value = board.tweaks[key] ?? field.value;
        const linked = project ? linkedBoardCount(project, key) : 0;
        const sec = parseSectionKey(key);
        const detached = sec ? isSectionUnlinked(board, sec.id) : isTokenUnlinked(board, key);
        return (
          <div key={key} className="space-y-1.5">
            {!compact && (
              <div className="flex items-center justify-between gap-2">
                <Label>{field.label || key}</Label>
                {linked > 1 && (
                  <span
                    data-testid={`linked-${key}`}
                    className="rounded-full bg-amber-300/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-100"
                  >
                    linked in {linked} boards
                  </span>
                )}
              </div>
            )}
            {compact && field.type !== "palette" && (
              <div className="text-[10px] tracking-wide text-stone-500 uppercase">
                {field.label || key}
              </div>
            )}
            {field.type === "palette" && (
              <div className="flex flex-wrap gap-1.5" data-testid="palette-chips">
                {(field.options ?? Object.keys(field.swatches ?? {})).map((id) => {
                  const swatch = field.swatches?.[id]?.accent ?? "#888";
                  const active = String(value) === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      data-testid={`palette-${id}`}
                      data-active={active ? "true" : "false"}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px]",
                        active
                          ? "border-amber-300/80 bg-white/10 text-amber-100"
                          : "border-white/10 text-stone-400 hover:text-stone-200",
                      )}
                      onClick={() => setField(key, field, id)}
                    >
                      <span className="size-3 rounded-full" style={{ background: swatch }} />
                      {PALETTE_LABELS[id] ?? id}
                    </button>
                  );
                })}
              </div>
            )}
            {compact && key === "look" && linked > 1 && (
              <div className="text-[10px] font-medium tracking-wide text-amber-200/90">
                linked in {linked} boards
              </div>
            )}
            {field.type === "color" && (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  data-testid={`tweak-${key}`}
                  className="h-8 w-8 cursor-pointer rounded border border-white/10 bg-transparent"
                  value={String(value)}
                  onChange={(e) => setField(key, field, e.target.value)}
                />
                {!compact && (
                  <Input
                    value={String(value)}
                    onChange={(e) => setField(key, field, e.target.value)}
                  />
                )}
                {field.presets && field.presets.length > 0 && (
                  <div className="flex gap-1">
                    {field.presets.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        title={p.label}
                        className="size-4 rounded-full border border-white/20"
                        style={{ background: p.value }}
                        onClick={() => setField(key, field, p.value)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            {field.type === "range" && (
              <div className="flex items-center gap-2">
                <Slider
                  min={field.min ?? 0}
                  max={field.max ?? 100}
                  step={field.step ?? 1}
                  value={[Number(value)]}
                  onValueChange={([v]) => setField(key, field, v ?? 0)}
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
                onChange={(e) => setField(key, field, e.target.value)}
              />
            )}
            {field.type === "boolean" && (
              <Switch
                data-testid={`tweak-${key}`}
                checked={Boolean(value)}
                onCheckedChange={(v) => setField(key, field, v)}
              />
            )}
            {field.type === "select" && (
              <select
                data-testid={`tweak-${key}`}
                className="h-8 w-full rounded-md border border-white/10 bg-black/30 px-2 text-sm"
                value={String(value)}
                onChange={(e) => setField(key, field, e.target.value)}
              >
                {(field.options ?? []).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            )}
            {!compact && linked > 1 && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  data-testid={`unlink-${key}`}
                  onClick={() => unlinkTweak(board.id, key)}
                >
                  {detached ? "Unlinked" : "Unlink"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  data-testid={`push-${key}`}
                  onClick={() => pushOverride(board.id, key)}
                >
                  Push to all
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
