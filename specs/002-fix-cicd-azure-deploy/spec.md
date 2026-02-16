# Feature Specification: Fix CI/CD Pipeline and Azure Deployment

**Feature Branch**: `002-fix-cicd-azure-deploy`  
**Created**: 2026-02-15  
**Status**: Draft  
**Input**: User description: "Fix the GitHub Actions pipeline and the deployment of resources to Azure. Terraform should execute once in the pipeline following best practices. Integrate GitHub Agentic Workflows (gh-aw) for CI failure triage. Ensure all application pages are error-free and everything deploys end-to-end to Azure resources that Terraform creates."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — End-to-end deployment to Azure (Priority: P1)

As a maintainer, I want to run a single pipeline that provisions Azure infrastructure via Terraform and deploys both the frontend and backend containers to the created resources, so that code changes reach a live environment without manual intervention.

**Why this priority**: Deployment is the critical path — without working Azure resources and container deployment, nothing else (smoke tests, DAST, monitoring) can function.

**Independent Test**: A maintainer triggers the CD staging workflow. Terraform provisions all Azure resources (resource group, SQL Server, ACR, App Service, monitoring). Container images are deployed to the App Services. The application loads and serves real pages.

**Acceptance Scenarios**:

1. **Given** a maintainer triggers the staging CD workflow, **When** Terraform runs, **Then** it creates all required Azure resources (resource group, SQL Server + database, ACR, two Linux App Services, Application Insights) in a single apply step.
2. **Given** Terraform completes successfully, **When** the deploy step runs, **Then** backend and frontend containers are deployed to their respective App Services using images from ACR.
3. **Given** containers are deployed, **When** a user visits the frontend URL, **Then** the application loads, all pages render correctly, and the backend API responds to health checks.
4. **Given** Terraform state from a previous run exists, **When** the pipeline runs again with no infrastructure changes, **Then** Terraform detects "no changes" and completes quickly without recreating resources.

---

### User Story 2 — Reliable CI pipeline with quality gates (Priority: P2)

As a maintainer, I want the CI pipeline to run quality gates, build and test both applications, and build container images without errors, so that only validated changes proceed to deployment.

**Why this priority**: A functioning CI pipeline is required before CD can safely promote changes; it prevents regressions and security issues from reaching production.

**Independent Test**: A maintainer pushes a commit or opens a PR. The CI pipeline completes all jobs (lint, test, build, quality gates, container build, Playwright e2e) with clear pass/fail results.

**Acceptance Scenarios**:

1. **Given** a PR is opened, **When** the CI pipeline runs, **Then** quality gates (secret scanning, SAST, SCA), build, tests, and Playwright e2e all execute and report results.
2. **Given** a commit is pushed to main, **When** the container publish workflow runs, **Then** backend and frontend Docker images build successfully, pass Trivy scanning, and (when ACR is configured) push to the registry.
3. **Given** a quality gate detects a critical issue, **When** the pipeline reports results, **Then** the failing gate is clearly identified with actionable feedback.

---

### User Story 3 — AI-assisted CI failure triage via GitHub Agentic Workflows (Priority: P3)

As a maintainer, I want an AI-powered agentic workflow that automatically investigates CI failures and creates actionable issue reports, so that the team can resolve failures faster without manually reading raw logs.

**Why this priority**: Faster triage reduces downtime and developer friction, but requires a working CI pipeline (US2) as a prerequisite.

**Independent Test**: A maintainer triggers a known CI failure. The gh-aw agentic workflow runs, analyzes the failure, and creates a GitHub issue with root cause analysis and suggested remediation.

**Acceptance Scenarios**:

1. **Given** a CI workflow completes with a failure, **When** the agentic workflow triggers, **Then** it retrieves failed job logs, identifies the root cause category (build error, test failure, security gate, infrastructure), and creates a GitHub issue with analysis.
2. **Given** the agentic workflow produces a report, **When** a maintainer reads it, **Then** the report includes: failed jobs, key error messages, root cause category, and specific remediation steps.
3. **Given** a CI workflow succeeds, **When** the agentic workflow evaluates the event, **Then** it takes no action (no false-positive issues created).

---

### User Story 4 — Error-free application pages (Priority: P4)

As a user, I want all application pages (Home, Students, Courses, Teachers, Create Student, Student Details, 404) to render correctly without console errors or broken layouts, so that the demo experience is polished.

**Why this priority**: Application correctness is essential for demo readiness and user trust, but depends on the application being deployed (US1).

**Independent Test**: A tester visits each page in the deployed application and in a local development environment. All pages render, respond to interactions, and produce no console errors.

**Acceptance Scenarios**:

