import type { ProviderSettings } from "@/lib/types";
import { endpointFor } from "@/lib/providers";

export async function POST(req: Request) {
  const body = (await req.json()) as { prompt: string; settings?: ProviderSettings };
  const dashscope = process.env.DASHSCOPE_API_KEY || "";
  const envKey =
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    dashscope ||
    "";
  const dashOnly =
    Boolean(dashscope) &&
    !process.env.ANTHROPIC_API_KEY &&
    !process.env.OPENAI_API_KEY &&
    !process.env.OPENROUTER_API_KEY;
  const settings: ProviderSettings = {
    provider: body.settings?.provider || (dashOnly ? "compatible" : "openai"),
    model: body.settings?.model || (dashOnly ? "qwen-turbo" : "gpt-4.1-mini"),
    apiKey: body.settings?.apiKey || envKey,
    baseUrl:
      body.settings?.baseUrl ||
      (dashOnly ? "https://dashscope.aliyuncs.com/compatible-mode/v1" : ""),
  };

  if (!settings.apiKey) {
    return Response.json({
      text: `(offline) ${body.prompt.slice(0, 200)}`,
    });
  }

  const system =
    "You are the in-artifact complete() helper for an Atelier sandbox. Answer briefly. No artboard tags.";

  if (settings.provider === "anthropic") {
    const { url, headers } = endpointFor(settings);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: settings.model,
        max_tokens: 512,
        system,
        messages: [{ role: "user", content: body.prompt }],
      }),
    });
    const json = (await res.json()) as { content?: { text?: string }[]; error?: { message?: string } };
    if (!res.ok) return Response.json({ error: json.error?.message || "complete failed" }, { status: 502 });
    return Response.json({ text: json.content?.map((c) => c.text || "").join("") || "" });
  }

  const { url, headers } = endpointFor(settings);
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: body.prompt },
      ],
    }),
  });
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  if (!res.ok) return Response.json({ error: json.error?.message || "complete failed" }, { status: 502 });
  return Response.json({ text: json.choices?.[0]?.message?.content || "" });
}
