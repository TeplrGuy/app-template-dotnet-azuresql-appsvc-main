---
name: execute-azure-cli
description: Skill for executing Azure CLI commands to remediate issues. Includes commands for restarting apps, scaling resources, and managing deployments.
metadata:
  author: contoso-sre
  version: "1.0"
---

# Execute Azure CLI Skill

This skill enables the SRE Agent to execute Azure CLI commands for remediation actions on Contoso University resources.

## Resource Naming

| Resource | Name Pattern |
|----------|--------------|
| Resource Group | `rg-{env}` |
| Web App | `{env}-app` |
| API App | `{env}-api` |
| App Service Plan | `plan-{env}` |
| SQL Server | `sql-{env}` |
| SQL Database | `sqldb-{env}` |
| Key Vault | `kv-{env}` |

## App Service Commands

### Restart Applications

```bash
# Restart Web App (Autonomous)
az webapp restart --name {env}-app --resource-group rg-{env}

# Restart API App (Autonomous)
az webapp restart --name {env}-api --resource-group rg-{env}

# Restart specific slot
az webapp restart --name {env}-api --resource-group rg-{env} --slot staging
```

### Check App Status

```bash
# Get app state
az webapp show --name {env}-app --resource-group rg-{env} --query state -o tsv

# Get app health
curl -s https://{env}-app.azurewebsites.net/Health | jq

# View recent logs
az webapp log tail --name {env}-app --resource-group rg-{env}
```

### Scale App Service Plan

```bash
# Scale up (larger instance) - Review Required
az appservice plan update --name plan-{env} --resource-group rg-{env} --sku S2

# Scale out (more instances) - Review Required
az appservice plan update --name plan-{env} --resource-group rg-{env} --number-of-workers 2

# Scale down (after incident) - Review Required
az appservice plan update --name plan-{env} --resource-group rg-{env} --sku S1 --number-of-workers 1
```

### Deployment Slots

```bash
# Swap staging to production - Review Required
az webapp deployment slot swap \
    --name {env}-api \
    --resource-group rg-{env} \
    --slot staging \
    --target-slot production

# Preview swap (validation)
az webapp deployment slot swap \
    --name {env}-api \
    --resource-group rg-{env} \
    --slot staging \
    --action preview

# Cancel swap
az webapp deployment slot swap \
    --name {env}-api \
    --resource-group rg-{env} \
    --slot staging \
    --action reset
```

## SQL Database Commands

### Check Database Status

```bash
# Show database info
az sql db show --resource-group rg-{env} --server sql-{env} --name sqldb-{env}

# Check usage/DTU
az sql db show-usage --resource-group rg-{env} --server sql-{env} --name sqldb-{env}

# List active connections (requires SQL query)
az sql db query --resource-group rg-{env} --server sql-{env} --name sqldb-{env} \
    --query "SELECT COUNT(*) FROM sys.dm_exec_connections"
```

### Scale Database

```bash
# Scale up to S1 (10 DTU → 20 DTU) - Review Required
az sql db update --resource-group rg-{env} --server sql-{env} --name sqldb-{env} --service-objective S1

# Scale up to S2 (50 DTU) - Review Required
az sql db update --resource-group rg-{env} --server sql-{env} --name sqldb-{env} --service-objective S2

# Scale down after incident - Review Required
az sql db update --resource-group rg-{env} --server sql-{env} --name sqldb-{env} --service-objective S0
```

## Key Vault Commands

### Check Access

```bash
# Get managed identity
az webapp identity show --name {env}-api --resource-group rg-{env}

# List role assignments
az role assignment list \
    --scope /subscriptions/{sub}/resourceGroups/rg-{env}/providers/Microsoft.KeyVault/vaults/kv-{env} \
    --output table
```

### Fix Access Issues

```bash
# Assign Key Vault Secrets User role - Review Required
API_PRINCIPAL=$(az webapp identity show --name {env}-api --resource-group rg-{env} --query principalId -o tsv)

az role assignment create \
    --assignee $API_PRINCIPAL \
    --role "Key Vault Secrets User" \
    --scope /subscriptions/{sub}/resourceGroups/rg-{env}/providers/Microsoft.KeyVault/vaults/kv-{env}
```

## Monitoring Commands

### Get Metrics

```bash
# CPU percentage (last hour)
az monitor metrics list \
    --resource /subscriptions/{sub}/resourceGroups/rg-{env}/providers/Microsoft.Web/sites/{env}-api \
    --metric CpuPercentage \
    --interval PT5M

# Memory usage
az monitor metrics list \
    --resource /subscriptions/{sub}/resourceGroups/rg-{env}/providers/Microsoft.Web/sites/{env}-api \
    --metric MemoryWorkingSet \
    --interval PT5M
```

## Approval Levels

| Command Category | Approval Level |
|-----------------|----------------|
| Show/List/Get | Autonomous |
| Restart App | Autonomous |
| View Logs | Autonomous |
| Scale Up/Out | Review Required |
| Scale Down | Review Required |
| Slot Swap | Review Required |
| Role Assignment | Review Required |
| Delete | Not Allowed |

## Safety Checks

Before executing commands:
1. Verify resource group exists
2. Confirm environment (don't run prod commands in dev)
3. Check current state before changing
4. Log all actions for audit trail

## Output Format

When executing commands, report:

```markdown
## Azure CLI Execution

**Command**: `{command}`
**Resource**: {resource_name}
**Environment**: {env}

### Result
- **Status**: Success/Failed
- **Output**: {output}
- **Duration**: {duration}

### Verification
{verification_steps_taken}

### Next Steps
{recommended_follow_up}
```
