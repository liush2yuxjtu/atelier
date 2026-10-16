# Smoke — AI “Add more tweaks” (Cursor Auto backend)

Date: 2026-10-16 (Asia/Taipei). Branch `feat/fancy-tweaks-baseline` @ `ba0e167`.

## Backend: Cursor Auto via `cursor-agent`

`/api/add-tweaks` shells out to this account's Cursor subscription:

```
cursor-agent -p --model auto --output-format json --mode ask --trust \
  --workspace <empty tmp dir> "<ADD_TWEAKS_SYSTEM + topic + Home HTML>"
```

- Read-only (`--mode ask`, empty temp workspace); the route reads the `{"type":"result"}` line and parses the JSON knob schema, then merges (existing knobs kept).
- Picked when `ATELIER_LLM_PROVIDER=cursor`, or by default if `cursor-agent` is on the server (`CURSOR_AGENT_BIN`, `~/.local/bin`, Homebrew, PATH). A client-supplied BYOK key bypasses it.
- `ATELIER_CURSOR_MODEL` (default `auto`), `ATELIER_CURSOR_TIMEOUT_MS` (default 300000).
- Server host: **Mac mini** (`cursor-agent 2026.10.01`, logged in as the account owner). The box has no `cursor-agent`.

## Live UI smoke (Playwright, real Cursor Auto, demo Home)

Flow: `/studio/demo` → Home → Tweaks → type the prompt into **Add more tweaks for…** → **Add tweaks** → wait for `Added N tweaks` → click every new knob.
Toggles checked via the iframe `html[data-*]` attr, the host `data-tweak-*` attr, and before/after artboard screenshots. `/api/*` requests counted during toggling.

| # | Prompt | Latency | Knobs returned (label · type) | Toggle → artboard changed | API calls while toggling |
|---|--------|---------|-------------------------------|---------------------------|--------------------------|
| 1 | `the pricing section` | 95.0 s | Plan voice · select, Price layout · select, Show camp tier · boolean, Highlight · select (CSS + 4 bindings) | 4/4 (copy changed for Plan voice + camp tier; layout changed for rows / highlight) | **0** |
| 2 | `hero social proof and CTA emphasis` | 83.8 s | Proof line · select, Proof place · select, CTA emphasis · select, Show avatars · boolean (CSS + 2 bindings) | 4/4 (copy changed for Proof line + CTA banner) | **0** |
| 3 | `footer trust badges` | 71.5 s | Trust badges · boolean, Badge line · select, Badge layout · select, Badge tone · select (CSS + 1 binding) | 4/4 (copy changed for Badge line) | **0** |

The first pricing attempt hit the old 180 s timeout on a cold `cursor-agent` start (502 `cursor-agent timed out`). The timeout went up to 300 s and the re-run above passed. Raw data: `smoke-cursor-auto-runs.json`, `smoke-cursor-auto-pricing-rerun.json`. Screenshot after run 1: `smoke-pricing.png`. Both are non-deterministic because the model generates new keys each run.

## Best demo prompt

**`the pricing section`**. The knobs make the biggest visible change on Home. *Price layout → Rows* turns the cadence cards into a row list, *Show camp tier* removes a tier, and *Plan voice* rewrites the copy. Use *hero social proof and CTA emphasis* as the second beat (CTA → Banner is large and readable).

## Notes / blockers

- Latency is 70–95 s per generation, which is long for a GIF. Cut the wait or hold on the "Adding…" state.
- Generation must run where `cursor-agent` is installed and logged in (the Mac mini). Running it on the box would need `cursor-agent` installed there plus `cursor-agent login` by the user.

---

## Earlier attempt (HTTP keys, superseded)


Date: 2026-10-16 (Asia/Taipei). Branch: `feat/fancy-tweaks-baseline`.
Surface: Tweaks panel (`tweaks-ai-input` / `tweaks-ai-submit`) + chat alias `/add more tweaks for/i`.
API: `POST /api/add-tweaks` (real model only; `mock: true` is tests-only).

