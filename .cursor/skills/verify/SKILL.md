---
name: verify
description: Run Atelier's local merge gate — prompts append-only, typecheck, lint, vitest, Playwright. Use before merge, after feature work, or when asked to /verify. There is no GitHub Actions CI.
---

# /verify

Atelier's merge gate is **local**. There is **no GitHub Actions CI**. Do not wait for a checks tab, do not add `.github/workflows/*`, and do not treat a missing GitHub status as a blocker. After feature work and before merging to `main`, run this skill.

## When to use

- After implementing or fixing a feature, before the final push
- Before merging a PR to `main`
- When the user asks to `/verify` or "run the gate"

## Command

From the repo root (install deps with `npm install` if `node_modules` is missing):

```bash
npm run verify
```

That is the single gate. It calls `scripts/verify.sh` so this skill, the npm script, and the shell script stay in sync. Do not invent a parallel command list.

## Steps (fail-fast, in order)

1. **prompts/ append-only** — `git diff --name-status $(git merge-base origin/main HEAD) HEAD -- prompts/`. Only `A` (add) is allowed. Modify, delete, rename, or copy fails.
2. **`npm run typecheck`**
3. **`npm run lint`**
4. **`npm run test`** (Vitest)
5. **Playwright** — `npx playwright install chromium` if needed, then **`npm run test:e2e`**

Media recording (`e2e/dc-demo-video.spec.ts`) is skipped unless `RECORD_MEDIA=1`. The gate must not record GIFs or videos.

## Pass / fail

- **Pass:** exit code 0 and the line `verify: all steps passed`.
- **Fail:** the first failing step exits non-zero. Fix that step, then re-run the **full** `npm run verify`. Do not skip a step or comment it out to get a green gate.

Report which steps passed and which failed. Merge only after a full green run on the branch being merged.
