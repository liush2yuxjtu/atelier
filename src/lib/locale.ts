export type Locale = "en" | "zh-CN";

const zh: Record<string, string> = {
  "How it works": "使用方法", "Open-source design canvas": "开源设计画布",
  "Chat on the left. Infinite canvas on the right.": "左边对话，右边无限画布。",
  "Open the Northbound demo": "打开 Northbound 示例", "New blank canvas": "新建空白画布",
  "Sandboxed artboards": "沙箱画板", "Generative Tweaks": "生成式微调",
  "Export the real page size": "按真实页面尺寸导出", "Recent canvases": "最近的画布",
  Preview: "预览", Edit: "编辑", Inspect: "检查", Comment: "批注", Present: "演示",
  "Exit present": "退出演示", Artboard: "画板", Duplicate: "复制", Arrange: "排列", Delete: "删除",
  Tokens: "设计变量", Export: "导出", Global: "全局", Dark: "深色", Light: "浅色",
  Density: "密度", Compact: "紧凑", Comfortable: "舒适", Spacious: "宽松", Grid: "网格",
  Snap: "吸附", "Reduce motion": "减少动态", "canvas chrome · not Tweaks": "画布外观设置，非页面微调",
  Chat: "对话", "Offline draft model": "离线草稿模型", "Enter to send": "回车发送", Send: "发送",
  "Ask for a landing page, a deck, a variant…": "描述落地页、演示文稿或设计变体…",
  Components: "组件", "Place on canvas": "放到画布", Tweaks: "微调", Props: "属性",
  Notes: "笔记", Files: "文件", "Prepared for this design": "为此设计准备的控件",
  Mood: "风格", Editorial: "杂志", SaaS: "简洁", Playful: "活泼",
  "Spacing intensity": "间距强度", "CTA weight": "按钮字重", Regular: "常规", Bold: "加粗",
  "Show social proof": "显示用户口碑", Look: "配色", Motion: "动态", Geometry: "几何",
  Visibility: "显示内容", Layout: "布局", Type: "字体", Copy: "文案", Other: "其他",
  Ember: "余烬", Moss: "苔绿", Night: "夜色", Signal: "信号蓝", Aurora: "极光",
  Accent: "强调色", "Stage layout": "版式", Split: "左右分栏", Stack: "上下排列",
  "Full-bleed": "通栏", Unlink: "取消联动", Unlinked: "已取消联动", "Push to all": "同步到全部",
  "Apply across canvas": "应用到整个画布", "Generate knobs": "生成控件", Undo: "撤销", Redo: "重做",
  "Save look": "保存配色", Approved: "已确认", "Opening canvas…": "正在打开画布…",
};

/** Translate interface labels; unknown/user-authored strings retain their original text. */
export function translate(locale: Locale, text: string): string {
  return locale === "zh-CN" ? zh[text] ?? text : text;
}
