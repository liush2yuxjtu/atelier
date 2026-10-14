export type ArtboardKind = "html" | "react" | "svg" | "markdown" | "mermaid" | "dc";

export type StudioMode = "preview" | "edit" | "comment" | "inspect";

export type TweakType = "color" | "range" | "text" | "select" | "boolean" | "palette";

export interface TweakField {
  type: TweakType;
  value: string | number | boolean;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: string[];
  /** Named color chips for a color field. */
  presets?: { label: string; value: string }[];
  /** Palette id → map of other tweak keys (accent, paper, ink…). */
  swatches?: Record<string, Record<string, string>>;
  group?: "color" | "type" | "density" | "layout" | "copy";
}

export type TweakSchema = Record<string, TweakField>;
export type TweakMap = Record<string, string | number | boolean>;

export interface TweakVariant {
  id: string;
  label: string;
  tweaks: TweakMap;
  createdAt: number;
}

export interface PinComment {
  id: string;
  x: number;
  y: number;
  selector?: string;
  body: string;
  resolved: boolean;
  queued: boolean;
  createdAt: number;
}

export interface Artboard {
  id: string;
  title: string;
  kind: ArtboardKind;
  source: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tweaks: TweakMap;
  tweakSchema: TweakSchema;
  comments: PinComment[];
  error: string | null;
  status: "idle" | "streaming" | "ready" | "error" | "fixing";
  autoFixed: boolean;
  version: number;
  /** Project file path of a Design Component this artboard instantiates. */
  dcPath?: string;
  /** Instance-level prop overrides (live tweaks; does not rewrite the .dc.html file). */
  dcProps?: TweakMap;
  tweakUndo?: TweakMap[];
  tweakRedo?: TweakMap[];
  variants?: TweakVariant[];
  approvedVariantId?: string | null;
}

export interface ProjectFile {
  path: string;
  content: string;
  updatedAt: number;
}

export interface VersionSnapshot {
  id: string;
  label: string;
  createdAt: number;
  artboards: Artboard[];
  files: ProjectFile[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
}

export interface CanvasState {
  panX: number;
  panY: number;
  zoom: number;
}

export interface DesignToken {
  name: string;
  value: string;
  kind: "color" | "font" | "space" | "radius" | "shadow";
}

export interface DesignSystem {
  name: string;
  source: "image" | "url" | "github" | "manual";
  tokens: DesignToken[];
  extractedAt: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  artboards: Artboard[];
  files: ProjectFile[];
  versions: VersionSnapshot[];
  messages: ChatMessage[];
  canvas: CanvasState;
  selectedArtboardId: string | null;
  selectedSelector: string | null;
  selectedStyles: Record<string, string> | null;
  selectedText: string | null;
  mode: StudioMode;
  designSystem?: DesignSystem;
  presenting?: boolean;
  compareVariantId?: string | null;
}

export interface ProviderSettings {
  provider: "anthropic" | "openai" | "openrouter" | "compatible";
  model: string;
  apiKey: string;
  baseUrl: string;
}

export const DEFAULT_SETTINGS: ProviderSettings = {
  provider: "openrouter",
  model: "anthropic/claude-sonnet-4.5",
  apiKey: "",
  baseUrl: "",
};

export const SETTINGS_KEY = "atelier:settings";
