"use client";

import * as React from "react";
import {
  SquaresFour,
  TreeStructure,
  Scroll,
  Clock,
  Gear,
  Terminal,
} from "@phosphor-icons/react";
import { NavMain, type NavMainItem } from "./NavMain";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems: NavMainItem[] = [
  { title: "Overview", id: "overview", icon: SquaresFour },
  { title: "Infrastructure Canvas", id: "canvas", icon: TreeStructure },
  { title: "Timeline Scrubber", id: "timeline", icon: Clock },
  { title: "Database Explorer", id: "db-explorer", icon: Scroll },
  { title: "Scan Job Logs", id: "logs", icon: Terminal },
  { title: "Settings", id: "settings", icon: Gear },
];

/** Inner component — needs to live inside SidebarProvider to call useSidebar */
function AppSidebarInner(props: React.ComponentProps<typeof Sidebar>) {
  const { open, setOpen } = useSidebar();

  // Track whether the current open state was triggered by hover (not a user pin-click)
  const hoverOpenedRef = React.useRef(false);
  const enterTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = React.useCallback(() => {
    if (!open) {
      enterTimerRef.current = setTimeout(() => {
        hoverOpenedRef.current = true;
        setOpen(true);
      }, 180);
    }
  }, [open, setOpen]);

  const handleMouseLeave = React.useCallback(() => {
    // Cancel pending expand
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    // Only auto-collapse if WE opened it via hover
    if (open && hoverOpenedRef.current) {
      hoverOpenedRef.current = false;
      setOpen(false);
    }
  }, [open, setOpen]);

  // If the user manually clicks the toggle while hover-expanded, the sidebar stays open
  // and we should no longer track it as hover-expanded
  React.useEffect(() => {
    if (!open) {
      hoverOpenedRef.current = false;
    }
  }, [open]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[var(--gl-border)] bg-[var(--gl-bg-panel)] transition-all"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <SidebarHeader className="h-14 p-0 px-4 flex flex-row items-center border-b border-[var(--gl-border)] group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center shrink-0">
        <div className="flex flex-row items-center gap-2 select-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 w-full">
          <img
            src="/logo/singleLogo.svg"
            alt="GravityLens Logo"
            className="w-7 h-7 shrink-0 object-contain"
          />
          <span className="text-sm font-bold text-[var(--gl-text-primary)] tracking-tight group-data-[collapsible=icon]:hidden">
            Gravity<span className="aurora-text">Lens</span>
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 mt-2">
        <NavMain items={navigationItems} />
      </SidebarContent>


      <SidebarRail />
    </Sidebar>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return <AppSidebarInner {...props} />;
}
