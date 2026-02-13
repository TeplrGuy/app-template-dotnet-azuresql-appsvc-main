---
name: create-github-pr
description: Skill for creating GitHub pull requests with code fixes and regression tests. Used by the Code Remediation Subagent to submit automated fixes.
metadata:
  author: contoso-sre
  version: "1.0"
---

# Create GitHub PR Skill

This skill enables the SRE Agent to create GitHub pull requests with code fixes for identified issues in Contoso University.

## Repository Information

| Property | Value |
|----------|-------|
| Repository | `contoso-university` |
| Default Branch | `main` |
| Source Directory | `src/` |
| Test Directory | `src/ContosoUniversity.Test/` |

## Branch Naming Convention

```
fix/sre-agent-{incident_id}
```

Example: `fix/sre-agent-INC001234`

## Pull Request Workflow

### 1. Create Fix Branch

```bash
# Create branch from main
git checkout main
git pull origin main
git checkout -b fix/sre-agent-{incident_id}
```

### 2. Make Code Changes

Apply the minimal fix to address the identified issue. Follow these principles:
- Fix only the identified issue
- Don't refactor unrelated code
- Add appropriate logging
- Maintain backward compatibility

### 3. Add Regression Test

Create or update tests to prevent regression:
- Unit test that reproduces the issue
- Unit test that verifies the fix works

### 4. Create Pull Request

Use this template:

```markdown
## Automated Fix by SRE Agent

**Incident ID**: {incident_id}
**Detected**: {timestamp}
**Severity**: {severity}

### Problem
{error_description}

Stack trace:
```
{stack_trace}
```

### Root Cause
{root_cause_analysis}

### Fix Applied
{fix_description}

### Files Changed
| File | Change Type | Description |
|------|-------------|-------------|
| `{file_path}` | Modified | {change_description} |

### Testing
- [ ] Unit tests added/updated
- [ ] All existing tests pass
- [ ] Manually verified fix works

### Verification After Merge
Monitor these metrics for 1 hour after deployment:
- Error rate in Application Insights
- Response times for affected endpoints
- Health check status

### Rollback Plan
If issues occur after deployment:
1. Revert this PR: `git revert {commit_hash}`
2. Deploy from staging slot: `az webapp deployment slot swap ...`
3. Create follow-up incident for investigation

---
*This PR was automatically created by Azure SRE Agent*
*Incident: {incident_id}*
```

## Common Fix Patterns

### Add Retry Logic

**Files to modify**: `src/ContosoUniversity.API/Program.cs`

```csharp
// Before
options.UseSqlServer(connectionString);

// After
options.UseSqlServer(connectionString, sqlOptions =>
{
    sqlOptions.EnableRetryOnFailure(
        maxRetryCount: 5,
        maxRetryDelay: TimeSpan.FromSeconds(30),
        errorNumbersToAdd: null);
});
```

### Add Null Check

**Files to modify**: Controller files

```csharp
// Before
return Ok(entity);

// After
if (entity == null)
{
    return NotFound($"Resource with ID {id} not found");
}
return Ok(entity);
```

### Add Circuit Breaker

**Files to modify**: `src/ContosoUniversity.WebApplication/Program.cs`

**Package to add**: `Microsoft.Extensions.Http.Polly`

```csharp
builder.Services.AddHttpClient("client", client =>
{
    client.BaseAddress = new Uri(apiAddress);
})
.AddTransientHttpErrorPolicy(p => 
    p.CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));
```

### Optimize Query

**Files to modify**: Controller files in `src/ContosoUniversity.API/Controllers/`

```csharp
// Before
var items = _context.Entity.ToList();

// After
var items = _context.Entity
    .AsNoTracking()
    .ToListAsync();
```

## Regression Test Template

**File**: `src/ContosoUniversity.Test/{Feature}Test.cs`

```csharp
using Xunit;

namespace ContosoUniversity.Test
{
    public class {Feature}FixTest
    {
        [Fact]
        public async Task {MethodName}_ShouldHandleError_WhenConditionOccurs()
        {
            // Arrange
            // Set up test data that reproduces the issue
            
            // Act
            // Execute the code path that was failing
            
            // Assert
            // Verify the fix works correctly
        }
        
        [Fact]
        public async Task {MethodName}_ShouldStillWork_ForNormalCase()
        {
            // Arrange
            // Set up normal test data
            
            // Act
            // Execute the normal code path
            
            // Assert
            // Verify normal behavior is unchanged
        }
    }
}
```

## Labels to Apply

| Label | When to Use |
|-------|-------------|
| `sre-agent` | All automated PRs |
| `automated-fix` | Code fixes |
| `incident-response` | Incident-related fixes |
| `performance` | Performance improvements |
| `reliability` | Reliability improvements |

## Reviewers

Assign to:
- `@oncall-team` - For immediate review
- Code owners based on files changed

## Approval Levels

| Action | Approval |
|--------|----------|
| Create branch | Autonomous |
| Commit changes | Autonomous |
| Create PR | Autonomous |
| Add tests | Autonomous |
| Merge PR | **Human approval required** |

## Validation Before PR

Run these checks before creating PR:

```bash
# Build
dotnet build src/ContosoUniversity.sln

# Run tests
dotnet test src/ContosoUniversity.Test/ContosoUniversity.Test.csproj

# Verify no syntax errors
dotnet format --verify-no-changes
```

## Output Format

When creating a PR, report:

```markdown
## GitHub PR Created

**PR Number**: #{pr_number}
**Branch**: fix/sre-agent-{incident_id}
**URL**: {pr_url}

### Changes
{summary_of_changes}

### Status
- [x] Branch created
- [x] Code fix applied
- [x] Tests added
- [x] PR created
- [ ] Awaiting review

### Next Steps
1. PR requires human approval to merge
2. After merge, monitor Application Insights
3. Verify fix in production
```
