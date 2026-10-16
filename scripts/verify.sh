#!/usr/bin/env bash
# Local merge gate. There is no GitHub Actions CI — this script is the gate.
# Keep in sync with package.json "verify" and .cursor/skills/verify/SKILL.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

step() {
  echo
  echo "==> $*"
}

fail() {
  echo "verify: FAIL — $*" >&2
  exit 1
}

# --- a) prompts/ append-only vs merge-base with origin/main ---
step "prompts/ append-only (merge-base with origin/main)"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  fail "not a git repository"
fi

git fetch origin main --quiet 2>/dev/null || true

if git rev-parse --verify origin/main >/dev/null 2>&1; then
  BASE="$(git merge-base origin/main HEAD)"
  if [ -z "$BASE" ] || ! git cat-file -e "$BASE" 2>/dev/null; then
    echo "no usable merge-base, skip"
  else
    # Allow only adds (status A). Modify / delete / rename / copy are rejected.
    BAD="$(git diff --name-status "$BASE" HEAD -- prompts/ | grep -Ev '^A' || true)"
    if [ -n "$BAD" ]; then
      echo "prompts/ is append-only. Not allowed:"
      echo "$BAD"
      exit 1
    fi
    echo "ok (merge-base ${BASE:0:12})"
  fi
else
  echo "origin/main missing, skip"
fi

# --- b) typecheck ---
step "typecheck"
if [ ! -f next-env.d.ts ]; then
  printf '%s\n' '/// <reference types="next" />' '/// <reference types="next/image-types/global" />' > next-env.d.ts
fi
npm run typecheck

# --- c) lint ---
step "lint"
npm run lint

# --- d) unit tests ---
step "test (vitest)"
npm run test

# --- e) e2e ---
step "test:e2e (playwright)"
npx playwright install chromium
npm run test:e2e

echo
echo "verify: all steps passed"
