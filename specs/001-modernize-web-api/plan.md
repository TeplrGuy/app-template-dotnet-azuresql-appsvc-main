# Implementation Plan: Modernize Contoso University (React + Node + Terraform)

**Branch**: `001-modernize-web-api` | **Date**: 2026-02-13 | **Spec**: `specs/001-modernize-web-api/spec.md`
**Input**: Feature specification from `/specs/001-modernize-web-api/spec.md`

## Summary

Modernize the current .NET 6 Contoso University experience into a React + TypeScript frontend and a Node.js (TypeScript) backend while keeping the existing SQL (Azure SQL / SQL Server) data model and core workflows (Students, Courses, Enrollments, Instructors, Departments).

In parallel, migrate IaC from Bicep to Terraform and overhaul CI/CD into a container-first, security-gated pipeline: pre-code quality gates (secrets scanning, SAST, SCA), build and test (unit/integration + Playwright E2E), push images to ACR, post-build/container scanning, then staged deployments with smoke tests, DAST, and optional manual approvals.

Finally, introduce an AI-assisted “triage and propose remediation” workflow using GitHub Copilot SDK + GitHub Agentic Workflows (read-only by default; any write action must be explicit, minimal, and auditable).

## Technical Context

**Language/Version**: TypeScript (latest stable) on Node.js 20 LTS; React (latest stable) + TypeScript
**Primary Dependencies**:
- Frontend: Vite, React Router, TanStack Query (data fetching/cache), MUI (design system), Playwright (E2E)
- Backend: NestJS (or lightweight Fastify/Express if Nest is too heavy), Zod/class-validator (request validation), Prisma (SQL Server) or Sequelize (alternative), OpenAPI generation
- CI/CD: GitHub Actions, Docker Buildx, Terraform (AzureRM), security scanners (Snyk/Wiz/SonarQube as configured)
- AI: GitHub Copilot SDK (Node) and GitHub Agentic Workflows technical preview
**Storage**: Azure SQL Database (SQL Server protocol); local dev uses SQL Server (local container) or a developer Azure SQL DB
**Testing**: Frontend unit (Vitest) + component tests (optional); backend unit/integration (Jest + Supertest); E2E & smoke tests (Playwright); load testing (Azure Load Testing)
**Target Platform**: Azure App Service for Containers + Azure Container Registry + Azure SQL
**Project Type**: Web application (separate frontend and backend)
**Performance Goals**: p95 page navigation < 2s for core views under expected demo load; p95 API < 500ms for list/read endpoints (excluding cold start)
**Constraints**: secure-by-default (no secrets in repo), staged promotion, container scanning, minimal auto-remediation blast radius, preserve existing core data semantics
**Scale/Scope**: demo/reference implementation; focus on core endpoints and pipelines, not feature-complete parity with every legacy page

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Tests updated/added where behavior changes; existing `.NET` tests continue to run until the legacy stack is retired; new Node/React tests added for new code.
- No secrets committed; use GitHub OIDC + Azure federated credentials, Key Vault, and managed identity where applicable.
- Observability considered by default (structured logs, basic request tracing, health checks) for new critical paths.
- UX remains consistent, modern, and responsive for any user-facing change (design system + responsive layouts).
- Resilience patterns applied for transient dependencies (SQL retries/timeouts, circuit-breakers where appropriate).

## Project Structure

### Documentation (this feature)

```text
specs/001-modernize-web-api/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI, schemas)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# Existing (legacy) .NET solution remains during migration
src/
├── ContosoUniversity.WebApplication/
├── ContosoUniversity.API/
├── ContosoUniversity.Data/
└── ContosoUniversity.Test/

# New (modernized) apps (to be created during implementation)
backend/
├── src/
├── test/
└── Dockerfile

frontend/
├── src/
├── test/
└── Dockerfile

# Infrastructure
infra/
└── terraform/

# CI/CD
.github/
└── workflows/

# Performance testing
loadtests/
```

**Structure Decision**: Use a “web application” split (`frontend/` + `backend/`) so UI and API can iterate independently, be containerized separately, and be gated/tested independently. Keep the existing `src/` .NET solution in place until the new stack reaches functional parity for the core workflows.

## Complexity Tracking

No constitution violations required for this plan.
