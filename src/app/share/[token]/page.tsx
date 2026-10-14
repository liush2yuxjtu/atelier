"use client";

import { useParams } from "next/navigation";
import { ShareView } from "@/components/studio/ShareView";

export default function SharePage() {
  const params = useParams<{ token: string }>();
  return <ShareView token={params.token} />;
}
