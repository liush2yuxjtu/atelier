# Story research — Tweaks v5 (global linked tokens, live client call)

Date: 2026-10-15 (Asia/Shanghai). Skill: record-production-feature `references/story-research.md`.
Read-only browsing; no login, no likes, no downloads of others' videos.

## Access note
- Xiaohongshu search (`xiaohongshu.com/search_result?keyword=设计师 现场改稿 一键换色`) returns only the
  footer shell without login; Douyin search likewise needs login. Engagement counts could not be read
  directly, so patterns below come from indexed public pages of the same genre (Bilibili / 站酷 / Pixso
  design tutorials that are cross-posted to 抖音/小红书) and are marked as such.

## Reference examples (genre: 一键换色 / 全局样式 / 设计改稿)
| # | URL | Hook (first 1–3 s) | Before → after | Pacing / reveal | Why it lands |
|---|-----|--------------------|----------------|-----------------|--------------|
| 1 | https://www.bilibili.com/video/BV12tQvBrERB/ (UIVlog series, "1分钟速通…大屏高效一键换色") | Finished multi-screen UI already on canvas | One color variable change → every screen recolors | One action, reveal within ~2 s, long hold on the grid | "改一处、全部变" is visible at a glance |
| 2 | https://pixso.cn/designskills/pixso-global-styles-guide/ | "客户临时要改色" pain | Manual per-page recolor vs style "一处修改，全案生效" | Side-by-side contrast table / grid | Names the client-change pain directly |
| 3 | https://pixso.cn/designskills/dark-mode-ai-switch/ | "支持深色模式" = long repetitive work | Whole set of pages flips in one action | Instant flip, then audit detail | Big visual delta in one click |
| 4 | https://www.zcool.com.cn/article/ZMTQyNDQxNg==.html | Four themes from one token set | Same pages, different brand look | Grid of N pages changing together | Shows many pages, one source |
| 5 | https://colorfyi.com/blog/figma-color-variables/ (Figma variables demos) | Change `brand/primary` | Every instance updates instantly | Single edit → cascade | Cascade is the "wow" |
| 6 | https://www.figma.com/community/file/1270413229919215027 (Apply Variables demo video) | Playground file with many frames | Bind + switch mode | Fast toggles | Viewer counts frames that changed |

## Patterns to use
1. Open on the finished multi-page design (no generation); problem is stated by situation, not caption.
2. ONE control, ONE click; the reveal is that *every* page changes at the same instant.
3. Fixed camera wide enough to see all pages, so the cascade is self-evident; zoom only to the control if text is unreadable.
4. Hold the after-state ≥3 s so viewers can count pages.
5. Pure-screen: the story lives in the canvas (Home / Pricing / About + "linked in 3 boards"), no captions.
