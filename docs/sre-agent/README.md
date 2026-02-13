# Azure SRE Agent - Subagents and Skills

This directory contains subagent definitions and skills for the Azure SRE Agent to automate incident detection, diagnosis, and remediation for Contoso University.

## 📁 Directory Structure

```
docs/sre-agent/
├── README.md                    # This file
├── subagents/                   # Specialized subagent definitions
│   ├── incident-triage-subagent.md
│   ├── database-remediation-subagent.md
│   ├── appservice-remediation-subagent.md
│   ├── performance-optimization-subagent.md
│   └── code-remediation-subagent.md
└── skills/                      # Reusable skill definitions
    ├── analyze-telemetry.md
    ├── execute-azure-cli.md
    ├── run-load-test.md
    └── create-github-pr.md
```

## 🤖 Subagents

### 1. Incident Triage Subagent
**File**: `subagents/incident-triage-subagent.md`

The first responder for all incidents. Analyzes telemetry, classifies severity, and routes to specialized subagents.

**Responsibilities**:
- Analyze incoming alerts
- Classify incident type (Database, Application, Infrastructure)
- Determine severity (Sev1-4)
- Route to appropriate specialist subagent

### 2. Database Remediation Subagent
**File**: `subagents/database-remediation-subagent.md`

Handles Azure SQL Database issues including:
- Connection timeouts
- Connection pool exhaustion
- Blocking/deadlocks
- DTU exhaustion

### 3. App Service Remediation Subagent
**File**: `subagents/appservice-remediation-subagent.md`

Handles Azure App Service issues including:
- HTTP 503 errors
- Health check failures
- Memory exhaustion
- Key Vault access issues
- Deployment slot problems

### 4. Performance Optimization Subagent
**File**: `subagents/performance-optimization-subagent.md`

Handles performance issues including:
- High response times (>2s)
- Slow database queries
- Load test failures
- Resource bottlenecks

### 5. Code Remediation Subagent
**File**: `subagents/code-remediation-subagent.md`

Generates code fixes including:
- Retry logic
- Circuit breakers
- Query optimizations
- Error handling
- Creates PRs with regression tests

## 🛠️ Skills

### 1. Analyze Telemetry
**File**: `skills/analyze-telemetry.md`

Queries Application Insights for:
- Exceptions
- Failed requests
- Slow requests
- Dependency performance
- Error trends

### 2. Execute Azure CLI
**File**: `skills/execute-azure-cli.md`

Runs Azure CLI commands for:
- Restart apps
- Scale resources
- Manage deployments
- Check status

### 3. Run Load Test
**File**: `skills/run-load-test.md`

Runs Azure Load Tests to:
- Validate fixes
- Check performance
- Gate deployments

### 4. Create GitHub PR
**File**: `skills/create-github-pr.md`

Creates pull requests with:
- Code fixes
- Regression tests
- Proper documentation

## 🚀 How to Use

### Upload to Azure SRE Agent

1. Go to Azure Portal → Your SRE Agent resource
2. Navigate to **Subagent Builder**
3. For each subagent:
   - Click **Create Subagent**
   - Upload the `.md` file or paste contents
   - Configure data connectors
   - Save and activate

### Configure Data Connectors

Each subagent needs these connections:
- **Application Insights**: `appi-{env}`
- **Log Analytics**: `log-{env}`
- **GitHub**: Your repository

### Set Approval Levels

| Action Category | Recommended Level |
|-----------------|-------------------|
| Query/Analyze | Autonomous |
| Restart Apps | Autonomous |
| Scale Resources | Review (human approval) |
| Code Changes | Review (human approval) |
| Production Changes | Review (human approval) |

## 📊 Incident Flow

```
Alert Triggered
      │
      ▼
┌─────────────────┐
│ Incident Triage │
│   Subagent      │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬─────────────┐
    ▼         ▼            ▼             ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│Database│ │AppSvc  │ │Performance│ │  Code    │
│Remediat│ │Remediat│ │Optimizat │ │Remediat  │
└────────┘ └────────┘ └──────────┘ └──────────┘
    │         │            │             │
    └─────────┴────────────┴─────────────┘
                    │
                    ▼
           Resolution/Escalation
```

## 📝 Related Documentation

- [SRE Knowledge Base](../SRE-KNOWLEDGE-BASE.md) - Comprehensive application documentation
- [Azure SRE Agent Docs](https://learn.microsoft.com/en-us/azure/sre-agent/) - Official Microsoft documentation
- [Subagent Builder Guide](https://learn.microsoft.com/en-us/azure/sre-agent/subagent-builder-scenarios) - How to build subagents

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-04 | Initial subagents and skills |
