# Infrastructure Data Lifecycle: Complete Pipeline Analysis

## Overview

This document traces the complete lifecycle of cloud infrastructure data in the application, detailing every stage from the initial user import trigger down to the visual rendering of the topology on the frontend canvas. 

## Workflow

### Stage 1: Cloud Import Initiation (Triggering)

The process begins when a user decides to import or manually scan an AWS account from the frontend interface.

*   **Input**: The user clicks a "Scan" button in the UI, providing the `account_id` (either an internal UUID or raw AWS account string).
*   **Output**: A JSON confirmation (e.g., `{"message": "Scan queued", "job_id": "..."}`) and a new pending job record.
*   **Transformation**: The system translates the API request into a persistent job state in the database, validating the existence of the AWS account first.
*   **Files involved**: `backend/app/main.py`, `backend/app/models/models.py`.
*   **Classes involved**: FastAPI Router, `AwsAccount` (SQLAlchemy model), `ScanJob` (SQLAlchemy model).
*   **Database interaction**: `SessionLocal` opens a transaction, queries the `aws_accounts` table for verification, inserts a new `ScanJob` record with `status = pending`, and commits.
*   **API interaction**: Frontend makes a `POST /api/scan/trigger/{account_id}` request to the FastAPI backend.
*   **Caching**: No caching is involved at this stage.
*   **Validation**: Verifies that the requested `account_id` actually exists in the database.
*   **Failure scenarios**: The requested AWS account is not found in the database; database connection timeout.
*   **Retries**: None implemented at the API route level.
*   **Assumptions**: Assumes a background worker/scheduler is actively polling the database for `ScanJob` rows with a `pending` status.

### Stage 2: Scan Orchestration (Discovery Pipeline)

A background worker detects the pending `ScanJob` and begins the heavy lifting of pulling infrastructure data across multiple AWS regions.

*   **Input**: The `scan_job_id` (UUID).
*   **Output**: An aggregated list of `all_nodes` and `all_edges` containing raw and normalized infrastructure data across all scanned services and regions.
*   **Transformation**: Sequentially loops through an array of `SCAN_REGIONS` (e.g., `ap-south-1`, `us-east-1`). It groups results from distinct service scanners into massive unified `nodes` and `edges` arrays.
*   **Files involved**: `backend/app/engines/scan_orchestrator.py`, `backend/app/services/aws_service.py`.
*   **Classes involved**: `ScanOrchestrator`, `aws_service`.
*   **Database interaction**: 
    * Updates `ScanJob` status to `running` and sets `started_at`. 
    * Fetches `role_arn` from `AwsAccount`. 
    * Inserts `ServiceScan` audit records for every service (e.g., VPC, EC2, RDS) per region to track micro-status.
    * Updates `ScanJob` to `success`, `partial`, or `failed` upon completion.
*   **API interaction**: Calls AWS STS via `_get_temp_credentials(role_arn)` to assume the target AWS account role.
*   **Caching**: Boto3 may cache STS tokens in memory, but orchestrator requests explicit credentials.
*   **Validation**: Validates that STS credentials are successfully returned before proceeding.
*   **Failure scenarios**: `AssumeRole` fails due to IAM permissions; AWS network partition; missing IAM trust policies.
*   **Retries**: Orchestrator employs a try-catch block for *each* service scanner. If one service fails (e.g., EC2), it flags `any_failure = True` but continues scanning the remaining services (e.g., RDS, Lambda).
*   **Assumptions**: Assumes the `SCAN_REGIONS` hardcoded array covers the user's active AWS footprint.

### Stage 3: Service Scanning and Normalization

Invoked repeatedly by the Orchestrator, individual scanners query AWS and pipe the chaotic JSON responses through the Normalizer.

