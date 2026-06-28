# Discovery Pipeline Engineering Notes

### Why this module exists
To automatically discover, read, and extract configuration details of AWS cloud resources across various regions and services, serving as the foundational data source for the rest of the application.

### Business purpose
Provides the core automated asset inventory capability. It ensures the customer's cloud topology is accurately and consistently reflected without requiring manual data entry or tagging, allowing for reliable cost and security analysis.

### Technical purpose
Wraps the AWS Boto3 SDK to fetch metadata, handle pagination, handle cross-account credential injection, format raw AWS responses into a normalized internal dictionary structure via the Normalizer, and emit fundamental structural edges (e.g., `Subnet hosts EC2`).

### Folder structure
All relevant files reside in:
*   `backend/app/engines/scan_orchestrator.py`: The coordinator that manages the scan lifecycle.
*   `backend/app/scanners/`: Contains individual, service-specific scanner implementations (e.g., `ec2_scanner.py`, `lambda_scanner.py`, `vpc_scanner.py`, `s3_scanner.py`, `pass2_scanners.py`).

### Classes
*   **`ScanOrchestrator`** (`scan_orchestrator.py`): Singleton coordinator that manages the region loops, orchestrates the order of service scanners, and updates the database with job statuses.
*   **Service Scanners** (e.g., **`EC2Scanner`**, **`VPCScanner`**): Individual singleton classes that instantiate `boto3` clients, handle pagination, and call the normalizer for specific AWS services.

### Functions
*   `ScanOrchestrator.run_scan(scan_job_id)`: Fetches the DB job, gets STS credentials, iterates through regions, invokes scanners sequentially, saves `ServiceScan` audit records, and triggers the Relationship and Snapshot engines.
*   `Scanner.scan(credentials, region, account_id, subnet_map)`: A standard interface implemented by each scanner. It paginates Boto3 results, delegates payload formatting to `normalizer.normalize_<service>`, and emits hierarchical structural edges (e.g., `Subnet → hosts → EC2`).

### Workflow
1.  **Initialization:** The scheduler picks up a `ScanJob` in `pending` status and invokes `ScanOrchestrator.run_scan()`.
2.  **Authentication:** The orchestrator fetches temporary AWS credentials using STS (`aws_service.py`).
3.  **Region Loop:** The orchestrator iterates over a predefined list of target regions.
4.  **Network Baseline:** In each region, `vpc_scanner` runs *first* to establish the network topology and build a `subnet_map` dictionary (`subnet_id` → `ARN`).
5.  **Compute Scanning:** Subsequent scanners (EC2, Lambda, RDS, ECS, etc.) receive the `subnet_map` to structurally link their discovered resources back to the correct parent Subnet/VPC.
6.  **Global Scanning:** Global services (like S3 and CloudFront) are scanned once outside of the region loop.
7.  **Audit Logging:** Successful and failed attempts per service and per region are logged to the `ServiceScan` PostgreSQL table.
8.  **Handoff:** The aggregated lists of raw extracted nodes and structural edges are passed to the `RelationshipEngine` and finally to the `SnapshotEngine`.

### Inputs
*   `scan_job_id`: Used to fetch the target AWS Account ID and IAM Role ARN from the database.
*   AWS temporary credentials (injected via STS AssumeRole).

### Outputs
*   A list of raw extracted nodes (dictionaries formatted by the Normalizer).
*   A list of structural edges (e.g., `VPC → contains → Subnet`, `Subnet → hosts → EC2`).
*   Database records updated in `ScanJob` and `ServiceScan` tracking scan progress, resource counts, and localized errors.

### Algorithms
*   **Pagination Handling:** Uses Boto3 paginators (e.g., `.get_paginator('describe_instances')`) to safely retrieve resources in large AWS accounts.
*   **Top-Down Topological Execution:** Explicitly executes VPC and Subnet scans before Compute and Database scans, passing state (`subnet_map`) forward to allow structural edge generation on the fly in a single pass.

### Dependencies
*   `boto3` and `botocore.exceptions` for AWS API interactions and error definitions.
*   `app.engines.normalizer` for formatting the raw nested Boto3 dictionary payloads into the flat internal graph schema.
*   `app.models.models` (SQLAlchemy schemas) for database tracking and audit logging.

### Error handling
*   **Service-Level Fault Isolation:** Scanners are wrapped in strict `try/except` blocks. If one scanner (e.g., RDS) fails in a specific region due to missing IAM permissions or API rate limits, it logs the error, marks that specific `ServiceScan` record as `failed`, and the orchestrator moves on to the next service. The overall job status is flagged as `partial`.
*   **Resource-Level Resilience:** Within a scanner, parsing errors for a single resource (e.g., a malformed EC2 tag) are caught so they do not crash the pagination loop for the rest of the resources.

### Tradeoffs
*   **Sequential vs. Parallel Execution:** The scanners within a region currently run sequentially. This ensures the `subnet_map` is built before compute scanners run, avoiding a complex asynchronous dependency graph, but it sacrifices overall scanning speed.
*   **Comprehensive State Capture:** Scanners explicitly fetch resources in non-running states (e.g., stopped EC2 instances or terminated resources pending cleanup). This ensures accurate lifecycle tracking in the timeline but increases the payload size and processing time.

### Known limitations
*   **Hardcoded Regions:** The list of scanned regions is currently hardcoded (`SCAN_REGIONS = ['ap-south-1', 'us-east-1']`).
*   **Synchronous Blocking:** The single-process loop blocks the worker until all regions and all services are completely finished, making it vulnerable to timeout on very large AWS deployments.

### Performance considerations
*   **Memory Consumption:** The orchestrator accumulates all discovered nodes and edges in memory arrays (`all_nodes`, `all_edges`) before passing them to the Snapshot engine. On massive AWS accounts with tens of thousands of resources, this could cause memory bloat or Out-Of-Memory (OOM) issues on the backend container.

### Future improvements
*   Implement concurrent processing (e.g., `asyncio.gather` or `ThreadPoolExecutor`) for region scanning and non-dependent service scanning.
*   Dynamically fetch active regions for the specific AWS account using `ec2:DescribeRegions` instead of relying on a hardcoded list.
*   Implement a streaming architecture or chunked database commits to send nodes to the database as they are discovered, rather than holding the entire topology in memory until the end of the scan.
