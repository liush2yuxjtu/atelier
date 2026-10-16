import { describe, expect, it } from "vitest";
import {
  extractAddTweaksTopic,
  mergeAddTweaks,
  mockAddTweaksPayload,
  parseAddTweaksResponse,
  sanitizeAddTweaksPayload,
} from "@/lib/add-tweaks";

describe("add-tweaks", () => {
  it("extracts topic from chat-style prompts", () => {
    expect(extractAddTweaksTopic("add more tweaks for the pricing section")).toBe(
      "the pricing section",
    );
    expect(extractAddTweaksTopic("Add more tweaks for hero copy!")).toBe("hero copy");
    expect(extractAddTweaksTopic("make it blue")).toBeNull();
  });

  it("parses fenced JSON and drops existing keys", () => {
    const text = `Sure.\n\`\`\`json\n{"schema":{"mood":{"type":"select","value":"x","options":["a","b"]},"heroVoice":{"type":"select","control":"radio","value":"warm","options":["warm","bold"],"label":"Hero voice"}},"css":"html[data-hero-voice=bold] h1{font-weight:800}"}\n\`\`\``;
    const payload = parseAddTweaksResponse(text, new Set(["mood"]));
    expect(payload).not.toBeNull();
    expect(payload!.schema.mood).toBeUndefined();
    expect(payload!.schema.heroVoice?.label).toBe("Hero voice");
    expect(payload!.css).toContain("data-hero-voice");
  });

  it("rejects empty or unsafe schemas", () => {
    expect(sanitizeAddTweaksPayload({ schema: {} }, new Set())).toBeNull();
    expect(
      sanitizeAddTweaksPayload(
        { schema: { "bad-key!": { type: "boolean", value: true } } },
        new Set(),
      ),
    ).toBeNull();
  });

  it("merges without dropping existing knobs and wires bindings", () => {
    const source = `<!DOCTYPE html><html><head></head><body>
<section data-section="pricing"><h2>This week’s cadence</h2></section>
<footer>Roasted in Portland</footer>
</body></html>`;
    const existing = {
      mood: {
        type: "select" as const,
        control: "radio" as const,
        value: "saas",
        options: ["saas", "playful"],
        label: "Mood",
        structural: true,
      },
    };
    const payload = mockAddTweaksPayload("the pricing section", new Set(["mood"]));
    const merged = mergeAddTweaks(source, existing, { mood: "saas" }, payload);
    expect(merged.tweakSchema.mood).toBeTruthy();
    expect(merged.addedKeys.length).toBeGreaterThan(0);
    expect(merged.tweaks.mood).toBe("saas");
    expect(merged.source).toContain("data-atelier-ai-tweaks");
    expect(merged.source).toContain("application/atelier-tweaks");

    expect(merged.source).toMatch(/data-copy-for=["']sectionFocus["']/);
  });

  it("mock covers generic topics with toggleable knobs", () => {
    const payload = mockAddTweaksPayload("xxxxx", new Set());
    expect(Object.keys(payload.schema).length).toBeGreaterThanOrEqual(1);
  });
});

describe("cursor provider selection", () => {
  it("honours ATELIER_LLM_PROVIDER", async () => {
    const { addTweaksProvider } = await import("@/lib/cursor-agent");
    const prev = process.env.ATELIER_LLM_PROVIDER;
    process.env.ATELIER_LLM_PROVIDER = "cursor";
    expect(addTweaksProvider()).toBe("cursor");
    process.env.ATELIER_LLM_PROVIDER = "openai";
    expect(addTweaksProvider()).toBe("http");
    process.env.ATELIER_LLM_PROVIDER = prev;
  });
});
