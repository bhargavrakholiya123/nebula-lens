# Cost Engine Engineering Notes

### Why this module exists
To calculate the estimated daily, monthly, and yearly costs of discovered AWS resources so that users can visualize financial impacts directly on their architecture diagrams.

### Business purpose
Provides FinOps insights natively within the topology map. It allows users to see not just *what* is running, but *how much* it costs, helping engineers and managers visually identify expensive idle resources, over-provisioned infrastructure, or unbalanced architectural designs.

### Technical purpose
Acts as a central dispatcher and registry that maps normalized cloud nodes to their service-specific cost calculators (e.g., mapping an EC2 node to the `EC2CostCalculator`). It orchestrates batch calculations, manages dependency injection (AWS credentials for the Pricing API), and executes multi-pass allocation algorithms (like proportionally distributing VPC overhead costs to subnets).

### Folder structure
Located in the engines directory with a dedicated folder for service-specific strategies:
*   `backend/app/engines/cost_engine.py`: The main registry, dispatcher, and two-pass algorithm orchestrator.
*   `backend/app/engines/costs/`: Folder containing individual service calculators (e.g., `ec2_cost.py`, `lambda_cost.py`, `vpc_cost.py`), all inheriting from a `BaseCostCalculator`.

### Classes
*   **`CostEngine`**: The core dispatcher singleton.
*   **`BaseCostCalculator`** (implied): The abstract base class that all service-specific calculators in the `costs/` directory must inherit from, ensuring a standardized `.calculate()` interface.

### Functions
*   `_register_builtins()`: Loads and registers all supported service calculators on class initialization.
*   `register()`: Allows dynamic registration of new calculators without modifying the core engine (Open-Closed Principle).
*   `calculate()`: Routes a single normalized node to its corresponding registered calculator. Injects AWS credentials into the node payload for live Pricing API calls.
*   `calculate_all()`: The batch processor. Executes the two-pass algorithm across all nodes in a snapshot.
*   `total_cost()`: Utility to sum all monthly costs across a result set.

### Workflow
1.  **Invocation:** The API or Snapshot Engine calls `cost_engine.calculate_all(nodes, metrics_results, region, credentials)`.
2.  **Pass 1 (Direct Costs):** Iterates over all non-subnet nodes, routing them to their specific calculators. The calculators fetch pricing data (via Pricing API or fallback) and calculate their individual monthly costs based on configuration metrics (e.g., EC2 instance type, EBS volume size). Total VPC costs (like NAT Gateway hourly rates) are aggregated in memory.
3.  **Pass 2 (Proportional Allocation):** Subnets themselves are free in AWS. To visualize cost geographically on the canvas, the engine counts the number of compute nodes (EC2, Lambda, RDS) living inside each subnet. It then allocates the parent VPC's total overhead cost proportionally down to the subnets based on their compute density.
4.  **Return:** Returns a dictionary mapping every resource ARN to a detailed cost payload.

### Inputs
*   `nodes`: List of normalized node dictionaries.
*   `metrics_results`: Output from the Metrics Engine (CPU, memory, storage specifications).
*   `region`: The AWS Region.
*   `credentials`: AWS IAM credentials to pass to the underlying `PricingService` for live rate fetching.

### Outputs
*   A dictionary mapping `resource_arn` to a standardized cost schema:
    ```json
    {
      "source": "pricing-api",
      "confidence": "estimated",
      "billingModel": "on-demand",
      "monthlyCost": 145.20,
      "dailyCost": 4.84,
      "yearlyCost": 1742.40,
      "currency": "USD",
      "lineItems": [...]
    }
    ```

### Algorithms
*   **Proportional Allocation (Subnet Costing):** Identifies how many compute resources exist in Subnet A versus Subnet B. If a VPC costs $100/mo (due to NAT Gateways) and Subnet A has 80% of the VPC's EC2 instances, Subnet A is assigned $80/mo of the VPC cost.

### Dependencies
*   Internal `app.engines.costs.*` modules (the strategy pattern implementations).
*   `PricingService` (Abstracted away from the engine, handles the 3-level fallback: Cache -> AWS Pricing API -> Hardcoded JSON).

### Error handling
*   **Graceful Degradation:** Try/except blocks wrap the `calculator.calculate()` execution. If a specific calculator crashes (e.g., an unmapped instance type), the engine catches the error, logs it, and returns an `_error_result` schema with $0 cost. This prevents a single resource failure from crashing the entire `/api/history` request.
*   **Unsupported Services:** Unregistered services bypass execution and return a safe `_unsupported_result` schema.

### Tradeoffs
*   **Registry Pattern vs. Hardcoding:** Using a class registry requires more boilerplate per service (a new file and class) compared to a massive `if/elif` chain. However, it completely eliminates merge conflicts when multiple developers add new services and enforces strict modularity.
*   **Estimation vs. Actuals:** This engine calculates *estimated* costs based on configuration metrics multiplied by public Pricing API rates. It does not read exact AWS Cost Explorer bills, meaning it cannot natively account for Enterprise Discount Programs (EDP) or precise spot pricing fluctuations.

### Known limitations
*   **Stale Fallbacks:** Heavily relies on the `PricingService` caching and fallback mechanism. If the AWS Pricing API changes its payload format or goes offline, estimations rely entirely on hardcoded fallback JSON files which will drift from reality over time.
*   **Discount Awareness:** Doesn't natively support Savings Plans or Reserved Instance (RI) discounting in its standard calculation flow.

### Performance considerations
*   **Two-Pass Iteration:** The calculation requires iterating the entire node list multiple times and holding mapping dictionaries (`subnet_to_vpc`, `subnet_children`) in memory, scaling linearly `O(n)` with the size of the infrastructure.
*   **API Latency:** Live AWS Pricing API calls are notoriously slow. The engine design heavily implies reliance on the internal `PricingService` cache to keep API responses fast enough for synchronous FastAPI requests.

### Future improvements
*   **Cost Explorer Integration:** Integrate the AWS Cost Explorer API (`ce:GetCostAndUsage`) to pull actual billed amounts instead of relying entirely on Pricing API estimations.
*   **Idle Resource Flagging:** Enhance calculators to detect and flag the cost of unattached or idle resources (e.g., detached EBS volumes, unused Elastic IPs) as a specific "waste" metric in the output payload.
