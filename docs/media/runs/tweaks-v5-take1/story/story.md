# Story — Tweaks v5: one change, every page (live client call)

Template: 【谁】在【场景】用【新功能】完成了【什么】

## Atelier Tweaks (global linked theme, commit e6ddfd1)
- A（GBA 搞笑）：【被客户一句“有点怪”击中的设计师】在【视频会议倒计时】用【Tweaks】一招“全屏换装”，完成了【三页网站同时变身的连击】
- B（直给演示）：【设计师】在【Atelier 画布】用【Tweaks 的 Look】点一下，完成了【Home / Pricing / About 三页同步换色】
- C（情感共鸣）：【独立设计师 Lena】在【和 Northbound 客户的线上评审】里，客户说“感觉有点不对，颜色再调调”，她用【Tweaks】当场只改一处，完成了【Home、Pricing、About 三页同时更新、客户当场点头】
- **推荐：C** — 用户要求 user-story 版本；结果（三页同时变色 + "linked in 3 boards"）一眼可见、8 秒内可录完，贴合调研里“客户改色痛点 → 改一处全部变”的爆款结构。

## Chosen: C
- Beginning (problem, first second): the finished Northbound site — Home, Pricing, About side by side in the original Ember look, on a live review (Present mode, chat hidden). The look the client said "feels a bit off".
- Middle (feature does the hard part): Lena moves to the Tweaks dock on the Home board and clicks ONE Look chip. No prompt, no regenerate, no per-file prop.
- End (surprise): all three pages recolor at the same instant; "linked in 3 boards" visible; she toggles once more to confirm it is live, then marks **Approved**. Result held ≥3 s.
- Contrast vs Claude Design (metadata/README only, not on screen): its tweaks are single-file props with no cross-page linkage.
- Hook/pacing: <1 s before-state, one click at ~1 s, reveal ≤0.2 s later, hold; pure-screen, fixed wide camera.
