# Network Resolution Engine Engineering Notes

### Why this module exists
Many critical dependencies in AWS are implicitly defined through network routing, security group rules, or raw IP addresses (e.g., an Application Load Balancer routing to an ECS container by its private IP, not its ARN). This module exists to infer and map these "hidden" network pathways that the primary resource APIs do not explicitly expose.

### Business purpose
Provides engineers and security teams with the "true" network topology. It highlights how resources actually communicate, uncovering hidden dependencies (e.g., an undocumented CloudFront origin) and unintended network exposures (e.g., open security group ingress).

### Technical purpose
Employs a two-pass architecture (`Pass4NetworkMapper` and `Pass4NetworkTopologyResolver`) to extract network context (VPCs, Subnets, ENIs, Security Groups) from the normalized nodes. It then evaluates a strict set of heuristic rules against this context to generate "inferred" edges, assigning confidence scores based on the strength of the rule.

### Folder structure
Located in the engines directory:
*   `backend/app/engines/pass4_network_mapper.py`
*   `backend/app/engines/pass4_network_resolver.py`

### Classes
*   **`Pass4NetworkMapper`**: A caching layer that builds reverse lookups (e.g., IP address to ENI, ENI to ECS Task ARN). Computed exactly once per run.
*   **`Pass4NetworkTopologyResolver`**: The rule evaluation engine that traverses the mapper to emit edges.

### Functions
*   **`mapper._build()`**: Extracts and indexes global structures (VPCs, ENIs, SG rules) and builds a per-resource context dictionary.
*   **`resolver.run_pass4()`**: The main execution block that evaluates the 6 heuristic rules and yields the finalized list of deduplicated edges.

### Workflow
1.  **Context Mapping:** The `Pass4NetworkMapper` consumes the normalized node list and builds in-memory indexes (e.g., resolving ALB target group metrics into a lookup of IPs/Instance IDs).
2.  **Rule Evaluation:** The `Resolver` runs 6 specific rules against the mapper context:
    *   **Rule 1: SG Ingress Reference** (Confidence 70-85): Connects resources if one Security Group explicitly allows ingress from another.
    *   **Rule 2: ALB Target Group** (Confidence 95): Connects ALBs to their targets. Handles complex resolution mapping raw IPs back to Elastic Network Interfaces (ENIs) to find the target ECS task.
    *   **Rule 3: CloudFront Origin** (Confidence 95): Connects CloudFront to ALBs, API Gateways, or S3 buckets via DNS domain matching.
    *   **Rule 4: VPC Endpoint** (Confidence 80): Connects resources to VPC interface/gateway endpoints.
    *   **Rule 5: Shared Subnet** (Confidence 45): Connects resources that live in the same subnet.
    *   **Rule 6: Same VPC** (Confidence 25): Connects resources that live in the same VPC.
3.  **Circuit Breaking:** For Rules 5 and 6, the engine checks hardcoded threshold limits (`SUBNET_INFERENCE_RESOURCE_LIMIT=20`). If a subnet is too dense, it skips inference to prevent generating a massive "hairball" diagram.
4.  **Deduplication:** The `_has_stronger_edge()` function prevents the engine from drawing a weak "Shared Subnet" edge between two nodes if a stronger "SG Ingress" edge has already been drawn.
5.  **Emission:** Returns the list of calculated edges to the Relationship Engine.

### Inputs
*   `nodes`: A list of all normalized resource dictionaries discovered in the previous passes.

### Outputs
*   A list of edge dictionaries. Each edge includes a `confidence` score (0-100) and an `evidence` array detailing exactly why the edge was drawn (e.g., "ALB arn:aws:... has target registered in target group...").

### Algorithms
*   **IP-to-ARN Resolution:** To map an ALB pointing at an IP address, the mapper builds a global `eni_by_ip` dictionary. The resolver takes the ALB target IP, looks up the associated ENI, and checks the ENI's attachments to find the specific ECS Task ARN.
*   **$O(N^2)$ Edge Culling:** The engine loops through pairs of ARNs for VPC and Subnet inference. The circuit breaker constants explicitly guard against $O(N^2)$ CPU spikes.

### Dependencies
*   No external dependencies. Heavily relies on the schema structure of the normalized nodes, specifically expecting the `vpc` node to carry global data regarding ENIs and Security Group rules.

### Error handling
*   **Silent Skip Pattern:** If an IP cannot be resolved, an ENI is missing, or a target ARN is not found in the node list, the engine skips edge generation silently rather than throwing an exception.

### Tradeoffs
*   **Visual Precision vs. Topological Recall:** The circuit breakers (limit 20 resources) trade off mathematical completeness (Recall) for visual clarity (Precision). By dropping low-confidence edges in highly dense subnets, the resulting visualization remains human-readable.

### Known limitations
*   **VPC Endpoint Ambiguity:** Rule 4 draws an edge from a resource to the VPC Endpoint. It does not definitively resolve which specific downstream S3 bucket or DynamoDB table the resource is communicating with via that endpoint, as that requires analyzing IAM policies/bucket policies, which this engine does not do.

### Performance considerations
*   **Index Pre-computation:** By building the `Pass4NetworkMapper` once up front, the resolver avoids repeated expensive array scans, keeping execution time extremely fast (typically < 100ms even for thousands of resources).

### Future improvements
*   **Cross-Boundary Resolution:** Add logic to evaluate VPC Peering connections and Transit Gateway routing tables to infer network paths between resources in completely different VPCs or AWS Accounts.
