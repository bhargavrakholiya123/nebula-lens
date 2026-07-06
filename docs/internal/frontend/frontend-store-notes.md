# State Management Engine / Frontend Store Engineering Notes

### Why this module exists
To manage the highly interactive and volatile frontend state of the cloud architecture diagram (nodes, edges, active lenses, metadata, and visual layers) entirely outside of React's standard component hierarchy.

### Business purpose
Delivers a fluid, responsive, and robust user experience. It powers advanced UI capabilities like "Time Travel" (Undo/Redo) for layout changes, ensures the UI does not freeze when rendering thousands of cloud resources, and drives the "Live Stream" animations that make the architecture feel alive.

### Technical purpose
Implements the Zustand state management library to hold the global "source of truth" for the React Flow canvas. It is responsible for handling API hydration, intercepting user drag/resize events, orchestrating the geometry of grouped elements, managing overlay visibility (`layerStore`), and utilizing middleware (`zundo`) to maintain a temporal history stack for undo capabilities.

### Folder structure
Located in the frontend store directory:
*   `src/store/useCanvasStore.ts`: The monolithic primary store for layout, data fetching, and canvas interaction.
*   `src/store/layerStore.ts`: A specialized side-store for managing visual overlay layers and blend priorities.

### Classes
*   N/A (Zustand utilizes functional closures and hooks rather than OOP classes).

### Functions
*   **`useCanvasStore.ts`**:
    *   `fetchInfrastructure()`: Hydrates the canvas by fetching from `/api/infrastructure`, running the data through the gravity layout engine, and saving it to state.
    *   `onNodesChange()`: Intercepts React Flow node updates (dragging, resizing). Contains custom logic to sync dynamic DOM resizing back to explicit style dimensions so the minimap stays accurate.
    *   `tickTelemetry()`: Background generator that simulates live AWS metrics traffic.
*   **`layerStore.ts`**:
    *   `registerLayer()`, `toggleLayer()`, `setLayerOpacity()`: Manages the visibility and blend state of specific UI overlays.
    *   `exportConfig()` / `importConfig()`: Allows serializing the current layer configuration to save or share.

### Workflow
1.  **Hydration:** The React UI mounts and calls `fetchInfrastructure()`. The store calls the backend API, purges ghost nodes via `nodeUtils`, runs the `gravityLayout` engine, and saves the pristine `nodes` and `edges` arrays to the store.
2.  **Interaction:** The `ArchitectureCanvas` subscribes to the store. When a user drags a node, React Flow fires a `NodeChange` event. `onNodesChange` applies the mathematical changes and updates the global state, triggering a targeted re-render.
3.  **Temporal Tracking:** Every time `nodes` or `edges` mutate, the `zundo` middleware automatically captures a deep-copy snapshot of the layout and pushes it to a history stack.
4.  **Live Animation:** When Live Stream is active, `tickTelemetry()` executes on a loop. It updates the numerical metric arrays inside specific nodes, triggering React to re-render the charts/badges inside those nodes without reloading the entire canvas layout.

### Inputs
*   REST API payloads from the backend (`/api/infrastructure`, `/api/history`).
*   User-driven `NodeChange` and `EdgeChange` payload events from `@xyflow/react`.
*   User clicks (layer toggles, lens selections, node selections).

### Outputs
*   Bound React hooks (`useStore(useCanvasStore)`) that provide synchronous state updates to the React Flow component, the Layer Panel, and Contextual Inspectors.

### Algorithms
*   **Debounced Temporal Snapshotting:** `zundo` is configured with a custom `handleSet` interceptor that debounces state saves by 250ms. Without this algorithm, dragging a node across the screen (which fires 60 times a second) would instantly crash the browser tab by filling the heap memory with thousands of deep copies of the entire architecture array.
*   **Telemetry Jitter ("Smart Defibrillator"):** A specialized math routine inside `tickTelemetry` simulates live traffic by appending randomized percentage-based jitter to numerical metrics. It specifically detects metrics resting at `0` (like empty SQS queues) and gives them a 30% chance to "jump-start" with synthetic data points, ensuring the UI remains visually active even when the real architecture is idle.

### Dependencies
*   `zustand`: Core state management library.
*   `zundo`: Zustand middleware for Temporal state (Undo/Redo capabilities).
*   `@xyflow/react`: For the core `applyNodeChanges` and `applyEdgeChanges` math utilities.

### Error handling
*   **Fault-Tolerant Hydration:** `fetchInfrastructure` wraps its API call in a `try/catch`. If the backend crashes or times out, it catches the error, logs it to the console, and resets the `isLoading` spinner. It does *not* throw the error upward, which prevents the React tree from encountering a fatal crash (White Screen of Death).

### Tradeoffs
*   **Store Bloat vs. State Synchronization:** The developers split visual layer toggles into `layerStore.ts`, but kept nearly everything else (canvas layout, AWS account selection, telemetry ticks, compliance frameworks) inside `useCanvasStore.ts`. This monolithic approach makes the file large (280+ lines), trading architectural modularity for the convenience of having all core state accessible from a single hook without complex inter-store syncing.

### Known limitations
*   **Partialize Leaks:** The store uses `partialize: (state) => ({ nodes, edges })` to tell `zundo` to *only* track the architecture layout for the Undo/Redo history stack. The developer explicitly notes that `hoveredEdgeId` is excluded so hovering doesn't pollute the history. However, other rapid state changes could theoretically still trigger history saves if they inadvertently mutate node structures.

### Performance considerations
*   **Immutable Updates:** Zustand enforces immutable state updates. Generating a new array reference for thousands of nodes every time a single node is dragged puts pressure on the Javascript Garbage Collector. This is why `React.memo` is strictly enforced on the custom node components (as discovered in the Visualization audit).

### Future improvements
*   **Real WebSocket Telemetry:** Rip out the synthetic `tickTelemetry` jitter algorithm from the frontend store entirely, and replace it with a real WebSocket or Server-Sent-Events (SSE) listener that updates the store with authentic live metrics streamed directly from AWS CloudWatch.
