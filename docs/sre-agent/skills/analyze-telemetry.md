---
name: analyze-telemetry
description: Skill for querying and analyzing Application Insights telemetry data to diagnose issues. Use for investigating errors, performance problems, and availability issues.
metadata:
  author: contoso-sre
  version: "1.0"
---

# Analyze Telemetry Skill

This skill enables the SRE Agent to query and analyze Application Insights telemetry for Contoso University.

## Data Sources

| Source | Resource | Purpose |
|--------|----------|---------|
| Application Insights | `appi-{env}` | Requests, dependencies, exceptions, traces |
| Log Analytics | `log-{env}` | App Service logs, custom logs |

## Available Queries

### 1. Exception Analysis

```kusto
// Recent exceptions with frequency
exceptions
| where timestamp > ago(1h)
| summarize 
    count = count(),
    lastSeen = max(timestamp)
  by type, outerMessage, problemId
| order by count desc
| take 20
```

### 2. Failed Requests

```kusto
// Failed requests by endpoint
requests
| where timestamp > ago(1h)
| where success == false
| summarize 
    failureCount = count(),
    avgDuration = avg(duration)
  by name, resultCode
| order by failureCount desc
```

### 3. Slow Requests

```kusto
// Requests exceeding SLA (2s)
requests
| where timestamp > ago(1h)
| where duration > 2000
| summarize 
    count = count(),
    avgDuration = avg(duration),
    p95Duration = percentile(duration, 95)
  by name
| order by avgDuration desc
```

### 4. Dependency Performance

```kusto
// Slow dependencies (SQL, HTTP)
dependencies
| where timestamp > ago(1h)
| summarize 
    avgDuration = avg(duration),
    p95Duration = percentile(duration, 95),
    callCount = count(),
    errorRate = countif(success == false) * 100.0 / count()
  by type, target, name
| order by avgDuration desc
```

### 5. Error Rate Trend

```kusto
// Error rate over time
requests
| where timestamp > ago(24h)
| summarize 
    totalRequests = count(),
    failedRequests = countif(success == false),
    errorRate = countif(success == false) * 100.0 / count()
  by bin(timestamp, 1h)
| order by timestamp desc
```

### 6. Availability

```kusto
// Availability percentage
requests
| where timestamp > ago(1h)
| summarize 
    availability = countif(success == true) * 100.0 / count()
```

### 7. Custom Events (Student Search)

```kusto
// Track search patterns
customEvents
| where timestamp > ago(24h)
| where name == "SearchStudent"
| extend filter = tostring(customDimensions.filter)
| summarize searchCount = count() by filter
| order by searchCount desc
```

## Usage Examples

### Investigate 500 Errors
```
1. Run "Failed Requests" query to identify affected endpoints
2. Run "Exception Analysis" query to find root cause
3. Check "Dependency Performance" for database issues
4. Review error trend to determine if ongoing or resolved
```

### Investigate Slow Performance
```
1. Run "Slow Requests" query to identify slow endpoints
2. Run "Dependency Performance" to find bottleneck
3. Check if SQL or HTTP dependencies are slow
4. Correlate with resource metrics (CPU, Memory)
```

## Output Format

When analyzing telemetry, produce:

```markdown
## Telemetry Analysis

**Time Range**: [Start] to [End]
**Environment**: {env}

### Summary
- **Total Requests**: X
- **Error Rate**: X%
- **Avg Response Time**: Xms
- **p95 Response Time**: Xms

### Issues Found
| Issue | Severity | Count | Affected Endpoint |
|-------|----------|-------|-------------------|
| [Issue] | [Sev] | [N] | [Endpoint] |

### Root Cause Indicators
[Analysis of what the data suggests]

### Recommended Actions
1. [Action 1]
2. [Action 2]
```
