# Feature 7: AI/ML Integration - Comprehensive Test Plan

## Overview
This document outlines the comprehensive testing strategy for all AI/ML features in the TradeAI platform, including unit tests, integration tests, and end-to-end tests.

## Test Coverage Goals
- **Unit Tests**: 80%+ coverage for ML service and backend AI routes
- **Integration Tests**: 100% coverage for all AI API endpoints
- **Widget Tests**: 100% coverage for all AI dashboard widgets
- **E2E Tests**: Critical user workflows on AI dashboard

## Test Structure

### 1. ML Service Tests (Python)
**Location**: `ml-services/tests/`

#### 1.1 Health Endpoint Tests
- ✅ Test `/health` endpoint returns correct status
- ✅ Test model loading status reporting
- ✅ Test degraded mode detection
- ✅ Test uptime calculation

#### 1.2 Demand Forecasting Tests
- ✅ Test `/predict/demand` with valid input
- ✅ Test forecast accuracy metrics
- ✅ Test confidence score calculation
- ✅ Test date range validation
- ✅ Test mock data generation when model not loaded
- ✅ Test error handling for invalid products

#### 1.3 Price Optimization Tests
- ✅ Test `/optimize/price` with valid input
- ✅ Test optimal price calculation
- ✅ Test revenue impact prediction
- ✅ Test profit impact calculation
- ✅ Test demand elasticity simulation
- ✅ Test error handling for invalid prices

#### 1.4 Customer Segmentation Tests
- ✅ Test `/segment/customers` endpoint
- ✅ Test RFM (Recency, Frequency, Monetary) analysis
- ✅ Test segment assignment logic
- ✅ Test confidence scoring
- ✅ Test recommendation generation
- ✅ Test batch processing for multiple customers

#### 1.5 Anomaly Detection Tests
- ✅ Test `/detect/anomalies` endpoint
- ✅ Test threshold-based detection
- ✅ Test severity classification (high/medium/low)
- ✅ Test time series analysis
- ✅ Test false positive rate
- ✅ Test alert generation

### 2. Backend Integration Tests (Node.js)
**Location**: `backend/tests/integration/ai/`

#### 2.1 AI Routes Tests
- ✅ Test authentication requirement for all AI endpoints
- ✅ Test authorization (role-based access)
- ✅ Test request validation
- ✅ Test ML service connection handling
- ✅ Test timeout handling
- ✅ Test error responses

#### 2.2 Endpoint-Specific Tests
**POST /api/ai/forecast/demand**
- ✅ Test with valid product data
- ✅ Test with missing parameters
- ✅ Test with invalid date ranges
- ✅ Test response format

**POST /api/ai/optimize/price**
- ✅ Test with valid price data
- ✅ Test with current_price only
- ✅ Test with constraint parameters
- ✅ Test response format

**POST /api/ai/segment/customers**
- ✅ Test with customer IDs
- ✅ Test without customer IDs (all customers)
- ✅ Test with invalid customer IDs
- ✅ Test response format

**POST /api/ai/detect/anomalies**
- ✅ Test with date range
- ✅ Test with metric type filter
- ✅ Test with severity filter
- ✅ Test response format

#### 2.3 Error Handling Tests
- ✅ Test ML service unavailable scenario
- ✅ Test ML service timeout
- ✅ Test ML service returning errors
- ✅ Test rate limiting
- ✅ Test concurrent requests

### 3. Frontend Widget Tests (React/Jest)
**Location**: `frontend/src/components/ai/__tests__/`

#### 3.1 AIServiceHealthWidget Tests
- ✅ Test widget renders correctly
- ✅ Test health data display (healthy/degraded)
- ✅ Test model status list rendering
- ✅ Test refresh button functionality
- ✅ Test auto-refresh interval
- ✅ Test error state display
- ✅ Test loading state

#### 3.2 AIDemandForecastWidget Tests
- ✅ Test widget renders correctly
- ✅ Test chart data visualization
- ✅ Test confidence score display
- ✅ Test percentage change calculation
- ✅ Test date range handling
- ✅ Test refresh functionality
- ✅ Test error handling
- ✅ Test empty data state

#### 3.3 AIPriceOptimizationWidget Tests
- ✅ Test widget renders correctly
- ✅ Test current vs optimal price display
- ✅ Test impact metrics (revenue/profit/demand)
- ✅ Test confidence score
- ✅ Test "Apply Optimal Price" button
- ✅ Test refresh functionality
- ✅ Test error handling

#### 3.4 AICustomerSegmentationWidget Tests
- ✅ Test widget renders correctly
- ✅ Test pie chart visualization
- ✅ Test segment list rendering
- ✅ Test customer count display
- ✅ Test average value formatting
- ✅ Test insights display
- ✅ Test recommendations list
- ✅ Test refresh functionality

#### 3.5 AIAnomalyDetectionWidget Tests
- ✅ Test widget renders correctly
- ✅ Test anomaly count display
- ✅ Test severity filtering
- ✅ Test time range selector
- ✅ Test anomaly list rendering
- ✅ Test no anomalies state
- ✅ Test refresh functionality

### 4. End-to-End Tests (Playwright/Cypress)
**Location**: `frontend/e2e/ai-dashboard/`

#### 4.1 AI Dashboard Navigation
- ✅ Test user can access AI dashboard
- ✅ Test tab navigation (Overview, Forecasting, Optimization, etc.)
- ✅ Test widget loading on page load
- ✅ Test responsive design on different screen sizes

