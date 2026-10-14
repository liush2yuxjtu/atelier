import { describe, expect, it } from "vitest";
import {
  ATELIER_CHANNEL,
  acceptFromFrame,
  acceptFromHost,
  decodeEnvelope,
  encodeFrame,
  encodeHost,
  isFrameMessage,
  isHostMessage,
} from "@/lib/protocol";

describe("postMessage protocol", () => {
  it("encodes a host envelope with channel + nonce", () => {
    const env = encodeHost({ type: "set-mode", mode: "edit" }, "n1");
    expect(env.channel).toBe(ATELIER_CHANNEL);
    expect(env.nonce).toBe("n1");
    expect(env.payload.type).toBe("set-mode");
  });

  it("rejects envelopes from the wrong channel", () => {
    expect(decodeEnvelope({ channel: "other", payload: { type: "ping" } })).toBeNull();
    expect(decodeEnvelope(null)).toBeNull();
    expect(decodeEnvelope("x")).toBeNull();
  });

  it("accepts frame messages only when nonce matches", () => {
    const env = encodeFrame({ type: "loaded" }, "board-1");
    expect(acceptFromFrame(env, "board-1")).toEqual({ type: "loaded" });
    expect(acceptFromFrame(env, "board-2")).toBeNull();
  });

  it("accepts host messages with matching nonce", () => {
    const env = encodeHost({ type: "ping", requestId: "r" }, "n");
    expect(acceptFromHost(env, "n")?.type).toBe("ping");
    expect(acceptFromHost(env, "other")).toBeNull();
  });

  it("distinguishes host vs frame payloads", () => {
    expect(isHostMessage({ type: "apply-tweaks", tweaks: { accent: "#c45" } })).toBe(true);
    expect(isFrameMessage({ type: "error", message: "boom" })).toBe(true);
    expect(isHostMessage({ type: "loaded" } as never)).toBe(false);
  });

  it("round-trips an export request", () => {
    const env = encodeHost({ type: "export", format: "png", requestId: "abc" }, "n");
    const payload = acceptFromHost(env, "n");
    expect(payload).toMatchObject({ type: "export", format: "png", requestId: "abc" });
  });
});
