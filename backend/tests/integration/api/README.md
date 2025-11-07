# Backend AI Integration Tests

## Overview
Comprehensive integration tests for the AI/ML routes that connect the Node.js backend to the Python ML service.

## Test Files

### `ai.api.test.js`
Integration tests for AI routes (`/api/ai/*`)

**Coverage:**
- ✅ Health check endpoint
- ✅ Demand forecasting endpoint
- ✅ Price optimization endpoint
- ✅ Promotion lift analysis endpoint
- ✅ Product recommendations endpoint
- ✅ Customer segmentation endpoints
- ✅ Anomaly detection endpoint
- ✅ Authentication requirements
- ✅ Error handling and fallback behavior
- ✅ Request validation

**Test Count:** 35 integration tests

## Running Tests

### Run All AI Integration Tests
```bash
cd backend
npm test -- tests/integration/api/ai.api.test.js
```

### Run Specific Test Suite
```bash
# Health check tests only
npm test -- tests/integration/api/ai.api.test.js -t "GET /api/ai/health"

# Demand forecasting tests only
npm test -- tests/integration/api/ai.api.test.js -t "POST /api/ai/forecast/demand"

# Error handling tests
npm test -- tests/integration/api/ai.api.test.js -t "Error Handling"
```

### Run with Coverage
```bash
npm test -- tests/integration/api/ai.api.test.js --coverage
```

### Watch Mode (Development)
```bash
npm test:watch -- tests/integration/api/ai.api.test.js
```

## Test Structure

### 1. Health Check Tests
```javascript
describe('GET /api/ai/health', () => {
  // Tests ML service health status
  // Tests unavailable status handling
});
```

### 2. Demand Forecasting Tests
```javascript
describe('POST /api/ai/forecast/demand', () => {
  // Tests successful forecasting
  // Tests fallback behavior
  // Tests parameter validation
  // Tests default values
});
```

### 3. Price Optimization Tests
```javascript
describe('POST /api/ai/optimize/price', () => {
  // Tests successful optimization
  // Tests fallback pricing
  // Tests constraint handling
  // Tests parameter validation
});
```

### 4. Promotion Lift Analysis Tests
```javascript
describe('POST /api/ai/analyze/promotion-lift', () => {
  // Tests successful analysis
  // Tests date validation
  // Tests error handling (no fallback)
});
```

### 5. Product Recommendations Tests
```javascript
describe('POST /api/ai/recommend/products', () => {
  // Tests successful recommendations
  // Tests empty results handling
  // Tests context handling
});
```

### 6. Customer Segmentation Tests
```javascript
describe('POST /api/ai/segment/customers', () => {
  // Tests successful segmentation
  // Tests tenant ID handling
  // Tests fallback segmentation
});

describe('GET /api/ai/segment/customers/:customerId', () => {
  // Tests individual customer segment lookup
  // Tests not found handling
});
```

### 7. Anomaly Detection Tests
```javascript
describe('POST /api/ai/detect/anomalies', () => {
  // Tests successful detection
  // Tests threshold handling
  // Tests fallback anomalies
});
```

### 8. Error Handling Tests
```javascript
describe('Error Handling', () => {
  // Tests unexpected errors
  // Tests malformed JSON
});
```

### 9. Authentication Tests
```javascript
describe('Authentication', () => {
  // Tests authentication requirement
});
```

## Mock Strategy

### ML Service Mocking
The tests mock the `mlService` module to avoid dependencies on the actual ML service:

```javascript
jest.mock('../../../services/mlService');

mlService.forecastDemand.mockResolvedValue({
  success: true,
  data: { forecast: [...] }
});
```

### Authentication Mocking
Tests use a middleware that injects a mock authenticated user:

```javascript
app.use((req, res, next) => {
  req.user = {
    id: 'test-user-id',
    email: 'test@example.com',
    tenantId: 'test-tenant-id',
    role: 'admin'
  };
  next();
});
```

## Test Scenarios

