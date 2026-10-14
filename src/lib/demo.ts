import { nanoid } from "nanoid";
import { parseTweaksSchema, schemaToMap } from "./tweaks";
import { filesFromList, flattenAllSafe, schemaToTweakSchema, tweakMapFromSchema } from "./dc";
import type { Artboard, PinComment, Project, ProjectFile, TweakMap, TweakSchema } from "./types";

const LANDING = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Northbound</title>
<style>
  @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Outfit:wght@400;500;600&display=swap");
  :root {
    --tweak-accent: #c45c26;
    --tweak-radius: 16px;
    --ink: #1a1612;
    --paper: #f4efe6;
    --mute: #6b6158;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Outfit, system-ui, sans-serif; background: var(--paper); color: var(--ink); }
  header { display: flex; justify-content: space-between; align-items: center; padding: 28px 64px; }
  .mark { font-family: Fraunces, Georgia, serif; font-weight: 700; font-size: 22px; letter-spacing: -0.03em; }
  nav { display: flex; gap: 28px; color: var(--mute); font-size: 14px; }
  .cta { background: var(--tweak-accent); color: #fff; border: 0; border-radius: 999px; padding: 10px 18px; font: 600 14px Outfit, sans-serif; cursor: pointer; }
  .hero { padding: 48px 64px 80px; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px; align-items: center; }
  h1 { font-family: Fraunces, Georgia, serif; font-size: 72px; line-height: 0.95; font-weight: 500; margin: 0 0 20px; letter-spacing: -0.04em; }
  .lede { font-size: 18px; color: var(--mute); max-width: 440px; line-height: 1.55; }
  .actions { display: flex; gap: 12px; margin-top: 28px; }
  .ghost { background: transparent; border: 1px solid #d9d0c4; border-radius: 999px; padding: 10px 18px; font: 500 14px Outfit, sans-serif; }
  .card { background: #fff; border-radius: var(--tweak-radius); padding: 28px; box-shadow: 0 24px 60px rgba(26,22,18,0.08); }
  .bean { height: 220px; border-radius: calc(var(--tweak-radius) - 4px); background:
    radial-gradient(circle at 30% 20%, #f0d3b8, transparent 40%),
    linear-gradient(160deg, var(--tweak-accent), #3d2418); }
  .meta { display: flex; justify-content: space-between; margin-top: 16px; font-size: 13px; color: var(--mute); }
  footer { padding: 0 64px 40px; display: flex; gap: 40px; color: var(--mute); font-size: 13px; }
</style>
<script type="application/atelier-tweaks">
{
  "accent": { "type": "color", "value": "#c45c26", "label": "Accent" },
  "radius": { "type": "range", "value": 16, "min": 0, "max": 40, "unit": "px", "label": "Radius" },
  "headline": { "type": "text", "value": "Coffee that tastes like the trail.", "label": "Headline" }
}
</script>
</head>
<body>
  <header>
    <div class="mark">Northbound</div>
    <nav><span>Roastery</span><span>Subscriptions</span><span>Cafés</span></nav>
    <button class="cta">Get a bag</button>
  </header>
  <section class="hero">
    <div>
      <h1 data-tweak="headline">Coffee that tastes like the trail.</h1>
      <p class="lede">Small-lot roast from high-elevation lots in Huila and Yirgacheffe. Shipped the week it leaves the drum — never a warehouse blend.</p>
      <div class="actions">
        <button class="cta">Start a subscription</button>
        <button class="ghost">See this week’s lots</button>
      </div>
    </div>
    <div class="card">
      <div class="bean"></div>
      <div class="meta"><strong style="color:var(--ink)">Huila washed · 250g</strong><span>$22</span></div>
    </div>
  </section>
  <footer>
    <div>Roasted in Portland</div>
    <div>Carbon-neutral freight</div>
    <div>Pause or skip anytime</div>
  </footer>
</body>
</html>`;

const PRICING = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Outfit:wght@400;500;600&display=swap');
  :root { --tweak-accent: #c45c26; --tweak-radius: 18px; }
  body { margin: 0; background: #1a1612; color: #f4efe6; font-family: Outfit, sans-serif; }
  .wrap { padding: 56px 48px; }
  h2 { font-family: Fraunces, Georgia, serif; font-size: 40px; margin: 0 0 8px; }
  .sub { color: #b7aa9c; margin: 0 0 36px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .tier { background: #241f1a; border: 1px solid #3a322b; border-radius: var(--tweak-radius); padding: 28px; min-height: 420px; display: flex; flex-direction: column; }
  .tier.featured { background: #2c2118; border-color: var(--tweak-accent); }
  .name { font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: #b7aa9c; }
  .price { font-family: Fraunces, Georgia, serif; font-size: 48px; margin: 12px 0; }
  .price span { font-size: 16px; color: #b7aa9c; }
  ul { padding: 0; margin: 0 0 24px; list-style: none; color: #d8cfc4; line-height: 2; flex: 1; font-size: 15px; }
  button { border: 0; border-radius: 999px; padding: 12px; font: 600 14px Outfit, sans-serif; cursor: pointer; background: var(--tweak-accent); color: #fff; }
  .tier:not(.featured) button { background: transparent; color: #f4efe6; border: 1px solid #5a4e43; }
</style>
<script type="application/atelier-tweaks">
{ "accent": { "type": "color", "value": "#c45c26", "label": "Accent" }, "radius": { "type": "range", "value": 18, "min": 0, "max": 40, "unit": "px", "label": "Radius" } }
</script>
</head>
<body>
  <div class="wrap">
    <h2>Choose a roast cadence</h2>
    <p class="sub">Pause, skip, or gift a bag. Every plan ships the week of roast.</p>
    <div class="grid">
      <div class="tier"><div class="name">Trail</div><div class="price">$18 <span>/ bag</span></div><ul><li>1 bag / month</li><li>Rotating origin</li><li>Postcard tasting notes</li></ul><button>Start Trail</button></div>
      <div class="tier featured"><div class="name">Summit</div><div class="price">$32 <span>/ month</span></div><ul><li>2 bags / month</li><li>Filter + espresso pair</li><li>Early access lots</li><li>Free freight</li></ul><button>Start Summit</button></div>
      <div class="tier"><div class="name">Camp</div><div class="price">$64 <span>/ month</span></div><ul><li>Office / café kit</li><li>5 kg equivalent</li><li>Quarterly cupping call</li></ul><button>Talk to us</button></div>
    </div>
  </div>
</body>
</html>`;

const PHONE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>
  :root { --tweak-accent: #c45c26; }
  body { margin: 0; background: #0f0e0c; font-family: ui-sans-serif, system-ui, sans-serif; color: #1a1612; }
  .phone { width: 390px; height: 844px; margin: 0 auto; background: #f7f1e8; display: flex; flex-direction: column; }
  .bar { padding: 54px 22px 12px; display: flex; justify-content: space-between; font-size: 13px; color: #6b6158; }
  h3 { margin: 8px 22px 4px; font-size: 28px; letter-spacing: -0.03em; }
  p { margin: 0 22px 18px; color: #6b6158; font-size: 14px; }
  .bag { margin: 0 22px; background: #fff; border-radius: 18px; padding: 16px; display: flex; gap: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
  .swatch { width: 72px; height: 72px; border-radius: 12px; background: linear-gradient(160deg, var(--tweak-accent), #3d2418); }
  .qty { margin-left: auto; align-self: center; background: #efe8dc; border-radius: 999px; padding: 6px 12px; font-size: 13px; }
  .pay { margin-top: auto; padding: 18px 22px 32px; }
  .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
  button { width: 100%; margin-top: 12px; background: var(--tweak-accent); color: #fff; border: 0; border-radius: 999px; padding: 14px; font-weight: 600; }
</style>
<script type="application/atelier-tweaks">
{ "accent": { "type": "color", "value": "#c45c26", "label": "Accent" } }
</script>
</head>
<body>
  <div class="phone">
    <div class="bar"><span>9:41</span><span>Checkout</span></div>
    <h3>Your bag</h3>
    <p>Roasts this Thursday. Arrives next Tuesday.</p>
    <div class="bag">
      <div class="swatch"></div>
      <div><strong>Huila washed</strong><div style="color:#6b6158;font-size:13px;margin-top:4px">250g · filter</div></div>
      <div class="qty">1</div>
    </div>
    <div class="pay">
      <div class="row"><span>Subtotal</span><span>$22.00</span></div>
      <div class="row"><span>Freight</span><span>on us</span></div>
      <div class="row"><strong>Due today</strong><strong>$22.00</strong></div>
      <button>Pay with Apple Pay</button>
    </div>
  </div>
</body>
</html>`;

const ARCH = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><style>
  body { margin: 0; background: #16141f; color: #f4efe6; font-family: ui-sans-serif, system-ui, sans-serif; }
  .wrap { padding: 36px 40px; }
  h2 { margin: 0 0 22px; font-size: 22px; font-weight: 600; }
  .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .n { background: #2a2433; border: 1px solid #3d3548; border-radius: 12px; padding: 12px 14px; min-width: 120px; }
  .n strong { display: block; font-size: 13px; }
  .n span { display: block; font-size: 11px; color: #b7aa9c; margin-top: 4px; }
  .arrow { color: #e8a87c; font-size: 18px; }
</style></head>
<body>
  <div class="wrap">
    <h2>How Atelier talks to a board</h2>
    <div class="row">
      <div class="n"><strong>Chat</strong><span>stream tokens</span></div>
      <div class="arrow">→</div>
      <div class="n"><strong>Agent</strong><span>&lt;artboard&gt; tags</span></div>
      <div class="arrow">→</div>
      <div class="n"><strong>Canvas</strong><span>pan / zoom</span></div>
      <div class="arrow">→</div>
      <div class="n"><strong>Iframe</strong><span>opaque origin</span></div>
      <div class="arrow">→</div>
      <div class="n"><strong>postMessage</strong><span>tweaks · edit · PNG</span></div>
    </div>
  </div>
</body></html>`;

const BRIEF = `# Northbound — brand brief

A trail-first coffee company. The product is the roast calendar, not a café interior.

## Voice
Warm, specific, unhurried. Talk about lots and elevation, not "passion."

## Color
- Paper \`#f4efe6\`
- Ink \`#1a1612\`
- Accent \`#c45c26\`

## Type
Fraunces for display. Outfit for UI. Never a geometric sans on headlines.

## Artboards in this file
Landing, pricing, mobile checkout, and this brief live on the same canvas so stakeholders can compare density and tone in one pan.
`;

const BADGE_DC = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<script type="application/atelier-dc">
{
  "name": "Badge",
  "preview": { "width": 160, "height": 48 },
  "props": {
    "label": { "type": "text", "default": "Lot of the week", "label": "Label" },
    "accent": { "type": "color", "default": "#c45c26", "label": "Accent" }
  },
  "slots": []
}
</script>
</head>
<body>
  <span data-dc-root style="display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:var(--dc-accent);color:#fff;font:600 11px ui-sans-serif,system-ui;letter-spacing:0.06em;text-transform:uppercase">{{label}}</span>
</body>
</html>`;

const CARD_DC = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<script type="application/atelier-dc">
{
  "name": "PriceCard",
  "preview": { "width": 280, "height": 320 },
  "props": {
    "title": { "type": "text", "default": "Summit", "label": "Plan" },
    "price": { "type": "text", "default": "$32", "label": "Price" },
    "blurb": { "type": "text", "default": "Two bags a month, early lots.", "label": "Blurb" },
    "accent": { "type": "color", "default": "#c45c26", "label": "Accent" },
    "featured": { "type": "boolean", "default": true, "label": "Featured" }
  },
  "slots": ["cta"]
}
</script>
<style>
  .pc { font-family: ui-sans-serif, system-ui, sans-serif; color: #f4efe6; background: #241f1a; border: 1px solid #3a322b; border-radius: 18px; padding: 22px; min-height: 280px; display: flex; flex-direction: column; }
  .pc h3 { margin: 10px 0 4px; font-size: 22px; }
  .pc .price { font-size: 36px; margin: 8px 0; }
  .pc p { color: #b7aa9c; font-size: 13px; flex: 1; }
  .pc button { border: 0; border-radius: 999px; padding: 10px; background: var(--dc-accent, #c45c26); color: #fff; font-weight: 600; }
</style>
</head>
<body>
  <article class="pc" data-dc-root>
    <dc-import src="Badge.dc.html" props='{"label":"Plan","accent":"{{accent}}"}' hint-size="120px,28px"></dc-import>
    <h3>{{title}}</h3>
    <div class="price">{{price}}</div>
    <p>{{blurb}}</p>
    <slot name="cta"><button>Start {{title}}</button></slot>
  </article>
</body>
</html>`;

const GRID_DC = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<script type="application/atelier-dc">
{
  "name": "RoastGrid",
  "preview": { "width": 960, "height": 560 },
  "props": {
    "headline": { "type": "text", "default": "Choose a roast cadence", "label": "Headline" },
    "accent": { "type": "color", "default": "#c45c26", "label": "Accent" }
  },
  "slots": []
}
</script>
<style>
  body { margin: 0; background: #1a1612; color: #f4efe6; font-family: ui-sans-serif, system-ui, sans-serif; }
  .wrap { padding: 40px 36px; }
  h2 { margin: 0 0 24px; font-size: 28px; letter-spacing: -0.03em; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
</style>
</head>
<body>
  <div class="wrap" data-dc-root>
    <h2>{{headline}}</h2>
    <div class="grid">
      <dc-import src="PriceCard.dc.html" props='{"title":"Trail","price":"$18","blurb":"One bag a month.","featured":false,"accent":"{{accent}}"}' hint-size="280px,300px">
        <dc-slot name="cta"><button>Start Trail</button></dc-slot>
      </dc-import>
      <dc-import src="PriceCard.dc.html" props='{"title":"Summit","price":"$32","blurb":"Filter + espresso pair.","featured":true,"accent":"{{accent}}"}' hint-size="280px,300px">
        <dc-slot name="cta"><button>Start Summit</button></dc-slot>
      </dc-import>
      <dc-import src="PriceCard.dc.html" props='{"title":"Camp","price":"$64","blurb":"Office kit, quarterly cupping.","featured":false,"accent":"{{accent}}"}' hint-size="280px,300px">
        <dc-slot name="cta"><button>Talk to us</button></dc-slot>
      </dc-import>
    </div>
  </div>
</body>
</html>`;

function board(
  partial: Omit<Artboard, "tweaks" | "tweakSchema" | "comments" | "error" | "status" | "autoFixed" | "version"> & {
    comments?: PinComment[];
    tweaks?: TweakMap;
    tweakSchema?: TweakSchema;
  },
): Artboard {
  const schema = partial.tweakSchema ?? parseTweaksSchema(partial.source);
  return {
    ...partial,
    tweaks: partial.tweaks ?? schemaToMap(schema),
    tweakSchema: schema,
    comments: partial.comments ?? [],
    error: null,
    status: "ready",
    autoFixed: false,
    version: 1,
  };
}

export function createDemoProject(id = "demo"): Project {
  const now = Date.now();
  const comment: PinComment = {
    id: "cmt-hero",
    x: 120,
    y: 210,
    selector: "h1",
    body: "Can the headline be less poetic and more about shipping speed?",
    resolved: false,
    queued: true,
    createdAt: now,
  };
  const artboards: Artboard[] = [
    board({
      id: "ab-landing",
      title: "Landing",
      kind: "html",
      source: LANDING,
      x: 80,
      y: 80,
      width: 1440,
      height: 820,
      comments: [comment],
    }),
    board({
      id: "ab-pricing",
      title: "Pricing",
      kind: "html",
      source: PRICING,
      x: 1600,
      y: 80,
      width: 1280,
      height: 720,
    }),
    board({
      id: "ab-phone",
      title: "Checkout · iPhone",
      kind: "html",
      source: PHONE,
      x: 860,
      y: 980,
      width: 390,
      height: 844,
    }),
    board({
      id: "ab-flow",
      title: "Studio architecture",
      kind: "html",
      source: ARCH,
      x: 1600,
      y: 860,
      width: 920,
      height: 280,
    }),
    board({
      id: "ab-brief",
      title: "Brand brief",
      kind: "markdown",
      source: BRIEF,
      x: 80,
      y: 980,
      width: 720,
      height: 640,
    }),
  ];
  const files: ProjectFile[] = [
    {
      path: "tokens.css",
      content: `:root {\n  --paper: #f4efe6;\n  --ink: #1a1612;\n  --accent: #c45c26;\n}\n`,
      updatedAt: now,
    },
    { path: "brief.md", content: BRIEF, updatedAt: now },
    { path: "Badge.dc.html", content: BADGE_DC, updatedAt: now },
    { path: "PriceCard.dc.html", content: CARD_DC, updatedAt: now },
    { path: "RoastGrid.dc.html", content: GRID_DC, updatedAt: now },
  ];
  const dcMap = filesFromList(files);
  const grid = flattenAllSafe("RoastGrid.dc.html", dcMap);
  const gridTweaks = tweakMapFromSchema(grid.schema);
  artboards.push(
    board({
      id: "ab-dc-grid",
      title: "Roast grid · DC",
      kind: "dc",
      source: grid.html,
      x: 1600,
      y: 1220,
      width: 960,
      height: 560,
      dcPath: "RoastGrid.dc.html",
      dcProps: gridTweaks,
      tweaks: gridTweaks,
      tweakSchema: schemaToTweakSchema(grid.schema),
    }),
  );
  return {
    id,
    name: "Northbound roast club",
    createdAt: now,
    updatedAt: now,
    artboards,
    files,
    versions: [
      {
        id: nanoid(8),
        label: "Initial canvas",
        createdAt: now,
        artboards: structuredClone(artboards),
        files: structuredClone(files),
      },
    ],
    messages: [
      {
        id: nanoid(8),
        role: "assistant",
        content:
          "Placed six artboards for Northbound: landing, pricing, mobile checkout, architecture diagram, the brand brief, and a composed RoastGrid Design Component (Badge → PriceCard → grid). Instance props live in Tweaks; the library lists every .dc.html file.",
        createdAt: now,
      },
    ],
    canvas: { panX: 28, panY: 24, zoom: 0.24 },
    selectedArtboardId: "ab-landing",
    selectedSelector: null,
    selectedStyles: null,
    selectedText: null,
    mode: "preview",
    designSystem: {
      name: "Northbound",
      source: "manual",
      extractedAt: now,
      tokens: [
        { name: "paper", value: "#f4efe6", kind: "color" },
        { name: "ink", value: "#1a1612", kind: "color" },
        { name: "accent", value: "#c45c26", kind: "color" },
        { name: "display", value: "Fraunces", kind: "font" },
        { name: "ui", value: "Outfit", kind: "font" },
      ],
    },
  };
}

export function createBlankProject(name = "Untitled canvas"): Project {
  const now = Date.now();
  const id = nanoid(10);
  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    artboards: [],
    files: [],
    versions: [],
    messages: [],
    canvas: { panX: 80, panY: 80, zoom: 0.7 },
    selectedArtboardId: null,
    selectedSelector: null,
    selectedStyles: null,
    selectedText: null,
    mode: "preview",
  };
}
