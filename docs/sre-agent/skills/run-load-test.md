---
name: run-load-test
description: Skill for creating and executing Azure Load Tests to validate performance and identify bottlenecks. Integrates with the existing load testing infrastructure.
metadata:
  author: contoso-sre
  version: "1.0"
---

# Run Load Test Skill

This skill enables the SRE Agent to run Azure Load Tests against Contoso University to validate performance after fixes or before deployments.

## Load Testing Infrastructure

| Component | Location |
|-----------|----------|
| Azure Load Testing Resource | `lt-{env}` |
| Config File | `loadtests/config.yaml` |
| JMeter Templates | `loadtests/templates/*.jmx` |
| Test Manifest | `loadtests/manifest.yaml` |

## Test Profiles

| Profile | Users | Ramp-Up | Duration | Use Case |
|---------|-------|---------|----------|----------|
| `smoke` | 5 | 10s | 60s | Quick validation after fix |
| `load` | 50 | 60s | 300s | Pre-production gate |
| `stress` | 200 | 120s | 600s | Find breaking points |
| `chaos` | 30 | 30s | 900s | During chaos experiments |

## Pass/Fail Criteria

From `loadtests/config.yaml`:

```yaml
failureCriteria:
  - avg(response_time_ms) > 2000        # Average response < 2s
  - percentage(error) > 1                # Error rate < 1%
  - p95(response_time_ms) > 3000         # 95th percentile < 3s
  - p99(response_time_ms) > 5000         # 99th percentile < 5s
```

## Endpoints Tested

The standard test template (`templates/http-test.jmx`) covers:

| Endpoint | Description |
|----------|-------------|
| `/` | Homepage |
| `/Students` | Student list |
| `/Students?SearchString=...` | Student search |
| `/Courses` | Course catalog |
| `/Courses/Details/1` | Course details |
| `/Departments` | Department list |
| `/Departments/Details?id=1` | Department details |
| `/Instructors` | Instructor list |
| `/Instructors/Details?id=...` | Instructor details |

## Running Tests

### Via Azure CLI

```bash
# Create a test run (smoke profile)
az load test-run create \
    --load-test-resource lt-{env} \
    --resource-group rg-{env} \
    --test-id contoso-university-load-test \
    --display-name "SRE-Agent-Validation-$(date +%Y%m%d-%H%M%S)" \
    --env host={env}-app.azurewebsites.net

# Check test run status
az load test-run show \
    --load-test-resource lt-{env} \
    --resource-group rg-{env} \
    --test-run-id {test-run-id}

# List recent test runs
az load test-run list \
    --load-test-resource lt-{env} \
    --resource-group rg-{env} \
    --test-id contoso-university-load-test
```

### Via GitHub Actions

Trigger the load test workflow manually:

```bash
gh workflow run load-test.yml \
    --ref main \
    -f environment=staging \
    -f profile=smoke
```

## When to Run Tests

| Scenario | Profile | Approval |
|----------|---------|----------|
| After code fix deployed | `smoke` | Autonomous |
| Before production swap | `load` | Review Required |
| Investigating performance | `load` | Review Required |
| Capacity planning | `stress` | Review Required |
| During chaos experiment | `chaos` | Review Required |

## Interpreting Results

### Successful Test
```
✅ avg(response_time_ms): 450ms (< 2000ms)
✅ percentage(error): 0.2% (< 1%)
✅ p95(response_time_ms): 1200ms (< 3000ms)
✅ p99(response_time_ms): 2100ms (< 5000ms)

Result: PASSED
```

### Failed Test
```
❌ avg(response_time_ms): 2500ms (> 2000ms threshold)
✅ percentage(error): 0.5% (< 1%)
❌ p95(response_time_ms): 4200ms (> 3000ms threshold)
❌ p99(response_time_ms): 6800ms (> 5000ms threshold)

Result: FAILED
- Investigate slow responses
- Check database performance
- Consider scaling resources
```

## Correlating with App Insights

After running a load test, query Application Insights:

```kusto
// Performance during test window
requests
| where timestamp between(datetime({test_start}) .. datetime({test_end}))
| summarize 
    avg_duration = avg(duration),
    p95_duration = percentile(duration, 95),
    error_rate = countif(success == false) * 100.0 / count(),
    throughput = count()
  by name, bin(timestamp, 1m)
| order by timestamp asc
```

```kusto
// Dependency performance during test
dependencies
| where timestamp between(datetime({test_start}) .. datetime({test_end}))
| where type == "SQL"
| summarize 
    avg_duration = avg(duration),
    call_count = count()
  by name, bin(timestamp, 1m)
| order by timestamp asc
```

## Output Format

When running a load test, report:

```markdown
## Load Test Results

**Test ID**: {test_id}
**Profile**: {profile}
**Duration**: {duration}
**Target**: https://{env}-app.azurewebsites.net

### Summary
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Avg Response Time | Xms | < 2000ms | ✅/❌ |
| Error Rate | X% | < 1% | ✅/❌ |
| p95 Response Time | Xms | < 3000ms | ✅/❌ |
| p99 Response Time | Xms | < 5000ms | ✅/❌ |
| Throughput | X req/s | - | ℹ️ |

### Result: PASSED/FAILED

### Observations
{any_notable_patterns}

### Recommendations
{if_failed_provide_recommendations}
```

## Approval Levels

| Action | Approval |
|--------|----------|
| Run smoke test | Autonomous |
| Run load test | Review Required |
| Run stress test | Review Required |
| Modify test config | Review Required |
