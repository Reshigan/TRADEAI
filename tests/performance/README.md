# Performance Testing Suite - TradeAI

**Framework:** Artillery 2.0  
**Test Type:** Load, Stress, Spike, and Endurance Testing  
**Target:** https://tradeai.gonxt.tech  
**Created:** Feature 7.7 - Phase 5  

---

## 📋 Table of Contents

- [Overview](#overview)
- [Test Scenarios](#test-scenarios)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Test Configurations](#test-configurations)
- [Performance Metrics](#performance-metrics)
- [Interpreting Results](#interpreting-results)
- [Performance SLAs](#performance-slas)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## 🎯 Overview

This performance testing suite validates the TradeAI system's ability to handle various load conditions, from normal operation to extreme stress. The tests simulate realistic user behavior patterns and measure system performance under different scenarios.

### Test Types

1. **Load Tests** - Measure performance under expected load
2. **Stress Tests** - Find the breaking point
3. **Spike Tests** - Test sudden traffic surges
4. **Soak Tests** - Validate long-term stability

### Key Capabilities

- ✅ Realistic user workflows (authentication, dashboard navigation)
- ✅ Multiple concurrent user simulation
- ✅ Performance threshold validation
- ✅ Comprehensive metrics collection
- ✅ HTML and JSON reporting
- ✅ CI/CD integration ready

---

## 📊 Test Scenarios

### 1. Baseline Load Test (`load-test-baseline.yml`)

**Purpose:** Establish performance baseline with minimal load

**Configuration:**
- Users: 10 concurrent users
- Duration: 4.5 minutes (270 seconds)
- Phases: Warm-up (1 min) → Baseline (3 min) → Ramp down (30 sec)

**Test Scenarios:**
- Website home page access (20%)
- API health checks (30%)
- ML service health checks (20%)
- Authentication flow (15%)
- AI dashboard data flow (15%)

**Performance Thresholds:**
- Error Rate: < 1%
- P95 Latency: < 2 seconds
- P99 Latency: < 5 seconds

**Use Case:** Daily smoke test, regression testing baseline

---

### 2. Moderate Load Test (`load-test-100-users.yml`)

**Purpose:** Test system under typical production load

**Configuration:**
- Users: 100 concurrent users at peak
- Duration: 13 minutes (780 seconds)
- Phases: Warm-up (2 min) → Ramp up (3 min) → Sustained (5 min) → Ramp down (2 min)

**Test Scenarios:**
- Homepage and static assets (25%)
- API health monitoring (15%)
- User authentication (20%)
- AI Dashboard workflows:
  - Demand Forecast (12%)
  - Price Optimization (12%)
  - Customer Segmentation (8%)
  - Full Dashboard Load (8%)

**Performance Thresholds:**
- Error Rate: < 2%
- P95 Latency: < 3 seconds
- P99 Latency: < 8 seconds

**Use Case:** Pre-release performance validation, typical usage scenarios

---

### 3. High Load Test (`load-test-500-users.yml`)

**Purpose:** Test system capacity under high concurrent load

**Configuration:**
- Users: 500 concurrent users at peak
- Duration: 16 minutes (960 seconds)
- Phases: Warm-up (2 min) → Ramp stage 1 (3 min) → Ramp stage 2 (3 min) → Sustained (5 min) → Ramp down (2 min)

**Test Scenarios:**
- Quick health checks (30%)
- Homepage access (25%)
- Fast authentication (20%)
- Single AI widget load (15%)
- Full dashboard load (10%)

**Performance Thresholds:**
- Error Rate: < 5%
- P95 Latency: < 5 seconds
- P99 Latency: < 15 seconds

**Use Case:** Capacity planning, peak traffic simulation

---

### 4. Stress Test (`stress-test.yml`)

**Purpose:** Find the system's breaking point by gradually increasing load

**Configuration:**
- Users: 50 → 1500 users (incremental stages)
- Duration: 18 minutes (1080 seconds)
- Stages: 50, 100, 200, 400, 600, 800, 1000, 1500 users
- Each stage: 2 minutes

**Test Scenarios:**
- Health check only (40%)
- ML health check (30%)
- Auth + single request (20%)
- Homepage load (10%)

**Performance Thresholds:**
- Error Rate: < 10% (relaxed for stress test)

**Use Case:** Capacity planning, infrastructure sizing, failure point identification

**Expected Outcome:** System should degrade gracefully, not crash

---

### 5. Spike Test (`spike-test.yml`)

**Purpose:** Test system response to sudden traffic surges

**Configuration:**
- Users: 20 → 500 → 20 → 800 → 10
- Duration: 7 minutes (420 seconds)
- Pattern: Normal → Spike 1 → Recovery → Spike 2 → Final recovery

**Test Scenarios:**
- Quick API check (35%)
- Homepage access (30%)
- Authentication flow (20%)
- AI data request (15%)

**Performance Thresholds:**
- Error Rate: < 5%
- P95 Latency: < 6 seconds
- P99 Latency: < 20 seconds

**Use Case:** Marketing campaign launches, viral events, auto-scaling validation

**Expected Behavior:** System should handle spikes without crashing and recover quickly

---

### 6. Soak/Endurance Test (`soak-test.yml`)

**Purpose:** Validate system stability over extended duration

**Configuration:**
- Users: 50 concurrent users
- Duration: 38 minutes (2280 seconds)
- Phases: Ramp up (5 min) → Soak (30 min) → Ramp down (3 min)

**Test Scenarios:**
- Homepage access pattern (20%)
- API health monitoring (15%)
- Realistic user session - authentication (25%)
- Realistic user session - dashboard browsing (40%)

**Performance Thresholds:**
- Error Rate: < 1%
- P95 Latency: < 2.5 seconds
- P99 Latency: < 6 seconds

**Use Case:** Memory leak detection, resource exhaustion testing, long-term stability

**What to Watch For:**
- Gradual performance degradation
- Memory leaks
- Connection pool exhaustion
- Database connection issues

---

## 🚀 Installation

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Network access to https://tradeai.gonxt.tech

### Install Artillery

From the project root:

```bash
npm install --save-dev --legacy-peer-deps artillery artillery-plugin-expect
```

Or install globally:

```bash
npm install -g artillery
```

### Verify Installation

```bash
artillery --version
# Should output: 2.0.x
```

---

## 🎮 Running Tests

### Run Individual Tests

**Baseline Load Test (10 users):**
```bash
artillery run tests/performance/load-test-baseline.yml
```

**Moderate Load Test (100 users):**
```bash
artillery run tests/performance/load-test-100-users.yml
```

**High Load Test (500 users):**
```bash
artillery run tests/performance/load-test-500-users.yml
```

**Stress Test (up to 1500 users):**
```bash
artillery run tests/performance/stress-test.yml
```

**Spike Test:**
```bash
artillery run tests/performance/spike-test.yml
```

**Soak Test (30 minutes):**
```bash
artillery run tests/performance/soak-test.yml
```

---

### Generate HTML Reports

**Run test with HTML report:**
```bash
artillery run \
  --output report.json \
  tests/performance/load-test-baseline.yml

artillery report report.json
```

This generates `report.json.html` with:
- Request rate graphs
- Response time percentiles
- Error rate charts
- Scenario completion rates

**Open the report:**
```bash
open report.json.html  # macOS
xdg-open report.json.html  # Linux
start report.json.html  # Windows
```

---

### Run Tests in Quiet Mode

```bash
artillery run -q tests/performance/load-test-baseline.yml
```

---

### Override Target URL

Test against different environments:

```bash
artillery run \
  --target https://staging.tradeai.gonxt.tech \
  tests/performance/load-test-baseline.yml
```

---

### Run with Custom Variables

```bash
artillery run \
  -v '{ "testEmail": "test@example.com", "testPassword": "Test123" }' \
  tests/performance/load-test-baseline.yml
```

---

## 📈 Performance Metrics

Artillery collects and reports the following metrics:

### Request Metrics

| Metric | Description |
|--------|-------------|
| **http.requests** | Total number of requests sent |
| **http.responses** | Total number of responses received |
| **http.response_time** | Response time distribution (min, max, median, p95, p99) |
| **http.codes.xxx** | Count of HTTP status codes (200, 404, 500, etc.) |

### Performance Percentiles

| Percentile | Meaning | Target (Baseline) |
|------------|---------|-------------------|
| **p50 (median)** | 50% of requests faster than this | < 500ms |
| **p95** | 95% of requests faster than this | < 2s |
| **p99** | 99% of requests faster than this | < 5s |

### Error Metrics

| Metric | Description | Acceptable Range |
|--------|-------------|------------------|
| **Error Rate** | % of failed requests | < 1% (baseline), < 5% (stress) |
| **Timeout Rate** | % of requests that timed out | < 0.5% |

### Scenario Metrics

| Metric | Description |
|--------|-------------|
| **scenarios.launched** | Number of virtual users created |
| **scenarios.completed** | Number of scenarios completed successfully |
| **scenarios.failed** | Number of scenarios that failed |

---

## 🔍 Interpreting Results

### Sample Output

```
--------------------------------
Summary report @ 19:30:15(+0000)
--------------------------------

http.codes.200: ........................... 4532
http.codes.401: ........................... 12
http.request_rate: ........................ 75/sec
http.requests: ............................ 4544
http.response_time:
  min: .................................... 42
  max: .................................... 3421
  median: ................................. 156
  p95: .................................... 892
  p99: .................................... 1523
http.responses: ........................... 4544
scenarios.completed: ...................... 1136
scenarios.launched: ....................... 1136
vusers.completed: ......................... 1136
vusers.created: ........................... 1136
vusers.created_by_name.Website Home Page: . 227
vusers.created_by_name.API Health Check: .. 341
```

### What to Look For

#### ✅ Good Signs

- Error rate < 1% for normal load
- P95 response time < 2 seconds
- All scenarios completed successfully
- Stable memory usage over time (soak test)
- Quick recovery after spike

#### ⚠️ Warning Signs

- Error rate 1-5%
- P95 response time 2-5 seconds
- Some scenarios failing (< 5%)
- Gradual response time increase (soak test)
- Slow recovery after spike (> 2 minutes)

#### ❌ Critical Issues

- Error rate > 5%
- P95 response time > 5 seconds
- Many scenarios failing (> 10%)
- Response time continuously increasing
- System not recovering after spike
- HTTP 500/502/503 errors

---

## 📊 Performance SLAs

### Production SLAs (Service Level Agreements)

| User Load | P95 Response Time | P99 Response Time | Error Rate | Availability |
|-----------|-------------------|-------------------|------------|--------------|
| **Light (< 50 users)** | < 1s | < 2s | < 0.5% | 99.9% |
| **Normal (50-200 users)** | < 2s | < 4s | < 1% | 99.5% |
| **High (200-500 users)** | < 3s | < 8s | < 2% | 99% |
| **Peak (500+ users)** | < 5s | < 15s | < 5% | 95% |

### Endpoint-Specific SLAs

| Endpoint | Target Response Time (P95) |
|----------|----------------------------|
| `/` (Homepage) | < 500ms |
| `/api/health` | < 100ms |
| `/ml/health` | < 200ms |
| `/api/auth/login` | < 800ms |
| `/api/ai/forecast/demand` | < 2s |
| `/api/ai/optimize/price` | < 2s |
| `/api/ai/segment/customers` | < 1.5s |
| `/api/ai/detect/anomalies` | < 2s |
| `/api/ai/models/health` | < 500ms |

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM
  workflow_dispatch:      # Manual trigger

jobs:
  performance-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install --legacy-peer-deps
      
      - name: Run Baseline Load Test
        run: |
          artillery run \
            --output baseline-report.json \
            tests/performance/load-test-baseline.yml
      
      - name: Generate HTML Report
        if: always()
        run: artillery report baseline-report.json
      
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: |
            baseline-report.json
            baseline-report.json.html
      
      - name: Check Performance Thresholds
        run: |
          # Extract error rate from report
          ERROR_RATE=$(cat baseline-report.json | jq '.aggregate.counters."errors.ETIMEDOUT" // 0')
          if [ $ERROR_RATE -gt 10 ]; then
            echo "Error rate too high: $ERROR_RATE"
            exit 1
          fi
```

### GitLab CI Example

```yaml
performance_tests:
  stage: test
  image: node:18
  script:
    - npm install --legacy-peer-deps
    - artillery run --output report.json tests/performance/load-test-baseline.yml
    - artillery report report.json
  artifacts:
    paths:
      - report.json
      - report.json.html
    expire_in: 7 days
  only:
    - schedules
    - master
```

---

## 🐛 Troubleshooting

### Issue: Connection Timeout Errors

**Symptoms:**
```
ETIMEDOUT errors
http.codes.ETIMEDOUT: 45
```

**Solutions:**
1. Increase timeout in config:
   ```yaml
   config:
     timeout: 60  # Increase from 30 to 60 seconds
   ```

2. Check server capacity - may be overloaded

3. Check network connectivity to target server

---

### Issue: High Error Rate (HTTP 500/502/503)

**Symptoms:**
```
http.codes.500: 234
http.codes.502: 89
```

**Solutions:**
1. Check server logs for errors
2. Reduce load (lower arrivalRate)
3. Check database connection pool
4. Verify PM2 process is running
5. Check nginx error logs

---

### Issue: Artillery Process Crashes

**Symptoms:**
```
FATAL ERROR: JavaScript heap out of memory
```

**Solutions:**
1. Increase Node.js memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" artillery run test.yml
   ```

2. Reduce connection pool size in config:
   ```yaml
   config:
     http:
       pool: 100  # Reduce from 500
   ```

---

### Issue: Unrealistic Response Times

**Symptoms:**
- P95 < 10ms (too fast)
- All requests same response time

**Solutions:**
1. Check if responses are cached
2. Verify test is hitting correct endpoint
3. Check if load balancer is returning cached responses
4. Add `Cache-Control: no-cache` headers

---

### Issue: Authentication Failures

**Symptoms:**
```
http.codes.401: 450
```

**Solutions:**
1. Verify test credentials are correct
2. Check token expiration time
3. Ensure JWT secret is consistent
4. Verify user exists in database

---

## ✅ Best Practices

### 1. Start Small, Scale Gradually

- Always run baseline test first
- Don't jump directly to stress test
- Validate system is healthy before high-load tests

### 2. Test in Isolation

- Run one test at a time
- Ensure no other load on system
- Clear caches between tests

### 3. Monitor Server Resources

While running tests, monitor:
- CPU usage (`top`, `htop`)
- Memory usage
- Network I/O
- Disk I/O
- Database connections

### 4. Collect Logs

Capture logs during tests:
```bash
# Before test
ssh server "sudo journalctl -u nginx -f" > nginx.log &
ssh server "pm2 logs --lines 1000" > backend.log &

# Run test
artillery run test.yml

# Stop log collection
kill %1 %2
```

### 5. Test Different Scenarios

- Peak hours vs. off-hours
- Different user types (admin vs. regular user)
- Different data sizes
- Different workflows

### 6. Document Results

- Keep performance test results over time
- Track performance trends
- Document any changes that affected performance
- Create performance baseline for each release

### 7. Test Realistic Scenarios

- Include think time (user pauses)
- Mix different user behaviors
- Use realistic data volumes
- Test actual user workflows

### 8. Set Up Alerts

Configure monitoring alerts for:
- Error rate > 1%
- Response time > 3 seconds
- CPU > 80%
- Memory > 90%
- Disk > 85%

---

## 📁 Test Files Summary

| File | Purpose | Users | Duration | Use Case |
|------|---------|-------|----------|----------|
| `load-test-baseline.yml` | Baseline performance | 10 | 4.5 min | Daily smoke test |
| `load-test-100-users.yml` | Typical production load | 100 | 13 min | Pre-release validation |
| `load-test-500-users.yml` | High concurrent load | 500 | 16 min | Capacity planning |
| `stress-test.yml` | Find breaking point | 50-1500 | 18 min | Infrastructure sizing |
| `spike-test.yml` | Sudden traffic surge | 20-800 | 7 min | Auto-scaling validation |
| `soak-test.yml` | Long-term stability | 50 | 38 min | Memory leak detection |

---

## 🎯 Next Steps

1. **Run Baseline Test** - Establish current performance
2. **Document Results** - Create performance baseline document
3. **Set Up Monitoring** - Configure Grafana/Prometheus
4. **Schedule Regular Tests** - Add to CI/CD pipeline
5. **Optimize Performance** - Address bottlenecks found
6. **Retest** - Validate improvements

---

## 📚 Additional Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [Performance Testing Best Practices](https://www.artillery.io/docs/guides/guides/test-script-basics)
- [HTTP Load Testing](https://www.artillery.io/docs/guides/guides/http-reference)
- [CI/CD Integration](https://www.artillery.io/docs/guides/integration-guides/github-actions)

---

## 📞 Support

For issues or questions:
- Create an issue in the repository
- Contact the DevOps team
- Refer to Artillery documentation

---

**Document Version:** 1.0.0  
**Last Updated:** November 7, 2025  
**Maintained By:** TradeAI Development Team  
**Feature:** F7.7 - Phase 5 (Performance Testing)
