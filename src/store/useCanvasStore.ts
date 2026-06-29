// src/store/useCanvasStore.ts
import { create } from 'zustand';
import { temporal } from 'zundo';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { useLayerStore } from './layerStore';

// Import our mock data
import initialData from '../data/latestdata.json' assert { type: 'json' };
import { CloudNode, CloudEdge } from '../types/cloud';

// 🚀 FIX: Added 'security' to the allowed lens types
type LensType = 'structural' | 'blast-radius' | 'cost' | 'security';

// Define the TypeScript interface for our store
type CanvasState = {
  nodes: CloudNode[];
  edges: CloudEdge[];
  selectedNodeId: string | null;
  isLoading: boolean;

  setSelectedNodeId: (id: string | null) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  fetchInfrastructure: (snapshotId?: string | null) => Promise<void>;
  activeSnapshotId: string | null;
  setActiveSnapshotId: (id: string | null) => void;
  updateNodeDimensions: (id: string, width: number, height: number) => void;

  // AWS Account state
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  connectedAccounts: any[];
  fetchConnectedAccounts: () => Promise<void>;

  // Lens State
  activeLens: LensType;
  setActiveLens: (lens: LensType) => void;
  focusedNodeId: string | null;
  setFocusedNodeId: (id: string | null) => void;
  complianceFramework: 'general' | 'soc2' | 'hipaa';

  setComplianceFramework: (framework: 'general' | 'soc2' | 'hipaa') => void;

  // Live Stream State
  isLiveStreamActive: boolean;
  toggleLiveStream: () => void;
  tickTelemetry: () => void;

  // Tour State
  isTourActive: boolean;
  setTourActive: (active: boolean) => void;

  // Inspector State
  isInspectorPinned: boolean;
  setInspectorPinned: (pinned: boolean) => void;

  // Phase 3D: Edge hover traceability state
  // Excluded from zundo partialize so hover changes never pollute undo history.
  hoveredEdgeId: string | null;
  setHoveredEdgeId: (id: string | null) => void;
};

