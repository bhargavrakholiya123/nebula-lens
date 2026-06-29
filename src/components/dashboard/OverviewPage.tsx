"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HardDrives, CurrencyDollar, Warning,
  Clock, GitBranch, Globe, ArrowUpRight, ArrowDownRight,
  Minus, ArrowsClockwise, Eye, Scroll, ClockCounterClockwise, CheckCircle
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCanvasStore } from "@/store/useCanvasStore";
import { staggerContainer, staggerItem } from "../../lib/motion";
import { useRelativeTime } from "../../hooks/useRelativeTime";
import { Sparkline } from "./Sparkline";
import { getContextualGreeting } from "../../lib/greetings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "../ui/card";

/* ──────────────── Region and Service Metadata ──────────────── */
const REGION_META_MAP: Record<string, { label: string; color: string }> = {
  "us-east-1": { label: "N. Virginia", color: "#6366F1" },
  "us-east-2": { label: "Ohio", color: "#3B82F6" },
  "us-west-1": { label: "N. California", color: "#06B6D4" },
  "us-west-2": { label: "Oregon", color: "#14B8A6" },
  "ap-south-1": { label: "Mumbai", color: "#10B981" },
  "eu-west-1": { label: "Ireland", color: "#F59E0B" },
  "eu-central-1": { label: "Frankfurt", color: "#F97316" },
  "global": { label: "Global", color: "#EC4899" },
};

const SERVICE_COLOR_MAP: Record<string, string> = {
  vpc:        "#A855F7",
  subnet:     "#6366F1",
  ec2:        "#F59E0B",
  lambda:     "#EC4899",
  rds:        "#06B6D4",
  s3:         "#10B981",
  sqs:        "#F97316",
  apigateway: "#8B5CF6",
  cloudfront: "#14B8A6",
  dynamodb:   "#3B82F6",
};

const SERVICE_LABEL_MAP: Record<string, string> = {
  vpc:        "VPC",
  subnet:     "Subnet",
  ec2:        "EC2",
  lambda:     "Lambda",
  rds:        "RDS",
  s3:         "S3",
  sqs:        "SQS",
  apigateway: "API Gateway",
  cloudfront: "CloudFront",
  dynamodb:   "DynamoDB",
};

/* ──────────────── Compact Stat Card (Row 2) ──────────────── */
interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  sparklineData?: number[];
  sparklineColor?: string;
}

