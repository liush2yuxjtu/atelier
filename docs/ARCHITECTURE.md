# Atelier architecture

Atelier is a Next.js App Router studio. The **agent loop lives in the browser tab**. The server is an LLM passthrough, a share-link store, and an optional design-system fetcher. Project state is client-authoritative (IndexedDB).

```
┌─────────────────────────────────────────────────────────────┐
│ Browser                                                     │
│  ChatPanel ──stream──► parse <artboard> tags                │
│       │                     │                               │
│       ▼                     ▼                               │
│  Zustand store ◄────── infinite canvas (pan/zoom)           │
│       │                     │                               │
│       │                     ▼                               │
│       │              Artboard iframe (sandbox=allow-scripts │
│       │              NO allow-same-origin → opaque origin)  │
│       │                     │ postMessage only              │
│       └─────────────────────┘                               │
│  Tweaks / Inspect / Comments apply live without a new turn  │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST /api/chat  (BYOK key in body)
                           │ POST /api/complete (window.artifact)
                           │ POST /api/share
                           ▼
                     Next.js route handlers
```

## Sandbox protocol

Each artboard compiles to a `srcdoc` document. The host injects `src/lib/sandbox/runtime.ts`, a zero-dependency script that:

- reports `ready` / `loaded` / `error`
- applies `--tweak-*` CSS variables
- in edit/comment/inspect modes, hit-tests elements and emits `selected` / `comment-pin`
- rasters PNG via html2canvas loaded from `/vendor`
- exposes `window.artifact.complete(prompt)` which RPCs to `/api/complete`

The envelope is `{ channel: "atelier", nonce, payload }`. The nonce is `artboardId:version`. The host ignores frames whose nonce does not match — this is the analogue of Claude Design locating a `*.claudeusercontent.com` iframe by origin + hash nonce, implemented without a second origin.

## Tweaks

Original wire format (not Anthropic's `EDITMODE` block):

```
/*@atelier-tweaks
{ "accent": { "type": "color", "value": "#c45c26" } }
@atelier-tweaks*/
```

or `<script type="application/atelier-tweaks">`. The right rail generates controls from the schema. Dragging a slider posts `apply-tweaks` into the iframe **and** rewrites the block in source so export is self-consistent.

## Streaming

`parseStreaming` in `src/lib/agent/parse.ts` incrementally reads `<artboard>` and `<dc-write>` tags, including an unclosed last tag, and lays new boards out to the right of existing ones. A load `error` from the iframe queues a single auto-fix turn.

## Design Components

Reusable pieces are `.dc.html` files with an `application/atelier-dc` schema block, `{{prop}}` holes, `<dc-import>` children, and `<slot>` / `<dc-slot>`. The host (`src/lib/dc/`) parses the schema, builds an import graph, rejects cycles, and **flattens** a tree into ordinary HTML for the iframe and for export. Instance props live on the artboard (`dcPath` / `dcProps`); `setTweaks` for `kind === "dc"` updates those props and recompiles without rewriting the file. Changing a file hot-recompiles every dependent artboard. Full spec: [DC-PROTOCOL.md](DC-PROTOCOL.md).

## Persistence

- Projects: IndexedDB `atelier/projects`
- Index + provider keys: `localStorage`
- Share snapshots: `.data/shares/{token}.json` on the server
- Versions: snapshots on the project record after each successful generation

## Export

| Format | Path |
| --- | --- |
| HTML | compile minus runtime |
| ZIP | JSZip of `canvas.json` + standalone HTML + files |
| PNG | iframe `html2canvas` → data URL |
| PDF | jsPDF, page size = artboard CSS px / 2 (2× raster) |
| PPTX | pptxgenjs, one slide per PNG |
| Share | POST snapshot, open `/share/{token}` read-only |

## BYOK

Settings store provider + model + key in `localStorage`. `/api/chat` also accepts `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, and `OPENAI_BASE_URL`. With no key, a local streaming fallback still places a real artboard so the canvas is usable.

## What we studied, what we wrote

Community captures of Claude Design (tool lists, iframe sandbox, print-to-PDF page size, tweak panels, comments) informed **behavior**. Prompts, the postMessage vocabulary, and the tweaks block are original Atelier source under MIT. Anthropic prompt text is not copied into this repository.
