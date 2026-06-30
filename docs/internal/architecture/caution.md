# Nebula Lens: Hidden Implementation Knowledge

## Overview
This document catalogs critical business rules, architectural constraints, hidden heuristics, and technical debt that exist *only* within the codebase implementation. Future developers must understand these undocumented mechanics to avoid introducing subtle regressions.

## 1. The "Smart Defibrillator" Telemetry Heuristic (Frontend)
**Location:** `src/store/useCanvasStore.ts`
*   **Heuristic:** To ensure the interactive architecture canvas always looks "alive", the frontend implements a simulation engine for telemetry metrics. If a metric naturally drops to `0` (e.g., an empty SQS queue), there is a **hardcoded 30% chance** to randomly spawn `1-5` new artificial events.
*   **Percentage-based Chaos:** For non-zero metrics, a jitter of `val * (Math.random() * 1.6 - 0.8)` is continuously applied.
*   **Performance Constraint:** The telemetry data array for each node is strictly truncated to exactly **6 data points**. Any more will be dropped. This is a deliberate hardcoded limit to prevent React memory leaks over long sessions.

## 2. Strict Graph Edge Rules vs. Hierarchy (Backend & Frontend)
**Location:** `backend/app/engines/relationship_engine.py` & `backend/app/routers/graph.py`
*   **Architectural Constraint:** VPCs and Subnets are **NEVER** allowed to be the source or target of a communication edge.
*   **Business Rule:** Containment (e.g., an EC2 instance inside a Subnet) is represented strictly via React Flow's `parentId` nesting structure. The backend explicitly strips edges involving VPCs/Subnets before sending the payload to the frontend. Attempting to draw an edge to a VPC will break the ELK layout engine.
*   **Edge Confidence Hardcoding:** The `relationship_engine` relies on a hardcoded matrix of confidence scores. For example, APIGateway to Lambda (via Integration URI) is `100%` confidence, while EC2 to RDS (inferred via Security Group ingress) is only `70%`.

## 3. The `SUPPORTED_SERVICES` Whitelist Blindspot
**Location:** `backend/app/routers/graph.py` and Snapshot/Diffing logic
*   **Hidden Assumption:** The system filters all topology and drift detection diffs against a hardcoded array of supported services (e.g., `{"vpc", "ec2", "lambda", "rds", ...}`).
*   **Known Bug / Tech Debt Risk:** If a developer adds a new scanner (e.g., `route53_scanner.py`) to the orchestrator but forgets to add the string `"route53"` to this specific set, the resources will be scanned and saved to the database, but will be silently dropped from all UI graphs and will never trigger drift detection alerts.


## 4. Deterministic Hash Diffing Strategy
**Location:** `backend/app/engines/normalizer.py`
*   **Business Rule:** The system detects infrastructure modifications ("drift") entirely by comparing SHA-256 hashes.
*   **Heuristic:** The `generate_fingerprint` function dumps the node's `metrics` dictionary to a string with `sort_keys=True` before hashing. This means the engine assumes that *only* changes to properties mapped inside the `metrics` dictionary constitute a legitimate infrastructure change. Modifying unmapped AWS tags or properties will bypass drift detection.

## 5. Defensive Normalization (Error Swallowing)
**Location:** `backend/app/engines/normalizer.py`
*   **Tradeoff:** The normalizer intentionally swallows potential errors from chaotic Boto3 responses by aggressively using Python's `.get('Key', 'N/A')` dictionary methods.
*   **Consequence:** While this prevents the scan pipeline from crashing on malformed AWS responses, it introduces a hidden risk: if AWS structurally changes an API response, the system will silently log `"N/A"` for critical fields instead of throwing an alert, masking API regressions.

## 6. Snapshot Engine Database Bottleneck
**Location:** `backend/app/engines/snapshot_engine.py`
*   **Technical Debt:** The snapshot engine executes an `N+1` database insert loop (repeatedly calling `db.add()` inside a Python loop) when persisting `Resource` and `Relationship` records.
*   **Performance Constraint:** While acceptable for small environments, this specific loop will cause transaction timeouts when scanning large enterprise AWS accounts (>10,000 resources). A migration to SQLAlchemy bulk inserts (`bulk_save_objects`) is required before scaling.

## 7. The 3-Level Pricing Fallback
**Location:** `backend/app/engines/cost_engine.py` & `pricing_service.py`
*   **Architectural Concept:** The `CostEngine` dynamically injects AWS credentials `_credentials` into node dictionaries right before cost calculation.
*   **Hidden Mechanism:** This allows calculators to query the live AWS Pricing API. However, what is not obvious is that the underlying `PricingService` has a hidden 3-level fallback: Cache -> Live API -> Hardcoded `_FALLBACK` dictionary. Calculators are abstracted away from this and assume prices are always available, meaning adding a new service requires updating the hidden `_FALLBACK` dict to prevent calculation failures when AWS APIs rate limit.
