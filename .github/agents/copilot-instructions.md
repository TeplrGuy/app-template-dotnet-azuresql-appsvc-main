# app-template-dotnet-azuresql-appsvc-main Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-13

## Active Technologies
- TypeScript 5.x (Node 20), Terraform >= 1.5 + NestJS (backend), React+Vite+MUI (frontend), Prisma (ORM), azurerm provider (001-modernize-web-api)
- Azure SQL Database (via Prisma) (001-modernize-web-api)
- HCL (Terraform >= 1.5), YAML (GitHub Actions), TypeScript (Node 20 LTS) + azurerm provider >= 3.0, GitHub Actions, Docker, gh-aw CLI (002-fix-cicd-azure-deploy)
- Azure SQL (Prisma sqlserver provider), Azure Storage (Terraform remote state) (002-fix-cicd-azure-deploy)

- TypeScript (latest stable) on Node.js 20 LTS; React (latest stable) + TypeScript (001-modernize-web-api)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript (latest stable) on Node.js 20 LTS; React (latest stable) + TypeScript: Follow standard conventions

## Recent Changes
- 002-fix-cicd-azure-deploy: Added HCL (Terraform >= 1.5), YAML (GitHub Actions), TypeScript (Node 20 LTS) + azurerm provider >= 3.0, GitHub Actions, Docker, gh-aw CLI
- 001-modernize-web-api: Added TypeScript 5.x (Node 20), Terraform >= 1.5 + NestJS (backend), React+Vite+MUI (frontend), Prisma (ORM), azurerm provider

- 001-modernize-web-api: Added TypeScript (latest stable) on Node.js 20 LTS; React (latest stable) + TypeScript

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
