# 🧪 Complete E2E Testing Setup Guide
## TRADEAI System Testing Framework

**Purpose:** Comprehensive automated testing for frontend → backend → database

---

## 📋 Overview

This testing framework covers:
1. **Backend API Tests** - Jest + Supertest (29 endpoints)
2. **Frontend E2E Tests** - Cypress (all screens & user flows)
3. **Integration Tests** - Full user journeys
4. **Performance Tests** - Load testing
5. **Security Tests** - Authentication & authorization

---

## 🛠️ Installation

### Prerequisites

```bash
# Node.js 18+ and npm
node --version  # Should be v18+
npm --version   # Should be 9+

# MongoDB running
mongod --version

# Redis running (for caching tests)
redis-server --version
```

### Install Testing Dependencies

```bash
cd /workspace/project/TRADEAI

# Backend testing
cd backend
npm install --save-dev jest supertest@6.3.3 mongodb-memory-server @faker-js/faker

# Frontend testing  
cd ../frontend
npm install --save-dev cypress @testing-library/react @testing-library/jest-dom @testing-library/user-event @testing-library/cypress
```

---

## 📁 Test Structure

```
TRADEAI/
├── backend/
│   ├── tests/
│   │   ├── e2e/                    # Full user journey tests
│   │   │   ├── auth.e2e.test.js
│   │   │   ├── pos-import.e2e.test.js
│   │   │   ├── transaction.e2e.test.js
│   │   │   ├── baseline.e2e.test.js
│   │   │   ├── cannibalization.e2e.test.js
│   │   │   └── forward-buy.e2e.test.js
│   │   ├── integration/            # API integration tests
│   │   │   ├── transaction-api.test.js
│   │   │   ├── pos-import-api.test.js
│   │   │   ├── baseline-api.test.js
│   │   │   ├── cannibalization-api.test.js
│   │   │   └── forward-buy-api.test.js
│   │   ├── unit/                   # Service unit tests
│   │   │   ├── baselineService.test.js
│   │   │   ├── cannibalizationService.test.js
│   │   │   ├── forwardBuyService.test.js
│   │   │   └── storeAnalyticsService.test.js
│   │   ├── fixtures/               # Test data
│   │   │   ├── users.json
│   │   │   ├── products.json
│   │   │   ├── customers.json
│   │   │   ├── transactions.json
│   │   │   └── pos-data.csv
│   │   └── setup.js                # Test environment setup
│   ├── jest.config.js
│   └── package.json
│
├── frontend/
│   ├── cypress/
│   │   ├── e2e/                    # Cypress E2E tests
│   │   │   ├── auth.cy.js
│   │   │   ├── dashboard.cy.js
│   │   │   ├── pos-import.cy.js
│   │   │   ├── transactions.cy.js
│   │   │   ├── promotions.cy.js
│   │   │   ├── analytics.cy.js
│   │   │   └── reports.cy.js
│   │   ├── fixtures/               # Test data for Cypress
│   │   │   ├── users.json
│   │   │   └── pos-sample.csv
│   │   ├── support/
│   │   │   ├── commands.js        # Custom Cypress commands
│   │   │   └── e2e.js             # Support file
│   │   └── screenshots/            # Test screenshots
│   ├── cypress.config.js
│   └── package.json
│
├── scripts/
│   ├── test-all.sh                 # Run all tests
│   ├── test-backend.sh             # Backend tests only
│   ├── test-frontend.sh            # Frontend tests only
│   └── test-e2e.sh                 # Full E2E tests
│
└── test-report/                    # Test results & coverage
```

---

## 🧪 Test Categories

### 1. Backend API Tests (Jest + Supertest)

**Location:** `backend/tests/integration/`

**Coverage:**
- ✅ Authentication (login, register, logout)
- ✅ Transactions (10 endpoints)
- ✅ POS Import (7 endpoints)
- ✅ Baseline (3 endpoints)
- ✅ Cannibalization (5 endpoints)
- ✅ Forward Buy (4 endpoints)

**Run:**
```bash
cd backend
npm run test:integration
```

### 2. Frontend E2E Tests (Cypress)

**Location:** `frontend/cypress/e2e/`

**Coverage:**
- ✅ User authentication flows
- ✅ Dashboard navigation
- ✅ POS data import UI
- ✅ Transaction management
- ✅ Promotion creation
- ✅ Analytics dashboards
- ✅ Report generation

**Run:**
```bash
cd frontend
npx cypress run                    # Headless
npx cypress open                   # Interactive UI
```

### 3. Full E2E Tests (Frontend → Backend → DB)

**Location:** `backend/tests/e2e/`

**Coverage:**
- ✅ Complete user journeys
- ✅ Data persistence validation
- ✅ Multi-step workflows
- ✅ Error handling
- ✅ Edge cases

**Run:**
```bash
cd backend
npm run test:e2e
```

### 4. Service Unit Tests

**Location:** `backend/tests/unit/`

