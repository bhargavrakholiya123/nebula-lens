# Database Engineering Notes

### Why this module exists
To persistently store cloud infrastructure states, job tracking metadata, user configurations, and structural relationships, enabling historical analytics and stateful visualization.

### Business purpose
Provides the "historical memory" of the platform. It allows users to track how their cloud environments change over time (version history), perform exact diffs (added/removed resources), and audit configurations from previous points in time.

### Technical purpose
Implements the ORM mappings for PostgreSQL using SQLAlchemy. It abstracts complex SQL queries into Python objects, manages connection pooling, handles cross-table foreign key relationships, and safely stores both rigid relational data (like User mappings) and flexible semi-structured data (like AWS configuration metrics).

### Folder structure
All database-related configurations reside in the backend:
*   `backend/app/database.py`: Configuration and initialization of the SQLAlchemy engine, connection pool, and the `get_db` FastAPI dependency.
*   `backend/app/models/models.py`: Contains all ORM class definitions (database schemas).

### Classes (Database Models)
*   **Identity & Access:** `User`, `AwsAccount` (Links Auth0 identities to AWS IAM Role ARNs).
*   **Job Tracking:** `ScanJob`, `ServiceScan` (Tracks asynchronous cloud discovery execution, region by region).
*   **State History:** `Snapshot` (Represents a single point-in-time state of an AWS account's topology).
*   **Raw Data:** `Resource`, `Relationship` (The raw, parsed output from the AWS Boto3 scanners).
*   **Cached Data:** `NormalizedNode`, `NormalizedEdge` (Pre-formatted, frontend-ready topology elements designed to make the `/api/graph/latest` endpoint incredibly fast).
*   **Analytics:** `SnapshotDiff` (A cache of exact added, removed, and modified nodes between two snapshot versions).

### Functions
*   `get_db()` (`database.py`): A FastAPI dependency generator. It yields a transient database session (`SessionLocal`) when an HTTP request starts and guarantees the session is closed via a `finally` block when the request ends.

### Workflow
1.  **Initialization:** The FastAPI application starts and reads the `DATABASE_URL` environment variable.
2.  **Connection Pooling:** `create_engine` establishes a persistent connection pool to PostgreSQL.
3.  **Request Lifecycle:** Incoming API requests invoke `get_db()`, receiving a database session.
4.  **Transaction:** API routers or backend engines perform CRUD operations via the SQLAlchemy model classes.
5.  **Cleanup:** The session is closed (returning the connection to the pool) after the API request completes, regardless of success or failure.

### Inputs
*   **Configuration:** Environment variable `DATABASE_URL`.
*   **Data Entry:** Dictionaries and objects provided by backend engines (Scanners, Normalizers) mapped to ORM instances.

### Outputs
*   **Persistent State:** Data written to the PostgreSQL database.
*   **Result Sets:** SQLAlchemy objects yielded to the API routers for JSON serialization.

### Algorithms
*   This module contains purely declarative mappings; it relies on the underlying PostgreSQL RDBMS for indexing, joining, and JSONB document searching.

### Dependencies
*   `sqlalchemy` (Core ORM mapping and query building).
*   `psycopg2` or similar driver (implied by the PostgreSQL dialect).
*   `uuid` (For generating primary keys).
*   `python-dotenv` (For local environment variable injection).

### Error handling
*   **Transaction Safety:** The `get_db()` function utilizes a strict `try/finally` block. This guarantees database sessions are closed (preventing connection leaks) even if a FastAPI endpoint throws an unhandled exception.

### Tradeoffs
*   **JSONB vs. Rigid Columns:** Storing AWS `metrics` and `tags` as PostgreSQL `JSONB` columns allows extreme flexibility. If AWS introduces a new configuration field, it can be captured immediately without requiring a database schema migration. However, querying deeply nested JSONB structures is slower than querying strictly defined standard relational columns.
*   **Raw vs. Normalized Tables:** The database stores both the raw topology (`Resource`/`Relationship`) and the frontend-optimized topology (`NormalizedNode`/`NormalizedEdge`). This consumes roughly double the storage space, but it acts as a fast-path cache for API responses while preserving the raw state so algorithms can be re-run historically if bugs are found in the normalizer.

### Known limitations
*   **Missing Time-Series Optimizations:** Historical metrics are stored as discrete snapshots rather than in a dedicated time-series database. This makes continuous metric trend analysis computationally expensive for PostgreSQL.
*   **Migration Framework:** There is no explicit Alembic migration folder immediately visible in this layer, implying schema changes might currently require manual SQL execution or rely on `Base.metadata.create_all()`, which is unsafe for production data alterations.

### Performance considerations
*   **Connection Pool Tuning:** The parameters `pool_size=20` and `max_overflow=30` in `create_engine` explicitly tune the connection pool to prevent connection exhaustion during heavy parallel scanning or sudden spikes in API traffic.
*   **UUID Primary Keys:** The system extensively uses `UUID4` for primary keys instead of auto-incrementing integers. This greatly improves distributed ID generation and security but can fragment database indexes over time, requiring periodic `REINDEX` maintenance.

### Future improvements
*   **Robust Migrations:** Formally implement and track schema changes using `Alembic` to ensure safe production database upgrades.
*   **TimescaleDB Integration:** Evaluate migrating time-series metrics (like historical cost spikes or telemetry telemetry) to a dedicated TSDB extension like TimescaleDB to optimize long-term trend querying.
