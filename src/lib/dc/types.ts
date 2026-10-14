export type DcPropType = "text" | "color" | "range" | "boolean" | "select" | "number";

export interface DcPropField {
  type: DcPropType;
  default: string | number | boolean;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: string[];
}

export type DcPropMap = Record<string, string | number | boolean>;

export interface DcSchema {
  name: string;
  preview?: { width: number; height: number };
  props: Record<string, DcPropField>;
  slots: string[];
}

export interface DcImportRef {
  src: string;
  props: DcPropMap;
  hintSize?: string;
  slots: Record<string, string>;
  outerHtml: string;
}

export interface ParsedDc {
  schema: DcSchema;
  source: string;
  body: string;
  imports: DcImportRef[];
}

export interface FlattenResult {
  html: string;
  /** Inlinable mount used by parent `<dc-import>` (scoped vars + local styles + root). */
  fragment: string;
  schema: DcSchema;
  imports: string[];
  error?: string;
}

export const DC_SCRIPT_TYPE = "application/atelier-dc";
export const DC_EXT = ".dc.html";
export const DC_DRAG_MIME = "application/x-atelier-dc";
