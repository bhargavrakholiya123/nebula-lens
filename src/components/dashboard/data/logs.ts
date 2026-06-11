// src/components/dashboard/data/logs.ts
export type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG";

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  service: string;
  message: string;
  traceId?: string;
}

const services = [
  "gl-api-server-01",
  "gl-data-processor",
  "gl-alert-notifier",
  "gl-postgres-primary",
  "GravityLens-REST-API",
  "gravitylens-cdn",
  "gl-scan-queue",
];

const logMessages: Record<LogLevel, string[]> = {
  INFO: [
    "Infrastructure scan completed — 12 resources mapped",
    "Snapshot saved: v2.4.1 — 0 changes detected",
    "ELK layout computed in 124ms",
    "User session refreshed — token extended 24h",
    "Scan job enqueued successfully — jobId: scan_8f3a2c",
    "CloudTrail events ingested — 840 events processed",
    "Health check passed — all services nominal",
    "API Gateway cache cleared — 1.2M objects purged",
    "DynamoDB table throughput auto-scaled to 450 RCU",
    "Lambda cold start detected — 340ms initialization",
    "S3 lifecycle policy executed — 14 objects archived",
    "RDS automated backup completed — 142 GB stored",
  ],
  WARN: [
    "Lambda error rate elevated: 2.4% (threshold: 2.0%)",
    "CloudFront cache miss rate: 11% (above target 10%)",
    "EC2 CPU approaching threshold: 78% for 5 minutes",
    "SQS queue depth growing: 1,240 messages pending",
    "RDS connection pool near limit: 148/150 connections",
    "IAM role policy drift detected on admin-role",
    "Security group rule change detected — Port 443",
    "Cost anomaly: Lambda spend 18% above baseline",
  ],
  ERROR: [
    "CloudFront distribution returning 503 errors: 5.8% rate",
    "Lambda timeout: gl-data-processor exceeded 15s limit",
    "RDS replication lag: 840ms (threshold: 500ms)",
    "API Gateway 429 throttle errors: 2,840 requests rejected",
    "S3 access denied: cross-account policy misconfiguration",
    "EC2 instance unreachable: health check failed 3x",
  ],
  DEBUG: [
    "ELK graph serialized — 7 nodes, 4 edges",
    "Canvas store hydrated — activeLens: structural",
    "Fetching /api/infrastructure — cache miss",
    "Zustand temporal state paused during animation",
    "ReactFlow nodes updated — 7 positions recalculated",
    "AWS SDK session token refreshed",
    "Snapshot diff computed — 0ms (no changes)",
  ],
};

let logIdCounter = 1;

export function generateLogEntry(overrideLevel?: LogLevel): LogEntry {
  const levelWeights: [LogLevel, number][] = [
    ["INFO",  60],
    ["WARN",  20],
    ["ERROR", 10],
    ["DEBUG", 10],
  ];
  
  let level: LogLevel = overrideLevel ?? "INFO";
  if (!overrideLevel) {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const [l, w] of levelWeights) {
      cumulative += w;
      if (rand < cumulative) { level = l; break; }
    }
  }

  const messages = logMessages[level];
  const service = services[Math.floor(Math.random() * services.length)];
  const message = messages[Math.floor(Math.random() * messages.length)];

  return {
    id: `log-${Date.now()}-${logIdCounter++}`,
    timestamp: new Date(),
    level,
    service,
    message,
    traceId: `trace-${Math.random().toString(36).slice(2, 10)}`,
  };
}

export function generateInitialLogs(count = 40): LogEntry[] {
  const logs: LogEntry[] = [];
  const now = Date.now();
  
  for (let i = count; i >= 0; i--) {
    const entry = generateLogEntry();
    entry.timestamp = new Date(now - i * 3500 + Math.random() * 2000);
    entry.id = `log-init-${i}`;
    logs.push(entry);
  }
  return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
