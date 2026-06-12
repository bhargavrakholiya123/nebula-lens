"use client";

import ArchitectureCanvas from '../components/canvas/ArchitectureCanvas';
import ProductTour from '@/components/ui/ProductTour';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import { ReactFlowProvider } from '@xyflow/react';

export default function Home() {
  return (
    <main>
      <ReactFlowProvider>
        <ArchitectureCanvas />
        <ProductTour />
      </ReactFlowProvider>
      <KeyboardShortcuts />
    </main>
  );
}