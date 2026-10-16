import { ATELIER_SYSTEM_PROMPT } from "./prompt";

/** Deterministic streaming generator used when no API key is configured. */
export async function* streamOfflineReply(userText: string): AsyncGenerator<string> {
  void ATELIER_SYSTEM_PROMPT;
  const full = isDcPrompt(userText) ? offlineDcWrite(userText) : offlineArtboard(userText);
  for (let i = 0; i < full.length; i += 24) {
    yield full.slice(i, i + 24);
    await new Promise((r) => setTimeout(r, 8));
  }
}

function isDcPrompt(text: string): boolean {
  return /\b(design component|\.dc\.html|dc-write|compose (a )?component)\b/i.test(text);
}

function offlineArtboard(userText: string): string {
  const title = guessTitle(userText);
  const html = template(userText, title);
  return `Placed a new artboard called ${title}. Tweaks are generative knobs for this design (look + a layout variant), so you can adjust live without another prompt. Add an API key in Settings for a live model.\n\n<artboard title="${escapeAttr(title)}" kind="html" width="1280" height="800">\n${html}\n</artboard>`;
}

function offlineDcWrite(userText: string): string {
  const label = guessTitle(userText).slice(0, 24) || "Weekend";
  return `Wrote WeekendChip.dc.html and mounted it. Props are live in the rail; the library lists it. Add an API key in Settings for a live model.

<dc-write path="WeekendChip.dc.html" title="Weekend chip" width="280" height="120" mount="true">
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<script type="application/atelier-dc">
{
  "name": "WeekendChip",
  "preview": { "width": 280, "height": 120 },
  "props": {
    "label": { "type": "text", "default": "${escapeAttr(label)}", "label": "Label" },
    "accent": { "type": "color", "default": "#c45c26", "label": "Accent" }
  },
  "slots": []
}
</script>
</head>
<body>
  <div data-dc-root style="font-family:ui-sans-serif,system-ui;padding:22px 24px;border-radius:999px;background:var(--dc-accent);color:#fff;font-weight:600">{{label}}</div>
</body>
</html>
</dc-write>
`;
}

function guessTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Variant";
  return cleaned.slice(0, 42).replace(/[<>]/g, "");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function template(prompt: string, title: string): string {
  const safe = prompt.replace(/[<>]/g, "").slice(0, 280);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  :root { --tweak-accent: #c45c26; --tweak-radius: 20px; --tweak-paper: #f4efe6; --tweak-ink: #1a1612; --tweak-density: 1; --tweak-type: 1; }
  body { margin: 0; font-family: Georgia, serif; background: var(--tweak-paper); color: var(--tweak-ink); }
  main { padding: 72px 64px; }
  .kicker { font-family: ui-sans-serif, system-ui; letter-spacing: 0.14em; text-transform: uppercase; font-size: 12px; color: var(--tweak-accent); }
  h1 { font-size: 56px; letter-spacing: -0.04em; line-height: 0.95; max-width: 16ch; }
  p { font-family: ui-sans-serif, system-ui; color: #6b6158; max-width: 52ch; line-height: 1.55; }
  .panel { margin-top: 40px; background: #fff; border-radius: var(--tweak-radius); padding: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.06); }
</style>
<script type="application/atelier-tweaks">
{ "look": { "type": "palette", "value": "ember", "label": "Look", "options": ["ember","moss","night","signal"] }, "accent": { "type": "color", "value": "#c45c26", "label": "Accent" }, "paper": { "type": "color", "value": "#f4efe6", "label": "Paper" }, "ink": { "type": "color", "value": "#1a1612", "label": "Ink" }, "radius": { "type": "range", "value": 20, "min": 0, "max": 48, "unit": "px", "label": "Radius" }, "density": { "type": "range", "value": 1, "min": 0.75, "max": 1.35, "step": 0.05, "label": "Density" }, "type": { "type": "range", "value": 1, "min": 0.8, "max": 1.3, "step": 0.05, "label": "Type scale" } }
</script>
</head>
<body>
<main>
  <div class="kicker">Atelier · offline draft</div>
  <h1>${escapeAttr(title)}</h1>
  <p>${escapeAttr(safe)}</p>
  <div class="panel">This board was streamed by the local fallback so the canvas, tweaks, and export paths work without a key. Connect Anthropic, OpenAI, or OpenRouter in Settings to generate with a real model.</div>
</main>
</body>
</html>`;
}