## Environment

| Item | Value |
|------|--------|
| Box app | `npm run dev` @ `127.0.0.1:43173` |
| Server key candidates | `DASHSCOPE_API_KEY` (present), `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` (absent on box) |
| DashScope | Compatible mode `https://dashscope.aliyuncs.com/compatible-mode/v1`; only **`qwen-turbo`** accepted by this key; other models → `access_denied` |
| Mac mini | Connected (`501d9c2c-…`). `ANTHROPIC_API_KEY` is a **Kimi** coding gateway key (`sk-kimi-…` → `api.kimi.com`) without Kimi Code access; official Anthropic rejects it |
| Windows fatfishking | Not used for LLM smoke |

## Live AI attempts (real prompts × 3)

Target artboard: demo **Home** (`LANDING` HTML, existing keys: look/accent/paper/ink/mood/spacing/ctaWeight/socialProof).

| Run | Prompt | Route | Model | Latency | Knobs returned | Notes |
|-----|--------|-------|-------|---------|----------------|-------|
| 1 | `the pricing section` | `/api/add-tweaks` | qwen-turbo (via settings) | ~50–180s (retries) | **none** | Provider: `limit_requests` / rate limit |
| 2 | `hero social proof and CTA emphasis` | same | qwen-turbo | same | **none** | same |
| 3 | `footer trust badges` | same | qwen-turbo | same | **none** | same |

Earlier probes:

- `qwen-plus` / flash / deepseek / glm / kimi on this key → **`Access denied by API-Key restrictions`**
- Direct DashScope `qwen-turbo` briefly worked earlier in the session, then hard rate-limited for >30 minutes (still blocked at last probe)
- Mac mini Kimi gateway → `permission_error` (no Kimi Code subscription)

**Blocker:** no usable, unrestricted chat-completions quota on the box or Mac mini at smoke time. Feature code path is wired for BYOK + `DASHSCOPE_API_KEY` / `OPENAI_*` / `ANTHROPIC_API_KEY`.

## Merge / toggle proof (same parsers as production)

With live tokens blocked, we still exercised `parseAddTweaksResponse` → `mergeAddTweaks` on Home HTML for the three topics (payload shape identical to a successful model response). Existing `mood` was preserved; new knobs merged; first knob toggled.

| Topic | Added keys | Toggle check | Mood preserved |
|-------|------------|--------------|----------------|
| the pricing section | `sectionFocus` (+ CSS/bindings) | select value flipped | yes |
| hero social proof and CTA emphasis | `showFooter`, `heroVoice` | `showFooter` true→false | yes |
| footer trust badges | `extraAccent` | boolean false→true | yes |

Automated: `tests/add-tweaks.test.ts` (5) + e2e `AI add more tweaks (mocked API)` (Playwright route mock).

## UI flow (for Feature Recorder once a key works)

1. Open `/` → **Open demo** → `/studio/demo`
2. Select **Home** → Tweaks tab
3. In **Add more tweaks**, type e.g. `the pricing section` → **Add tweaks**
4. Wait for status `Added N tweaks`; new controls highlight briefly
5. Flip chips/toggles — artboard updates with **no** further `/api/chat` tokens
6. Chat alias: `add more tweaks for the hero copy` routes to the same store action

## Best prompts for a future demo reel

When a live key is available, prioritize (strongest visible before/after on Home):

1. **`the pricing section`** — section focus / plan strip emphasis (large structural change on the cadence cards)
2. **`hero social proof and CTA emphasis`** — voice + show/hide footer / proof
3. **`footer trust badges`** — smaller; good as a third beat only

## Recommended next step

1. Set a working `OPENAI_API_KEY` or unrestricted DashScope/Anthropic key on the box (or Mac mini) and re-run this smoke.
2. Default DashScope model in code is **`qwen-turbo`** when only `DASHSCOPE_API_KEY` is set.
3. Record Feature media after one successful live run confirms labels are OCR-legible.
