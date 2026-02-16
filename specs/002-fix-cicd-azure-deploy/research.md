# Phase 0 Research: Fix CI/CD Pipeline and Azure Deployment

This research document captures gap analysis, decisions, and rationale for making the existing CI/CD pipeline and Terraform infrastructure production-ready.

## Context

Most implementation was completed during feature 001. This research focuses on identifying remaining gaps, validating existing work, and documenting decisions for hardening.

---

## R1: Terraform Module Completeness

**Status**: 4 modules exist (ACR, SQL, App Service, Monitoring)

**Gap Analysis**:

| Module | Exists | Validated | Issues Found |
|--------|--------|-----------|--------------|
| `modules/acr/` | ✅ | ✅ `terraform validate` passes | admin_enabled = false (correct) |
| `modules/sql/` | ✅ | ✅ | AAD-only auth, firewall for Azure services |
| `modules/appservice/` | ✅ | ✅ | Linux web apps, dual apps, ACR pull roles |
| `modules/monitoring/` | ✅ | ✅ | Log Analytics + App Insights |

**Decision**: All modules are functionally complete. Minor hardening opportunities exist (diagnostic settings, alerts) but are out-of-scope for this feature.
**Rationale**: Modules provision all resources needed for FR-001. Additional features can be added incrementally.

---

## R2: Terraform Environment Compositions

**Gap Analysis**:

| Environment | State Backend | OIDC Auth | All Modules Wired | Outputs |
|-------------|---------------|-----------|--------------------| --------|
| staging | ✅ azurerm | ✅ via env vars | ✅ ACR + SQL + monitoring + appservice | ✅ 7 outputs |
| prod | ✅ azurerm | ✅ via env vars | ✅ same as staging | ✅ 7 outputs |

**Decision**: Both environment compositions are complete and use `-backend-config` flags for CI flexibility.
**Rationale**: Avoids hardcoding storage account names; supports multiple environments from same Terraform code.

**Known Issue**: The root-level `infra/terraform/main.tf`, `variables.tf`, `outputs.tf` are legacy files from the original Bicep-era scaffolding. They should be cleaned up or removed to avoid confusion.

---

## R3: CD Pipeline Architecture

**Decision**: Separate staging and prod CD workflows, each with: Terraform → Container Deploy → Smoke Tests → Optional DAST.

**Gap Analysis**:

| Step | staging | prod | Notes |
|------|---------|------|-------|
| OIDC login | ✅ | ✅ | Uses `vars.AZURE_CLIENT_ID/TENANT_ID/SUBSCRIPTION_ID` |
| Terraform init | ✅ | ✅ | `-backend-config` for remote state |
| Terraform apply | ✅ | ✅ | `-auto-approve` with vars |
| Container deploy | ✅ | ✅ | `az webapp config container set` |
| Health checks | ✅ | ✅ | curl with retries |
| Smoke tests | ✅ | ✅ | Playwright against deployed URL |
| DAST | ✅ (optional) | ✅ (optional) | OWASP ZAP, gated by `DAST_ENABLED` |
| Manual approval | ❌ Missing | ❌ Missing | User wanted optional manual approval gates |

**Decision**: Add optional manual approval gate between staging smoke tests and prod deployment. This is implemented via GitHub Environments with required reviewers, not custom workflow steps.
**Rationale**: GitHub Environments natively support required reviews; no custom implementation needed. The prod workflow already references the `production` environment which can be configured with protection rules.

---

## R4: CI Pipeline Completeness

**Gap Analysis**:

| Workflow | File | Status | Issues |
|----------|------|--------|--------|
| Basic CI | `ci.yml` | ✅ Working | Runs on PR + push to main |
| Extended CI | `ci-build-test.yml` | ✅ Working | OpenAPI lint, Playwright e2e |
| Quality Gates | `ci-quality-gates.yml` | ✅ Working | Gitleaks, CodeQL, npm audit, Trivy |
| Container Publish | `ci-container-publish.yml` | ✅ Working | Build, Trivy scan, ACR push |
| CI Triage | `ci-triage.yml` | ✅ Present | Node.js-based triage tool |

**Decision**: CI pipeline is complete as-is. All FR-007 through FR-011 requirements are met by existing workflows.
**Rationale**: No new CI workflows needed; existing coverage includes SAST (CodeQL), SCA (npm audit), secret scanning (Gitleaks), container scanning (Trivy), and e2e testing (Playwright).

---

## R5: GitHub Agentic Workflows (gh-aw)

