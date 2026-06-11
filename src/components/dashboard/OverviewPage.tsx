"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  HardDrives, CurrencyDollar, Warning,
  Clock, GitBranch, Globe, ArrowUpRight, ArrowDownRight,
  Minus, ArrowsClockwise, Eye, Scroll, ClockCounterClockwise,
} from "@phosphor-icons/react";
import { MOCK_SERVICES } from "./data/services";
import { MOCK_ALERTS } from "./data/alerts";
import { MOCK_SNAPSHOTS } from "./data/snapshots";
import { useRouter } from "next/navigation";

/* ──────────────── Stat Card ──────────────── */
interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  delay?: number;
}

function StatCard({
  title, value, sub, icon: Icon,
  iconColor, iconBg, trend, trendValue, delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="gl-card p-4 flex flex-col gap-3 gl-glow-hover"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: iconBg, border: `1px solid ${iconColor}30` }}>
            <Icon size={16} style={{ color: iconColor }} />
          </div>
          <span className="text-xs font-medium text-[var(--gl-text-muted)] leading-tight">{title}</span>
        </div>

        {trend && trendValue && (
          <div className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            trend === "up"      ? "text-red-400 bg-red-500/10"
            : trend === "down"  ? "text-emerald-400 bg-emerald-500/10"
            : "text-[var(--gl-text-muted)] bg-[var(--gl-bg-muted)]"
          }`}>
            {trend === "up"     ? <ArrowUpRight size={12} /> :
             trend === "down"   ? <ArrowDownRight size={12} /> :
             <Minus size={12} />}
            {trendValue}
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold text-[var(--gl-text-primary)] font-mono leading-none tracking-tight">
          {value}
        </p>
        {sub && (
          <p className="text-[10px] text-[var(--gl-text-muted)] mt-1">{sub}</p>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────── Health Ring ──────────────── */
function HealthRing({ score }: { score: number }) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <motion.circle
          cx="32" cy="32" r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      <span className="absolute text-sm font-bold font-mono" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

/* ──────────────── Activity Feed ──────────────── */
const RECENT_ACTIVITY = [
  { time: "2m ago",  icon: ArrowsClockwise, color: "#6366F1", msg: "Auto-scan completed — 12 resources mapped" },
  { time: "14m ago", icon: Warning,         color: "#F59E0B", msg: "Lambda error rate above 2% threshold" },
  { time: "1h ago",  icon: GitBranch,       color: "#10B981", msg: "Snapshot v1.3.1 saved — 1 new resource" },
  { time: "2h ago",  icon: Warning,         color: "#EF4444", msg: "CloudFront 503 errors detected (5.8%)" },
  { time: "3h ago",  icon: CurrencyDollar,  color: "#A855F7", msg: "Cost anomaly: Lambda 18% above baseline" },
];

/* ──────────────── Region Map (text-based) ──────────────── */
const REGIONS = [
  { name: "us-east-1",    label: "N. Virginia",   count: 10, color: "#6366F1" },
  { name: "global",       label: "Global",         count: 2,  color: "#14B8A6" },
];

/* ──────────────── Overview Page ──────────────── */
export default function OverviewPage() {
  const router = useRouter();

  const totalServices   = MOCK_SERVICES.length;
  const monthlyCost     = MOCK_SERVICES.reduce((acc, s) => acc + s.cost, 0);
  const openAlerts      = MOCK_ALERTS.filter((a) => a.status === "open").length;
  const healthyCount    = MOCK_SERVICES.filter((s) => s.status === "healthy").length;
  const healthScore     = Math.round((healthyCount / totalServices) * 100);
  const lastScan        = "2 min ago";
  const currentSnap     = MOCK_SNAPSHOTS[MOCK_SNAPSHOTS.length - 1];
  const recentChanges   = MOCK_SNAPSHOTS.slice(-3).reduce((acc, s) => acc + s.changes.length, 0);

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-[var(--gl-text-primary)] tracking-tight">
            Infrastructure <span className="aurora-text">Overview</span>
          </h1>
          <p className="text-xs text-[var(--gl-text-muted)] mt-0.5">
            {currentSnap.version} · Last scanned {lastScan} · {currentSnap.totalResources} resources tracked
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[rgba(99,102,241,0.12)] text-indigo-400 border border-[rgba(99,102,241,0.25)] hover:bg-[rgba(99,102,241,0.18)] transition-colors"
        >
          <ArrowsClockwise size={14} />
          Scan Now
        </motion.button>
      </motion.div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard title="Total Services" value={totalServices} sub={`${healthyCount} healthy`}
          icon={HardDrives} iconColor="#6366F1" iconBg="rgba(99,102,241,0.12)" delay={0} />
        <StatCard title="Monthly Cost" value={`$${monthlyCost.toFixed(0)}`} sub="est. this month"
          icon={CurrencyDollar} iconColor="#10B981" iconBg="rgba(16,185,129,0.12)" trend="up" trendValue="+18%" delay={0.05} />
        <StatCard title="Open Alerts" value={openAlerts} sub="2 critical, 2 high"
          icon={Warning} iconColor="#EF4444" iconBg="rgba(239,68,68,0.12)" trend="up" trendValue="+2" delay={0.1} />
        <StatCard title="Last Scan" value={lastScan} sub="Next in 22 min"
          icon={Clock} iconColor="#06B6D4" iconBg="rgba(6,182,212,0.12)" delay={0.15} />
        <StatCard title="Recent Changes" value={recentChanges} sub="past 48 hours"
          icon={GitBranch} iconColor="#A855F7" iconBg="rgba(168,85,247,0.12)" delay={0.2} />
        <StatCard title="Regions" value={REGIONS.length} sub="us-east-1 + global"
          icon={Globe} iconColor="#14B8A6" iconBg="rgba(20,184,166,0.12)" delay={0.25} />
      </div>

      {/* Health Score + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Health Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="gl-card p-5 flex items-center gap-5"
        >
          <HealthRing score={healthScore} />
          <div>
            <p className="text-xs font-bold text-[var(--gl-text-muted)] uppercase tracking-wider mb-1">
              Health Score
            </p>
            <p className="text-2xl font-bold text-[var(--gl-text-primary)] font-mono">{healthScore}%</p>
            <p className="text-[10px] text-[var(--gl-text-muted)] mt-1">
              {healthyCount}/{totalServices} services healthy
            </p>
            <div className="flex gap-2 mt-2">
              {MOCK_SERVICES.filter(s => s.status !== "healthy").map(s => (
                <span key={s.id} className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                  s.status === "error" ? "bg-red-500/12 text-red-400" : "bg-amber-500/12 text-amber-400"
                }`}>
                  {s.name.split("-").slice(-1)[0]}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="gl-card p-4 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-[var(--gl-text-primary)] uppercase tracking-wider">
              Recent Activity
            </p>
            <div className="flex items-center gap-1 text-[10px] text-[var(--gl-text-muted)]">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              />
              Live
            </div>
          </div>

          <div className="space-y-0">
            {RECENT_ACTIVITY.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-start gap-2.5 py-2 border-b border-[var(--gl-border)] last:border-0"
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${item.color}18` }}>
                    <Icon size={12} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[var(--gl-text-secondary)] leading-snug">{item.msg}</p>
                  </div>
                  <span className="text-[9px] text-[var(--gl-text-muted)] font-mono whitespace-nowrap">{item.time}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions + Regions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="gl-card p-4"
        >
          <p className="text-xs font-bold text-[var(--gl-text-primary)] uppercase tracking-wider mb-3">
            Quick Actions
          </p>
          <div className="space-y-2">
            {[
              { label: "View Infrastructure Canvas", icon: Eye,                      section: "canvas",   color: "#6366F1" },
              { label: "Open Live Logs",              icon: Scroll,                  section: "logs",     color: "#10B981" },
              { label: "Explore Timeline",            icon: ClockCounterClockwise,   section: "timeline", color: "#A855F7" },
              { label: "Review Alerts",               icon: Warning,                 section: "alerts",   color: "#EF4444" },
            ].map(({ label, icon: Icon, section, color }) => (
              <motion.button
                key={section}
                whileHover={{ x: 2 }}
                onClick={() => router.push(`/dashboard/${section}`)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium hover:bg-[var(--gl-bg-muted)] text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] transition-all group"
              >
                <Icon size={14} className="shrink-0" style={{ color }} />
                {label}
                <ArrowUpRight size={12} className="ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Regions + Service Type Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="gl-card p-4 lg:col-span-2"
        >
          <p className="text-xs font-bold text-[var(--gl-text-primary)] uppercase tracking-wider mb-3">
            Resources by Region
          </p>
          <div className="space-y-2">
            {REGIONS.map((r) => (
              <div key={r.name} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-32 shrink-0">
                  <Globe size={12} style={{ color: r.color }} />
                  <span className="text-[10px] font-mono text-[var(--gl-text-secondary)]">{r.label}</span>
                </div>
                <div className="flex-1 h-1.5 bg-[var(--gl-bg-muted)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: r.color, opacity: 0.7 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(r.count / totalServices) * 100}%` }}
                    transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-[var(--gl-text-muted)] w-6 text-right">{r.count}</span>
              </div>
            ))}
          </div>

          {/* Service type grid */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { type: "Lambda",     count: 2, color: "#EC4899" },
              { type: "S3",         count: 2, color: "#10B981" },
              { type: "RDS",        count: 1, color: "#06B6D4" },
              { type: "EC2",        count: 1, color: "#F59E0B" },
              { type: "API GW",     count: 1, color: "#8B5CF6" },
              { type: "SQS",        count: 1, color: "#F97316" },
              { type: "DynamoDB",   count: 1, color: "#3B82F6" },
              { type: "CloudFront", count: 1, color: "#14B8A6" },
            ].map(({ type, count, color }) => (
              <div key={type} className="rounded-lg p-2 text-center"
                style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                <p className="text-[10px] font-bold font-mono" style={{ color }}>{count}</p>
                <p className="text-[8px] text-[var(--gl-text-muted)] mt-0.5 leading-tight">{type}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
