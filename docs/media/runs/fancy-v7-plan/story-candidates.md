# Atelier Tweaks v7: story plan (no recording yet)

Date: 2026-10-15 (Asia/Shanghai). Branch: `feat/fancy-tweaks-baseline`. Nothing was recorded for this plan.

## 1. What the skill actually says about a story (exact quotes)

Sources are the files in `record-production-feature`: `references/story-research.md` (SR) and `SKILL.md` §3.

| # | Rule (verbatim) | Source |
|---|---|---|
| R1 | "Goal: the recording reads like a real creator getting a surprising, impressive result with the new feature, **not a button tour**." | SR intro |
| R2 | "Search Douyin (抖音) and Xiaohongshu (小红书) … Collect 5 to 10 high-engagement examples. For each, note the URL, likes or saves as shown, the hook in the first 1 to 3 seconds, the before and after contrast, the pacing … and why it feels impressive." | SR §1 |
| R3 | "Write `story/story.md` with exactly three **one-line** user stories … Each line follows the template 【谁】在【场景】用【新功能】完成了【什么】 and uses real UI words." | SR §2 |
| R4 | "Mark exactly one option **推荐** with a one-sentence reason (fits the feature, recordable in 8 s, **matches a researched Douyin or Xiaohongshu pattern**)." | SR §2 |
| R5 | "add the **beginning (problem or raw footage within the first second)**, middle (the feature does the hard part), **end (a visible, surprising payoff)**" | SR §2 |
| R6 | "Convert the chosen option into the **3 to 6 beats** … The final beat must show the payoff." | SR §3 |
| R7 | "8-second GIF window around the payoff: about **1 s of the before state**, about 4 s of the key action, and about 3 s of the after state or reveal." | SR §3 |
| R8 | "Pure-screen defaults still apply. **The story lives in what is being made**, not in added captions or music, unless the user asks for them." | SR §3 |
| R9 | "完整 MP4 和 8 秒 GIF 都要呈现这个场景里的**真实成就感**，而不只是功能走查。" | SKILL §3 |
| R10 | "**第一秒交代问题或亮出前后对比的钩子**，快速进入关键操作，把结果揭晓放在 GIF 区间内；仍保持 pure-screen 默认，不加未要求的字幕或音乐。" | SKILL §3 |
| R11 | "讲解字幕仅按用户要求添加。" Cinematography: "no explanatory captions, release badges, decorative callouts, narration, music, or transitions." | SKILL §3, cinematography.md |

The skill never uses the words protagonist, stakes, conflict or hook-and-payoff as a framework. What it does define: a **who** (【谁】), a **scene**, a **problem visible in the first second**, the **feature doing the hard part**, and a **visible, surprising payoff**, all told by what is on screen. The 【谁】 should be a specific creator. The worked example used a named character, "Maya", with a concrete situation ("Out of the busy room").

**Captions and title cards:** these are NOT allowed by default (R8, R10, R11). The user would have to ask for them explicitly. So the problem has to be shown using the product's own content, for example a real Atelier **comment pin** on the canvas (`board.comments`, the Comment tool), or the mismatched boards themselves.

## 2. Which rules v6 broke