1. **Given** a user navigates to any application page, **When** the page loads, **Then** it renders completely with no JavaScript errors in the console.
2. **Given** a user navigates to a non-existent route, **When** the page loads, **Then** a friendly "Page Not Found" page appears with navigation back to the homepage.
3. **Given** the frontend is deployed as a container, **When** a user directly accesses a deep link (e.g., /students/1), **Then** the page loads correctly (SPA routing fallback works).

---

### Edge Cases

- What happens when Terraform state storage is not pre-provisioned? The pipeline should fail with a clear error message explaining what to configure.
- What happens when ACR credentials are not configured? Container images should still build and scan locally; push is skipped with a clear skip message.
- What happens when the SQL Server AAD admin object ID is not provided? Terraform should still plan successfully but fail at apply with a descriptive error.
- What happens when a deployment succeeds but smoke tests fail? The pipeline should report the failure clearly without rolling back infrastructure (infrastructure and deployment are separate concerns).
- What happens when the gh-aw agentic workflow encounters an API rate limit? The workflow should fail gracefully with a retry suggestion.

## Requirements *(mandatory)*

### Functional Requirements

#### Infrastructure & Deployment

- **FR-001**: The pipeline MUST provision all Azure resources (resource group, SQL Server + database, ACR, Linux App Service Plan, two Linux Web Apps, Log Analytics, Application Insights) using Terraform in a single apply step.
- **FR-002**: Terraform MUST use a remote state backend (Azure Storage) so that state persists across pipeline runs and concurrent runs are safely locked.
- **FR-003**: Terraform MUST use OIDC authentication (workload identity federation) — no long-lived secrets stored in the repository.
- **FR-004**: The pipeline MUST deploy backend and frontend container images to their respective Azure Linux Web Apps using images from ACR.
- **FR-005**: Deployed Web Apps MUST use managed identity for ACR image pull (no admin credentials).
- **FR-006**: The pipeline MUST verify application health after deployment (HTTP health check on both frontend and backend).

#### CI Pipeline

- **FR-007**: The CI pipeline MUST run quality gates (secret scanning, SAST, SCA, filesystem scanning) before build and test steps.
- **FR-008**: The CI pipeline MUST build and test both backend and frontend applications (lint, unit tests, build).
- **FR-009**: The CI pipeline MUST run Playwright e2e tests after frontend build.
- **FR-010**: The container publish workflow MUST build Docker images, scan with Trivy, and push to ACR when configured.
- **FR-011**: All CI workflow YAML files MUST be syntactically valid and produce no GitHub Actions parsing errors.

#### Agentic Workflows

- **FR-012**: The repository MUST include a GitHub Agentic Workflow (gh-aw) markdown file that triggers on CI failure.
- **FR-013**: The agentic workflow MUST analyze failed job logs and produce an actionable issue report.
- **FR-014**: The agentic workflow MUST NOT create issues for successful CI runs.

#### Application Quality

- **FR-015**: All application pages MUST render without JavaScript console errors.
- **FR-016**: The frontend container MUST support SPA routing (deep links resolve to index.html).
- **FR-017**: The backend container MUST start and respond to API requests without a database connection (graceful fallback with seeded data).

### Assumptions

- Terraform state storage (Azure Storage Account with a container named "tfstate") is pre-provisioned before the first pipeline run. The pipeline documents required repository variables.
- OIDC federated credentials are configured for the GitHub Actions workflow identity in Azure AD.
- The existing application code (React frontend, NestJS backend) is functionally correct; this feature focuses on pipeline and deployment fixes, not application logic changes.
- GitHub Agentic Workflows (gh-aw) CLI extension is available in the GitHub Actions runner environment.

### Key Entities

- **Pipeline Run**: An execution of a GitHub Actions workflow that validates, builds, and delivers changes.
- **Terraform State**: Persistent record of Azure resource mappings, stored in Azure Blob Storage.
- **Container Image**: A Docker image for backend (Node.js) or frontend (nginx) published to ACR.
- **Azure Resource Group**: The logical container for all Azure resources in a given environment.
- **App Service**: A Linux Web App for Containers hosting either the backend API or frontend SPA.
- **Agentic Workflow**: A gh-aw markdown-defined AI workflow that analyzes CI failures and produces reports.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A maintainer can deploy the complete application stack to Azure by triggering a single workflow dispatch, with all resources created and containers running within 15 minutes.
- **SC-002**: Terraform executes idempotently — running the pipeline twice with no code changes produces "no changes" on the second run.
- **SC-003**: All CI workflow files parse and execute without GitHub Actions syntax errors.
- **SC-004**: Both Docker images (backend and frontend) build successfully in the CI pipeline and pass security scanning.
- **SC-005**: After deployment, all application pages load without errors and the SPA routing handles deep links correctly.
- **SC-006**: When a CI workflow fails, the agentic workflow creates an issue with root cause analysis within 10 minutes.
- **SC-007**: The deployed application's frontend and backend respond to health checks with HTTP 200 status codes.
