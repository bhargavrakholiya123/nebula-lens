'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function AvailabilityZoneNode({ data, selected }: any) {
  return (
    <div className={`w-full h-full border-2 border-dashed rounded-2xl transition-all duration-300 ${
      selected
        ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_30px_rgba(99,102,241,0.1)]'
        : 'border-slate-300 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/20'
    }`}>
      <div className="absolute top-0 left-0 bg-green-100/80 dark:bg-green-900/50 backdrop-blur-sm border-b-2 border-r-2 border-green-200/50 dark:border-green-800/50 rounded-tl-xl rounded-br-xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-extrabold tracking-wider text-green-800 dark:text-green-300 uppercase">Az</span>
        <span className="text-xs font-semibold text-green-600 dark:text-green-400 truncate max-w-[150px]" title={data?.name}>
          {data?.name || 'ap-south-1a'}
        </span>
      </div>

      {/* Hidden handles for routing */}
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" />
    </div>
  );
}