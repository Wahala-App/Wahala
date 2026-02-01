"use client";

import { useRouter } from "next/navigation";
import IncidentFeedContent from "./IncidentFeedContent";

export default function IncidentPage() {
  const router = useRouter();

  console.log("🔴 FALLBACK PAGE LOADED");

  return (
    <div className="min-h-screen">
      <IncidentFeedContent 
        onClose={() => router.push('/')}
        isModal={false}
      />
    </div>
  );
}