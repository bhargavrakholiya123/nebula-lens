# 🌌 Gravity Lens (Nebula Lens)

Gravity Lens is a next-generation cloud infrastructure intelligence and cost optimization dashboard. It automatically discovers, visualizes, and monitors your AWS resources, dependencies, and cost progression over time.

---

## 🚀 Key Features

* **Interactive Flow Canvas**: Visualize your cloud architecture topology dynamically (VPCs, Subnets, EC2s, RDS, Lambdas, S3) using React Flow.
* **Infrastructure Timeline**: Scroll through snapshot histories chronologically with detailed monthly cost estimations, service breakdowns, and change lists (additions, deletions, and modifications).
* **Database Explorer**: Direct portal to view and manage raw tables populated by the scanning engine.
* **On-Demand Scans**: Manually queue new AWS account discovery jobs from the frontend dashboard.
* **Smart Data Fallbacks**: Graceful fallback to raw resources tables when normalized cache graphs are missing.
* **Performance Caching**: Fast loading of snapshot histories using memory-level UUID stats caching.

---

## ⚙️ Scan & Normalization Architecture

```mermaid
sequenceDiagram
    participant User as Frontend / UI
    participant Server as FastAPI Backend
    participant Worker as Scan Scheduler / Worker
    participant AWS as AWS Cloud API
    database DB as PostgreSQL / SQLite

    User->>Server: Trigger Scan (Account ID)
    Server->>DB: Insert ScanJob (Status: Pending)
    Server-->>User: Scan Queued successfully
    Note over Worker, DB: Scheduler picks up pending jobs
    Worker->>DB: Fetch pending ScanJobs
    Worker->>AWS: Assume cross-account IAM Role
    Worker->>AWS: Discover Cloud Assets (Boto3 API)
    AWS-->>Worker: Return resource metadata
    Worker->>DB: Save raw Resources & Relationships
    Worker->>DB: Calculate & Save Diff (SnapshotDiff)
    Worker->>Server: Trigger Normalization
    Server->>DB: Process Raw Resources to Normalized Nodes/Edges
    Server->>DB: Save Computed Graph
```

---

## 🛡️ Deep Dive: AWS CloudWatch Integration

AWS CloudWatch is Amazon's native monitoring and observability service. It provides you with data and actionable insights to monitor your applications, respond to system-wide performance changes, and optimize resource utilization.

Here is how CloudWatch works and how it integrates with Gravity Lens:

### 1. Core Concepts of CloudWatch
* **Metrics**: Time-series data representing the performance of your resources (e.g., CPU Utilization of EC2, Database Connections of RDS, Invocation Counts & Errors of Lambda).
* **Alarms**: Watchdog rules that trigger actions (e.g., email notifications or auto-scaling) when a metric crosses a defined threshold.
* **Logs**: Aggregated system, application, and custom log streams (e.g., CloudWatch Logs containing output prints from AWS Lambda functions).
* **Events / EventBridge**: A serverless event bus that helps connect applications together based on real-time changes in AWS resources.

### 2. How Gravity Lens Uses CloudWatch
To make our architecture canvas dynamic (not static), the Gravity Lens backend scan engine queries CloudWatch metrics via the **Boto3 API** (`cloudwatch` client):
* **EC2 Nodes**: We query metrics like `CPUUtilization`, `NetworkIn`, and `NetworkOut` over a 24-hour period to flag under-utilized or idle instances (cost-saving opportunities).
* **Lambda Nodes**: We fetch `Invocations`, `Errors`, and `Duration` metrics to identify broken serverless handlers or highlight hot paths.
* **RDS Nodes**: We check database CPU, storage space (`FreeStorageSpace`), and connections to alert you if a database instance is overloaded.

---

## 🛠️ How to Run Locally

### 1. Prerequisites
Ensure you have the following installed:
* Node.js (v18+)
* Python (3.10+)
* PostgreSQL or SQLite

### 2. Backend Setup
```bash
cd Nebula-lens-2/nebula-lens/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd Nebula-lens-2/nebula-lens
pnpm install
pnpm run dev
```
Open `http://localhost:3000` to view the dashboard!
