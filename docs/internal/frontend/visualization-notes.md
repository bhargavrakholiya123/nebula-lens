# Visualization Module Engineering Notes

### Why this module exists
To render the raw cloud infrastructure topology fetched from the backend as an interactive, highly styled, and readable graphical diagram on a web canvas.

### Business purpose
Provides a visually stunning, intuitive "single pane of glass" for cloud architects and engineers. It enables users to understand complex AWS topologies, spot architectural flaws, and visualize costs or security risks instantly without digging through endless AWS console menus.

### Technical purpose
Acts as a sophisticated wrapper around the `@xyflow/react` (React Flow) library. It maps backend JSON objects to specialized React components, orchestrates complex node interpolation animations, handles user interactions (panning, zooming, clicking), and dynamically applies visual "Lenses" (e.g., dimming non-compute nodes when the Cost lens is active).

### Folder structure
All visualization rendering logic lives in `src/components/`:
*   `canvas/`: Contains `ArchitectureCanvas.tsx` (the core container) and custom elements like `AnimatedEdge.tsx`.
*   `nodes/`: Contains individual React components for every supported AWS service (e.g., `Ec2Node.tsx`, `LambdaNode.tsx`, `VpcNode.tsx`).
*   `ui/`: Contains the overlay UI elements floating above the canvas, such as `LensToolbar`, `ContextualInspector`, and `CommandPalette`.

### Classes
*   No standard classes. The entire visualization layer is composed of React Functional Components and custom Hooks.

### Functions
*   **`ArchitectureCanvas()`**: The main component. Configures the `<ReactFlow>` context, binds it to the Zustand store, and orchestrates loading states and toolbars.
*   **`animateTransition()`**: A custom `requestAnimationFrame` loop utilizing a mathematical `springEase` function to interpolate nodes from their old positions to new ELK-calculated positions smoothly.
*   **Node Components (e.g., `LambdaNode`)**: Individual renderers. They consume the `useLensVisuals()` hook to determine exactly how they should look (opacity, borders, badges) at any given 60fps frame.

### Workflow
1.  **State Hydration:** The backend API returns nodes and edges; the Zustand `CanvasStore` updates.
2.  **Mapping:** React Flow iterates over the store's nodes, mapping the backend `node.type` (e.g., "lambdaNode") to the registered React component in the `nodeTypes` object.
3.  **Rendering:** Each custom Node component renders as an HTML `<div>` inside the React Flow viewport, applying Framer Motion states for hover/tap effects.
4.  **Lenses:** When a user selects a Lens (e.g., "cost"), the `useLensVisuals` hook inside every node instantly evaluates the node's data. If it has a high cost, it renders a price badge; if it is irrelevant, it applies `grayscale` and lowers opacity.
5.  **Layout Transitions:** When the user clicks "Auto Layout", `animateTransition()` overrides the node positions, flying them to their new ELK-computed coordinates using a depth-staggered delay (VPCs move first, then Subnets, then Resources).

### Inputs
*   Zustand store state: `nodes`, `edges`, `activeLens`, `selectedNodeId`.
*   User input events (mouse wheel zoom, drag, click).

### Outputs
*   An interactive React DOM hierarchy (mixing HTML standard elements and SVG paths for edges).

### Algorithms
*   **Spring Easing (`springEase`):** A mathematical interpolation function (`1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 0.5)`) used to give node movements a fast start with a gentle, premium-feeling overshoot when settling into new layout coordinates.

### Dependencies
*   `@xyflow/react` (Core graphing engine and viewport math).
*   `framer-motion` (Micro-animations and hover states).
*   `zustand` (State management providing the data to render).
*   `next-themes` (For toggling canvas backgrounds and stroke colors between Dark/Light modes).

### Error handling
*   **Mount/Hydration:** A strict `mounted` state check ensures that Next.js SSR (Server-Side Rendering) does not attempt to render the canvas on the server, which would crash due to missing `window` objects.
*   **Loading Overlays:** While the asynchronous ELK layout engine is running, the canvas blocks rendering and displays a `CanvasSkeleton` or a "Measuring architecture..." overlay to prevent flashes of unstyled or overlapping nodes.

### Tradeoffs
*   **DOM vs. WebGL/Canvas2D:** React Flow renders nodes as standard HTML DOM elements (`<div>`) rather than drawing them on a literal `<canvas>`. This allows extreme styling flexibility (CSS-in-JS, Tailwind, Framer Motion) and accessibility. However, it trades off raw performance; the browser DOM struggles to render thousands of complex HTML elements concurrently compared to WebGL.
*   **Custom Animation vs. Built-in:** The developers opted to build a custom `requestAnimationFrame` loop (`animateTransition`) instead of relying on React Flow's native layout transitions. This requires more manual code but grants precise control over the spring physics and allows for "depth-staggering" (moving containers before their contents).

### Known limitations
*   **FPS Drops at Scale:** Because it relies entirely on the HTML DOM, the browser will likely drop frames (lag) when zooming or panning a massive enterprise graph (>2,000 resources) if the viewport is zoomed out to show everything at once.

### Performance considerations
*   **Aggressive Memoization:** Every single custom Node component (e.g., `LambdaNode`) is explicitly wrapped in `React.memo`. This is a critical guardrail; without it, simply clicking the canvas would cause React Flow to re-render all 500+ node components simultaneously.
*   **MiniMap Optimization:** The `MiniMap` component is heavily overridden to return raw hexadecimal color strings instead of React components, keeping the mini-map rendering highly performant even when zoomed out.

### Future improvements
*   **Viewport Virtualization:** Integrate React Flow's viewport limits or a custom Intersection Observer to unmount or simplify (`display: none`) the HTML of nodes that are currently panned off-screen or zoomed out too far to read.
*   **WebGL Fallback:** If enterprise accounts consistently exceed DOM limits, evaluate React Flow's experimental WebGL rendering engine for "zoomed out" macro views, transitioning to HTML nodes only when zoomed in close.
