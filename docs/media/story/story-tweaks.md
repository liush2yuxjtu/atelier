# Story C — Tweaks live client demo (selected)

Skill: `liush2yuxjtu/my-release-skills` `skills/record-production-feature/SKILL.md` **§3**
(user-story after A/B/C). 讲解层 is on. Captions must not cover the color well,
the live CTA, **Approved**, or a Compare split (`§5`).

This file is the new Story C. The older Maya / Figma / Export story lives in
`story.md` as archive.

Stock-footage / 试抠图: **N/A** (product UI only).
Mac mini lock: **N/A** (Playwright Chromium on this VM).

## Story research (§3)

Short tutorial GIFs that travel open on a **person + problem**, cut to the one
action that removes the problem, and hold the **after**. The painful loop in
design is not “generate a board.” It is the client saying the work does not
feel right, then asking for another color pass.

Template: 【谁】在【场景】用【新功能】完成了【什么】

| ID | Tone | Line | 8s? | Recommend |
| --- | --- | --- | --- | --- |
| A | GBA / playful | The client yells “wrong orange!”; Lena slaps a palette chip; the CTA flips before the sentence ends. | Tight | |
| B | Straight demo | A designer opens Tweaks, changes accent, exports. | Yes | Not selected — user asked for user-story. |
| C | User story / 情感共鸣 | Lena is live with the Northbound buyer. They say it doesn’t feel right and ask to tweak the color. She already generated the knobs. She adjusts in the room until they sign off. No regenerate. No “I’ll send a new link Monday.” | Yes | **Selected.** |

## Persona

**Lena Park**, independent designer, is pitching the Northbound roast-club
landing to the buyer in a live call. English UI. Project: **Northbound roast club**.

## Problem (before)

The buyer: “感觉不太对。颜色再调一下。” / “Doesn’t feel right. Tweak the color.”
The old loop is a new Figma file, a new generate, a meeting next week.

## Mid — the new capability

Lena pre-generated tweak knobs for the things that always move in a review
(accent, palette, type scale, density, headline). In the live demo she
adjusts on the spot. The board updates. No model call.

## After (surprise / proof)

The buyer nods. She saves the look as **Approved**. Still in the meeting.

`user_outcome` (v2): last readable frames show the live landing on the new
palette plus **Approved** (or Compare A|B) and the after line
“Signed off in the room.”

`user_outcome` (v1, current code): last readable frames show the Tweaks
accent well on a new hex and the landing CTA recolored. After line
“They nodded. No regenerate.” — this is the painful gap the v2 build closes.

## Title cards (English)

| id | Kind | Copy | Placement |
| --- | --- | --- | --- |
| open | Full title card | LENA PARK · NORTHBOUND PITCH / “Doesn’t feel right.” / Tweak the color. | Full window |
| act | Lower-third | The knobs were ready. She adjusts live. | Top bar under toolbar |
| after | Result bar | Signed off in the room. | Top bar; never over Approved / CTA |

v1 captions use “They nodded. No regenerate.” because there is no Approved control yet.

## Audit — today vs this story

| Story need | Today (v1) | Gap |
| --- | --- | --- |
| Designer pre-generates knobs for likely changes | Agent *may* emit `@atelier-tweaks` / `application/atelier-tweaks` (color, range, text, select, boolean). Demo landing has accent, radius, headline. Offline draft: accent + radius only. Empty boards say “ask the agent to make it tweakable.” | No **infer** from markup. No auto knobs for palette variants, type scale, density, layout variants, copy tone. No one-click “generate knobs.” |
| Color pickers | Native `<input type="color">` + hex field. Live via CSS vars `--tweak-*` and `apply-tweaks` postMessage. | No named **palette presets** (Ember / Moss / Night chips that retint accent+paper together). |
| Variant switch | `select` and `boolean` exist; unused in the landing demo. | No layout/copy-tone variants wired as first-class looks. |
| Live update in presenting / fullscreen | Preview / Edit / Inspect / Comment only. Chat, library, and right rail always visible. Tweaks live in a 300px rail. | No **Present** mode. No floating tweaks dock over a fullscreen board. |
| Before / after compare | None. Duplicate artboard is a whole extra board. | No A/B split of two tweak maps on one board. |
| Snapshot / save a variant | `versions` snapshots entire canvas after a generate. Files → History restores a version. | No **save this look** (tweak map only) named “Approved.” |
| Undo | None for tweaks. History restore is nuclear. | No tweak undo/redo stack. |

v1 recording uses only the left column. v2 recording uses the closed gaps.

## Beats

### v1 — current code (~30s walkthrough)

1. Title card (problem).
2. Open Northbound demo. Landing is selected; orange CTA.
3. Problem bar. Tweaks rail shows Accent.
4. Change Accent hex. CTA recolors live.
5. Hold ≥3s. After line.

GIF 8s: ~1s problem, ~4s accent change, ≥3s recolored CTA.

### v2 — after the gaps (~35–50s)

1. Title card.
2. Open demo → **Present**. Board fills; floating dock.
3. Problem bar. Palette chips were pre-generated.
4. Click **Moss** (or Night). CTA + paper retint. Optional density nudge.
5. **Save look** → **Approved**. Optional Compare A\|B.
6. Hold ≥3s. “Signed off in the room.”

## GIF window

Continuous 8s from markers: 1s context / ~4s action / ≥3s proof.
520px / 12fps / loop 0 / GCE 800cs / frames = 96. English UI.
Deliverables: `docs/media/tweaks-v1-*` then `docs/media/tweaks-v2-*` (hero).

## Takes

| Take | Verdict | Notes |
| --- | --- | --- |
| tweaks-v1-take1 | keep | Current-code gap. Accent hex `#c45c26` → `#2f6fed`. After: “They nodded. No regenerate.” 29.56s walkthrough. |
| tweaks-v2-take1 | keep | Present dock, Moss chip, Approved. After: “Signed off in the room.” Proof 4.96s. 29.68s walkthrough. README hero. |
