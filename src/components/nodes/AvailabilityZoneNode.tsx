'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { useLensVisuals } from '../../hooks/useLensVisuals';

function AvailabilityZoneNode({ id, data, selected }: { id: string; data: any; selected?: boolean }) {
  const { opacity, isHighlighted, isDimmed } = useLensVisuals(id);

  return (
    <motion.div
      animate={{
        opacity: opacity,
        borderColor: (selected || isHighlighted)
          ? "rgba(99, 102, 241, 0.8)"
          : "rgba(148, 163, 184, 0.4)",
        backgroundColor: (selected || isHighlighted)
          ? "rgba(99, 102, 241, 0.05)"
          : "rgba(148, 163, 184, 0.01)",
      }}
      transition={{ duration: 0.2 }}
      className={`relative w-full h-full border-2 border-dashed rounded-2xl pointer-events-auto ${
        isDimmed ? 'pointer-events-none' : ''
      }`}
    >
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
    </motion.div>
  );
}

export default memo(AvailabilityZoneNode);