| Rule | What v6 `story.md` / the take did |
|---|---|
| R1, R9 (not a button tour) | v6 was a tour of five controls in a row: Speed → Glow → Look → Stage layout → Unlink → Approved. Option B even lists them: "Speed / Glow / Look / Stage layout / Unlink". No problem gets solved; the controls are just operated. |
| R5, R10 (problem in the first second) | v6 opens on three healthy Ember boards with nothing wrong. "Client review is live" is only claimed in the md; nothing on screen shows that a client wants anything. |
| R8 (story lives in what is made) | The client's request ("more energy, but keep About warm") exists only in story.md. The viewer never sees it, so the unlink looks arbitrary. |
| R5 (surprising payoff) | The payoff is the designer clicking her own **Approved** button. Nothing surprising happens, no one else approves, and nothing was saved. |
| R7 (1 s before / 4 s action / 3 s after) | The GIF's "before" (13.6 s) is already all-Aurora, so it shows no pain. The "after" is a chip and a badge, not a contrast. |
| R6 (3 to 6 beats) | Seven-plus beats (speed, glow, palette, layout, select, unlink, Ember, approve) squeezed into 25 s. |
| R3 (one line, template) | C ran several clauses long, with two requests and five actions. A was not in the 【谁】在【场景】用【新功能】完成了【什么】 shape. |
| R4 (推荐 reason from research) | The reason was "用户指定的故事线", not a pattern found in Douyin/XHS research. |
| R2 (research) | No Douyin or Xiaohongshu examples, no likes or saves. Reference #1 had no URL ("analysed by the user team"). The Bilibili link was never opened. |
| Stakes (implied by R5 "problem") | There is no cost of failure: no deadline, no hand-fixing, nothing to lose. |

## 3. Research (pages actually opened 2026-10-15)

**Gap stated honestly:** Douyin (`douyin.com/search/设计师 甲方 改稿`) returned an empty shell, and Xiaohongshu (`xiaohongshu.com/search_result?keyword=客户改稿 设计师`) returned only its footer. Both need login, so **no engagement counts could be read and R2 is still unmet.** A user-logged-in browser session on the box would be needed to finish it (read-only). Bilibili BV12tQvBrERB returned 412 and was not used.

Real pain sources that were opened:

| # | URL | What it says (real pain) | Story use |
|---|---|---|---|
| 1 | https://cfh.notalwaysright.com/client-ive-decided-to-change-the-colour-scheme/ | "Client: I've decided to change the colour scheme on my website – can you make it all pink? Me: OK (spends two hours changing colour scheme)" | Before: a whole-site recolour = hours by hand |
| 2 | https://cfh.notalwaysright.com/notes-from-first-revision-client-the-colour-is/ | "The colour is too dark. Can you make it brighter?" → next round "We asked you to change the colour, not just make it brighter." | Vague colour feedback, repeated rounds |
| 3 | https://www.ama.org/marketing-news/make-it-pop-doesnt-mean-anything-how-designers-can-communicate-better-with-marketers/ | Asked a room of designers who had heard "make it pop": "Nearly everyone in the room raised their hand." It "means: make something stand out." | "Make it pop" is a universal request |
| 4 | https://acagroup.be/en/blog/5-steps-to-follow-vague-feedback-as-a-designer | "'The design is nice, but can you make it pop?' Goodbye awesome day, hello misery." Fix: "show them a couple of color schemes so they can actively help choosing." | Show options live instead of asking |
| 5 | https://intensepath.com/blog/what-should-freeze-before-a-website-build | "a late palette change means re-testing every state"; "Later is launch week, and launch week is the worst possible moment". | Stakes: a late colour change hits every page |
| 6 | https://paletterx.com/blog/when-clients-want-ugly-colors | "Show, Do Not Tell … Apply their requested color" to the actual site content. | Payoff = client sees it on their real pages |
| 7 | https://pm.xyui.cn/design/news/detail-1674.html | 甲方 says "再亮点" but can't say how much; "等全案做完才说'调性不对'，改动成本已经升高"; vague requests mean 返工 2–3 rounds, half a day to a day each. | Chinese-market version of the same pain |

Patterns to borrow: **one edit, every page changes** (改一处全部变); **show the request applied to the client's real pages**; and the "before" has to show the **manual/mismatched** state, not a healthy one.

## 4. Story candidates (template per R3)

All three use only on-screen product content. The client's request is a real Atelier **comment pin** on the Home board (product UI, not a caption). The "before" is the visible mismatch between boards.

