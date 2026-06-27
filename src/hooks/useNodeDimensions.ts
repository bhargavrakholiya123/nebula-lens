import { useEffect, useRef } from 'react';
import { useUpdateNodeInternals } from '@xyflow/react';
import { useCanvasStore } from '../store/useCanvasStore';

/**
 * Hook to sync the visual DOM dimensions of a React Flow custom node
 * back to the React Flow internal store. This fixes the issue where
 * extent: 'parent' clamping forces child nodes to misalign if the parent's
 * DOM size differs from its logical state size.
 */
export function useNodeDimensions(id: string) {
  const ref = useRef<HTMLDivElement>(null);
  const updateNodeInternals = useUpdateNodeInternals();
  const updateNodeDimensions = useCanvasStore((state) => state.updateNodeDimensions);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId: number;
    // Initialise to -1 so the very first observation always writes to the store,
    // even when offsetWidth is 0 during the FOUC window in production.
    let lastWidth = -1;
    let lastHeight = -1;

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Use getBoundingClientRect() instead of offsetWidth/offsetHeight.
        // In production, CSS is loaded asynchronously; getBoundingClientRect()
        // reads post-CSS layout dimensions inside a rAF, making it reliable
        // even during the FOUC window where offsetWidth still returns 0.
        const rect = el.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Only trigger update if dimensions actually changed
        if (Math.abs(width - lastWidth) > 0.5 || Math.abs(height - lastHeight) > 0.5) {
          lastWidth = width;
          lastHeight = height;
          updateNodeDimensions(id, width, height);
          updateNodeInternals(id);
        }
      });
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [id, updateNodeDimensions, updateNodeInternals]);

  return ref;
}
