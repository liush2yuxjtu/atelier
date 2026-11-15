# Mood changes the same page

Audience: a designer reviewing the Northbound Home page who wants a different voice without another chat turn. One visible outcome: clicking the native Mood > Playful control changes the existing hero headline in place; the CTA also changes, but its small text is not a delivery-size legibility claim.

## Research reused

This is an adaptation of the recorded Sidebar research, not a claim to have opened eight new sources for Atelier. The eight previously opened source URLs and excerpts are in `reused-sources.json`; the repository's existing `../research-tweaks-v5.md` also informs the single-control/single-result framing. Screen Studio informs selective zoom; NN/g informs short orientation-preserving motion. Vendor guidance is not conversion-test evidence. No engagement numbers or viral-video results are asserted.

The same R1–R7 rubric is used: opening clarity 20, single outcome 15, visible before/after and result hold 20, silent understanding 15, real UI/scenario 15, restrained motion 10, continuous eight-second fit 5. Each dimension is scored 1–5; total = sum(score × weight / 5). Scores are editorial judgments.

| Candidate | R1 | R2 | R3 | R4 | R5 | R6 | R7 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Existing broad tour: palettes, compare, approval | 3 | 2 | 4 | 3 | 4 | 3 | 2 | 63 |
| A playful game: clear three design levels | 3 | 2 | 3 | 2 | 2 | 2 | 2 | 48 |
| B direct: same page, change Mood, read new headline and CTA | 4 | 5 | 5 | 4 | 5 | 4 | 5 | 91 |
| C emotional: win the client’s approval with a new look | 4 | 3 | 4 | 3 | 4 | 4 | 3 | 73 |
| D linked palette updates all pages | 4 | 5 | 4 | 4 | 5 | 4 | 4 | 86 |

Select B: verified native controls and a readable text change provide a focused before/after. A requires an invented game layer. C implies a client's reaction the app cannot prove. D remains valuable, but is already covered by the repository's archived takes and requires a wider frame that makes text smaller.

## Beats

1. Orient: the real Atelier studio, Home selected, native Tweaks panel open.
2. Before: zoom to “Coffee that tastes like the trail.” and “Start a subscription”.
3. Cause: move pointer to native Mood > Playful; show actual click with a brief editorial ring.
4. Bridge: pull back briefly so the spatial relationship between panel and canvas remains visible.
5. Result: zoom to “Bags without the boredom” and “Let’s roast”; retain a readable result for at least three seconds.
6. Full walkthrough returns to the studio. The eight-second excerpt stays on the payoff.

## Language and evidence scope

English and Simplified Chinese use independent fresh recordings of the real application in their respective UI languages. The product now has a persistent language selector for the studio and Tweaks flow; a newly created built-in Chinese demo includes native Chinese Home text and live copy bindings. Existing authored projects are never translated when the interface language changes. Other dialogs and other demo-page content are not claimed to be fully localized.

No subtitles, narration, music, or simulated UI are added. A short ring marks the real click, and a cosine-eased camera follows measured source regions. Each take is recorded at package 0.1.0 (Chinese source commit `b601091afcd6546b9b83fc91598046155b94e8b7`; English source commit `519609a` after a recorder-only cleanup fix; their `src` trees are identical), as a local repository demo, not proof of a deployed production version. Native prepared Mood behavior executes for real; no model calls or model-generation claims are involved. Existing offline-model text remains visible in the full studio. This story does not demonstrate autonomous generation, export, linked-page updates, or client approval.

## Capture and revision history

The first rehearsal failed because the entire scrollable panel extended below the viewport; discovery now distinguishes the visible Mood control from the rest of the panel. The second rehearsal passed controls, native state, framing and dependencies. Take 1 used repeated PNG screenshots and was too sparse under concurrent verification; preserved locally, not used for delivery. A subtitle-only English draft used CDP's real JPEG screencast, browser timestamps and native click event timestamps. Frames are sorted by the browser timestamp before encoding; timestamps, not assumed nominal frame rate, preserve elapsed time. Original capture frames are retained in the workspace archive; `raw/gt.mp4` is the immutable full recording included in the repository. Individual capture-frame checksums accompany the timeline.

Capture viewport is 1440×900 with a DPR-2 browser context; CDP actually emitted 1440×900 frames. The full-resolution PNG evidence is separate. The manifest records the actual recording size, rather than calling it a 2880px capture.

Camera and click ring follow measured source pixels and a native click receipt. Final native-language takes use no subtitles. No cuts, speedups, music or generated UI.

Final native-language takes are `native-en-v1-take2` and `native-zh-v1-take1`. Both use identical verified product source trees, with separate browser contexts, localized built-in demo data, native click receipts, timestamp timelines and immutable raw MP4s. The subtitle-only drafts were superseded when the user requested actual Chinese UI.

English native take 1 reached its end marker but failed during CDP cleanup before saving all receipts. A recorder-only fix drains late acknowledgements; take 2 exited cleanly and is the delivered source. The original failed take stays locally. Chinese GIF v1 exceeded 3 MiB and was re-encoded in v2 with 128 colors. English v1/v2 exceeded the budget; v3 uses 96 colors. Frame rate, geometry and source timing remain unchanged. Original edits remain locally; receipts and final QA are committed.
