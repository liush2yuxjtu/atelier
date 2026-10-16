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
import { INSPECTOR_KEYS, isGenerativeKey, optionLabel } from "@/lib/tweak-bind";
import { cn } from "@/lib/cn";
import type { Artboard, TweakField } from "@/lib/types";

const COMPACT_KEYS = new Set(["look", "fxSpeed", "fxGlow", "heroLayout"]);

const GROUPS = ["prepared", "look", "motion", "geometry", "visibility", "layout", "type", "copy", "other"];
const GROUP_LABELS: Record<string, string> = {
  prepared: "Prepared for this design",
  look: "Look",
  motion: "Motion",
  geometry: "Geometry",
  visibility: "Visibility",
  layout: "Layout",
  type: "Type",
  copy: "Copy",
  other: "Other",
};

function groupOf(key: string, field: TweakField): string {
  if (isGenerativeKey(key, field)) return "prepared";
  if (parseSectionKey(key)) return "layout";
  const g = field.group ?? "";
  if (g === "color" || g === "look") return "look";
  if (g === "density") return "layout";
  return GROUPS.includes(g) ? g : "other";
}

function shouldUseRadios(field: TweakField, compact?: boolean): boolean {
  if (compact) return false;
  if (field.type !== "select") return false;
  if (field.control === "select") return false;
  if (field.control === "radio") return true;
  return (field.options?.length ?? 0) > 0 && (field.options?.length ?? 0) <= 4;
}

interface Props {
  board: Artboard;
  compact?: boolean;
}

export function TweakControls({ board, compact }: Props) {
  const project = useStudio((s) => s.project);
  const recentlyAdded = useStudio((s) => s.recentlyAddedTweakKeys);
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
  const merged = {
    ...(project?.themeSchema ?? {}),
    ...structural,
    ...board.tweakSchema,
  };
  const generative = Object.keys(board.tweakSchema).some((k) =>
    isGenerativeKey(k, board.tweakSchema[k]),
  );

  const entries = Object.entries(merged)
    .filter(([key]) => {
      if (compact) {
        return COMPACT_KEYS.has(key);
      }
      if (board.kind === "dc") return true;
      if (generative && (INSPECTOR_KEYS.has(key) || key.startsWith("fx") || parseSectionKey(key))) {
        return false;
      }
      return true;
    })
    .map(([key, field], i) => ({ key, field, i, g: groupOf(key, field) }))
    .sort((a, b) => GROUPS.indexOf(a.g) - GROUPS.indexOf(b.g) || a.i - b.i)
    .map(({ key, field, g }) => [key, field, g] as [string, TweakField, string]);

  function setField(key: string, field: TweakField, value: string | number | boolean) {
    if (field.type === "palette" || key === "look") {
      applyPalette(board.id, String(value));
      return;
    }
    let next: string | number | boolean = value;
    if (key === "planCount") next = Number(value);
    setTweaks(board.id, { ...board.tweaks, [key]: next });
  }

  return (
    <div className={cn(compact ? "flex flex-wrap items-end gap-x-5 gap-y-2" : "space-y-3")}>
      {entries.map(([key, field, group], idx) => {
        const header = !compact && (idx === 0 || entries[idx - 1]![2] !== group);
        const value = board.tweaks[key] ?? field.value;
        const linked = project ? linkedBoardCount(project, key) : 0;
        const sec = parseSectionKey(key);
        const detached = sec ? isSectionUnlinked(board, sec.id) : isTokenUnlinked(board, key);
        const radios = shouldUseRadios(field, compact);
        return (
          <div
            key={key}
            data-recently-added={recentlyAdded.includes(key) ? "true" : "false"}
            className={cn(
              "space-y-1.5 rounded-md transition-[box-shadow,background-color] duration-500",
              compact && field.type !== "palette" && "w-[150px]",
              recentlyAdded.includes(key) && "bg-amber-300/10 ring-1 ring-amber-300/50",
            )}
          >
            {header && (
              <div
                data-testid={`tweak-group-${group}`}
                className="border-t border-white/8 pt-3 text-[10px] font-semibold tracking-[0.16em] text-amber-200/70 uppercase first:border-t-0 first:pt-0"
              >
                {GROUP_LABELS[group] ?? group}
              </div>
            )}
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
              <div className="flex items-center gap-2" data-testid={`tweak-${key}`}>
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
            {radios && (
              <div className="flex flex-wrap gap-1.5" data-testid={`tweak-${key}`} role="radiogroup">
                {(field.options ?? []).map((o) => {
                  const active = String(value) === String(o);
                  return (
                    <button
                      key={o}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      data-testid={`tweak-${key}-${o}`}
                      data-active={active ? "true" : "false"}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px]",
                        active
                          ? "border-amber-300/80 bg-amber-300/15 text-amber-100"
                          : "border-white/10 text-stone-400 hover:text-stone-200",
                      )}
                      onClick={() => setField(key, field, o)}
                    >
                      {optionLabel(field, o)}
                    </button>
                  );
                })}
              </div>
            )}
            {field.type === "select" && !radios && (
              <select
                data-testid={`tweak-${key}`}
                className="h-8 w-full rounded-md border border-white/10 bg-black/30 px-2 text-sm"
                value={String(value)}
                onChange={(e) => setField(key, field, e.target.value)}
              >
                {(field.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {optionLabel(field, o)}
                  </option>
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
