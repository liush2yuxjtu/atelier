import { transform } from "sucrase";
import { marked } from "marked";
import { buildRuntimeScript } from "./runtime";
import { mergeTweaksIntoHtml } from "../tweaks";
import type { ArtboardKind, TweakMap, TweakSchema } from "../types";

export interface CompileOptions {
  kind: ArtboardKind;
  source: string;
  nonce: string;
  vendorBase: string;
  tweaks?: TweakMap;
  tweakSchema?: TweakSchema;
}

function wrapDocument(body: string, nonce: string, extraHead = ""): string {
  const runtime = buildRuntimeScript(nonce);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  html, body { margin: 0; padding: 0; }
  body { min-height: 100%; }
</style>
${extraHead}
</head>
<body>
${body}
<script>${runtime}<\/script>
</body>
</html>`;
}

export function compileArtboard(opts: CompileOptions): string {
  const { kind, source, nonce, vendorBase } = opts;
  let html: string;
  switch (kind) {
    case "react":
      html = compileReact(source, nonce, vendorBase);
      break;
    case "svg":
      html = wrapDocument(source.trim().startsWith("<svg") ? source : `<svg xmlns="http://www.w3.org/2000/svg">${source}</svg>`, nonce);
      break;
    case "markdown":
      html = wrapDocument(
        `<article class="atelier-md" style="font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.6;color:#1b1b1b">${marked.parse(source, { async: false }) as string}</article>`,
        nonce,
      );
      break;
    case "mermaid":
      html = wrapDocument(
        `<div class="atelier-mermaid" style="padding:32px;display:flex;justify-content:center;background:#fafafa;min-height:100vh"><pre class="mermaid">${escapeHtml(source)}</pre></div>
<script src="${vendorBase}/vendor/mermaid.min.js"><\/script>
<script>window.mermaid && mermaid.initialize({ startOnLoad: true, theme: "neutral" });<\/script>`,
        nonce,
      );
      break;
    default:
      html = ensureDocument(source, nonce);
  }

  if (opts.tweaks && opts.tweakSchema && Object.keys(opts.tweakSchema).length > 0) {
    html = mergeTweaksIntoHtml(html, opts.tweaks, opts.tweakSchema);
  }
  return html;
}

function ensureDocument(source: string, nonce: string): string {
  if (/<html/i.test(source)) {
    const runtime = `<script>${buildRuntimeScript(nonce)}<\/script>`;
    if (/<\/body>/i.test(source)) {
      return source.replace(/<\/body>/i, `${runtime}</body>`);
    }
    return source + runtime;
  }
  return wrapDocument(source, nonce);
}

function compileReact(source: string, nonce: string, vendorBase: string): string {
  let js = source;
  try {
    js = transform(source, {
      transforms: ["jsx", "typescript"],
      production: true,
    }).code;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return wrapDocument(
      `<pre style="padding:24px;color:#b42318;font:13px/1.4 ui-monospace,monospace">JSX compile error:\n${escapeHtml(message)}</pre>`,
      nonce,
    );
  }
  return wrapDocument(
    `<div id="root"></div>
<script src="${vendorBase}/vendor/react.production.min.js"><\/script>
<script src="${vendorBase}/vendor/react-dom.production.min.js"><\/script>
<script>
${js}
(function(){
  var App = (typeof App !== "undefined" && App)
    || (typeof Component !== "undefined" && Component)
    || (typeof Preview !== "undefined" && Preview)
    || null;
  var rootEl = document.getElementById("root");
  if (App && rootEl && window.ReactDOM) {
    if (ReactDOM.createRoot) ReactDOM.createRoot(rootEl).render(React.createElement(App));
    else ReactDOM.render(React.createElement(App), rootEl);
  }
})();
<\/script>`,
    nonce,
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function detectKind(source: string, hint?: string): ArtboardKind {
  const h = (hint || "").toLowerCase();
  if (h.includes("mermaid")) return "mermaid";
  if (h.includes("markdown") || h === "md") return "markdown";
  if (h.includes("svg")) return "svg";
  if (h.includes("react") || h.includes("jsx")) return "react";
  if (/^\s*#\s+|\n## /.test(source) && !/<html/i.test(source)) return "markdown";
  if (/^\s*<svg/i.test(source)) return "svg";
  if (/\bexport default function|\bfunction App\s*\(|\bconst App\s*=/.test(source)) return "react";
  return "html";
}
