# Tasks: Fix CI/CD Pipeline and Azure Deployment

**Input**: Design documents from `specs/002-fix-cicd-azure-deploy/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cd-pipeline.yaml, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Validate existing Terraform modules, establish baseline, ensure tooling works

- [x] T001 Run `terraform validate` on all 4 modules (acr, sql, appservice, monitoring) under `infra/terraform/modules/` and fix any validation errors
- [x] T002 [P] Run `terraform validate` on staging composition at `infra/terraform/envs/staging/main.tf` and fix any errors
- [x] T003 [P] Run `terraform validate` on production composition at `infra/terraform/envs/prod/main.tf` and fix any errors
- [x] T004 [P] Evaluate legacy root-level files `infra/terraform/main.tf`, `infra/terraform/variables.tf`, `infra/terraform/outputs.tf` — add deprecation comments or remove if they conflict with env compositions
- [x] T005 Build backend Docker image from `backend/Dockerfile` and verify it starts (responds on port 3000 at `/api`)
- [x] T006 [P] Build frontend Docker image from `frontend/Dockerfile` and verify it starts (responds on port 80 at `/health` and serves SPA)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Fix cross-cutting issues that block all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Verify all GitHub Actions workflow YAML files under `.github/workflows/` parse correctly — run a YAML lint or syntax check on all `.yml` files and fix any errors found
- [x] T008 Verify cross-references between workflows: confirm `ci-failure-doctor.md` trigger `workflows: ["CI - Build & Test (US2)"]` matches the actual name in `.github/workflows/ci-build-test.yml`
- [x] T009 [P] Verify `frontend/package.json` has the `e2e` script command that `cd-staging.yml` smoke-tests step invokes (`npm run e2e`)
- [x] T010 [P] Verify `backend/package.json` has all required scripts: `lint`, `test`, `build`, `start:dev` that CI workflows invoke

**Checkpoint**: All Terraform validates, Docker images build, workflow YAML is valid, cross-references are correct

---

## Phase 3: User Story 1 — End-to-end deployment to Azure (Priority: P1) 🎯 MVP

**Goal**: A single pipeline run provisions all Azure resources via Terraform and deploys both containers to App Service

**Independent Test**: Trigger `cd-staging.yml` workflow dispatch → Terraform provisions resources → containers deploy → health checks pass → app loads in browser

### Implementation for User Story 1

- [x] T011 [US1] Review and harden `infra/terraform/envs/staging/main.tf` — ensure Terraform backend block uses `-backend-config` correctly, all module references are wired (ACR, SQL, monitoring, appservice), and outputs match what `cd-staging.yml` reads (resource_group_name, acr_login_server, backend_app_name, frontend_app_name, backend_default_hostname, frontend_default_hostname, sql_server_fqdn)
- [x] T012 [P] [US1] Review and harden `infra/terraform/envs/prod/main.tf` — same checks as T011 for production environment, verify state key is `prod.terraform.tfstate`
- [x] T013 [US1] Review `infra/terraform/modules/appservice/main.tf` — verify `azurerm_linux_web_app` resources have correct `application_stack` container config, `app_settings` include SQLSERVER_CONNECTION_STRING and APPLICATIONINSIGHTS_CONNECTION_STRING, and `azurerm_role_assignment` grants AcrPull to both web app managed identities
- [x] T014 [P] [US1] Review `infra/terraform/modules/sql/main.tf` — verify `azurerm_mssql_server` has `azuread_administrator` block with `azuread_authentication_only = true`, and `azurerm_mssql_firewall_rule` allows Azure services (0.0.0.0)
- [x] T015 [P] [US1] Review `infra/terraform/modules/acr/main.tf` — verify `admin_enabled = false` and outputs include `id` and `login_server`
- [x] T016 [P] [US1] Review `infra/terraform/modules/monitoring/main.tf` — verify `azurerm_application_insights` outputs `connection_string` and is wired to `azurerm_log_analytics_workspace`
- [x] T017 [US1] Review and harden `.github/workflows/cd-staging.yml` — verify: (a) required vars validation step catches all 4 required vars, (b) OIDC login uses `azure/login@v2`, (c) Terraform runs exactly once (init + apply, no redundant plan), (d) `az webapp config container set` uses correct ACR image path, (e) health check curl commands fail the pipeline on error (not just echo warning)
- [x] T018 [US1] Harden health check step in `.github/workflows/cd-staging.yml` — change `|| echo "not ready yet"` to `|| exit 1` so failed health checks fail the pipeline (FR-006)
- [x] T019 [P] [US1] Review and harden `.github/workflows/cd-prod.yml` — same checks as T017/T018 for production, verify it uses `production` environment for optional manual approval gate
- [x] T020 [US1] Verify Terraform idempotency — confirm that running `terraform plan` with no changes produces "No changes" output (SC-002). Check for any resources with `create_before_destroy` or `ignore_changes` that might cause unnecessary recreation
- [x] T021 [US1] Add documentation for manual approval gate in `specs/002-fix-cicd-azure-deploy/quickstart.md` — explain how to configure GitHub Environment protection rules (required reviewers) on the `production` environment for optional approval between staging and prod

**Checkpoint**: CD staging and prod workflows are hardened. Terraform provisions all resources in single apply. Containers deploy. Health checks fail pipeline on error. Idempotent re-runs work.

---

## Phase 4: User Story 2 — Reliable CI pipeline with quality gates (Priority: P2)

**Goal**: CI pipeline runs quality gates, builds, tests, and container publish without errors on every PR/push

**Independent Test**: Push a commit or open a PR → CI workflows run → all jobs pass (lint, test, build, quality gates, Playwright e2e, container build)

### Implementation for User Story 2

- [x] T022 [US2] Review `.github/workflows/ci.yml` — verify it runs on `pull_request` and `push` to `main`, builds both backend and frontend with `npm ci && npm run lint && npm test && npm run build`
- [x] T023 [P] [US2] Review `.github/workflows/ci-quality-gates.yml` — verify: (a) Gitleaks runs for secret scanning, (b) CodeQL runs for SAST with `javascript-typescript` language, (c) npm audit runs on both backend and frontend, (d) Trivy filesystem scan runs for CRITICAL severity. Fix any issues.
- [x] T024 [P] [US2] Review `.github/workflows/ci-build-test.yml` — verify: (a) OpenAPI lint step works, (b) Playwright e2e tests run after frontend build, (c) Playwright install step uses `npx playwright install --with-deps`. Fix any issues.
- [x] T025 [US2] Review `.github/workflows/ci-container-publish.yml` — verify: (a) Docker builds for both backend and frontend succeed, (b) Trivy image scan runs before ACR push, (c) ACR push is conditional on ACR credentials being configured (skip gracefully if not set), (d) push trigger is on `main` branch and tags
- [x] T026 [US2] Verify all CI workflows have correct `permissions` blocks — `contents: read` minimum, `security-events: write` for CodeQL, `id-token: write` only where OIDC needed. Fix any over-permissioned workflows.

**Checkpoint**: All CI workflows parse without errors, run required gates, and handle missing credentials gracefully.

---

## Phase 5: User Story 3 — AI-assisted CI failure triage via gh-aw (Priority: P3)

**Goal**: gh-aw agentic workflow triggers on CI failure, analyzes logs, and creates actionable GitHub issues

**Independent Test**: A CI workflow fails → `ci-failure-doctor.md` agentic workflow triggers → GitHub issue is created with root cause analysis and remediation steps

### Implementation for User Story 3

- [x] T027 [US3] Review `.github/workflows/ci-failure-doctor.md` — verify: (a) `on.workflow_run.workflows` matches actual CI workflow name `CI - Build & Test (US2)`, (b) trigger condition checks `conclusion == 'failure'`, (c) `noop` is called for successful runs (FR-014), (d) `safe-outputs` include `create-issue` with correct labels
- [x] T028 [P] [US3] Review `.github/workflows/ci-failure-doctor.lock.yml` — verify it is a valid compiled gh-aw lock file, references correct trigger workflow, and has required permissions (actions:read, contents:read, issues:read/write, pull-requests:read)
- [x] T029 [P] [US3] Verify `.gitattributes` has entry `.github/workflows/*.lock.yml linguist-generated=true merge=ours` for gh-aw lock files
- [x] T030 [US3] Review `.github/workflows/ci-triage.yml` — verify the Node.js-based triage tool at `scripts/ci-triage/` complements the gh-aw workflow without conflicting (e.g., both shouldn't create duplicate issues for the same failure)

**Checkpoint**: gh-aw agentic workflow is correctly configured, triggers on CI failures only, and creates well-structured issues.

---

## Phase 6: User Story 4 — Error-free application pages (Priority: P4)

**Goal**: All application pages render without console errors, SPA routing works with deep links, backend gracefully falls back without DB

**Independent Test**: Visit all pages (Home, Students, Courses, Teachers, Create Student, 404) locally and in Docker containers. No console errors. Deep links work.

### Implementation for User Story 4

- [x] T031 [US4] Start backend locally (`cd backend && npm run start:dev`) and verify all API endpoints respond: `GET /api`, `GET /api/students`, `GET /api/courses`, `GET /api/instructors`. Confirm seeded data fallback works without a database connection (FR-017)
- [x] T032 [US4] Start frontend locally (`cd frontend && npm run dev`) and visit all pages: Home (`/`), Students (`/students`), Courses (`/courses`), Teachers (`/teachers`), Create Student (`/students/new`), 404 (`/nonexistent`). Check browser console for JavaScript errors (FR-015)
- [x] T033 [US4] Verify `frontend/nginx.conf` SPA routing — build frontend Docker image, start container, access deep links directly (`/students`, `/students/1`, `/courses`) and verify they all resolve to the SPA (FR-016). Check `/health` endpoint returns 200
- [x] T034 [US4] Run existing Playwright e2e tests (`cd frontend && npx playwright test`) to verify all page tests pass
- [x] T035 [P] [US4] Verify `frontend/src/app/ErrorBoundary.tsx` wraps the app and catches uncaught errors gracefully
- [x] T036 [P] [US4] Verify `frontend/src/pages/NotFoundPage.tsx` renders for unknown routes with navigation back to home
- [x] T037 [P] [US4] Verify `frontend/src/app/NotificationsProvider.tsx` provides user feedback for API errors

**Checkpoint**: All pages render cleanly. SPA deep links work in Docker. No console errors. Backend falls back to seeded data.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation finalization, end-to-end validation, cleanup

- [x] T038 Finalize `specs/002-fix-cicd-azure-deploy/quickstart.md` — verify all prerequisite steps are accurate, all required/optional variables documented, troubleshooting section covers common failures
- [x] T039 [P] Verify `specs/002-fix-cicd-azure-deploy/contracts/cd-pipeline.yaml` matches actual workflow implementation — check all outputs, stages, health checks, and variables align with `cd-staging.yml` and `cd-prod.yml`
- [x] T040 [P] Review all Terraform module `outputs.tf` files — ensure staging/prod main.tf references only outputs that exist in modules (no missing output errors)
- [x] T041 Run full end-to-end validation: `terraform validate` on both envs, Docker build both images, start containers, run Playwright tests, verify health endpoints
- [x] T042 Update `specs/002-fix-cicd-azure-deploy/plan.md` with completion status and any deviations or decisions made during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001-T006 complete) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — critical path for deployment
- **US2 (Phase 4)**: Depends on Phase 2 — can run in parallel with US1
- **US3 (Phase 5)**: Depends on Phase 2 — depends on US2 for correct workflow names
- **US4 (Phase 6)**: Depends on Phase 2 — can run in parallel with US1/US2
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories — can start after Phase 2
- **US2 (P2)**: No dependency on other stories — can start after Phase 2 (parallel with US1)
- **US3 (P3)**: Soft dependency on US2 (needs correct workflow names to validate triggers)
- **US4 (P4)**: No dependency on other stories — can start after Phase 2 (parallel with US1/US2)

### Within Each User Story

- Review/validate tasks before hardening tasks
- Module reviews before composition reviews
- Workflow reviews before integration testing
- Core fixes before documentation updates

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 can run in parallel; T005, T006 can run in parallel
- **Phase 2**: T009, T010 can run in parallel
- **Phase 3 (US1)**: T012, T014, T015, T016 can run in parallel (different modules); T019 parallel with T017
- **Phase 4 (US2)**: T023, T024 can run in parallel (different workflows)
- **Phase 5 (US3)**: T028, T029 can run in parallel
- **Phase 6 (US4)**: T035, T036, T037 can run in parallel (different components)
- **Phase 7**: T038, T039, T040 can run in parallel
- **Cross-phase**: US1, US2, US4 can all run in parallel after Phase 2

---

## Parallel Example: User Story 1

```bash
# Launch parallel module reviews (T014, T015, T016 — different files):
Task: "Review infra/terraform/modules/sql/main.tf"
Task: "Review infra/terraform/modules/acr/main.tf"
Task: "Review infra/terraform/modules/monitoring/main.tf"

# Launch parallel env reviews (T012 with T011):
Task: "Review infra/terraform/envs/prod/main.tf"
Task: "Review infra/terraform/envs/staging/main.tf"

# Launch parallel CD workflow reviews (T019 with T017):
Task: "Review .github/workflows/cd-prod.yml"
Task: "Review .github/workflows/cd-staging.yml"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (validate Terraform, build Docker images)
2. Complete Phase 2: Foundational (YAML syntax, cross-references, package.json scripts)
3. Complete Phase 3: User Story 1 (harden CD workflows, Terraform, health checks)
4. **STOP and VALIDATE**: Trigger CD staging workflow → verify end-to-end deployment
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Baseline validated
2. Add US1 → End-to-end deployment works → Deploy (MVP!)
3. Add US2 → CI pipeline hardened → PR confidence
4. Add US3 → AI triage on failures → Developer productivity
5. Add US4 → All pages verified → Demo-ready polish
6. Polish → Documentation complete, contracts validated

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Terraform + CD pipelines)
   - Developer B: US2 (CI pipelines) + US3 (gh-aw)
   - Developer C: US4 (application pages)
3. Stories complete and validate independently
4. Team collaborates on Polish phase

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- This feature is primarily **validation and hardening** of existing code, not greenfield
- Most files already exist from feature 001 — tasks focus on review, fix, and verify
- No test tasks included (not requested in spec — testing is via manual verification and existing Playwright suites)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
