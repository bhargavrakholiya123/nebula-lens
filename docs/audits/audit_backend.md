# Phase 1: Backend & Engines Documentation Audit

## Overview
This report validates the accuracy of technical statements in the `docs/internal/` directory related to the backend engines, scanners, and database against the current state of the repository.

## 1. backend-notes.md
- **Rating:** 10/10
- **Flags:** None. 
- **Verification:** The architectural descriptions of `ScanOrchestrator`, `RelationshipEngine`, and `CostEngine` align perfectly with `backend/app/engines/`. The models (`models.py`) and functions like `process_pending_scans()` in `main.py` and `get_latest_graph` in `routers/graph.py` are present and accurately described. The topology normalization reference `normalize_topology_nodes` exists accurately in `app.utils.topology`.
- **Recommendations:** Excellent foundational document, no changes needed.

## 2. snapshot-engine-notes.md
- **Rating:** 9/10
- **Flags:** 
  - *Ambiguous Descriptions:* The diffing section mentions checking the `Resource` table. While correct for nodes, edges are stored in the `Relationship` table. It's helpful to clarify that diffs are generated only for nodes (Resources), or clarify if edges are included in the diff.
  - *Hardcoded Filter:* Verified that `SUPPORTED_SERVICES` exists and is hardcoded in `snapshot_engine.py` as claimed.
- **Verification:** `create_snapshot()` and `SnapshotEngine` exist. The workflow steps (cost hydration, persistence) match the code.
- **Recommendations:** Clarify whether `Relationship` edges are included in drift detection diffs.

## 3. normalization-notes.md
- **Rating:** 10/10
- **Flags:** None.
- **Verification:** Verified `NormalizationEngine` and its methods (`generate_fingerprint`, `build_node`, `build_edge`, `normalize_*`) exist in `backend/app/engines/normalizer.py`. The description of it being a monolithic adapter pattern is completely accurate.
- **Recommendations:** The "Future Improvements" section suggests moving to a Strategy Pattern. This is a very valid architectural recommendation that should remain.

## 4. cost-engine-notes.md
- **Rating:** 10/10
- **Flags:** None.
- **Verification:** `backend/app/engines/cost_engine.py` and `costs/base.py` accurately reflect the singleton dispatcher (`CostEngine`), the abstract base class (`BaseCostCalculator`), and the routing logic (`_register_builtins`, `calculate`, `calculate_all`).
- **Recommendations:** Keep this updated whenever new AWS services are supported in the pricing calculators.

## 5. relationship-engine-notes.md
- **Rating:** 10/10
- **Flags:** None.
- **Verification:** All classes (`RelationshipRule`, `RelationshipEngine`) and rule-evaluation functions (`_run_pass2_rules`, `_iam_allowed`, etc.) exist in `relationship_engine.py`. Network resolver dependencies (`pass4_network_resolver.py`) are also correctly referenced.
- **Recommendations:** None.

## 6. scan-orchestrator-notes.md
- **Rating:** 10/10
- **Flags:** None.
- **Verification:** Verified `ScanOrchestrator`, `run_scan()`, and `_save_service_scan()` exist in `scan_orchestrator.py`. The description of sequential execution and dependency injection (`subnet_map`) is accurate.
- **Recommendations:** None.

## 7. network-resolution-engine-notes.md
- **Rating:** 10/10
- **Flags:** None.
- **Verification:** Verified `Pass4NetworkMapper`, `Pass4NetworkTopologyResolver`, `mapper._build()`, `resolver.run_pass4()`, and the circuit breaker constant `SUBNET_INFERENCE_RESOURCE_LIMIT=20`. 
- **Recommendations:** None.

## 8. database-notes.md
- **Rating:** 10/10
- **Flags:** None.
- **Verification:** The SQLAlchemy engine connection pool config (`pool_size=20`, `max_overflow=30`) and the `get_db()` dependency generator are exactly as described in `database.py`. All models are verified to exist in `models.py`.
- **Recommendations:** None.

## 9. api-notes.md
- **Rating:** 9/10
- **Flags:** 
  - *Ambiguous Descriptions:* Mentions that API routes format data to React Flow `parentId` property. This formatting actually happens partly in `app.utils.topology.normalize_topology_nodes`, which is called by the routers.
- **Verification:** Endpoints and validation structures correctly mirror the FastAPI design pattern implemented in `backend/app/routers/`.
- **Recommendations:** Specify that the actual React Flow restructuring logic resides in `app.utils.topology` rather than being hardcoded directly in the router bodies.

## 10. discovery-pipeline-notes.md & metrics-engine-notes.md
- **Rating:** 10/10
- **Flags:** None. The metrics engine correctly uses a registry pattern similar to the cost engine.
- **Recommendations:** None.

## 11. pipeline_analysis.md
- **Rating:** 10/10
- **Flags:** None. This provides a brilliant end-to-end trace.
- **Recommendations:** None. 

> [!NOTE]
> Phase 1 is complete. The backend documentation is remarkably accurate and deeply coupled to the actual codebase implementation. No major broken references were found.
