# Story — AI Add more tweaks (commit de76e3b, feat/fancy-tweaks-baseline)

Feature: Tweaks panel **Add more tweaks** (`tweaks-ai-input` / `tweaks-ai-submit`) + chat alias `/add more tweaks for/i` → `POST /api/add-tweaks` (Cursor Auto on Mac mini) → new knobs; toggles update the artboard with **0** further chat tokens.

## Three template options (【谁】在【场景】用【新功能】完成了【什么】)
- A（GBA 搞笑）：【a caffeine-obsessed founder】在【a homepage whose pricing still looks like a spreadsheet】用【Add more tweaks → “the pricing section” + Price layout › Rows】完成了【AI drops four knobs and one flip turns cards into a readable row list without another prompt】
- B（直给演示）：【设计师】在【demo Home】用【Add more tweaks for “the pricing section”】完成了【AI 生成 Plan voice / Price layout / Show camp tier / Highlight，立刻用开关改版且不再花 token】
- C（情感共鸣）：【a solo designer stuck rewriting pricing copy by chat】在【Home Tweaks】用【one AI add + free Plan voice toggle】完成了【monthly voice on the cards without burning another generation】

## Extra candidates from research
- New-A：Prompt once on pricing → **Price layout › Rows** only (biggest layout delta) — single toggle payoff.
- New-B：Prompt “hero social proof and CTA emphasis” → CTA emphasis › Banner (large CTA change).
- New-C：Type in chat alias “add more tweaks for the pricing section” (chat path) — same API, weaker panel focus.
- New-D：Full tour: AI add + flip all four knobs — button tour (fails R2).

## Rubric scores (score 1–5; contribution = score × weight/5)
| Candidate | R1 20 | R2 15 | R3 20 | R4 15 | R5 15 | R6 10 | R7 5 | Total |
|---|---|---|---|---|---|---|---|---|
| A GBA pricing rows | 4 | 4 | 5 | 4 | 4 | 4 | 4 | **83** |
| B Direct designer pricing (chat brief) | 5 | 4 | 5 | 5 | 5 | 4 | 4 | **93** |
| C Emotional Plan voice | 4 | 4 | 4 | 5 | 5 | 4 | 4 | **85** |
| New-A Price layout → Rows only | 5 | 5 | 5 | 4 | 4 | 5 | 5 | **94** |
| New-B Hero CTA Banner | 4 | 5 | 4 | 4 | 4 | 5 | 5 | **86** |
| New-C Chat-alias path | 3 | 4 | 4 | 4 | 4 | 3 | 3 | **72** |
| New-D Flip all four knobs | 3 | 1 | 3 | 4 | 4 | 2 | 2 | **54** |

Deductions: A comedy framing adds little at mute (R4). C copy-only change can be subtle at 520 px (R1/R3). New-B hero is strong but weaker “AI added knobs” panel story (R5). New-C hides the Tweaks form (R1/R6). New-D is a tour (R2/R7). B matches the user brief exactly and keeps panel + canvas readable; New-A is the tightest single-toggle cut.

- **推荐：New-A（94/100）** with **B as narrative wrapper** — record New-A beats (type “the pricing section” → cut wait → new knobs → Price layout › Rows → hold). Story line for handoff uses B’s user template. Limitations: non-deterministic labels/keys; if a take lacks a clear layout delta, keep the take with the strongest visible pricing change (Plan voice / Show camp tier).

## Chosen beats (New-A inside B story)
- Beginning (~1 s): Home + Tweaks; “Add more tweaks” form visible; pricing cards in default layout.
- Middle: zoom on input; type `the pricing section`; click **Add tweaks**; **jump-cut** “Asking the model… / Adding…” (full wait kept in GT markers only).
- Reveal: status `Added N tweaks`; new knobs (e.g. Plan voice, Price layout…); zoom on **Price layout**; click **Rows** (or best visible option from that take).
- End: pricing layout/copy change readable ≥3 s; pull back global.
- GIF window (~8–11 s deliverable): ~1 s before, ~4 s type+submit+knobs+toggle, ≥3 s result; **AI wait excluded** (jump) — noted in `feature.json` / handoff `deviations`.