**Coverage:**
- ✅ Baseline calculation algorithms
- ✅ Cannibalization detection logic
- ✅ Forward buy detection logic
- ✅ Store analytics aggregations

**Run:**
```bash
cd backend
npm run test:unit
```

---

## 📝 Test Scripts

### Run All Tests

```bash
# From project root
./scripts/test-all.sh
```

### Run Backend Tests Only

```bash
cd backend
npm test                           # All tests
npm run test:unit                  # Unit tests
npm run test:integration           # API tests
npm run test:e2e                   # E2E tests
npm run test:watch                 # Watch mode
```

### Run Frontend Tests Only

```bash
cd frontend
npx cypress run                    # All Cypress tests
npx cypress run --spec "cypress/e2e/pos-import.cy.js"  # Single test
npx cypress open                   # Interactive mode
```

### Run with Coverage

```bash
cd backend
npm test -- --coverage
```

---

## 🎯 Test Scenarios

### Scenario 1: POS Data Import (Full Flow)

**Test:** User uploads POS data, system processes it, data appears in dashboard

**Steps:**
1. User logs in
2. Navigates to POS Import
3. Uploads CSV file
4. Reviews preview
5. Confirms import
6. Sees success message
7. Verifies data in SalesHistory table

**Files:**
- `frontend/cypress/e2e/pos-import.cy.js`
- `backend/tests/e2e/pos-import.e2e.test.js`

### Scenario 2: Baseline Calculation

**Test:** User calculates baseline for a promotion, sees incremental volume

**Steps:**
1. User logs in
2. Navigates to Analytics
3. Selects product, customer, date range
4. Chooses baseline method
5. Clicks "Calculate"
6. Sees baseline chart
7. Views incremental volume table
8. Verifies calculations

**Files:**
- `frontend/cypress/e2e/analytics.cy.js`
- `backend/tests/e2e/baseline.e2e.test.js`

### Scenario 3: Cannibalization Detection

**Test:** User analyzes promotion, system detects cannibalization

**Steps:**
1. User logs in
2. Selects completed promotion
3. Clicks "Analyze Cannibalization"
4. System calculates:
   - Gross incremental volume
   - Cannibalized volume
   - Net incremental volume
5. User sees cannibalization report
6. User views substitution matrix
7. User gets recommendations

**Files:**
- `frontend/cypress/e2e/analytics.cy.js`
- `backend/tests/e2e/cannibalization.e2e.test.js`

### Scenario 4: Forward Buy Detection

**Test:** User analyzes post-promotion period, detects forward buying

**Steps:**
1. User logs in
2. Selects completed promotion
3. Clicks "Analyze Forward Buy"
4. System analyzes 4-week post-promo period
5. User sees:
   - Post-promo dip percentage
   - Recovery timeline
   - Net impact calculation
6. User gets severity classification
7. User sees recommendations

**Files:**
- `frontend/cypress/e2e/analytics.cy.js`
- `backend/tests/e2e/forward-buy.e2e.test.js`

### Scenario 5: Transaction Workflow

**Test:** User creates, approves, and settles a transaction

**Steps:**
1. User logs in
2. Navigates to Transactions
3. Clicks "Create Transaction"
4. Fills form (type, amount, customer, product)
5. Saves as Draft
6. Manager approves
7. Finance settles
8. User verifies final status

**Files:**
- `frontend/cypress/e2e/transactions.cy.js`
- `backend/tests/e2e/transaction.e2e.test.js`

### Scenario 6: Store Performance Analysis

**Test:** User compares store performance across hierarchy

**Steps:**
1. User logs in
2. Navigates to Store Analytics
3. Selects Region
4. Views region rollup metrics
5. Drills down to District
6. Drills down to Store
7. Compares store vs. district vs. region
8. Views promotion performance by geography

**Files:**
- `frontend/cypress/e2e/store-analytics.cy.js`
- `backend/tests/e2e/store-analytics.e2e.test.js`

### Scenario 7: Predictive Risk Assessment

**Test:** User predicts outcome of planned promotion

**Steps:**
1. User logs in
2. Navigates to Promotions
3. Clicks "Create New Promotion"
4. Fills promotion details
5. Clicks "Predict Risk"
6. System shows:
   - Cannibalization risk
   - Forward buy risk
   - Expected net impact
7. User adjusts promotion based on predictions
8. User saves optimized promotion

**Files:**
- `frontend/cypress/e2e/promotions.cy.js`
- `backend/tests/e2e/predictive-analytics.e2e.test.js`

---

## 🔧 Test Configuration

### Jest Configuration (backend/jest.config.js)

