# Story C — Tweaks live client demo (selected)

Skill: `liush2yuxjtu/my-release-skills` `skills/record-production-feature/SKILL.md` **§3**
(user-story after A/B/C). 讲解层 is on. Captions must not cover the palette
chips, the **linked in N boards** badge, Pricing up / stack, Compare split,
or **Approved** (`§5`).

This file is the current Story C. Older Lena / single-board takes stay
below as archive. Maya / Figma / Export lives in `story.md`.

Stock-footage / 试抠图: **N/A** (product UI only).
Mac mini lock: **N/A** (Playwright Chromium on this VM).

## Story research (§3 + cd-tweaks-demos)

How Anthropic and the community demo Tweaks (Austin Lau / Claude Design
walkthroughs, `awesome-claude-design` recipes):

1. Start from a **finished** design, not a generate.
2. **Locked camera** — the board stays put; the feel changes in place.
3. Live in-place change (no regenerate, no new file).
4. Talk in **feel** dimensions: color, density, section order, variant.
5. Contrast with chat: chat builds structure; Tweaks changes feel.
6. Wrap-up is “apply across the full design” / handoff, not another prompt.
7. **AI-generated knobs are underserved** — show Generate knobs.

Claude Design Tweaks are per-file root-DC props and deliberately avoid
shared tokens. Atelier’s differentiator is the opposite: a project-level
layer bound across every page.

Template: 【谁】在【场景】用【新功能】完成了【什么】

| ID | Tone | Line | 8s? | Recommend |
| --- | --- | --- | --- | --- |
| A | GBA / playful | The client yells “wrong orange!”; Lena slaps a palette chip; three pages flip before the sentence ends. | Tight | |
| B | Straight demo | Open Tweaks, change accent, export. | Yes | Not selected. |
| C | User story | Lena is live with the Northbound buyer on Home + Pricing + About. They say it doesn’t feel right and ask to move pricing up. She generates knobs, switches Moss in the Present dock — every page changes, linked badge — then moves the shared pricing section once. Compare. Approved. | Yes | **Selected.** |

## Persona

**Lena Park**, independent designer, pitching the Northbound roast-club
**site** (Home, Pricing, About on one canvas) to the buyer in a live
call. English UI. Project: **Northbound roast club**.

## Problem (before)

The buyer: “感觉不太对。颜色再调一下。把定价往上挪。” / “Doesn’t feel
right. Tweak the color. Move pricing up.”
The old loop is a new file per page, a meeting next week.

## Mid — the new capability

Lena clicks **Generate knobs**. In Present (locked camera, no chat) she
switches **Moss** — Home, Pricing, and About retint together
(`linked in 3 boards`). She clicks **Pricing up** once; the shared
section moves on every page that has it. Optional **Pricing stack**.

## After (surprise / proof)

Compare A|B. The buyer nods. **Approved.** One look, every page.

`user_outcome` (v3): last readable frames of the 8s GIF show three pages
on Moss, the linked badge, and pricing moved up. Walkthrough ends on
Compare + Approved.

## Title cards (English)

| id | Kind | Copy | Placement |
| --- | --- | --- | --- |
| thesis | Full title card (2s) | Chat = structure · Tweaks = feel · Edit = exact | Full window; walkthrough only, not in the 8s GIF |
| open | Full title card | LENA PARK · NORTHBOUND PITCH / “Doesn’t feel right.” / Tweak the color. Move pricing up. | Walkthrough, after thesis |
| act | Lower-third | Generate knobs. One look, every page. | Top bar under toolbar; never over dock |
| after | Result bar | Signed off. One look, every page. | Top bar; never over Approved / Compare |

## Beats (~30s walkthrough)

1. 2s caption card: **Chat = structure · Tweaks = feel · Edit = exact**.
2. Open finished Northbound site. Immediately **Present** — Home +
   Pricing + About, locked camera, chat out of frame.
3. **Generate knobs** (AI-generated knobs — the underserved beat).
4. **GIF window (8s, no chat):** Moss → all three pages retint +
   `linked in 3 boards` → **Pricing up** (structural, propagates).
5. Compare A|B (theme + section snapshot).
6. **Approved.** Hold ≥3s.

## GIF window

Continuous 8s from markers: ~1s finished three-page site / ~4s Moss +
linked + Pricing up / ≥3s proof.
520px / 12fps / loop 0 / GCE 800cs / frames = 96. English UI.
**No chat in frame.** Locked camera. Seamless loop.
`--no-zoom` so all three pages stay readable.

Deliverables: `docs/media/tweaks-v3.gif` (README hero) + `tweaks-v3.mp4`.
v1 / v2 stay as archive.

## Takes

| Take | Verdict | Notes |
| --- | --- | --- |
| tweaks-v1-take1 | archive | Accent hex only. 29.56s. |
| tweaks-v2-take1 | archive | Present + Moss + Approved. Single board. 29.68s. |
| tweaks-v3-take1 | keep | Multi-page linked theme + structural Pricing up. README hero. 8s GIF: no chat, locked camera, Generate knobs → Moss (all 3 pages, linked in 3) → Pricing up. Walkthrough 29.44s with 2s card “Chat = structure · Tweaks = feel · Edit = exact”. Frame QA pass. |

## Frame QA (v3)

| Check | Result |
| --- | --- |
| English UI / no CJK | pass (`postcheck.json`) |
| Chat out of 8s frame | pass (Present; `chat_in_present: 0`) |
| Locked camera, 3 pages | pass (Home / Pricing / About) |
| Generate knobs in window | pass (~1.3s into excerpt) |
| Moss on every page | pass (CTA + bean + pricing buttons) |
| `linked in 3 boards` | pass (stays 3 after knobs) |
| Pricing up propagates | pass (Home teaser moves above hero) |
| Captions over dock / CTA | none in GIF (bar hidden) |
| Thesis card 2s | walkthrough only, 3 lines |
| GCE 96 / 800cs / loop 0 / ≤3 MiB | pass (1,903,885 B, 520×326) |
