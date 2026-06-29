# Nebula Lens Documentation

## Purpose of the Documentation
Welcome to the Nebula Lens documentation repository. The purpose of this documentation is to provide a comprehensive, organized, and easily accessible knowledge base for all aspects of the Nebula Lens project. It serves as the definitive reference for developers, architects, product managers, and business stakeholders, ensuring everyone is aligned on the system's design, functionality, and roadmap.

## Documentation Philosophy & Single Source of Truth
We adhere strictly to the **Single Source of Truth (SSOT)** principle. 
- **Internal Documentation First:** `docs/internal` is the canonical engineering knowledge base. All technical decisions, system architecture, and core logic are documented there first.
- **Derived, Never Independent:** Developer (`docs/developer`) and business (`docs/business`) documentation must be generated or derived from the internal documentation. They should never contain unique foundational knowledge that isn't present in the internal docs. This prevents drift and contradictory information.
- **Living Documents:** Documentation is treated as code. It must evolve with the system. Stale documentation is considered a bug.

## Folder Structure
```text
docs/
├── internal/     # Canonical engineering knowledge base (SSOT)
├── developer/    # Guides, API references, and tutorials for external/frontend developers
├── business/     # Product requirements, user flows, and business logic
└── diagrams/     # Centralized repository for all diagrams (Mermaid, Draw.io, etc.)
```

## Intended Audiences & Reading Paths

### 1. Core Engineers & Architects
- **Start Here:** `docs/internal/README.md`
- **Focus:** System architecture, database schemas, internal APIs, deployment processes, and core technical decisions.

### 2. Frontend/API Developers
- **Start Here:** `docs/developer/README.md` (or relevant index)
- **Focus:** API integration guides, authentication flows, SDK usage, and frontend implementation details.

### 3. Product Managers & Business Stakeholders
- **Start Here:** `docs/business/README.md`
- **Focus:** Product requirements (PRDs), user personas, feature scopes, and high-level workflows.

---
*For guidelines on how to write and contribute to this documentation, please refer to the project's root `CONTRIBUTING.md` file.*
