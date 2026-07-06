# Authentication Module Engineering Notes

### Why this module exists
To secure API access, manage user sessions, and accurately map single-sign-on (SSO) identities to their respective connected AWS accounts and infrastructure topologies.

### Business purpose
Ensures data privacy and tenant isolation. It guarantees that only authorized personnel can view their company's proprietary cloud infrastructure, security vulnerabilities, and exact billing costs.

### Technical purpose
*Note: This module is currently a stub/placeholder in the MVP.*
The intended technical architecture is to delegate identity management to **Auth0**, issue JSON Web Tokens (JWTs) to the frontend client, and strictly validate those JWTs on every FastAPI backend request, mapping the external `auth0_id` to internal relational database records.

### Folder structure
There is no dedicated authentication folder or middleware implemented yet. Authentication intent is currently scattered across data models and router stubs:
*   `backend/app/models/models.py`: Defines the `User` table schemas.
*   `backend/app/routers/aws_accounts.py`: Contains placeholder logic for user association.

### Classes
*   **`User` (Database Model):** Contains a specific `auth0_id` column (String) designed to hold the unique subject identifier (`sub` claim) returned by Auth0.

### Functions (Current Stub State)
*   `connect_aws_account()` (in `aws_accounts.py`): Currently bypasses real authentication by querying for the first user in the database. If none exists, it hardcodes and creates a dummy user: `email="default@gravitylens.com", name="Default User"`.

### Workflow (Planned Architecture)
1.  **Frontend Login:** The user authenticates via an Auth0 Universal Login page on the Next.js frontend.
2.  **Token Issuance:** The frontend receives a short-lived JWT Access Token.
3.  **API Request:** The frontend attaches the JWT as a `Bearer` token in the `Authorization` header of all API calls.
4.  **Backend Validation:** A FastAPI dependency (e.g., `Depends(verify_token)`) intercepts the request, fetches the Auth0 public JWKS keys, verifies the cryptographic signature of the JWT, and extracts the `sub` claim.
5.  **User Resolution:** The backend queries the PostgreSQL `users` table where `auth0_id == sub` to load the active user context.
6.  **Tenant Isolation:** Database queries (e.g., fetching snapshots) are aggressively filtered to ensure the AWS account belongs to the resolved `User`.

### Inputs
*   *(Planned)* HTTP `Authorization` headers containing JWTs.

### Outputs
*   *(Planned)* A resolved `User` object injected into FastAPI router endpoints.

### Algorithms
*   *(Planned)* Standard RS256 cryptographic verification for JWTs against public JWKS endpoints.

### Dependencies
*   None currently installed. Future dependencies will likely include `@auth0/auth0-react` for the frontend and `python-jose` or `PyJWT` for the backend.

### Error handling
*   Currently none. Future implementation will require strict 401 Unauthorized and 403 Forbidden HTTP exception handling.

### Tradeoffs
*   **Speed vs. Security (MVP Phase):** The development team explicitly traded immediate multi-tenant security for rapid prototyping by stubbing out authentication. This allows frictionless local development of the complex graph visualization and cost engines without dealing with token expiration or mock users.

### Known limitations
*   **Completely Unsecured:** The system currently operates in a single-tenant, globally unauthenticated mode. Any client capable of reaching the backend API can view, trigger scans for, or delete the AWS accounts associated with the "Default User."
*   **No Multi-Tenancy:** Because there is no active user context, it is impossible for two different users to connect different AWS accounts to the same backend deployment safely.

### Performance considerations
*   *(Planned)* Once implemented, JWT validation adds computational overhead to every API request. To maintain the <100ms response targets for graph rendering, the Auth0 JWKS (JSON Web Key Set) must be aggressively cached in memory by the FastAPI server, avoiding outbound HTTP requests to Auth0 on every API call.

### Future improvements
1.  Implement the Auth0 React SDK on the frontend for secure login and token management.
2.  Build a strict FastAPI OAuth2/JWT middleware dependency.
3.  Remove the "Default User" creation stub in `aws_accounts.py`.
4.  Refactor all database queries to enforce strict tenant isolation based on the authenticated `User` context.
