import JSZip from "jszip";
import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";
import type { Artboard, Project, ProjectFile } from "../types";
import { mergeTweaksIntoHtml } from "../tweaks";
import { compileArtboard } from "../sandbox/compile";

export interface ExportPng {
  id: string;
  title: string;
  dataUrl: string;
  width: number;
  height: number;
}

export function artboardToStandaloneHtml(
  board: Artboard,
  vendorBase = "",
  files: ProjectFile[] = [],
): string {
  const compiled = compileArtboard({
    kind: board.kind,
    source: board.source,
    nonce: "export",
    vendorBase,
    tweaks: board.tweaks,
    tweakSchema: board.tweakSchema,
    files,
    dcPath: board.dcPath,
    dcProps: board.dcProps ?? board.tweaks,
  });
  // Strip the injected runtime for a clean standalone file.
  return compiled.replace(/<script>\(\(\) => \{\s*const CHANNEL = "atelier"[\s\S]*?<\/script>/, "");
}

export function projectManifest(project: Project) {
  return {
    name: project.name,
    id: project.id,
    updatedAt: project.updatedAt,
    canvas: project.canvas,
    artboards: project.artboards.map((b) => ({
      id: b.id,
      title: b.title,
      kind: b.kind,
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
    })),
  };
}

export async function buildZip(project: Project, vendorBase = ""): Promise<Blob> {
  const zip = new JSZip();
  zip.file(
    "canvas.json",
    JSON.stringify(
      {
        ...projectManifest(project),
        artboards: project.artboards,
        files: project.files,
        designSystem: project.designSystem ?? null,
      },
      null,
      2,
    ),
  );
  for (const board of project.artboards) {
    const slug = slugify(board.title) || board.id;
    zip.file(`artboards/${slug}.html`, artboardToStandaloneHtml(board, vendorBase, project.files));
    zip.file(`artboards/${slug}.source.txt`, board.source);
  }
  for (const file of project.files) {
    zip.file(`files/${file.path.replace(/^\/+/, "")}`, file.content);
  }
  zip.file("README.txt", `${project.name}\nExported from Atelier.\n`);
  return zip.generateAsync({ type: "blob" });
}

export function pngsToPdf(pngs: ExportPng[]): Blob {
  if (pngs.length === 0) {
    throw new Error("nothing to export");
  }
  const first = pngs[0];
  const pdf = new jsPDF({
    orientation: first.width >= first.height ? "landscape" : "portrait",
    unit: "px",
    format: [first.width / 2, first.height / 2],
    hotfixes: ["px_scaling"],
  });
  pngs.forEach((png, i) => {
    const w = png.width / 2;
    const h = png.height / 2;
    if (i > 0) {
      pdf.addPage([w, h], w >= h ? "landscape" : "portrait");
    }
    pdf.addImage(png.dataUrl, "PNG", 0, 0, w, h);
  });
  return pdf.output("blob");
}

export async function pngsToPptx(project: Project, pngs: ExportPng[]): Promise<Blob> {
  const pptx = new PptxGenJS();
  pptx.author = "Atelier";
  pptx.title = project.name;
  for (const png of pngs) {
    const board = project.artboards.find((b) => b.id === png.id);
    const wIn = (board?.width ?? 1920) / 96;
    const hIn = (board?.height ?? 1080) / 96;
    const slide = pptx.addSlide();
    // pptxgen default is 10 x 5.625 in; override per slide via defineLayout if needed
    slide.addImage({ data: png.dataUrl, x: 0, y: 0, w: "100%", h: "100%" });
    void wIn;
    void hIn;
  }
  const buf = (await pptx.write({ outputType: "blob" })) as Blob;
  return buf;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function withLiveTweaks(board: Artboard): Artboard {
  if (!board.tweakSchema || Object.keys(board.tweakSchema).length === 0) return board;
  return {
    ...board,
    source: mergeTweaksIntoHtml(board.source, board.tweaks, board.tweakSchema),
  };
}

export function serializeFiles(files: ProjectFile[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of files) out[f.path] = f.content;
  return out;
}
