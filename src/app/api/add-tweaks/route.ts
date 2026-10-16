import { endpointFor } from "@/lib/providers";
import {
  ADD_TWEAKS_SYSTEM,
  buildAddTweaksUserPrompt,
  parseAddTweaksResponse,
  resolveAddTweaksServerSettings,
} from "@/lib/add-tweaks";
import type { ProviderSettings } from "@/lib/types";
import { addTweaksProvider, cursorAgentComplete } from "@/lib/cursor-agent";

export const runtime = "nodejs";

interface Body {
  topic: string;
  title?: string;
  source: string;
  existingKeys?: string[];
  settings?: ProviderSettings;
  /** Test-only: force deterministic mock payload (never used by the demo UI). */
  mock?: boolean;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const topic = (body.topic || "").trim();
  if (!topic) {
    return Response.json({ error: "Missing topic" }, { status: 400 });
  }
  if (!body.source || typeof body.source !== "string") {
    return Response.json({ error: "Missing source" }, { status: 400 });
  }

  const existingKeys = new Set(body.existingKeys ?? []);
  const settings = resolveAddTweaksServerSettings(body.settings);

  if (body.mock === true) {
    const { mockAddTweaksPayload } = await import("@/lib/add-tweaks");
    const payload = mockAddTweaksPayload(topic, existingKeys);
    return Response.json({ payload, model: "mock", mock: true });
  }

  // Cursor Auto (this account's Cursor subscription via cursor-agent) unless the
  // client brings its own key or ATELIER_LLM_PROVIDER selects an HTTP provider.
  const useCursor = addTweaksProvider() === "cursor" && !body.settings?.apiKey;
  if (useCursor) {
    const user = buildAddTweaksUserPrompt({
      topic,
      title: body.title || "Artboard",
      source: body.source,
      existingKeys: [...existingKeys],
    });
    const t0 = Date.now();
    try {
      const { text } = await cursorAgentComplete(ADD_TWEAKS_SYSTEM, user);
      const payload = parseAddTweaksResponse(text, existingKeys);
      if (!payload) {
        return Response.json(
          { error: "Model returned no usable tweak schema", raw: text.slice(0, 1500), provider: "cursor" },
          { status: 422 },
        );
      }
      return Response.json({
        payload,
        provider: "cursor",
        model: process.env.ATELIER_CURSOR_MODEL || "auto",
        latencyMs: Date.now() - t0,
        addedKeys: Object.keys(payload.schema),
      });
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "cursor-agent failed", provider: "cursor" },
        { status: 502 },
      );
    }
  }

  if (!settings.apiKey) {
    return Response.json(
      { error: "No API key. Add one in Settings or set ANTHROPIC_API_KEY / OPENAI_API_KEY / DASHSCOPE_API_KEY." },
      { status: 401 },
    );
  }

  const user = buildAddTweaksUserPrompt({
    topic,
    title: body.title || "Artboard",
    source: body.source,
    existingKeys: [...existingKeys],
  });

  try {
    const text = await completeOnce(settings, ADD_TWEAKS_SYSTEM, user);
    const payload = parseAddTweaksResponse(text, existingKeys);
    if (!payload) {
      return Response.json(
        { error: "Model returned no usable tweak schema", raw: text.slice(0, 1500) },
        { status: 422 },
      );
    }
    return Response.json({
      payload,
      model: settings.model,
      addedKeys: Object.keys(payload.schema),
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "add-tweaks failed" },
      { status: 502 },
    );
  }
}

async function completeOnce(settings: ProviderSettings, system: string, user: string): Promise<string> {
  const { url, headers } = endpointFor(settings);

  if (settings.provider === "anthropic") {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: settings.model,
        max_tokens: 2048,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    const json = (await res.json()) as {
      content?: { text?: string }[];
      error?: { message?: string };
    };
    if (!res.ok) throw new Error(json.error?.message || `Anthropic ${res.status}`);
    return json.content?.map((c) => c.text || "").join("") || "";
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(json.error?.message || `Provider ${res.status}`);
  return json.choices?.[0]?.message?.content || "";
}
