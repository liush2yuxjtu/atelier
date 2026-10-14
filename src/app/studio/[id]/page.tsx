"use client";

import { useParams } from "next/navigation";
import { StudioApp } from "@/components/studio/StudioApp";

export default function StudioPage() {
  const params = useParams<{ id: string }>();
  return <StudioApp projectId={params.id} />;
}
