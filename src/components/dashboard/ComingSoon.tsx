"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock } from "@phosphor-icons/react";
import type { DashboardSection } from "./useDashboardStore";

interface ComingSoonProps {
  section: DashboardSection;
  title: string;
  description: string;
}

export function ComingSoon({ section, title, description }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col items-center text-center max-w-md"
      >
        {/* Animated ring */}
        <div className="relative w-20 h-20 mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/30"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            className="absolute inset-2 rounded-full border border-purple-500/20"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Clock size={32} className="text-indigo-400" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-[var(--gl-text-primary)] mb-2">
          <span className="aurora-text">{title}</span>
        </h2>
        <p className="text-sm text-[var(--gl-text-secondary)] leading-relaxed mb-6">
          {description}
        </p>

        <div className="px-4 py-2 rounded-full bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] text-indigo-400 text-xs font-semibold flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Coming in Phase {
            section === "logs"     ? "4" :
            section === "timeline" ? "5" :
            section === "alerts"   ? "6" :
            section === "cost"     ? "6" :
            section === "settings" ? "7" : "next"
          }
        </div>
      </motion.div>
    </div>
  );
}
