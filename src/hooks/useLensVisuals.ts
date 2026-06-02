import { useCanvasStore } from '../store/useCanvasStore';

// HELPER: Makes checking container types bulletproof against uppercase/lowercase mismatches
const isContainer = (type?: string) => {
  if (!type) return false;
  const lowerType = type.toLowerCase();
  return lowerType.includes('vpc') || lowerType.includes('subnet');
};

export function useLensVisuals(nodeId: string) {
  const activeLens = useCanvasStore((state) => state.activeLens);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const edges = useCanvasStore((state) => state.edges);
  const nodes = useCanvasStore((state) => state.nodes);

  // Default state (Structural View or nothing selected)
  if (activeLens === 'structural') {
    return { opacity: 1, isHighlighted: false, isDimmed: false };
  }

  const currentNode = nodes.find((n) => n.id === nodeId);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Blast Radius Logic
  if (activeLens === 'blast-radius' && selectedNodeId) {

    const currentNode = nodes.find((n) => n.id === nodeId);
    const selectedNode = nodes.find((n) => n.id === selectedNodeId);

    // 1. THE BULLETPROOF GUARD CLAUSE
    if (isContainer(selectedNode?.type)) {
      if (isContainer(currentNode?.type)) {
        return {
          opacity: 0.6,
          isHighlighted: nodeId === selectedNodeId,
          isDimmed: false
        };
      }
      return { opacity: 1, isHighlighted: false, isDimmed: false };
    }

    // 2. Keep containers visible when a service is clicked
    if (isContainer(currentNode?.type)) {
      return { opacity: 0.6, isHighlighted: false, isDimmed: false };
    }

    // 3. Highlight the clicked service node
    if (nodeId === selectedNodeId) {
      return { opacity: 1, isHighlighted: true, isDimmed: false };
    }

    // 4. Calculate direct edge dependencies
    const isConnected = edges.some(
      (edge) =>
        (edge.source === selectedNodeId && edge.target === nodeId) ||
        (edge.target === selectedNodeId && edge.source === nodeId)
    );

    // 5. Apply the standard blast radius fade
    if (isConnected) {
      return { opacity: 1, isHighlighted: false, isDimmed: false };
    } else {
      return { opacity: 0.2, isHighlighted: false, isDimmed: true };
    }
  }

  // Cost Topology Logic
  // Cost Topology Logic
  if (activeLens === 'cost') {
    // 1. Containers don't have direct costs in this model, dim them
    if (isContainer(currentNode?.type)) {
      return { opacity: 0.3, isHighlighted: false, isDimmed: true, heatmapColor: undefined };
    }

    // 2. THE FIX: Safely extract and forcefully convert the cost to a real number
    const rawCost = (currentNode?.data as any)?.metrics?.estMonthlyCost;
    const cost = rawCost !== undefined ? Number(rawCost) : undefined;

    // 3. THE FIX: Check if it is missing OR if the conversion failed (isNaN)
    if (cost === undefined || isNaN(cost)) {
      return { opacity: 0.2, isHighlighted: false, isDimmed: true, heatmapColor: undefined };
    }

    // Ultra-light background tints with rich shadow glows
    let heatmapColor = "rgba(34, 197, 94, 0.04)"; // 4% Green tint
    let borderColor = "rgba(34, 197, 94, 0.4)";   // Crisp green border
    let shadowColor = "rgba(34, 197, 94, 0.15)";  // Soft green glow

    if (cost > 500) {
      heatmapColor = "rgba(239, 68, 68, 0.03)";   // 3% Red tint
      borderColor = "rgba(239, 68, 68, 0.5)";     // Crisp red border
      shadowColor = "rgba(239, 68, 68, 0.20)";    // Soft red glow
    } else if (cost > 100) {
      heatmapColor = "rgba(249, 115, 22, 0.04)";  // 4% Orange tint
      borderColor = "rgba(249, 115, 22, 0.5)";    // Crisp orange border
      shadowColor = "rgba(249, 115, 22, 0.15)";   // Soft orange glow
    }
    return {
      opacity: 1,
      isHighlighted: false,
      isDimmed: false,
      heatmapColor,
      borderColor,
      shadowColor
    };
  }

  // Default return for Structural View
  return { opacity: 1, isHighlighted: false, isDimmed: false, heatmapColor: undefined, borderColor: undefined };
}