*   **Input**: Temporary AWS credentials, target region, target `aws_account_id`, and contextual relationship maps (e.g., `subnet_map` mapping subnets to VPCs).
*   **Output**: A dictionary returning `{'nodes': [...], 'edges': [...]}` where nodes strictly follow the React Flow JSON schema.
*   **Transformation**:
    1. Boto3 API returns raw nested dictionaries.
    2. Scanner routes data to `NormalizationEngine` methods (e.g., `normalize_ec2`).
    3. Extractor pulls semantic names (usually from AWS Tags), resolves parent ARNs, and extracts metadata into a `metrics` sub-dictionary.
    4. Enforces the strict `{"id": "...", "type": "...", "data": {...}}` schema via `build_node()`.
    5. Computes a deterministic SHA-256 hash (`generate_fingerprint`) of the metrics payload.
*   **Files involved**: `backend/app/scanners/*_scanner.py` (e.g., `ec2_scanner.py`), `backend/app/engines/normalizer.py`.
*   **Classes involved**: Individual Scanner singletons, `NormalizationEngine`.
*   **Database interaction**: None (deferred to the snapshot engine).
*   **API interaction**: Extensive Boto3 client calls (e.g., `ec2.describe_instances()`).
*   **Caching**: No caching to ensure real-time accuracy.
*   **Validation**: The Normalizer utilizes safe dictionary extraction (`.get(key, default)`) to prevent runtime crashes if AWS omits expected keys.
*   **Failure scenarios**: AWS API rate limiting (ThrottlingException); missing specific read permissions (e.g., `ec2:DescribeInstances`); malformed JSON responses.
*   **Retries**: Handled implicitly by the Boto3 SDK's built-in exponential backoff.
*   **Assumptions**: Assumes the AWS API response models remain backward compatible and consistent with Boto3 documentation.

### Stage 4: Relationship Discovery (Network Mapping)

After all raw nodes are discovered, the pipeline attempts to draw communication and logical edges between disparate resources.

*   **Input**: AWS credentials, `SCAN_REGIONS` list, and the fully populated `all_nodes` list.
*   **Output**: A list of `edges` detailing connections (source ARN, target ARN, edge type/label).
*   **Transformation**: Cross-references node metadata (like security group rules, target group attachments, lambda triggers) to generate relational edges. It resolves indirect mappings into direct point-to-point graph edges.
*   **Files involved**: `backend/app/engines/relationship_engine.py`, `backend/app/engines/pass4_network_resolver.py`.
*   **Classes involved**: `RelationshipEngine`.
*   **Database interaction**: None.
*   **API interaction**: May perform deep-dive API calls to resolve complex routing (e.g., fetching Route53 records or ELB target health).
*   **Caching**: N/A.
*   **Validation**: Must validate that both the `source_arn` and `target_arn` exist in the `all_nodes` list before emitting an edge.
*   **Failure scenarios**: Fails to parse complex IPv6 security rules; edge target is an external unmapped IP causing resolution failure.
*   **Retries**: None. Fails gracefully by logging the error and returning whatever edges it managed to resolve.
*   **Assumptions**: Assumes all resources referenced in configuration blocks (like Target Groups) were successfully captured in Stage 3.

### Stage 5: Snapshot and Cost Engine Processing

The pipeline saves the complete graph into an immutable snapshot and calculates financial metrics.

*   **Input**: Database session, `account_db_id`, `all_nodes`, `all_edges`, `aws_account_id`.
*   **Output**: Committed PostgreSQL rows. Returns an ORM `Snapshot` object containing calculated totals.
*   **Transformation**:
    1. **Cost injection**: Passes nodes through `CostEngine.calculate_all()` to append real-time monthly estimated costs.
    2. **Deprecation**: Marks the old `is_latest` snapshot as `False`.
    3. **Drift Detection (Diffing)**: Compares the SHA-256 fingerprint of new nodes against the prior snapshot's fingerprints to determine Added, Removed, or Modified states.
*   **Files involved**: `backend/app/engines/snapshot_engine.py`, `backend/app/engines/cost_engine.py`.
*   **Classes involved**: `SnapshotEngine`, `CostEngine`.
*   **Database interaction**: 
    * Queries previous snapshot for version bumping.
    * Inserts new `Snapshot` header.
    * Iteratively bulk-inserts `Resource` rows (the nodes) and `Relationship` rows (the edges).
    * Commits the massive multi-table transaction as an atomic unit.
