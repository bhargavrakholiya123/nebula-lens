'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NodeTooltipProps {
  name: string;
  type: string;
  metrics?: Record<string, any>;
  children: React.ReactNode;
}

export default function NodeTooltip({ name, type, metrics, children }: NodeTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Pick the 2 most interesting metrics to show
  const displayMetrics = metrics
    ? Object.entries(metrics)
        .filter(([key]) => key !== 'telemetryData')
        .slice(0, 2)
    : [];

  const formatLabel = (str: string) => {
    const spaced = str.replace(/([A-Z])/g, ' $1');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      <AnimatePresence>
        {isHovered && (
          <motion.div
            key="node-tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute z-[100] -top-2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none"
          >
            <div className="bg-white/[0.97] dark:bg-slate-950/[0.97] backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 rounded-xl shadow-[0_8px_24px_-6px_rgba(0,0,0,0.15)] px-3.5 py-2.5 min-w-[160px] max-w-[220px]">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{type}</p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{name}</p>

              {displayMetrics.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  {displayMetrics.map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {formatLabel(key)}
                      </span>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 shrink-0">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tooltip arrow */}
            <div className="flex justify-center -mt-[1px]">
              <div className="w-2 h-2 bg-white/[0.97] dark:bg-slate-950/[0.97] border-b border-r border-slate-200/80 dark:border-slate-700/60 rotate-45 -translate-y-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
