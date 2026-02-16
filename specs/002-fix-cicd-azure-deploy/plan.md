# Implementation Plan: Fix CI/CD Pipeline and Azure Deployment

**Branch**: `002-fix-cicd-azure-deploy` | **Date**: 2026-02-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/002-fix-cicd-azure-deploy/spec.md`

## Summary

Fix the GitHub Actions CI/CD pipeline and Terraform infrastructure to enable end-to-end deployment of the modernized Contoso University application (React frontend + NestJS backend) to Azure. This includes: validating/hardening all Terraform modules (ACR, SQL, App Service, Monitoring), ensuring CD workflows deploy containers correctly, integrating GitHub Agentic Workflows (gh-aw) for CI failure triage, and verifying all application pages render without errors in deployed and local environments.

Most infrastructure code and workflow files already exist from prior work (feature 001). This plan focuses on **validation, hardening, gap-filling, and end-to-end verification** rather than greenfield implementation.

## Technical Context

**Language/Version**: HCL (Terraform >= 1.5), YAML (GitHub Actions), TypeScript (Node 20 LTS)  
**Primary Dependencies**: azurerm provider >= 3.0, GitHub Actions, Docker, gh-aw CLI  
**Storage**: Azure SQL (Prisma sqlserver provider), Azure Storage (Terraform remote state)  
**Testing**: Playwright (smoke/e2e), Terraform validate/plan, Docker build verification  
**Target Platform**: Azure App Service for Linux Containers (ubuntu-latest runners in CI)  
**Project Type**: Web application (frontend + backend + IaC)  
**Performance Goals**: CD pipeline < 15 min end-to-end, Terraform idempotent on re-run  
**Constraints**: OIDC auth (no stored secrets), AAD-only SQL auth, managed identity for ACR pull  
**Scale/Scope**: 2 environments (staging + prod), 4 Terraform modules, 8+ GitHub workflows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **Reliability & Resilience** | ✅ PASS | CD workflows include health checks post-deploy; Terraform uses remote state with locking; backend has retry/fallback patterns |
| **Test & Code Quality Gates** | ✅ PASS | CI pipeline runs lint, unit tests, e2e, security scans; CD runs smoke tests + optional DAST |
| **UX Consistency** | ✅ PASS | SPA routing via nginx.conf; all pages verified in US4; no UI changes in this feature |
| **Observability** | ✅ PASS | App Insights + Log Analytics provisioned by Terraform; connection string injected into backend |
| **Secure-by-Default** | ✅ PASS | OIDC auth, AAD-only SQL, managed identity ACR pull, no hardcoded secrets, Gitleaks/CodeQL/Trivy in CI |

No violations. All gates pass.

### Post-Phase 1 Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **Reliability & Resilience** | ✅ PASS | Data model shows health checks on both apps; Terraform state locking via Azure Storage lease; CD pipelines have retry on health checks |
| **Test & Code Quality Gates** | ✅ PASS | CI pipeline contract covers SAST, SCA, secret scanning, e2e; CD contract includes smoke tests + optional DAST |
| **UX Consistency** | ✅ PASS | No UI changes; nginx SPA routing documented in data model; deep link testing included in todos |
| **Observability** | ✅ PASS | Application Insights entity in data model; connection string wired to backend app_settings |
| **Secure-by-Default** | ✅ PASS | OIDC only, AAD-only SQL auth, managed identity ACR pull — all documented in contracts |

No violations after design phase. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/002-fix-cicd-azure-deploy/
├── plan.md              # This file
├── research.md          # Phase 0 output — gap analysis and decisions
├── data-model.md        # Phase 1 output — Terraform resource model
├── quickstart.md        # Phase 1 output — deployment quickstart guide
├── contracts/           # Phase 1 output — workflow interface contracts
│   └── cd-pipeline.yaml # CD pipeline interface specification
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
infra/terraform/
├── modules/
│   ├── acr/             # Azure Container Registry
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── sql/             # Azure SQL Server + Database
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── appservice/      # Linux App Service (backend + frontend)
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── monitoring/      # Log Analytics + App Insights
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── envs/
│   ├── staging/
│   │   ├── main.tf      # Staging composition
│   │   └── variables.tf
│   └── prod/
│       ├── main.tf      # Production composition
│       └── variables.tf
├── main.tf              # (Legacy — may need cleanup)
├── variables.tf
└── outputs.tf

.github/workflows/
├── ci.yml                         # Basic CI (lint, test, build)
├── ci-build-test.yml              # Extended CI + Playwright e2e
├── ci-quality-gates.yml           # Security gates (Gitleaks, CodeQL, npm audit, Trivy)
├── ci-container-publish.yml       # Docker build + scan + ACR push
├── cd-staging.yml                 # Deploy to staging
├── cd-prod.yml                    # Deploy to production
├── ci-failure-doctor.md           # gh-aw agentic workflow
├── ci-failure-doctor.lock.yml     # Compiled gh-aw lock
└── ci-triage.yml                  # Node.js triage tool

frontend/
├── Dockerfile                     # Multi-stage: node build → nginx
├── nginx.conf                     # SPA routing, gzip, health
└── ...

backend/
├── Dockerfile                     # Multi-stage: node build → node runner
└── ...
```

**Structure Decision**: Web application with separate frontend/backend plus IaC in `infra/terraform/`. All infrastructure modules are modularized. CI/CD workflows are in `.github/workflows/`. This structure is already established from feature 001.

## Implementation Status

**Completed**: 2026-02-16 | **All 42 tasks done** (T001–T042)

### Phase Results

| Phase | Tasks | Status | Key Outcomes |
|-------|-------|--------|-------------|
| 1: Setup | T001–T006 | ✅ Done | All TF modules validate, both Docker images build and run |
| 2: Foundational | T007–T010 | ✅ Done | All 13 YAML workflows valid, cross-refs match, scripts verified |
| 3: US1 (Deployment) | T011–T021 | ✅ Done | CD hardened, health checks fail pipeline, manual approval documented |
| 4: US2 (CI Pipeline) | T022–T026 | ✅ Done | All CI workflows reviewed, permissions correct |
| 5: US3 (gh-aw) | T027–T030 | ✅ Done | Agentic workflow verified, no conflicts with Node.js triage |
| 6: US4 (Pages) | T031–T037 | ✅ Done | All pages render, SPA routing works, 7 Playwright tests pass |
| 7: Polish | T038–T042 | ✅ Done | Docs finalized, contracts match, e2e validation passed |

### Changes Made During Implementation

1. **cd-staging.yml / cd-prod.yml**: Health check steps hardened — `|| echo "not ready"` → proper curl failure (pipeline now fails on health check failure)
2. **Legacy TF files**: Deprecation comments added to `infra/terraform/main.tf`, `variables.tf`, `outputs.tf`
3. **quickstart.md**: Manual Approval Gate section added
4. **ci-triage.yml**: Manual dispatch job filled in (was a placeholder stub)
5. **Dockerignore files**: Added `.git` to `frontend/.dockerignore` and `backend/.dockerignore`

### Deviations from Plan

None — all tasks completed as specified. No blockers encountered.
