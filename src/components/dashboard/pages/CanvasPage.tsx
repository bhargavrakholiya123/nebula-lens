"use client";

import React from "react";
import ArchitectureCanvas from "@/components/canvas/ArchitectureCanvas";

export default function CanvasPage() {
  return (
    <div className="w-full h-full relative bg-[var(--gl-bg-base)]">
      <ArchitectureCanvas />
    </div>
  );
}
