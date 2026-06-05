'use client';

import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  Position,
  type EdgeProps,
} from '@xyflow/react';

import { useCanvasStore } from '../../store/useCanvasStore';

export default function AnimatedEdge({
  id,
  source,
  target,
  style = {},
  label,
  markerEnd,
}: EdgeProps) {
  // 1. Hook into React Flow's internal state to watch node coordinates in real-time
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  //  NEW: Pull the global lens state to determine visibility
  const activeLens = useCanvasStore((state) => state.activeLens);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);

  //  NEW: Calculate if this specific edge should be dimmed
  const isBlastRadiusMode = activeLens === 'blast-radius' && selectedNodeId !== null;
  const isConnectedToSelected = source === selectedNodeId || target === selectedNodeId;

  // If we are in blast radius mode, and this edge DOES NOT connect to the selected node, dim it.
  const isDimmed = isBlastRadiusMode && !isConnectedToSelected;
  const currentOpacity = isDimmed ? 0.1 : 1;

  // If the nodes haven't rendered yet, don't draw the edge
  if (!sourceNode || !targetNode) return null;

  // 2. Calculate the exact center points of both nodes
  const sWidth = sourceNode.measured?.width || 200;
  const sHeight = sourceNode.measured?.height || 100;
  const sourceX = sourceNode.internals.positionAbsolute.x + sWidth / 2;
  const sourceY = sourceNode.internals.positionAbsolute.y + sHeight / 2;

  const tWidth = targetNode.measured?.width || 200;
  const tHeight = targetNode.measured?.height || 100;
  const targetX = targetNode.internals.positionAbsolute.x + tWidth / 2;
  const targetY = targetNode.internals.positionAbsolute.y + tHeight / 2;

  // 3. Determine the relative angle between the nodes
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  let sourcePos = Position.Right;
  let targetPos = Position.Left;

  // 4. Boundary Math: Move the connection point from the center to the outer edge of the node
  let finalSourceX = sourceX;
  let finalSourceY = sourceY;
  let finalTargetX = targetX;
  let finalTargetY = targetY;

  if (Math.abs(dx) > Math.abs(dy)) {
    sourcePos = dx > 0 ? Position.Right : Position.Left;
    targetPos = dx > 0 ? Position.Left : Position.Right;

    finalSourceX += dx > 0 ? sWidth / 2 : -(sWidth / 2);
    finalTargetX += dx > 0 ? -(tWidth / 2) : tWidth / 2;
  } else {
    sourcePos = dy > 0 ? Position.Bottom : Position.Top;
    targetPos = dy > 0 ? Position.Top : Position.Bottom;

    finalSourceY += dy > 0 ? sHeight / 2 : -(sHeight / 2);
    finalTargetY += dy > 0 ? -(tHeight / 2) : tHeight / 2;
  }

  // 5. Generate the smooth curve based on our dynamic math
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: finalSourceX,
    sourceY: finalSourceY,
    sourcePosition: sourcePos,
    targetX: finalTargetX,
    targetY: finalTargetY,
    targetPosition: targetPos,
  });

  // 6. THE UPGRADE: Parse the semantic telemetry context
  const lowerLabel = typeof label === 'string' ? label.toLowerCase() : '';

  let strokeColor = '#cbd5e1';      // Default: Slate 300
  let particleColor = '#94a3b8';    // Default: Slate 400
  let strokeDasharray = undefined;
  let duration = '3s';              // Transmission latency
  let particleRadius = 3;

  if (lowerLabel.includes('post') || lowerLabel.includes('http') || lowerLabel.includes('api')) {
    // API / Synchronous HTTP traffic: High-frequency cyan pulses
    strokeColor = '#e2e8f0';
    particleColor = '#06b6d4';
    duration = '1.4s';
    particleRadius = 3.5;
  } else if (lowerLabel.includes('trigger') || lowerLabel.includes('event')) {
    // Event Orchestration: Rapid, snapping orange alert waves
    strokeColor = '#fed7aa';
    particleColor = '#ea580c';
    duration = '0.9s';
    strokeDasharray = '4,4';
  } else if (lowerLabel.includes('read') || lowerLabel.includes('write') || lowerLabel.includes('state')) {
    // Relational Databases / High-Volume Streams: Fluid blue currents
    strokeColor = '#dbeafe';
    particleColor = '#2563eb';
    duration = '2.4s';
    particleRadius = 4;
  } else if (lowerLabel.includes('store') || lowerLabel.includes('asset') || lowerLabel.includes('s3')) {
    // Storage Pipelines: Structured green blocks
    strokeColor = '#bbf7d0';
    particleColor = '#16a34a';
    duration = '4s';
    strokeDasharray = '6,6';
  }

  if (activeLens === 'cost') {
    strokeColor = '#f1f5f9';      // slate-100 (Very faint line)
    particleColor = '#cbd5e1';    // slate-300 (Subtle gray moving dots)
    // Optional: You could also dim the duration so they move slower and distract less
    duration = '4s';
  }
  return (
    <>
      <defs>
        <marker
          id={`arrow-${id}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          {/* Apply opacity to the arrowhead */}
          <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} fillOpacity={currentOpacity} className="transition-opacity duration-300" />
        </marker>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#arrow-${id})`}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: 2,
          strokeDasharray,
          opacity: currentOpacity, // <-- Apply opacity to the main line
          transition: 'stroke 0.3s, stroke-width 0.3s, opacity 0.3s',
        }}
      />

      {/* Apply opacity to the flying data particle */}
      <circle r={particleRadius} fill={particleColor} style={{ opacity: currentOpacity }} className="blur-[0.5px] transition-opacity duration-300">
        <animateMotion
          dur={duration}
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 20}px)`,
              // If dimmed, disable pointer events so the user can't accidentally click a hidden label
              pointerEvents: isDimmed ? 'none' : 'auto',
              color: particleColor,
              borderColor: strokeColor,
              boxShadow: `0 4px 12px -4px ${strokeColor}`,
              zIndex: 100,
              opacity: currentOpacity, // <-- Apply opacity to the HTML label
            }}
            className="nodrag nopan bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl px-3 py-1 rounded-full border-2 text-[10px] font-black shadow-sm uppercase tracking-widest transition-all duration-300"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}