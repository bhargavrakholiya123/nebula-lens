# Missing Documentation Analysis for New Engineers

## Overview

While the repository has an impressive collection of deep-dive engineering notes in `docs/internal/`, there are several critical operational and lifecycle topics that are entirely undocumented. A new senior engineer joining this project would face immediate friction in these areas.

Here is a ranked analysis of every topic that still lacks sufficient documentation, prioritized by importance for onboarding and operational safety.

## Known Issues / TODOs

### 1. Security & IAM Permission Policies (Critical)
*   **The Gap**: The orchestrator relies on `aws_service._get_temp_credentials(role_arn)` to assume a role via STS and perform cross-account discovery. However, there is no documentation on what exact IAM Trust Policies and AWS Managed/Inline Policies are required on the target account for this to work. 
*   **Why it's important**: If a customer asks "what permissions do you need to scan my account?", the engineer has no document to provide. Missing a read permission will silently break a scanner (due to the `Normalizer` swallowing errors).
*   **What needs to be written**: A comprehensive JSON template of the exact AWS IAM Policy required by the scanners.

### 2. Deployment & CI/CD Strategy (Critical)
*   **The Gap**: The `project-inventory.md` explicitly states: *"Frontend deployment configuration is UNKNOWN"*. There is no documentation on how the Next.js app and the FastAPI backend are deployed to production.
*   **Why it's important**: A new engineer wouldn't know how to deploy a hotfix. Is the backend hosted on ECS? EC2? Is the frontend on Vercel? Are there GitHub Actions for CI/CD?
*   **What needs to be written**: A complete deployment runbook detailing the production topology, secrets management, and build pipelines.

### 3. End-to-End Testing & QA (High)
*   **The Gap**: There are zero notes regarding testing (`testing-notes.md` does not exist).
*   **Why it's important**: A senior engineer needs to understand how to confidently refactor code. Are there Pytest unit tests for the complex `Normalizer`? Are there Jest/Playwright tests for the frontend React Flow canvas? How is the database mocked during tests?
*   **What needs to be written**: A guide on running the test suite, mocking Boto3/AWS APIs, and writing end-to-end tests for the discovery pipeline.

### 4. End-to-End "Add a Service" Guide (High)
*   **The Gap**: While individual engines (Cost, Normalization, Snapshot) are well-documented individually, there is no holistic guide connecting them.
*   **Why it's important**: As identified in the ADRs, adding a new service (e.g., `Route53`) is dangerously fragmented. An engineer must update the scanner, the normalizer, register the cost engine, update the `PASS_2_RULES` matrix, AND remember to add it to the hardcoded `SUPPORTED_SERVICES` whitelist in `graph.py`.
*   **What needs to be written**: A checklist-style tutorial: "How to add a new AWS service to Nebula Lens from backend to frontend."

### 5. Local Environment & Configuration (Medium)
*   **The Gap**: `project-inventory.md` mentions `.env` and `docker-compose.yml`, but lacks a step-by-step setup guide.
*   **Why it's important**: How does a new dev spin up the local PostgreSQL database? Which specific AWS environment variables (`AWS_PROFILE`, `AWS_REGION`) must be set locally to allow Boto3 to function in development?
*   **What needs to be written**: A clear `DEVELOPER_SETUP.md` explaining environment variables, Docker setup, database migrations (`alembic`), and running the stack locally.

### 6. Glossary & Domain Terminology (Medium)
*   **The Gap**: The codebase uses highly specific domain terms that are not defined.
*   **Why it's important**: A new engineer will encounter UI terms like "Smart Defibrillator", "Ghost Groups", or "Time Travel", and backend terms like `pass4_network_resolver` vs `relationship_engine`. 
*   **What needs to be written**: A central glossary defining these abstractions so backend and frontend teams share the same ubiquitous language.

### 7. Logging & Monitoring (Low)
*   **The Gap**: The codebase uses Python's standard `logging` library (`logger.error()`), but there is no documentation on where these logs are aggregated.
*   **Why it's important**: When a background `ScanJob` fails in production, an engineer needs to know where to find the stack trace (e.g., Datadog, CloudWatch, ELK stack).
*   **What needs to be written**: An operational guide to querying application logs and setting up alerting for failing background jobs.
