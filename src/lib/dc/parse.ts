import type { DcImportRef, DcPropField, DcPropMap, DcSchema, ParsedDc } from "./types";
import { DC_SCRIPT_TYPE } from "./types";

const SCRIPT_RE = new RegExp(
  `<script[^>]*type=["']${DC_SCRIPT_TYPE}["'][^>]*>([\\s\\S]*?)</script>`,
  "i",
);
const IMPORT_RE = /<dc-import\b([^>]*)>([\s\S]*?)<\/dc-import>/gi;

export function extractDcSchemaJson(source: string): string | null {
  const m = source.match(SCRIPT_RE);
  return m?.[1]?.trim() ?? null;
}

export function parseDcSchema(source: string): DcSchema {
  const raw = extractDcSchemaJson(source);
  if (!raw) {
    return { name: "Component", props: {}, slots: [] };
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const props: Record<string, DcPropField> = {};
    const propsRaw = parsed.props;
    if (propsRaw && typeof propsRaw === "object" && !Array.isArray(propsRaw)) {
      for (const [key, value] of Object.entries(propsRaw as Record<string, unknown>)) {
        const field = normalizeProp(value);
        if (field) props[key] = field;
      }
    }
    const previewRaw = parsed.preview as { width?: unknown; height?: unknown } | undefined;
    const slots = Array.isArray(parsed.slots)
      ? parsed.slots.filter((s): s is string => typeof s === "string")
      : [];
    return {
      name: typeof parsed.name === "string" ? parsed.name : "Component",
      preview:
        previewRaw && typeof previewRaw.width === "number" && typeof previewRaw.height === "number"
          ? { width: previewRaw.width, height: previewRaw.height }
          : undefined,
      props,
      slots,
    };
  } catch {
    return { name: "Component", props: {}, slots: [] };
  }
}

function normalizeProp(value: unknown): DcPropField | null {
  if (!value || typeof value !== "object") return null;
  const rec = value as Record<string, unknown>;
  const type = rec.type;
  if (
    type !== "text" &&
    type !== "color" &&
    type !== "range" &&
    type !== "boolean" &&
    type !== "select" &&
    type !== "number"
  ) {
    return null;
  }
  return {
    type,
    default: (rec.default as DcPropField["default"]) ?? defaultFor(type),
    label: typeof rec.label === "string" ? rec.label : undefined,
    min: typeof rec.min === "number" ? rec.min : undefined,
    max: typeof rec.max === "number" ? rec.max : undefined,
    step: typeof rec.step === "number" ? rec.step : undefined,
    unit: typeof rec.unit === "string" ? rec.unit : undefined,
    options: Array.isArray(rec.options)
      ? rec.options.filter((o): o is string => typeof o === "string")
      : undefined,
  };
}

function defaultFor(type: DcPropField["type"]): DcPropField["default"] {
  switch (type) {
    case "color":
      return "#111111";
    case "range":
    case "number":
      return 0;
    case "boolean":
      return false;
    default:
      return "";
  }
}

export function parseDcImports(source: string): DcImportRef[] {
  const out: DcImportRef[] = [];
  const re = new RegExp(IMPORT_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const a = parseAttrs(m[1]);
    const inner = m[2];
    const slots: Record<string, string> = {};
    const slotRe = /<dc-slot\s+name=["']([^"']+)["'][^>]*>([\s\S]*?)<\/dc-slot>/gi;
    let s: RegExpExecArray | null;
    while ((s = slotRe.exec(inner))) {
      slots[s[1]] = s[2].trim();
    }
    const leftover = inner.replace(/<dc-slot\b[\s\S]*?<\/dc-slot>/gi, "").trim();
    if (leftover && !slots.default) slots.default = leftover;
    out.push({
      src: a.src || a.name || "",
      props: parsePropsAttr(a.props),
      hintSize: a["hint-size"] || a.hintsize,
      slots,
      outerHtml: m[0],
    });
  }
  return out;
}

function parseAttrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z_:][\w:.-]*)=(["'])([\s\S]*?)\2/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) {
    out[m[1].toLowerCase()] = m[3];
  }
  return out;
}

export function parsePropsAttr(raw?: string): DcPropMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: DcPropMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function parseDc(source: string): ParsedDc {
  const schema = parseDcSchema(source);
  const imports = parseDcImports(source);
  const body = extractBody(source);
  return { schema, source, body, imports };
}

function extractBody(source: string): string {
  const m = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (m) return m[1].trim();
  return source.replace(SCRIPT_RE, "").trim();
}

export function isDcSource(source: string, path?: string): boolean {
  if (path?.endsWith(".dc.html")) return true;
  return source.includes(`type="${DC_SCRIPT_TYPE}"`) || source.includes(`type='${DC_SCRIPT_TYPE}'`);
}

export function schemaDefaults(schema: DcSchema): DcPropMap {
  const out: DcPropMap = {};
  for (const [k, field] of Object.entries(schema.props)) out[k] = field.default;
  return out;
}
