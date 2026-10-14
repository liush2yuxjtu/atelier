# Tweaks v5 — one change, every page (current)

Skill: record-production-feature (SKILL.md + references/story-research.md, cinematography.md, media-contract.md, recording-lock.md). Recorded on the Mac mini under `chatcut-rec-lock`, pure-screen, English UI.

- Research: `research-tweaks-v5.md` · Story options A/B/C: `../runs/tweaks-v5-take1/story/story.md` (推荐 C, selected)
- Story C: Lena is in a live review with the Northbound buyer, who says the site "feels a bit off — tweak the color". In Present mode she clicks ONE Look chip (Ember → Signal) on the Home dock; Home, Pricing and About recolor in the same frame (`linked in 3 boards`), then **Approved**.
- Why it matters: Atelier tokens are project-level (`src/lib/theme.ts`, `store.ts`, e6ddfd1); Claude Design tweaks are single-file props with no cross-page linkage.
- GIF `../tweaks-v5.gif` = raw 8.9–16.9 s (click 10.22 s, all 3 pages Signal from 10.3 s, Approved 13.07 s; result held 6.6 s). MP4 `../tweaks-v5.mp4` = full 21.2 s GT.
- QA: `../runs/tweaks-v5-take1/edits/v2-official/qa.json` — status **ready**; official build_feature_media.py rerun (22 GiB free), outputs byte-identical to the earlier v1-manual encode.

---

# Archive (v1–v4)

# Story C — Tweaks live client demo (selected)

Skill: `liush2yuxjtu/my-release-skills` `skills/record-production-feature/SKILL.md` **§3**
(user-story after A/B/C). 讲解层 is on. Captions must not cover the palette
chips, Compare split, **Save look**, or **Approved** (`§5`).

This file is the current Story C. v1–v3 takes stay below as archive.
Maya / Figma / Export lives in `story.md`.

Stock-footage / 试抠图: **N/A** (product UI only).
Mac mini lock: **N/A** (Playwright Chromium on this VM).

## Story research (§3)

`cd-tweaks-demos.md` was not attached. Findings used instead:

Anthropic frames Tweaks as **“custom sliders (made by Claude)”** and
**“use adjustment knobs to tweak spacing, color, and layout live. Then
ask Claude to apply your changes across the full design.”** The value is
**more exploration, not pixel pushing.**

Austin Lau (Anthropic) demo, 4/17: a non-technical marketer recreates a
landing page; reorders sections, switches hero variants, toggles a
pricing module. Line: **“No prompting. Just click and drag.”** Then
handoff to Claude Code.

aiuxdesign.guide: **“Twenty iterations in twenty clicks rather than
twenty chat messages.”**

MacStories: people confuse the Tweaks panel with Edit. The 2s card
exists to split the tools: Chat = structure · Tweaks = feel · Edit = exact.

### Patterns

1. Finished design first — never start on a generate.
2. Locked / fixed camera. The board stays put; feel changes in place.
3. Live in-place. No regenerate, no new file.
4. Feel dimensions: theme, density, accent, layout variants.
5. Contrast with chat. Tweaks is exploration; chat is structure.
6. Wrap-up is apply-across-the-full-design / handoff, not another prompt.
7. AI-generated knobs are rarely shown — **show Generate knobs**.

Claude Design Tweaks are per-file root-DC props and deliberately avoid
shared tokens. Atelier’s extra: a project-level layer bound across every
page (`linked in N boards`).

Template: 【谁】在【场景】用【新功能】完成了【什么】

| ID | Tone | Line | 8s? | Recommend |
| --- | --- | --- | --- | --- |
| A | GBA | Twenty clicks, three palettes, the buyer nods. | Tight | |
| B | Straight demo | Open Tweaks, change accent, export. | Yes | Not selected. |
| C | User story | Lena is live with the Northbound buyer. The site is already finished. She generates knobs to make it feel more premium, explores three looks, undoes, compares, saves, Approved. No prompting. | Yes | **Selected.** |

## Persona

**Lena Park**, independent designer, pitching the Northbound roast-club
**site** (Home, Pricing, About) to the buyer in a live call. English UI.

## Problem (before)

The buyer: “感觉不太对。” / “Doesn’t feel right.” The old loop is twenty
chat messages or a new file next week.

## Mid — the new capability

**Generate knobs** — “make it feel more premium.” Then click, don’t
prompt: Moss, undo, then three live palette switches on a locked camera.
Every page follows (`linked in 3 boards`).

## After (surprise / proof)

Compare A|B (the look they walked in on vs the one they liked).
**Save look → Approved.** Handoff. Twenty clicks, not twenty messages.

## Title cards (English)

| id | Kind | Copy | Placement |
| --- | --- | --- | --- |
| thesis | Full title card (2s) | Chat = structure · Tweaks = feel · Edit = exact | Walkthrough only |
| open | Full title card | LENA PARK · NORTHBOUND PITCH / “Doesn’t feel right.” / Twenty clicks, not twenty chat messages. | After thesis |
| knobs | Lower-third | Make it feel more premium. | After Present; never over dock |
| after | Result bar | Signed off. Apply it across the site. | After Approved; never over badge |

## Beats

### 8s GIF (fixed frame, no chat, seamless loop)

Present dock already up. Ember → **Moss → Night → Signal** (three
switches) → **Compare** → **Save look → Approved**. Locked camera on
Home + Pricing + About. Captions off.

### ~30s walkthrough

1. 2s card: **Chat = structure · Tweaks = feel · Edit = exact**.
2. Persona + finished design (open Northbound, three pages).
3. Present. **Generate knobs** + “Make it feel more premium.”
4. Palette (Moss) + **Undo** back to Ember.
5. *GIF window:* three palette switches, Compare, Save → Approved.
6. Two looks live (Before vs Approved). CTA: “Signed off. Apply it across the site.”

## GIF window

Continuous 8s: ~0.6s Ember / ~4s three switches / Compare / Save+Approved
hold ≥1.5s. 520px / 12fps / loop 0 / GCE 800cs / 96 frames. `--no-zoom`.

Deliverable: `docs/media/tweaks-v4.gif` (README hero) + `tweaks-v4.mp4`.

## Takes

| Take | Verdict | Notes |
| --- | --- | --- |
| tweaks-v1-take1 | archive | Accent hex only. |
| tweaks-v2-take1 | archive | Present + one Moss + Approved. Single board. |
| tweaks-v3-take1 | archive | Linked pages + Pricing up. One palette. |
| tweaks-v4-take1 | keep | Research-faithful: 3 palettes, Compare, Save→Approved. README hero. |

## Frame QA (v4)

| Check | Result |
| --- | --- |
| English UI / no CJK | pass |
| Chat out of 8s frame | pass (Present) |
| Fixed camera, 3 pages | pass |
| 3 palette switches | Ember → Moss → Night → Signal (Night is the dark paper) |
| Compare A\|B | pass (Home split ember/signal) |
| Save look → Approved | pass (badge on dock) |
| Thesis card 2s | walkthrough only |
| Generate knobs + undo | walkthrough, before GIF window |
| GCE 96 / 800cs / loop 0 / ≤3 MiB | pass (1,933,323 B, 520×326, 30.52s raw) |
