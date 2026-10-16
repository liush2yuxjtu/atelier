# Story research — Atelier AI “Add more tweaks” (ai-add-tweaks-v1)

Opened 2026-10-16 (Asia/Taipei) from the box. Open-ended: searched short silent SaaS / product-demo GIFs and AI-wait editing guidance **before** locking any candidate. Prior generative-v1 research and smoke notes were read only as feature context; every candidate below is re-scored for *AI prompt → new knobs → free toggle*.

## Sources (opened or read via full page / search highlights)
| ID | URL | Access | Evidence type | Concrete claim used |
|----|-----|--------|---------------|---------------------|
| S1 | https://zight.com/blog/using-gifs-for-product-demos-and-tutorials | fetch | practitioner guide | One feature per GIF; 3–10 s; plan clicks; centre actions; zoom for small screens; smooth loop. |
| S2 | https://trymy.app/blog/app-demo-gif | fetch | practitioner shot-list | Four shots: empty/context → one input → work happening (cut long waits to ~2 s) → hold result to read; mute; no wandering cursor; legible type at embed width. |
| S3 | https://github.com/amplitude/builder-skills/blob/221ffaa849a355ae11eec88630071c17020a4102/launch-skills/skills/launch-video/SKILL.md | snippet | practitioner guide | GIF for a single UI interaction in ~3–8 s; loop start≈end; capture 2× then downscale; silent + labels only if needed. |
| S4 | https://emailsequence.com/blog/gifs-in-emails/ | snippet | email/media practice | Before/after reveal; one idea; first frame meaningful (clients may freeze on frame 1). |
| S5 | https://screen.studio/create/product-demo-videos | snippet | product / tooling | Zoom on interaction; cut & speed-up waits on the edit timeline. |
| S6 | https://www.jimraptis.com/blog/create-saas-videos-for-new-features | snippet | practitioner teardown | Slow deliberate cursor; Screen Studio zooms on feature; short social/newsletter cuts. |
| S7 | https://github.com/77777R7/screenstudio-demo-optimizer | snippet | agent skill / compression | Agent-workflow preset: heavily speed waits, preserve decisions + final result; label/plan compression. |
| S8 | https://shipteaser.com/blog/three-second-hook | snippet (via prior gen research) | blog citing Meta 2016 | Muted default; first seconds = product doing the impressive thing. |
| S9 | https://www.nngroup.com/articles/animation-usability/ | snippet (via prior) | UX research | Cause→effect must feel linked; delays break causality unless edited. |
| S10 | https://www.aiuxdesign.guide/guides/claude-design-learning-path/tweaks-explore-variations-without-chat | fetch (prior session) | closest product analogue | Tweaks = iterate without more chat tokens; flip options, canvas responds. |
| S11 | Atelier smoke `docs/media/story/ai-add-tweaks/smoke.md` @ de76e3b | local | live product evidence | Prompt “the pricing section” → Plan voice / Price layout / Show camp tier / Highlight; toggles change artboard with **0** further API calls; AI latency 70–95 s. |

Douyin / Xiaohongshu: not browsed (login/app walls from the box); gap noted.

## Principles (cite only the above)
1. **One interaction → one readable result** — S1, S2, S3, S4.
2. **Input must be specific and visible** (typed topic, not a vague menu tour) — S2 shot 2.
3. **Long AI/processing waits must be cut or labeled in the deliverable**; keep full wait in GT/markers — S2 (“cut dead time”), S5, S7; skill cinematography rule.
4. **Cause→effect in the same view after the cut** (submit → new knobs → toggle changes canvas) — S9, S10, S11.
5. **First 1–2 s already show Tweaks + Home context** — S8, S2 shot 1.
6. **Works muted with only in-product copy** — S2, S3, S8.
7. **Zoom to input, to new knobs, to toggle result; hold result ≥3 s** — S1, S5, S6; skill Screen-Studio pattern.
8. **Feature-specific wow (S10/S11):** AI adds knobs once; **free toggles** prove “no more tokens.”

## Rubric
Default R1–R7 unchanged (20/15/20/15/15/10/5). Evidence supports defaults; no weight change.

## Limitations
Mostly practitioner/observational; S8’s Meta cite is old. No A/B on design-tool GIFs. Audience assumed warm (PR reviewers / design-tool users). AI knobs are **non-deterministic** (S11) — multi-take required; scoring assumes a take where Price layout / Plan voice visibly change pricing.