#### 4.2 Widget Interaction Flows
- ✅ Test full workflow: Load dashboard → View health → Click refresh → See updated data
- ✅ Test forecast workflow: Click Forecasting tab → Select product → View forecast chart
- ✅ Test optimization workflow: Click Optimization tab → View price recommendation → Apply price
- ✅ Test segmentation workflow: Click Customer Insights → View segments → Click segment for details
- ✅ Test anomaly workflow: Click Anomalies tab → Filter by severity → View anomaly details

#### 4.3 Error Scenarios
- ✅ Test behavior when ML service is down
- ✅ Test behavior when API returns errors
- ✅ Test network timeout handling
- ✅ Test session expiration during widget usage

### 5. Performance Tests
**Location**: `backend/tests/performance/ai/`

#### 5.1 Load Tests
- ✅ Test concurrent requests to AI endpoints
- ✅ Test response time under load
- ✅ Test memory usage with multiple requests
- ✅ Test ML service connection pooling

#### 5.2 Stress Tests
- ✅ Test system behavior at maximum capacity
- ✅ Test recovery after overload
- ✅ Test graceful degradation

## Test Data Requirements

### Sample Data Sets
1. **Sales History**: 1000+ records spanning 2 years
2. **Customer Data**: 300+ customers with transaction history
3. **Product Data**: 50+ products with price history
4. **Anomaly Data**: Historical data with known anomalies

### Mock Data
- ML service responses for unit tests
- API responses for frontend tests
- Error scenarios for negative testing

## Testing Tools & Frameworks

### Backend (Node.js)
- **Unit Tests**: Jest
- **Integration Tests**: Supertest + Jest
- **Test DB**: In-memory MongoDB (mongodb-memory-server)

### ML Service (Python)
- **Unit Tests**: pytest
- **Coverage**: pytest-cov
- **HTTP Tests**: httpx (FastAPI test client)
- **Fixtures**: pytest fixtures for test data

### Frontend (React)
- **Unit Tests**: Jest + React Testing Library
- **Component Tests**: @testing-library/react
- **E2E Tests**: Playwright or Cypress
- **Coverage**: Jest coverage

## Test Execution Strategy

### Development
```bash
# ML Service tests
cd ml-services
pytest tests/ -v --cov=serving --cov-report=html

# Backend tests
cd backend
npm run test:ai

# Frontend tests
cd frontend
npm run test:ai
```

### CI/CD Pipeline
1. **Pre-commit**: Lint checks
2. **On PR**: Unit tests + Integration tests
3. **On merge to main**: Full test suite + E2E tests
4. **Scheduled**: Performance tests (nightly)

### Production Smoke Tests
- Health endpoint check
- Basic forecast request
- Basic optimization request
- Response time monitoring

## Success Criteria

### Unit Tests
- ✅ All critical functions have tests
- ✅ Edge cases covered
- ✅ Error handling tested
- ✅ 80%+ code coverage

### Integration Tests
- ✅ All API endpoints tested
- ✅ Authentication/Authorization tested
- ✅ Error scenarios covered
- ✅ Data validation tested

### E2E Tests
- ✅ Critical user workflows pass
- ✅ Widget interactions work correctly
- ✅ Error messages display properly
- ✅ Tests run in < 5 minutes

### Performance Tests
- ✅ Response time < 3s for all endpoints
- ✅ System handles 100 concurrent users
- ✅ No memory leaks detected
- ✅ Graceful degradation under load

## Test Maintenance

### Regular Updates
- Update tests when adding new features
- Update test data quarterly
- Review and update E2E tests monthly
- Performance baseline review quarterly

### Test Quality
- No flaky tests allowed
- Clear test descriptions
- Proper setup/teardown
- Independent test cases

## Timeline

### Phase 1: ML Service Tests (Week 1)
- Set up pytest infrastructure
- Create health endpoint tests
- Create demand forecast tests
- Create price optimization tests

### Phase 2: Backend Integration Tests (Week 2)
- Set up test infrastructure
- Create AI route tests
- Create authentication tests
- Create error handling tests

### Phase 3: Frontend Widget Tests (Week 2-3)
- Set up Jest/RTL infrastructure
- Create health widget tests
- Create forecast widget tests
- Create optimization widget tests
- Create segmentation widget tests
- Create anomaly widget tests

### Phase 4: E2E Tests (Week 3)
- Set up Playwright/Cypress
- Create dashboard navigation tests
- Create widget interaction tests
- Create error scenario tests

### Phase 5: Performance Tests (Week 4)
- Set up load testing framework
- Create concurrent user tests
- Create stress tests
- Establish performance baselines

## Next Steps

1. ✅ Create test directory structure
2. ✅ Set up testing frameworks and dependencies
3. ✅ Create test data fixtures
4. ✅ Implement Phase 1: ML Service Tests
5. ⏳ Implement Phase 2: Backend Integration Tests
6. ⏳ Implement Phase 3: Frontend Widget Tests
7. ⏳ Implement Phase 4: E2E Tests
8. ⏳ Implement Phase 5: Performance Tests
9. ⏳ Integrate into CI/CD pipeline
10. ⏳ Document test results and coverage

---

**Status**: Test plan approved and ready for implementation
**Owner**: Development Team
**Priority**: High
**Estimated Effort**: 4 weeks
**Dependencies**: F7.1-F7.6 features deployed
