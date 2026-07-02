# Snapshot Engine Engineering Notes

### Why this module exists
To capture, store, and compare the exact state of a cloud architecture at a specific point in time. It ensures that every infrastructure scan is append-only, preventing the loss of historical configuration data.

### Business purpose
Enables "Time Travel" and drift detection. It allows engineering and finance teams to answer critical questions like "what changed in our infrastructure since yesterday?" or "why did our cloud bill spike over the weekend?" by comparing the live state against historical snapshots.

### Technical purpose
Acts as the final persistence layer for the Discovery Pipeline. It consumes the normalized nodes and edges, routes them through the Cost Engine to capture point-in-time financial metrics, and saves everything to the PostgreSQL relational database. Crucially, it implements the diffing logic (Added, Removed, Modified) by comparing cryptographic fingerprints against the previous snapshot.

### Folder structure
Located in the engines directory:
*   `backend/app/engines/snapshot_engine.py`

### Classes
*   **`SnapshotEngine`**: A singleton class managing the transaction boundaries and diffing algorithms for snapshot creation.

### Functions
*   **`create_snapshot()`**: The monolithic coordinator function that handles version bumping, cost calculation, bulk insertion, and drift detection.

### Workflow
1.  **Version Resolution:** Queries the database for the last snapshot belonging to the AWS account to determine the next `version_number`.
2.  **Deprecation:** Marks the previous snapshot as `is_latest = False`.
3.  **Cost Hydration:** Passes all newly discovered nodes through the `cost_engine` to calculate real-time estimated monthly costs for the exact moment the snapshot is taken.
4.  **Header Creation:** Creates a new `Snapshot` record with aggregated metrics (total resources, total monthly cost).
5.  **Persistence:** Iterates over the lists and inserts all nodes as `Resource` records and all edges as `Relationship` records, tying them to the new `snapshot_id`.
6.  **Diffing:** Compares the new `Resource` list against the previous `Resource` list to generate `SnapshotDiff` records (Added, Removed, Modified). Note: The diffing logic strictly evaluates `Resource` changes (nodes) and does not currently track `Relationship` changes (edges) in the diff payload.
7.  **Commit:** Commits the SQLAlchemy transaction and returns the final snapshot object.

### Inputs
*   `db`: SQLAlchemy Database Session.
*   `account_db_id`: The internal UUID of the AWS Account in the database.
*   `all_nodes`: List of dictionaries containing normalized node data and fingerprints.
*   `all_edges`: List of dictionaries containing normalized edge data.
*   `aws_account_id`: The raw 12-digit AWS Account ID string.

### Outputs
*   An ORM `Snapshot` object containing the metadata, resource counts, and calculated diff statistics (`added_count`, `removed_count`, `modified_count`).

### Algorithms
*   **Drift Detection (Diffing Strategy):**
    *   **Added:** ARNs present in the new scan that do not exist in the previous scan.
    *   **Removed:** ARNs present in the previous scan that do not exist in the new scan.
    *   **Modified:** ARNs present in both scans where the `new_res.fingerprint != prev_res.fingerprint`. When a mismatch is detected, the engine performs a deep comparison of the metadata to extract exactly what changed (e.g., `{"name": {"from": "old", "to": "new"}}`).

### Dependencies
*   `sqlalchemy.orm.Session` (Database transactions).
*   `app.models.models` (Relational schema for `Snapshot`, `Resource`, `Relationship`, `SnapshotDiff`).
*   `CostEngine` (For injecting financial data).

### Error handling
*   **Transactional Integrity:** Leverages SQLAlchemy transaction boundaries (calling `db.commit()` only at the very end of the function). If any resource insertion, cost calculation, or diff generation fails and throws an exception, the entire snapshot rolls back safely, preventing corrupted or partial snapshots.

### Tradeoffs
*   **Storage Cost vs. Query Speed:** The engine creates a full deep copy of every `Resource` and `Relationship` for every snapshot, rather than storing just the deltas (Event Sourcing). The tradeoff prioritizes lightning-fast API reads (just filtering by `snapshot_id`) over database storage efficiency.

### Known limitations
*   **Hardcoded Diff Filters:** The diffing logic explicitly filters by a hardcoded `SUPPORTED_SERVICES` array. If the discovery pipeline adds a new service (like `route53`) but forgets to add it to this array in `snapshot_engine.py`, changes to that service will be saved but will *not* generate drift detection alerts.

### Performance considerations
*   **N+1 Insert Latency:** The engine uses standard `db.add()` inside loops for inserting Resources and Relationships. While acceptable for a few hundred resources, this will cause significant database latency when scanning large enterprise accounts with 10,000+ resources.

### Future improvements
*   **Bulk Inserts:** Refactor the persistence loops to use SQLAlchemy's `db.bulk_save_objects()` or `db.bulk_insert_mappings()` to drastically reduce transaction times on massive AWS accounts.
*   **Snapshot Pruning Job:** Implement a background cron job to prune old snapshots (e.g., keeping only 1 snapshot per day after 30 days) to mitigate the exponential database bloat caused by the deep-copy architecture.
