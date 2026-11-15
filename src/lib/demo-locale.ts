import type { Project } from "./types";
import type { Locale } from "./locale";

const homeCopy: Record<string, string> = {
  'lang="en"': 'lang="zh-CN"', Home: "首页", Pricing: "价格", About: "关于", "Get a bag": "选一袋咖啡",
  "Essay · Origin": "产地随笔", "Ship on cadence": "按时送达", "Hey friend ✨": "嗨，朋友 ✨",
  "Checkout, written like a magazine": "像翻阅杂志一样，挑选好咖啡",
  "Coffee that tastes like the trail.": "把山野的风味，装进咖啡杯。", "Bags without the boredom": "每一袋，都有新鲜感",
  "Quiet type, long lead, one decisive bag from a named lot.": "安静的排版，舒展的留白，一袋来自明确产地的好咖啡。",
  "Small-lot roast from high-elevation lots in Huila and Yirgacheffe. Shipped the week it leaves the drum — never a warehouse blend.": "来自慧兰与耶加雪菲高海拔产区的小批次烘焙。烘焙当周发货，不做仓储拼配。",
  "A brighter path from drum to doorstep. Confetti optional.": "从烘焙到你家，让日常多一点惊喜。",
  "Read the lot notes": "阅读产地笔记", "Start a subscription": "开始订阅", "Let’s roast": "一起开烘",
  Archive: "往期记录", "See this week’s lots": "看看本周咖啡", "Maybe later": "下次再说",
  "2.4k teams switched this month": "本月已有 2,400 位用户加入", "This week’s cadence": "本周咖啡节奏",
  "Roasted in Portland": "波特兰烘焙", "Carbon-neutral freight": "碳中和配送", "Pause or skip anytime": "随时暂停或跳过",
};

/** Localize only our built-in demo. Never rewrite an existing user project on locale changes. */
export function localizeDemoProject(project: Project, locale: Locale): Project {
  if (locale === "en") return project;
  const localized = structuredClone(project);
  const titles: Record<string, string> = { Home: "首页", Pricing: "价格", About: "关于", Dashboard: "数据概览", "Brand brief": "品牌简报", "Studio architecture": "工作台架构" };
  for (const board of localized.artboards) {
    board.title = titles[board.title] ?? board.title;
    if (board.id === "ab-landing") {
      for (const [original, translation] of Object.entries(homeCopy)) board.source = board.source.replaceAll(original, translation);
    }
  }
  localized.name = "Northbound 咖啡俱乐部";
  localized.messages[0].content = "Northbound 示例已放到画布。首页的微调控件可以改变风格、间距、按钮字重和用户口碑；切换风格后，同一页面的标题与按钮会立即更新。配色可在关联画板间联动。";
  // Initial undo/history snapshots should match the localized project too.
  localized.versions[0].artboards = structuredClone(localized.artboards);
  return localized;
}
