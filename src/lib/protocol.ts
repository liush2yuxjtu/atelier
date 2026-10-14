/**
 * Atelier host ↔ sandbox iframe postMessage protocol.
 *
 * Sandboxes are opaque-origin (sandbox="allow-scripts" without allow-same-origin).
 * The only communication channel is postMessage. The host never reads iframe DOM.
 */

export const ATELIER_CHANNEL = "atelier";

export type StudioMode = "preview" | "edit" | "comment" | "inspect";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type HostToFrame =
  | { type: "set-mode"; mode: StudioMode }
  | { type: "apply-tweaks"; tweaks: Record<string, string | number | boolean> }
  | { type: "edit-style"; selector: string; styles: Record<string, string> }
  | { type: "edit-text"; selector: string; text: string }
  | { type: "highlight"; selector: string | null }
  | { type: "export"; format: "png" | "html" | "pdf-info"; requestId: string }
  | { type: "ping"; requestId: string }
  | { type: "complete-result"; id: string; text?: string; error?: string }
  | { type: "init"; vendorBase: string; nonce: string };

export type FrameToHost =
  | {
      type: "ready";
      tweaks?: Record<string, unknown>;
      size?: { w: number; h: number };
      nonce: string;
    }
  | {
      type: "selected";
      selector: string;
      tag: string;
      text: string;
      styles: Record<string, string>;
      rect: Rect;
    }
  | { type: "hover"; selector: string | null; rect?: Rect }
  | { type: "error"; message: string; stack?: string }
  | { type: "loaded" }
  | { type: "comment-pin"; x: number; y: number; selector?: string }
  | {
      type: "export-result";
      requestId: string;
      format: string;
      data: string;
      mime: string;
      width?: number;
      height?: number;
    }
  | { type: "complete"; id: string; prompt: string; options?: Record<string, unknown> }
  | { type: "pong"; requestId: string }
  | { type: "text-changed"; selector: string; text: string };

export interface Envelope<T> {
  channel: typeof ATELIER_CHANNEL;
  nonce?: string;
  payload: T;
}

export function encodeHost(payload: HostToFrame, nonce?: string): Envelope<HostToFrame> {
  return { channel: ATELIER_CHANNEL, nonce, payload };
}

export function encodeFrame(payload: FrameToHost, nonce?: string): Envelope<FrameToHost> {
  return { channel: ATELIER_CHANNEL, nonce, payload };
}

export function decodeEnvelope(data: unknown): Envelope<HostToFrame | FrameToHost> | null {
  if (!data || typeof data !== "object") return null;
  const rec = data as Record<string, unknown>;
  if (rec.channel !== ATELIER_CHANNEL) return null;
  if (!rec.payload || typeof rec.payload !== "object") return null;
  const payload = rec.payload as { type?: unknown };
  if (typeof payload.type !== "string") return null;
  return data as Envelope<HostToFrame | FrameToHost>;
}

export function isHostMessage(payload: HostToFrame | FrameToHost): payload is HostToFrame {
  return (
    payload.type === "set-mode" ||
    payload.type === "apply-tweaks" ||
    payload.type === "edit-style" ||
    payload.type === "edit-text" ||
    payload.type === "highlight" ||
    payload.type === "export" ||
    payload.type === "ping" ||
    payload.type === "complete-result" ||
    payload.type === "init"
  );
}

export function isFrameMessage(payload: HostToFrame | FrameToHost): payload is FrameToHost {
  return !isHostMessage(payload);
}

/** Accept a frame message only when it carries the artboard's nonce (when present). */
export function acceptFromFrame(
  data: unknown,
  expectedNonce: string,
): FrameToHost | null {
  const env = decodeEnvelope(data);
  if (!env) return null;
  if (!isFrameMessage(env.payload)) return null;
  if (env.nonce && env.nonce !== expectedNonce) return null;
  return env.payload;
}

export function acceptFromHost(
  data: unknown,
  expectedNonce: string,
): HostToFrame | null {
  const env = decodeEnvelope(data);
  if (!env) return null;
  if (!isHostMessage(env.payload)) return null;
  if (env.nonce && env.nonce !== expectedNonce) return null;
  return env.payload;
}

export const STYLE_KEYS = [
  "color",
  "backgroundColor",
  "fontSize",
  "fontWeight",
  "fontFamily",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "padding",
  "margin",
  "borderRadius",
  "border",
  "opacity",
  "width",
  "height",
  "display",
  "gap",
] as const;

export function pickComputedStyles(style: CSSStyleDeclaration): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of STYLE_KEYS) {
    const value = style[key as unknown as number] as unknown as string;
    if (value) out[key] = value;
  }
  return out;
}
