# Scan Orchestrator Engineering Notes

### Why this module exists
To act as the master controller that coordinates the entire AWS infrastructure discovery process. It ties together raw API scraping, dependency mapping, and database persistence into a single, fault-tolerant workflow.

### Business purpose
Guarantees that infrastructure scans run reliably and comprehensively. By tracking the success or failure of individual service scans (e.g., EC2 succeeded, but S3 failed due to permissions), it gives cloud engineers clear visibility into IAM misconfigurations or API outages without causing the entire scan to fail.

### Technical purpose
Serves as the central entry point for background workers running a scan job. It manages IAM STS role assumption, iterates through target AWS regions, invokes specialized service scanners in a strict dependency-aware order, triggers the Relationship Engine for edge discovery, and finally hands the data payload to the Snapshot Engine for persistence.

### Folder structure
Located in the engines directory:
*   `backend/app/engines/scan_orchestrator.py`

### Classes
*   **`ScanOrchestrator`**: A singleton coordinator class.

### Functions
*   **`run_scan()`**: The massive, monolithic procedural function that executes the entire pipeline end-to-end.
*   **`_save_service_scan()`**: A database helper function that logs the execution time, status, and resource count of every individual service scanned, creating an audit trail.

### Workflow
1.  **Job Initialization:** Fetches the pending `ScanJob` and target `AwsAccount` from the database.
2.  **Authentication:** Uses `aws_service._get_temp_credentials()` to perform an STS AssumeRole, acquiring temporary credentials for the target account.
3.  **Regional Loop:** Iterates over a predefined list of `SCAN_REGIONS`.
4.  **Dependency Mapping (Pass 1):** Scans VPCs and Subnets *first*. It constructs a memory dictionary (`subnet_map`) containing `subnet_id -> subnet_arn`.
5.  **Resource Scanning (Pass 2):** Scans dependent regional services (EC2, RDS, Lambda). It injects the `subnet_map` into these scanners so they can instantly resolve their parent-child relationships without making extra AWS API calls.
6.  **Global Scanning (Pass 3):** Exits the regional loop to scan Global AWS services (S3, CloudFront).
7.  **Edge Discovery:** Passes all accumulated nodes to `relationship_engine.discover_relationships()` to calculate communication paths (e.g., Lambda -> S3).
8.  **Snapshot Creation:** Passes the final nodes and edges to `snapshot_engine.create_snapshot()` for diffing and database insertion.
9.  **Job Completion:** Updates the `ScanJob` status in the database to `success`, `partial` (if some scanners failed), or `failed`.

### Inputs
*   `scan_job_id` (UUID): The primary key of the pending scan job in the database.

### Outputs
*   **Side Effects:** Returns nothing, but heavily mutates the PostgreSQL database by creating `ServiceScan`, `Snapshot`, `Resource`, `Relationship`, and `SnapshotDiff` records.

### Algorithms
*   **Dependency Injection (Subnet Resolution):** By forcing VPC/Subnet scanners to run first and explicitly passing their output (`subnet_map`) into subsequent compute scanners, the orchestrator algorithmically prevents $O(N)$ duplicate `DescribeSubnets` API calls that would otherwise throttle the AWS API.

### Dependencies
*   `app.services.aws_service` (STS Authentication).
*   `app.scanners.*` (All 15+ individual Boto3 service scanner scripts).
*   `app.engines.relationship_engine` (Edge mapping).
*   `app.engines.snapshot_engine` (Persistence).

### Error handling
*   **Fault-Tolerant Execution:** Every single individual service scanner is wrapped in a discrete `try/except` block. If `rds_scanner` crashes (e.g., due to a revoked IAM permission or API timeout), the orchestrator catches it, logs a `ServiceScan` failure, sets an `any_failure = True` flag, and **continues** scanning the rest of the architecture. The final job status becomes `partial` instead of crashing the worker.

### Tradeoffs
*   **Sequential vs. Concurrent:** The orchestrator currently runs every service scanner sequentially in a blocking fashion. This trades execution speed for extreme simplicity and guarantees that the `subnet_map` is fully populated before EC2 or Lambda needs it.

### Known limitations
*   **Hardcoded Regions:** The target regions are strictly hardcoded at the top of the file (`SCAN_REGIONS = ['ap-south-1', 'us-east-1']`). It does not dynamically query AWS for active regions, meaning any resources deployed in `eu-west-1` or `us-west-2` will be completely ignored by the scanner.

### Performance considerations
*   **Long-Running Blocking Thread:** Because it executes sequentially across regions and services, a scan of a large enterprise AWS account could take several minutes, blocking the Python worker thread. 

### Future improvements
*   **Dynamic Region Discovery:** Replace the hardcoded `SCAN_REGIONS` array with a dynamic call to AWS `DescribeRegions` to automatically scan all regions where the user has active infrastructure.
*   **Parallel Execution:** Implement concurrent scanning using Python's `asyncio.gather` or a `ThreadPoolExecutor`. Once the base VPC infrastructure is mapped sequentially, independent services (like SQS, API Gateway, and EventBridge) should be scanned in parallel to drastically reduce total scan time.
