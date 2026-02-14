<!--
Sync Impact Report

- Version change: N/A -> 1.0.0
- Modified principles: N/A (initial ratification)
- Added sections: Engineering Standards, Delivery & Review Workflow (template placeholders resolved)
- Removed sections: N/A
- Templates requiring updates:
  - updated: .specify/templates/plan-template.md
  - updated: .specify/templates/spec-template.md
  - updated: .specify/templates/tasks-template.md
- Follow-up TODOs: none
-->

# Contoso University Constitution

## Core Principles

### Reliability & Resilience (NON-NEGOTIABLE)
The application MUST handle transient failures gracefully.
- All database and external I/O MUST use async/await.
- Transient fault handling MUST use retries with exponential backoff (e.g., Polly) where appropriate.
- Long-running operations MUST have explicit timeouts; the default expectation is <= 30s for DB work.
- Add health checks (liveness/readiness) when introducing new critical dependencies.

Rationale: This project is designed for cloud deployment where transient failures are normal.

### Test & Code Quality Gates
Changes that modify behavior MUST be covered by tests, and tests MUST pass.
- Unit tests are required for business logic and edge cases.
- Integration tests are required when changing persistence, contracts, or cross-component behavior.
- Performance, load, or soak validation SHOULD be included when a change could impact scalability.

Rationale: This repo is used for demos and automation; regressions undermine confidence and UX.

### UX Consistency, Modern UI, and Responsiveness
User-facing changes MUST preserve a consistent, responsive, accessible experience.
- Pages MUST remain responsive across common breakpoints and usable on touch devices.
- New UI MUST follow existing patterns (layout, navigation, validation, and error messaging).
- User flows MUST have clear feedback for loading, success, and failure states.

Rationale: A polished UX is part of the product value and the demo narrative.

### Observability by Default
New features MUST be diagnosable in production.
- Use structured logging and include correlation context for request-level troubleshooting.
- Important failures MUST be logged with actionable information (avoid swallowing exceptions).
- When adding new critical paths, include telemetry (App Insights) that enables answering:
  "Is it failing?", "Is it slow?", and "Where?"

Rationale: The app runs on Azure App Service with Application Insights; diagnostics is a first-class need.

### Secure-by-Default Engineering
Security is mandatory and must not be retrofitted.
- Secrets MUST NOT be hardcoded or committed; use Key Vault / configuration and managed identity when possible.
- Data access MUST use parameterized queries / EF Core patterns (no string-concatenated SQL).
- Public endpoints MUST validate input and return safe error messages (no sensitive details).

Rationale: Cloud samples are often copied; secure defaults prevent accidental misuse.

## Engineering Standards

- Use dependency injection; services SHOULD be small and testable.
- Prefer clear, maintainable code over cleverness; avoid unnecessary abstractions.
- Database reads that do not require tracking SHOULD use AsNoTracking().
- When changing data models, include a migration plan and verify common pages remain fast.

## Delivery & Review Workflow

- Every PR MUST state: what changed, why, and how it was tested.
- Reviewers MUST check constitution compliance explicitly (tests, security, observability, UX).
- Breaking behavior changes MUST include a migration/rollout note.
- Keep changes small and reversible; separate refactors from behavior changes when feasible.

## Governance

This constitution supersedes local conventions and templates.

Amendments:
- Any contributor MAY propose an amendment via PR.
- The PR MUST include: rationale, expected impact, and any template/document updates required.
- At least one maintainer review is required; for major changes, require two reviewers.

Versioning policy (SemVer):
- MAJOR: Backward-incompatible governance/principle removals or redefinitions.
- MINOR: New principle/section added or materially expanded guidance.
- PATCH: Clarifications, wording fixes, or non-semantic refinements.

Compliance review expectations:
- Templates and guidance files MUST be kept consistent with the constitution.
- PR reviewers SHOULD request changes when principles are violated.

**Version**: 1.0.0 | **Ratified**: 2026-02-13 | **Last Amended**: 2026-02-13
