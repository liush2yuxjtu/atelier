# Claude Design（claude.ai/design，代号 omelette）社区提取提示词索引

调查日期：2026-10-14（UTC+8）。本目录里所有文件都是用 curl 从 raw 地址抓取的原文，URL 状态码都实测过。

## 一、来源清单

| # | 来源 | 作者/日期 | 内容 | 大小 | 提取方式 | 校验 |
|---|---|---|---|---|---|---|
| 1 | https://github.com/asgeirtj/system_prompts_leaks/blob/main/Anthropic/claude-design/claude-design.md （本地 `asgeirtj/claude-design.md`） | asgeirtj；最新提交 2026-10-07（此前：06-26 “June 26 capture”，07-23 加入 skills，08-19 拆目录，08-21） | **完整系统提示词 + 62 个工具 JSON schema**；另有 21 个 skill（`asgeirtj/skills/`）和 starter-components（deck-stage.js、tweaks-panel.jsx 等，未下载） | 143,284 B | 抓包抓到的实时请求（commit 写的是 “capture”） | 200 ✅。旧路径 `Anthropic/claude-design.md` 已 **404**（已迁到子目录） |
| 2 | https://github.com/elder-plinius/CL4R1T4S/blob/main/ANTHROPIC/Claude-Design-Sys-Prompt.txt （本地 `cl4r1t4s-…txt`） | elder-plinius (Pliny)；2026-04-17 | 首发版（v1）完整提示词（含 done/fork_verifier_agent/questions_v2、Send to Canva、gen_pptx） | 73,266 B | 抓包 | 200 ✅ |
| 3 | https://gist.github.com/mcrowe/9da081f52e0740886d39e730852dba49 （`mcrowe-gist.md`），HN https://news.ycombinator.com/item?id=47820425 | mcrowe；2026-04-18 | v1 发布时的提示词（作者说“通过 API 请求暴露”） | 29,516 B | 网络请求 | 200 ✅ |
| 4 | https://github.com/Piebald-AI/claude-code-system-prompts （`piebald/`） | Piebald-AI；持续跟进，ccVersion 2.1.271 | **Claude Code 侧**：`tool-description-claudedesign.md`（ClaudeDesign 工具描述）、`tool-description-designsync.md`、3 个 design-canvas / appifactrepl system-reminder、artifact-design 相关 2 篇 | 0.9–5.9 KB | 从 Claude Code 二进制提取 | 200 ✅。**`skill-design.md` 不存在（404）** |
| 5 | asgeirtj `Anthropic/claude-code/skills/design-sync/SKILL.md`、`artifact-design/SKILL.md` | 同 #1 | Claude Code 的 `/design-sync` skill 全文（Storybook 与非 Storybook 两个子 skill 未下载）+ artifact-design skill | 28 KB / 34 KB | 来自 CC 包 | ✅ |
| 6 | https://github.com/somework/dsx `reference/mcp-tools.json`、`docs/reverse-engineering-claude-design.html` | somework；2026-07-27 | **Claude Design MCP 工具 23 个**的 schema（list_projects、finalize_plan、write_files、render_preview、get_claude_design_prompt、read_design_skill…）+ 逆向记录 | 38,887 B | 实际探测非官方 MCP 协议 | ✅ |
| 7 | https://github.com/Trystan-SA/claude-design-system-prompt （`trystan/`） | Trystan-SA；2026-04-27 首发，07-06 更新；Reddit r/ClaudeCode、r/codex；HN 48792399（2026-07-05，122 分） | “逆向”提示词 + 14 个自造 skill | 35,565 B | **作者本人承认“not the real system prompt… recreated”**；HN 普遍质疑是 LLM 生成的 | ✅可访问，但 **非真实提取** |
| 8 | https://github.com/imsai-sh/open-claude-design `apps/web/src/features/chat/system-prompt/block-1.txt` | imsai-sh；2026-05 | 开源复刻版用的 block-1：基于 v1 提示词改写，含 EDITMODE/Tweaks 协议 + 8 个复刻 skill | 26,029 B | 改写 v1 | ✅（衍生品） |
| 9 | Reddit r/ClaudeDesign “Claude Design v2 System Prompt” https://www.reddit.com/r/ClaudeDesign/comments/1ua8ssr/ | u/frubberism；2026-06-19 | 指向 #1 | – | – | ✅ |
| 10 | @dotey（宝玉）https://x.com/dotey/status/2108559440571933172 （镜像 twiscan） | 2026-10-09 | 说 Claude Design 正在并入 Claude Artifacts（独立站 **2026-12-14 关闭**），独立站时期可以抓包看到 system prompt 和前端源码，合并后看不到了 | – | – | 镜像可见；x.com 未直接抓取 |
| 11 | 中文：姚利锋 https://yaolifeng.com/blog/claude_design_system_prompts_leaked ；腾讯云 https://cloud.tencent.com/developer/article/2659934 、/2667351 ；Jane-xiaoer/claude-design-principles（提炼成 skill） | 2026-04 起 | 都是 #2 的翻译、拆解或提炼 | – | – | 200 ✅ |
| 12 | linux.do https://linux.do/t/topic/1991973 | 2026-04-18 | 只是使用讨论，没有提示词 | – | – | 只看了 TG 镜像 |

