import { ATELIER_SYSTEM_PROMPT } from "@/lib/agent/prompt";
import type { ProviderSettings } from "@/lib/types";
import { endpointFor } from "@/lib/providers";

export const runtime = "nodejs";

interface Body {
  settings?: ProviderSettings;
  messages: { role: string; content: string }[];
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const envKey =
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    "";
  const settings: ProviderSettings = {
    provider: body.settings?.provider || (process.env.ANTHROPIC_API_KEY ? "anthropic" : "openai"),
    model: body.settings?.model || process.env.ATELIER_MODEL || "gpt-4.1",
    apiKey: body.settings?.apiKey || envKey,
    baseUrl: body.settings?.baseUrl || process.env.OPENAI_BASE_URL || "",
  };

  if (!settings.apiKey) {
    return new Response("No API key. Add one in Settings or set a server env var.", { status: 401 });
  }

  const { url, headers } = endpointFor(settings);

  if (settings.provider === "anthropic") {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: settings.model,
        max_tokens: 8192,
        stream: true,
        system: ATELIER_SYSTEM_PROMPT,
        messages: body.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok || !res.body) {
      return new Response(await res.text(), { status: res.status });
    }
    return new Response(mapAnthropicStream(res.body), {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: settings.model,
      stream: true,
      messages: [
        { role: "system", content: ATELIER_SYSTEM_PROMPT },
        ...body.messages.filter((m) => m.role !== "system"),
      ],
    }),
  });
  if (!res.ok || !res.body) {
    return new Response(await res.text(), { status: res.status });
  }
  return new Response(mapOpenAiStream(res.body), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function mapOpenAiStream(body: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      let buf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n");
          buf = parts.pop() ?? "";
          for (const line of parts) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const chunk = json.choices?.[0]?.delta?.content;
              if (chunk) controller.enqueue(encoder.encode(chunk));
            } catch {
              /* ignore malformed sse */
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}

function mapAnthropicStream(body: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      let buf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n");
          buf = parts.pop() ?? "";
          for (const line of parts) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            try {
              const json = JSON.parse(data) as {
                type?: string;
                delta?: { text?: string };
              };
              if (json.type === "content_block_delta" && json.delta?.text) {
                controller.enqueue(encoder.encode(json.delta.text));
              }
            } catch {
              /* ignore */
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}
