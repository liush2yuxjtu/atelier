/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { createDemoProject } from "@/lib/demo";
import { buildRuntimeScript } from "@/lib/sandbox/runtime";
import {
  applyTweakBindings,
  detectDesignKind,
  inferGenerativeSchema,
  mapAcrossCanvas,
} from "@/lib/tweak-bind";
import { parseTweaksSchema } from "@/lib/tweaks";

const LANDING = `<!DOCTYPE html><html><body>
  <h1 data-copy-for="mood" data-copy-editorial="Quiet magazine" data-copy-saas="Northstar Checkout" data-copy-playful="Let's go">Northstar Checkout</h1>
  <p data-tweak-show="socialProof">2.4k teams switched this month</p>
</body></html>`;

const DASHBOARD = `<!DOCTYPE html><html><body>
  <div class="metric-grid">
    <div class="metric">A</div><div class="metric">B</div><div class="metric">C</div>
    <div class="metric">D</div><div class="metric">E</div><div class="metric">F</div>
  </div>
  <svg class="spark" data-tweak-show="sparkline"></svg>
</body></html>`;

const PRICING = `<!DOCTYPE html><html><body>
  <div data-tweak-count="planCount">
    <article>Starter</article><article>Pro</article><article>Team</article><article>Scale</article>
  </div>
  <div data-price-monthly="$29" data-price-yearly="$24"><span class="price-amount">$29</span></div>
</body></html>`;

function mount(html: string): Document {
  document.open();
  document.write(html);
  document.close();
  return document;
}

describe("detectDesignKind", () => {
  it("classifies landing, dashboard, and pricing from markup", () => {
    const demo = createDemoProject("demo");
    const home = demo.artboards.find((b) => b.id === "ab-landing")!;
    const dash = demo.artboards.find((b) => b.id === "ab-dashboard")!;
    const price = demo.artboards.find((b) => b.id === "ab-pricing")!;
    expect(detectDesignKind(home.source)).toBe("landing");
    expect(detectDesignKind(dash.source)).toBe("dashboard");
    expect(detectDesignKind(price.source)).toBe("pricing");
  });
});

describe("inferGenerativeSchema", () => {
  it("prepares different knobs per design kind", () => {
    const demo = createDemoProject("demo");
    const home = inferGenerativeSchema(demo.artboards.find((b) => b.id === "ab-landing")!.source);
    const dash = inferGenerativeSchema(demo.artboards.find((b) => b.id === "ab-dashboard")!.source);
    const price = inferGenerativeSchema(demo.artboards.find((b) => b.id === "ab-pricing")!.source);
    expect(home.mood?.options).toEqual(["editorial", "saas", "playful"]);
    expect(home.socialProof?.type).toBe("boolean");
    expect(home.radius).toBeUndefined();
    expect(dash.metricDensity?.options).toContain("dense");
    expect(dash.sparkline?.type).toBe("boolean");
    expect(dash.mood).toBeUndefined();
    expect(price.planCount?.options).toEqual(["2", "3", "4"]);
    expect(price.billing?.options).toEqual(["monthly", "yearly"]);
    expect(price.metricDensity).toBeUndefined();
  });

  it("lets a declared schema win", () => {
    const html = `<script type="application/atelier-tweaks">{"mood":{"type":"select","value":"playful","options":["editorial","saas","playful"]}}</script>
<section class="hero" data-copy-editorial="x"></section>`;
    expect(inferGenerativeSchema(html).mood?.value).toBe("playful");
  });
});

describe("tweak → layout/content binding", () => {
  it("swaps landing copy and hides social proof", () => {
    const doc = mount(LANDING);
    applyTweakBindings(doc, { mood: "editorial", socialProof: true });
    expect(doc.documentElement.getAttribute("data-mood")).toBe("editorial");
    expect(doc.querySelector("h1")?.textContent).toBe("Quiet magazine");
    expect((doc.querySelector("[data-tweak-show]") as HTMLElement).style.display).not.toBe("none");
    applyTweakBindings(doc, { mood: "playful", socialProof: false });
    expect(doc.querySelector("h1")?.textContent).toBe("Let's go");
    expect((doc.querySelector("[data-tweak-show]") as HTMLElement).style.display).toBe("none");
  });

  it("restructures dashboard density attrs and sparkline", () => {
    const doc = mount(DASHBOARD);
    applyTweakBindings(doc, { metricDensity: "dense", sparkline: false });
    expect(doc.documentElement.getAttribute("data-metric-density")).toBe("dense");
    expect(doc.documentElement.getAttribute("data-sparkline")).toBe("off");
    expect((doc.querySelector("[data-tweak-show='sparkline']") as HTMLElement).style.display).toBe("none");
  });

  it("adds and removes pricing cards and updates yearly prices", () => {
    const doc = mount(PRICING);
    applyTweakBindings(doc, { planCount: 2, billing: "monthly" });
    const cards = Array.from(doc.querySelector("[data-tweak-count]")!.children) as HTMLElement[];
    expect(cards.filter((c) => c.style.display !== "none")).toHaveLength(2);
    applyTweakBindings(doc, { planCount: 4, billing: "yearly" });
    const again = Array.from(doc.querySelector("[data-tweak-count]")!.children) as HTMLElement[];
    expect(again.filter((c) => c.style.display !== "none")).toHaveLength(4);
    expect(doc.querySelector(".price-amount")?.textContent).toBe("$24");
    expect(doc.documentElement.getAttribute("data-plan-count")).toBe("4");
  });
});

describe("demo fixtures ship generative knobs", () => {
  it("Home / Dashboard / Pricing each declare a distinct prepared set", () => {
    const demo = createDemoProject("demo");
    expect(demo.artboards).toHaveLength(8);
    const home = demo.artboards.find((b) => b.id === "ab-landing")!;
    const dash = demo.artboards.find((b) => b.id === "ab-dashboard")!;
    const price = demo.artboards.find((b) => b.id === "ab-pricing")!;
    expect(home.tweakSchema.mood?.control).toBe("radio");
    expect(home.tweaks.mood).toBe("saas");
    expect(dash.tweakSchema.metricDensity?.type).toBe("select");
    expect(price.tweakSchema.planCount?.options).toEqual(["2", "3", "4"]);
    expect(home.source).toContain("data-copy-editorial");
    expect(price.source).toContain('data-tweak-count="planCount"');
    expect(dash.source).toContain("metric-grid");
  });

  it("round-trips control and structural through the tweaks block", () => {
    const demo = createDemoProject("demo");
    const schema = parseTweaksSchema(demo.artboards.find((b) => b.id === "ab-landing")!.source);
    expect(schema.mood?.structural).toBe(true);
    expect(schema.mood?.control).toBe("radio");
    expect(schema.mood?.optionLabels?.saas).toBe("SaaS");
  });
});

describe("apply across canvas", () => {
  it("copies look tokens onto another board map", () => {
    const next = mapAcrossCanvas(
      { look: "moss", accent: "#3d6b4f", paper: "#eef3ea", ink: "#142018", mood: "playful" },
      { look: "ember", accent: "#c45c26", planCount: 3 },
    );
    expect(next.look).toBe("moss");
    expect(next.accent).toBe("#3d6b4f");
    expect(next.planCount).toBe(3);
    expect(next.mood).toBeUndefined();
  });
});

describe("sandbox runtime", () => {
  it("applies copy packs, counted children, and data attributes live", () => {
    const src = buildRuntimeScript("n1");
    expect(src).toContain("data-copy-for");
    expect(src).toContain("data-tweak-count");
    expect(src).toContain("data-tweak-show");
    expect(src).toContain("kebabKey");
  });
});
