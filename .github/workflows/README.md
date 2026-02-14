# Workflows (Modernized Stack)

This folder contains **incremental** CI/CD workflows for the React (frontend) + Node/NestJS (backend) modernization.
The legacy .NET + Bicep pipelines remain in place during the migration.

## CI order (PR)

1. **Quality gates**: `ci-quality-gates.yml`
   - Secret scanning (Gitleaks)
   - SAST (CodeQL for JS/TS)
   - SCA (npm audit + Trivy fs scan)
2. **Build & test**: `ci-build-test.yml`
   - Lint + unit tests + build (backend + frontend)
   - Playwright E2E against local dev server (mocked APIs)

## Container build & publish (main)

- `ci-container-publish.yml`
  - Builds both images (backend + frontend)
  - Scans images with Trivy (CRITICAL)
  - Pushes to ACR **only when configured**

## CD (manual)

- `cd-staging.yml` → Terraform apply + smoke tests (Playwright)
- `cd-prod.yml` → Terraform apply + smoke tests (Playwright)

> Use GitHub **Environments** (`staging`, `production`) to enforce manual approval gates.

## Load testing

- `loadtest.yml` runs `loadtests/config.yaml` via Azure Load Testing.

## Required repository variables

These workflows are OIDC-first (no service principal secret required).

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `TF_NAME_PREFIX` (used by `infra/terraform/envs/*`)
- `AZURE_LOCATION` (optional; defaults to `eastus2` in workflows)

For ACR push:
- `ACR_NAME`
- `ACR_LOGIN_SERVER` (e.g., `myregistry.azurecr.io`)

For load tests:
- `AZURE_LOAD_TEST_RESOURCE`
- `AZURE_RESOURCE_GROUP`

Optional:
- `DAST_ENABLED` (`true`/`false`)
