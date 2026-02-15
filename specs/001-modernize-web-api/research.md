# Phase 0 Research: Modernize Contoso University (React + Node + Terraform)

This research document captures the concrete technology decisions and rationale needed to implement `specs/001-modernize-web-api/spec.md`.

## Guiding Constraints

- Keep the existing SQL (Azure SQL / SQL Server) schema and semantics.
- Prefer “boring” modern defaults: TypeScript, strong validation, generated API docs, container-first delivery.
- Security gates and auditable remediation are first-class.

## Frontend Decision

**Chosen stack**
- React + TypeScript
- Vite for build/dev server
- React Router for routing
- TanStack Query for server-state (caching, retries, invalidation)
- MUI (Material UI) as the design system to enforce consistent UX quickly
- Playwright for E2E and smoke tests

**Rationale**
- Fast iteration and good DX (Vite + React).
- MUI provides accessible, responsive components and a consistent design language without large custom CSS investment.
- TanStack Query reduces bespoke state management while giving caching and resilience behavior.

## Backend Decision

**Chosen stack**
- Node.js 20 LTS + TypeScript
- NestJS (preferred) for structured modules, validation, OpenAPI integration, and testability
- Prisma (preferred) targeting SQL Server, with a clear migration story for schema drift
- Zod or class-validator for request validation (Nest integrates well with class-validator; Zod is an alternative)

**Rationale**
- NestJS is a good fit for a long-lived reference app: clear DI, controllers, validation, and test scaffolding.
- Prisma provides strong typing and an approachable data layer for SQL Server; it also supports generating types for API contracts.

**Alternatives considered**
- Fastify/Express: simpler runtime surface but requires more manual wiring for DI, OpenAPI, and project conventions.
- Sequelize/TypeORM: workable for SQL Server, but generally more foot-guns than Prisma for modern TypeScript projects.

## API Contract Strategy

- Produce an OpenAPI spec (`specs/001-modernize-web-api/contracts/openapi.yaml`) representing the target Node API surface.
- Keep endpoints aligned with the current .NET API shapes where practical to reduce migration friction.

## Containerization + Hosting

- Build separate images for `frontend` and `backend`.
- Deploy to Azure App Service for Containers.
- Push to Azure Container Registry.

## IaC (Terraform) Migration Approach

- Create a new `infra/terraform/` root for Terraform modules and environment compositions.
- Use the AzureRM provider and (where possible) Azure AD workload identity (GitHub OIDC) instead of long-lived secrets.
- Model at minimum:
  - Resource Group
  - ACR
  - App Service Plan + Web Apps (frontend/backend)
  - App settings and connection string wiring
  - Managed identity and RBAC (AcrPull)

## CI/CD Gate Ordering (high level)

1. Secrets scanning
2. SAST (e.g., SonarQube) and policy checks
3. SCA (dependency scanning)
4. Build (container) + unit/integration tests
5. E2E tests (Playwright) where feasible pre-deploy
6. Push image to ACR
7. Container/image scanning
8. Deploy to staging
9. Smoke tests (Playwright)
10. DAST
11. Optional manual approval
12. Deploy to production
13. Smoke tests + monitoring validation

## Copilot SDK + Agentic Workflows Integration

**Goal**: Provide CI failure triage and “propose a minimal fix” suggestions.

**Approach**
- Add an agentic workflow (markdown-defined) triggered on failure that:
  - collects logs/artifacts from failed jobs
  - prompts a Copilot SDK runner to summarize likely root cause + propose minimal change(s)
  - posts a comment/summary back to the workflow run
- Default mode is read-only. Any auto-commit/PR creation must be:
  - explicitly enabled
  - limited to low-risk file types (e.g., config/test updates)
  - auditable (diff + rationale)

## Open Questions

None required to proceed with Phase 1 design. Decisions above are sufficient to generate tasks.

---

## Phase 8 Research: Pipeline Fix, Terraform Completion, and Azure Deployment

*Added 2026-02-15 for CI/CD pipeline fixes, Terraform completion, and end-to-end deployment.*

### R8-1: Azure SQL Terraform Module

**Decision**: Use `azurerm_mssql_server` + `azurerm_mssql_database` with AAD-only auth.
**Rationale**: Matches Prisma `sqlserver` provider; managed identity avoids passwords; MCAPS-compliant.
**Implementation**: Firewall rule for Azure services (0.0.0.0), AAD admin via `azurerm_mssql_server` `azuread_administrator` block.

### R8-2: Linux App Service for Containers

**Decision**: Replace `azurerm_windows_web_app` with `azurerm_linux_web_app` using Docker containers.
**Rationale**: Both Dockerfiles produce Linux images (node:20-alpine, nginx:1.27-alpine).
**Implementation**: Two web apps on shared plan; `application_stack` block for container config; managed identity for ACR pull.

### R8-3: Terraform Remote State

**Decision**: Use `azurerm` backend with Azure Storage.
**Rationale**: Standard for CI/CD; state locking via blob lease; encrypted at rest.
**Implementation**: `-backend-config` flags in CI; key = `{env}.terraform.tfstate`.

### R8-4: CD Container Deployment

**Decision**: Use `az webapp config container set` + `az webapp restart`.
**Rationale**: Simple CLI approach works with OIDC; no extra actions needed.

### R8-5: Frontend SPA Routing

**Decision**: Custom `nginx.conf` with `try_files $uri $uri/ /index.html`.
**Rationale**: React Router client-side routing needs server-side fallback.

### R8-6: GitHub Agentic Workflows

**Decision**: Create `ci-failure-doctor.md` agentic workflow following gh-aw ci-doctor pattern.
**Rationale**: User requested gh-aw integration; complements existing Node.js triage tool with AI-powered analysis.
**Implementation**: Markdown workflow + compiled lock.yml; triggers on CI failure; uses Copilot engine for analysis.
