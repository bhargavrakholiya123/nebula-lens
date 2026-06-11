// src/components/dashboard/data/snapshots.ts
export interface ResourceChange {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  changeType: "added" | "removed" | "modified";
  field?: string;
  oldValue?: string;
  newValue?: string;
}

export interface InfraSnapshot {
  id: string;
  version: string;
  label: string;
  timestamp: string;
  triggeredBy: string;
  totalResources: number;
  changes: ResourceChange[];
  summary: {
    added: number;
    removed: number;
    modified: number;
  };
}

export const MOCK_SNAPSHOTS: InfraSnapshot[] = [
  {
    id: "snap-001",
    version: "v1.0.0",
    label: "Initial Deployment",
    timestamp: "2025-06-01T09:00:00Z",
    triggeredBy: "terraform apply",
    totalResources: 8,
    changes: [],
    summary: { added: 8, removed: 0, modified: 0 },
  },
  {
    id: "snap-002",
    version: "v1.1.0",
    label: "Added CloudFront CDN",
    timestamp: "2025-06-03T14:30:00Z",
    triggeredBy: "terraform apply",
    totalResources: 10,
    changes: [
      { id: "c1", resourceId: "cf-gl-cdn",    resourceName: "gravitylens-cdn",     resourceType: "CloudFront", changeType: "added" },
      { id: "c2", resourceId: "s3-gl-assets", resourceName: "gravitylens-static-assets", resourceType: "S3", changeType: "added" },
    ],
    summary: { added: 2, removed: 0, modified: 0 },
  },
  {
    id: "snap-003",
    version: "v1.2.0",
    label: "RDS Upgrade + Lambda Fix",
    timestamp: "2025-06-05T11:00:00Z",
    triggeredBy: "terraform apply",
    totalResources: 10,
    changes: [
      { id: "c3", resourceId: "db-gl-primary", resourceName: "gl-postgres-primary", resourceType: "RDS", changeType: "modified", field: "instance_class", oldValue: "db.t3.medium", newValue: "db.r6g.large" },
      { id: "c4", resourceId: "func-gl-processor", resourceName: "gl-data-processor", resourceType: "Lambda", changeType: "modified", field: "memory_size", oldValue: "512", newValue: "1024" },
    ],
    summary: { added: 0, removed: 0, modified: 2 },
  },
  {
    id: "snap-004",
    version: "v1.2.1",
    label: "IAM Drift Detected",
    timestamp: "2025-06-09T14:20:00Z",
    triggeredBy: "manual console change",
    totalResources: 10,
    changes: [
      { id: "c5", resourceId: "iam-admin-role", resourceName: "admin-role", resourceType: "IAM Role", changeType: "modified", field: "policy", oldValue: "s3:GetObject, s3:PutObject", newValue: "s3:*" },
      { id: "c6", resourceId: "sg-0x12345", resourceName: "db-security-group", resourceType: "Security Group", changeType: "modified", field: "ingress_rule", oldValue: "port 22: 10.0.0.0/8", newValue: "port 22: 0.0.0.0/0" },
    ],
    summary: { added: 0, removed: 0, modified: 2 },
  },
  {
    id: "snap-005",
    version: "v1.3.0",
    label: "DynamoDB Sessions Table",
    timestamp: "2025-06-10T08:00:00Z",
    triggeredBy: "terraform apply",
    totalResources: 11,
    changes: [
      { id: "c7", resourceId: "ddb-gl-sessions", resourceName: "gl-user-sessions", resourceType: "DynamoDB", changeType: "added" },
    ],
    summary: { added: 1, removed: 0, modified: 0 },
  },
  {
    id: "snap-006",
    version: "v1.3.1",
    label: "Current State",
    timestamp: "2025-06-10T10:58:00Z",
    triggeredBy: "auto-scan",
    totalResources: 12,
    changes: [
      { id: "c8", resourceId: "func-gl-notifier", resourceName: "gl-alert-notifier", resourceType: "Lambda", changeType: "added" },
    ],
    summary: { added: 1, removed: 0, modified: 0 },
  },
];

export const MOCK_COST_DATA: { date: string; cost: number; baseline: number }[] = [
  { date: "Jun 1",  cost: 380, baseline: 400 },
  { date: "Jun 2",  cost: 395, baseline: 400 },
  { date: "Jun 3",  cost: 412, baseline: 400 },
  { date: "Jun 4",  cost: 440, baseline: 400 },
  { date: "Jun 5",  cost: 458, baseline: 420 },
  { date: "Jun 6",  cost: 430, baseline: 420 },
  { date: "Jun 7",  cost: 445, baseline: 420 },
  { date: "Jun 8",  cost: 462, baseline: 420 },
  { date: "Jun 9",  cost: 478, baseline: 420 },
  { date: "Jun 10", cost: 504, baseline: 420 },
];

export const MOCK_COST_BREAKDOWN = [
  { name: "RDS",          value: 280.50, color: "#06B6D4" },
  { name: "EC2",          value: 142.80, color: "#F59E0B" },
  { name: "CloudFront",   value:  22.40, color: "#14B8A6" },
  { name: "Lambda",       value:  22.50, color: "#EC4899" },
  { name: "S3",           value:  16.10, color: "#10B981" },
  { name: "DynamoDB",     value:   9.20, color: "#3B82F6" },
  { name: "API Gateway",  value:   8.90, color: "#8B5CF6" },
  { name: "Other",        value:  12.10, color: "#6B7280" },
];
