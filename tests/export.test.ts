import { describe, expect, it } from "vitest";
import { artboardToStandaloneHtml, buildZip, pngsToPdf, projectManifest, slugify } from "@/lib/export";
import { createDemoProject } from "@/lib/demo";

describe("export helpers", () => {
  it("slugifies titles", () => {
    expect(slugify("Northbound Roast Club!")).toBe("northbound-roast-club");
  });

  it("builds a canvas.json manifest", () => {
    const project = createDemoProject("demo");
    const manifest = projectManifest(project);
    expect(manifest.artboards.length).toBeGreaterThanOrEqual(3);
    expect(manifest.artboards[0]).toHaveProperty("x");
  });

  it("emits standalone HTML without the runtime channel", () => {
    const project = createDemoProject("demo");
    const html = artboardToStandaloneHtml(project.artboards[0]);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).not.toContain('const CHANNEL = "atelier"');
  });

  it("zips canvas.json plus artboards", async () => {
    const project = createDemoProject("demo");
    const blob = await buildZip(project);
    expect(blob.size).toBeGreaterThan(1000);
    const buf = Buffer.from(await blob.arrayBuffer());
    expect(buf.subarray(0, 2).toString()).toBe("PK");
  });

  it("embeds PNG pages into a PDF using artboard pixel size", () => {
    const tiny =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const blob = pngsToPdf([
      { id: "a", title: "A", dataUrl: tiny, width: 1440, height: 900 },
      { id: "b", title: "B", dataUrl: tiny, width: 1280, height: 720 },
    ]);
    expect(blob.size).toBeGreaterThan(100);
  });
});
