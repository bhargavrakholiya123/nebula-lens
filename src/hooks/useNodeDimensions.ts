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
    let lastWidth = 0;
    let lastHeight = 0;

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Use offsetWidth/offsetHeight to capture the true rendering footprint
        // including borders, padding, and content
        const width = el.offsetWidth;
        const height = el.offsetHeight;
        
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
