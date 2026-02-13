# Contoso University - SRE Agent Knowledge Base

## Overview

This knowledge base provides comprehensive documentation for the Azure SRE Agent to automate incident detection, root cause analysis, and remediation for the Contoso University application. This document serves as the primary reference for automated troubleshooting and resolution workflows.

---

## Table of Contents

1. [Application Architecture](#application-architecture)
2. [Component Locations](#component-locations)
3. [Azure Resources](#azure-resources)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Common Issues & Remediation](#common-issues--remediation)
7. [Health Checks & Monitoring](#health-checks--monitoring)
8. [Alert Definitions](#alert-definitions)
9. [Chaos Engineering Experiments](#chaos-engineering-experiments)
10. [Build & Deployment](#build--deployment)
11. [Runbooks](#runbooks)

---

## Application Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Azure Resource Group (rg-{env})                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐          ┌──────────────────┐                         │
│  │   Web App (MVC)  │──HTTP───▶│   API App        │                         │
│  │  {env}-app       │          │   {env}-api      │                         │
│  │  .NET 6 Razor    │          │   .NET 6 Web API │                         │
│  │  Pages           │          │   + Swagger      │                         │
│  └────────┬─────────┘          └────────┬─────────┘                         │
│           │                             │                                    │
│           │                             │ VNet Integration                   │
│           ▼                             ▼                                    │
│  ┌──────────────────┐          ┌──────────────────┐                         │
│  │ Application      │          │ Virtual Network  │                         │
│  │ Insights         │          │ (vnet-{env})     │                         │
│  │ (appi-{env})     │          └────────┬─────────┘                         │
│  └────────┬─────────┘                   │                                   │
│           │                             │ Private Endpoint                   │
│           ▼                             ▼                                    │
│  ┌──────────────────┐          ┌──────────────────┐                         │
│  │ Log Analytics    │          │  Azure SQL       │                         │
│  │ (log-{env})      │          │  (sql-{env})     │                         │
│  └──────────────────┘          │  Database:       │                         │
│                                │  sqldb-{env}     │                         │
│  ┌──────────────────┐          └──────────────────┘                         │
│  │ Key Vault        │                                                       │
│  │ (kv-{env})       │                                                       │
│  └──────────────────┘          ┌──────────────────┐                         │
│                                │ Load Testing     │                         │
│  ┌──────────────────┐          │ (lt-{env})       │                         │
│  │ SRE Agent        │          └──────────────────┘                         │
│  │ (sre-{env})      │                                                       │
│  └──────────────────┘                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request** → Web App (Razor Pages)
2. **Web App** → HTTP Client → API App (REST)
3. **API App** → Entity Framework Core → Azure SQL Database
4. **All Components** → Application Insights (Telemetry)

---

## Component Locations

### Frontend (MVC Web Application)

| Component | Path | Description |
|-----------|------|-------------|
| **Project File** | `src/ContosoUniversity.WebApplication/ContosoUniversity.WebApplication.csproj` | .NET 6 Web Application project |
| **Entry Point** | `src/ContosoUniversity.WebApplication/Program.cs` | Application startup and configuration |
| **Pages (UI)** | `src/ContosoUniversity.WebApplication/Pages/` | Razor Pages for UI rendering |
| **Student Pages** | `src/ContosoUniversity.WebApplication/Pages/Students/` | CRUD operations for students |
| **Course Pages** | `src/ContosoUniversity.WebApplication/Pages/Courses/` | CRUD operations for courses |
| **Department Pages** | `src/ContosoUniversity.WebApplication/Pages/Departments/` | CRUD operations for departments |
| **Instructor Pages** | `src/ContosoUniversity.WebApplication/Pages/Instructors/` | CRUD operations for instructors |
| **Health Controller** | `src/ContosoUniversity.WebApplication/Controllers/HealthController.cs` | Health check endpoints |
| **View Models** | `src/ContosoUniversity.WebApplication/Models/APIViewModels/` | Data transfer objects for API responses |

**Key Configuration:**
- Uses `IHttpClientFactory` to communicate with API
- API base URL configured via `Api__Address` app setting or `URLAPI` environment variable
- Application Insights integration for telemetry

### Backend (REST API)

| Component | Path | Description |
|-----------|------|-------------|
| **Project File** | `src/ContosoUniversity.API/ContosoUniversity.API.csproj` | .NET 6 Web API project |
| **Entry Point** | `src/ContosoUniversity.API/Program.cs` | API startup and database configuration |
| **Controllers** | `src/ContosoUniversity.API/Controllers/` | REST API endpoints |
| **StudentsController** | `src/ContosoUniversity.API/Controllers/StudentsController.cs` | Student CRUD operations |
| **CoursesController** | `src/ContosoUniversity.API/Controllers/CoursesController.cs` | Course CRUD operations |
| **DepartmentsController** | `src/ContosoUniversity.API/Controllers/DepartmentsController.cs` | Department CRUD operations |
| **InstructorsController** | `src/ContosoUniversity.API/Controllers/InstructorsController.cs` | Instructor CRUD operations |
| **Data Context** | `src/ContosoUniversity.API/Data/ContosoUniversityAPIContext.cs` | Entity Framework DbContext |
| **Database Initializer** | `src/ContosoUniversity.API/Data/DbInitializer.cs` | Database seeding logic |
| **Models** | `src/ContosoUniversity.API/Models/` | Entity models |
| **DTOs** | `src/ContosoUniversity.API/DTO/` | Data transfer objects |

**Key Configuration:**
- Entity Framework Core with SQL Server
- Retry-on-failure enabled for transient SQL errors
- Connection string from Key Vault reference: `@Microsoft.KeyVault(VaultName={kv};SecretName=AZURE-SQL-CONNECTION-STRING)`
- Swagger/OpenAPI documentation at `/swagger`

### Database Layer (SQL)

| Component | Path/Location | Description |
|-----------|---------------|-------------|
| **DbContext** | `src/ContosoUniversity.API/Data/ContosoUniversityAPIContext.cs` | EF Core database context |
| **Entity Models** | `src/ContosoUniversity.API/Models/` | Database entity definitions |
| **SQL Scripts** | `scripts/create-sql-users.sql` | Database user creation scripts |

**Database Tables:**

| Table Name | Entity Model | Purpose |
|------------|--------------|---------|
| `tbl_Student` | `Student.cs` | Student records |
| `tbl_Course` | `Course.cs` | Course catalog |
| `tbl_Department` | `Department.cs` | Academic departments |
| `tbl_Instructor` | `Instructor.cs` | Faculty members |
| `tbl_StudentCourse` | `StudentCourse.cs` | Student-course enrollments (junction) |

### Infrastructure as Code

| Component | Path | Description |
|-----------|------|-------------|
| **Main Template** | `infra/main.bicep` | Subscription-scoped deployment |
| **Resources** | `infra/resources.bicep` | All Azure resource definitions |
| **Chaos Targets** | `infra/chaos/chaos-targets.bicep` | Chaos Studio target registration |
| **CPU Pressure** | `infra/chaos/experiments/cpu-pressure.bicep` | CPU stress test experiment |
| **SQL Latency** | `infra/chaos/experiments/sql-latency.bicep` | Database latency injection |
| **Alerts** | `infra/monitoring/alerts.bicep` | Azure Monitor alert rules |
| **Dashboard** | `infra/monitoring/dashboard.json` | Azure Dashboard template |

### Testing

| Component | Path | Description |
|-----------|------|-------------|
| **Unit Tests** | `src/ContosoUniversity.Test/` | xUnit test project |
| **UI Tests** | `src/ContosoUniversity.CodedUITest/` | Coded UI test project |
| **Load Tests** | `loadtests/` | Azure Load Testing configuration |
| **JMeter Templates** | `loadtests/templates/` | JMeter test plans (.jmx) |

---

## Azure Resources

### Resource Naming Convention

All resources follow the pattern: `{type}-{environmentName}`

| Resource Type | Name Pattern | Example |
|---------------|--------------|---------|
| Resource Group | `rg-{env}` | `rg-contoso-prod` |
| App Service (Web) | `{env}-app` | `contoso-prod-app` |
| App Service (API) | `{env}-api` | `contoso-prod-api` |
| App Service Plan | `plan-{env}` | `plan-contoso-prod` |
| SQL Server | `sql-{env}` | `sql-contoso-prod` |
| SQL Database | `sqldb-{env}` | `sqldb-contoso-prod` |
| Key Vault | `kv-{env}` | `kv-contoso-prod` |
| Application Insights | `appi-{env}` | `appi-contoso-prod` |
| Log Analytics | `log-{env}` | `log-contoso-prod` |
| Load Testing | `lt-{env}` | `lt-contoso-prod` |
| SRE Agent | `sre-{env}` | `sre-contoso-prod` |
| Virtual Network | `vnet-{env}` | `vnet-contoso-prod` |

### App Service Slots

Each App Service has the following deployment slots:

| Slot | Purpose |
|------|---------|
| **Production** | Live traffic |
| **Staging** | Pre-production validation, load testing |
| **QA** | Quality assurance testing |

### Key Vault Secrets

| Secret Name | Purpose |
|-------------|---------|
| `AZURE-SQL-CONNECTION-STRING` | Database connection string |
| `sqlAdminPassword` | SQL admin password (SQL auth mode) |
| `appUserPassword` | Application user password (SQL auth mode) |

---

## Database Schema

### Entity Relationships

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   tbl_Student   │     │tbl_StudentCourse│     │   tbl_Course    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ ID (PK)         │────▶│ StudentID (FK)  │◀────│ ID (PK)         │
│ FirstName       │     │ CourseID (FK)   │     │ Title           │
│ LastName        │     └─────────────────┘     │ Credits         │
│ EnrollmentDate  │                             │ DepartmentID(FK)│
└─────────────────┘                             └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐                             ┌─────────────────┐
│ tbl_Instructor  │                             │ tbl_Department  │
├─────────────────┤                             ├─────────────────┤
│ ID (PK)         │◀────────────────────────────│ InstructorID(FK)│
│ FirstName       │                             │ ID (PK)         │
│ LastName        │                             │ Name            │
│ HireDate        │                             │ Budget          │
└─────────────────┘                             │ StartDate       │
                                                └─────────────────┘
```

### Sample Queries for Troubleshooting

```sql
-- Count records by table
SELECT 
    (SELECT COUNT(*) FROM tbl_Student) AS StudentCount,
    (SELECT COUNT(*) FROM tbl_Course) AS CourseCount,
    (SELECT COUNT(*) FROM tbl_Department) AS DepartmentCount,
    (SELECT COUNT(*) FROM tbl_Instructor) AS InstructorCount,
    (SELECT COUNT(*) FROM tbl_StudentCourse) AS EnrollmentCount;

-- Find students with no enrollments
SELECT s.* FROM tbl_Student s
LEFT JOIN tbl_StudentCourse sc ON s.ID = sc.StudentID
WHERE sc.StudentID IS NULL;

-- Check for database blocking
SELECT 
    blocking.session_id AS blocking_session,
    blocked.session_id AS blocked_session,
    blocked.wait_type,
    blocked.wait_time/1000 AS wait_seconds
FROM sys.dm_exec_requests blocked
JOIN sys.dm_exec_sessions blocking ON blocked.blocking_session_id = blocking.session_id;
```

---

## API Endpoints

### Students API

| Method | Endpoint | Description | DB Operation |
|--------|----------|-------------|--------------|
| GET | `/api/Students?page={n}` | List students (paginated) | SELECT with JOIN |
| GET | `/api/Students/{id}` | Get student by ID | SELECT with JOIN |
| GET | `/api/Students/Search?name={name}` | Search students | SELECT with LIKE |
| POST | `/api/Students` | Create student | INSERT |
| PUT | `/api/Students/{id}` | Update student | UPDATE |
| DELETE | `/api/Students/{id}` | Delete student | DELETE |

### Courses API

| Method | Endpoint | Description | DB Operation |
|--------|----------|-------------|--------------|
| GET | `/api/Courses` | List all courses | SELECT with JOIN |
| GET | `/api/Courses/{id}` | Get course by ID | SELECT with JOIN |
| POST | `/api/Courses` | Create course | INSERT |
| PUT | `/api/Courses/{id}` | Update course | UPDATE |
| DELETE | `/api/Courses/{id}` | Delete course | DELETE |

### Departments API

| Method | Endpoint | Description | DB Operation |
|--------|----------|-------------|--------------|
| GET | `/api/Departments` | List all departments | SELECT with JOIN |
| GET | `/api/Departments/{id}` | Get department by ID | SELECT with JOIN |
| POST | `/api/Departments` | Create department | INSERT |
| PUT | `/api/Departments/{id}` | Update department | UPDATE |
| DELETE | `/api/Departments/{id}` | Delete department | DELETE |

### Instructors API

| Method | Endpoint | Description | DB Operation |
|--------|----------|-------------|--------------|
| GET | `/api/Instructors` | List all instructors | SELECT |
| GET | `/api/Instructors/{id}` | Get instructor by ID | SELECT |
| POST | `/api/Instructors` | Create instructor | INSERT |
| PUT | `/api/Instructors/{id}` | Update instructor | UPDATE |
| DELETE | `/api/Instructors/{id}` | Delete instructor | DELETE |

### Health Endpoints

| Method | Endpoint | App | Description |
|--------|----------|-----|-------------|
| GET | `/health` | Web App | Built-in ASP.NET health check |
| GET | `/Health` | Web App | Custom health controller |
| GET | `/Health/detailed` | Web App | Detailed health with dependency checks |

---

## Common Issues & Remediation

### Issue 1: SQL Connection Timeout

**Symptoms:**
- HTTP 500 errors from API
- Application Insights shows `SqlException` with timeout
- Error: "A network-related or instance-specific error occurred"

**Root Cause Analysis:**
1. Check SQL Server firewall rules
2. Verify Private Endpoint connectivity
3. Check for database blocking/deadlocks
4. Review DTU/resource utilization

**Remediation Steps:**
```bash
# Check if API can reach SQL through VNet
# In Azure Portal: API App → Networking → VNet Integration

# Check SQL metrics
az sql db show-usage --resource-group rg-{env} --server sql-{env} --name sqldb-{env}

# Scale database if DTU is maxed
az sql db update --resource-group rg-{env} --server sql-{env} --name sqldb-{env} --service-objective S1
```

**Code Location:** `src/ContosoUniversity.API/Program.cs` (line 16-19 - EnableRetryOnFailure)

---

### Issue 2: High Response Time (>2s)

**Symptoms:**
- Load test failures
- User complaints about slow pages
- Application Insights shows p95 > 2000ms

**Root Cause Analysis:**
1. Check Application Insights → Performance
2. Look for slow dependency calls (SQL queries)
3. Check for N+1 query patterns
4. Review CPU/Memory metrics

**Remediation Steps:**
```csharp
// Add .AsNoTracking() for read-only queries
// Location: src/ContosoUniversity.API/Controllers/StudentsController.cs

// Before (potentially slow):
var students = _context.Student.Include(s => s.StudentCourse);

// After (optimized):
var students = _context.Student
    .AsNoTracking()
    .Include(s => s.StudentCourse)
    .ThenInclude(s => s.Course);
```

**Scaling Actions:**
```bash
# Scale up App Service Plan
az appservice plan update --name plan-{env} --resource-group rg-{env} --sku S2

# Scale out (add instances)
az webapp update --name {env}-api --resource-group rg-{env} --set siteConfig.numberOfWorkers=2
```

---

### Issue 3: HTTP 503 Service Unavailable

**Symptoms:**
- Web App returns 503
- Load balancer health checks failing
- App Service instance unhealthy

**Root Cause Analysis:**
1. Check App Service health in Azure Portal
2. Review application logs in Log Analytics
3. Check for memory exhaustion
4. Verify Key Vault access for connection string

**Remediation Steps:**
```bash
# Restart the app
az webapp restart --name {env}-app --resource-group rg-{env}

# Check health endpoint
curl https://{env}-app.azurewebsites.net/Health

# View application logs
az webapp log tail --name {env}-app --resource-group rg-{env}
```

**Kusto Query for Diagnosis:**
```kusto
AppServiceHTTPLogs
| where TimeGenerated > ago(1h)
| where ScStatus >= 500
| summarize count() by ScStatus, CsUriStem, bin(TimeGenerated, 5m)
| order by TimeGenerated desc
```

---

### Issue 4: Database Connection Pool Exhaustion

**Symptoms:**
- "The connection pool has been exhausted" errors
- Intermittent 500 errors under load
- Increasing connection count in SQL metrics

**Root Cause Analysis:**
1. Check for undisposed DbContext instances
2. Review concurrent request patterns
3. Check SQL connection limits

**Remediation:**
```csharp
// Ensure DbContext is properly scoped (already correct in this app)
// Location: src/ContosoUniversity.API/Program.cs

builder.Services.AddDbContext<ContosoUniversityAPIContext>(options =>
{
    options.UseSqlServer(connectionString, sqlOptions => 
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
        sqlOptions.CommandTimeout(30);
    });
});
```

---

### Issue 5: Key Vault Access Denied

**Symptoms:**
- API fails to start
- Error: "Access denied to Key Vault"
- Connection string not loading

**Root Cause Analysis:**
1. Verify Managed Identity is enabled
2. Check RBAC role assignment (Key Vault Secrets User)
3. Verify Key Vault network access rules

**Remediation Steps:**
```bash
# Get API's managed identity
API_PRINCIPAL=$(az webapp identity show --name {env}-api --resource-group rg-{env} --query principalId -o tsv)

# Assign Key Vault Secrets User role
az role assignment create \
    --assignee $API_PRINCIPAL \
    --role "Key Vault Secrets User" \
    --scope /subscriptions/{sub}/resourceGroups/rg-{env}/providers/Microsoft.KeyVault/vaults/kv-{env}
```

---

### Issue 6: Deployment Slot Swap Failure

**Symptoms:**
- Slot swap operation fails
- Staging slot health check failing
- Configuration mismatch between slots

**Remediation:**
```bash
# Check staging slot health
curl https://{env}-api-staging.azurewebsites.net/Health

# Verify app settings are configured
az webapp config appsettings list --name {env}-api --resource-group rg-{env} --slot staging

# Manual swap with validation
az webapp deployment slot swap \
    --name {env}-api \
    --resource-group rg-{env} \
    --slot staging \
    --target-slot production
```

---

## Health Checks & Monitoring

### Application Insights Queries

**Failed Requests by Endpoint:**
```kusto
requests
| where timestamp > ago(1h)
| where success == false
| summarize FailedCount = count() by name, resultCode
| order by FailedCount desc
```

**Slow Dependencies (Database):**
```kusto
dependencies
| where timestamp > ago(1h)
| where type == "SQL"
| where duration > 1000
| summarize avg(duration), count() by target, name
| order by avg_duration desc
```

**Exception Summary:**
```kusto
exceptions
| where timestamp > ago(1h)
| summarize count() by type, outerMessage
| order by count_ desc
```

**Custom Events (Student Search):**
```kusto
customEvents
| where timestamp > ago(24h)
| where name == "SearchStudent"
| extend filter = tostring(customDimensions.filter)
| summarize SearchCount = count() by filter
| order by SearchCount desc
```

### Health Check Implementation

**Simple Health Check:**
- Endpoint: `GET /health`
- Returns: `200 OK` when healthy
- Location: `src/ContosoUniversity.WebApplication/Program.cs` (line 61)

**Custom Health Controller:**
- Endpoint: `GET /Health`
- Returns: JSON with status, timestamp, version
- Location: `src/ContosoUniversity.WebApplication/Controllers/HealthController.cs`

**Detailed Health Check:**
- Endpoint: `GET /Health/detailed`
- Returns: Component-level health status
- Checks: Application, Database connectivity

---

## Alert Definitions

### Alert: High Response Time
- **Metric:** `requests/duration`
- **Threshold:** Average > 2000ms over 5 minutes
- **Severity:** Warning (2)
- **Action:** Investigate slow queries, consider scaling

### Alert: High Error Rate
- **Metric:** `requests/failed`
- **Threshold:** > 10 failed requests per 5 minutes
- **Severity:** Error (1)
- **Action:** Check application logs, investigate root cause

### Alert: High CPU Usage
- **Metric:** `CpuPercentage`
- **Threshold:** > 80% average over 5 minutes
- **Severity:** Warning (2)
- **Action:** Scale up/out App Service

### Alert: Availability Degradation
- **Metric:** `availabilityResults/availabilityPercentage`
- **Threshold:** < 99% over 5 minutes
- **Severity:** Error (1)
- **Action:** Check health endpoints, investigate outages

**Alert Configuration Location:** `infra/monitoring/alerts.bicep`

---

## Chaos Engineering Experiments

### Experiment 1: CPU Pressure

**Purpose:** Test application behavior under CPU constraints

**Configuration:**
- Duration: 5 minutes
- CPU Pressure: 80%
- Target: API App Service

**Expected Behavior:**
- Response times may increase
- Autoscaling should trigger (if configured)
- No data loss

**Bicep Template:** `infra/chaos/experiments/cpu-pressure.bicep`

### Experiment 2: SQL Latency

**Purpose:** Test application resilience to database slowness

**Configuration:**
- Duration: 3 minutes
- Latency Injection: 500ms
- Direction: Both (inbound/outbound)

**Expected Behavior:**
- Response times increase proportionally
- Retry logic should handle transient failures
- User experience degraded but functional

**Bicep Template:** `infra/chaos/experiments/sql-latency.bicep`

### Running Chaos Experiments

```bash
# Start CPU pressure experiment
az rest --method post \
    --uri "https://management.azure.com/subscriptions/{sub}/resourceGroups/rg-{env}/providers/Microsoft.Chaos/experiments/cpu-pressure-experiment/start?api-version=2023-11-01"

# Start SQL latency experiment
az rest --method post \
    --uri "https://management.azure.com/subscriptions/{sub}/resourceGroups/rg-{env}/providers/Microsoft.Chaos/experiments/sql-latency-experiment/start?api-version=2023-11-01"

# Check experiment status
az rest --method get \
    --uri "https://management.azure.com/subscriptions/{sub}/resourceGroups/rg-{env}/providers/Microsoft.Chaos/experiments/{experiment-name}/statuses/latest?api-version=2023-11-01"
```

---

## Build & Deployment

### Local Development

```bash
# Restore dependencies
dotnet restore src/ContosoUniversity.sln

# Build solution
dotnet build src/ContosoUniversity.sln --configuration Release

# Run unit tests
dotnet test src/ContosoUniversity.Test/ContosoUniversity.Test.csproj --configuration Release

# Run API locally (requires connection string)
export ConnectionStrings__ContosoUniversityAPIContext="Server=..."
dotnet run --project src/ContosoUniversity.API --urls "http://localhost:5000"

# Run Web App locally (in a separate terminal)
export Api__Address="http://localhost:5000"
dotnet run --project src/ContosoUniversity.WebApplication --urls "http://localhost:5001"
```

### GitHub Actions Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| Resilience Pipeline | `.github/workflows/resilience-pipeline.yml` | Push/PR | Full CI/CD with testing |
| Infrastructure | `.github/workflows/infrastructure.yml` | Manual | Deploy Azure resources |
| Load Test | `.github/workflows/load-test.yml` | Manual/On-demand | Run Azure Load Testing |
| Chaos Experiment | `.github/workflows/chaos-experiment.yml` | Manual | Run chaos experiments |

### Azure Load Testing

**Configuration:** `loadtests/config.yaml`

**Test Profiles:**
- **Default:** 100 virtual users, 60s ramp-up, 300s duration
- **Failure Criteria:**
  - avg(response_time_ms) > 2000 → FAIL
  - percentage(error) > 1 → FAIL
  - p95(response_time_ms) > 3000 → FAIL

**Running Load Tests:**
```bash
# Via Azure CLI
az load test create \
    --name contoso-load-test \
    --resource-group rg-{env} \
    --load-test-resource lt-{env} \
    --test-plan loadtests/templates/http-test.jmx \
    --env "host={env}-app.azurewebsites.net"
```

---

## Runbooks

### Runbook 1: Application Not Responding

1. **Check App Service status:**
   ```bash
   az webapp show --name {env}-app --resource-group rg-{env} --query state
   ```

2. **Check health endpoint:**
   ```bash
   curl -s https://{env}-app.azurewebsites.net/Health | jq
   ```

3. **Restart if needed:**
   ```bash
   az webapp restart --name {env}-app --resource-group rg-{env}
   ```

4. **If persistent, check logs:**
   ```bash
   az webapp log tail --name {env}-app --resource-group rg-{env}
   ```

5. **Escalate if issue persists after restart**

### Runbook 2: Database Connectivity Issues

1. **Verify SQL Server status:**
   ```bash
   az sql server show --name sql-{env} --resource-group rg-{env}
   ```

2. **Check database status:**
   ```bash
   az sql db show --name sqldb-{env} --server sql-{env} --resource-group rg-{env}
   ```

3. **Verify Private Endpoint:**
   ```bash
   az network private-endpoint show --name pe-sql-{env} --resource-group rg-{env}
   ```

4. **Test connectivity from API:**
   - Use Kudu console (https://{env}-api.scm.azurewebsites.net)
   - Test DNS resolution: `nslookup sql-{env}.database.windows.net`

5. **If connection string issue, verify Key Vault:**
   ```bash
   az keyvault secret show --vault-name kv-{env} --name AZURE-SQL-CONNECTION-STRING
   ```

### Runbook 3: High Memory Usage

1. **Check memory metrics:**
   ```bash
   az monitor metrics list \
       --resource "/subscriptions/{sub}/resourceGroups/rg-{env}/providers/Microsoft.Web/sites/{env}-api" \
       --metric "MemoryWorkingSet" \
       --interval PT5M
   ```

2. **If > 80%, restart to clear memory:**
   ```bash
   az webapp restart --name {env}-api --resource-group rg-{env}
   ```

3. **Scale up if persistent:**
   ```bash
   az appservice plan update --name plan-{env} --resource-group rg-{env} --sku S2
   ```

4. **Review for memory leaks:**
   - Check Application Insights for memory trends
   - Look for undisposed objects in code

### Runbook 4: Deployment Rollback

1. **Identify failed deployment:**
   ```bash
   az webapp deployment list-publishing-profiles --name {env}-api --resource-group rg-{env}
   ```

2. **Swap back to previous version:**
   ```bash
   az webapp deployment slot swap \
       --name {env}-api \
       --resource-group rg-{env} \
       --slot production \
       --target-slot staging
   ```

3. **Verify rollback successful:**
   ```bash
   curl -s https://{env}-api.azurewebsites.net/Health | jq
   ```

---

## SRE Agent Configuration

### Agent Settings (Bicep)

```bicep
// Location: infra/resources.bicep (lines 758-769)
resource sreAgent 'Microsoft.App/agents@2025-05-01-preview' = if (enableSreAgent) {
  name: sreAgentName
  location: 'eastus2'  // SRE Agent supported regions: swedencentral, eastus2, australiaeast
  identity: { type: 'SystemAssigned' }
  properties: {
    agentMode: sreAgentMode  // 'Review', 'Autonomous', or 'ReadOnly'
    accessLevel: 'High'
  }
}
```

> **Note:** Azure SRE Agent is currently available in limited regions: `swedencentral`, `eastus2`, and `australiaeast`. See the [official documentation](https://learn.microsoft.com/en-us/azure/sre-agent/) for the latest supported regions.

### Agent Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **ReadOnly** | Observe and report only | Initial deployment, learning |
| **Review** | Suggest remediations for human approval | Production with oversight |
| **Autonomous** | Auto-execute approved runbooks | Mature, well-tested environments |

### Data Connectors

The SRE Agent connects to:
1. **Application Insights** - For telemetry analysis
2. **Log Analytics** - For log analysis

---

## Contact & Escalation

### Support Tiers

| Tier | Issue Type | Response Time |
|------|------------|---------------|
| L1 | Health check failures, restarts | 5 minutes |
| L2 | Database issues, scaling | 15 minutes |
| L3 | Code changes, architecture | 1 hour |

### Key Files for Debugging

| Issue Category | Primary File | Secondary Files |
|----------------|--------------|-----------------|
| API Errors | `src/ContosoUniversity.API/Controllers/*.cs` | `Program.cs` |
| Database Issues | `src/ContosoUniversity.API/Data/ContosoUniversityAPIContext.cs` | Connection string in Key Vault |
| Frontend Issues | `src/ContosoUniversity.WebApplication/Pages/*.cshtml.cs` | `Program.cs` |
| Infrastructure | `infra/resources.bicep` | `infra/main.bicep` |
| Monitoring | `infra/monitoring/alerts.bicep` | Application Insights |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-04 | Initial SRE knowledge base |

---

*This document is designed for use with Azure SRE Agent. For updates, see the [Microsoft SRE Agent documentation](https://learn.microsoft.com/en-us/azure/sre-agent/).*
