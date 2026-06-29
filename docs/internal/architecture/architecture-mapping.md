# Architecture Mapping

## Overview
The platform is a monolith-style web application separated into a Next.js frontend and a FastAPI backend. The backend acts as an orchestrator that pulls data from customer AWS environments using cross-account IAM roles, processes the raw resources into a unified graph topology, estimates costs, and stores snapshot histories in PostgreSQL. The frontend retrieves this graph data and renders a highly interactive, animated topology canvas.

## Components

### Discovery Pipeline (`backend/app/engines/scan_orchestrator.py`, `backend/app/scanners/`)
*   **Purpose**: Discovers and extracts AWS cloud assets across multiple regions.
*   **Responsibilities**: Manages the lifecycle of a `ScanJob`. Orchestrates region-based parallel scanning, assumes IAM roles using AWS STS, catches and logs failures per service, and aggregates all raw resources into a unified format.
*   **Dependencies**: `boto3`, `aws_service.py`, SQLAlchemy (`ScanJob`, `ServiceScan`).
*   **Inputs**: `scan_job_id` (contains AWS Account ID & IAM Role ARN).
*   **Outputs**: List of raw resource nodes and basic hierarchical edges.
*   **Consumers**: Relationship Engine, Snapshot Engine, Normalization Engine.
*   **Providers**: AWS Cloud APIs (EC2, S3, RDS, Lambda, API Gateway, etc.).

### Relationship Engine (`backend/app/engines/relationship_engine.py`)
*   **Purpose**: Infers and discovers logical and runtime communication edges between AWS resources.
*   **Responsibilities**: Evaluates resource metadata against static configuration rules (`PASS_2_RULES`), checks IAM role permissions via `boto3` queries, evaluates Security Group overlap, and parses Event Source Mappings to generate high-confidence relational edges (e.g., Lambda writes to S3).
*   **Dependencies**: `boto3` (IAM API), `pass4_network_resolver.py`.
*   **Inputs**: List of raw scanned nodes, temporary AWS credentials.
*   **Outputs**: List of relational edges (source ARN, target ARN, relationship type, confidence score, evidence).
*   **Consumers**: Snapshot Engine, Normalizer.
*   **Providers**: Discovery Pipeline, AWS IAM API.

### Cost Pipeline (`backend/app/engines/cost_engine.py`, `backend/app/engines/costs/`)
*   **Purpose**: Calculates and estimates daily/monthly costs for discovered AWS resources.
*   **Responsibilities**: Routes normalized nodes to their service-specific cost calculators (e.g., `LambdaCostCalculator`). Handles complex cost allocation, such as apportioning overall VPC costs down to individual subnets based on resource density. Injects credentials to fetch live AWS Pricing API data.
*   **Dependencies**: Base Cost Calculator, AWS Pricing API.
*   **Inputs**: Normalized node dictionaries, metrics summaries, region string, AWS credentials.
*   **Outputs**: Cost dictionaries containing `dailyCost`, `monthlyCost`, `yearlyCost`, and `billingModel`.
*   **Consumers**: History Timeline API, Normalizer API.
*   **Providers**: Metrics Engine, AWS Pricing API.

### Data Storage (`backend/app/models/models.py`, `backend/app/database.py`)
*   **Purpose**: Persistent state management for users, configurations, and topology histories.
*   **Responsibilities**: Stores hierarchical configurations (Users → AWS Accounts → Snapshots). Stores the raw `Resources` and `Relationships`, as well as the computed `NormalizedNode` and `NormalizedEdge` caches. Handles schema migrations.
*   **Dependencies**: PostgreSQL 15, SQLAlchemy ORM, Alembic.
*   **Inputs**: SQLAlchemy ORM model instances.
*   **Outputs**: Database result sets, JSONB metadata blobs.
*   **Consumers**: Backend API Layer (Routers), Engines (Scan Orchestrator, Normalizer).
*   **Providers**: PostgreSQL Database Engine.

### API Layer (`backend/app/routers/`)
*   **Purpose**: Exposes backend data and workflow triggers to the frontend dashboard.
*   **Responsibilities**: Handles RESTful HTTP requests for AWS account management (`aws_accounts.py`), graph visualization (`graph.py`, `normalize.py`), historical timelines (`history.py`), and triggering manual scans.
*   **Dependencies**: FastAPI, SQLAlchemy Session, Core Engines.
*   **Inputs**: HTTP JSON payloads, Query/Path Parameters.
*   **Outputs**: JSON responses (Normalized Graphs, Snapshot Diffs, Job Status).
*   **Consumers**: Frontend Dashboard (Next.js Client).
*   **Providers**: PostgreSQL Database, Core Engines.

### Authentication (`backend/app/services/aws_service.py`, `backend/app/models/models.py`)
*   **Purpose**: Secures user access to the dashboard and authorizes the backend to scan customer AWS accounts.
*   **Responsibilities**: 
    1. **User Identity:** Maps Auth0 identities to local users via the `auth0_id` column in the `users` table.
    2. **AWS Identity:** Handles cross-account access via `AssumeRole` using an `ExternalId` (`AWSService.verify_role_arn`).
*   **Dependencies**: AWS STS (`boto3`), Auth0 (Frontend client).
*   **Inputs**: Auth0 tokens (implied), IAM Role ARNs.
*   **Outputs**: Temporary AWS credentials (Access Key, Secret Key, Session Token).
*   **Consumers**: Discovery Pipeline, Relationship Engine.
*   **Providers**: AWS STS, Auth0.

### Visualization (`src/components/canvas/ArchitectureCanvas.tsx`, `src/store/`)
*   **Purpose**: Renders the interactive, visual cloud topology dashboard for the user.
*   **Responsibilities**: Orchestrates the rendering of custom SVG nodes (`LambdaNode`, `Ec2Node`), animates edge traffic (`AnimatedEdge`), computes automatic graph layouts (`useAutoLayout` via `elkjs`), and filters visibility based on user-selected layers (`LayerPanel`, `useLayerEngine`).
*   **Dependencies**: `@xyflow/react` (React Flow), `framer-motion`, `elkjs`, Zustand.
*   **Inputs**: Normalized Nodes and Edges fetched from the API Layer.
*   **Outputs**: Interactive DOM (SVG/HTML) canvas.
*   **Consumers**: End User.
*   **Providers**: API Layer (`/graph`), Zustand Stores (`useCanvasStore`, `layerStore`).

## Architecture Summary
*   **Backend Modules**: Structured as a modular monolith. `routers/` handles HTTP transport, `models/` defines the Postgres schema, `scanners/` wrap external AWS Boto3 calls, and `engines/` contain the heavy computing algorithms (Orchestration, Relationships, Cost, Normalization).
*   **Frontend Modules**: Structured around Next.js App Router. `app/` dictates routing, `components/canvas/` drives the React Flow logic, `components/nodes/` dictate the visual styling of specific AWS services, and `store/` manages global client-side state using Zustand.
