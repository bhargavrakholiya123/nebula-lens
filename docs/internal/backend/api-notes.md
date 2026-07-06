# API Engineering Notes

### Why this module exists
To serve as the communication bridge between the frontend web client and the backend engines/database.

### Business purpose
Provides secure, standardized endpoints for the UI to onboard new AWS accounts, trigger infrastructure scans, retrieve historical cost analytics, and pull visual topology data for the dashboard.

### Technical purpose
Uses FastAPI to expose RESTful HTTP endpoints. It handles request validation, routes business logic to the correct engines (e.g., Cost Engine, AWS STS), queries PostgreSQL via SQLAlchemy, and explicitly formats complex graph payloads into structures compatible with the frontend's React Flow engine.

### Folder structure
All API routes are located in `backend/app/routers/`:
*   `aws_accounts.py`: Endpoints for connecting, listing, and checking the status of AWS accounts (`/api/aws/*`).
*   `graph.py`: Core topology data endpoints (`/api/graph/*`) that serve the active canvas.
*   `history.py`: Endpoints for retrieving historical snapshots, diffs, and historical cost rollups (`/api/history/*`).
*   `analyze.py` / `normalize.py` / `db_inspector.py`: Specialized endpoints for triggering specific engine workflows or debugging.

### Classes
*   **Pydantic Schemas** (imported from `app.schemas`): `ConnectAwsRequest`, `ConnectAwsResponse`, `AwsAccountResponse` — used for strict request/response data validation.

### Functions
*   `connect_aws_account()`: Validates an incoming IAM role via AWS STS, creates a new account record in the database, and immediately queues an initial background scan.
*   `get_latest_graph()`: Fetches the most recent snapshot's resources and relationships, filters out unsupported node types, and formats them into React Flow node/edge structures.
*   `get_snapshot_history()`: Lists all historical snapshots for an account, dynamically computing (and caching) total resource counts, service-level cost summaries, and change statistics.
*   `get_snapshot_diff()`: Calculates added, removed, and modified resources between consecutive snapshots.

### Workflow
1.  **Request Handling:** The Next.js frontend sends an HTTP GET/POST to a `/api/*` endpoint.
2.  **Validation:** FastAPI validates the payload/query parameters against Pydantic schemas.
3.  **Database Injection:** The router injects the active SQLAlchemy database session via FastAPI's `Depends(get_db)`.
4.  **Querying:** The router queries PostgreSQL for the requested data (e.g., Snapshots, Resources).
5.  **Enrichment:** For complex endpoints (like `/api/history`), the router may invoke core engines directly (e.g., `cost_engine.calculate_all()`) to enrich the response before sending it.
6.  **Formatting:** The router formats the data specifically for the frontend (e.g., mapping backend models to the `CloudNode` JSON structure) and returns the JSON response.

### Inputs
*   **HTTP Requests:** Query parameters (e.g., `account_id`, `snapshot_id`, `only_new`) and JSON bodies (e.g., `role_arn`).

### Outputs
*   **HTTP JSON Responses:** Adhering strictly to Pydantic schemas or predefined dictionary shapes expected by the frontend Zustand stores.

### Algorithms
*   **Graph Assembly:** Merges normalized nodes and edges, specifically mapping structural hierarchy boundaries (like VPC and Subnet containment) to the React Flow `parentId` property rather than emitting them as standard graphical edges. **Note:** This specific restructuring logic is delegated to `app.utils.topology.normalize_topology_nodes` and is not hardcoded directly in the router bodies.
*   **On-The-Fly Diffing:** The `get_snapshot_diff` algorithm loops through `previous_snap` and `current_snap` resources using ARN-keyed dictionaries to calculate exact additions, removals, and metadata modifications, tracking changes in a `SnapshotDiff` table.

### Dependencies
*   `FastAPI` (Routing and HTTP request/response handling).
*   `SQLAlchemy` (Database queries and transactions).
*   `Pydantic` (Data validation and serialization).
*   Core application engines (e.g., `aws_service`, `cost_engine`).

### Error handling
*   **HTTP Exceptions:** Standard FastAPI `HTTPException` raises are used to return appropriate status codes (e.g., 404 Not Found for missing accounts/snapshots, 400 Bad Request for invalid IAM Role ARNs).
*   **Transaction Safety:** Try/except blocks around database operations ensure rollbacks (`db.rollback()`) on failure, preventing partial database corruption.

### Tradeoffs
*   **On-the-fly Computation vs. Pre-computation:** The history diff endpoint calculates diffs *on-the-fly* if they don't already exist in the database. This delays the API response the first time a user views a diff but saves database space and background processing time if a user never investigates that specific snapshot history.
*   **Tight Frontend Coupling:** The API actively formats nodes to React Flow specifications (e.g., hardcoding `position: {x:0, y:0}` and `parentId`). This makes the API highly specialized and efficient for this specific frontend, but less useful as a generic, headless public API.

### Known limitations
*   **Lack of Pagination:** The core graph endpoint (`/api/graph/latest`) returns the entire environment payload at once. For massive AWS accounts (10k+ resources), this single massive JSON payload can cause slow network transfers and browser memory spikes.
*   **Authentication Stub:** Authentication logic is currently a placeholder (assigning a default user), though the architecture implies future Auth0 integration based on comments.

### Performance considerations
*   **Synchronous Engine Calls:** The `/api/history` endpoints aggressively query the `cost_engine` synchronously to enrich historical snapshots. This is highly CPU-intensive and blocks the FastAPI event loop for that worker.
*   **Process-Level Caching:** A global `HISTORY_STATS_CACHE` dictionary is utilized to prevent recalculating resource counts and costs repeatedly on sequential requests for the same snapshot.

### Future improvements
*   **Payload Streaming/Pagination:** Implement pagination or chunked streaming (`Transfer-Encoding: chunked`) for large graph payloads to improve frontend time-to-first-byte (TTFB).
*   **JWT Security:** Fully integrate Auth0 JWT validation via FastAPI dependency injection to secure the endpoints.
*   **Background Diffing:** Move the on-the-fly diff calculations out of the API request lifecycle and into the background `SnapshotEngine` so API response times remain strictly under 100ms.
