# Atelier Design Components

Atelier’s Design Components (DC) protocol is an original, file-based way to reuse visual pieces on the canvas. It is **not** a copy of any vendor format. A `.dc.html` file is a self-contained HTML document with a typed prop schema, default values, named slots, and optional imports of other components.

This document is the spec the host and the agent both follow.

## File format

A component lives at a project path ending in `.dc.html`.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<script type="application/atelier-dc">
{
  "name": "PriceCard",
  "preview": { "width": 280, "height": 320 },
  "props": {
    "title": { "type": "text", "default": "Summit", "label": "Plan" },
    "accent": { "type": "color", "default": "#c45c26", "label": "Accent" },
    "featured": { "type": "boolean", "default": false, "label": "Featured" }
  },
  "slots": ["cta"]
}
</script>
<style>
  .pc { background: var(--dc-accent); }
</style>
</head>
<body>
  <article class="pc" data-dc-root>
    <h3>{{title}}</h3>
    <slot name="cta"><button>Start</button></slot>
  </article>
</body>
</html>
```

Rules:

- Schema MIME is `application/atelier-dc` (JSON). Unknown keys are ignored.
- Prop types: `text`, `color`, `range`, `boolean`, `select`, `number`.
- Each prop has a `default`. Optional: `label`, `min`, `max`, `step`, `unit`, `options`.
- `preview` is the library thumbnail / default artboard size.
- `{{prop}}` and dotted `{{item.name}}` are the only holes. No expressions, filters, or conditionals.
- Mark the inlinable root with `data-dc-root`. The host extracts that node when composing.
- CSS variables `--dc-<prop>` and `--tweak-<prop>` are injected for every prop.

## Composition

Parents pull children in with a custom element. Never self-close it.

```html
<dc-import src="PriceCard.dc.html" props='{"title":"Trail","accent":"{{accent}}"}' hint-size="280px,300px">
  <dc-slot name="cta"><button>Start Trail</button></dc-slot>
</dc-import>
```

- `src` is a project path or basename. Relative paths resolve from the importer.
- `props` is a JSON object. String values may contain `{{parentProp}}` holes; they are resolved from the parent instance before the child flattens.
- `hint-size` is `width,height` used as min size while streaming / empty.
- `<dc-slot name="…">` replaces the child’s `<slot name="…">`. Leftover inner HTML fills the default slot.

The host keeps a directed dependency graph of every `.dc.html` import. Cycles are rejected (`A → B → A`) and render as an error instead of recursing. Editing a file hot-recompiles every artboard whose component transitively imports it.

## Artboards as instances

Any artboard may instantiate a component (`kind: "dc"`, `dcPath`, `dcProps`). Instance props override file defaults. They do **not** rewrite the `.dc.html` source. The Tweaks / Props rail is generated from the schema.

## Agent tools

The model emits markup in the chat stream. The host parses incrementally, including an unclosed last `<dc-write>`, so the canvas updates from the first characters.

### `dc-write` — create or replace a component

```
<dc-write path="PriceCard.dc.html" title="Price card" width="360" height="420" mount="true">
…full .dc.html document…
</dc-write>
```

`mount="true"` (default) also places or updates an artboard bound to that path.

### `dc-set-props` — change props without regenerating markup

```
<dc-set-props path="PriceCard.dc.html" instance="optional-artboard-id">
{"title":"Camp","accent":"#2f6fed"}
</dc-set-props>
```

With `instance`, only that artboard’s `dcProps` change. Without it, the file’s schema defaults update, then dependents recompile.

An `<artboard kind="dc" src="RoastGrid.dc.html" props='{"headline":"…"}'>` is also accepted.

## Library + canvas

The Components rail lists every `.dc.html` in the project, with a scaled preview. Drag onto the canvas (or Place) to mint a new instance at the drop point.

## Export

HTML / ZIP / PDF / PPTX compile through the same flatten pass. Imports are inlined: standalone output contains ordinary HTML/CSS, never `<dc-import>`. The ZIP still includes the original component files under `files/` so a round-trip can re-open them.

## Host implementation

| Piece | Path |
| --- | --- |
| Parser / schema | `src/lib/dc/parse.ts` |
| Graph, cycles, dependents | `src/lib/dc/graph.ts` |
| Flatten + interpolate | `src/lib/dc/render.ts` |
| File-level set-props | `src/lib/dc/set-props.ts` |
| Agent parse | `src/lib/agent/parse.ts` |
| Store (write, set props, hot reload, place) | `src/lib/store.ts` |

---

## 中文摘要

Atelier 的 Design Components 是项目内的可复用视觉组件协议，**不是**任何厂商格式的复制。

- **文件**：`.dc.html` 是一份自包含 HTML。用 `<script type="application/atelier-dc">` 声明类型化 props、默认值、插槽和预览尺寸。模板洞只有 `{{prop}}` / 点路径，没有表达式。
- **组合**：父组件用 `<dc-import src="…" props='JSON'>` 引入子组件，`<dc-slot>` 填插槽。宿主维护依赖图，检测循环引用；改一个文件会热更新所有依赖它的画板。
- **画板**：每张画板可以是某个 DC 的实例。Tweaks/Props 面板由 schema 自动生成；改实例 props **不会**回写组件文件。
- **智能体工具**：流式 `<dc-write>` 从第一批字符就开始渲染；`<dc-set-props>` 只改 props、不重新生成 markup。
- **组件库**：列出项目里所有 DC，可预览、拖到画布上实例化。
- **导出**：HTML / ZIP / PDF / PPTX 都会把 import **内联**成独立文档，输出里不再有 `<dc-import>`。
