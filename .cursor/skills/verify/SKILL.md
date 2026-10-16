---
name: verify
description: Run Atelier's local merge gate — prompts append-only, typecheck, lint, vitest, Playwright — plus the media clarity / cold-viewer gate when a demo take exists. Use before merge, after feature work, after a recording handoff, or when asked to /verify. There is no GitHub Actions CI.
---

# /verify

Atelier's merge gate is **local**. There is **no GitHub Actions CI**. Do not wait for a checks tab, do not add `.github/workflows/*`, and do not treat a missing GitHub status as a blocker. After feature work and before merging to `main`, run this skill.

## When to use

- After implementing or fixing a feature, before the final push
- Before merging a PR to `main`
- When the user asks to `/verify` or "run the gate"
- After a production demo recording, before marking `handoff.json` `ready` (also run **Media clarity & cold-viewer** below)

## Command

From the repo root (install deps with `npm install` if `node_modules` is missing):

```bash
npm run verify
```

That is the single code gate. It calls `scripts/verify.sh` so this skill, the npm script, and the shell script stay in sync. Do not invent a parallel command list.

## Steps (fail-fast, in order)

1. **prompts/ append-only** — `git diff --name-status $(git merge-base origin/main HEAD) HEAD -- prompts/`. Only `A` (add) is allowed. Modify, delete, rename, or copy fails.
2. **`npm run typecheck`**
3. **`npm run lint`**
4. **`npm run test`** (Vitest)
5. **Playwright** — `npx playwright install chromium` if needed, then **`npm run test:e2e`**

Media recording (`e2e/dc-demo-video.spec.ts`) is skipped unless `RECORD_MEDIA=1`. The code gate must not record GIFs or videos.

## Pass / fail (code gate)

- **Pass:** exit code 0 and the line `verify: all steps passed`.
- **Fail:** the first failing step exits non-zero. Fix that step, then re-run the **full** `npm run verify`. Do not skip a step or comment it out to get a green gate.

Report which steps passed and which failed. Merge only after a full green run on the branch being merged.

## Media clarity & cold-viewer (when a demo take exists)

Do **not** fold this into `npm run verify`. Run it whenever `docs/media/runs/<take>/` has a deliverable GIF/MP4 and before `handoff.json` status may become `ready`. Aligns with `record-production-feature` §7.1.

### Clarity gate (delivered GIF size)

1. Measure on the **delivered** GIF width (usually ~520 px), not the 1920 master.
2. Zoomed shots must keep key text clearly legible at that size:
   - hero / result title: cap height ≥ **16 px**
   - operated control label: x-height ≥ **9 px**
   - CTA / secondary result: x-height ≥ **7 px**
3. OCR every required token on each beat frame (tesseract; fuzzy match ≥0.8). OCR alone is not enough — pixel thresholds must also pass.
4. Result text must stay above threshold for ≥ **3 s** continuous.
5. Close-up ROI fully in frame; ROI center offset ≤ **10%**.
6. Reference scripts: `scripts/ai-add-tweaks/verify_legibility.py`, `scripts/generative-v1/verify_legibility.py` (or the take's `verify/` copies).

### Cold-viewer story test (independent)

A viewer with **no context** must understand the user story from the frames alone.

1. Build a **16-frame evenly spaced contact sheet** from the deliverable (no captions, no filenames, no storyboard text in the prompt).
2. Give that sheet (or decoded GIF frames) to a **fresh** visual reader — a new agent context / parent agent that did **not** record the take. Ask only: *What happened? Who is it for?*
3. **PASS** only if the answer independently recovers: **one control (name readable) → what changed (before/after text readable) → resulting style/outcome**.
4. Self-scoring by the recording agent is **provisional only** → `ready-with-notes`, never `ready`. Escalate to a fresh context for the independent pass.
5. **Region / model fallback:** if `videoReview` (or another video visual model) is blocked in the user's region, do **not** skip the gate. Decode the GIF to frames + use `verify/cold-viewer-contact-sheet.png` (and beat stills). Have a **fresh** context cold-read those stills the same way. That still counts as independent cold-viewer when the reader is not the recorder.

### Evidence (required under `docs/media/runs/<take>/verify/`)

| File | Role |
|---|---|
| `legibility.json` | thresholds, measured px, OCR tokens, centering, `story_test` answer |
| `legibility-strip.png` | beat frames with measured values annotated |
| `cold-viewer-contact-sheet.png` | 16-frame sheet used for cold-viewer |
| `mp4-ocr.json` | optional MP4 OCR cross-check |

Also copy verdict into `handoff.json` (`qa`, `legibility.story_test` when present) and each shot's `legibility_px` in `shotlist.json`.

### Fail → fix loop

If clarity or cold-viewer fails: fix recording scripts (zoom/ROI/hold) or the smallest app demo change needed, re-record, keep the old run, append `runs/takes.log`, re-run this section until PASS. Do not accelerate playback or add burned-in subtitles to fake clarity.

### Example (ai-add-tweaks take4)

Independent cold-viewer PASS recovered: input `the pricing section` → Add tweaks → Plan heading (Cadence / Lots / Pledge) → click Lots → title becomes **Pick a lot**. `videoReview` was region-blocked; contact sheet + GIF frames in a fresh context substituted.
