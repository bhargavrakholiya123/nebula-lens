# Project Inventory

1. **Overall purpose of the project**
Cloud infrastructure intelligence and cost optimization dashboard that automatically discovers, visualizes, and monitors AWS resources, dependencies, and cost progression over time.

2. **Repository structure**
- A monorepo-style structure containing both frontend (`src/`) and backend (`backend/`) codebases, along with comprehensive documentation (`Project-documention/`, `docs/`), utility scripts (`scripts/`), and static assets (`public/`).
- Governed by `pnpm` at the root, with Docker configurations for containerized services.

3. **Main modules**
- **Frontend Dashboard:** React/Next.js application for interactive flow canvas, timeline visualization, and database explorer.
- **Backend API:** FastAPI application providing REST endpoints.
- **Scan Engine / Worker:** Background worker process in the backend for assuming AWS IAM roles and discovering cloud assets via Boto3.
- **Normalization Engine:** Backend process to compute and normalize raw AWS resources into a graph structure for the frontend canvas.

4. **Entry points**
- **Frontend:** Next.js application started via `pnpm dev` or `next start` (mapped in `package.json`). Root UI logic starts in `src/app`.
- **Backend:** FastAPI application started via Uvicorn running `app.main:app` (defined in `backend/app/main.py` and `backend/Dockerfile`).

5. **Major technologies**
- **Frontend:** React 19, Next.js 16, TypeScript, Tailwind CSS, React Flow (`@xyflow/react`), Visx (`@visx`), elkjs, Zustand, Framer Motion.
- **Backend:** Python 3.10+, FastAPI, SQLAlchemy, Alembic, Boto3.

6. **External services**
- **AWS Cloud API:** Interactions via Boto3 for services like CloudWatch, IAM, EC2, RDS, Lambda, and S3.

7. **Frameworks**
- Next.js (Frontend Web Framework)
- FastAPI (Backend API Framework)

8. **Build system**
- **Frontend:** Next.js build pipeline (Turbopack/Webpack), `pnpm` package manager (configured via `pnpm-workspace.yaml`).
- **Backend:** Standard Python `pip` relying on `requirements.txt`.

9. **Deployment configuration**
- `docker-compose.yml` defining the deployment of the PostgreSQL database and the Python backend service.
- `backend/Dockerfile` for the FastAPI backend container.
- Frontend deployment configuration is UNKNOWN (likely relies on native Next.js hosting like Vercel or a custom Node server, but no explicit root Dockerfile for the frontend).

10. **Environment variables**
- **Frontend:** Defined in `.env` at the root.
- **Backend / Docker:** `DATABASE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`.
- **Database:** `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.

11. **Databases**
- PostgreSQL 15 (configured via Docker Compose).
- SQLite (mentioned as a fallback alternative in the README).

12. **APIs**
- Internal REST API served by the FastAPI backend on port `8001` (mapped to `7860` in the container).
- External Boto3 CloudWatch/AWS APIs fetched by the backend.

13. **Background jobs**
- "Scan Scheduler / Worker" for executing asynchronous pending `ScanJobs` against AWS accounts to fetch resource data.

14. **Shared libraries**
- UNKNOWN (No explicit custom shared internal packages defined between frontend and backend. Both operate independently with their respective ecosystem libraries).

15. **Important configuration files**
- `package.json` & `pnpm-workspace.yaml` (Frontend dependencies, scripts, and monorepo rules)
- `docker-compose.yml` (Services orchestration)
- `backend/requirements.txt` (Backend Python dependencies)
- `backend/alembic.ini` (Database migration configurations)
- `tsconfig.json` & `next.config.ts` (Frontend TypeScript and Next.js settings)
- `eslint.config.mjs` & `postcss.config.mjs` (Linting and styling configurations)

---

**Top-Level Folders**

* **`.agents`**
  - **Purpose:** Stores AI agent configuration and skills.
  - **Responsibilities:** Define AI rules, custom prompts, and available toolsets for IDE assistants.
  - **Dependencies:** None.
  - **Major files:** `skills-lock.json`, `AGENTS.md`.
  - **Interaction:** Interacted with by the AI assistant/IDE; transparent to the main application.

* **`backend`**
  - **Purpose:** Core backend API server and AWS cloud resource scanning engine.
  - **Responsibilities:** Expose the REST API, manage database schema migrations, execute background AWS account scans via Boto3, calculate resource diffs, and normalize data into graphs.
  - **Dependencies:** Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL.
  - **Major files:** `app/main.py`, `Dockerfile`, `requirements.txt`, `alembic.ini`, `app/database.py`.
  - **Interaction:** Receives API calls from `src`, reads/writes to the PostgreSQL database, and queries the external AWS Cloud API.

* **`docs`**
  - **Purpose:** Supplementary technical documentation.
  - **Responsibilities:** Keep track of specific algorithm progress, layouts, or developer notes.
  - **Dependencies:** None.
  - **Major files:** `elk-layout-progress.md`.
  - **Interaction:** Read-only for developers.

* **`Project-documention`**
  - **Purpose:** Primary project planning and architecture documentation.
  - **Responsibilities:** House the problem definition, architectural guidelines, timeline planning, and testing guides.
  - **Dependencies:** None.
  - **Major files:** `DOCUMENTATION_INDEX.md`, `PROBLEM_DEFINITION.md`, `README.md`, `TIMELINE_FEATURE_PLANNING.md`.
  - **Interaction:** Read-only for developers and stakeholders.

* **`public`**
  - **Purpose:** Static assets directory for the frontend web application.
  - **Responsibilities:** Serve static files such as images, icons, fonts, and `robots.txt`.
  - **Dependencies:** Next.js.
  - **Major files:** UNKNOWN (Standard public static assets).
  - **Interaction:** Served directly by the Next.js frontend server to client browsers.

* **`scripts`**
  - **Purpose:** Standalone utility scripts.
  - **Responsibilities:** Automate specific maintenance tasks, migrations, or data fixes.
  - **Dependencies:** Node.js.
  - **Major files:** `fix-nodes.js`.
  - **Interaction:** Run manually by developers or via CI/CD pipelines as needed.

* **`src`**
  - **Purpose:** Next.js frontend application source code.
  - **Responsibilities:** Render the user interface, interactive architecture canvas, history timelines, and database explorer. Handle client-side state and data fetching.
  - **Dependencies:** Next.js, React, TailwindCSS, `@xyflow/react`, Zustand.
  - **Major files:** `app/` directory (routes), `components/` (UI components), `store/` (state management), `lib/` (utilities).
  - **Interaction:** Sends HTTP requests to the `backend` API and visualizes the returned normalized graph and historical snapshot data to the user.
