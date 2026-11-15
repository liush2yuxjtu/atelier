# Native Chinese and English Mood demos

One user story: change Home's native Mood control and read the rewritten headline on the same page. Each language is recorded separately in the real application; neither is a subtitle translation or a simulated UI.

| Language | Full MP4 | Continuous 8s GIF | Poster | Receipts |
| --- | --- | --- | --- | --- |
| English | [19.43s](en/demo.mp4) | [520×400, 12fps](en/feature-8s.gif) | [PNG](en/poster.png) | [Manifest](en/manifest.json), [QA](en/qa.json) |
| 简体中文 | [17.77秒](zh-CN/demo.mp4) | [520×400, 12fps](zh-CN/feature-8s.gif) | [PNG](zh-CN/poster.png) | [来源](zh-CN/manifest.json), [验收](zh-CN/qa.json) |

The UI language selector appears on the landing page and studio toolbar. It persists the choice and updates studio/Tweaks labels. A newly opened Chinese Northbound demo has Chinese Home copy and live Mood bindings. Changing UI language preserves existing project content. Other dialogs and other demo-page content are not presented as fully localized.

## What is actually demonstrated

- English: **Mood → Playful** changes “Coffee that tastes like the trail.” to “Bags without the boredom”.
- 中文：点击 **风格 → 活泼**，标题由“把山野的风味，装进咖啡杯。”变成“每一袋，都有新鲜感”。
- Real pointer movement, a brief ring at the native click, orientation-preserving zoom, then a readable result hold. No cuts, speedups, subtitles, narration or music.
- Both independent cold viewers passed the narrow story. The English headline remains close and readable for about 3.09s; Chinese for 3.64s. Chinese button microcopy is not consistently readable at GIF size; native headline line wrapping remains visible. No claim that every word is legible.

This does not demonstrate an AI generation, broad visual redesign, linked-page updates, export or client approval. The offline demo's prepared Mood behavior executes locally with zero model calls. These are local repository recordings of package 0.1.0, not verified production deployments.

## How it was made

See [the reproducible recorder](../../../scripts/bilingual-demo/README.md) and [story selection](../story/bilingual-v1/story.md). The six gates are brief, discover, storyboard, rehearse, record, inspect. The recording's browser timestamps preserve actual elapsed time; it is not reconstructed by dividing captured frames by a nominal frame rate.

Capture: actual Chromium 156.0.8078.79, Playwright 1.64.1, Linux Work host `db0f58195254`, 1440×900 CDP frames. The browser context uses DPR 2, but CDP emitted 1440px frames; separate PNG evidence is DPR 2. Native click receipts determine the editorial ring. Full raw captures, markers, geometry and checksums are retained in the corresponding `runs/native-*` directories; individual original JPEG frames are retained locally outside Git.

Chinese source is `b601091`; English is `519609a` after a recorder-only shutdown fix. Their product `src` tree is identical: `eda64d702e4d31ec9e0703de6e14482e416de0e0`. Exact source identities and raw hashes are in [sources.json](sources.json). Final MP4 is H.264, yuv420p, limited range, faststart. GIFs are 96 frames at 12fps and infinite loop; Chinese uses 128 colors, English 96. Both are below 3 MiB. Larger palette attempts remain in local archives and their manifests; changing the palette did not change geometry, timing or frame rate.

Reproduce final previews after the base render:

```bash
python scripts/bilingual-demo/finalize.py docs/media/runs/native-zh-v1-take1/edits/v1 docs/media/runs/native-zh-v1-take1/edits/new-preview --colors 128
python scripts/bilingual-demo/finalize.py docs/media/runs/native-en-v1-take2/edits/v1 docs/media/runs/native-en-v1-take2/edits/new-preview --colors 96
```

Use a new output path; scripts refuse to overwrite previous edits. Current MP4/GIF bytes are published once in this directory; per-take edits retain manifests and inspection evidence. Raw capture files remain immutable.

## Validation

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run verify` passed: append-only prompts, typecheck, lint (existing warnings only), 67 unit tests, 10 browser tests. The media-recording test is skipped by the project's default, as intended. See [the full gate log](verification.txt). Both delivered formats decode without errors and raw SHA-256 remains unchanged.

`npm run build` reached the production build but this environment's proxy denies Google Fonts requests (independently confirmed with HTTP 403). It could not fetch Geist, Geist Mono or Instrument Serif; see [the build error](build-network-blocked.txt). No fonts were mocked and no product font configuration was changed to conceal the network failure.
