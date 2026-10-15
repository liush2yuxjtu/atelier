# Story research — Atelier generative Tweaks (generative-v1)

Opened 2026-10-16 (Asia/Taipei) from the box. Open-ended: searched for short silent product demos / feature GIFs / launch-video hooks / comparable "Tweaks" demos before looking at any of our candidates. Prior research (/workspace/gallery/atelier-tweaks/story-research/, /workspace/atelier-demo-run/story/) was read only as reference; everything below is re-scored for the *generative* knob feature (commit b140c08).

## Sources (14 opened or read via search highlights; "fetch" = full page opened, "snippet" = search-engine extract of the page)
| ID | URL | Access | Evidence type | Concrete claim used |
|----|-----|--------|---------------|---------------------|
| S1 | https://blog.superhuman.com/how-to-create-remarkable-product-gifs/ | snippet | practitioner teardown | Feature GIF must show the benefit; zoom/pan to the interaction so viewers never search the screen; smooth loop. |
| S2 | https://github.com/amplitude/builder-skills/blob/221ffaa849a355ae11eec88630071c17020a4102/launch-skills/skills/launch-video/SKILL.md | snippet | practitioner guide | Use GIF when the whole value fits 3–8 s and it is a single UI interaction, not a workflow; loop start≈end; crop to what changes. |
| S3 | https://zight.com/blog/using-gifs-for-product-demos-and-tutorials | snippet | practitioner guide | One feature per GIF; 3–10 s; plan every click; keep action centred and zoom. |
| S4 | https://handbook.gitlab.com/handbook/product/product-processes/making-gifs/ | snippet | org handbook | "Show only what you need … a glimpse at a single feature"; small dedicated area. |
| S5 | https://videoediting.tips/en/use-cases/make-product-demo-gif | snippet | how-to | 2–8 s; start one beat before the click, end once UI state is clear; text unreadable below ~480 px. |
| S6 | https://www.aiuxdesign.guide/guides/claude-design-learning-path/tweaks-explore-variations-without-chat | fetch | product docs/teardown (closest analogue) | Tweaks = controls that "change the feel, not single pixel values"; pick an option and the canvas re-renders live; "twenty iterations in twenty clicks". |
| S7 | https://support.claude.com/en/articles/14604416-get-started-with-claude-design | snippet | official docs | Direct edit for quick visual shifts; chat for structural changes — Tweaks positioned as no-prompt iteration. |
| S8 | https://moderncreator.app/2026-06-19-griffin-wooldridge-claude-design-just-changed-everything-new-update | snippet | creator video transcript (observation) | Creator demos a Tweaks dropdown by flipping one option (dark mode) and showing the whole design switch. |
| S9 | https://refs.video/v/2045156267690213649 | fetch (+snippet breakdown) | cut-by-cut teardown of a silent launch demo | Silent demo: one centred cursor action → visible generated result inside the first shot, "making cause and effect immediate"; measured reframes instead of cuts. |
| S10 | https://shipteaser.com/blog/three-second-hook | fetch | blog citing Meta 2016 data | 3-second filter; muted default; best hook = "the product doing the impressive thing, frame one"; no logo/fade openers. |
| S11 | https://demoreel.app/blog/saas-demo-video-for-website/ | snippet | practitioner guide | Open on the "after"/populated state; design for silent viewing; zooms direct attention. |
| S12 | https://genra.ai/blog/how-to-make-saas-product-demo-video-with-ai | snippet | practitioner guide | Mute + first-3-seconds test; before/after of the user's day. |
| S13 | https://www.nngroup.com/articles/animation-duration/ | snippet | UX research org | UI motion 100–400 ms; longer feels like drag; shortest non-jarring duration. |
| S14 | https://www.nngroup.com/articles/animation-usability/ | snippet | UX research org | Cause→effect needs the effect within ~0.1 s of the action to feel causal. |

Douyin / Xiaohongshu: not browsed (login/app walls from the box); gap noted.

## Principles (cite only the above)
1. **One interaction, one result** — S2, S3, S4, S5 (unanimous).
2. **Cause → effect visible immediately and in the same view** — S9, S14, S6 ("re-renders live").
3. **First 1–3 s must already show the product/feature context, no throat-clearing** — S10, S11, S12. Disagreement: S11/S10 say open on the *after*; S5/S2 say start one beat *before* the click. For a loop GIF the before→after is the payoff, so we start ~1 s before the click (S5) and loop back (S2).
4. **Works muted, using only in-product text** — S10, S12, S11. (S2/S3 suggest burned-in labels; skill default is pure-screen, so the change must be legible from UI copy itself → favours changes that rewrite *words*.)
5. **Zoom/pan to the interaction; crop to what changes** — S1, S2, S3, S11, S9 (measured reframes).
6. **Restrained motion** — S13, S14.
7. **Feature-specific (S6/S7/S8): the "wow" of generative Tweaks is that one option changes the *feel/structure*, not a pixel value**; demos flip a single option and show the whole design respond.

## Rubric
Default R1–R7 kept unchanged (20/15/20/15/15/10/5); evidence above supports the default weights, no change made.

## Limitations
Mostly practitioner/observational sources; only S10 cites (old, 2016) platform data; no A/B test specific to design-tool GIFs. Audience assumed warm (Atelier/PR reviewers + design-tool users); for cold traffic R5 (relatable situation) would weigh more and favour the pricing story slightly.
