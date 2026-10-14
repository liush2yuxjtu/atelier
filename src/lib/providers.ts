import type { ProviderSettings } from "./types";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "./types";

export function loadSettings(): ProviderSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: ProviderSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function hasClientKey(s: ProviderSettings = loadSettings()): boolean {
  return Boolean(s.apiKey && s.apiKey.trim());
}

export function providerLabel(p: ProviderSettings["provider"]): string {
  switch (p) {
    case "anthropic":
      return "Anthropic";
    case "openai":
      return "OpenAI";
    case "openrouter":
      return "OpenRouter";
    default:
      return "OpenAI-compatible";
  }
}

export function defaultModel(provider: ProviderSettings["provider"]): string {
  switch (provider) {
    case "anthropic":
      return "claude-sonnet-4-5";
    case "openai":
      return "gpt-4.1";
    case "openrouter":
      return "anthropic/claude-sonnet-4.5";
    default:
      return "gpt-4.1";
  }
}

export function endpointFor(s: ProviderSettings): { url: string; headers: Record<string, string> } {
  const key = s.apiKey.trim();
  if (s.provider === "anthropic") {
    return {
      url: "https://api.anthropic.com/v1/messages",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
    };
  }
  if (s.provider === "openrouter") {
    return {
      url: "https://openrouter.ai/api/v1/chat/completions",
      headers: {
        Authorization: `Bearer ${key}`,
        "content-type": "application/json",
        "HTTP-Referer": "https://atelier.dev",
        "X-Title": "Atelier",
      },
    };
  }
  const base = (s.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  return {
    url: `${base}/chat/completions`,
    headers: {
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
  };
}
