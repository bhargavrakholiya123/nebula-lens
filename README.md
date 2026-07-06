<div align="center">

# Nebula Lens · GravityLens

**Cloud Infrastructure Intelligence — Discover, Visualize, Understand, and Control your AWS universe.**

---

[![License: MIT](https://img.shields.io/badge/License-MIT-6366f1.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-a855f7?style=for-the-badge)](https://github.com/bhargavrakholiya123/nebula-lens/releases)
[![Build Status](https://img.shields.io/badge/Build-Passing-10b981?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/bhargavrakholiya123/nebula-lens/actions)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.x-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![AWS](https://img.shields.io/badge/AWS-Boto3-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)

</div>

---


##  Introduction

**Nebula Lens** (also known as **GravityLens**) is a next-generation, open-source **Cloud Infrastructure Intelligence Platform** built for engineering teams who need to truly *understand* their AWS environments — not just list resources, but see how they relate, how much they cost, and how they evolve over time.

### What Is It?

Nebula Lens is a full-stack platform that:

1. **Automatically discovers** all AWS resources across accounts and regions using cross-account IAM role assumption via AWS STS.
2. **Infers runtime relationships** between those resources by statically analyzing IAM roles, Security Group rules, Event Source Mappings, and API Gateway integrations.
3. **Renders an interactive topology graph** of your entire architecture using React Flow — with automatic ELK layout, animated edges, and multi-dimensional "lens" views.
4. **Snapshots the entire infrastructure state** at every scan, enabling deterministic *Time Travel* — scroll back through infrastructure history with full cost breakdowns and diff analysis.
5. **Calculates per-resource monthly cost estimates** by querying the AWS Pricing API, with a pluggable registry-based calculator for every major AWS service.

### Why Does It Exist?

Cloud infrastructure has grown beyond human comprehension at the console level. A mature AWS environment can have hundreds of services, thousands of resources, and millions of event-driven connections spread across dozens of regions. The AWS Console shows you a list. Nebula Lens shows you the *truth*.

### Target Users

| Persona | Use Case |
|---|---|
| **Platform Engineers** | Audit cross-service dependencies before making infrastructure changes |
| **FinOps Teams** | Identify cost hotspots and under-utilized resources at a glance |
| **Security Engineers** | Visualize IAM role chains, Security Group overlaps, and blast radius |
| **Engineering Managers** | Get a monthly infrastructure history with drift detection |
| **Solutions Architects** | Document, review, and validate AWS architectures automatically |
| **DevOps/SRE Teams** | Trace deployment impacts and monitor environment changes over time |

### Real-World Use Cases

- *"We need to know what breaks if we delete this Lambda."* → Use the Relationship Graph to see all upstream/downstream dependencies in seconds.
- *"Our AWS bill went up 30% this month — why?"* → Use the Timeline to compare costs between snapshots and identify what changed.
- *"We're being audited for SOC 2 — can you document our infrastructure?"* → Export a snapshot that shows all resources, their connections, and their configurations at a specific point in time.
- *"We're deprecating us-east-1 — what do we need to migrate?"* → Use the regional filter to inventory every resource and its relationships in that region.

### Business Value

- **Reduces incident investigation time** from hours to minutes by making architectural topology instantly visible.
- **Cuts cloud waste** by surfacing idle EC2 instances, over-provisioned RDS clusters, and under-utilized Lambda functions with live CloudWatch metrics.
- **Enforces architectural discipline** by making hidden dependencies explicit before infrastructure changes are made.
- **Eliminates manual architecture documentation** — the system self-documents on every scan cycle.

---

## Problem Statement

### The Cloud Visibility Crisis

Modern cloud environments are fundamentally opaque. AWS provides per-service consoles, CLI tools, and service-specific APIs, but no unified, relationship-aware view of how your infrastructure *actually works*.

**Current limitations of existing tools:**

| Tool | Limitation |
|---|---|
| **AWS Console** | Per-service views only. No cross-service relationship graph. No history. No cost aggregation by topology. |
| **AWS CloudFormation** | Only shows resources *it manages*. Blind to manually created or third-party resources. |
| **Terraform / CDK** | Shows infrastructure as code, not infrastructure as it *currently exists* in the cloud. Drift is invisible. |
| **AWS Config** | Rule-based compliance, not topology visualization. Relationships are buried in JSON. |
| **Datadog / New Relic** | Excellent for runtime observability, but not for infrastructure topology or cost-aware architecture views. |
| **Lucidchart / Draw.io** | Manual. Stale the moment a resource changes. No connection to live AWS data. |

### Why Existing Tools Fall Short

1. **No Relationship Graph**: AWS does not expose a unified graph API. Relationships between an API Gateway and a Lambda, or between a Lambda and an RDS database, must be *inferred* from IAM roles, Security Group rules, and event source configurations. No off-the-shelf tool does this inference reliably.

2. **No Infrastructure Time Travel**: Most tools show you a point-in-time snapshot. None provide a versioned, diffable history of your entire infrastructure with cost delta analysis between versions.

3. **No Per-Node Cost Estimation**: AWS Cost Explorer aggregates costs by service and tag, but can't tell you *this specific Lambda function* or *this specific RDS cluster* costs $X per month.

4. **No Topology-Aware Cost Analysis**: You can't currently ask AWS: "Show me the total cost of everything inside this VPC" or "How much does this entire microservice cluster cost?" Nebula Lens answers these questions.

---

## Motivation

### Developer Perspective

As engineers operating in large AWS environments, we repeatedly faced the same problem: **making safe changes is terrifying when you can't see the full blast radius.** Before Nebula Lens, answering "what talks to this Lambda?" required cross-referencing IAM policies, EventBridge rules, SQS triggers, and API Gateway integrations — manually, across multiple console tabs.

The developer motivation was to build a **single pane of glass** that makes implicit infrastructure dependencies *explicit* and permanent.

### Business Perspective

Cloud cost overruns are the #1 operational concern for engineering organizations scaling on AWS. The challenge isn't that people don't care about cost — it's that **cost is disconnected from architectural understanding.** Nebula Lens bridges this gap by attaching cost estimates directly to topology nodes, making the conversation "this EC2 cluster costs $2,400/month" *visual and actionable*.

### Cloud Architecture Perspective

The system is designed with a core architectural philosophy: **the backend must be the only component that understands AWS.** The frontend should receive a clean, normalized graph contract (`{id, type, data, position}`) and never need to parse Boto3 response shapes. This strict adapter pattern means:

- AWS API changes only require backend scanner updates.
- Frontend components are reusable across any data source.
- The graph contract is stable and version-controlled.

---

## 🔭 Solution Overview

Nebula Lens is organized around a **6-stage pipeline** that transforms raw AWS API data into actionable intelligence.

```mermaid
graph LR
    A["☁️ AWS Cloud"] --> B["🔍 Discovery\n(Scanners)"]
    B --> C["⚙️ Normalization\n(Adapter)"]
    C --> D["🔗 Relationship\nEngine"]
    D --> E["💾 Snapshot\nEngine"]
    E --> F["💰 Cost Engine"]
    F --> G["🖥️ Frontend\n(React Flow)"]
```

### Stage 1: Discovery

The [Scan Orchestrator](backend/app/engines/scan_orchestrator.py) assumes a customer-provided IAM Role via AWS STS and fans out parallel Boto3 API calls across all configured AWS regions. Each AWS service has a dedicated scanner module (e.g., `ec2_scanner.py`, `lambda_scanner.py`) that handles pagination, error isolation, and raw data extraction. A single service API failure (e.g., rate limiting on Lambda) triggers a **partial success** state — it never crashes the entire scan job.

### Stage 2: Normalization

The [Normalizer](backend/app/engines/normalizer.py) is the largest single module in the backend (42KB). It acts as a massive **Adapter layer** converting chaotic, service-specific Boto3 JSON into a strict React Flow node schema:

```json
{
  "id": "arn:aws:lambda:us-east-1:123:function:my-fn",
  "type": "lambdaNode",
  "data": { "name": "my-fn", "service": "lambda", "metrics": {} }
}
```

It also computes a **SHA-256 fingerprint** of each resource's sorted metric set, used later for drift detection between snapshots.

### Stage 3: Relationship Engine

The [Relationship Engine](backend/app/engines/relationship_engine.py) infers communication edges between resources that AWS never explicitly declares. It operates across multiple passes:

- **Pass 1**: Direct ARN/ID references in resource metadata (e.g., Lambda's `vpcId`, API Gateway `integrations`).
- **Pass 2**: IAM role policy analysis — finds which services a Lambda or EC2 can access based on its execution role's attached policies.
- **Pass 3**: Environment variable heuristics — infers probable S3, SQS, DynamoDB, or SNS connections from Lambda's environment variable names.
- **Pass 4**: Network topology resolution — uses Security Group ingress/egress rule IP CIDR analysis to detect EC2 ↔ RDS communication paths.

### Stage 4: Snapshot Engine

The [Snapshot Engine](backend/app/engines/snapshot_engine.py) implements a **full deep-copy persistence strategy**. Every scan creates a new, immutable `Snapshot` record with all associated `Resources`, `Relationships`, `NormalizedNodes`, and `NormalizedEdges`. It then diffs resource fingerprints between the current and previous snapshot to produce a `SnapshotDiff` catalog tracking what was `added`, `removed`, or `modified`. This guarantees O(1) read performance for historical timeline queries.

### Stage 5: Cost Engine

The [Cost Engine](backend/app/engines/cost_engine.py) uses a **pluggable registry pattern** — each AWS service has a dedicated `CostCalculator` class registered at startup. The engine routes any node to the correct calculator automatically. Calculators query the AWS Pricing API with a 3-level fallback: live API → cached response → hardcoded fallback table.

### Stage 6: Visualization & Dashboard

The Next.js frontend renders the normalized graph using **React Flow** (`@xyflow/react`) with custom node components for every supported AWS service. The layout is computed client-side by **ELK.js** (Eclipse Layout Kernel), a production-grade graph layout engine. The **Timeline** view uses `@visx` charts to display cost progression and resource count changes across all snapshots.

---

##  Key Features

### Cloud Discovery

- **Multi-account support** via AWS STS cross-account IAM role assumption
- **Multi-region scanning** — discovers resources across all configured AWS regions in parallel
- **On-demand scan triggering** — manual scans can be queued from the frontend dashboard
- **Scheduler-based polling** — APScheduler runs discovery every 5 minutes for continuous monitoring
- **Resilient error isolation** — per-service failures do not abort the entire scan job (partial success state)
- **16+ AWS service scanners** including EC2, VPC, Lambda, RDS, S3, SQS, SNS, API Gateway, DynamoDB, ECS, CloudFront, EventBridge, IAM, Secrets Manager, and more

### Visualization

- **Interactive topology graph** powered by React Flow with pan, zoom, and node selection
- **22 custom AWS node components** — each with service-specific icons, metrics, and visual states
- **Automatic ELK.js layout** — production-grade hierarchical graph layout computed client-side
- **Multiple lens views** — switch between different visualization modes (topology, cost, security)
- **Animated edges** — custom animated edge renderer for visualizing data flow direction
- **Undo/Redo** with Zundo temporal state management (`Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z`)
- **Spring animation** — smooth position interpolation when switching layouts
- **Dark and Light themes** via next-themes

### Relationship Engine

- **40+ relationship rules** covering all major AWS service interaction patterns
- **Confidence scoring** — each inferred edge carries a 0–100 confidence score and evidence list
- **Edge categories** — relationships typed as `runtime`, `iam`, `network`, `infrastructure`
- **IAM policy analysis** — traverses role ARNs to infer Lambda-to-S3, EC2-to-RDS connections
- **Security Group network resolution** — detects EC2 ↔ RDS paths via IP CIDR overlap analysis
- **Environment variable heuristics** — infers probable resource references from Lambda env vars
- **VPC/Subnet hierarchy** — parent-child containment modeled via `parentId` (not edges)

### Cost Analysis

- **Per-node monthly cost estimation** for every AWS resource in the graph
- **18 service-specific cost calculators** (EC2, Lambda, RDS, S3, SQS, SNS, API Gateway, DynamoDB, ECS, EKS, CloudFront, EventBridge, Secrets Manager, Step Functions, VPC, Subnet, and more)
- **AWS Pricing API integration** with a 3-level fallback (live → cached → static table)
- **Cost-by-service breakdown** per snapshot stored in the database
- **NAT Gateway cost allocation** — distributes fixed monthly VPC costs proportionally across subnets by resource density
- **Cost delta between snapshots** — see exactly how much infrastructure changes affected your bill

### Snapshots

- **Immutable full-copy snapshots** — every scan produces a complete, independent snapshot
- **Automatic versioning** — Version 1, Version 2, Version N generated automatically
- **SHA-256 fingerprinting** — deterministic resource state fingerprints for drift detection
- **Diff catalog** — every snapshot diff records exactly what `added`, `removed`, or `modified`
- **O(1) historical reads** — `is_latest` flag and `snapshot_id` indexing make history queries instant

### History & Timeline

- **Chronological timeline view** — scroll through all infrastructure snapshots from oldest to newest
- **Per-snapshot cost breakdown** — total monthly cost and cost-by-service for each version
- **Change delta indicators** — added/removed/modified resource counts between consecutive snapshots
- **Resource count trend** — see how your infrastructure footprint grows over time
- **Time Travel** — load any historical snapshot into the topology graph

### Authentication

- **User model** with Auth0 integration scaffold (ready for Auth0 OAuth2 connection)
- **Cross-account IAM role assumption** with External ID support for secure third-party access
- **Environment-based secret management** via `.env` files and Docker environment injection

### Dashboard

- **Overview page** with per-account resource counts, cost summaries, and trend sparklines
- **Database Explorer** — direct portal to browse raw database tables from the UI
- **Scan job management** — view pending, running, and completed scan job statuses
- **Multi-account navigation** via sidebar account switcher

### API

- **FastAPI REST API** with automatic OpenAPI/Swagger documentation at `/docs`
- **ReDoc alternative documentation** at `/redoc`
- **6 router modules** covering accounts, graph, normalization, analysis, history, and DB inspection
- **CORS-enabled** for local development and configurable production origins

---

## Screenshots

> **Note**: Screenshots below illustrate the platform capabilities. The topology canvas renders live from your AWS account data.

### Architecture Topology Graph

*Interactive React Flow canvas showing VPCs, Subnets, EC2 instances, Lambda functions, RDS databases, API Gateways, and their relationships — all auto-discovered and auto-laid-out.*

```
┌─────────────────────────────────────────────────────────┐
│  🌐 VPC: vpc-0abc123                                    │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ 🔷 Subnet       │  │ 🔷 Subnet (Private)         │  │
│  │ ┌───────────┐   │  │ ┌──────────┐  ┌──────────┐  │  │
│  │ │ λ Lambda  │───┼──┼─│ 🗄️ RDS   │  │ 📦 EC2   │  │  │
│  │ └───────────┘   │  │ └──────────┘  └──────────┘  │  │
│  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
       ↑ Invokes              ↑ Reads from
  [API Gateway]           [S3 Bucket]
```

### Infrastructure Timeline

*Scroll through snapshot history, view cost progression charts, and inspect change diffs between any two infrastructure versions.*

### Cost Dashboard

*Per-node cost estimates, service-level breakdowns, and month-over-month delta analysis powered by the AWS Pricing API.*

### Node Detail Sidebar

*Click any node to open the metrics sidebar — showing CloudWatch data, resource configuration, tags, and estimated monthly cost.*

### Database Explorer

*Built-in admin portal to browse and inspect all raw database tables directly from the Next.js UI.*

---

## System Architecture

```mermaid
graph TB
    subgraph "Frontend — Next.js 16"
        UI["🖥️ Architecture Canvas\nReact Flow + ELK.js"]
        TL["📅 Timeline View\n@visx Charts"]
        DB_UI["🗄️ DB Explorer"]
        DASH["📊 Overview Dashboard"]
    end

    subgraph "Backend — FastAPI + APScheduler"
        API["🚀 REST API Layer\nFastAPI Routers"]
        SCHED["⏰ Background Scheduler\nAPScheduler — 5min"]
        ORCH["🔍 Scan Orchestrator"]
        NORM["⚙️ Normalizer\nAdapter Layer"]
        REL["🔗 Relationship Engine\n40+ rules"]
        SNAP["📸 Snapshot Engine\nFull-copy persistence"]
        COST["💰 Cost Engine\n18 calculators"]
        MET["📈 Metrics Engine\nCloudWatch"]
    end

    subgraph "Data Layer — PostgreSQL 15"
        PG[("🐘 PostgreSQL\nSnapshots · Resources\nRelationships · Diffs\nNormalized Nodes/Edges")]
    end

    subgraph "AWS Cloud"
        STS["🔐 STS\nRole Assumption"]
        SCAN["☁️ Boto3 Scanners\n16+ services"]
        CW["📊 CloudWatch\nMetrics"]
        PRICE["💵 Pricing API"]
    end

    UI -->|HTTP| API
    TL -->|HTTP| API
    DB_UI -->|HTTP| API
    DASH -->|HTTP| API

    API --> ORCH
    API --> NORM
    SCHED --> ORCH

    ORCH -->|Assume Role| STS
    ORCH -->|Discover| SCAN
    SCAN --> NORM
    NORM --> REL
    REL --> SNAP
    SNAP --> COST
    MET -->|CloudWatch| CW
    COST -->|Pricing| PRICE

    SNAP -->|Write| PG
    API -->|Read| PG
```

### Component Explanations

| Component | Responsibility | Why It's Designed This Way |
|---|---|---|
| **Scan Orchestrator** | Manages the lifecycle of a `ScanJob`, fans out parallel Boto3 calls, handles partial failures | Isolation prevents a single rate-limited service from failing the entire scan |
| **Normalizer** | Converts raw Boto3 JSON → React Flow node schema with SHA-256 fingerprints | Strict adapter pattern ensures the frontend never parses AWS response quirks |
| **Relationship Engine** | Infers communication edges via IAM, Security Groups, Event Source Mappings, env heuristics | AWS has no unified graph API; relationships must be derived from metadata |
| **Snapshot Engine** | Full-copy immutable snapshots with diff calculation | Deep copies guarantee O(1) historical reads; diffs enable instant drift detection |
| **Cost Engine** | Registry-based dispatcher routing nodes to service-specific cost calculators | Registry pattern allows adding new service calculators without changing core engine code |
| **Metrics Engine** | Queries CloudWatch for live resource metrics (CPU, invocations, connections) | Decoupled from scanners to allow async metric enrichment without blocking topology scan |
| **FastAPI Routers** | Exposes REST endpoints for graph, history, analysis, normalization, accounts | FastAPI chosen for automatic OpenAPI docs, Pydantic validation, and async performance |
| **APScheduler** | Polls pending scan jobs every 5 minutes in a background thread | Background scheduling keeps the FastAPI process responsive; `max_instances=1` prevents concurrent scan storms |
| **PostgreSQL** | Stores all snapshots, resources, relationships, diffs, and normalized graph data | JSONB support is critical for storing flexible AWS resource metadata; UUID primary keys for distributed-safe IDs |

---

## Request Lifecycle

### Scan-Triggered Infrastructure Discovery

<<<<<<< HEAD
![workflow](image.png)
=======
```mermaid
sequenceDiagram
    participant User as 🖥️ Frontend
    participant API as 🚀 FastAPI
    participant Sched as ⏰ Scheduler
    participant Orch as 🔍 Orchestrator
    participant STS as 🔐 AWS STS
    participant Boto as ☁️ Boto3
    participant Norm as ⚙️ Normalizer
    participant Rel as 🔗 Rel Engine
    participant Snap as 📸 Snapshot
    participant Cost as 💰 Cost Engine
    participant DB as 🐘 PostgreSQL

    User->>API: POST /api/scan/trigger/{account_id}
    API->>DB: INSERT ScanJob (status: pending)
    API-->>User: 200 {"job_id": "...", "status": "queued"}

    Note over Sched,DB: APScheduler polls every 300s
    Sched->>DB: SELECT pending ScanJobs LIMIT 5
    Sched->>Orch: run_scan(job_id)

    Orch->>DB: UPDATE ScanJob (status: running)
    Orch->>STS: AssumeRole(role_arn, external_id)
    STS-->>Orch: Temporary credentials

    loop For each configured region
        Orch->>Boto: Discover EC2, Lambda, RDS, S3, VPC...
        Boto-->>Orch: Raw Boto3 JSON responses
    end

    Orch->>Norm: normalize(raw_resources)
    Norm-->>Orch: React Flow nodes + SHA-256 fingerprints

    Orch->>Rel: build_edges(nodes, raw_resources)
    Rel-->>Orch: Typed edges with confidence scores

    Orch->>Snap: create_snapshot(nodes, edges)
    Snap->>Cost: calculate_all(nodes, credentials)
    Cost-->>Snap: nodes with monthly_cost populated
    Snap->>DB: INSERT Snapshot + Resources + Relationships + Diffs
    Snap-->>Orch: snapshot_id

    Orch->>DB: UPDATE ScanJob (status: success)
```

### Graph Read Request

```mermaid
sequenceDiagram
    participant User as 🖥️ Frontend
    participant API as 🚀 FastAPI
    participant DB as 🐘 PostgreSQL

    User->>API: GET /api/graph/{account_id}?snapshot_id=latest
    API->>DB: SELECT NormalizedNodes WHERE snapshot_id = latest
    API->>DB: SELECT NormalizedEdges WHERE snapshot_id = latest
    DB-->>API: nodes[], edges[]
    API-->>User: 200 { nodes: [...], edges: [...] }
    Note over User: ELK.js computes layout client-side
    User->>User: Render React Flow topology canvas
```
>>>>>>> 4ce6e94e1e40576506eda62d08ce4ae27293e4cb

---

## Data Flow

```mermaid
flowchart TD
    AWS["☁️ AWS Cloud APIs\nBoto3 · 16+ services"]

    subgraph "Backend Pipeline"
        S1["🔍 Scanners\nec2_scanner · lambda_scanner\nrds_scanner · vpc_scanner · ..."]
        S2["⚙️ Normalizer\nBoto3 JSON → React Flow Schema\nSHA-256 Fingerprinting"]
        S3["🔗 Relationship Engine\nPass1: ARN refs · Pass2: IAM\nPass3: Env heuristics · Pass4: Network"]
        S4["💰 Cost Engine\nAWS Pricing API\n18 service calculators"]
        S5["📸 Snapshot Engine\nFull-copy persistence\nDiff calculation"]
    end

    DB[("🐘 PostgreSQL\nsnapshots · resources\nrelationships · normalized_nodes\nnormalized_edges · snapshot_diffs")]

    subgraph "Frontend"
        F1["🚀 FastAPI REST API\n/api/graph · /api/history\n/api/accounts · /api/analyze"]
        F2["🖥️ Next.js Frontend\nReact Flow Canvas\nTimeline · Dashboard"]
        F3["⚡ ELK.js Layout\nClient-side"]
    end

    AWS --> S1
    S1 --> S2
    S2 --> S3
    S3 --> S4
    S4 --> S5
    S5 -->|Write| DB
    DB -->|Read| F1
    F1 -->|JSON| F2
    F2 --> F3
    F3 -->|Rendered Graph| F2
```

---

## Technology Stack

| Layer | Technology | Version | Why Chosen |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | 16.x | React Server Components, file-based routing, built-in API routes |
| **UI Language** | TypeScript | 5.x | Type-safe React Flow node/edge contracts prevent runtime schema mismatches |
| **Graph Visualization** | @xyflow/react (React Flow) | 12.x | Production-grade interactive graph library with custom node/edge support |
| **Graph Layout Engine** | ELK.js | 0.11 | Eclipse Layout Kernel — mathematically optimal hierarchical layout; client-side to offload CPU from backend |
| **Charts / Data Viz** | @visx | 4.x | Low-level D3-backed primitives for the Timeline cost progression charts |
| **Animations** | Framer Motion | 12.x | Smooth micro-animations for node transitions and sidebar panels |
| **State Management** | Zustand + Zundo | 5.x / 2.x | Minimal boilerplate; Zundo adds temporal undo/redo on top of Zustand |
| **Component Primitives** | shadcn/ui + Radix | 4.x | Accessible, unstyled primitives with custom design token styling |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS with JIT compilation |
| **Icons** | Phosphor Icons | 2.x | Consistent, comprehensive icon set with AWS service equivalents |
| **Backend Framework** | FastAPI | 0.111 | Automatic OpenAPI docs, Pydantic v2 validation, async-first design |
| **Backend Language** | Python | 3.12 | Boto3 is the canonical AWS SDK; Python has the richest cloud tooling ecosystem |
| **AWS SDK** | Boto3 + Botocore | 1.34.x | Official AWS Python SDK with comprehensive service coverage |
| **Background Jobs** | APScheduler | 3.10 | Lightweight scheduler embedded in the FastAPI process; no separate Celery infrastructure needed |
| **ORM** | SQLAlchemy | 2.x | Mature, production-tested Python ORM with PostgreSQL JSONB support |
| **Migrations** | Alembic | 1.13 | SQLAlchemy-native migration framework with full schema versioning |
| **Database** | PostgreSQL | 15 | JSONB columns for flexible AWS metadata; UUID primary keys; partial indexes for query performance |
| **Validation** | Pydantic | 2.7 | Request/response schema validation; settings management via `pydantic-settings` |
| **Container Runtime** | Docker + Docker Compose | — | Single-command local setup; production-ready container packaging |
| **Package Manager (FE)** | pnpm | — | Faster installs, disk-efficient node_modules with workspace support |
| **Linting** | ESLint (Next.js config) | 9.x | Opinionated code quality enforcement |
| **Deployment Target** | Hugging Face Spaces / AWS | — | Backend Dockerfile targets port 7860 for HF Spaces compatibility |

---

## 📁 Project Structure

```
nebula-lens/
├── 📄 README.md                     ← You are here
├── 📄 docker-compose.yml            ← Full-stack local orchestration
├── 📄 package.json                  ← Frontend dependencies & scripts
├── 📄 next.config.ts                ← Next.js configuration
├── 📄 tsconfig.json                 ← TypeScript configuration
├── 📄 .env                          ← Environment variables (never commit!)
│
├── 📂 backend/                      ← Python FastAPI backend
│   ├── 📄 Dockerfile                ← Backend container image (Python 3.12-slim)
│   ├── 📄 requirements.txt          ← Python dependencies
│   ├── 📄 alembic.ini               ← Alembic migration configuration
│   │
│   ├── 📂 alembic/                  ← Database migration scripts
│   │   └── versions/               ← Individual migration files
│   │
│   └── 📂 app/                      ← Main application package
│       ├── 📄 main.py               ← FastAPI app, CORS, scheduler, health check
│       ├── 📄 database.py           ← SQLAlchemy engine & session factory
│       │
│       ├── 📂 models/               ← SQLAlchemy ORM table definitions
│       │   └── models.py            ← All 10 tables: User, AwsAccount, ScanJob,
│       │                            │  ServiceScan, Snapshot, Resource, Relationship,
│       │                            │  SnapshotDiff, NormalizedNode, NormalizedEdge
│       │
│       ├── 📂 engines/              ← Core processing pipeline
│       │   ├── scan_orchestrator.py ← ScanJob lifecycle + parallel regional scanning
│       │   ├── normalizer.py        ← Boto3 JSON → React Flow schema adapter (42KB)
│       │   ├── relationship_engine.py ← 40+ inference rules for edge generation
│       │   ├── snapshot_engine.py   ← Full-copy immutable snapshotting + diffs
│       │   ├── cost_engine.py       ← Registry-based cost dispatcher
│       │   ├── metrics_engine.py    ← CloudWatch metrics enrichment
│       │   ├── pass4_network_mapper.py   ← VPC/Security Group network topology mapper
│       │   ├── pass4_network_resolver.py ← IP CIDR overlap detection for EC2↔RDS
│       │   │
│       │   ├── 📂 costs/            ← Per-service cost calculator registry
│       │   │   ├── base.py          ← BaseCostCalculator abstract class
│       │   │   ├── ec2_cost.py      ← EC2 instance pricing (On-Demand)
│       │   │   ├── lambda_cost.py   ← Lambda request + duration pricing
│       │   │   ├── rds_cost.py      ← RDS instance + storage pricing
│       │   │   ├── s3_cost.py       ← S3 storage + request pricing
│       │   │   ├── vpc_cost.py      ← VPC NAT Gateway + data transfer pricing
│       │   │   ├── subnet_cost.py   ← Proportional NAT cost allocation
│       │   │   ├── apigateway_cost.py ← API Gateway call pricing
│       │   │   ├── dynamodb_cost.py ← DynamoDB read/write capacity pricing
│       │   │   ├── sqs_cost.py      ← SQS message pricing
│       │   │   ├── sns_cost.py      ← SNS notification pricing
│       │   │   ├── ecs_cost.py      ← ECS Fargate task pricing
│       │   │   ├── eks_cost.py      ← EKS cluster pricing
│       │   │   ├── cloudfront_cost.py ← CloudFront data transfer pricing
│       │   │   ├── eventbridge_cost.py ← EventBridge event pricing
│       │   │   ├── secretsmanager_cost.py ← Secrets Manager pricing
│       │   │   └── stepfunctions_cost.py  ← Step Functions state transition pricing
│       │   │
│       │   ├── 📂 metrics/          ← Per-service CloudWatch metric collectors
│       │   └── 📂 pricing/          ← AWS Pricing API service layer
│       │
│       ├── 📂 scanners/             ← Boto3 service wrappers
│       │   ├── vpc_scanner.py       ← VPC, Subnet, IGW, Route Tables, ENIs
│       │   ├── ec2_scanner.py       ← EC2 instances + instance profiles
│       │   ├── lambda_scanner.py    ← Lambda functions + event source mappings
│       │   ├── rds_scanner.py       ← RDS instances + subnet groups
│       │   ├── s3_scanner.py        ← S3 buckets + bucket policies
│       │   ├── apigateway_scanner.py ← API Gateway REST APIs + integrations
│       │   ├── dynamodb_scanner.py  ← DynamoDB tables + GSIs
│       │   ├── ecs_scanner.py       ← ECS clusters + services + tasks
│       │   ├── eventbridge_scanner.py ← EventBridge rules + targets
│       │   ├── iam_scanner.py       ← IAM roles + attached policies
│       │   ├── sqs_scanner.py       ← SQS queues + attributes
│       │   ├── sns_scanner.py       ← SNS topics + subscriptions
│       │   ├── security_group_scanner.py ← Security Groups + rules
│       │   ├── cloudfront_scanner.py ← CloudFront distributions + origins
│       │   └── pass2_scanners.py    ← Secondary-pass enrichment scanners
│       │
│       ├── 📂 routers/              ← FastAPI route controllers
│       │   ├── aws_accounts.py      ← CRUD for AWS account registration
│       │   ├── graph.py             ← Graph topology read endpoints
│       │   ├── normalize.py         ← Normalization trigger + status endpoints
│       │   ├── analyze.py           ← Infrastructure analysis endpoints
│       │   ├── history.py           ← Snapshot timeline + diff endpoints (18KB)
│       │   └── db_inspector.py      ← Raw database table inspection endpoints
│       │
│       ├── 📂 schemas/              ← Pydantic request/response schemas
│       ├── 📂 services/             ← Business logic services
│       └── 📂 utils/                ← Shared utility functions
│
├── 📂 src/                          ← Next.js frontend source
│   ├── 📂 app/                      ← App Router pages
│   │   ├── layout.tsx               ← Root layout (fonts, themes, global CSS)
│   │   ├── page.tsx                 ← Root page (mounts ArchitectureCanvas)
│   │   ├── globals.css              ← Global CSS custom properties
│   │   └── api/infrastructure/      ← Next.js API route (mock data fallback)
│   │
│   ├── 📂 components/
│   │   ├── 📂 canvas/               ← Topology canvas components
│   │   │   ├── ArchitectureCanvas.tsx ← Main React Flow mount point + ELK layout
│   │   │   └── AnimatedEdge.tsx     ← Custom animated edge with directional flow
│   │   │
│   │   ├── 📂 nodes/                ← 22 custom AWS service node components
│   │   │   ├── VpcNode.tsx, SubnetNode.tsx, AvailabilityZoneNode.tsx
│   │   │   ├── Ec2Node.tsx, LambdaNode.tsx, DatabaseNode.tsx, RdsNode.tsx
│   │   │   ├── S3Node.tsx, ApiGatewayNode.tsx, SqsNode.tsx, DynamoDbNode.tsx
│   │   │   ├── EcsNode.tsx, EksNode.tsx, EventBridgeNode.tsx, SnsNode.tsx
│   │   │   ├── CloudFrontNode.tsx, AlbNode.tsx, EniNode.tsx, IamRoleNode.tsx
│   │   │   └── SecurityGroupNode.tsx, SecretsManagerNode.tsx, StepFunctionsNode.tsx
│   │   │
│   │   ├── 📂 dashboard/            ← Dashboard layout and page components
│   │   │   ├── AppSidebar.tsx, OverviewPage.tsx, TopHeader.tsx
│   │   │   ├── NavMain.tsx, NavUser.tsx
│   │   │
│   │   ├── 📂 charts/               ← Chart components for the timeline view
│   │   ├── 📂 layers/               ← Canvas overlay layer components
│   │   ├── 📂 animate-ui/           ← Reusable micro-animation primitives
│   │   └── 📂 ui/                   ← shadcn/ui component primitives
│   │
│   ├── 📂 hooks/                    ← Custom React hooks
│   │   └── useLensVisuals.ts        ← Per-node visual state (color, icon, label) by lens
│   │
│   ├── 📂 lib/                      ← Utilities and layout engine
│   │   ├── layoutUtils.ts           ← ELK.js layout computation for React Flow
│   │   └── utils.ts                 ← cn() Tailwind class merge utility
│   │
│   ├── 📂 store/                    ← Global state management
│   │   └── useCanvasStore.ts        ← Zustand + Zundo store for canvas state
│   │
│   └── 📂 types/                    ← TypeScript type definitions
│
├── 📂 docs/                         ← Project documentation
│   ├── 📂 internal/                 ← Canonical engineering knowledge base (SSOT)
│   ├── 📂 developer/                ← Developer guides and API references
│   ├── 📂 business/                 ← PRDs and business documentation
│   └── 📂 diagrams/                 ← Centralized diagram repository
│
└── 📂 public/                       ← Static assets
    ├── 📂 icons/                    ← AWS service SVG icons
    └── 📂 logo/                     ← Nebula Lens brand assets
```

---

## Installation

### Prerequisites

Ensure you have the following installed before proceeding:

| Requirement | Minimum Version | Check Command |
|---|---|---|
| **Node.js** | 18.x | `node --version` |
| **pnpm** | 8.x | `pnpm --version` |
| **Python** | 3.10+ | `python --version` |
| **PostgreSQL** | 14+ | `psql --version` |
| **Docker** | 24.x | `docker --version` |
| **Docker Compose** | 2.x | `docker compose version` |
| **AWS CLI** (optional) | 2.x | `aws --version` |

You will also need an **AWS account** with an IAM user or role that has `sts:AssumeRole` permission and read-only access to the services you want to discover.

### 1. Clone the Repository

```bash
git clone https://github.com/bhargavrakholiya123/nebula-lens.git
cd nebula-lens
```

### 2. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)
```

> ⚠️ **CRITICAL**: Never commit your `.env` file. It contains AWS credentials. The `.gitignore` already excludes it.

### 3. Install Frontend Dependencies

```bash
pnpm install
```

### 4. Backend Setup

```bash
cd backend

# Create and activate Python virtual environment
python -m venv .venv

# Activate (Linux/macOS)
source .venv/bin/activate

# Activate (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Install Python dependencies
pip install -r requirements.txt
```

### 5. Database Setup

**Option A: Using Docker (Recommended)**

```bash
docker compose up db -d
```

**Option B: Local PostgreSQL**

```bash
psql -U postgres -c "CREATE DATABASE gravitylens_db;"
psql -U postgres -c "CREATE USER gravitylens WITH PASSWORD 'gravitylens123';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE gravitylens_db TO gravitylens;"
```

### 6. Run Database Migrations

```bash
cd backend
alembic upgrade head
```

---

## 🔧 Environment Variables

### Backend (`.env`)

| Variable | Description | Required | Example |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | `postgresql://user:pass@localhost:5434/gravitylens_db` |
| `AWS_ACCESS_KEY_ID` | AWS access key for scanning IAM user | ✅ | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | ✅ | `your-secret-key` |
| `AWS_DEFAULT_REGION` | Default AWS region for scanning | ✅ | `us-east-1` |
| `SECRET_KEY` | Application secret key for cryptographic operations | ✅ | Random 32+ char string |
| `BACKEND_URL` | Backend API URL (used by frontend) | ✅ | `http://127.0.0.1:8000` |
| `HF_TOKEN` | Hugging Face API token (for HF Spaces deployment) | ❌ | `hf_...` |

### Frontend (`.env.local`)

| Variable | Description | Required | Default |
|---|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | FastAPI backend URL for API calls | ✅ | `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_APP_ENV` | Application environment identifier | ❌ | `development` |

---

##  Running the Project

### Development Mode

**Backend (Terminal 1)**:

```bash
cd backend
source .venv/bin/activate  # or .\.venv\Scripts\Activate.ps1 on Windows
uvicorn app.main:app --reload --port 8000
```

- **API**: `http://localhost:8000`
- **Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

**Frontend (Terminal 2)**:

```bash
pnpm run dev
```

Open `http://localhost:3000` to view the dashboard.

### Docker Compose

```bash
# Start PostgreSQL + Backend
docker compose up --build -d

# View logs
docker compose logs -f backend

# Stop everything
docker compose down
```

Then run the frontend: `pnpm run dev`

### Production Build

```bash
# Frontend
pnpm run build && pnpm run start

# Backend (with Gunicorn)
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Port Reference

| Service | Local Dev | Docker | Purpose |
|---|---|---|---|
| Next.js Frontend | 3000 | — | Main UI |
| FastAPI Backend | 8000 | 8001 (→ 7860) | REST API |
| PostgreSQL | 5434 | 5434 | Database |

---

## API Overview

| Router | Endpoint | Method | Purpose |
|---|---|---|---|
| **AWS Accounts** | `/api/accounts` | GET | List all registered AWS accounts |
| **AWS Accounts** | `/api/accounts` | POST | Register a new AWS account with IAM role ARN |
| **AWS Accounts** | `/api/accounts/{id}` | DELETE | Remove an AWS account |
| **Graph** | `/api/graph/{account_id}` | GET | Fetch the latest normalized graph (nodes + edges) |
| **Graph** | `/api/graph/{account_id}?snapshot_id={id}` | GET | Fetch a historical snapshot graph |
| **Normalize** | `/api/normalize/{account_id}` | POST | Trigger re-normalization of latest raw scan data |
| **History** | `/api/history/{account_id}` | GET | List all snapshots with cost & diff statistics |
| **History** | `/api/history/{account_id}/{snapshot_id}` | GET | Fetch full diff between two consecutive snapshots |
| **Analyze** | `/api/analyze/{account_id}` | GET | Run infrastructure analysis (cost anomalies, idle resources) |
| **DB Inspector** | `/api/db/{table_name}` | GET | Browse raw database table contents |
| **Scan Trigger** | `/api/scan/trigger/{account_id}` | POST | Manually queue a new discovery scan |

>  **Full API Reference**: Visit `http://localhost:8000/docs` for interactive Swagger documentation with request/response schemas and try-it-out functionality.

---

## AWS Services

| AWS Service | Scanner Module | Relationships Inferred |
|---|---|---|
| **VPC** | `vpc_scanner.py` | Contains Subnets, Internet Gateways |
| **Subnet** | `vpc_scanner.py` | Belongs to VPC, contains EC2/RDS/Lambda |
| **EC2** | `ec2_scanner.py` | Uses IAM Role, secured by Security Group, in Subnet |
| **Lambda** | `lambda_scanner.py` | Invoked by API GW/SQS/EventBridge, uses IAM Role, in VPC |
| **RDS** | `rds_scanner.py` | In VPC/Subnet, secured by Security Group |
| **S3** | `s3_scanner.py` | Notifies Lambda, serves CloudFront |
| **SQS** | `sqs_scanner.py` | Triggers Lambda (ESM), triggered by EventBridge |
| **SNS** | `sns_scanner.py` | Notifies Lambda, SQS; triggered by EventBridge |
| **API Gateway** | `apigateway_scanner.py` | Invokes Lambda, uses VPC Link |
| **DynamoDB** | `dynamodb_scanner.py` | Referenced by Lambda (env vars) |
| **ECS** | `ecs_scanner.py` | Uses IAM Role, reads Secrets, writes CloudWatch |
| **EventBridge** | `eventbridge_scanner.py` | Triggers Lambda, SNS, SQS, Step Functions |
| **IAM** | `iam_scanner.py` | Used by Lambda/EC2/ECS (role assumption) |
| **Security Groups** | `security_group_scanner.py` | Applied to EC2, RDS, Lambda (VPC) |
| **CloudFront** | `cloudfront_scanner.py` | Serves S3, ALB, API Gateway (by domain) |
| **Secrets Manager** | metrics engine | Rotated by Lambda |

### AWS Authentication Model

```mermaid
graph LR
    NL["Nebula Lens Backend"] -->|"AssumeRole via STS"| ROLE["Customer IAM Role\nRole ARN + External ID"]
    ROLE -->|"Temporary Credentials\n15 min TTL"| BOTO["Boto3 Session"]
    BOTO --> EC2["EC2 API"]
    BOTO --> LAMBDA["Lambda API"]
    BOTO --> RDS["RDS API"]
    BOTO --> MORE["...16 services"]
```

> **Why External ID?** The External ID mechanism prevents the [confused deputy problem](https://docs.aws.amazon.com/IAM/latest/UserGuide/confused-deputy.html). Each customer provides their own IAM Role ARN + External ID — Nebula Lens never stores permanent credentials for customer accounts.

---

## Database

### Why PostgreSQL?

| Feature | PostgreSQL | SQLite | MySQL |
|---|---|---|---|
| **JSONB columns** | ✅ Indexed, queryable | ❌ Text only | ⚠️ JSON (slower) |
| **UUID native type** | ✅ | ❌ | ⚠️ VARCHAR workaround |
| **Concurrent writes** | ✅ MVCC | ❌ File-level lock | ✅ |
| **Production ready** | ✅ | ❌ | ✅ |
| **Partial indexes** | ✅ | ❌ | ⚠️ |

### Database Schema (10 Tables)

**Identity & Access**: `users`, `aws_accounts`

**Scan Lifecycle**: `scan_jobs`, `service_scans`

**Snapshot Persistence (Core)**: `snapshots`, `resources`, `relationships`, `snapshot_diffs`, `normalized_nodes`, `normalized_edges`

### Entity-Relationship Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email UK
        string name
        string auth0_id UK
    }
    AWS_ACCOUNTS {
        uuid id PK
        uuid user_id FK
        string account_id
        text role_arn
        string external_id
    }
    SCAN_JOBS {
        uuid id PK
        uuid account_id FK
        enum status
        string triggered_by
        timestamp started_at
        timestamp completed_at
    }
    SERVICE_SCANS {
        uuid id PK
        uuid scan_job_id FK
        string service
        string region
        enum status
        int resources_found
    }
    SNAPSHOTS {
        uuid id PK
        uuid account_id FK
        int version_number
        bool is_latest
        float total_monthly_cost
        int added_count
        int removed_count
        int modified_count
        jsonb cost_by_service
    }
    RESOURCES {
        uuid id PK
        uuid snapshot_id FK
        text resource_arn
        string service
        string region
        string fingerprint
        jsonb metadata
    }
    RELATIONSHIPS {
        uuid id PK
        uuid snapshot_id FK
        text source_arn
        text target_arn
        int confidence
        jsonb evidence
        string category
    }
    SNAPSHOT_DIFFS {
        uuid id PK
        uuid from_snapshot FK
        uuid to_snapshot FK
        enum change_type
        text resource_arn
        jsonb change_details
    }
    NORMALIZED_NODES {
        uuid id PK
        uuid snapshot_id FK
        text node_id
        string node_type
        text resource_arn
        jsonb metrics
        text parent_node_id
    }
    NORMALIZED_EDGES {
        uuid id PK
        uuid snapshot_id FK
        text source_arn
        text target_arn
        int confidence
        string category
    }

    USERS ||--o{ AWS_ACCOUNTS : "owns"
    AWS_ACCOUNTS ||--o{ SCAN_JOBS : "triggers"
    AWS_ACCOUNTS ||--o{ SNAPSHOTS : "has"
    SCAN_JOBS ||--o{ SERVICE_SCANS : "contains"
    SNAPSHOTS ||--o{ RESOURCES : "stores"
    SNAPSHOTS ||--o{ RELATIONSHIPS : "stores"
    SNAPSHOTS ||--o{ NORMALIZED_NODES : "caches"
    SNAPSHOTS ||--o{ NORMALIZED_EDGES : "caches"
    SNAPSHOTS ||--o{ SNAPSHOT_DIFFS : "from_snapshot"
    SNAPSHOTS ||--o{ SNAPSHOT_DIFFS : "to_snapshot"
```

---

##  Deployment

### Development (Local)

See [Running the Project](#-running-the-project) section.

### Docker (Single Machine)

```bash
docker compose up --build -d
docker compose logs -f
docker compose down
```

### AWS Deployment

**Recommended Architecture:**

```mermaid
graph TB
    subgraph "AWS Cloud"
        subgraph "VPC"
            ALB["Application Load Balancer"]
            subgraph "ECS Cluster"
                FE["Frontend — Next.js\nECS Fargate or Vercel"]
                BE["Backend — FastAPI\nECS Fargate"]
            end
            RDS_PG[("PostgreSQL\nRDS Private Subnet")]
        end
        CF["CloudFront CDN"]
        ECR["ECR Container Registry"]
        SM["Secrets Manager"]
    end
    USER["👤 Users"] --> CF
    CF --> ALB
    ALB --> FE
    ALB --> BE
    BE --> RDS_PG
    BE --> SM
```

1. **Frontend**: Deploy to Vercel (zero-config) or AWS Amplify
2. **Backend**: ECS Fargate with the provided `Dockerfile`
3. **Database**: RDS PostgreSQL in a private subnet
4. **Secrets**: AWS Secrets Manager for credentials
5. **Networking**: ALB with HTTPS termination

### Hugging Face Spaces

The backend is pre-configured for HF Spaces (note port `7860` in `Dockerfile`):

```bash
git remote add space https://huggingface.co/spaces/your-org/nebula-lens-api
git push space main
```

---

##  Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html

# Specific test file
pytest tests/test_relationship_engine.py -v
```

| Test Type | Tool | Scope |
|---|---|---|
| **Unit Tests** | `pytest` | Single function/class — normalizer output, relationship rules, cost calculations |
| **Integration Tests** | `pytest` + `testcontainers` | Full scan → snapshot → API pipeline |
| **API Tests** | `pytest` + `httpx` | FastAPI request/response contract validation |
| **Performance Tests** | `locust` | Backend under concurrent load |

### Coverage Targets

| Module | Target |
|---|---|
| `engines/normalizer.py` | 80%+ |
| `engines/relationship_engine.py` | 85%+ |
| `engines/cost_engine.py` | 90%+ |
| `engines/snapshot_engine.py` | 75%+ |
| `routers/` | 70%+ |

---

## Performance

### Caching Strategy

1. **Normalized Graph Cache**: `NormalizedNode` / `NormalizedEdge` tables act as a pre-computed graph cache — API reads directly from them, no re-computation per request.
2. **Snapshot Statistics Cache**: Every `Snapshot` row stores pre-aggregated stats (`total_resources`, `total_monthly_cost`, `added_count`, etc.) for O(1) timeline reads.
3. **CloudWatch Metrics Caching**: In-memory caching per scan job avoids redundant API calls for resources in the same region.
4. **Pricing API Fallback Cache**: 3-level: live API response (TTL: 24h) → in-memory session cache → static fallback table.

### Parallel Processing

The scan orchestrator fans out service scanners in **parallel threads per region**:

```python
with ThreadPoolExecutor(max_workers=8) as executor:
    futures = [executor.submit(scan_service, service, region, creds)
               for service in SERVICES for region in configured_regions]
```

A 5-region, 16-service scan runs 80 tasks in parallel rather than sequentially.

### Deferred Layout

**Why ELK runs in the browser**: Graph layout algorithms are CPU-intensive. By deferring ELK.js to the client browser, the backend API response remains fast (< 200ms) regardless of graph size.

---

## Security

> ⚠️ **Current State**: The API currently has no authentication enforcement. Auth0 integration is scaffolded in the `User` model and on the active roadmap. **Do not expose this API publicly without adding authentication.**

### IAM Security

**Recommended IAM Policy (Least Privilege)**:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "ec2:Describe*", "lambda:List*", "lambda:Get*",
      "rds:Describe*", "s3:ListAllMyBuckets", "s3:GetBucketLocation",
      "sqs:ListQueues", "sqs:GetQueueAttributes",
      "iam:ListRoles", "iam:GetRole", "iam:ListAttachedRolePolicies",
      "cloudwatch:GetMetricData", "cloudwatch:GetMetricStatistics",
      "pricing:GetProducts"
    ],
    "Resource": "*"
  }]
}
```

### Secrets Management

| Secret Type | Dev Storage | Production Recommendation |
|---|---|---|
| Database credentials | `.env` file | AWS Secrets Manager |
| AWS Access Keys | `.env` file | IAM Instance Profile (no static keys) |
| Application SECRET_KEY | `.env` file | Rotate regularly; minimum 32 characters |

### Input Validation

All API inputs are validated by **Pydantic v2** schemas. SQLAlchemy ORM parameterized queries prevent SQL injection at the data layer.

---

##  Monitoring

### Logging

```python
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
```

Every pipeline stage logs scan job start/completion, per-service scanner results, snapshot creation, and API errors.

### Health Check

```bash
GET http://localhost:8000/
# → 200 OK with "API Operational" HTML status page
```

### Debugging Scans

```bash
# Check scan job status
GET /api/history/{account_id}

# Check per-service failures
GET /api/db/service_scans  # Filter by scan_job_id

# Backend logs show per-service errors:
# ERROR - scan_orchestrator - Lambda scanner failed: ThrottlingException
```

### Future Observability

| Tool | Purpose |
|---|---|
| **Prometheus** | Request latency, scan job duration, error rates |
| **Grafana** | Operational metrics dashboard |
| **OpenTelemetry** | Distributed tracing across scan pipeline |
| **Sentry** | Error tracking and exception monitoring |

---

##  Roadmap

### Phase 1 — Foundation ✅

- [x] Multi-account AWS discovery via STS role assumption
- [x] 16+ service scanners (EC2, Lambda, RDS, S3, VPC, SQS, SNS, API GW, DynamoDB, ECS, CloudFront, EventBridge, IAM, Security Groups, EKS, Secrets Manager)
- [x] React Flow interactive topology graph with 22 custom node types
- [x] ELK.js automatic hierarchical layout
- [x] Relationship inference engine with 40+ rules and confidence scoring
- [x] Immutable snapshot engine with full-copy persistence
- [x] SHA-256 fingerprinting and drift detection
- [x] Infrastructure timeline with snapshot diff analysis
- [x] AWS Pricing API integration with 18 cost calculators
- [x] Per-node monthly cost estimation
- [x] CloudWatch metrics enrichment
- [x] Undo/Redo with Zundo temporal state
- [x] Docker Compose orchestration
- [x] FastAPI REST API with Swagger/ReDoc documentation
- [x] Overview dashboard with resource statistics

### Phase 2 — Production Hardening 🚧

- [ ] Auth0 OAuth2 authentication integration
- [ ] API rate limiting and request throttling
- [ ] Comprehensive unit test coverage (target 80%+)
- [ ] Kubernetes Helm chart deployment
- [ ] CI/CD pipeline (GitHub Actions)

### Phase 3 — Intelligence Layer 🔮

- [ ] AI-powered infrastructure recommendations (idle resource detection, right-sizing)
- [ ] Natural language query interface: *"Show me everything that talks to this RDS instance"*
- [ ] Cost optimization suggestions with projected savings
- [ ] Policy engine: define and enforce infrastructure rules
- [ ] Anomaly detection for cost and resource count spikes

### Phase 4 — Multi-Cloud 🌐

- [ ] Google Cloud Platform (GCP) support
- [ ] Microsoft Azure support
- [ ] Kubernetes cluster topology discovery (EKS, GKE, AKS)
- [ ] Unified multi-cloud cost dashboard

### Phase 5 — Ecosystem 🔌

- [ ] Terraform / CDK state integration (drift detection vs. IaC)
- [ ] Slack / PagerDuty alerting for infrastructure changes
- [ ] RBAC (Role-Based Access Control) for multi-team usage
- [ ] SOC 2 / CIS benchmark compliance reports

---

## Contribution Guide

### Development Workflow

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally.
3. **Create a branch** following the Branch Strategy below.
4. **Make changes** following Coding Standards.
5. **Write tests** for any new functionality.
6. **Submit a Pull Request** targeting the `main` branch.

### Branch Strategy

| Branch Type | Convention | Example |
|---|---|---|
| Feature | `feature/short-description` | `feature/gcp-scanner` |
| Bugfix | `fix/issue-description` | `fix/snapshot-diff-timezone` |
| Documentation | `docs/topic-name` | `docs/update-api-reference` |
| Refactor | `refactor/module-name` | `refactor/cost-engine-registry` |

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scanners): add EKS node group scanner
fix(cost-engine): correct RDS storage pricing formula
docs(readme): add Kubernetes deployment section
refactor(normalizer): extract subnet adapter to dedicated module
```

### Adding a New AWS Service Scanner

**Step 1**: Create the scanner in `backend/app/scanners/`

```python
# backend/app/scanners/elasticache_scanner.py
def scan_elasticache(session, region: str) -> list:
    client = session.client('elasticache', region_name=region)
    paginator = client.get_paginator('describe_cache_clusters')
    clusters = []
    for page in paginator.paginate():
        clusters.extend(page['CacheClusters'])
    return clusters
```

**Step 2**: Register in `scanners/__init__.py`

**Step 3**: Add normalization logic in `engines/normalizer.py`

**Step 4**: Add relationship rules in `engines/relationship_engine.py`

**Step 5**: Create `engines/costs/elasticache_cost.py` inheriting `BaseCostCalculator`

**Step 6**: Create `src/components/nodes/ElastiCacheNode.tsx`

**Step 7**: Register the node type in `ArchitectureCanvas.tsx`

### Coding Standards

**Python**: PEP 8, type hints on all functions, docstrings on public classes, specific exception handling (no bare `except:`).

**TypeScript**: Strict mode, no `any` types, explicit `Props` interfaces, `useMemo`/`useCallback` for expensive computations, no inline styles.

### Pull Request Checklist

- [ ] All existing tests pass (`pytest tests/ -v`)
- [ ] New tests added for new functionality
- [ ] Code formatted with `black` (Python) and `eslint` (TypeScript)
- [ ] Documentation updated if adding a new feature
- [ ] No hardcoded credentials or sensitive data
- [ ] PR description explains *what* changed and *why*

---

## 📚 Documentation

| Document | Location | Audience |
|---|---|---|
| **Backend Architecture Guide** | [docs/developer/backend_documentation.md](docs/developer/backend_documentation.md) | Backend developers, architects |
| **Documentation Index** | [docs/README.md](docs/README.md) | All contributors |
| **API Reference (live)** | `http://localhost:8000/docs` | API consumers, frontend developers |
| **Pricing Quick Reference** | [backend/PRICING_QUICK_REFERENCE.md](backend/PRICING_QUICK_REFERENCE.md) | Cost calculator contributors |
| **Cost Analysis Report** | [COST_ANALYSIS_REPORT.md](COST_ANALYSIS_REPORT.md) | FinOps, product managers |
| **Project Audit** | [project_audit.md](project_audit.md) | Architects, new team members |
| **Internal Docs (SSOT)** | `docs/internal/` | Core engineering team |
| **Architecture Diagrams** | `docs/diagrams/` | All teams |

---

## ❓ FAQ

**Q: How does scanning work?**
When triggered, the Scan Orchestrator assumes your configured IAM role via AWS STS, then fans out parallel Boto3 API calls across configured regions. Each service has its own scanner module handling pagination. Results are stored as raw `Resource` records, then processed by the Normalizer and Relationship Engine.

**Q: How are relationships detected?**
Nebula Lens uses a multi-pass inference approach: (1) direct ARN references in resource metadata, (2) IAM execution role policy analysis, (3) environment variable key name heuristics, and (4) Security Group IP CIDR analysis. Each inferred edge carries a confidence score (0–100) and evidence list.

**Q: Why FastAPI instead of Django or Flask?**
Three reasons: (1) automatic Swagger/OpenAPI docs generated from type hints; (2) Pydantic v2 request/response validation with clear errors; (3) async-first design for handling concurrent scan requests efficiently.

**Q: Why React Flow instead of D3.js or Cytoscape?**
React Flow is React-native with built-in zoom, pan, and custom node/edge support. It natively supports nested/compound nodes (VPC → Subnet → EC2 hierarchy) which D3.js and Cytoscape handle poorly without significant custom work.

**Q: How are snapshots stored?**
Every scan creates a full deep-copy snapshot. All discovered resources, inferred relationships, normalized React Flow nodes, and computed edges are saved as independent records linked to a `Snapshot` row with an incrementing `version_number`. Diff calculation happens at snapshot creation time using SHA-256 fingerprint comparison.

**Q: How does cost estimation work?**
The Cost Engine uses a registry pattern — each AWS service has a dedicated `CostCalculator` class. Calculators query the AWS Pricing API with a 3-level fallback: (1) live API call, (2) in-memory session cache, (3) hardcoded fallback pricing table. Results are stored as `monthly_cost` on each resource node.

**Q: Can I run Nebula Lens without AWS credentials?**
Yes — the frontend loads with a static fallback dataset from `src/data/latestdata.json` if the backend API is unavailable. To scan real AWS accounts, valid credentials with an appropriate IAM role are required.

**Q: How does authentication work?**
Currently, the API has no authentication enforcement. The `User` model includes an `auth0_id` column prepared for Auth0 OAuth2 integration (on the active roadmap). For production use today, place the backend behind a VPN or API Gateway with IP allowlisting.

**Q: Why ELK.js for layout instead of Dagre?**
ELK (Eclipse Layout Kernel) produces significantly better hierarchical layouts for complex, nested graphs. Dagre struggles with compound/nested nodes (VPC containing Subnets containing EC2s), while ELK's `layered` algorithm handles deep nesting naturally with proper edge routing.

**Q: What is the scan frequency?**
APScheduler polls for pending scan jobs every 5 minutes (300 seconds). Scans are only *triggered* when a user queues one — the scheduler picks up pending jobs. There is no auto-discovery of new accounts.

---

## 💬 Support

| Channel | Purpose | Link |
|---|---|---|
| **GitHub Issues** | Bug reports, feature requests | [Open an Issue](https://github.com/bhargavrakholiya123/nebula-lens/issues) |
| **GitHub Discussions** | Q&A, ideas, general discussion | [Start a Discussion](https://github.com/bhargavrakholiya123/nebula-lens/discussions) |
| **Documentation** | Guides and references | [docs/](docs/) |
| **Swagger UI** | Interactive API documentation | `http://localhost:8000/docs` |
| **ReDoc** | Alternative API documentation | `http://localhost:8000/redoc` |

---
