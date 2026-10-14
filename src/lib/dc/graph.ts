import { parseDcImports } from "./parse";
import { DC_EXT } from "./types";

export type FileMap = Record<string, string>;

export function normalizeDcPath(src: string, fromPath = ""): string {
  let s = src.trim().replace(/^\.\//, "");
  if (!s) return s;
  if (!s.endsWith(DC_EXT) && !s.includes(".")) s = `${s}${DC_EXT}`;
  if (s.startsWith("/")) s = s.slice(1);
  const fromDir = fromPath.includes("/") ? fromPath.slice(0, fromPath.lastIndexOf("/") + 1) : "";
  if (s.startsWith("../") || fromDir) {
    const joined = resolveRelative(fromDir + s);
    return joined;
  }
  return s;
}

function resolveRelative(path: string): string {
  const parts: string[] = [];
  for (const seg of path.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

export function listDcFiles(files: FileMap): string[] {
  return Object.keys(files)
    .filter((p) => p.endsWith(DC_EXT))
    .sort();
}

export function importEdges(files: FileMap): Map<string, string[]> {
  const edges = new Map<string, string[]>();
  for (const path of listDcFiles(files)) {
    const imports = parseDcImports(files[path] ?? "")
      .map((imp) => normalizeDcPath(imp.src, path))
      .filter(Boolean);
    edges.set(path, [...new Set(imports)]);
  }
  return edges;
}

/** Returns the first cycle as a path list (start node repeated at end), or null. */
export function findCycle(files: FileMap): string[] | null {
  const edges = importEdges(files);
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function dfs(node: string): string[] | null {
    if (visiting.has(node)) {
      const i = stack.indexOf(node);
      return [...stack.slice(i), node];
    }
    if (visited.has(node)) return null;
    visiting.add(node);
    stack.push(node);
    for (const next of edges.get(node) ?? []) {
      if (!files[next] && !edges.has(next)) continue;
      const cycle = dfs(next);
      if (cycle) return cycle;
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
    return null;
  }

  for (const node of edges.keys()) {
    const cycle = dfs(node);
    if (cycle) return cycle;
  }
  return null;
}

export function wouldCreateCycle(files: FileMap, from: string, to: string): boolean {
  const next = { ...files };
  const src = next[from] ?? "";
  const injected = `<dc-import src="${to}"></dc-import>`;
  next[from] = src.includes("</body>")
    ? src.replace("</body>", `${injected}</body>`)
    : src + injected;
  return findCycle(next) !== null;
}

/** Every file that transitively imports `path` (including path itself). */
export function dependentsOf(files: FileMap, path: string): string[] {
  const edges = importEdges(files);
  const reverse = new Map<string, string[]>();
  for (const [from, tos] of edges) {
    for (const to of tos) {
      const list = reverse.get(to) ?? [];
      list.push(from);
      reverse.set(to, list);
    }
  }
  const out = new Set<string>([path]);
  const queue = [path];
  while (queue.length) {
    const cur = queue.pop()!;
    for (const parent of reverse.get(cur) ?? []) {
      if (!out.has(parent)) {
        out.add(parent);
        queue.push(parent);
      }
    }
  }
  return [...out];
}

export function lookupFile(files: FileMap, src: string, fromPath = ""): string | null {
  const normalized = normalizeDcPath(src, fromPath);
  if (files[normalized] != null) return normalized;
  const base = normalized.split("/").pop() ?? normalized;
  const hit = Object.keys(files).find((p) => p === base || p.endsWith("/" + base));
  return hit ?? null;
}
