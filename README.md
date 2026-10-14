# Atelier

**An open-source design canvas.** Chat on the left. An infinite pan/zoom board of sandboxed artboards on the right. Generate HTML, React, SVG, Markdown, and Mermaid; tweak colors live; pin comments; export HTML / ZIP / PDF / PNG / PPTX.

[English](README.md) · [简体中文](README.zh-CN.md)

![Multiple artboards on the canvas](docs/screenshots/canvas-multi-artboard.png)

Atelier is a standalone MIT-licensed product inspired by the *shape* of Claude Artifacts and Claude Design (chat + live canvas + isolated iframes + tweaks). It does **not** copy Anthropic prompts, trademarks, or source. See [docs/COMPARISON.md](docs/COMPARISON.md).

## Features

- **Studio layout** — resizable chat, infinite canvas, tweaks / inspect / comments / files rail
- **Multiple artboards** — add, duplicate, drag, arrange; layout persisted in the project
- **Opaque-origin iframes** — `sandbox="allow-scripts"` without `allow-same-origin`; typed postMessage protocol with per-board nonces
- **Streaming render** — `<artboard>` tags land on the canvas while the model is still writing
- **Self-check** — iframe errors trigger one auto-fix turn
- **Direct manipulation** — Edit / Inspect / Comment modes inside the frame
- **Tweaks panel** — sliders, colors, text, booleans from a declared JSON block **or** a Design Component prop schema; applied live, no model call
- **Design Components** — `.dc.html` files with typed props, slots, `<dc-import>` composition, cycle detection, library + drag onto canvas, `dc-write` / `dc-set-props` agent tools, flatten on export. Spec: [docs/DC-PROTOCOL.md](docs/DC-PROTOCOL.md)
- **Pinned comments** — queued into the next turn; the agent resolves them by id
- **Project files + history** — versions snapshot after each generation
- **Optional design-system extract** — image palette, URL CSS, or GitHub repo
- **In-artifact AI** — `window.artifact.complete(prompt)` proxied through the host
- **Export** — HTML, ZIP (`canvas.json`), PDF (page size from the artboard), PNG, PPTX, share link
- **BYOK** — Anthropic, OpenAI, OpenRouter, or any OpenAI-compatible base URL; keys in `localStorage` or server env

## Screenshots

| Canvas | Edit mode | Tweaks | Export |
| --- | --- | --- | --- |
| ![](docs/screenshots/canvas-multi-artboard.png) | ![](docs/screenshots/edit-mode.png) | ![](docs/screenshots/tweak-panel.png) | ![](docs/screenshots/export-dialog.png) |

| Component library | Composed DC | Instance props |
| --- | --- | --- |
| ![](docs/screenshots/dc-library-panel.png) | ![](docs/screenshots/dc-composed.png) | ![](docs/screenshots/dc-props-tweak.png) |

Demo recording of the DC flow: [docs/media/dc-demo.webm](docs/media/dc-demo.webm) · [docs/media/dc-demo.mp4](docs/media/dc-demo.mp4)

## Quick start

```bash
npm install
npm run dev          # http://127.0.0.1:43173
```

Open the **Northbound** demo from the landing page. Chat works without a key (local draft model). For a real model, click the gear and paste an API key, or set env:

```bash
ANTHROPIC_API_KEY=sk-ant-...
# or OPENAI_API_KEY=...
# or OPENROUTER_API_KEY=...
```

```bash
npm test             # Vitest: protocol, tweaks, parse, export, design components
npx playwright install chromium
npm run test:e2e     # Playwright + screenshots in docs/screenshots and e2e/artifacts
npm run build
```

## Deploy

Any Node host that can run Next.js 16:

```bash
npm run build
npm start -- --port 43173
```

Or import the repo into Vercel. Set `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `OPENROUTER_API_KEY` if you want a server-side default; otherwise each user pastes a key in Settings.

Share links write JSON under `.data/shares/` — mount a persistent volume in production, or swap the store.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Short version: the browser owns the agent loop and the canvas; iframes are opaque; the Next.js server only proxies tokens and stores share snapshots.

## License

[MIT](LICENSE)