没有搜到：即刻 / V2EX / 公众号上独立的新提取，都是转载 #2。

## 二、对比结论

**版本谱系**：v1（2026-04：#2、#3）→ v2（2026-06：#1 June 26 capture）→ 最新（2026-10-07：#1 当前版）。#8 是 v1 的衍生品，#7 是重写的，不是提取。

- 行级重合度（去空行后按集合比较）：CL4R1T4S∩gist = 157 行；CL4R1T4S∩open-claude-design = 184 行（说明 #8 基于 v1）；asgeirtj 与 v1 只重合约 30 行（v2 大改）；Trystan 与其他任何一份只重合 **3 行**（佐证它是重写的）。
- **dc.html / Design Components**：只有 asgeirtj 最新版有（11 处）：`Name.dc.html`、`<dc-import>`、`dc_write / dc_html_str_replace / dc_js_str_replace / dc_set_props`。这是最新架构。
- **canvas / artboard**：asgeirtj 有 “canvas-mode artboards”，以及 `design_doc_mode` meta + Canvas skill（06-26 commit 说明：Canvas mode 取代了手工并排 frames）。v1 用的是 design-canvas 并排方案。
- **EDITMODE**：v1 系（CL4R1T4S 2 处、open-claude-design 3 处）有 `/*EDITMODE-BEGIN*/{…}/*EDITMODE-END*/` Tweaks 协议；asgeirtj 最新版里**已没有** EDITMODE 字样（改由 tweaks-panel 和 dc_set_props 实现，属推断）。
- **工具数量**：v1 用 done / fork_verifier_agent / questions_v2；06-26 版是 50→48；当前版 **62 个**（新增 dc_*、fig_*、local_*、github_*、snip、tool_search_tool_bm25、show_pdf_export_dialog、gen_pptx 等）。外部 MCP（dsx）有 23 个，跟 Piebald 的 ClaudeDesign 工具描述（list_projects→finalize_plan→write_files→render_preview、plan_token）一致。
- **omelette**：asgeirtj 里有 `omelette-owns-print` meta（PDF 导出逻辑），跟桌面端 `omeletteDesktopPdf` 桥、`data-om-raster`、`.om-*.tmp` 能对上。
- **导出**：asgeirtj 的 PDF 导出说的是“print-based，按设计自动设定页面尺寸”，跟桌面端 `printToPDF({preferCSSPageSize, pageSize: widthPx/96})` 一致。PPTX 走 `gen_pptx` 工具 + export-as-pptx-* skill；Canva 是 v1 skill 列表里的 “Send to Canva”。

**和桌面端本地 fallback（DESIGN-TRACE.md §7）对比**：
- Cowork 的 `claude_design` 段（“The `ClaudeDesign` tool creates and edits designs … live canvas”）和 html_artifacts 段（`window.cowork.callMcpTool/askClaude/runScheduledTask`）在所有社区来源里**都搜不到原文**。它们属于 Cowork 智能体的提示词，不是 Claude Design 产品内部的提示词，这部分目前只有我们自己的提取。
- 能对应上的是 Piebald 的 `tool-description-claudedesign.md`：同一个 `ClaudeDesign` 工具，是 Claude Code 侧的描述，要求先调 `get_claude_design_prompt` 加载实时规范。dsx 的 `get_claude_design_prompt` 和 `read_design_skill` 说明：产品内的系统提示词是服务端实时下发的。

## 三、最新/最可信排序
1. asgeirtj 当前版（2026-10-07，真实抓包，最新）
2. Piebald ClaudeDesign / DesignSync 工具描述 + dsx mcp-tools.json（2026-07~10，真实）
3. CL4R1T4S / mcrowe gist（v1，真实但已过时）
4. open-claude-design（衍生）、Trystan（重写，不可信）