**Decision**: `ci-failure-doctor.md` agentic workflow already exists with compiled `ci-failure-doctor.lock.yml`.
**Implementation Details**:
- Triggers on `workflow_run` completion (failure) or `workflow_dispatch`
- Uses Copilot engine (gpt-4.1)
- Safe-outputs: create-issue, add-comment, noop
- `.gitattributes` configured for linguist-generated lock files

**Gap**: The workflow references `CI - Build & Test (US2)` in its `workflows:` trigger. Need to verify this matches the actual workflow name in `ci-build-test.yml`.

---

## R6: Docker Image Readiness

| Image | Base | Multi-stage | Health Check | SPA Fallback |
|-------|------|------------|--------------|--------------|
| Backend | node:20-alpine | ✅ 3-stage (deps → build → runner) | `/api` endpoint | N/A |
| Frontend | nginx:1.27-alpine | ✅ 2-stage (build → serve) | `/health` endpoint | ✅ nginx.conf |

**Decision**: Both Dockerfiles are production-ready.
**Key Fix Applied**: Backend Dockerfile uses `--ignore-scripts` in runner stage and copies `.prisma`/`@prisma` from deps stage to avoid Prisma postinstall issues.

---

## R7: Application Page Verification

**Decision**: All pages verified in feature 001 US4 implementation:
- ErrorBoundary wraps app for uncaught errors
- NotFoundPage handles 404 routes
- NotificationsProvider gives user feedback
- SPA routing works via nginx.conf `try_files`
- Backend gracefully falls back to seeded data when DB unavailable

**Gap**: Need to verify no console errors appear in currently deployed/local state, particularly after any CI/CD changes.

---

## R8: Required Repository Variables

For the CD pipeline to work, these GitHub repository variables must be configured:

| Variable | Required | Description |
|----------|----------|-------------|
| `AZURE_CLIENT_ID` | ✅ | Service principal / workload identity client ID |
| `AZURE_TENANT_ID` | ✅ | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | ✅ | Azure subscription ID |
| `TF_NAME_PREFIX` | ✅ | Name prefix for all resources (must be globally unique for some resources) |
| `TF_STATE_RESOURCE_GROUP` | ❌ | Resource group for Terraform state storage (defaults to `{prefix}-tfstate-rg`) |
| `TF_STATE_STORAGE_ACCOUNT` | ❌ | Storage account for Terraform state (defaults to `{prefix}tfstate`) |
| `TF_STATE_CONTAINER` | ❌ | Blob container for state (defaults to `tfstate`) |
| `AAD_ADMIN_LOGIN` | ❌ | AAD admin display name for SQL Server (defaults to `sqladmin`) |
| `AAD_ADMIN_OBJECT_ID` | ❌ | AAD admin object ID for SQL Server |
| `AZURE_LOCATION` | ❌ | Azure region (defaults to `eastus2`) |
| `DAST_ENABLED` | ❌ | Enable OWASP ZAP DAST scan (`true`/`false`) |

**Decision**: Document all required variables in quickstart.md. CD workflows already validate required vars and fail early with descriptive messages.

---

## R9: Legacy File Cleanup

**Files to evaluate**:
- `infra/terraform/main.tf` — Root-level main.tf from original scaffolding
- `infra/terraform/variables.tf` — Root-level variables
- `infra/terraform/outputs.tf` — Root-level outputs
- `.github/workflows/infrastructure.yml` — May reference old Bicep deployment
- `.github/workflows/resilience-pipeline.yml` — Legacy .NET pipeline

**Decision**: Keep legacy files but don't modify them in this feature. They reference the original .NET 6 app and Bicep infrastructure. Cleanup is a separate concern.
**Rationale**: Removing legacy files risks breaking references from documentation or other tooling. A dedicated cleanup task is more appropriate.

---

## Alternatives Considered

### Terraform vs Bicep for IaC
- **Chosen**: Terraform (user explicitly requested)
- **Rationale**: Cross-cloud portability, mature module ecosystem, state management
- **Alternative rejected**: Bicep (Azure-only, already existed but user wanted to migrate away)

### CD approach: Terraform-managed container config vs az CLI deploy
- **Chosen**: Hybrid — Terraform provisions infra, `az webapp config container set` deploys images
- **Rationale**: Separates infrastructure lifecycle from deployment lifecycle; container images change frequently while infrastructure is stable
- **Alternative rejected**: Pure Terraform for image deployment (would require Terraform apply on every code push, increasing blast radius)

### gh-aw vs custom Node.js triage
- **Chosen**: Both — gh-aw for AI-powered analysis, Node.js tool for programmatic triage
- **Rationale**: gh-aw provides AI reasoning capabilities; Node.js tool provides deterministic log parsing. They complement each other.
