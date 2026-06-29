'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { SlidingNumber } from '../../primitives/texts/sliding-number';
import { motion, type Variants, type Transition } from 'framer-motion';

const BUTTON_MOTION_CONFIG = {
  initial: 'rest',
  whileHover: 'hover',
  whileTap: 'tap',
  variants: {
    rest: { maxWidth: '40px' },
    hover: {
      maxWidth: '140px',
      transition: { type: 'spring', stiffness: 200, damping: 35, delay: 0.15 },
    },
    tap: { scale: 0.95 },
  },
  transition: { type: 'spring', stiffness: 250, damping: 25 },
} as const;

const LABEL_VARIANTS: Variants = {
  rest: { opacity: 0, x: 4 },
  hover: { opacity: 1, x: 0, visibility: 'visible' },
  tap: { opacity: 1, x: 0, visibility: 'visible' },
};

const LABEL_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
};

interface ManagementBarProps {
  currentIndex: number;
  totalIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onScan: () => void;
  isScanLoading?: boolean;
}

function ManagementBar({
  currentIndex,
  totalIndex,
  onPrev,
  onNext,
  onScan,
  isScanLoading = false,
}: ManagementBarProps) {
  return (
    <div className="@container/wrapper w-full flex justify-center mt-4">
      <div className="flex w-fit flex-col @xl/wrapper:flex-row items-center gap-y-2 rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-bg-panel)] p-2 shadow-lg">
        <div className="mx-auto flex flex-col @lg/wrapper:flex-row shrink-0 items-center">
          <div className="flex h-10 items-center">
            <button
              disabled={currentIndex <= 0}
              className="p-1 text-[var(--gl-text-muted)] transition-colors hover:text-[var(--gl-text-primary)] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              onClick={onPrev}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="mx-2 flex items-center space-x-1 text-sm tabular-nums font-bold text-[var(--gl-text-primary)]">
              <SlidingNumber
                className="text-[var(--gl-text-primary)]"
                padStart
                number={totalIndex > 0 ? currentIndex + 1 : 0}
              />
              <span className="text-[var(--gl-text-muted)]">/ {totalIndex}</span>
            </div>
            <button
              disabled={currentIndex >= totalIndex - 1}
              className="p-1 text-[var(--gl-text-muted)] transition-colors hover:text-[var(--gl-text-primary)] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              onClick={onNext}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="mx-3 h-6 w-px bg-[var(--gl-border)] rounded-full hidden @lg/wrapper:block" />

          <motion.div
            layout
            layoutRoot
            className="mx-auto flex flex-wrap space-x-2 sm:flex-nowrap"
          >
            {/* Run Scan Button */}
            <motion.button
              {...BUTTON_MOTION_CONFIG}
              onClick={onScan}
              disabled={isScanLoading}
              className="flex h-10 items-center space-x-2 overflow-hidden whitespace-nowrap rounded-lg bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-2 text-blue-400 border border-blue-500/20 cursor-pointer disabled:opacity-50"
              aria-label="Scan Now"
            >
              <RefreshCw size={20} className={`shrink-0 ${isScanLoading ? 'animate-spin' : ''}`} />
              <motion.span
                variants={LABEL_VARIANTS}
                transition={LABEL_TRANSITION}
                className="invisible text-sm font-bold"
              >
                Scan Now
              </motion.span>
            </motion.button>

          </motion.div>
        </div>
      </div>
    </div>
  );
}

export { ManagementBar };
