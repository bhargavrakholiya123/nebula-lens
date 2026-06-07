import { useMemo } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';

export function useBlastRadius(startNodeId: string | null) {
  const edges = useCanvasStore(state => state.edges);
  const nodes = useCanvasStore(state => state.nodes);

  return useMemo(() => {
    if (!startNodeId) return { affectedNodeIds: new Set<string>(), affectedNodes: [] };

    const affected = new Set<string>();
    const queue = [startNodeId];

    // The node that fails is the center of the blast radius
    affected.add(startNodeId);

    // Breadth-First Search (BFS) to find all downstream cascading failures
    while (queue.length > 0) {
      const currentId = queue.shift()!;

      // 1. NETWORK FAILURE: Find anything connected downstream via traffic edges
      edges.forEach(edge => {
        if (edge.source === currentId && !affected.has(edge.target)) {
          affected.add(edge.target);
          queue.push(edge.target);
        }
      });

      // 2. INFRASTRUCTURE FAILURE: Find anything structurally trapped inside this container
      nodes.forEach(node => {
        if (node.parentId === currentId && !affected.has(node.id)) {
          affected.add(node.id);
          // By pushing the child to the queue, the algorithm will now also find
          // everything connected to the child!
          queue.push(node.id);
        }
      });
    }

    // Map the IDs back to the actual node data objects for the UI
    const affectedNodes = nodes.filter(n => affected.has(n.id) && n.id !== startNodeId);

    return { affectedNodeIds: affected, affectedNodes };
  }, [startNodeId, edges, nodes]);
}