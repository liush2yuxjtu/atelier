"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { CanvasView } from "./CanvasView";
import { useStudio } from "@/lib/store";
import Link from "next/link";

export function ShareView({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/share/${token}`);
      if (!res.ok) {
        setError("This share link is missing or expired.");
        return;
      }
      const project = (await res.json()) as Project;
      if (cancelled) return;
      useStudio.setState({
        project: { ...project, mode: "preview", selectedSelector: null },
        hydrated: true,
      });
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-[#120f18] text-stone-300">
        <p>{error}</p>
        <Link href="/" className="text-amber-200">
          Back to Atelier
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#120f18] text-stone-400">
        Loading shared canvas…
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-[#120f18]">
      <div className="flex h-10 items-center justify-between border-b border-white/8 px-4 text-sm text-stone-400">
        <span>Shared canvas · read only</span>
        <Link href="/" className="text-amber-200">
          Open Atelier
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <CanvasView />
      </div>
    </div>
  );
}
