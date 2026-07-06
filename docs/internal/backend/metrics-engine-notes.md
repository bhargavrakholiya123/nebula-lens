# Metrics Engine Engineering Notes

### Why this module exists
To gather performance, usage, and operational metrics (like CPU utilization, memory usage, queue depth, or API invocation counts) for discovered AWS resources, primarily relying on AWS CloudWatch data.

### Business purpose
Provides engineering and DevOps teams with real-time operational context (Telemetry) directly overlayed on the architecture diagram. It helps identify over-provisioned instances, pinpoint performance bottlenecks, flag failing Lambda functions, and validate cost anomalies.

### Technical purpose
Acts as a strict, pluggable, registry-based dispatcher (similar to the Cost Engine). It completely eliminates `if/elif` chains by routing normalized nodes directly to a service-specific metric collector class (e.g., mapping an EC2 node to the `EC2MetricsCollector`). It orchestrates batch metric collection and heavily utilizes caching to respect strict AWS CloudWatch API rate limits.

### Folder structure
Located in the engines directory with a dedicated subsystem folder:
*   `backend/app/engines/metrics_engine.py`: The core registry and dispatcher.
*   `backend/app/engines/metrics/`: Subsystem directory containing the `base.py` interface, the `cache.py` module, and over a dozen service-specific collector implementations (e.g., `rds_metrics.py`, `sqs_metrics.py`).

### Classes
*   **`MetricsEngine`**: A singleton registry that maintains the dictionary of supported service collectors.

### Functions
*   **`_register_builtins()`**: Automatically instantiates and registers 13+ out-of-the-box service collectors upon initialization.
*   **`register()`**: Exposes the ability to add new service collectors dynamically (Open-Closed Principle).
*   **`collect()`**: Routes a single normalized node to its corresponding collector, executing a safe wrapper around the collector's logic.
*   **`collect_all()`**: Orchestrates the batch collection loop, specifically handling cache lookups to intercept duplicate CloudWatch calls.
*   **`service_info()`**: Diagnostic helper that returns metadata about a specific collector (e.g., exactly which CloudWatch namespaces and metrics it plans to query).

### Workflow
1.  **Boot:** The engine initializes as a singleton (`metrics_engine`), registering all built-in collectors (Lambda, SQS, EC2, etc.).
2.  **Invocation:** The `ScanOrchestrator` calls `collect_all()` with a list of nodes and a lookback window (default 24 hours).
3.  **Cache Peeking:** For every node, it checks the `metrics_cache` to see if fresh data (< 5 minutes old) exists for that ARN and time period. If yes, it skips the API call (Cache Hit).
4.  **Routing:** If no cache exists, it extracts the node's `service` string, looks up the registered collector instance in `self._registry`, and invokes `collector.collect()`.
5.  **Execution:** The specific collector queries AWS CloudWatch (typically packing multiple metrics into a single `GetMetricData` batch call).
6.  **Return:** Returns a unified schema containing time-series data, summary statistics, and telemetry definitions.

### Inputs
*   `node`: Dictionary representing a normalized AWS resource.
*   `credentials`: Dictionary containing temporary AWS STS credentials for Boto3 execution.
*   `region`: AWS Region string.
*   `period_hours`: The CloudWatch lookback window (default: 24h).

### Outputs
*   A dictionary mapping resource ARNs to a structured telemetry payload:
    ```json
    {
      "service": "lambda",
      "cloudwatch": { "Invocations": [...], "Errors": [...] },
      "telemetryData": [ { "time": "12:00", "Invocations": 45 } ],
      "summary": { "avgInvocations": 45, "errorRate": 0.01 },
      "errors": [],
      "schema": [ { "name": "Invocations", "type": "number", "color": "#f97316" } ]
    }
    ```

### Algorithms
*   **Registry Dispatch Mapping:** Uses dictionary lookups (`self._registry.get(service)`) to route execution. This guarantees $O(1)$ dispatch time regardless of how many services the platform eventually supports.
*   **Batch Fallback Strategy:** Documented in comments: Subnets require no API calls (static metadata); VPCs require one batch call; standard resources require one highly-dense `GetMetricData` call packing all required metrics (CPU, Memory, Disk) into a single request.

### Dependencies
*   Custom `app.engines.metrics.*` components (the Base interface, individual collectors, and the caching module).

### Error handling
*   **Graceful Degradation:** Wraps the `collector.collect()` execution in a generic `try/except` block. If a specific collector crashes due to a Boto3 exception, it catches the error, logs it, and returns an empty schema array with the exception string appended to the `"errors"` list. This guarantees that one bad CloudWatch call won't crash the entire dashboard load.
*   **Missing Services:** Unregistered services bypass execution entirely and return a safe `_unsupported_result` dictionary.

### Tradeoffs
*   **Class Explosion vs. Clean Code:** The developers chose to create a distinct file and class for every single AWS service instead of a large, generic query builder. This trades a larger file count for strict separation of concerns, making it incredibly easy for new engineers to add support for a new service without breaking existing ones.

### Known limitations
*   **CloudWatch Exclusivity:** The engine relies exclusively on AWS CloudWatch. If an AWS service does not natively publish metrics to CloudWatch, or if the scanning IAM Role lacks `cloudwatch:GetMetricData` permissions, the engine fails silently and returns empty graphs on the frontend.
*   **Sequential Execution:** The `collect_all()` loop iterates through the node list sequentially.

### Performance considerations
*   **Sequential API Bottleneck:** Because `collect_all` iterates one-by-one, querying CloudWatch for 1,000 EC2 instances will take a significant amount of time, as each API call blocks the thread. Caching is absolutely mandatory to keep the application responsive.

### Future improvements
*   **Concurrent I/O:** Refactor the `collect_all()` loop to utilize `asyncio.gather` or a `ThreadPoolExecutor`. Because CloudWatch queries are I/O bound, running them concurrently would drastically reduce the overall time required to hydrate telemetry for large topologies.
