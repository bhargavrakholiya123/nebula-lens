# Internal Documentation

## Purpose
This directory (`docs/internal`) serves as the **Single Source of Truth (SSOT)** and canonical engineering knowledge base for the Nebula Lens project. It is the definitive record of our technical decisions, system architecture, database design, and operational procedures.

## Overview
Anything that dictates how the system is built, maintained, or fundamentally operates must be documented here. Examples include:
- System architecture and infrastructure design
- Database schemas, migrations, and data models
- Internal API contracts and service-to-service communication
- Security protocols, authentication, and authorization models
- Deployment workflows, CI/CD pipelines, and infrastructure-as-code
- Architectural Decision Records (ADRs)

## Workflow

### How Published Docs are Derived
To maintain the Single Source of Truth, all external-facing documentation (`docs/developer` and `docs/business`) must be derived from the contents of this directory. 
- **Developer Docs:** API references and integration guides in `docs/developer` are essentially simplified, task-oriented views of the internal API contracts and system behaviors defined here.
- **Business Docs:** Product requirements in `docs/business` reflect the implemented capabilities documented in the internal architecture.
- **Rule:** Never add a new technical capability to the developer docs without first ensuring the underlying mechanism is fully documented in `docs/internal`.

### Update Workflow
1. **Identify the Change:** Before modifying developer or business docs, identify if the underlying system behavior has changed.
2. **Update Internal First:** Make necessary updates to the relevant files within `docs/internal`.
3. **Sync Derived Docs:** If the change impacts external developers or business stakeholders, update `docs/developer` or `docs/business` to reflect the new internal reality.
4. **Review:** All documentation changes must go through the standard Pull Request review process to ensure accuracy and adherence to the SSOT principle.

## Writing Guidelines
1. **Be Precise and Unambiguous:** Use clear, technical language. Avoid marketing speak.
2. **Context is Key:** Always explain *why* a technical decision was made, not just *what* the decision was. (Use ADRs for major decisions).
3. **Keep it Current:** Code and documentation must be updated in the same pull request. 
4. **Use Visuals:** Leverage the `docs/diagrams` folder for Mermaid charts or architecture diagrams when explaining complex flows.
