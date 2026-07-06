# Frontend Engineering Notes

### Why this module exists
To provide a highly interactive, animated, and visually engaging dashboard for users to explore and analyze their cloud infrastructure topologies.

### Business purpose
Translates the backend's raw JSON graph data into an intuitive "single pane of glass." This allows engineers, architects, and security teams to visually comprehend complex AWS environments, identify structural vulnerabilities, analyze cost distribution, and track changes over time without writing queries.

### Technical purpose
Implements a modern Next.js (React) application that integrates `@xyflow/react` for node and edge rendering, `elkjs` for complex mathematical graph layouts, and Zustand for scalable client-side state management (including undo/redo capabilities).

### Folder structure
All relevant files reside in `src/`:
*   `app/`: Next.js App Router pages (e.g., the dashboard entry point).
*   `components/canvas/`: Core React Flow integration components (`ArchitectureCanvas.tsx`, `AnimatedEdge.tsx`).
*   `components/nodes/`: Custom React components representing specific AWS services on the canvas (e.g., `LambdaNode`, `Ec2Node`).
*   `hooks/`: Reusable React hooks for domain logic (`useLayerEngine.ts`).
*   `lib/layout/`: Pure functions and hooks for algorithmic layout calculation (`gravityLayout.ts`, `useAutoLayout.ts`, `nodeUtils.ts`).
*   `store/`: Zustand state definitions and selectors (`useCanvasStore.ts`, `layerStore.ts`).

### Classes & Interfaces
*   **Interfaces:** `CloudNode` and `CloudEdge` (TypeScript interfaces extending standard `@xyflow/react` types to include custom data properties like telemetry and metadata).
*   **State Stores:** `useCanvasStore` (manages nodes, edges, active lenses) and `useLayerStore` (manages visibility filters).

### Functions
*   `fetchInfrastructure(snapshotId)`: Async function inside `useCanvasStore` that queries the backend (`/api/infrastructure` or `/api/history`) and normalizes the payload.
*   `triggerLayout(nodes, edges)`: Exposed by `useAutoLayout`, this wraps the ELK layout engine with loading states and hashing to prevent redundant recalculations.
*   `computeVisibleNodes` / `computeVisibleEdges`: Pure functions driven by `useLayerEngine` to filter the total graph down to what should currently be rendered based on user-toggled layers.
*   `tickTelemetry()`: Simulates live telemetry updates by applying mathematical jitter to metric values, updating the node state on an interval.

### Workflow
1.  **Hydration:** Upon loading the dashboard, `fetchInfrastructure` queries the FastAPI backend.
2.  **Sanitization:** The raw nodes are cleansed (ghost groups purged, parent references validated) by utility functions in `nodeUtils.ts`.
3.  **Layout Computation:** `useAutoLayout` passes the raw data to `elkjs` to calculate actual `x` and `y` positions based on parent-child containment.
4.  **State Committal:** Positioned nodes and normalized edges are stored in the `useCanvasStore` (tracked by Zundo for undo/redo).
5.  **Filtering:** `useLayerEngine` dynamically applies active filter layers (e.g., hiding IAM permissions), outputting `visibleNodes` and `visibleEdges`.
6.  **Rendering:** `ArchitectureCanvas` passes the visible arrays into `@xyflow/react` for DOM/SVG rendering. User interactions immediately update Zustand, triggering fast re-renders.

### Inputs
*   **Backend Payloads:** JSON responses containing unpositioned nodes and semantic edges from the FastAPI API.
*   **User Interactions:** Toggling layers, dragging nodes, changing lenses, clicking undo/redo.

### Outputs
*   **DOM State:** Highly customized, nested HTML/SVG canvas elements.
*   **API Calls:** Requests to backend endpoints for historical snapshots or different AWS accounts.

### Algorithms
*   **Auto Layout (`gravityLayout.ts`):** Uses the ELK (Eclipse Layout Kernel) algorithm specifically optimized for layered directed graphs. It correctly sizes parent nodes (like Subnets) to mathematically encompass their dynamically sized children.
*   **Layer Blending (`useLayerEngine.ts`):** Reacts to layer state changes to dynamically detach orphans. If a parent container is filtered out by a layer, the algorithm dynamically strips the `parentId` from its children so React Flow doesn't crash, allowing the children to float independently.
*   **Depth Map Calculation:** Computes structural hierarchy depth (VPC=0 → AZ=1 → Subnet=2) to sequence layout animations, ensuring parents animate before children for a smooth visual transition.

### Dependencies
*   `Next.js` (App Router)
*   `@xyflow/react` (Canvas rendering engine)
*   `zustand` (State management) + `zundo` (Temporal undo/redo history)
*   `elkjs` (Graph layout mathematics)
*   `framer-motion` (UI animations and micro-interactions)

### Error handling
*   **Layout Safety:** `useAutoLayout` uses strict `try/catch` blocks. If ELK fails to compute a layout (e.g., due to an impossible constraint), the engine returns `null` rather than crashing the React tree.
*   **Parent Reference Validation:** React Flow throws hard exceptions if a node references a non-existent `parentId`. The `nodeUtils.ts` pre-processes payloads to strip invalid parent references before they ever reach the canvas.

### Tradeoffs
*   **Client-Side vs. Backend Layout:** The backend sends completely unpositioned nodes (`x: 0, y: 0`) and relies entirely on the client's browser CPU to compute the ELK layout. This keeps the backend highly scalable but can cause brief layout blocking (loading spinners) on the client for massive AWS graphs.
*   **Simulated vs. Real Telemetry:** Features like `tickTelemetry` simulate real-time metrics for UX demonstration purposes using random jitter, intentionally decoupling the UI from what would otherwise require complex backend WebSockets.

### Known limitations
*   **SVG Scaling Constraints:** Extremely large graphs (10k+ nodes) may cause significant FPS drops, as `@xyflow/react` renders DOM/SVG nodes rather than WebGL.
*   **Hover History:** The edge hover state (`hoveredEdgeId`) is explicitly excluded from Zundo's `partialize` configuration to prevent history bloat. Consequently, hover states are not perfectly restored when a user clicks "Undo."

### Performance considerations
*   **Debounced History:** `zundo` undo/redo snapshots are debounced at 250ms. This prevents the browser memory from being flooded with thousands of state snapshots while a user smoothly drags a node across the screen.
*   **Hash Guarding:** `useAutoLayout` computes a cheap, stringified hash of node and edge IDs to detect structural changes. It uses this hash to completely skip expensive ELK calculations if the topology hasn't fundamentally changed.

### Future improvements
*   **Web Worker Layout:** Shift `elkjs` layout calculations from the main React thread into a Web Worker to prevent UI freezing during massive graph computations.
*   **True Real-Time Metrics:** Replace the simulated `tickTelemetry` with actual WebSockets or Server-Sent Events (SSE) streaming live CloudWatch metrics from the backend.
