# Data Model: Fix CI/CD Pipeline and Azure Deployment

This document describes the infrastructure resource model (Terraform entities) and pipeline entities that compose the deployment system.

## Terraform Resource Model

### Resource Group

| Field | Type | Description |
|-------|------|-------------|
| name | string | `{name_prefix}-{env}-rg` |
| location | string | Azure region (default: `eastus2`) |
| tags | map(string) | environment, managed_by |

### Azure Container Registry (ACR)

| Field | Type | Description |
|-------|------|-------------|
| name | string | `{name_prefix}{env}acr` (alphanumeric only, max 50) |
| sku | string | `Basic` (default) |
| admin_enabled | bool | `false` (managed identity used) |

**Relationships**: AppService → ACR (AcrPull role assignment)

### Azure SQL Server

| Field | Type | Description |
|-------|------|-------------|
| server_name | string | `{name_prefix}-{env}-sql` |
| version | string | `12.0` |
| minimum_tls_version | string | `1.2` |
| aad_admin_login | string | AAD admin display name |
| aad_admin_object_id | string | AAD admin object ID |
| azuread_only_authentication | bool | `true` |

### Azure SQL Database

| Field | Type | Description |
|-------|------|-------------|
| name | string | `contosouniversity` (default) |
| sku_name | string | `Basic` (staging) / `S0` (prod) |
| max_size_gb | number | `2` (default) |
| collation | string | `SQL_Latin1_General_CP1_CI_AS` |

**Relationships**: Database → Server (parent), Firewall Rule → Server

### App Service Plan

| Field | Type | Description |
|-------|------|-------------|
| name | string | `{name_prefix}-{env}-plan` |
| os_type | string | `Linux` |
| sku_name | string | `B1` (staging) / `S1` (prod) |

### Linux Web App (Backend)

| Field | Type | Description |
|-------|------|-------------|
| name | string | `{name_prefix}-{env}-api` |
| service_plan_id | ref | App Service Plan |
| docker_image_name | string | `{acr_server}/backend:{tag}` |
| identity | SystemAssigned | For ACR pull |
| app_settings | map | SQLSERVER_CONNECTION_STRING, APPLICATIONINSIGHTS_CONNECTION_STRING, WEBSITES_PORT=3000 |

### Linux Web App (Frontend)

| Field | Type | Description |
|-------|------|-------------|
| name | string | `{name_prefix}-{env}-web` |
| service_plan_id | ref | App Service Plan |
| docker_image_name | string | `{acr_server}/frontend:{tag}` |
| identity | SystemAssigned | For ACR pull |
| app_settings | map | WEBSITES_PORT=80 |

### Log Analytics Workspace

| Field | Type | Description |
|-------|------|-------------|
| name | string | `{name_prefix}-{env}-law` |
| sku | string | `PerGB2018` |
| retention_in_days | number | `30` |

### Application Insights

| Field | Type | Description |
|-------|------|-------------|
| name | string | `{name_prefix}-{env}-appi` |
| application_type | string | `web` |
| workspace_id | ref | Log Analytics Workspace |

## Entity Relationship Diagram

```
ResourceGroup
  ├── ACR ──────────────────────────────┐
  ├── SQL Server                        │
  │     └── SQL Database                │
  ├── App Service Plan (Linux)          │
  │     ├── Backend Web App ───ACRPull──┘
  │     │     └── app_settings (SQL conn, AppInsights)
  │     └── Frontend Web App ──ACRPull──┘
  │           └── app_settings (port 80)
  ├── Log Analytics Workspace
  │     └── Application Insights
  └── Role Assignments (AcrPull × 2)
```

## Pipeline Entity Model

### Pipeline Run

| Field | Type | Description |
|-------|------|-------------|
| trigger | enum | workflow_dispatch, push, pull_request |
| environment | enum | staging, production |
| image_tag | string | Git SHA or user-specified tag |
| status | enum | success, failure, cancelled |

### Pipeline Stages

```
workflow_dispatch
  └── deploy (job)
        ├── checkout
        ├── validate_vars
        ├── azure_login (OIDC)
        ├── terraform_init
        ├── terraform_apply
        ├── read_tf_outputs
        ├── deploy_backend_container
        ├── deploy_frontend_container
        └── health_check
  └── smoke_tests (job, needs: deploy)
        ├── playwright_install
        └── playwright_run
  └── dast (job, needs: smoke_tests, optional)
        └── owasp_zap_baseline
```

## State Transitions

### Terraform Resource Lifecycle

```
Not Exists → terraform plan (create) → terraform apply → Exists
Exists → terraform plan (no changes) → No-op (idempotent)
Exists → config change → terraform plan (update) → terraform apply → Updated
Exists → terraform destroy → Destroyed
```

### Container Deployment Lifecycle

```
Image Built → ACR Push → az webapp config container set → Container Pull → Running → Health Check
```

## Validation Rules

- `name_prefix` must produce valid Azure resource names (alphanumeric + hyphens)
- ACR names are alphanumeric only (max 50 chars) — enforced by `replace()` function
- SQL Server names are globally unique
- App Service names are globally unique
- Terraform state key must be unique per environment (`staging.terraform.tfstate`, `prod.terraform.tfstate`)