// Wrap the store creator in `temporal`
export const useCanvasStore = create<CanvasState>()(
  temporal(
    (set, get) => ({
      // TODO: Replace with a runtime validator (e.g. Zod) to ensure the imported JSON stays in sync with the CloudNode/CloudEdge types
      nodes: initialData.nodes as CloudNode[],
      edges: initialData.edges as CloudEdge[],
      isLoading: false,

      selectedNodeId: null,
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      activeSnapshotId: null,
      setActiveSnapshotId: (id) => set({ activeSnapshotId: id }),

      onNodesChange: (changes: NodeChange[]) => {
        // Fix 2: Filter out zero-dimension change events.
        // React Flow fires `dimensions` changes with { width: 0, height: 0 } during
        // the initial DOM measuring pass (before nodes are painted). Applying those
        // zeros would corrupt the stored width/height and make ELK pack everything
        // at the same point, which is also why manual auto-layout cannot recover.
        const safeChanges = changes.filter(c => {
          if (c.type === 'dimensions') {
            return (c.dimensions?.width ?? 0) > 0 && (c.dimensions?.height ?? 0) > 0;
          }
          return true;
        });

        let nextNodes = applyNodeChanges(safeChanges, get().nodes) as CloudNode[];
        
        // Sync dynamic DOM resizing to explicit node.width/height so the MiniMap updates accurately
        const hasDimensionChanges = safeChanges.some(c => c.type === 'dimensions');
        if (hasDimensionChanges) {
          nextNodes = nextNodes.map(node => {
            const dimChange = safeChanges.find(c => c.type === 'dimensions' && c.id === node.id);
            if (dimChange && dimChange.type === 'dimensions' && dimChange.dimensions) {
              return {
                ...node,
                width: dimChange.dimensions.width,
                height: dimChange.dimensions.height,
                style: {
                  ...(node.style || {}),
                  width: dimChange.dimensions.width,
                  height: dimChange.dimensions.height,
                }
              };
            }
            return node;
          });
        }
        
        set({ nodes: nextNodes });
      },
      updateNodeDimensions: (id: string, width: number, height: number) => {
        set((state) => ({
          nodes: state.nodes.map((node) => {
            if (node.id === id) {
              return {
                ...node,
                width,
                height,
                style: {
                  ...(node.style || {}),
                  width,
                  height,
                }
              };
            }
            return node;
          }),
        }));
      },
      onEdgesChange: (changes: EdgeChange[]) => {
        set({ edges: applyEdgeChanges(changes, get().edges) as CloudEdge[] });
      },
      onConnect: (connection: Connection) => {
        set({ edges: addEdge(connection, get().edges) as CloudEdge[] });
      },

      // AWS Account state
      selectedAccountId: null,
      setSelectedAccountId: (id) => set({ selectedAccountId: id }),
      connectedAccounts: [],
      fetchConnectedAccounts: async () => {
        try {
          const response = await fetch('/api/aws/accounts');
          if (response.ok) {
            const data = await response.json();
            set({ connectedAccounts: Array.isArray(data) ? data : (data.accounts || []) });
          }
        } catch (error) {
          console.error("Error fetching connected accounts:", error);
        }
      },

      activeLens: 'structural',
      setActiveLens: (lens) => set({ activeLens: lens }),

      focusedNodeId: null,
      setFocusedNodeId: (id) => set({ focusedNodeId: id }),

      complianceFramework: 'general',
      setComplianceFramework: (framework) => set({ complianceFramework: framework }),

      isLiveStreamActive: false,


      toggleLiveStream: () => set((state) => ({ isLiveStreamActive: !state.isLiveStreamActive })),

      isTourActive: false,
      setTourActive: (active) => set({ isTourActive: active }),

      isInspectorPinned: false,
      setInspectorPinned: (pinned) => set({ isInspectorPinned: pinned }),

      // Phase 3D: Edge hover traceability
      hoveredEdgeId: null,
      setHoveredEdgeId: (id) => set({ hoveredEdgeId: id }),

      tickTelemetry: () => set((state) => {
        const newNodes = state.nodes.map(node => {
          // Skip nodes that don't have telemetry (like the AZ wrapper)
          if (!node.data?.telemetryData || !Array.isArray(node.data.telemetryData)) return node;

          const currentData = [...node.data.telemetryData];
          const lastPoint = currentData[currentData.length - 1];

          // Generate a live timestamp (HH:MM:SS)
          const now = new Date();
          const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

          const newPoint: any = { time: timeString };

          // Apply random jitter to all numeric metrics to simulate live traffic
          Object.keys(lastPoint).forEach(key => {
            if (key !== 'time') {
              let val = Number(lastPoint[key]);
              let jitter = 0;

              if (val === 0) {
                // THE SMART DEFIBRILLATOR:
                // If a metric naturally hits 0 (like an empty SQS queue), we give it
                // a 30% chance to randomly spawn 1-5 new events to jump-start the math.
                jitter = Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0;
              } else {
                // Normal percentage-based chaos
                jitter = val * (Math.random() * 1.6 - 0.8);
              }

              // Apply jitter, ensuring it never goes negative
              newPoint[key] = Math.max(0, Math.floor(val + jitter));
            }
          });

          // Append new data and keep the array constrained to 6 data points to prevent memory leaks
          currentData.push(newPoint);
          if (currentData.length > 6) currentData.shift();

          return {
            ...node,
            data: { ...node.data, telemetryData: currentData }
          };
        });

        return { nodes: newNodes };
      }),

      fetchInfrastructure: async (snapshotId) => {
        if (get().isLoading) return;
        set({ isLoading: true });
        try {
          const activeSnap = snapshotId !== undefined ? snapshotId : get().activeSnapshotId;
          const accountId = get().selectedAccountId;
          let url = '/api/infrastructure';
          if (activeSnap) {
            url = `/api/history?snapshot_id=${activeSnap}`;
          } else if (accountId) {
            url = `/api/infrastructure?account_id=${accountId}`;
          }
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to capture cloud layout topology');
          const data = await response.json();

          // ADDON: Validate parent references and purge ghost groups before setting state
          const { validateParentRefs, purgeGhostGroups, normalizeEdges } = await import('../lib/layout/nodeUtils');
          const { setInitialScatterPositions, sortByParentFirst } = await import('../lib/layout/gravityLayout');
          const safeNodes = validateParentRefs(data.nodes);
          const cleanNodes = purgeGhostGroups(safeNodes, data.edges);
          const cleanEdges = normalizeEdges(data.edges);
          const scattered = setInitialScatterPositions(cleanNodes);

          // Fix 1: Pause Zundo history tracking before committing the scatter-position
          // (opacity:0) nodes. Without this, the 250ms debounce fires and snapshots
          // the pre-ELK state, which then becomes the "past" state for undo — meaning
          // any undo replay would restore invisible, zero-positioned nodes.
          // ArchitectureCanvas.executeAutoLayout will call temporal.resume() once ELK
          // has written the final layouted positions to the store.
          useCanvasStore.temporal.getState().pause();

          set({
            nodes: sortByParentFirst(scattered) as CloudNode[],
            edges: cleanEdges as CloudEdge[],
            isLoading: false
          });
        } catch (error) {
          console.error("Hydration Error for rendering topology:", error);
          // Resume temporal on error so undo/redo are not permanently broken
          useCanvasStore.temporal.getState().resume();
          set({ isLoading: false });
        }
      }
    }),
    {
      // Partialize: Tell Zundo exactly what to track for undo/redo
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
      // Debounce the history snapshots
      handleSet: (originalHandleSet) => {
        let timeout: ReturnType<typeof setTimeout>;
        return (pastState, replace) => {
          clearTimeout(timeout);
          // Wait 250ms after the last change before saving to history
          timeout = setTimeout(() => {
            originalHandleSet(pastState, replace);
          }, 250);
        };
      },
    }
  )
);