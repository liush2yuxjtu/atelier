# Atelier

**开源设计画布。** 左侧对话，右侧无限平移/缩放画板。生成 HTML、React、SVG、Markdown、Mermaid；现场调节颜色与圆角；在元素上钉评论；导出 HTML / ZIP / PDF / PNG / PPTX。

[English](README.md) · [简体中文](README.zh-CN.md)

![画布上的多张画板](docs/screenshots/canvas-multi-artboard.png)

Atelier 是独立的 MIT 项目。它借鉴了 Claude Artifacts / Claude Design 的**交互形态**（对话 + 实时画布 + 隔离 iframe + Tweaks），但**不复制** Anthropic 的提示词、商标或源码。对比见 [docs/COMPARISON.md](docs/COMPARISON.md)。

## 功能

- **工作室布局** — 对话、无限画布、Tweaks / 检查 / 评论 / 文件栏
- **多画板** — 新增、复制、拖拽、排列；布局写入项目
- **不透明源 iframe** — `sandbox="allow-scripts"` 且无 `allow-same-origin`；带 nonce 的 postMessage 协议
- **流式渲染** — 模型还在写时，`<artboard>` 就会出现在画布上
- **自检** — iframe 报错后自动发起一轮修复
- **直接操作** — 编辑 / 检查 / 评论模式
- **Tweaks** — 从声明的 JSON 或 Design Component prop schema 生成滑杆与色板，现场生效，不必再调模型
- **Design Components** — `.dc.html` 类型化 props、插槽、`<dc-import>` 组合、循环检测、组件库拖到画布、`dc-write` / `dc-set-props`、导出时内联。协议：[docs/DC-PROTOCOL.md](docs/DC-PROTOCOL.md)。演示录像：[docs/media/dc-demo.webm](docs/media/dc-demo.webm)
- **钉选评论** — 进入下一轮上下文，模型按 id 标记已处理
- **项目文件与历史** — 每次生成后快照
- **可选设计体系提取** — 图片色板、URL CSS、GitHub 仓库
- **画板内 AI** — `window.artifact.complete(prompt)` 经宿主转发
- **导出** — HTML、ZIP（含 `canvas.json`）、PDF（页面尺寸取自画板）、PNG、PPTX、分享链接
- **自带密钥** — Anthropic / OpenAI / OpenRouter / 任意 OpenAI 兼容接口

## 快速开始

```bash
npm install
npm run dev          # http://127.0.0.1:43173
```

在首页打开 **Northbound** 演示。没有密钥时使用本地草稿模型。真实模型：点齿轮粘贴 API key，或配置环境变量。

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

## 许可

[MIT](LICENSE)
