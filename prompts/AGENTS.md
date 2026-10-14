# prompts/ — APPEND-ONLY reference archive

> **RULE: Files in `prompts/` must never be edited, renamed, or deleted. You may only ADD new files.**
> Applies to every human and AI agent (Cursor, Claude Code, Codex, etc.). CI (`.github/workflows/prompts-append-only.yml`) fails any PR/push that modifies or deletes an existing file here.
> If a source publishes a newer version, add it as a NEW file (e.g. `claude-design.2026-11-01.md`) and add a row to the table below — do not overwrite the old one.

## What this is

Verbatim copies of **Claude Design** (claude.ai/design, Anthropic, codename "omelette") system prompts, skills and tool schemas, as captured and published by the community. Kept here as a reference for future Atelier development (Tweaks, dc.html Design Components, canvas mode, export, etc.).

- These texts are **Anthropic's**, not ours. They were copied unmodified from the public sources below. Atelier's own code is original and does not ship these prompts at runtime.
- Copied on 2026-10-14 (UTC+8) with `curl` from the raw URLs; see `claude-design/SOURCES-INDEX.zh-CN.md` for status checks and a version comparison.

## Sources

| Local path (`prompts/claude-design/…`) | Copied from | Author / date | Notes |
|---|---|---|---|
| `asgeirtj/claude-design.md`, `asgeirtj/skills/*.md` | https://github.com/asgeirtj/system_prompts_leaks/tree/main/Anthropic/claude-design | asgeirtj, latest commit 2026-10-07 | Current version: full system prompt + 62 tool schemas, dc.html, canvas mode, 21 skills |
| `asgeirtj/design-sync-SKILL.md`, `asgeirtj/artifact-design-SKILL.md` | https://github.com/asgeirtj/system_prompts_leaks/tree/main/Anthropic/claude-code/skills | asgeirtj | Claude Code side `/design-sync` and artifact-design skills |
| `cl4r1t4s-Claude-Design-Sys-Prompt.txt` | https://github.com/elder-plinius/CL4R1T4S/blob/main/ANTHROPIC/Claude-Design-Sys-Prompt.txt | elder-plinius, 2026-04-17 | v1 launch prompt (EDITMODE Tweaks protocol) |
| `mcrowe-gist.md` | https://gist.github.com/mcrowe/9da081f52e0740886d39e730852dba49 | mcrowe, 2026-04-18 | v1 prompt |
| `piebald/*.md` | https://github.com/Piebald-AI/claude-code-system-prompts | Piebald-AI | Claude Code ClaudeDesign / DesignSync tool descriptions and design-canvas reminders |
| `dsx/mcp-tools.json`, `dsx/reverse-engineering.html` | https://github.com/somework/dsx | somework, 2026-07-27 | 23 Claude Design MCP tool schemas + RE notes |
| `open-claude-design/block-1.txt` | https://github.com/imsai-sh/open-claude-design | imsai-sh, 2026-05 | Derivative rewrite of v1 (not an original capture) |
| `trystan/*` | https://github.com/Trystan-SA/claude-design-system-prompt | Trystan-SA, 2026-04/07 | **Author says it is recreated, not the real prompt** |
| `claude-design/SOURCES-INDEX.zh-CN.md` | our own index (2026-10-14) | — | Source list, HTTP checks, version lineage |

## How to use

Read-only reference. Quote or paraphrase when designing Atelier features; implement in our own words/code.
