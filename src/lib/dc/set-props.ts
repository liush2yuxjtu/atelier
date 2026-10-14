import type { TweakField, TweakMap, TweakSchema } from "../types";
import { parseDcSchema, schemaDefaults } from "./parse";
import { DC_SCRIPT_TYPE } from "./types";
import type { DcPropMap, DcSchema } from "./types";

const SCRIPT_RE = new RegExp(
  `<script([^>]*type=["']${DC_SCRIPT_TYPE}["'][^>]*)>([\\s\\S]*?)</script>`,
  "i",
);

/** Replace prop defaults (and optionally the whole schema) inside a .dc.html file. */
export function setFileProps(source: string, values: DcPropMap): string {
  const schema = parseDcSchema(source);
  for (const [key, value] of Object.entries(values)) {
    if (schema.props[key]) schema.props[key] = { ...schema.props[key], default: value };
  }
  return writeSchema(source, schema);
}

export function setFileSchema(source: string, schema: DcSchema): string {
  return writeSchema(source, schema);
}

function writeSchema(source: string, schema: DcSchema): string {
  const json = JSON.stringify(schema, null, 2);
  if (SCRIPT_RE.test(source)) {
    return source.replace(SCRIPT_RE, `<script type="${DC_SCRIPT_TYPE}">\n${json}\n</script>`);
  }
  if (/<\/head>/i.test(source)) {
    return source.replace(
      /<\/head>/i,
      `<script type="${DC_SCRIPT_TYPE}">\n${json}\n</script></head>`,
    );
  }
  return `<script type="${DC_SCRIPT_TYPE}">\n${json}\n</script>\n${source}`;
}

export function mergeInstanceProps(schema: DcSchema, current: DcPropMap, patch: DcPropMap): DcPropMap {
  return { ...schemaDefaults(schema), ...current, ...patch };
}

export function schemaToTweakSchema(schema: DcSchema): TweakSchema {
  const out: TweakSchema = {};
  for (const [key, field] of Object.entries(schema.props)) {
    const type: TweakField["type"] =
      field.type === "number" ? "range" : (field.type as TweakField["type"]);
    out[key] = {
      type,
      value: field.default,
      label: field.label,
      min: field.min,
      max: field.max,
      step: field.step,
      unit: field.unit,
      options: field.options,
    };
  }
  return out;
}

export function tweakMapFromSchema(schema: DcSchema, instance?: DcPropMap): TweakMap {
  return { ...schemaDefaults(schema), ...(instance ?? {}) };
}
