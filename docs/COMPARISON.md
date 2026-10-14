# Atelier vs Claude Artifacts vs Claude Design

Atelier is an independent open-source product. It is not affiliated with Anthropic. "Claude", "Claude Artifacts", and "Claude Design" are trademarks of Anthropic, PBC.

| | Claude Artifacts | Claude Design (omelette) | **Atelier** |
| --- | --- | --- | --- |
| Surface | One preview pane beside chat | Dedicated design window + live canvas | Chat left, infinite pan/zoom canvas right |
| How many visuals | Typically one artifact | Multiple canvas-mode artboards | Multiple artboards, duplicate, arrange |
| Isolation | `*.claudeusercontent.com` iframe | Same + nonce in hash for PDF | `sandbox="allow-scripts"` srcdoc, opaque origin, nonce in postMessage |
| Direct edit | Limited | Select / inline edit / Tweaks / comments | Edit, inspect, tweaks, pinned comments |
| Tweaks | — | Declared knobs, `dc_set_props` in later versions | `@atelier-tweaks` JSON **and** DC prop schema → same rail; live CSS variables; no model call |
| Streaming | Token stream into one artifact | Writes files then preview | Incremental `<artboard>` and `<dc-write>` parse onto the canvas |
| Self-check | Verifier sub-agent in some versions | Load errors + skills | Iframe `error` → one auto-fix turn |
| In-artifact AI | Cowork `window.cowork.askClaude` | Not in the desktop shell | `window.artifact.complete()` → `/api/complete` |
| Export | Copy / publish | HTML, PDF (`preferCSSPageSize`), PPTX (`gen_pptx`), Canva (v1) | HTML, ZIP, PNG, PDF (page size from artboard), PPTX, share link |
| Models | Anthropic only | Anthropic only | BYOK: Anthropic, OpenAI, OpenRouter, any OpenAI-compatible |
| Storage | Anthropic cloud | `/design/p/<uuid>` | IndexedDB + optional share files |
| License | Proprietary | Proprietary | MIT |
| Offline | No | No | Demo canvas + local draft model |

## Present in Claude Design, not in Atelier (yet)

- Figma connector / `fig_*` tools
- GitHub and local-folder MCP tools (`github_*`, `local_*`)
- Canva send
- Team members / org sharing beyond a snapshot link
- Native editable PPTX shapes (Atelier embeds raster slides)
- Second-origin preview host (`uuid.claudeusercontent.com`)
- Verifier sub-agent fork
- Cowork `callMcpTool` / `runScheduledTask` bridge

## Present in Atelier, not in the closed products

- Bring your own key and OpenAI-compatible endpoints
- MIT-licensed, self-hostable Next.js app
- `canvas.json` round-trip inside a ZIP
- Works without a vendor account (demo + offline generator)
- Original Design Components protocol (`.dc.html`, `<dc-import>`, `dc-write` / `dc-set-props`, library, flatten-on-export) — see [DC-PROTOCOL.md](DC-PROTOCOL.md)

Vendor Claude Design uses its own `dc.html` / `dc_write` tools. Atelier’s files, tags, and schema are independently specified and implemented.
