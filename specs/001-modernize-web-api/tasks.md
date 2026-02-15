# Tasks: Modernize Contoso University (React + Node + Terraform)

**Input**: Design documents from `/specs/001-modernize-web-api/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/openapi.yaml`

**Tests**: Required where behavior changes; the spec explicitly requires E2E browser tests for primary journeys.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize repo structure for new React+Node apps and baseline tooling.

- [X] T001 Create modern app directories `backend\`, `frontend\`, and `infra\terraform\`
- [X] T002 Initialize NestJS backend skeleton in `backend\` (creates `backend\package.json`, `backend\src\main.ts`)
- [X] T003 Initialize Vite React+TS frontend skeleton in `frontend\` (creates `frontend\package.json`, `frontend\src\main.tsx`)
- [X] T004 [P] Add root-level editor settings in `.editorconfig`
- [X] T005 [P] Configure backend lint/format in `backend\eslint.config.mjs` and `backend\.prettierrc`
- [X] T006 [P] Configure frontend lint/format in `frontend\eslint.config.js` and `frontend\.prettierrc`
- [X] T007 [P] Add standard scripts (`lint`, `test`, `build`) in `backend\package.json` and `frontend\package.json`
- [X] T008 [P] Add backend container files `backend\Dockerfile` and `backend\.dockerignore`
- [X] T009 [P] Add frontend container files `frontend\Dockerfile` and `frontend\.dockerignore`
- [X] T010 Add local dev compose in `docker-compose.yml` (SQL Server + optional app services)
- [X] T011 [P] Add baseline PR CI workflow in `.github\workflows\ci.yml` (install, lint, test, build)
- [X] T012 [P] Add environment templates `backend\.env.example` and `frontend\.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T013 Implement backend config + env validation in `backend\src\config\configuration.ts` and `backend\src\config\env.validation.ts`
- [X] T014 [P] Add global request validation in `backend\src\main.ts` (ValidationPipe) and DTO conventions in `backend\src\common\dto\`
- [X] T015 [P] Add global exception filter in `backend\src\common\filters\http-exception.filter.ts` and register in `backend\src\main.ts`
- [X] T016 [P] Add structured logging in `backend\src\common\logging\logger.ts` and wire into `backend\src\main.ts`
- [X] T017 Add health endpoint `/health` in `backend\src\health\health.controller.ts` and `backend\src\health\health.module.ts`
- [X] T018 Add Swagger/OpenAPI generation in `backend\src\swagger.ts` and enable in `backend\src\main.ts`
- [X] T019 Initialize Prisma for SQL Server in `backend\prisma\schema.prisma` and `backend\src\prisma\prisma.service.ts`
- [X] T020 [P] Define initial Prisma models (Student, Course, Department, Instructor, StudentCourse) in `backend\prisma\schema.prisma`
- [X] T021 [P] Create DB access module wrapper in `backend\src\db\db.module.ts` (exports PrismaService)
- [X] T022 Implement frontend app shell + MUI theme in `frontend\src\app\App.tsx` and `frontend\src\theme\theme.ts`
- [X] T023 [P] Implement frontend routing scaffold in `frontend\src\routes\router.tsx`
- [X] T024 [P] Add frontend API client wrapper in `frontend\src\lib\api\client.ts`
- [X] T025 Add TanStack Query provider in `frontend\src\app\QueryProvider.tsx` and wire into `frontend\src\main.tsx`
- [X] T026 Setup Playwright in `frontend\playwright.config.ts` and `frontend\tests\e2e\`
- [X] T027 [P] Add minimal smoke spec scaffold in `frontend\tests\e2e\smoke.spec.ts`
- [X] T028 Setup backend test harness in `backend\test\app.e2e-spec.ts` and `backend\test\jest-e2e.json`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Modern, responsive experience for core workflows (Priority: P1) 🎯 MVP

**Goal**: Deliver a modern, consistent, responsive Students experience (list → details → create) across desktop and mobile.

**Independent Test**: A tester can complete “browse students → view details → create student” on desktop and a mobile viewport with clear validation and feedback.

### Implementation & Tests

- [X] T029 [P] [US1] Add Students DTOs in `backend\src\students\dto\create-student.dto.ts` and `backend\src\students\dto\update-student.dto.ts`
- [X] T030 [P] [US1] Create Students module skeleton in `backend\src\students\students.module.ts`, `backend\src\students\students.controller.ts`, `backend\src\students\students.service.ts`
- [X] T031 [US1] Implement `GET /api/students` in `backend\src\students\students.controller.ts` (paged list)
- [X] T032 [US1] Implement `GET /api/students/{studentId}` in `backend\src\students\students.controller.ts`
- [X] T033 [US1] Implement `POST /api/students` in `backend\src\students\students.controller.ts`
- [X] T034 [US1] Implement `PUT /api/students/{studentId}` in `backend\src\students\students.controller.ts`
- [X] T035 [US1] Implement `DELETE /api/students/{studentId}` in `backend\src\students\students.controller.ts`
- [X] T036 [US1] Implement `GET /api/students/search` in `backend\src\students\students.controller.ts`
- [X] T037 [P] [US1] Add Students endpoint tests in `backend\test\students.e2e-spec.ts`
- [X] T038 [P] [US1] Add Swagger decorators for Students endpoints in `backend\src\students\students.controller.ts`
- [X] T039 [P] [US1] Create Students list page in `frontend\src\pages\students\StudentsListPage.tsx`
- [X] T040 [P] [US1] Create Student details page in `frontend\src\pages\students\StudentDetailsPage.tsx`
- [X] T041 [P] [US1] Create Student form component in `frontend\src\components\students\StudentForm.tsx`
- [X] T042 [P] [US1] Create Student create page in `frontend\src\pages\students\StudentCreatePage.tsx`
- [X] T043 [P] [US1] Add Students API hooks (TanStack Query) in `frontend\src\features\students\api.ts`
- [X] T044 [US1] Wire routes and nav for Students in `frontend\src\routes\router.tsx` and `frontend\src\app\App.tsx`
- [X] T045 [US1] Implement responsive layout for Students pages in `frontend\src\pages\students\StudentsListPage.tsx` and `frontend\src\pages\students\StudentCreatePage.tsx`
- [X] T046 [US1] Implement clear validation + submit feedback in `frontend\src\components\students\StudentForm.tsx` (preserve state on error)
- [X] T047 [P] [US1] Add Playwright journey test in `frontend\tests\e2e\students-journey.spec.ts`
- [X] T048 [P] [US1] Add mobile viewport coverage in `frontend\tests\e2e\students-journey.spec.ts`

**Checkpoint**: US1 is demoable end-to-end (UI + API + E2E coverage).

---

## Phase 4: User Story 2 - Safer CI/CD with staged delivery and quality gates (Priority: P2)

**Goal**: Deliver a container-first pipeline with early security gates, automated tests, artifact scanning, and staged deploys (staging → smoke → DAST → optional approval → prod → smoke).

**Independent Test**: A tester can run workflows on a sample change and observe gates in order and correct blocking behavior.

### Implementation

- [X] T049 [P] [US2] Create Terraform root module in `infra\terraform\main.tf`, `infra\terraform\variables.tf`, `infra\terraform\outputs.tf`
- [X] T050 [P] [US2] Add Terraform module skeletons in `infra\terraform\modules\acr\*`, `infra\terraform\modules\appservice\*`, `infra\terraform\modules\monitoring\*`
- [X] T051 [US2] Add staging environment composition in `infra\terraform\envs\staging\main.tf` and `infra\terraform\envs\staging\variables.tf`
- [X] T052 [US2] Add prod environment composition in `infra\terraform\envs\prod\main.tf` and `infra\terraform\envs\prod\variables.tf`
- [X] T053 [P] [US2] Add pre-build gate workflow in `.github\workflows\ci-quality-gates.yml` (secrets, SAST, SCA)
- [X] T054 [P] [US2] Add build+test workflow in `.github\workflows\ci-build-test.yml` (lint/unit/integration/Playwright)
- [X] T055 [P] [US2] Add container build+push workflow in `.github\workflows\ci-container-publish.yml` (Docker Buildx → ACR)
- [X] T056 [P] [US2] Add image scanning job placeholder in `.github\workflows\ci-container-publish.yml` (Wiz/Snyk/Trivy as configured)
- [X] T057 [US2] Add staging deploy workflow in `.github\workflows\cd-staging.yml` (Terraform apply + deploy)
- [X] T058 [US2] Add staging smoke tests job in `.github\workflows\cd-staging.yml` (run `frontend\tests\e2e\smoke.spec.ts` against staging)
- [X] T059 [US2] Add staging DAST job placeholder in `.github\workflows\cd-staging.yml` (e.g., OWASP ZAP baseline)
- [X] T060 [US2] Add production deploy workflow in `.github\workflows\cd-prod.yml` (environment-protected, optional manual approval)
- [X] T061 [US2] Add production smoke tests job in `.github\workflows\cd-prod.yml` (Playwright)
- [X] T062 [P] [US2] Add Azure Load Testing workflow in `.github\workflows\loadtest.yml` wired to `loadtests\config.yaml`
- [X] T063 [US2] Document pipeline order + required secrets/vars in `.github\workflows\README.md`

**Checkpoint**: US2 gates are visible, ordered, and block promotions on failures.

---

## Phase 5: User Story 3 - AI-assisted CI failure triage and remediation (Priority: P3)

**Goal**: Provide a safe, read-only-by-default assistant that summarizes CI failures and proposes next steps; optionally proposes low-risk fixes when explicitly enabled.

**Independent Test**: A tester triggers a known CI failure and receives a remediation summary within the workflow run output (and/or PR comment).

### Implementation

- [ ] T064 [P] [US3] Create CI triage tool skeleton in `scripts\ci-triage\package.json` and `scripts\ci-triage\src\index.ts`
- [ ] T065 [US3] Implement Copilot SDK adapter (read-only prompt) in `scripts\ci-triage\src\copilot.ts`
- [ ] T066 [US3] Implement log/artifact summarization in `scripts\ci-triage\src\summarize.ts`
- [ ] T067 [US3] Add CI failure triage workflow in `.github\workflows\ci-triage.yml` (runs on `workflow_run` failure)
- [ ] T068 [US3] Add explicit opt-in inputs for write actions in `.github\workflows\ci-triage.yml` (default false)
- [ ] T069 [US3] Add low-risk remediation “proposal only” output in `scripts\ci-triage\src\remediate.ts`

**Checkpoint**: US3 produces actionable summaries without making unapproved changes.

---

## Phase 6: User Story 4 - Predictable backend behavior and graceful failures (Priority: P4)

**Goal**: Ensure consistent API error semantics (404/400/503), resilience to transient DB failures, and a friendly UI for not-found and retryable errors.

**Independent Test**: A tester sees friendly not-found behavior and actionable retry messaging when the DB is temporarily unavailable.

### Implementation & Tests

- [ ] T070 [P] [US4] Define standard error response shape in `backend\src\common\errors\error-response.ts`
- [ ] T071 [US4] Map Prisma not-found/validation errors in `backend\src\common\filters\http-exception.filter.ts`
- [ ] T072 [US4] Add transient retry/timeout behavior for DB calls in `backend\src\prisma\prisma.service.ts`
- [ ] T073 [P] [US4] Add frontend NotFound page in `frontend\src\pages\NotFoundPage.tsx`
- [ ] T074 [P] [US4] Add frontend Error Boundary in `frontend\src\app\ErrorBoundary.tsx`
- [ ] T075 [US4] Add global notifications/toasts in `frontend\src\app\NotificationsProvider.tsx`
- [ ] T076 [US4] Ensure Students form preserves state + shows actionable retry errors in `frontend\src\components\students\StudentForm.tsx`
- [ ] T077 [P] [US4] Add backend error handling tests in `backend\test\error-handling.e2e-spec.ts`
- [ ] T078 [P] [US4] Add Playwright error-state tests in `frontend\tests\e2e\error-states.spec.ts`

**Checkpoint**: Failures are consistent and user-friendly; retry is possible without losing context.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple stories (docs, parity expansion, performance baselines).

- [X] T079 [P] Align `specs\001-modernize-web-api\contracts\openapi.yaml` with implemented endpoints (update contract file)
- [X] T080 [P] Add contract validation step in `.github\workflows\ci-build-test.yml` (lint/validate OpenAPI)
- [X] T081 Implement basic Courses read API in `backend\src\courses\courses.controller.ts` and `backend\src\courses\courses.service.ts`
- [X] T082 Implement Courses list page in `frontend\src\pages\courses\CoursesListPage.tsx`
- [X] T083 [P] Add Playwright smoke coverage for Courses list in `frontend\tests\e2e\smoke.spec.ts`
- [X] T084 Run and validate `specs\001-modernize-web-api\quickstart.md` steps (update docs if any steps drift)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → blocks nothing else.
- **Foundational (Phase 2)** → depends on Setup and BLOCKS all user stories.
- **User Stories (Phase 3–6)** → depend on Foundational.
  - US1 can proceed immediately after Phase 2 (MVP).
  - US2 can proceed after Phase 2; it benefits from having Dockerfiles and Playwright scaffolding already in place.
  - US3 depends on US2 (needs CI workflows to hook into).
  - US4 can proceed after Phase 2 and is easiest after US1 endpoints exist.
- **Polish (Phase 7)** → depends on whichever stories it touches.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories.
- **US2 (P2)**: No dependency on other stories.
- **US3 (P3)**: Depends on US2.
- **US4 (P4)**: Depends on US1 for end-to-end UX validation.

---

## Parallel Example: User Story 1

After Phase 2, run in parallel:

- T029 (DTOs) + T030 (module skeleton) + T039/T040/T041/T042 (frontend pages/hooks)
- Then implement backend endpoints (T031–T036) and wire UI (T044–T046)
- Then run E2E tests (T047–T048)

## Parallel Example: User Story 2

After Phase 2, run in parallel:

- Terraform scaffolding (T049–T052)
- CI workflows (T053–T056)
- CD workflows (T057–T061)
- Load testing workflow (T062)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2.
2. Complete Phase 3 (US1) end-to-end.
3. Validate on desktop + mobile viewport and ensure Playwright passes.

### Incremental Delivery

Proceed in priority order: US1 → US2 → US3 → US4, then Polish.
