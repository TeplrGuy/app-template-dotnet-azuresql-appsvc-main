# Contoso University - GitHub Copilot Instructions

## Project Context

This is a .NET 6 MVC web application (Contoso University) that demonstrates:
- Azure App Service deployment
- Azure SQL Database integration
- Azure Load Testing for performance validation
- Azure Chaos Studio for resilience testing
- GitHub Actions for CI/CD with quality gates

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Azure Resource Group                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐   │
│  │ App Service │────▶│  Azure SQL  │     │ App Insights    │   │
│  │  (.NET 6)   │     │  Database   │     │ + Log Analytics │   │
│  └─────────────┘     └─────────────┘     └─────────────────┘   │
│         │                   │                     │             │
│         └───────────────────┼─────────────────────┘             │
│                             │                                    │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐   │
│  │ Azure Load  │     │ Azure Chaos │     │  Azure Monitor  │   │
│  │  Testing    │     │   Studio    │     │     Alerts      │   │
│  └─────────────┘     └─────────────┘     └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Endpoints

| Endpoint | Description | Critical for Load Testing |
|----------|-------------|---------------------------|
| `/` | Home page | ✅ Yes |
| `/Students` | Student list (DB read) | ✅ Yes |
| `/Students/Create` | Create student (DB write) | ✅ Yes |
| `/Courses` | Course catalog | ✅ Yes |
| `/Enrollments` | Student enrollments | ✅ Yes |

## Coding Guidelines

### C# / .NET
- Use async/await for all database operations
- Implement retry logic with Polly for transient failures
- Use dependency injection for all services
- Follow the repository pattern for data access

### Infrastructure as Code
- Use Bicep for all Azure resource definitions
- Place IaC files in `/infra` folder
- Use parameters for environment-specific values
- Enable managed identity where possible

### Testing
- Unit tests go in `ContosoUniversity.Test`
- Load tests (JMeter) go in `/loadtests`
- Chaos experiments go in `/infra/chaos`

## Resilience Patterns to Apply

1. **Retry with exponential backoff** - For SQL connections
2. **Circuit breaker** - For external service calls
3. **Timeout policies** - 30s max for DB operations
4. **Health checks** - `/health` endpoint for liveness
5. **Graceful degradation** - Cache fallbacks when DB is slow

## When Asked About Load Testing

Generate JMeter (JMX) test plans that:
- Target the endpoints listed above
- Use realistic user counts (50-500 concurrent)
- Include proper assertions (response time < 2s, error rate < 1%)
- Work with Azure Load Testing service

## When Asked About Chaos Engineering

Consider these fault injection scenarios:
1. **Database latency** - Add 5s delay to SQL queries
2. **Database connection failure** - Block SQL port 1433
3. **High CPU** - Stress App Service to 90% CPU
4. **Memory pressure** - Consume 80% of available memory
5. **Network partition** - DNS resolution failures

## Security Considerations

- Never hardcode connection strings
- Use Azure Key Vault for secrets
- Enable managed identity for Azure resources
- Use parameterized queries to prevent SQL injection

## SRE Agent / Copilot Coding Agent Guidelines

When Copilot is assigned an issue or asked to fix a problem:

### For Performance Issues
1. Check Application Insights for slow queries
2. Look for N+1 query patterns in Entity Framework
3. Add appropriate indexes or caching
4. Update load test thresholds if needed

### For Reliability Issues
1. Add retry policies using Polly
2. Implement circuit breaker patterns
3. Add health check endpoints
4. Create or update chaos experiments to validate fix

### For Build/Test Failures
1. Check test logs in GitHub Actions
2. Run tests locally to reproduce
3. Fix the root cause, not just symptoms
4. Add regression tests to prevent recurrence

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

Fixes #<issue-number>
```

Types: `fix`, `feat`, `perf`, `test`, `docs`, `refactor`, `ci`

## Environment-Specific Testing Best Practices

| Environment | Load Testing | Chaos Testing | Purpose |
|-------------|--------------|---------------|---------|
| QA | Quick (10 VUs, 60s) | Optional | Fast feedback |
| Staging | Full (50 VUs, 5min) | Required | Production gate |
| Production | Synthetic only | Controlled | Monitoring |

## Quick Commands

```bash
# Build locally
dotnet build src/ContosoUniversity.sln

# Run tests
dotnet test src/ContosoUniversity.Test/ContosoUniversity.Test.csproj

# Run locally
dotnet run --project src/ContosoUniversity.WebApplication

# Deploy infrastructure
az deployment group create -g <rg> -f infra/core/main.bicep
```
