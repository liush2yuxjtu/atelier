import type { ArtboardKind } from "../types";
import { detectKind } from "../sandbox/compile";

export interface ParsedArtboard {
  title: string;
  kind: ArtboardKind;
  width: number;
  height: number;
  source: string;
}

export interface ParsedCommand {
  resolveCommentIds: string[];
  artboards: ParsedArtboard[];
  files: { path: string; content: string }[];
  prose: string;
}

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z_:][\w:.-]*)=["']([^"']*)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) {
    out[m[1].toLowerCase()] = m[2];
  }
  return out;
}

function normalizeKind(raw: string | undefined, source: string): ArtboardKind {
  return detectKind(source, raw);
}

export function parseAgentOutput(text: string): ParsedCommand {
  const artboards: ParsedArtboard[] = [];
  const files: { path: string; content: string }[] = [];
  const resolveCommentIds: string[] = [];

  const boardRe = /<artboard\b([^>]*)>([\s\S]*?)<\/artboard>/gi;
  let m: RegExpExecArray | null;
  while ((m = boardRe.exec(text))) {
    const a = attrs(m[1]);
    const source = stripFence(m[2].trim());
    artboards.push({
      title: a.title || a.name || "Untitled",
      kind: normalizeKind(a.kind || a.type, source),
      width: num(a.width, 1280),
      height: num(a.height, 800),
      source,
    });
  }

  const fileRe = /<file\s+path=["']([^"']+)["'][^>]*>([\s\S]*?)<\/file>/gi;
  while ((m = fileRe.exec(text))) {
    files.push({ path: m[1], content: stripFence(m[2].trim()) });
  }

  const resRe = /<resolve-comment\s+id=["']([^"']+)["']\s*\/>/gi;
  while ((m = resRe.exec(text))) {
    resolveCommentIds.push(m[1]);
  }

  const prose = text
    .replace(/<artboard\b([^>]*)>([\s\S]*?)<\/artboard>/gi, "")
    .replace(/<file\s+path=["']([^"']+)["'][^>]*>([\s\S]*?)<\/file>/gi, "")
    .replace(/<resolve-comment\s+id=["']([^"']+)["']\s*\/>/gi, "")
    .trim();

  return { artboards, files, resolveCommentIds, prose };
}

/** Incremental parse while the model is still streaming — include an unclosed last artboard. */
export function parseStreaming(text: string): ParsedCommand {
  const complete = parseAgentOutput(text);
  const opened = text.match(/<artboard\b/gi)?.length ?? 0;
  if (complete.artboards.length === opened) return complete;

  const open = text.match(/<artboard\b([^>]*)>([\s\S]*)$/i);
  if (!open) return complete;
  const a = attrs(open[1]);
  const source = stripFence(open[2].replace(/<\/artboard>\s*$/i, "").trim());
  if (!source) return complete;
  complete.artboards.push({
    title: a.title || a.name || "Streaming",
    kind: normalizeKind(a.kind || a.type, source),
    width: num(a.width, 1280),
    height: num(a.height, 800),
    source,
  });
  return complete;
}

function num(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function stripFence(s: string): string {
  return s
    .replace(/^```(?:html|jsx|tsx|svg|markdown|md|mermaid)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

export function layoutNewArtboards(
  existing: { x: number; y: number; width: number }[],
  incoming: ParsedArtboard[],
): { x: number; y: number }[] {
  const gap = 80;
  let cursorX = 80;
  let cursorY = 80;
  if (existing.length > 0) {
    const maxRight = Math.max(...existing.map((a) => a.x + a.width));
    cursorX = maxRight + gap;
    cursorY = Math.min(...existing.map((a) => a.y));
  }
  return incoming.map((board) => {
    const pos = { x: cursorX, y: cursorY };
    cursorX += board.width + gap;
    return pos;
  });
}
