'use client';
import React, { useEffect } from 'react';
import { ReactFlow, Background, Controls, Panel } from '@xyflow/react';

import { useStore } from 'zustand';
import { useCanvasStore } from '../../store/useCanvasStore';

import LambdaNode from '../nodes/LambdaNode';
import S3Node from '../nodes/S3Node';
import DatabaseNode from '../nodes/DatabaseNode';

import AnimatedEdge from './AnimatedEdge';

const nodeTypes = {
  lambdaNode: LambdaNode,
  s3Node: S3Node,
  databaseNode: DatabaseNode,
};

const edgeTypes = {
  animatedEdge: AnimatedEdge,
};

export default function ArchitectureCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useCanvasStore();

  // Hook into the temporal store to get our time-travel functions and state
  const { undo, redo, pastStates, futureStates } = useStore(
    useCanvasStore.temporal,
    (state) => state
  );


  // 2. THE KEYBOARD SHORTCUTS ENGINE
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the user is pressing Ctrl (Windows) or Command (Mac)
      const modifier = event.ctrlKey || event.metaKey;

      // UNDO: Ctrl+Z (but NOT holding Shift)
      if (modifier && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault(); // Stop the browser's default undo
        if (pastStates.length > 0) undo();
      }

      // REDO: Ctrl+Y OR Ctrl+Shift+Z
      if (
        (modifier && event.key.toLowerCase() === 'y') ||
        (modifier && event.key.toLowerCase() === 'z' && event.shiftKey)
      ) {
        event.preventDefault();
        if (futureStates.length > 0) redo();
      }
    };

    // Attach the listener when the component loads
    document.addEventListener('keydown', handleKeyDown);

    // Clean up the listener when the component unmounts
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, pastStates.length, futureStates.length]);

  return (
    // A subtle dotted background helps the glassmorphism pop
    <div className="w-full h-screen bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes} // Register it here!
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        defaultEdgeOptions={{ type: 'animatedEdge' }}
      >
        <Background color="#cbd5e1" gap={20} size={2} />
        <Controls />
        {/*The Undo/Redo Floating Panel */}
        <Panel position="top-left" className="bg-white/80 backdrop-blur-md p-2 rounded-xl shadow-sm border border-slate-200 flex gap-2">
          <button
            onClick={() => undo()}
            disabled={pastStates.length === 0}
            className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ↩ Undo
          </button>
          <button
            onClick={() => redo()}
            disabled={futureStates.length === 0}
            className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Redo ↪
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}