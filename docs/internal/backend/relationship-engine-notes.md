# Relationship Engine Engineering Notes

### Why this module exists
To connect isolated cloud resources discovered by the scan orchestrator into a connected graph representing the true topology and runtime dependencies of the AWS environment.

### Business purpose
Enables customers to see how their infrastructure components communicate, helping them identify dependencies, optimize costs (e.g., finding orphaned resources), and understand security postures without requiring manual mapping.

### Technical purpose
To infer communication and structural edges between raw AWS resources (nodes) using heuristic rules, active IAM policy evaluation, security group intersection, and metadata configuration, without relying solely on explicit tagging.

### Folder structure
All relevant files reside in `backend/app/engines/`:
*   `relationship_engine.py`: Core rule evaluation, IAM parsing, and edge deduplication.
*   `pass4_network_resolver.py`: Network topology inference (VPC, Subnet, SG, ALB routing).
*   `pass4_network_mapper.py`: Dependency of the network resolver, used for indexing network constraints.

### Classes
*   **`RelationshipRule`** (`relationship_engine.py`): A dataclass defining the schema for static metadata extraction rules (`source_service`, `config_path`, `target_type`, `relationship_type`, `confidence`, `extractor`).
*   **`RelationshipEngine`** (`relationship_engine.py`): The primary singleton engine that coordinates heuristic rules, static config mapping, and IAM parsing.
*   **`Pass4NetworkTopologyResolver`** (`pass4_network_resolver.py`): A singleton engine dedicated to generating edges based on shared network environments and load-balancer routing.

### Functions
*   `RelationshipEngine.discover_relationships(credentials, region_list, nodes)`: The main entry point to initiate edge discovery.
*   `RelationshipEngine._run_pass2_rules()`: Executes the static list of `PASS_2_RULES` using dynamic JSON path evaluation.
*   `RelationshipEngine._evaluate_path()`: Safely traverses nested resource metric dictionaries to extract target IDs or ARNs.
*   `RelationshipEngine._run_extractor()`: Matches extracted text values (ARNs, IDs, domain names, URLs) to actual known node IDs.
*   `RelationshipEngine._iam_allowed()` & `_parse_policy()`: Resolves AWS IAM API queries to identify `Allow` statements for S3, SQS, RDS, and DynamoDB.
*   `Pass4NetworkTopologyResolver.run_pass4()`: Evaluates VPC, Subnet, and Security Group configurations to infer network connectivity.

### Workflow
1.  **Index Nodes:** Filters out hierarchy container nodes (VPC, Subnet) from direct edge endpoints and indexes the rest by ARN and service.
2.  **Deterministic Mapping (Confidence 100):** Applies hardcoded traversals for guaranteed connections (e.g., API Gateway → Lambda URIs, SQS → Lambda Event Source Mappings, EventBridge rule targets).
3.  **Config Rules (`PASS_2_RULES`):** Applies static config-based matching for defined patterns (e.g., ALB → Target Groups, ECS → IAM Roles, CloudFront → S3 origins).
4.  **IAM Policy Parsing (Confidence 80):** Calls AWS IAM APIs to resolve role permissions, assigning edges for `writes_to`/`reads_from` patterns based on resource permissions.
5.  **Security Group Overlap (Confidence 70):** Computes Security Group ingress rules across assigned resource ENIs to infer open communication paths.
6.  **Network Inference (`run_pass4`):** Delegates to the `Pass4NetworkTopologyResolver` to infer lower-confidence edges (Shared Subnet, Same VPC).
7.  **Deduplication:** Groups edges by `(source, target, label)`, retaining the highest confidence score, merging evidence arrays, and promoting to the highest priority category (`runtime` > `network` > `inferred` > `iam_permission`).

### Inputs
*   `credentials`: Dictionary of temporary AWS STS credentials used for active IAM lookups.
*   `region_list`: List of strings representing the scanned AWS regions.
*   `nodes`: A list of dictionaries representing the raw, discovered AWS resources from the scan orchestrator.

### Outputs
*   Returns a list of dictionaries representing directional edges. 
*   Edge schema includes: `id`, `source` (ARN), `target` (ARN), `label` (e.g., `invokes`, `writes_to`), `confidence` (0-100), `evidence` (array of reasons), and `category`.

### Algorithms
*   **Rule-Based Extraction:** A pluggable system mapping a JSON `config_path` (e.g., `environment.Variables`) to an `extractor` string (e.g., `env_heuristic`), string-matching URLs/ARNs to the inventory.
*   **IAM Policy Parsing:** Translates nested AWS IAM JSON Policy Documents into sets of explicitly allowed target ARNs, factoring in wildcard (`*`) usage.
*   **Network Intersection:** Graph intersection of Security Group rules (`ipPermissions`) across resource ENIs to map `port` and `sourceGroup` allowances to destination nodes.

### Dependencies
*   Python `boto3` (specifically the `iam` client) for querying Role Profiles, Attached Policies, and Inline Policies.
*   `hashlib` for generating deterministic Edge IDs based on the source, target, and label to prevent duplicates.

### Error handling
*   **Silent Failures:** External IAM lookups in `_iam_allowed` and `_role_from_profile` are wrapped in `try/except` blocks. If an API call fails or access is denied, it logs a warning and returns an empty permission set rather than crashing the pipeline.
*   **Fault Isolation:** Edge deduction is completely isolated; if extraction for one resource fails, the engine continues processing the rest of the list.

### Tradeoffs
*   **Speed vs. Accuracy (IAM):** The engine actively queries the AWS IAM API, which adds latency. This is mitigated by aggressively caching the results per Role ARN to avoid redundant network calls.
*   **Heuristics vs. Certainty:** The engine relies on string matching environment variables (`env_heuristic` extractor) to guess Lambda dependencies. This can yield false positives, which is managed by artificially lowering the confidence score (60) compared to deterministic mappings (100).

### Known limitations
*   **Dense Network Scaling:** Network rules (Shared Subnet, Same VPC) generate `O(N^2)` edges. Circuit breakers (`SUBNET_INFERENCE_RESOURCE_LIMIT = 20`, `VPC_INFERENCE_RESOURCE_LIMIT = 30`) are hardcoded to skip inference entirely if the environment is too dense, resulting in missing low-confidence edges for large networks.
*   **VPC Endpoint Resolution:** The engine currently emits an edge to the VPC Endpoint construct itself, but does not attempt to resolve routing to the final downstream destination node (e.g., the specific S3 bucket).
*   **Cross-Account Mapping:** The engine currently assumes a single-account context and does not natively map relationships spanning multiple AWS accounts.

### Performance considerations
*   **Memory Caching:** The `iam_cache` dictionary (`Dict[str, Dict[str, Set[str]]]`) is heavily utilized during a scan to ensure policies for shared IAM roles (common in Lambda/ECS) are only fetched and parsed once.
*   **Fast Deduplication:** Edge merging runs efficiently using a `(source, target, label)` tuple as a hash map key, avoiding expensive nested loops.

### Future improvements
*   Implement VPC Flow Log analysis or Route Table evaluation for higher-confidence network topology edges.
*   Enhance VPC endpoint mapping to resolve and emit edges directly to the downstream managed service.
*   Expand the `PASS_2_RULES` list to cover more managed services.