```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/tests/**/*.test.js'
  ],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/seeds/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

### Cypress Configuration (frontend/cypress.config.js)

```javascript
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      apiUrl: 'http://localhost:5000/api',
      testUser: 'test@example.com',
      testPassword: 'Test123!@#'
    }
  }
});
```

---

## 📊 Test Coverage Goals

| Component | Current | Target | Status |
|-----------|---------|--------|--------|
| **Backend Services** | 0% | 80% | 🔴 |
| **Backend Controllers** | 0% | 80% | 🔴 |
| **Backend Routes** | 0% | 90% | 🔴 |
| **Frontend Components** | 0% | 70% | 🔴 |
| **E2E User Flows** | 0% | 90% | 🔴 |

**After Implementation:**

| Component | Target | Status |
|-----------|--------|--------|
| **Backend Services** | 80% | 🟢 |
| **Backend Controllers** | 80% | 🟢 |
| **Backend Routes** | 90% | 🟢 |
| **Frontend Components** | 70% | 🟢 |
| **E2E User Flows** | 90% | 🟢 |

---

## 🚀 Continuous Integration

### GitHub Actions Workflow

**.github/workflows/test.yml**

```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd backend && npm install
      - name: Run backend tests
        run: cd backend && npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          working-directory: frontend
          start: npm start
          wait-on: 'http://localhost:3000'
```

---

## 📈 Test Reporting

### Generate Coverage Report

```bash
# Backend
cd backend
npm test -- --coverage --coverageReporters=html
open coverage/index.html

# Frontend
cd frontend
npx cypress run --reporter mochawesome
open mochawesome-report/mochawesome.html
```

### View Test Results

```bash
# Backend: Jest HTML reporter
npm install --save-dev jest-html-reporter
# Results in test-report/index.html

# Frontend: Cypress Dashboard
npx cypress run --record --key <your-key>
# View at https://dashboard.cypress.io
```

---

## 🐛 Debugging Tests

### Backend Tests

```bash
# Run specific test
npm test -- transaction-api.test.js

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Verbose output
npm test -- --verbose
```

### Frontend Tests

```bash
# Open Cypress UI (interactive debugging)
npx cypress open

# Run specific test
npx cypress run --spec "cypress/e2e/pos-import.cy.js"

# Debug mode
DEBUG=cypress:* npx cypress run
```

---

## ✅ Test Checklist

Before running tests:

- [ ] MongoDB is running
- [ ] Redis is running (if testing caching)
- [ ] Backend server is running (for Cypress)
- [ ] Test database is seeded
- [ ] Environment variables are set
- [ ] All dependencies are installed

---

## 📚 Next Steps

1. **Install dependencies** (see Installation section)
2. **Review test files** (in backend/tests/ and frontend/cypress/)
3. **Seed test database** (`npm run seed`)
4. **Run unit tests** first (`npm run test:unit`)
5. **Run integration tests** (`npm run test:integration`)
6. **Run E2E tests** (`npm run test:e2e`)
7. **Run Cypress tests** (`npx cypress run`)
8. **Review coverage report**
9. **Fix failing tests**
10. **Set up CI/CD** (GitHub Actions)

---

## 🎯 Test Execution Plan

### Phase 1: Setup (Day 1)
- ✅ Install testing dependencies
- ✅ Configure Jest & Cypress
- ✅ Create test fixtures
- ✅ Set up test database

### Phase 2: Backend Tests (Days 2-3)
- ✅ Write API integration tests (29 endpoints)
- ✅ Write service unit tests
- ✅ Write E2E backend tests
- ✅ Achieve 80% backend coverage

### Phase 3: Frontend Tests (Days 4-5)
- ✅ Write Cypress E2E tests
- ✅ Test all user flows
- ✅ Test error scenarios
- ✅ Achieve 70% frontend coverage

### Phase 4: Validation (Day 6)
- ✅ Run full test suite
- ✅ Fix failing tests
- ✅ Review coverage report
- ✅ Document findings

---

## 📝 Test Documentation

Each test file should include:

```javascript
/**
 * TEST SUITE: Transaction API
 * 
 * COVERAGE:
 * - POST /api/transactions (create)
 * - GET /api/transactions (list)
 * - GET /api/transactions/:id (get)
 * - PUT /api/transactions/:id (update)
 * - DELETE /api/transactions/:id (delete)
 * 
 * SCENARIOS:
 * - Happy path (successful operations)
 * - Error handling (validation errors)
 * - Edge cases (boundary conditions)
 * - Security (unauthorized access)
 * 
 * DEPENDENCIES:
 * - MongoDB (test database)
 * - Valid JWT token
 * - Seeded test data
 */

describe('Transaction API', () => {
  // Tests here
});
```

---

## 🔒 Security Testing

Tests should cover:
- ✅ Authentication (valid/invalid tokens)
- ✅ Authorization (role-based access)
- ✅ Input validation (SQL injection, XSS)
- ✅ Rate limiting
- ✅ CORS policies
- ✅ File upload security

---

## 📊 Performance Testing

Load tests should validate:
- ✅ 1000 concurrent users
- ✅ 10,000 transactions in database
- ✅ 1M sales records
- ✅ API response times < 500ms
- ✅ Bulk import of 10,000 rows

---

**Last Updated:** 2025-10-25  
**Status:** Ready for Implementation  
**Next:** Install dependencies and run first test