### A (GBA 搞笑): "Make it pop" boss fight
- One line: 【被"make it pop"折磨的设计师】在【咖啡品牌三页官网稿】用【Tweaks 跨画板联动】完成了【一拧旋钮三页同时"开大"，客户评论从"make it pop"变成"YES"】
- Before (0–1 s): a comment pin on Home reads "Can you make it pop? (all pages)". Three calm boards.
- Turning point: Glow and Speed are pushed to max on Home's dock, and all three boards blow up together. One dial back to a tasteful level. Wide shot shows all three in sync.
- Payoff: the client's reply pin, "YES. Ship it", appears in the thread. This needs a second scripted comment.
- Weakness: comic tone and a vague request; a second comment would be a staged reply.

### B (直给): one push fixes three pages (推荐)
- One line: 【独立设计师 Lena】在【离客户评审还有 10 分钟的 Northbound 三页官网稿】用【Tweaks 的 Push to all】完成了【新品牌色一次同步到 Home、Pricing、About】
- Protagonist and stakes: Lena owes Northbound three pages. The client pinned "New brand is Aurora. Update ALL pages before our 3pm call." Without linkage she recolours three pages by hand (source #1: "spends two hours") or moves the call.
- Before (visible pain, first second): Home is already Aurora (she started by hand). **Pricing and About are still Ember**, the mismatch is obvious side by side, and the comment pin sits on Home.
- Turning point: on Home, Look → **Push to all**. Pricing and About flip to Aurora with the hero still animating; nothing reloads.
- Payoff: all three boards match, the chip reads **linked in 3 boards**, and she resolves the comment pin, which disappears or turns resolved. The problem visibly goes away.
- Why 推荐: one big before/after colour contrast across three pages fits in 8 s. It matches the opened pattern "改一处，全部变" plus "show it on their real pages" (sources 5–6). A pending Douyin/XHS check is needed to fully meet R4.

### C (情感): keep the founder's page warm
- One line: 【给小烘焙店做官网的 Lena】在【客户换新品牌色的评审前】用【Tweaks 联动 + Unlink】完成了【全站换成新色，只把店主写给奶奶的 About 页留在原来的暖色】
- Before: a pin on About reads "New colours everywhere… but please keep my About page warm, it's my grandma's story." All boards are Ember.
- Turning point: Unlink About first, then Look → Aurora. Home and Pricing change; About stays Ember; the chip reads **linked in 2 boards**.
- Payoff: wide shot with two night-blue pages next to one warm page, and the pin resolved.
- Weakness: the emotion lives in the pin text, which is small at 520 px. Two operations (unlink and look) make the action longer.

## 5. Shot map for 推荐 B (pure-screen, no captions)

Full MP4 (~20 s, 4 beats):
1. 0–3 s, wide: three boards fill the frame. Home is Aurora; Pricing and About are Ember. Slow push 1.4× to the comment pin on Home ("…ALL pages before our 3pm call"), hold 1.5 s so it can be read.
2. 3–6 s: pull to 1× (mismatch again), then the pointer travels to Home's Look row.
3. 6–9 s: push 2.2× onto **Push to all**, click at ~7 s, and pull out to 1× within 0.6 s so the flip on Pricing and About happens in the wide shot.
4. 9–20 s: wide hold with three matching Aurora boards and heroes animating. Push 2.0× onto **linked in 3 boards**, then onto the comment pin → **Resolve**. Final wide hold of 3 s or more.

8 s GIF (R7 1/4/3): from 5.8 s to 13.8 s.
- 0–1 s: wide mismatch (the before).
- 1–5 s: push in on Push to all, click, pull out as the boards flip.
- 5–8 s: wide hold with all three matching, the linked chip visible.

The comment pin is read in the MP4. In the GIF the mismatch alone carries the problem.

## 6. Things to confirm in discovery before recording
- `Push to all` sits in TweakControls (edit mode). Check it is reachable in Present, or record the story in the canvas edit view.
- Comment pins render on the canvas (`board.comments`) and can be resolved. Check the pin text is readable at 1× and 1.4×.
- Starting state: Home look overridden to Aurora while the others stay linked on Ember. This needs a seed state.
- Linked chip wording when all three are linked ("linked in 3 boards").
- Douyin/XHS research (R2) needs a logged-in read-only session to finish.
