import { nanoid } from "nanoid";
import { parseTweaksSchema, schemaToMap } from "./tweaks";
import { boardHasSection, defaultSections, defaultThemeSchema, defaultThemeTweaks, encodeSections, parseSectionKey, sectionSchema } from "./theme";
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
    --tweak-paper: #f4efe6;
    --tweak-ink: #1a1612;
    --tweak-density: 1;
    --tweak-type: 1;
    --mute: #6b6158;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Outfit, system-ui, sans-serif; background: var(--tweak-paper); color: var(--tweak-ink); }
  body.page { display: flex; flex-direction: column; min-height: 100vh; }
  [data-section] { }
  [data-section="header"][data-layout="compact"] nav { display: none; }
  [data-section="pricing"][data-layout="stack"] .pgrid, [data-section="pricing"][data-layout="stack"] .grid { grid-template-columns: 1fr; gap: 8px; }
  [data-section="pricing"][data-layout="stack"] .ptier { padding: 10px 14px; }
  header { display: flex; justify-content: space-between; align-items: center; padding: calc(28px * var(--tweak-density)) calc(48px * var(--tweak-density)); }
  .mark { font-family: Fraunces, Georgia, serif; font-weight: 700; font-size: calc(22px * var(--tweak-type)); letter-spacing: -0.03em; }
  nav { display: flex; gap: 28px; color: var(--mute); font-size: 14px; }
  .cta { background: var(--tweak-accent); color: #fff; border: 0; border-radius: 999px; padding: 10px 18px; font: 600 14px Outfit, sans-serif; cursor: pointer; }
  .hero { padding: calc(48px * var(--tweak-density)) calc(64px * var(--tweak-density)) calc(80px * var(--tweak-density)); display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px; align-items: center; }
  html[data-layout="stack"] .hero { grid-template-columns: 1fr; }
  h1 { font-family: Fraunces, Georgia, serif; font-size: calc(72px * var(--tweak-type)); line-height: 0.95; font-weight: 500; margin: 0 0 20px; letter-spacing: -0.04em; }
  .lede { font-size: calc(18px * var(--tweak-type)); color: var(--mute); max-width: 440px; line-height: 1.55; }
  .actions { display: flex; gap: 12px; margin-top: 28px; }
  .ghost { background: transparent; border: 1px solid color-mix(in srgb, var(--tweak-ink) 18%, transparent); border-radius: 999px; padding: 10px 18px; font: 500 14px Outfit, sans-serif; color: var(--tweak-ink); }
  .card { background: color-mix(in srgb, var(--tweak-paper) 70%, #fff); border-radius: var(--tweak-radius); padding: 28px; box-shadow: 0 24px 60px rgba(26,22,18,0.08); }
  .bean { height: 220px; border-radius: calc(var(--tweak-radius) - 4px); background:
    radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--tweak-accent) 35%, #fff), transparent 40%),
    linear-gradient(160deg, var(--tweak-accent), color-mix(in srgb, var(--tweak-ink) 70%, #000)); }
  .meta { display: flex; justify-content: space-between; margin-top: 16px; font-size: 13px; color: var(--mute); }
  footer { padding: 0 calc(48px * var(--tweak-density)) calc(32px * var(--tweak-density)); display: flex; gap: 40px; color: var(--mute); font-size: 13px; }
  .plans { padding: 8px 48px 40px; }
  .plans h2 { font-family: Fraunces, Georgia, serif; font-size: calc(28px * var(--tweak-type)); margin: 0 0 16px; }
  .pgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .ptier { background: color-mix(in srgb, var(--tweak-paper) 70%, #fff); border-radius: var(--tweak-radius); padding: 16px 18px; border: 1px solid color-mix(in srgb, var(--tweak-ink) 10%, transparent); }
  .ptier.featured { border-color: var(--tweak-accent); color: var(--tweak-accent); font-weight: 600; }
</style>
<script type="application/atelier-tweaks">
{
  "look": { "type": "palette", "value": "ember", "label": "Look", "group": "color", "options": ["ember", "moss", "night", "signal"], "swatches": { "ember": { "accent": "#c45c26", "paper": "#f4efe6", "ink": "#1a1612" }, "moss": { "accent": "#3d6b4f", "paper": "#eef3ea", "ink": "#142018" }, "night": { "accent": "#d4a054", "paper": "#16141c", "ink": "#f4efe6" }, "signal": { "accent": "#2f6fed", "paper": "#f3f6fb", "ink": "#12141a" } } },
  "accent": { "type": "color", "value": "#c45c26", "label": "Accent", "group": "color" },
  "paper": { "type": "color", "value": "#f4efe6", "label": "Paper", "group": "color" },
  "ink": { "type": "color", "value": "#1a1612", "label": "Ink", "group": "color" },
  "radius": { "type": "range", "value": 16, "min": 0, "max": 40, "unit": "px", "label": "Radius", "group": "layout" },
  "density": { "type": "range", "value": 1, "min": 0.75, "max": 1.35, "step": 0.05, "label": "Density", "group": "density" },
  "type": { "type": "range", "value": 1, "min": 0.8, "max": 1.3, "step": 0.05, "label": "Type scale", "group": "type" },
  "layout": { "type": "select", "value": "split", "options": ["split", "stack"], "label": "Layout", "group": "layout" },
  "headline": { "type": "text", "value": "Coffee that tastes like the trail.", "label": "Headline", "group": "copy" }
}
</script>
</head>
<body class="page">
  <header data-section="header">
    <div class="mark">Northbound</div>
    <nav><span>Home</span><span>Pricing</span><span>About</span></nav>
    <button class="cta">Get a bag</button>
  </header>
  <section class="hero" data-section="hero">
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
      <div class="meta"><strong style="color:var(--tweak-ink)">Huila washed · 250g</strong><span>$22</span></div>
    </div>
  </section>
  <section class="plans" data-section="pricing">
    <h2>This week’s cadence</h2>
    <div class="pgrid">
      <div class="ptier">Trail · $18</div>
      <div class="ptier featured">Summit · $32</div>
      <div class="ptier">Camp · $64</div>
    </div>
  </section>
  <footer data-section="cta">
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
  :root { --tweak-accent: #c45c26; --tweak-radius: 18px; --tweak-paper: #f4efe6; --tweak-ink: #1a1612; --tweak-density: 1; --tweak-type: 1; }
  body { margin: 0; background: var(--tweak-paper); color: var(--tweak-ink); font-family: Outfit, sans-serif; }
  body.page { display: flex; flex-direction: column; min-height: 100vh; }
  [data-section="pricing"][data-layout="stack"] .grid { grid-template-columns: 1fr; gap: 8px; }
  [data-section="pricing"][data-layout="stack"] .tier { min-height: 0; padding: 12px 16px; }
  header { display: flex; justify-content: space-between; align-items: center; padding: 22px 40px; }
  .mark { font-family: Fraunces, Georgia, serif; font-weight: 700; font-size: 20px; }
  nav { display: flex; gap: 22px; color: #6b6158; font-size: 14px; }
  .cta { background: var(--tweak-accent); color: #fff; border: 0; border-radius: 999px; padding: 10px 16px; font: 600 13px Outfit, sans-serif; }
  .wrap { padding: 36px 40px 28px; }
  h2 { font-family: Fraunces, Georgia, serif; font-size: calc(36px * var(--tweak-type)); margin: 0 0 8px; }
  .sub { color: #6b6158; margin: 0 0 24px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .tier { background: color-mix(in srgb, var(--tweak-paper) 70%, #fff); border: 1px solid color-mix(in srgb, var(--tweak-ink) 12%, transparent); border-radius: var(--tweak-radius); padding: 22px; min-height: 340px; display: flex; flex-direction: column; }
  .tier.featured { border-color: var(--tweak-accent); }
  .name { font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b6158; }
  .price { font-family: Fraunces, Georgia, serif; font-size: 40px; margin: 10px 0; }
  .price span { font-size: 14px; color: #6b6158; }
  ul { padding: 0; margin: 0 0 18px; list-style: none; color: var(--tweak-ink); line-height: 1.9; flex: 1; font-size: 14px; }
  .tier button { border: 0; border-radius: 999px; padding: 10px; font: 600 13px Outfit, sans-serif; cursor: pointer; background: var(--tweak-accent); color: #fff; }
  .tier:not(.featured) button { background: transparent; color: var(--tweak-ink); border: 1px solid color-mix(in srgb, var(--tweak-ink) 22%, transparent); }
  footer { padding: 0 40px 28px; display: flex; gap: 28px; color: #6b6158; font-size: 13px; }
</style>
<script type="application/atelier-tweaks">
{ "look": { "type": "palette", "value": "ember", "label": "Look" }, "accent": { "type": "color", "value": "#c45c26", "label": "Accent" }, "paper": { "type": "color", "value": "#f4efe6", "label": "Paper" }, "ink": { "type": "color", "value": "#1a1612", "label": "Ink" }, "radius": { "type": "range", "value": 18, "min": 0, "max": 40, "unit": "px", "label": "Radius" } }
</script>
</head>
<body class="page">
  <header data-section="header">
    <div class="mark">Northbound</div>
    <nav><span>Home</span><span>Pricing</span><span>About</span></nav>
    <button class="cta">Get a bag</button>
  </header>
  <section class="wrap" data-section="pricing">
    <h2>Choose a roast cadence</h2>
    <p class="sub">Pause, skip, or gift a bag. Every plan ships the week of roast.</p>
    <div class="grid">
      <div class="tier"><div class="name">Trail</div><div class="price">$18 <span>/ bag</span></div><ul><li>1 bag / month</li><li>Rotating origin</li><li>Postcard tasting notes</li></ul><button>Start Trail</button></div>
      <div class="tier featured"><div class="name">Summit</div><div class="price">$32 <span>/ month</span></div><ul><li>2 bags / month</li><li>Filter + espresso pair</li><li>Early access lots</li><li>Free freight</li></ul><button>Start Summit</button></div>
      <div class="tier"><div class="name">Camp</div><div class="price">$64 <span>/ month</span></div><ul><li>Office / café kit</li><li>5 kg equivalent</li><li>Quarterly cupping call</li></ul><button>Talk to us</button></div>
    </div>
  </section>
  <footer data-section="cta">
    <div>Roasted in Portland</div>
    <div>Carbon-neutral freight</div>
    <div>Pause or skip anytime</div>
  </footer>
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

const ABOUT = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>About · Northbound</title>
<style>
  @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Outfit:wght@400;500;600&display=swap");
  :root { --tweak-accent: #c45c26; --tweak-radius: 16px; --tweak-paper: #f4efe6; --tweak-ink: #1a1612; --tweak-density: 1; --tweak-type: 1; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Outfit, system-ui, sans-serif; background: var(--tweak-paper); color: var(--tweak-ink); }
  body.page { display: flex; flex-direction: column; min-height: 100vh; }
  header { display: flex; justify-content: space-between; align-items: center; padding: 22px 48px; }
  .mark { font-family: Fraunces, Georgia, serif; font-weight: 700; font-size: 20px; }
  nav { display: flex; gap: 22px; color: #6b6158; font-size: 14px; }
  .cta { background: var(--tweak-accent); color: #fff; border: 0; border-radius: 999px; padding: 10px 16px; font: 600 13px Outfit, sans-serif; }
  .story { padding: 48px 64px; max-width: 720px; }
  h1 { font-family: Fraunces, Georgia, serif; font-size: calc(48px * var(--tweak-type)); line-height: 1.05; margin: 0 0 18px; }
  p { color: #6b6158; line-height: 1.6; font-size: calc(17px * var(--tweak-type)); }
  footer { padding: 0 48px 32px; display: flex; gap: 28px; color: #6b6158; font-size: 13px; }
</style>
<script type="application/atelier-tweaks">
{ "look": { "type": "palette", "value": "ember", "label": "Look" }, "accent": { "type": "color", "value": "#c45c26", "label": "Accent" }, "paper": { "type": "color", "value": "#f4efe6", "label": "Paper" }, "ink": { "type": "color", "value": "#1a1612", "label": "Ink" } }
</script>
</head>
<body class="page">
  <header data-section="header">
    <div class="mark">Northbound</div>
    <nav><span>Home</span><span>Pricing</span><span>About</span></nav>
    <button class="cta">Get a bag</button>
  </header>
  <section class="story" data-section="story">
    <h1>A roast calendar, not a café interior.</h1>
    <p>We buy high-elevation lots, roast the week they land, and ship before the flavor fades. The site is the product: cadence, origin, and a bag that still tastes like the trail.</p>
  </section>
  <footer data-section="cta">
    <div>Portland roastery</div>
    <div>Talk to a buyer</div>
  </footer>
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
    page?: boolean;
  },
): Artboard {
  const schema = partial.tweakSchema ?? parseTweaksSchema(partial.source);
  const theme = defaultThemeTweaks();
  const sections = defaultSections();
  const structural = partial.page
    ? Object.fromEntries(
        Object.entries(sectionSchema(sections)).filter(([key]) => {
          const sec = parseSectionKey(key);
          return !sec || boardHasSection({ source: partial.source }, sec.id);
        }),
      )
    : {};
  return {
    ...partial,
    tweaks: { ...theme, ...encodeSections(sections), ...schemaToMap(schema), ...partial.tweaks },
    tweakSchema: { ...structural, ...schema },
    comments: partial.comments ?? [],
    error: null,
    status: "ready",
    autoFixed: false,
    version: 1,
    unlinked: [],
    unlinkedSections: [],
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
      title: "Home",
      kind: "html",
      source: LANDING,
      x: 80,
      y: 80,
      width: 1100,
      height: 700,
      page: true,
      comments: [comment],
    }),
    board({
      id: "ab-pricing",
      title: "Pricing",
      kind: "html",
      source: PRICING,
      x: 1260,
      y: 80,
      width: 1100,
      height: 700,
      page: true,
    }),
    board({
      id: "ab-about",
      title: "About",
      kind: "html",
      source: ABOUT,
      x: 2440,
      y: 80,
      width: 1100,
      height: 700,
      page: true,
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
          "Placed the Northbound site on the canvas: Home, Pricing, and About share one theme and the same header / pricing / CTA sections. Tweaks are linked — change a look or move pricing once and every page updates. Checkout, the brief, and a RoastGrid Design Component sit beside them.",
        createdAt: now,
      },
    ],
    canvas: { panX: 20, panY: 36, zoom: 0.34 },
    selectedArtboardId: "ab-landing",
    selectedSelector: null,
    selectedStyles: null,
    selectedText: null,
    mode: "preview",
    presenting: false,
    compareVariantId: null,
    theme: defaultThemeTweaks(),
    themeSchema: defaultThemeSchema(),
    sections: defaultSections(),
    componentTweaks: {},
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
    presenting: false,
    compareVariantId: null,
    theme: defaultThemeTweaks(),
    themeSchema: defaultThemeSchema(),
    sections: defaultSections(),
    componentTweaks: {},
  };
}
