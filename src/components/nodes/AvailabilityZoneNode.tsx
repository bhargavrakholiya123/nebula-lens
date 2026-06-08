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

      {/* Top-Left AZ Label Pill matching VPC and Subnet */}
      <div className="absolute -top-3 left-8 px-3 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full flex items-center gap-2 shadow-sm z-10">
        {/* Status Dot matching your other containers */}
        <div className="w-2 h-2 rounded-full bg-indigo-500" />

        {/* Typography matching VPC/Subnet format (BOLD TYPE + Normal Name) */}
        <span className="text-[10px] uppercase tracking-widest text-slate-700 dark:text-slate-300">
          <strong className="font-black mr-1">AZ</strong>
          <span className="opacity-80">{data.name || 'ap-south-1a'}</span>
        </span>
      </div>

      {/* Hidden handles for routing */}
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" />
    </div>
  );
}