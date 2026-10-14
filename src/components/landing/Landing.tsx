"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listProjectMeta } from "@/lib/storage";
import { createBlankProject, createDemoProject } from "@/lib/demo";
import { saveProject } from "@/lib/storage";

export function Landing() {
  const router = useRouter();
  const [projects] = useState(() =>
    typeof window === "undefined" ? [] : listProjectMeta(),
  );

  async function openDemo() {
    const demo = createDemoProject("demo");
    await saveProject(demo);
    router.push("/studio/demo");
  }

  async function openBlank() {
    const p = createBlankProject("Untitled canvas");
    await saveProject(p);
    router.push(`/studio/${p.id}`);
  }

  return (
    <div className="min-h-dvh bg-[#0e0c12] text-stone-100">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="font-serif text-2xl tracking-tight text-amber-100">Atelier</div>
        <nav className="flex gap-4 text-sm text-stone-400">
          <a href="#how">How it works</a>
          <a href="https://github.com" className="hover:text-stone-200">
            MIT
          </a>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-24">
        <section className="grid items-center gap-12 py-16 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-3 text-xs tracking-[0.18em] text-amber-200/80 uppercase">
              Open-source design canvas
            </p>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-stone-50 md:text-6xl">
              Chat on the left. Infinite canvas on the right.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-400">
              Atelier is a production-ready alternative to closed visual artifact tools. Multiple sandboxed artboards, reusable Design Components, live tweaks, pinned comments, and export to HTML, ZIP, PDF, PNG, and PPTX — with your own model keys.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => void openDemo()} data-testid="open-demo">
                Open the Northbound demo
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => void openBlank()} data-testid="new-canvas">
                New blank canvas
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#16141f] p-4 shadow-[0_40px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-3 flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
            </div>
            <div className="grid grid-cols-[88px_1fr] gap-3">
              <div className="space-y-2 rounded-lg bg-black/30 p-2">
                <div className="h-2 w-14 rounded bg-white/10" />
                <div className="h-16 rounded bg-amber-200/20" />
                <div className="h-10 rounded bg-white/5" />
              </div>
              <div className="relative h-48 overflow-hidden rounded-lg bg-[#121018]">
                <div className="absolute top-6 left-4 h-24 w-36 rounded-sm bg-[#f4efe6] shadow-lg" />
                <div className="absolute top-10 left-28 h-20 w-28 rounded-sm bg-[#1a1612] shadow-lg" />
                <div className="absolute top-8 left-52 h-28 w-14 rounded-sm bg-[#f7f1e8] shadow-lg" />
              </div>
            </div>
          </div>
        </section>
        <section id="how" className="grid gap-6 md:grid-cols-3">
          {[
            {
              t: "Sandboxed artboards",
              d: "Each board is an opaque-origin iframe. The host talks to it only through a typed postMessage protocol.",
            },
            {
              t: "Tweaks without a round-trip",
              d: "Declared knobs become sliders and color wells. Changes apply live and persist into the source.",
            },
            {
              t: "Export the real page size",
              d: "PDF follows the artboard pixel size. ZIP includes canvas.json so you can round-trip a project.",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border border-white/8 bg-white/3 p-5">
              <h2 className="font-serif text-xl text-stone-50">{c.t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">{c.d}</p>
            </div>
          ))}
        </section>
        {projects.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-4 font-serif text-2xl">Recent canvases</h2>
            <ul className="divide-y divide-white/8 rounded-xl border border-white/8">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/studio/${p.id}`}
                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-white/4"
                  >
                    <span>{p.name}</span>
                    <span className="text-stone-500">
                      {new Date(p.updatedAt).toLocaleString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
