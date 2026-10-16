# Smoke — AI “Add more tweaks”

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