function CompactStatCard({
  title, value, sub, icon: Icon,
  iconColor, trend, trendValue,
  sparklineData, sparklineColor,
}: StatCardProps) {
  return (
    <motion.div variants={staggerItem} className="flex">
      <Card size="sm" className="w-full flex flex-col justify-between gl-glow-hover transition-all duration-300 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="flex items-center gap-2">
            <Icon size={18} style={{ color: iconColor }} />
            <span className="text-xs font-medium text-muted-foreground leading-tight">{title}</span>
          </div>
          {trend && trendValue && (
            <CardAction>
              <div className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                trend === "up"      ? "text-red-400 bg-red-500/10"
                : trend === "down"  ? "text-emerald-400 bg-emerald-500/10"
                : "text-muted-foreground bg-muted"
              }`}>
                {trend === "up"     ? <ArrowUpRight size={10} /> :
                 trend === "down"   ? <ArrowDownRight size={10} /> :
                 <Minus size={10} />}
                {trendValue}
              </div>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg font-medium tracking-tight text-foreground flex items-center gap-3">
            {title === "Last Scan" ? (
              <AnimatePresence mode="wait">
                <motion.span
                  key={value}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {value}
                </motion.span>
              </AnimatePresence>
            ) : (
              value
            )}
            {sparklineData && sparklineColor && (
              <Sparkline data={sparklineData} color={sparklineColor} />
            )}
          </div>
          {sub && (
            <p className="text-xs font-medium text-muted-foreground mt-1">{sub}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ──────────────── Health Ring ──────────────── */
function HealthRing({ score, size = 140 }: { score: number, size?: number }) {
  const strokeWidth = size > 100 ? 8 : 5;
  const center = size / 2;
  const r = center - strokeWidth - 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={center} cy={center} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
    </div>
  );
}

/* ──────────────── Helper relative time calculation ──────────────── */
function formatRelativeTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "N/A";
  const d = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 0) return "just now";
  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

/* ──────────────── Animation Variants ──────────────── */
const activityContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    }
  }
};

const activityItem = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } }
};

const quickActionVariants = {
  hover: {}
};

const iconVariants = {
  hover: {
    x: 2,
    transition: { duration: 0.1 }
  }
};

/* ──────────────── Overview Page ──────────────── */
export default function OverviewPage() {
  const router = useRouter();
  
  // Zustand Store
  const { selectedAccountId, connectedAccounts } = useCanvasStore();

  // Component State
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<any[]>([]);
  const [latestSnapshotNodes, setLatestSnapshotNodes] = useState<any[]>([]);
  const [costHistory, setCostHistory] = useState<number[]>([]);
  const [costTrend, setCostTrend] = useState<"up" | "down" | "neutral">("neutral");
  const [costTrendValue, setCostTrendValue] = useState<string>("0%");
  
  // Scan Button State
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "done">("idle");
  const [scanProgress, setScanProgress] = useState(0);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const url = selectedAccountId ? `/api/history?account_id=${selectedAccountId}` : "/api/history";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = data.versions || [];
        setVersions(list);

        if (list.length > 0) {
          const latestSnap = list[0];
          
          // Fetch graph data for the latest snapshot to analyze services and regions
          const graphRes = await fetch(`/api/history?snapshot_id=${latestSnap.version_id}`);
          if (graphRes.ok) {
            const graphData = await graphRes.json();
            setLatestSnapshotNodes(graphData.nodes || []);
          }

          // Calculate cost history for sparkline (chronological, last 7 scans)
          const historyCosts = list
            .slice(0, 7)
            .reverse()
            .map((v: any) => v.costs?.total_monthly || 0);
          setCostHistory(historyCosts);

          // Calculate trend based on previous scan cost
          if (list.length >= 2) {
            const currentCost = list[0].costs?.total_monthly || 0;
            const previousCost = list[1].costs?.total_monthly || 0;
            if (previousCost > 0) {
              const diffPercent = ((currentCost - previousCost) / previousCost) * 100;
              setCostTrend(diffPercent > 0.5 ? "up" : diffPercent < -0.5 ? "down" : "neutral");
              setCostTrendValue(`${diffPercent > 0 ? "+" : ""}${diffPercent.toFixed(0)}%`);
            } else {
              setCostTrend("neutral");
              setCostTrendValue("0%");
            }
          } else {
            setCostTrend("neutral");
            setCostTrendValue("0%");
          }
        } else {
          setLatestSnapshotNodes([]);
          setCostHistory([]);
          setCostTrend("neutral");
          setCostTrendValue("0%");
        }
      }
    } catch (err) {
      console.error("Error fetching dashboard overview data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedAccountId]);

  const handleScan = async () => {
    if (scanStatus !== "idle") return;
    
    // Find the AWS Account ID
    const currentAccount = connectedAccounts.find(a => a.id === selectedAccountId || a.account_id === selectedAccountId);
    const awsAccountId = currentAccount?.account_id;
    if (!awsAccountId) {
      alert("Please select a connected AWS Account first.");
      return;
    }

    setScanStatus("scanning");
    setScanProgress(0);

    try {
      const res = await fetch(`/api/scan/trigger?account_id=${awsAccountId}`, {
        method: "POST",
      });
      if (res.ok) {
        // Simulating scan progress
        let currentProgress = 0;
        const intervalId = setInterval(() => {
          currentProgress += 1;
          setScanProgress(currentProgress);

          if (currentProgress >= 12) {
            clearInterval(intervalId);
            setScanStatus("done");
            fetchDashboardData(); // Reload stats
            setTimeout(() => {
              setScanStatus("idle");
              setScanProgress(0);
            }, 800);
          }
        }, 200);
      } else {
        alert("Failed to queue new scan. Make sure your local scan worker is active.");
        setScanStatus("idle");
      }
    } catch (err) {
      console.error("Scan error:", err);
      alert("An error occurred while triggering the scan.");
      setScanStatus("idle");
    }
  };

  // ── Layout Calculations ──
  const latestSnap = versions[0];
  const totalResourcesCount = latestSnapshotNodes.length;

  const serviceSet = new Set(
    latestSnapshotNodes
      .map(n => n.data?.service)
      .filter(s => s && s !== "vpc" && s !== "subnet" && s !== "az")
  );
  const distinctServiceCount = serviceSet.size;

  const monthlyCost = latestSnap?.costs?.total_monthly || 0;

  // Determine health mapping per node
  const getNodeStatus = (node: any): "healthy" | "warning" | "error" => {
    const insights = node.data?.insights || "";
    if (insights.toLowerCase().includes("error") || insights.toLowerCase().includes("critical")) {
      return "error";
    }
    if (insights.toLowerCase().includes("warning") || insights.toLowerCase().includes("inferred")) {
      return "warning";
    }
    const metrics = node.data?.metricsSummary || node.data?.metrics || {};
    if (metrics.errorRate > 5 || metrics.cpu > 85) {
      return "error";
    }
    if (metrics.errorRate > 2 || metrics.cpu > 70) {
      return "warning";
    }
    return "healthy";
  };

  const nodesWithStatus = latestSnapshotNodes.map(n => ({
    ...n,
    status: getNodeStatus(n)
  }));

  const healthyCount = nodesWithStatus.filter(n => n.status === "healthy").length;
  const nonHealthyNodes = nodesWithStatus.filter(n => n.status !== "healthy");
  const healthScore = totalResourcesCount > 0 
    ? Math.round((healthyCount / totalResourcesCount) * 100) 
    : 100;

  const criticalAlerts = nodesWithStatus.filter(n => n.status === "error").length;
  const highAlerts = nodesWithStatus.filter(n => n.status === "warning").length;
  const openAlerts = criticalAlerts + highAlerts;

  const { message: greetingMsg, colorClass: greetingColor } = getContextualGreeting({
    criticalAlerts,
    healthScore,
  });

  const recentChanges = versions.slice(0, 3).reduce((acc, s) => {
    const c = s.changes || {};
    return acc + (c.added || 0) + (c.removed || 0) + (c.modified || 0);
  }, 0);

  // Group by regions
  const regionCounts: Record<string, number> = {};
  latestSnapshotNodes.forEach(node => {
    const r = node.data?.region || "global";
    regionCounts[r] = (regionCounts[r] || 0) + 1;
  });
  const regionsList = Object.entries(regionCounts).map(([name, count]) => {
    const meta = REGION_META_MAP[name] || { label: name.toUpperCase(), color: "#A855F7" };
    return {
      name,
      label: meta.label,
      count,
      color: meta.color
    };
  });

  // Group by services
  const serviceCounts: Record<string, number> = {};
  latestSnapshotNodes.forEach(node => {
    const svc = node.data?.service;
    if (svc && svc !== "vpc" && svc !== "subnet" && svc !== "az") {
      serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;
    }
  });
  const serviceBreakdown = Object.entries(serviceCounts).map(([type, count]) => {
    const color = SERVICE_COLOR_MAP[type] || "#A855F7";
    const label = SERVICE_LABEL_MAP[type] || type.toUpperCase();
    return {
      type: label,
      count,
      color
    };
  });

  // Activity list mapping (static for demo/UI completeness)
  const recentActivity = [
    { time: "2m ago", icon: ArrowsClockwise, color: "#6366F1", msg: "Auto-scan completed — 12 resources mapped" },
    { time: "14m ago", icon: Warning, color: "#F59E0B", msg: "Lambda error rate above 2% threshold" },
    { time: "1h ago", icon: GitBranch, color: "#10B981", msg: "Snapshot v1.3.1 saved — 1 new resource" },
    { time: "2h ago", icon: Warning, color: "#EF4444", msg: "CloudFront 503 errors detected (5.8%)" },
    { time: "3h ago", icon: CurrencyDollar, color: "#A855F7", msg: "Cost anomaly: Lambda 18% above baseline" },
  ];

  // Fetch hook relative time string for the header scan label
  const headerScanText = useRelativeTime(latestSnap ? new Date(latestSnap.created_at) : new Date());

  if (loading) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto space-y-6 flex flex-col justify-center items-center h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="text-indigo-500 mb-4"
        >
          <ArrowsClockwise size={32} />
        </motion.div>
        <p className="text-sm text-muted-foreground font-medium">Loading infrastructure metrics...</p>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto space-y-6 flex flex-col justify-center items-center h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4 text-muted-foreground">
          <HardDrives size={32} />
        </div>
        <h2 className="text-lg font-medium text-foreground">No Snapshot History Found</h2>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          This AWS account hasn't been scanned yet, or there are no snapshots saved in the database.
        </p>
        <Button onClick={handleScan} disabled={scanStatus !== "idle"} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold px-5 h-10 rounded-xl">
          {scanStatus === "scanning" ? "Scanning..." : "Trigger First Scan"}
        </Button>
      </div>
    );
  }

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
          <h1 className="text-xl font-medium text-foreground tracking-tight">
            Infrastructure <span className="aurora-text">Overview</span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`text-sm font-medium mt-1 ${greetingColor}`}
          >
            {greetingMsg}
          </motion.div>

          <div className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1">
            <span>v{latestSnap.version_number} · Last scanned </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={headerScanText}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {headerScanText}
              </motion.span>
            </AnimatePresence>
            <span> · {totalResourcesCount} resources tracked</span>
          </div>
        </div>

        <motion.button
          layout
          disabled={scanStatus !== "idle"}
          whileHover={scanStatus === "idle" ? { scale: 1.02 } : {}}
          whileTap={scanStatus === "idle" ? { scale: 0.97 } : {}}
          onClick={handleScan}
          className="relative overflow-hidden flex items-center justify-center px-4 py-2 rounded-lg text-xs font-medium bg-[rgba(99,102,241,0.12)] text-indigo-400 border border-[rgba(99,102,241,0.25)] hover:bg-[rgba(99,102,241,0.18)] transition-colors min-w-[110px]"
        >
          {scanStatus === "scanning" && (
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] bg-indigo-400/40"
              initial={{ width: "0%" }}
              animate={{ width: `${(scanProgress / 12) * 100}%` }}
              transition={{ ease: "linear", duration: 0.15 }}
            />
          )}
          
          <AnimatePresence mode="wait">
            {scanStatus === "idle" && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <ArrowsClockwise size={14} />
                <span>Scan Now</span>
              </motion.div>
            )}
            
            {scanStatus === "scanning" && (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <ArrowsClockwise size={14} />
                </motion.div>
                <span className="tabular-nums">Scanning... {scanProgress}/12</span>
              </motion.div>
            )}

            {scanStatus === "done" && (
              <motion.div 
                key="done"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <CheckCircle size={14} />
                <span>Done</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* ROW 1: Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Health Score Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="md:col-span-3 flex"
        >
          <Card className="w-full border border-[var(--border)] shadow-sm p-6 flex flex-col md:flex-row items-center gap-8 gl-glow-hover transition-all duration-300">
            <div className="relative shrink-0">
              <HealthRing score={healthScore} size={140} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-medium font-sans tracking-tight" style={{ color: healthScore >= 80 ? "#10B981" : healthScore >= 60 ? "#F59E0B" : "#EF4444" }}>
                  {healthScore}%
                </span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">System Health</h2>
              <p className="text-sm text-muted-foreground mb-3">
                {healthyCount}/{totalResourcesCount} resources healthy
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {nonHealthyNodes.slice(0, 5).map(s => (
                  <span key={s.id} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground border border-border">
                    {s.data?.name || s.id.split("/").slice(-1)[0]}
                  </span>
                ))}
                {nonHealthyNodes.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">All mapped resources are healthy</span>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Open Alerts Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="md:col-span-2 flex"
        >
          <Card className="w-full border border-[var(--border)] shadow-sm p-6 flex flex-col justify-center gl-glow-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${openAlerts > 0 ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
                {openAlerts > 0 ? <Warning size={18} className="text-red-400" /> : <CheckCircle size={18} className="text-emerald-400" />}
              </div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Open Alerts</h2>
            </div>
            <div className="mt-2 min-h-[64px] flex flex-col justify-center">
              {openAlerts > 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-4xl font-medium leading-none text-foreground">
                      {openAlerts}
                    </div>
                    <Sparkline data={[15, 13, 14, 11, 9, 6, openAlerts]} color="#EF4444" width={64} height={20} />
                  </div>
                  {criticalAlerts > 0 ? (
                    <p className="text-sm">
                      <span className="text-red-400 font-medium">{criticalAlerts} critical</span>
                      <span className="text-muted-foreground">, {highAlerts} high</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{highAlerts} high alerts</p>
                  )}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle size={32} />
                    <span className="text-2xl font-medium tracking-tight">All clear</span>
                  </div>
                  <p className="text-sm text-muted-foreground">No active issues</p>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ROW 2: Compact Stats Strip */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
      >
        <CompactStatCard title="Total Services" value={distinctServiceCount}
          icon={HardDrives} iconColor="#6366F1" iconBg="rgba(99,102,241,0.12)" />
        
        <CompactStatCard title="Monthly Cost" value={`$${monthlyCost.toFixed(0)}`} sub="est. this month"
          icon={CurrencyDollar} iconColor="#10B981" iconBg="rgba(16,185,129,0.12)" trend={costTrend} trendValue={costTrendValue}
          sparklineData={costHistory.length > 0 ? costHistory : [0]} sparklineColor="#6366F1" />
        
        <CompactStatCard title="Last Scan" value={headerScanText} sub="Live tracking"
          icon={Clock} iconColor="#06B6D4" iconBg="rgba(6,182,212,0.12)" />
        
        <CompactStatCard title="Recent Changes" value={recentChanges} sub="past 3 scans"
          icon={GitBranch} iconColor="#A855F7" iconBg="rgba(168,85,247,0.12)" />
        
        <CompactStatCard title="Regions" value={regionsList.length} sub={regionsList.map(r => r.label).join(" + ")}
          icon={Globe} iconColor="#14B8A6" iconBg="rgba(20,184,166,0.12)" />
      </motion.div>

      {/* ROW 3: Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="flex"
      >
        <Card className="w-full border border-[var(--border)] shadow-sm gl-glow-hover transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-foreground">
              Recent Activity
            </CardTitle>
            <CardAction>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                />
                Live
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <motion.div
              variants={activityContainer}
              initial="initial"
              animate="animate"
              className="space-y-0"
            >
              {recentActivity.length > 0 ? (
                recentActivity.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      variants={activityItem}
                      className="flex items-start gap-2.5 py-2 border-b border-border last:border-0"
                    >
                      <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${item.color}18` }}>
                        <Icon size={14} style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground leading-snug">{item.msg}</p>
                      </div>
                      <span className="text-xs text-muted-foreground font-sans font-medium whitespace-nowrap">{item.time}</span>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2"
                >
                  <ClockCounterClockwise size={24} weight="light" opacity={0.5} />
                  <p className="text-xs font-medium">No recent activity</p>
                </motion.div>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ROW 4: Quick Actions + Regions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex"
        >
          <Card className="w-full border border-[var(--border)] shadow-sm gl-glow-hover transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "View Infrastructure Canvas", icon: Eye, section: "canvas", color: "#6366F1" },
                { label: "Explore Timeline", icon: ClockCounterClockwise, section: "timeline", color: "#A855F7" },
                { label: "Review Alerts", icon: Warning, section: "alerts", color: "#EF4444" },
              ].map(({ label, icon: Icon, section, color }) => (
                <motion.button
                  key={section}
                  whileHover="hover"
                  variants={quickActionVariants}
                  onClick={() => router.push(`/dashboard/${section}`)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all group"
                >
                  <motion.div variants={iconVariants}>
                    <Icon size={14} className="shrink-0" style={{ color }} />
                  </motion.div>
                  {label}
                  <ArrowUpRight size={12} className="ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
                </motion.button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Regions + Service Type Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="lg:col-span-2 flex"
        >
          <Card className="w-full border border-[var(--border)] shadow-sm gl-glow-hover transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-foreground">
                Resources by Region
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {regionsList.length === 1 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2 py-1"
                  >
                    <Globe size={18} style={{ color: regionsList[0].color }} />
                    <span className="text-sm font-medium text-foreground">
                      {regionsList[0].count} resources mapped in {regionsList[0].label}
                    </span>
                  </motion.div>
                ) : (
                  regionsList.map((r, i) => (
                    <div key={r.name} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-32 shrink-0">
                        <Globe size={14} style={{ color: r.color }} />
                        <span className="text-[10px] font-sans font-medium text-muted-foreground">{r.label}</span>
                      </div>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: r.color, opacity: 0.7 }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(r.count / totalResourcesCount) * 100}%` }}
                          transition={{ delay: 0.3 + i * 0.3, duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-[10px] font-sans font-medium text-muted-foreground w-6 text-right">{r.count}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Service type grid */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                {serviceBreakdown.slice(0, 8).map(({ type, count, color }) => (
                  <div key={type} className="bg-card border border-border rounded-lg p-2 text-center"
                    style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                    <p className="text-[10px] font-medium font-sans" style={{ color }}>{count}</p>
                    <p className="text-[8px] text-muted-foreground mt-0.5 leading-tight">{type}</p>
                  </div>
                ))}
                {serviceBreakdown.length === 0 && (
                  <div className="col-span-4 text-center text-xs text-muted-foreground py-4 italic">
                    No resource categories detected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
