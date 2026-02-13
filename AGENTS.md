# Contoso University - Agent Instructions

You are an AI coding agent working on the Contoso University application. This file provides context to help you complete tasks efficiently.

## Repository Overview

**Type**: .NET 6 MVC Web Application with Azure SQL backend  
**Purpose**: Educational institution management (students, courses, instructors)  
**Cloud**: Azure App Service, Azure SQL Database, Application Insights

## Directory Structure

```
contoso-resilience-demo/
├── .github/
│   ├── copilot-instructions.md   # Detailed coding guidelines
│   ├── prompts/                   # Reusable prompt templates
│   ├── skills/                    # Agent skill definitions
│   └── workflows/                 # CI/CD pipelines
├── src/
│   ├── ContosoUniversity.WebApplication/  # Main MVC app
│   ├── ContosoUniversity.API/             # REST API
│   ├── ContosoUniversity.Data/            # Data access layer
│   └── ContosoUniversity.Test/            # Unit tests
├── infra/
│   ├── core/                      # Azure infrastructure (Bicep)
│   ├── chaos/                     # Chaos Studio experiments
│   └── monitoring/                # Dashboards and alerts
└── loadtests/                     # Azure Load Testing (JMeter)
```

## Build Commands

Always validate changes with these commands:

```bash
# Restore and build
dotnet restore src/ContosoUniversity.sln
dotnet build src/ContosoUniversity.sln --configuration Release

# Run unit tests
dotnet test src/ContosoUniversity.Test/ContosoUniversity.Test.csproj --configuration Release

# Run locally (requires SQL connection string in environment)
dotnet run --project src/ContosoUniversity.WebApplication
```

## Key Files

| File | Purpose |
|------|---------|
| `src/ContosoUniversity.WebApplication/Program.cs` | Application entry point |
| `src/ContosoUniversity.Data/SchoolContext.cs` | EF Core database context |
| `loadtests/config.yaml` | Azure Load Testing configuration |
| `infra/core/main.bicep` | Infrastructure as Code |
| `.github/workflows/resilience-pipeline.yml` | Main CI/CD pipeline |

## When Fixing Issues

1. **Reproduce first**: Understand the issue before changing code
2. **Add tests**: Create a failing test that reproduces the bug
3. **Fix root cause**: Don't just mask symptoms
4. **Validate fix**: Run the full test suite
5. **Document**: Add comments explaining non-obvious fixes

## Code Style

- Use async/await for all I/O operations
- Use dependency injection (constructor injection)
- Follow C# naming conventions (PascalCase for public, _camelCase for private)
- Use nullable reference types
- Add XML documentation for public APIs

## Error Handling

```csharp
// Preferred: Use Polly for transient failures
services.AddHttpClient<IExternalService>()
    .AddTransientHttpErrorPolicy(p => 
        p.WaitAndRetryAsync(3, attempt => 
            TimeSpan.FromSeconds(Math.Pow(2, attempt))));
```

## Testing

- Unit tests in `ContosoUniversity.Test/`
- Use xUnit with FluentAssertions
- Mock external dependencies
- Test both success and failure paths

## Deployment

This repository uses GitHub Actions with the following environments:
- **QA**: Quick validation, lightweight tests
- **Staging**: Full load testing, chaos experiments
- **Production**: Slot swap from staging, synthetic monitoring

Load tests must pass before production deployment (deployment gate).

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| SQL timeout | Add retry policy with Polly |
| Memory leak | Check for undisposed DbContext |
| Slow queries | Add indexes, use `.AsNoTracking()` |
| Health check fails | Check database connectivity |
