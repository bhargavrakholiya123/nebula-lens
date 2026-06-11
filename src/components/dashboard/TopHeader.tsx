"use client";

import React from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Sun, Moon, Bell, CaretRight,
  WifiHigh, WifiSlash, SidebarSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDashboardStore } from "./useDashboardStore";
import type { DashboardSection } from "./useDashboardStore";
import { useSidebar } from "@/components/ui/sidebar";

const SECTION_LABELS: Record<DashboardSection, string> = {
  overview:  "Overview",
  canvas:    "Infrastructure Canvas",
  "blast-radius": "Blast Radius",
  logs:      "Live Logs",
  timeline:  "Timeline",
  alerts:    "Alerts",
  cost:      "Cost Analysis",
  settings:  "Settings",
};

export function TopHeader() {
  const { theme, setTheme } = useTheme();
  const { state: sidebarState, toggleSidebar } = useSidebar();
  const leftPanelOpen = sidebarState === "expanded";
  const {
    activeSection, openAlertCount,
    isAwsConnected, awsRegion,
  } = useDashboardStore();

  return (
    <header className="flex items-center h-14 px-4 gap-3 border-b border-[var(--gl-border)] bg-[var(--gl-bg-panel)] shrink-0 z-40">

      {/* Left Panel Toggle */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost" size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-muted)]"
            />
          }
        >
          <SidebarSimple size={16} />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {leftPanelOpen ? "Collapse sidebar" : "Expand sidebar"}
        </TooltipContent>
      </Tooltip>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs hidden sm:flex">
        <span className="text-[var(--gl-text-muted)]">Dashboard</span>
        <CaretRight size={12} className="text-[var(--gl-text-disabled)]" />
        <span className="text-[var(--gl-text-primary)] font-medium">
          {SECTION_LABELS[activeSection]}
        </span>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* AWS Connection Status */}
      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-xs">
        {isAwsConnected ? (
          <>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            />
            <span className="text-[var(--gl-text-secondary)] font-mono">{awsRegion}</span>
          </>
        ) : (
          <>
            <WifiSlash size={12} className="text-red-400" />
            <span className="text-red-400">Disconnected</span>
          </>
        )}
      </div>

      {/* Alerts Bell */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 relative text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-muted)]"
            />
          }
        >
          <Bell size={16} />
          {openAlertCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-1 ring-[var(--gl-bg-panel)]" />
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {openAlertCount} open alerts
        </TooltipContent>
      </Tooltip>

      {/* Theme Toggle */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost" size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8 text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-muted)]"
            />
          }
        >
          <Sun  size={16} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon size={16} className="rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Toggle theme</TooltipContent>
      </Tooltip>

      {/* Divider */}
      <div className="w-px h-5 bg-[var(--gl-border)]" />

      {/* User Avatar */}
      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7 ring-1 ring-[var(--gl-border)]">
          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold">
            GL
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-[var(--gl-text-secondary)] hidden lg:block">
          admin
        </span>
      </div>

    </header>
  );
}
