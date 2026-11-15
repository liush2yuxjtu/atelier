# Reproduce the bilingual Mood demo

The recorded feature is a native prepared control, not a model-generation benchmark. Each language is captured separately using the real product locale selector. No subtitles, narration or music are added.

1. Install the repository's locked dependencies with `npm ci` and start `npm run dev`.
2. Install the matching browser with `npx playwright install chromium`. Alternatively set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to a known executable. The recorded Work host used `/usr/bin/chromium`, Chromium 156.0.8078.79 with Playwright 1.64.1; the source receipt records this patch-version difference from the bundled browser.
3. Run `DEMO_LOCALE=zh-CN node scripts/bilingual-demo/record.mjs /absolute/path/to/new-rehearsal --rehearse`. A fresh isolated browser context creates the built-in Northbound demo, selects Home, opens Tweaks and verifies the real Mood change. It never clears a user's existing profile.
4. Use a new path for the actual take: `DEMO_LOCALE=zh-CN node scripts/bilingual-demo/record.mjs docs/media/runs/bilingual-v1-new-take`. Repeat with `DEMO_LOCALE=en` and a separate path for English.
5. Install FFmpeg, ffprobe, Python and Pillow. On Linux, install Noto Sans CJK fonts for the browser. Run `python scripts/bilingual-demo/render.py docs/media/runs/bilingual-v1-new-take --edit v1`.
6. If the base GIF exceeds 3 MiB, run `python scripts/bilingual-demo/finalize.py SOURCE_EDIT NEW_EDIT --colors 128` (or `--colors 96`). This preserves camera, frame rate and timing in a new edit; inspect the palette change before using it.
7. Inspect the actual images and run `python scripts/bilingual-demo/inspect.py docs/media/runs/bilingual-v1-new-take/edits/v1`. Have an independent viewer interpret the ordered frames without the intended brief. Revise only into a new edit directory.
8. Run the repository's complete `npm run verify` before committing. A supplied `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` uses that executable for the same browser tests; default installations still download the pinned Chromium. No gate is skipped.

The language selector changes UI labels; existing authored content is preserved. A newly opened Northbound demo gets native localized Home copy. This localization covers the studio/Tweaks flow, not every dialog or every sample artboard.

`record.mjs` saves real CDP frames, native click times, geometry, full state assertions and source identity. `render.py` sorts captured frames by browser timestamps, encodes their true durations into the immutable raw MP4, and generates camera edits. It refuses to overwrite an edit. If the source already exists, it checks that the render does not modify it. Retain capture frames outside Git as an archive; never substitute animated mock UI for them.

The current camera coordinates are specific to the recorded 1440×900 viewport and this version of the demo. A new product/layout requires fresh discovery and framing review. Browser iframes use canvas transforms: raw Playwright heading bounding boxes can be misleading; inspect real pixels and transform local iframe rectangles when deriving new geometry.

| Adjustment | Current value | Where to change | Required check |
| --- | --- | --- | --- |
| Viewport | 1440×900 | `record.mjs` context | Re-measure controls and source pixels |
| Language | Independent `en` and `zh-CN` native UI takes | Product locale control; `DEMO_LOCALE` | Verify native labels, before/after copy and persisted project content |
| Camera | Cosine easing, separate MP4/GIF crops | `render.py` MP/GK | Full contact sheet and dense action strip |
| Preview | Continuous 8s starting 2s before native click | `render.py` G0 | Actual result stays readable ≥3s |
| Formats | H.264 yuv420p faststart; 520px 12fps looping GIF | `render.py` encoders | Decode, duration, dimensions and size |

Historical failed attempts stay in the workspace and summarized evidence; deliverables link only the inspected final take. No credentials, browser profiles or API payloads are part of this package.
