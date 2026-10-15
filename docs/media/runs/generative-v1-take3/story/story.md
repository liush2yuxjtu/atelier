# Story — Atelier generative Tweaks (commit b140c08, PR #1)

Feature: the Tweaks panel now shows **"Prepared for this design"** generative controls per artboard (Home: Mood / Spacing intensity / CTA weight / Show social proof; Dashboard: Metric density / sparkline; Pricing: Plan count / Highlight / Billing). Picking an option rewrites copy, shows/hides blocks, reflows grids live.

## Three template options (【谁】在【场景】用【新功能】完成了【什么】)
- A（GBA 搞笑）：【a coffee-brand founder】在【a stiff SaaS-sounding homepage】用【Tweaks › Mood › Playful】完成了【one click turns "Coffee that tastes like the trail." into "Bags without the boredom" + "Let's roast"】
- B（直给演示）：【a designer】在【the Northbound Pricing page】用【Plan count › 4 plans + Billing › Yearly】完成了【a 4-card yearly pricing grid without prompting】
- C（情感共鸣）：【a solo founder before launch】在【Home】用【Mood › Playful + Show social proof off】完成了【a friendlier, cleaner hero she is happy to ship】

## Candidates scored (score 1–5 × weight/5)
Old = designbot's candidate beats; New = from research.
| Candidate | R1 20 | R2 15 | R3 20 | R4 15 | R5 15 | R6 10 | R7 5 | Total |
|---|---|---|---|---|---|---|---|---|
| Old-1 Home Mood→Playful + Social proof off (= C) | 4 | 3 | 5 | 5 | 4 | 4 | 4 | **84** |
| Old-2 Dashboard Metric density→Dense (+sparkline off) | 2 | 4 | 2 | 3 | 2 | 4 | 4 | **55** |
| Old-3 Pricing 4 plans + Yearly (= B) | 3 | 3 | 4 | 4 | 4 | 4 | 4 | **73** |
| Old-4 Full tour 1–3 + Apply across canvas | 2 | 1 | 2 | 3 | 4 | 2 | 1 | **45** |
| New-A One click, new voice: Home Mood SaaS→Playful only (= A, straight-cut) | 5 | 5 | 5 | 5 | 4 | 5 | 5 | **97** |
| New-B Mood triptych Editorial→SaaS→Playful | 4 | 4 | 4 | 5 | 4 | 3 | 4 | **81** |
| New-C Pricing Billing→Yearly only | 3 | 5 | 3 | 3 | 4 | 5 | 5 | **75** |
| New-D Per-design knobs: Home Mood, then Pricing 4 plans | 3 | 2 | 3 | 4 | 5 | 3 | 2 | **65** |

Deductions: Old-1 two changes split attention (R2) and social-proof row is tiny at canvas zoom. Old-2 Dashboard artboard is partly covered by "Studio architecture"/"Roast grid" boards in the demo layout, density change is small (R1/R3/R5). Old-3 two knobs; prices/card text small at 45 % canvas (R1/R4). Old-4 is a button tour (R2/R7). New-B three flips leave <1 s per state (R3/R6). New-C only digits change (R1/R4). New-D two boards = two stories.

- **推荐：New-A（97/100）** — strongest R1/R3/R4: a single click on a labelled control (Mood › Playful) rewrites the hero headline and CTA in large type, legible with no captions (S6/S9/S14 cause→effect; S2–S5 single interaction). Limitations: evidence is practitioner/observational; R5 relies on the Northbound demo brand.

## Chosen: New-A — "One click, new voice"
- Beginning (0–1 s): Home selected; Tweaks panel "Prepared for this design", Mood = SaaS; hero reads "Coffee that tastes like the trail."
- Middle: pointer to Mood; camera eases to ~1.6× on the Mood control; click **Playful**.
- End (payoff): camera pans to the Home artboard: "Bags without the boredom", CTA "Let's roast"; pull back to global and hold ≥3 s.
- GIF window: ~1 s before state, ~4 s action/zoom, ≥3 s result; loop ends on Playful (acceptable loop jump back to SaaS = before/after).
