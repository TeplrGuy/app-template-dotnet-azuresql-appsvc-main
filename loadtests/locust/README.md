# Locust Load Test for Azure Load Testing

This directory contains a Locust-based load test configured for Azure Load Testing.

## Test Configuration

| Parameter | Value |
|-----------|-------|
| **Test Name** | MCP-VS-LT-example |
| **Load Testing Resource** | lt-cntso-ecgs |
| **Subscription** | b6f10878-9f8a-4b3f-8bc5-3464cdd79c77 |
| **Target Endpoint** | https://cntso-ecgs-api.azurewebsites.net/api/courses/5 |
| **Virtual Users** | 5 |
| **Requests per Minute** | 300 |
| **Duration** | 3 minutes |

## Files

- **locustfile.py** - The Locust test script
- **config.yaml** - Azure Load Testing configuration

## How to Deploy to Azure Load Testing

### Option 1: Using Azure Portal

1. Navigate to your Azure Load Testing resource (`lt-cntso-ecgs`)
2. Click **Tests** > **Create** > **Upload a script**
3. Select **Locust** as the test type
4. Upload `locustfile.py`
5. Configure the test parameters:
   - **Number of users**: 5
   - **Spawn rate**: 5 (users per second)
   - **Run time**: 3m
6. Click **Review + create**

### Option 2: Using Azure CLI

```bash
# Create the test
az load test create \
    --load-test-resource lt-cntso-ecgs \
    --test-id mcp-vs-lt-example \
    --display-name "MCP-VS-LT-example" \
    --description "Locust load test - 5 VUs, 300 RPM, 3 minutes" \
    --test-plan locustfile.py \
    --test-type Locust \
    --env LOCUST_USERS=5 LOCUST_SPAWN_RATE=5 LOCUST_RUN_TIME=3m \
    --engine-instances 1

# Run the test
az load test-run create \
    --load-test-resource lt-cntso-ecgs \
    --test-id mcp-vs-lt-example \
    --test-run-id "run-$(date +%Y%m%d-%H%M%S)" \
    --display-name "Test Run $(date)"
```

### Option 3: Using Azure Developer CLI (azd)

```bash
# If you have azd configured
azd pipeline config
```

## Running Locally (for testing)

```bash
# Install Locust
pip install locust

# Run locally
locust -f locustfile.py --host=https://cntso-ecgs-api.azurewebsites.net -u 5 -r 5 -t 3m --headless
```

## Load Calculation

The test achieves **300 requests per minute** with:
- **5 virtual users**
- Each user sends **1 request per second** (using `constant_throughput(1)`)
- Total: 5 users × 60 seconds = **300 requests/minute**

## Expected Results

With 5 concurrent users hitting the `/api/courses/5` endpoint:
- Response times depend on your API's performance
- Monitor for errors and response time degradation
- Auto-stop triggers if error rate exceeds 90% for 60 seconds