*   **API interaction**: None (Cost formulas are internal).
*   **Caching**: None.
*   **Validation**: Checks database constraints automatically. Filters diffs by a hardcoded `SUPPORTED_SERVICES` array.
*   **Failure scenarios**: Database N+1 loop timeout for massive accounts; primary key / constraint violations.
*   **Retries**: None. If any insertion fails, the entire snapshot rolls back to maintain data integrity.
*   **Assumptions**: Creating a complete "deep copy" of all resources per snapshot is an acceptable tradeoff for read performance over storage efficiency.

### Stage 6: UI Data Fetching

The user navigates to the Architecture Canvas, prompting the frontend to request the latest topology.

*   **Input**: Contextual IDs (`snapshot_id` or `account_id`) from the Zustand global store.
*   **Output**: A parsed JSON payload containing the finalized `nodes` and `edges`.
*   **Transformation**:
    *   The frontend Zustand action `fetchInfrastructure()` hits a Next.js proxy API (`/api/infrastructure?account_id=...`).
    *   Next.js forwards this to the FastAPI backend (e.g., `POST /api/normalize/account`).
    *   **Post-processing**: Upon receiving the JSON, the UI runs safety sanitizers: `validateParentRefs` (ensures child nodes don't reference missing parents), `purgeGhostGroups` (removes empty cluster boundaries), `normalizeEdges`, and `setInitialScatterPositions`.
*   **Files involved**: `src/store/useCanvasStore.ts`, `src/app/api/infrastructure/route.ts`, `backend/app/routers/normalize.py` (or `graph.py`).
*   **Classes involved**: `useCanvasStore`, Next.js Edge routes.
*   **Database interaction**: Backend reads from `Snapshot`, `Resource`, and `Relationship` filtering by `is_latest` or `snapshot_id`.
*   **API interaction**: Client -> Next.js API Route -> FastAPI Backend -> PostgreSQL.
*   **Caching**: Explicitly disabled (`cache: 'no-store'`) on the Next.js route to ensure the user always sees the live snapshot.
*   **Validation**: Backend filters out non-supported services dynamically. Frontend purges ghost nodes.
*   **Failure scenarios**: Backend is unreachable (Next.js returns 502); Database read times out on massive graphs.
*   **Retries**: No automatic retries; UI remains in a loading or error state until the user refreshes.
*   **Assumptions**: Backend responds strictly with the schema defined for React Flow ingestion.

### Stage 7: UI Rendering (Topology Display)

The sanitized graph is fed into the rendering engine, converting abstract JSON into an interactive visual canvas.

*   **Input**: The sanitized `cleanNodes` and `cleanEdges` state arrays.
*   **Output**: A visually rendered Directed Acyclic Graph (DAG) with nested parent-child clusters.
*   **Transformation**: 
    1. Nodes are passed into an Auto Layout engine (ELK.js or a gravity simulation).
    2. The Layout Engine calculates the absolute `x` and `y` Cartesian coordinates based on hierarchical depth and edge tension.
    3. The application triggers a transition animation (`animateTransition`) to smoothly glide nodes from their default `(0,0)` positions to their computed layout positions.
*   **Files involved**: `src/components/canvas/ArchitectureCanvas.tsx`, `src/lib/layout/gravityLayout.ts` or ELK equivalents.
*   **Classes involved**: React Functional Components, `@xyflow/react` hooks.
*   **Database interaction**: None.
*   **API interaction**: None.
*   **Caching**: The DOM and React State hold the rendered visual state in memory.
*   **Validation**: React Flow strictly validates node definitions, dropping unrecognized components.
*   **Failure scenarios**: Layout engine gets stuck in infinite loops due to circular parent-child dependency references; browser memory exhaustion when rendering > 10,000 DOM nodes.
*   **Retries**: N/A.
*   **Assumptions**: `validateParentRefs` caught all missing references, ensuring the layout engine has a mathematically sound DAG to calculate.
