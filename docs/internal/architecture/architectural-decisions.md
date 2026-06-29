# Architectural Decisions Inferred from Implementation

## Overview

This document reconstructs Architectural Decision Records (ADRs) based purely on the existing implementation logic, file structures, and code patterns within the Nebula Lens repository.

## Design Decisions

### 1. Monolithic Normalization Engine

*   **Problem**: AWS APIs (via Boto3) return chaotic, deeply nested, and structurally inconsistent JSON payloads that cannot be directly digested by the React Flow frontend.
*   **Context**: The discovery pipeline must standardize outputs from dozens of disparate service scanners (EC2, S3, RDS, etc.).
*   **Decision**: Utilize a single, monolithic `NormalizationEngine` class (in `normalizer.py`) acting as a massive Adapter. It applies a strict `build_node()` method to enforce a React Flow compatible schema (`{"id": "...", "type": "...", "data": {...}}`).
*   **Alternatives**: Implementing a decentralized strategy pattern with independent `BaseNormalizer` subclasses (e.g., `EC2Normalizer`) mapped via a registry.
*   **Benefits**: Immediate discoverability. All data transformation, extraction, and schema enforcement logic resides in a single location, bypassing the need for complex registry instantiation.
*   **Drawbacks**: The file is massive (~1,100 lines), prone to merge conflicts, and difficult to unit test in isolation. It relies heavily on defensive `.get()` calls to swallow missing keys.
*   **Future consequences**: As AWS services expand, this monolithic file will become unmaintainable, eventually mandating a refactoring to the strategy pattern (similar to the current `CostEngine`).

### 2. Full Deep-Copy Snapshot Persistence

*   **Problem**: Need to track cloud infrastructure drift and history over time to power "Time Travel" features.
*   **Context**: Saving daily infrastructure scans for enterprise-level accounts involves managing tens of thousands of resources and relationships.
*   **Decision**: Store full, deep copies of all `Resource` and `Relationship` records for *every* snapshot rather than storing only the delta changes.
*   **Alternatives**: Event Sourcing (persisting only the diffs between scans) or implementing a Git-like object storage system.
*   **Benefits**: Lightning-fast read queries for the API. Fetching a historical topology only requires filtering the database by `snapshot_id`. Rollbacks and historical view generation are trivial.
*   **Drawbacks**: Massive data duplication leading to exponential database bloat. The persistence layer suffers from severe `N+1` database insertion latency during the deep copy process.
*   **Future consequences**: Requires implementing aggressive data retention policies or background cron jobs to prune old snapshots before the PostgreSQL database exhausts its storage capacity.

### 3. Deterministic Hash Diffing Strategy

*   **Problem**: Accurately determining if an AWS resource has fundamentally changed between two scans.
*   **Context**: AWS resources contain dozens of volatile fields (like dynamic IPs, timestamps, or usage metrics) that should not trigger visual "drift" alerts in an architectural context.
*   **Decision**: Extract only critical properties into a targeted `metrics` dictionary, sort the keys alphabetically to guarantee order, and compute a deterministic SHA-256 fingerprint (`generate_fingerprint`). Modifying this payload changes the hash, indicating drift.
*   **Alternatives**: Deep recursive dictionary comparisons (e.g., DeepDiff) against the raw AWS payload, or relying entirely on AWS CloudTrail audit logs.
*   **Benefits**: Extremely fast memory-based comparisons. Highly tunable—by intentionally omitting noisy properties from the `metrics` dict, the engine avoids false-positive drift alerts.
*   **Drawbacks**: Causes minor CPU blocking during bulk stringification. It introduces a massive blindspot: if a developer fails to map a critical AWS property into the `metrics` dictionary, changes to that property will permanently bypass drift detection.
*   **Future consequences**: Demands high vigilance from developers when writing normalizer extraction logic, as the integrity of the diffing engine is entirely coupled to what is explicitly placed inside the `metrics` dict.

### 4. Registry-Based Cost Engine Dispatcher

*   **Problem**: Calculating costs across dozens of distinct AWS pricing models leads to unmaintainable if-else control flows.
*   **Context**: Adding a new service previously required modifying core calculation logic, risking regressions across existing service calculations.
*   **Decision**: Implement a pluggable, registry-based dispatcher (`CostEngine`) where each service registers its own dedicated calculator class inheriting from `BaseCostCalculator`.
*   **Alternatives**: A monolithic `calculate_cost` function, or offloading calculations entirely to an external SaaS API.
*   **Benefits**: Strongly adheres to the Open-Closed Principle. Adding a new AWS service only requires writing and registering a new class. Highly decoupled.
*   **Drawbacks**: The system internally hides a complex 3-level pricing fallback (Cache -> Live Pricing API -> Hardcoded Fallback) inside `PricingService`. Calculators operate blindly, unaware of where the price originated.
*   **Future consequences**: Provides smooth scalability for adding new services, but mandates strict interface compliance (e.g., defining the `SERVICE` attribute) from all calculator plugins.

### 5. Metadata-Driven Edge Inference

*   **Problem**: AWS APIs rarely return direct, explicit connections between disparate resources (e.g., an EC2 instance does not contain an API field linking it to an RDS instance).
*   **Context**: The frontend topology graph strictly requires explicitly defined edges between parent and child node ARNs.
*   **Decision**: Utilize a `RelationshipEngine` driven by a hardcoded `PASS_2_RULES` matrix. It infers relationships strictly by inspecting configuration metadata (IAM roles, environment variables, security group ingress rules, event source mappings).
*   **Alternatives**: Ingesting and analyzing VPC Flow Logs (too slow, expensive), or utilizing eBPF tracing (requires invasive agent installations).
*   **Benefits**: Agentless, highly performant, incurs no additional AWS costs, and relies purely on the existing "dead" configuration state.
*   **Drawbacks**: Edge generation is heavily heuristic (e.g., mapping environment variables to infer SQS connections yields a low 60% confidence score). It is susceptible to false positives or completely missing obscure, highly dynamic routing configurations.
*   **Future consequences**: The architecture graph will fundamentally remain an *estimation* of the infrastructure. The UI may eventually require user intervention capabilities to manually verify, correct, or draw missing complex routing edges.
