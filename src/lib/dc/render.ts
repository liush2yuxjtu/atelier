import { parseDc, schemaDefaults } from "./parse";
import { findCycle, lookupFile, type FileMap } from "./graph";
import type { DcPropMap, DcSchema, FlattenResult } from "./types";

const HOLE_RE = /\{\{\s*([a-zA-Z_][\w.]*)\s*\}\}/g;

export function lookupValue(values: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = values;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export function interpolate(template: string, values: Record<string, unknown>): string {
  return template.replace(HOLE_RE, (_, path: string) => {
    const v = lookupValue(values, path);
    if (v == null) return "";
    return String(v);
  });
}

export function interpolateProps(raw: DcPropMap, parent: DcPropMap): DcPropMap {
  const out: DcPropMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== "string") {
      out[key] = value;
      continue;
    }
    const s = interpolate(value, parent as Record<string, unknown>);
    if (s === "true") out[key] = true;
    else if (s === "false") out[key] = false;
    else out[key] = s;
  }
  return out;
}

export function mergeProps(schema: DcSchema, instance?: DcPropMap): DcPropMap {
  return { ...schemaDefaults(schema), ...(instance ?? {}) };
}

export function cssVarsFor(props: DcPropMap, schema: DcSchema): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    lines.push(`  --dc-${key}: ${formatProp(value, schema.props[key]?.unit)};`);
    lines.push(`  --tweak-${key}: ${formatProp(value, schema.props[key]?.unit)};`);
  }
  return lines.length ? `:root {\n${lines.join("\n")}\n}` : "";
}

export function inlineVarStyle(props: DcPropMap, schema: DcSchema): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    parts.push(`--dc-${key}:${formatProp(value, schema.props[key]?.unit)}`);
    parts.push(`--tweak-${key}:${formatProp(value, schema.props[key]?.unit)}`);
  }
  return parts.join(";");
}

function formatProp(value: string | number | boolean, unit?: string): string {
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return unit ? `${value}${unit}` : String(value);
  return String(value);
}

function injectVars(html: string, props: DcPropMap, schema: DcSchema): string {
  const css = cssVarsFor(props, schema);
  if (!css) return html;
  const tag = `<style data-atelier-dc-vars>${css}</style>`;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${tag}</head>`);
  return tag + html;
}

function fillSlots(html: string, slots: Record<string, string>): string {
  return html.replace(/<slot(?:\s+name=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/slot>/gi, (_, name, fallback) => {
    const key = name || "default";
    return slots[key] != null && slots[key] !== "" ? slots[key] : fallback;
  });
}

function extractMount(html: string): string {
  const root = html.match(/<([a-zA-Z][\w-]*)[^>]*data-dc-root[^>]*>[\s\S]*?<\/\1>/);
  if (root) return root[0];
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (body) return body[1].trim();
  return html;
}

function extractLocalStyles(source: string): string {
  const tags: string[] = [];
  const re = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    if (/data-atelier-dc-vars/i.test(m[1] || "")) continue;
    tags.push(`<style${m[1]}>${m[2]}</style>`);
  }
  return tags.join("");
}

function emptyResult(path: string, error: string, html?: string): FlattenResult {
  const body = html ?? `<!-- ${error} -->`;
  return {
    html: body,
    fragment: body,
    schema: { name: path, props: {}, slots: [] },
    imports: [],
    error,
  };
}

export function flattenDc(
  path: string,
  files: FileMap,
  instanceProps?: DcPropMap,
  stack: string[] = [],
): FlattenResult {
  const resolved = lookupFile(files, path, stack[stack.length - 1] ?? "") ?? path;
  const source = files[resolved];
  if (source == null) {
    return emptyResult(path, `Missing Design Component "${path}"`);
  }
  if (stack.includes(resolved)) {
    const cycle = [...stack, resolved].join(" → ");
    return emptyResult(resolved, `Cycle in Design Components: ${cycle}`);
  }

  const parsed = parseDc(source);
  const props = mergeProps(parsed.schema, instanceProps);
  const nextStack = [...stack, resolved];
  const importedPaths: string[] = [];
  let body = parsed.body;

  for (const imp of parsed.imports) {
    const childPath = lookupFile(files, imp.src, resolved) ?? imp.src;
    importedPaths.push(childPath);
    const childProps = interpolateProps(imp.props, props);
    const child = flattenDc(childPath, files, childProps, nextStack);
    importedPaths.push(...child.imports);
    let mount = child.fragment || extractMount(child.html);
    mount = fillSlots(mount, imp.slots);
    if (imp.hintSize && !/min-height|min-width/.test(mount)) {
      const [w, h] = imp.hintSize.split(",").map((s) => s.trim());
      mount = mount.replace(
        /style="/,
        `style="min-width:${w || "0"};min-height:${h || "0"};`,
      );
      if (!mount.includes("min-width:")) {
        mount = `<div data-dc-size style="min-width:${w || "0"};min-height:${h || "0"}">${mount}</div>`;
      }
    }
    body = body.replace(imp.outerHtml, mount);
  }

  body = interpolate(body, props as Record<string, unknown>);
  body = fillSlots(body, {});

  let html = source;
  if (/<body[^>]*>[\s\S]*<\/body>/i.test(html)) {
    html = html.replace(/<body[^>]*>[\s\S]*<\/body>/i, `<body>\n${body}\n</body>`);
  } else {
    html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${body}</body></html>`;
  }
  html = interpolate(html, props as Record<string, unknown>);
  if (stack.length === 0) {
    html = injectVars(html, props, parsed.schema);
  }
  html = html.replace(/<dc-import\b[\s\S]*?<\/dc-import>/gi, "");

  const localStyles = extractLocalStyles(source);
  const mountInner = extractMount(`<body>${body}</body>`);
  const fragment = `<div data-dc-mount="${resolved}" style="${inlineVarStyle(props, parsed.schema)}">${localStyles}${mountInner}</div>`;

  return {
    html,
    fragment,
    schema: parsed.schema,
    imports: [...new Set(importedPaths)],
  };
}

export function flattenAllSafe(path: string, files: FileMap, instanceProps?: DcPropMap): FlattenResult {
  const resolved = lookupFile(files, path) ?? path;
  const cycle = findCycle(files);
  if (cycle && cycle.includes(resolved)) {
    const msg = `Cycle in Design Components: ${cycle.join(" → ")}`;
    return {
      html: `<pre style="padding:24px;color:#b42318">${msg}</pre>`,
      fragment: `<pre style="padding:24px;color:#b42318">${msg}</pre>`,
      schema: { name: path, props: {}, slots: [] },
      imports: [],
      error: msg,
    };
  }
  return flattenDc(path, files, instanceProps);
}

export function filesFromList(list: { path: string; content: string }[]): FileMap {
  const out: FileMap = {};
  for (const f of list) out[f.path] = f.content;
  return out;
}
