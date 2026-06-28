# Normalization Module Engineering Notes

### Why this module exists
To convert the chaotic, deeply nested, and inconsistent JSON payloads returned by raw AWS APIs (Boto3) into a standardized, unified format that the frontend React Flow engine can seamlessly ingest and render.

### Business purpose
Decouples the frontend visualization layer from AWS API idiosyncrasies. It ensures the topology map remains stable, predictable, and clean, even if AWS restructures their underlying data models. It also performs the first pass of security and insight generation (e.g., flagging a bucket as "Public").

### Technical purpose
Acts as a massive Adapter Pattern layer. The `NormalizationEngine` consumes raw AWS dictionaries, extracts critical metadata (names from Tags, parent-child relationships), applies basic heuristics (like identifying public subnets or open security groups), and enforces a strict JSON schema required by `@xyflow/react` (React Flow). It also generates cryptographic fingerprints for state drift detection.

### Folder structure
Currently centralized in a single file:
*   `backend/app/engines/normalizer.py`

### Classes
*   **`NormalizationEngine`**: A single monolithic class containing helper builders and service-specific transformation methods.

### Functions
*   **`generate_fingerprint()`**: Sorts and hashes a resource's metrics payload to create a deterministic SHA-256 signature.
*   **`build_node()`**: A strict schema enforcer that wraps metadata into the `{"id": "...", "type": "...", "data": {...}}` format expected by React Flow.
*   **`build_edge()`**: Constructs standardized animated edges between ARNs.
*   **`normalize_[service]()`**: Dozens of service-specific methods (e.g., `normalize_ec2`, `normalize_vpc`, `normalize_iam_role`, `normalize_dynamodb`). They parse the raw Boto3 dicts, handle missing keys safely, and inject parent ARNs.

### Workflow
1.  **Ingestion:** The Discovery Pipeline fetches raw JSON from AWS APIs (via Boto3).
2.  **Routing:** The Pipeline routes the raw dictionary to the corresponding `normalize_*` method in the Normalizer.
3.  **Extraction:** The Normalizer hunts for human-readable names (usually buried in AWS Tags), resolves parent relationships (e.g., ensuring an RDS instance gets assigned to its parent Subnet ARN), and packs relevant stats into a `metrics` dictionary.
4.  **Schema Enforcement:** It calls `build_node()` to format the dictionary precisely for React Flow.
5.  **Fingerprinting:** It hashes the `metrics` payload via `generate_fingerprint()`.
6.  **Return:** It yields a normalized package (node schema, fingerprint, ARN, raw ID) back to the Discovery Pipeline for graph construction.

### Inputs
*   Raw Boto3 dictionary responses.
*   Contextual metadata (AWS Region, Account ID).
*   Relationship maps (e.g., passing a `subnet_map` dictionary into `normalize_ec2` so the EC2 instance knows which Subnet ARN it belongs to).

### Outputs
*   A standardized dictionary containing:
    ```json
    {
      "node": { ...ReactFlowSchema... },
      "fingerprint": "a1b2c3d4e5...",
      "resource_arn": "arn:aws:ec2:us-east-1:123:instance/i-abcd",
      "resource_name": "Prod-Web-Server",
      "raw_id": "i-abcd",
      "parent_arn": "arn:aws:ec2:us-east-1:123:subnet/sub-123"
    }
    ```

### Algorithms
*   **Deterministic Fingerprinting:** To detect if a resource has changed between snapshot scans, the engine builds the `metrics` dictionary, sorts the keys alphabetically to guarantee order, dumps it to a string, and computes a SHA-256 hash.

### Dependencies
*   Native Python standard libraries (`hashlib`, `json`, `logging`).
*   It has no external third-party dependencies, making it highly portable.

### Error handling
*   **Safe Extraction:** Heavily utilizes Python's `.get()` dictionary method with safe fallback defaults (e.g., `function.get('Runtime', 'N/A')`). This defensive programming prevents aggressive `KeyError` exceptions when AWS omits optional fields from their API responses.

### Tradeoffs
*   **Monolithic vs. Decentralized:** The decision was made to put all data transformation logic into a single ~1,100 line file rather than scattering it across multiple small parser classes. This makes it slightly monolithic but trades off architectural purity for immediate discoverability (one file to rule them all).

### Known limitations
*   **Basic Heuristics:** The logic used to generate security insights is rudimentary. For example, `normalize_security_group` flags a group as overly permissive by looking strictly for `0.0.0.0/0`. It may not gracefully handle complex IPv6 equivalents or nested security group rule logic.

### Performance considerations
*   **CPU Blocking:** Stringifying and hashing JSON using SHA-256 for thousands of nodes sequentially can cause minor CPU blocking in a single-threaded Python environment. For typical enterprise infrastructure sizes (<10,000 resources), this overhead is negligible, but could become a bottleneck at massive scales.

### Future improvements
*   **Strategy Pattern Refactoring:** Refactor the giant `NormalizationEngine` into a Strategy Pattern registry (similar to how the `CostEngine` is built). Creating a registry of `BaseNormalizer` classes in a `normalizers/` folder would drastically reduce the file size and improve unit testability.
