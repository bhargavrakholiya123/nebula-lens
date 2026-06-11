// src/components/dashboard/data/services.ts
// Hardcoded AWS service list for the Right Panel

export type ServiceStatus = "healthy" | "warning" | "error" | "idle";
export type ServiceType =
  | "VPC"
  | "Subnet"
  | "EC2"
  | "Lambda"
  | "RDS"
  | "S3"
  | "SQS"
  | "APIGateway"
  | "CloudFront"
  | "DynamoDB";

export interface MockService {
  id: string;
  name: string;
  type: ServiceType;
  status: ServiceStatus;
  region: string;
  cost: number; // monthly USD
  metrics: {
    cpu?: number;
    memory?: number;
    requests?: number;
    latency?: number;
    storage?: string;
    invocations?: number;
    errorRate?: number;
  };
  tags: string[];
  lastUpdated: string;
  description: string;
  arn: string;
}

export const MOCK_SERVICES: MockService[] = [
  {
    id: "vpc-0a1b2c3d",
    name: "gravity-lens-vpc",
    type: "VPC",
    status: "healthy",
    region: "us-east-1",
    cost: 0,
    metrics: {},
    tags: ["production", "core"],
    lastUpdated: "2025-06-10T08:00:00Z",
    description: "Primary VPC for GravityLens production infrastructure",
    arn: "arn:aws:ec2:us-east-1:123456789012:vpc/vpc-0a1b2c3d",
  },
  {
    id: "subnet-0b1c2d3e",
    name: "gl-public-subnet-1a",
    type: "Subnet",
    status: "healthy",
    region: "us-east-1",
    cost: 0,
    metrics: {},
    tags: ["production", "public"],
    lastUpdated: "2025-06-10T08:00:00Z",
    description: "Public subnet in AZ us-east-1a",
    arn: "arn:aws:ec2:us-east-1:123456789012:subnet/subnet-0b1c2d3e",
  },
  {
    id: "i-0c1d2e3f",
    name: "gl-api-server-01",
    type: "EC2",
    status: "healthy",
    region: "us-east-1",
    cost: 142.80,
    metrics: { cpu: 34, memory: 62, requests: 12400, latency: 42 },
    tags: ["production", "api"],
    lastUpdated: "2025-06-10T10:22:00Z",
    description: "Primary API server — t3.xlarge",
    arn: "arn:aws:ec2:us-east-1:123456789012:instance/i-0c1d2e3f",
  },
  {
    id: "func-gl-processor",
    name: "gl-data-processor",
    type: "Lambda",
    status: "warning",
    region: "us-east-1",
    cost: 18.40,
    metrics: { invocations: 840000, errorRate: 2.4, latency: 230 },
    tags: ["production", "processing"],
    lastUpdated: "2025-06-10T10:45:00Z",
    description: "Processes infrastructure scan events — Node.js 20.x",
    arn: "arn:aws:lambda:us-east-1:123456789012:function:gl-data-processor",
  },
  {
    id: "func-gl-notifier",
    name: "gl-alert-notifier",
    type: "Lambda",
    status: "healthy",
    region: "us-east-1",
    cost: 4.10,
    metrics: { invocations: 124000, errorRate: 0.1, latency: 85 },
    tags: ["production", "alerts"],
    lastUpdated: "2025-06-10T09:30:00Z",
    description: "Sends alert notifications via SNS — Python 3.12",
    arn: "arn:aws:lambda:us-east-1:123456789012:function:gl-alert-notifier",
  },
  {
    id: "db-gl-primary",
    name: "gl-postgres-primary",
    type: "RDS",
    status: "healthy",
    region: "us-east-1",
    cost: 280.50,
    metrics: { cpu: 18, memory: 45, storage: "142 GB" },
    tags: ["production", "database", "critical"],
    lastUpdated: "2025-06-10T10:50:00Z",
    description: "Primary PostgreSQL 15 — db.r6g.large, Multi-AZ",
    arn: "arn:aws:rds:us-east-1:123456789012:db:gl-postgres-primary",
  },
  {
    id: "s3-gl-snapshots",
    name: "gravitylens-snapshots",
    type: "S3",
    status: "healthy",
    region: "us-east-1",
    cost: 12.30,
    metrics: { storage: "48.2 GB", requests: 320000 },
    tags: ["production", "storage", "snapshots"],
    lastUpdated: "2025-06-10T08:15:00Z",
    description: "Stores infrastructure state snapshots and version history",
    arn: "arn:aws:s3:::gravitylens-snapshots",
  },
  {
    id: "s3-gl-assets",
    name: "gravitylens-static-assets",
    type: "S3",
    status: "healthy",
    region: "us-east-1",
    cost: 3.80,
    metrics: { storage: "8.1 GB", requests: 1200000 },
    tags: ["production", "cdn", "static"],
    lastUpdated: "2025-06-10T07:00:00Z",
    description: "Static assets served via CloudFront",
    arn: "arn:aws:s3:::gravitylens-static-assets",
  },
  {
    id: "sqs-gl-queue",
    name: "gl-scan-queue",
    type: "SQS",
    status: "healthy",
    region: "us-east-1",
    cost: 2.10,
    metrics: { requests: 520000 },
    tags: ["production", "queue"],
    lastUpdated: "2025-06-10T10:55:00Z",
    description: "FIFO queue for infrastructure scan jobs",
    arn: "arn:aws:sqs:us-east-1:123456789012:gl-scan-queue.fifo",
  },
  {
    id: "apigw-gl-rest",
    name: "GravityLens-REST-API",
    type: "APIGateway",
    status: "healthy",
    region: "us-east-1",
    cost: 8.90,
    metrics: { requests: 2800000, latency: 38, errorRate: 0.05 },
    tags: ["production", "api", "gateway"],
    lastUpdated: "2025-06-10T10:50:00Z",
    description: "REST API Gateway — v1, Regional endpoint",
    arn: "arn:aws:execute-api:us-east-1:123456789012:abc123def",
  },
  {
    id: "cf-gl-cdn",
    name: "gravitylens-cdn",
    type: "CloudFront",
    status: "error",
    region: "global",
    cost: 22.40,
    metrics: { requests: 8400000, latency: 24, errorRate: 5.8 },
    tags: ["production", "cdn", "critical"],
    lastUpdated: "2025-06-10T10:58:00Z",
    description: "Global CDN distribution — cache hit rate 89%",
    arn: "arn:aws:cloudfront::123456789012:distribution/ABCDEFGHIJKL",
  },
  {
    id: "ddb-gl-sessions",
    name: "gl-user-sessions",
    type: "DynamoDB",
    status: "healthy",
    region: "us-east-1",
    cost: 9.20,
    metrics: { requests: 4200000, latency: 3 },
    tags: ["production", "database", "sessions"],
    lastUpdated: "2025-06-10T10:45:00Z",
    description: "DynamoDB table — user sessions and auth tokens",
    arn: "arn:aws:dynamodb:us-east-1:123456789012:table/gl-user-sessions",
  },
];

export const SERVICE_ICON_MAP: Record<ServiceType, string> = {
  VPC:         "/icons/amazon-virtual-private-cloud.svg",
  Subnet:      "/icons/aws-public-subnet.svg",
  EC2:         "/icons/amazon-ec2.svg",
  Lambda:      "/icons/amazon-lambda.svg",
  RDS:         "/icons/amazon-rds.svg",
  S3:          "/icons/amazon-simple-storage-service.svg",
  SQS:         "/icons/amazon-simple-queue-service.svg",
  APIGateway:  "/icons/amazon-api-gateway.svg",
  CloudFront:  "/icons/amazon-cloudfront.svg",
  DynamoDB:    "/icons/amazon-dynamodb.svg",
};

export const SERVICE_COLOR_MAP: Record<ServiceType, string> = {
  VPC:        "#A855F7",
  Subnet:     "#6366F1",
  EC2:        "#F59E0B",
  Lambda:     "#EC4899",
  RDS:        "#06B6D4",
  S3:         "#10B981",
  SQS:        "#F97316",
  APIGateway: "#8B5CF6",
  CloudFront: "#14B8A6",
  DynamoDB:   "#3B82F6",
};
