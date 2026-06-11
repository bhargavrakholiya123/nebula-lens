// src/components/dashboard/data/alerts.ts
export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertStatus   = "open" | "resolved" | "suppressed";

export interface MockAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  service: string;
  serviceId: string;
  region: string;
  timestamp: string;
  resolvedAt?: string;
  category: "security" | "performance" | "cost" | "availability" | "compliance";
  recommendation: string;
}

export const MOCK_ALERTS: MockAlert[] = [
  {
    id: "alert-001",
    title: "CloudFront 5xx Error Rate Elevated",
    description: "gravitylens-cdn is returning 5.8% 503 errors over the last 15 minutes. Normal baseline is <0.1%.",
    severity: "critical",
    status: "open",
    service: "gravitylens-cdn",
    serviceId: "cf-gl-cdn",
    region: "global",
    timestamp: "2025-06-10T10:45:00Z",
    category: "availability",
    recommendation: "Check CloudFront origin health and review recent deployment changes.",
  },
  {
    id: "alert-002",
    title: "IAM Role Policy Drift Detected",
    description: "The admin-role IAM policy was manually edited outside of Terraform, adding wildcard s3:* permissions.",
    severity: "high",
    status: "open",
    service: "IAM",
    serviceId: "iam-admin-role",
    region: "us-east-1",
    timestamp: "2025-06-10T09:30:00Z",
    category: "security",
    recommendation: "Review the IAM role change and reconcile with your Terraform state file.",
  },
  {
    id: "alert-003",
    title: "Lambda Error Rate Above Threshold",
    description: "gl-data-processor Lambda function error rate is 2.4%, exceeding the 2.0% threshold.",
    severity: "high",
    status: "open",
    service: "gl-data-processor",
    serviceId: "func-gl-processor",
    region: "us-east-1",
    timestamp: "2025-06-10T10:00:00Z",
    category: "performance",
    recommendation: "Review CloudWatch logs for error details and increase timeout or memory allocation.",
  },
  {
    id: "alert-004",
    title: "EC2 CPU Nearing Threshold",
    description: "gl-api-server-01 CPU utilization has been above 75% for 8 consecutive minutes.",
    severity: "medium",
    status: "open",
    service: "gl-api-server-01",
    serviceId: "i-0c1d2e3f",
    region: "us-east-1",
    timestamp: "2025-06-10T10:22:00Z",
    category: "performance",
    recommendation: "Consider scaling up to t3.2xlarge or enabling Auto Scaling.",
  },
  {
    id: "alert-005",
    title: "SQS Queue Depth Growing",
    description: "gl-scan-queue has 1,240 messages pending, up from 120 at the last health check.",
    severity: "medium",
    status: "open",
    service: "gl-scan-queue",
    serviceId: "sqs-gl-queue",
    region: "us-east-1",
    timestamp: "2025-06-10T10:15:00Z",
    category: "performance",
    recommendation: "Check Lambda consumer function health and consider scaling up concurrency.",
  },
  {
    id: "alert-006",
    title: "Security Group Rule Changed",
    description: "A new inbound rule was added to sg-0x12345 allowing traffic on port 22 from 0.0.0.0/0.",
    severity: "critical",
    status: "resolved",
    service: "Security Group",
    serviceId: "sg-0x12345",
    region: "us-east-1",
    timestamp: "2025-06-09T14:20:00Z",
    resolvedAt: "2025-06-09T14:45:00Z",
    category: "security",
    recommendation: "Restrict SSH access to specific IP ranges or use AWS Systems Manager Session Manager.",
  },
  {
    id: "alert-007",
    title: "Cost Anomaly — Lambda Spend",
    description: "Lambda costs are 18% above last week's baseline. gl-data-processor accounts for most of the increase.",
    severity: "low",
    status: "open",
    service: "gl-data-processor",
    serviceId: "func-gl-processor",
    region: "us-east-1",
    timestamp: "2025-06-10T08:00:00Z",
    category: "cost",
    recommendation: "Review Lambda execution time and consider optimizing the function or using Graviton2.",
  },
  {
    id: "alert-008",
    title: "RDS Connection Pool Near Limit",
    description: "gl-postgres-primary is using 148/150 available connections. New connections may be refused.",
    severity: "high",
    status: "resolved",
    service: "gl-postgres-primary",
    serviceId: "db-gl-primary",
    region: "us-east-1",
    timestamp: "2025-06-09T22:30:00Z",
    resolvedAt: "2025-06-09T23:10:00Z",
    category: "availability",
    recommendation: "Consider enabling RDS Proxy to pool and multiplex database connections.",
  },
];

export const MOCK_ALERT_TREND: { date: string; critical: number; high: number; medium: number; low: number }[] = [
  { date: "Jun 4",  critical: 0, high: 1, medium: 3, low: 2 },
  { date: "Jun 5",  critical: 1, high: 2, medium: 2, low: 3 },
  { date: "Jun 6",  critical: 0, high: 0, medium: 4, low: 1 },
  { date: "Jun 7",  critical: 2, high: 3, medium: 1, low: 2 },
  { date: "Jun 8",  critical: 1, high: 1, medium: 3, low: 4 },
  { date: "Jun 9",  critical: 1, high: 2, medium: 2, low: 2 },
  { date: "Jun 10", critical: 2, high: 2, medium: 2, low: 1 },
];
