# Layout Engine Engineering Notes

### Why this module exists
To automatically arrange complex cloud architecture graphs in a readable, visually pleasing way on the React Flow canvas, eliminating the need for manual user drag-and-drop.

### Business purpose
Cloud environments can contain thousands of interconnected resources. Without an automatic layout, a scanned environment would appear as an overlapping, unusable mess. This engine automatically untangles the graph, correctly visually groups resources by boundaries (VPCs, Subnets), and presents a professional, structured architectural diagram instantly.

### Technical purpose
Wraps the `elkjs` (Eclipse Layout Kernel) library. It translates React Flow's flat node array (which uses `parentId` fields to denote hierarchy) into a deeply nested compound ELK graph. It executes the ELK layout algorithm with highly tuned constraints (e.g., Right-facing, Orthogonal edges), and translates the resulting coordinate system back to React Flow's parent-relative constraints.

### Folder structure
All layout logic is isolated in `src/lib/layout/`:
*   `gravityLayout.ts`: The main ELK integration pipeline and core layout algorithms.
*   `nodeUtils.ts`: Pre-processing guards, graph validation, and edge visual normalization.
*   `useAutoLayout.ts`: The React hook that connects `gravityLayout` to the Zustand store and manages asynchronous loading states.

### Classes
*   No formal classes are used. The module relies entirely on pure functional transformations operating on React Flow `Node` and `Edge` arrays.

### Functions
*   **`gravityLayout.ts`:**
    *   `runGravityLayout()`: The primary entry point. Orchestrates the 6-phase layout pipeline.
    *   `classifyNodes()`: Segregates connected graph nodes from isolated/unconnected leaf nodes.
    *   `toElkNode()` / `buildElkGraph()`: Constructs the hierarchical, recursive ELK data structure.
    *   `runElkWithTimeout()`: Executes ELK with a strict 5-second WebWorker/Promise safeguard.
    *   `applyElkPositions()`: Maps ELK X/Y coordinates back to React Flow.
    *   `positionUnconnectedNodes()`: Arranges isolated resources in a neat mathematical grid.
    *   `sortByParentFirst()`: A topological BFS sort ensuring React Flow renders parent container DOM nodes before their children.
    *   `emergencyGridFallback()`: A failsafe layout applied if ELK crashes or times out.
*   **`nodeUtils.ts`:**
    *   `purgeGhostGroups()`: Removes empty VPC/Subnet containers that have no children or edges.
    *   `validateParentRefs()`: Fixes broken parent-child links (promoting orphans to root) to prevent React Flow crashes.
    *   `normalizeEdges()`: Applies specific visual styling (e.g., dashed lines for IAM, red for triggers).
    *   `validateParentAssignmentDepth()`: Diagnostics to detect backend normalizer bugs (e.g., EC2 assigned to a VPC instead of a Subnet).

### Workflow
The `runGravityLayout` pipeline executes in distinct phases:
1.  **Preparation:** Non-structural edges (like IAM permissions) are filtered out so they don't pull layout geometry out of shape. Nodes are classified into "ELK" (connected) and "Unconnected" buckets.
2.  **ELK Graph Construction:** The ELK bucket is recursively mapped into a nested object structure, applying specific layout directives (e.g., `'elk.direction': 'RIGHT'`, `'elk.algorithm': 'layered'`).
3.  **Execution:** `elkjs` runs asynchronously, constrained by a 5-second timeout race condition.
4.  **Application:** The resulting relative X/Y coordinates are written back into the React Flow node state objects.
5.  **Unconnected Grid:** Isolated nodes (e.g., unused S3 buckets) are plotted in a strict grid positioned safely to the right of the main ELK graph's bounding box.
6.  **Sorting:** A topological sort ensures parent nodes appear in the array before their children, a strict requirement for React Flow's DOM rendering engine.

### Inputs
*   React Flow `Node[]` and `Edge[]` arrays.
*   Optional dimensions map (`nodeDimensions`) mapping node IDs to their measured width/height.

### Outputs
*   A new object `{ nodes: Node[], edges: Edge[] }` containing the React Flow arrays with accurately populated `position: {x, y}` coordinates.

### Algorithms
*   **ELK Layered Algorithm:** Utilizes Network Simplex for node placement, Layer Sweep for crossing minimization, and Orthogonal edge routing.
*   **Grid Packing:** Simple modulo/division math to pack unconnected nodes into tight rows/columns.
*   **Topological BFS Sorting:** Ensures hierarchical integrity for React Flow.

### Dependencies
*   `elkjs/lib/elk.bundled` (The core Eclipse Layout Kernel algorithm, compiled to JS).
*   `@xyflow/react` (For strictly typing the Node and Edge interfaces).

### Error handling
*   **Timeout Guard:** `runElkWithTimeout` enforces a strict 5000ms timeout.
*   **Failsafe Fallback:** A global `catch` block in `runGravityLayout` intercepts any ELK crash (e.g., caused by impossible graph geometries or OOM) and falls back to a safe `emergencyGridFallback` layout so the user still sees their data, albeit unorganized.
*   **Pre-processing Guards:** `validateParentRefs` actively intercepts and patches malformed hierarchy trees arriving from the backend before they can crash the UI.

### Tradeoffs
*   **ELK vs Dagre:** The application heavily relies on ELK rather than the simpler Dagre library. ELK natively supports deeply nested compound nodes (e.g., Region -> VPC -> Subnet -> EC2), which Dagre struggles with. The tradeoff is a significantly larger JS bundle size and slightly slower execution times due to ELK's algorithmic complexity.
*   **Main Graph vs Unconnected Grid:** Isolated nodes are explicitly stripped out of the ELK engine and plotted in a separate side grid. This drastically speeds up ELK's execution time and prevents massive, sprawling horizontal layouts caused by ELK trying to space out hundreds of unlinked nodes.

### Known limitations
*   **Main Thread Blocking:** ELK is currently imported from `elk.bundled` and executed directly on the main UI thread. A massive graph computation will freeze the browser tab for up to 5 seconds before the timeout triggers.

### Performance considerations
*   **Constraint Tuning:** Specific ELK algorithms (e.g., `'elk.layered.cycleBreaking.strategy': 'GREEDY'`) are explicitly chosen to prioritize layout execution speed over absolute perfect visual geometries.
*   **Unconnected Pruning:** Bypassing ELK entirely for unconnected nodes saves immense computational overhead.

### Future improvements
*   **Web Worker Offloading:** Move the ELK execution into a Web Worker to prevent UI thread blocking during massive graph layouts, allowing the UI to show a smooth loading spinner.
*   **Incremental Layouts:** Implement ELK's incremental layout support so that moving a single node or expanding a single group doesn't require re-calculating the entire graph from scratch.