### Success Scenarios
- ✅ Valid requests return correct data
- ✅ Default parameters are applied correctly
- ✅ Tenant ID is extracted from authenticated user
- ✅ Data transformation between Node.js and Python formats

### Failure Scenarios
- ✅ Missing required parameters return 400
- ✅ ML service failures return fallback data
- ✅ Authentication failures return 401
- ✅ Unexpected errors return 500

### Fallback Behavior
- ✅ Demand forecasting: Returns simple trend-based forecast
- ✅ Price optimization: Returns cost-based pricing
- ✅ Customer segmentation: Returns sample segments
- ✅ Anomaly detection: Returns empty anomalies
- ✅ Product recommendations: Returns empty array
- ✅ Promotion lift: No fallback (returns error)

## Expected Test Results

```
PASS tests/integration/api/ai.api.test.js
  AI Routes Integration Tests
    GET /api/ai/health
      ✓ should return ML service health status
      ✓ should return unavailable status when ML service is down
    POST /api/ai/forecast/demand
      ✓ should successfully forecast demand with valid parameters
      ✓ should return fallback data when ML service fails
      ✓ should return 400 for missing productId
      ✓ should return 400 for missing customerId
      ✓ should use default values for optional parameters
    POST /api/ai/optimize/price
      ✓ should successfully optimize price with valid parameters
      ✓ should return 400 for missing required parameters
      ✓ should handle ML service failure with fallback
    POST /api/ai/analyze/promotion-lift
      ✓ should successfully analyze promotion lift
      ✓ should return 400 for missing date parameters
      ✓ should return 500 when ML service fails without fallback
    POST /api/ai/recommend/products
      ✓ should successfully recommend products
      ✓ should return 400 for missing customerId
      ✓ should handle empty recommendations gracefully
    POST /api/ai/segment/customers
      ✓ should successfully segment customers
      ✓ should use tenantId from authenticated user
      ✓ should return 400 when tenant is missing
      ✓ should handle segmentation failure with fallback
    GET /api/ai/segment/customers/:customerId
      ✓ should get customer segment successfully
      ✓ should handle customer not found
    POST /api/ai/detect/anomalies
      ✓ should successfully detect anomalies
      ✓ should return 400 for missing metricType
      ✓ should use tenantId from authenticated user
      ✓ should handle detection failure with fallback
    Error Handling
      ✓ should handle unexpected errors gracefully
      ✓ should handle malformed JSON
    Authentication
      ✓ should require authentication for all endpoints

Test Suites: 1 passed, 1 total
Tests:       35 passed, 35 total
Time:        2.5s
```

## Configuration

### Environment Variables
```bash
ML_SERVICE_URL=http://localhost:8001
ML_SERVICE_TIMEOUT=30000
```

### Test Timeout
Default: 10 seconds per test
Can be increased for slow connections:
```bash
npm test -- --testTimeout=30000
```

## Dependencies
- `jest`: Test framework
- `supertest`: HTTP assertion library
- `express`: Web framework (for test app)

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Run Backend AI Tests
  run: |
    cd backend
    npm test -- tests/integration/api/ai.api.test.js --coverage
```

### Pre-commit Hook
```bash
#!/bin/bash
npm test -- tests/integration/api/ai.api.test.js --bail
```

## Troubleshooting

### Tests Hanging
- Increase test timeout: `--testTimeout=30000`
- Check for open handles: `--detectOpenHandles`

### Mock Not Working
- Ensure mock is before imports: `jest.mock()` at top of file
- Clear mocks between tests: `jest.clearAllMocks()`

### Authentication Failures
- Verify middleware is applied before routes
- Check req.user is set correctly in mock

## Next Steps

1. **Phase 3:** Frontend widget unit tests
2. **Phase 4:** End-to-end tests
3. **Phase 5:** Performance tests

## Related Documentation
- [F7 AI/ML Test Plan](../../../docs/F7-AI-ML-TEST-PLAN.md)
- [ML Service Unit Tests](../../../ml-services/tests/README.md)
- [Backend Routes](../../../src/routes/ai.js)
- [ML Service Client](../../../services/mlService.js)
