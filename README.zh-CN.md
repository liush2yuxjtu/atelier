# Atelier

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![BYOK](https://img.shields.io/badge/BYOK-Anthropic%20%7C%20OpenAI%20%7C%20OpenRouter-green)](#快速开始)

**开源 Claude Design / Claude Artifacts 替代方案** — 左侧对话，右侧无限平移/缩放多画板。生成 HTML、React、SVG、Markdown、Mermaid；预先生成可实时调节的 **Tweaks**；钉选评论；导出 HTML / ZIP / PDF / PNG / PPTX。MIT 许可，可自托管的 Next.js 应用，支持自带密钥（BYOK）。

[English](README.md) · [简体中文](README.zh-CN.md) · [对比](docs/COMPARISON.md) · [架构](docs/ARCHITECTURE.md) · [Design Components](docs/DC-PROTOCOL.md)

![三次色板、Compare、Approved — Tweaks 是探索，不是抠像素](docs/media/tweaks-v4.gif)

Atelier 是独立产品。它借鉴了 Claude Artifacts / Claude Design 的**交互形态**（对话 + 实时画布 + 隔离 iframe + Tweaks），但**不复制** Anthropic 的提示词、商标或源码。

## 为什么选 Atelier

| 需求 | 你会得到 |
| --- | --- |
| 类似 Claude Design 的工作室、无锁定 | MIT、可自托管，演示无需 Anthropic 账号 |
| 多页评审 | 项目级**联动 Tweaks** — 改一次 Look 或移动 Pricing，Home / Pricing / About 一起变 |
| 真实 HTML 画板 | 沙箱不透明源 iframe、流式 `<artboard>`、编辑 / 检查 / 评论 |
| 可复用设计件 | 原创 `.dc.html` Design Components 协议（props、插槽、`<dc-import>`） |
| 自己的模型 | BYOK：Anthropic、OpenAI、OpenRouter 或任意 OpenAI 兼容接口 |

完整对比：[docs/COMPARISON.md](docs/COMPARISON.md)。

## 功能

- **工作室布局** — 对话、无限画布、Tweaks / 检查 / 评论 / 文件栏
- **多画板** — 新增、复制、拖拽、排列；布局写入项目
- **不透明源 iframe** — `sandbox="allow-scripts"` 且无 `allow-same-origin`；带 nonce 的 postMessage 协议
- **流式渲染** — 模型还在写时，`<artboard>` 就会出现在画布上
- **自检** — iframe 报错后自动发起一轮修复
- **直接操作** — 编辑 / 检查 / 评论模式
- **Tweaks** — 设计的关键价值，也是相对 Claude Design 的差异：项目级主题 + 共享章节绑在**每一页**上。代理（或「生成旋钮」）预先准备色板、字号、密度，以及结构旋钮（章节顺序、布局变体、显隐）。Home 上改 Moss 或上移 Pricing，Pricing / About 一起变（`linked in N boards`）。单页可 Unlink，也可 **Push to all**。**Present** 锁定机位，Compare A|B，撤销，**Approved**。不必再生成一轮。
- **Design Components** — `.dc.html` 类型化 props、插槽、`<dc-import>` 组合、循环检测、组件库拖到画布、`dc-write` / `dc-set-props`、导出时内联。协议：[docs/DC-PROTOCOL.md](docs/DC-PROTOCOL.md)
- **钉选评论** — 进入下一轮上下文，模型按 id 标记已处理
- **项目文件与历史** — 每次生成后快照
- **可选设计体系提取** — 图片色板、URL CSS、GitHub 仓库
- **画板内 AI** — `window.artifact.complete(prompt)` 经宿主转发
- **导出** — HTML、ZIP（含 `canvas.json`）、PDF（页面尺寸取自画板）、PNG、PPTX、分享链接
- **自带密钥** — Anthropic / OpenAI / OpenRouter / 任意 OpenAI 兼容接口

## 截图

| 画布 | 编辑模式 | Tweaks | 导出 |
| --- | --- | --- | --- |
| ![多画板无限画布](docs/screenshots/canvas-multi-artboard.png) | ![画板内编辑模式](docs/screenshots/edit-mode.png) | ![联动主题 Tweaks 面板](docs/screenshots/tweak-panel.png) | ![导出对话框 HTML ZIP PDF PNG PPTX](docs/screenshots/export-dialog.png) |

| 组件库 | 组合 DC | 实例属性 |
| --- | --- | --- |
| ![Design Components 组件库](docs/screenshots/dc-library-panel.png) | ![画布上组合的设计组件](docs/screenshots/dc-composed.png) | ![实例属性调节界面](docs/screenshots/dc-props-tweak.png) |

Tweaks 用户故事 8 秒 GIF：[docs/media/tweaks-v4.gif](docs/media/tweaks-v4.gif)；完整录像 [docs/media/tweaks-v4.mp4](docs/media/tweaks-v4.mp4)；v3：[docs/media/tweaks-v3.gif](docs/media/tweaks-v3.gif)；v2：[docs/media/tweaks-v2.gif](docs/media/tweaks-v2.gif)；v1：[docs/media/tweaks-v1.gif](docs/media/tweaks-v1.gif)；故事：[docs/media/story/story-tweaks.md](docs/media/story/story-tweaks.md)。

## 快速开始

```bash
npm install
npm run dev          # http://127.0.0.1:43173
```

在首页打开 **Northbound** 演示。没有密钥时使用本地草稿模型。真实模型：点齿轮粘贴 API key，或配置环境变量。

```bash
ANTHROPIC_API_KEY=sk-ant-...
# 或 OPENAI_API_KEY=...
# 或 OPENROUTER_API_KEY=...
```

```bash
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

## 部署

```bash
npm run build
npm start -- --port 43173
```

也可导入 Vercel。分享链接写入 `.data/shares/`，生产环境请挂载持久盘。

## 文档

| 文档 | 内容 |
| --- | --- |
| [docs/COMPARISON.md](docs/COMPARISON.md) | Atelier 与 Claude Artifacts / Claude Design 对比 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 代理循环、画布、iframe、服务端代理 |
| [docs/DC-PROTOCOL.md](docs/DC-PROTOCOL.md) | Design Components（`.dc.html`）协议 |

## 引用

学术或写作中使用 Atelier 时，请参见 [CITATION.cff](CITATION.cff)。

## 许可

[MIT](LICENSE) — Copyright (c) 2026 Atelier contributors
