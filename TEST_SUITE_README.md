# Comprehensive Test Suite

This directory contains a comprehensive test suite for the TradeAI TPM system, covering all user roles, workflows, AI/ML features, and frontend validation to ensure production readiness.

## Test Structure

```
tests/
├── helpers/              # Test utilities and helpers
│   ├── auth.js          # Authentication and login helpers
│   ├── api.js           # API client and assertions
│   ├── data.js          # Idempotent data creators
│   └── asserts.js       # Ledger invariants and KPI validation
├── roles/               # Role-based permission tests
│   ├── admin.spec.js    # Admin user tests (full CRUD)
│   ├── manager.spec.js  # Manager tests (budget, promotion approval)
│   ├── kam.spec.js      # KAM tests (customer management, wallet)
│   └── analyst.spec.js  # Analyst tests (read-only analytics)
├── workflows/           # End-to-end workflow tests
│   ├── budget-workflow.spec.js      # Budget planning workflow
│   ├── promotion-workflow.spec.js   # Promotion planning workflow
│   └── ...
├── ai/                  # AI/ML feature tests
│   ├── wallet-spend.spec.js         # KAM wallet predictions
│   ├── promotion-suggestions.spec.js # AI promotion recommendations
│   └── predictive-analytics.spec.js  # ML predictions and forecasts
├── ui/                  # UI tests
│   ├── smoke/           # Quick smoke tests for all pages
│   ├── critical-path/   # Key user journeys
│   └── accessibility/   # WCAG compliance tests
└── permissions-matrix.json  # Generated permissions matrix (641 endpoints)
```

## Test Categories

### 1. Role-Based Tests (`tests/roles/`)

Tests user permissions and capabilities for each role:
- **Admin**: Full CRUD on all entities, user management, tenant management
- **Manager**: Budget planning, promotion approval, analytics access
- **KAM**: Customer management, wallet management, promotions
- **Finance Manager**: Budget oversight, financial reports
- **Sales Manager**: Sales analytics, customer assignments
- **Analyst**: Read-only analytics, reports, exports
- **User**: Basic CRUD with limited permissions

### 2. Workflow Tests (`tests/workflows/`)

Tests complete business workflows:
- **Budget Workflow**: Create budgets → allocate to promotions → track utilization → validate invariants
- **Promotion Workflow**: Create promotions → link products/customers → execute → track performance
- **Claims Workflow**: Submit claims → approve → settle → ledger effects
- **Trading Terms Workflow**: Create terms → apply to transactions → verify discounts
- **Analytics Workflow**: Verify KPIs and graphs reflect upstream data changes

### 3. AI/ML Tests (`tests/ai/`)

Tests AI/ML features with contract/property assertions:
- **Wallet Spend**: KAM wallet allocation and spend predictions
- **Promotion Suggestions**: AI-powered promotion recommendations
- **Predictive Analytics**: Sales forecasts, demand predictions, churn prediction
- **Performance Analytics**: Model metrics, insights, and confidence intervals

### 4. UI Tests (`tests/ui/`)

Tests frontend functionality and user experience:
- **Smoke Tests**: All pages load without 5xx errors or console errors
- **Critical Path Tests**: Key user journeys (budget creation, promotion creation, etc.)
- **Accessibility Tests**: WCAG 2.1 AA compliance, keyboard navigation, color contrast

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Set environment variables
export BASE_URL="https://tradeai.gonxt.tech"
export TENANT_ID="DIST-TEST"
export ADMIN_EMAIL="admin@testdistributor.com"
export ADMIN_PASSWORD="Admin@123"
```

### Run All Tests

```bash
# Run comprehensive test suite
./scripts/run-comprehensive-tests.sh

# View HTML report
npx playwright show-report
```

### Run Specific Test Suites

```bash
# Smoke tests (fast, for CI/PR)
./scripts/run-smoke-tests.sh

# Role-based tests
./scripts/run-role-tests.sh [role]  # e.g., admin, manager, kam

# Workflow tests
npx playwright test tests/workflows/

# AI/ML tests
npx playwright test tests/ai/

# UI tests
npx playwright test tests/ui/

# Accessibility tests
npx playwright test tests/ui/accessibility/
```

### Run Tests by Tag

```bash
# Run all role tests
npx playwright test --grep "@role"

# Run all workflow tests
npx playwright test --grep "@workflow"

# Run all AI tests
npx playwright test --grep "@feat:ai"

# Run all UI tests
npx playwright test --grep "@ui"
```

## Test Helpers

### Authentication (`tests/helpers/auth.js`)

```javascript
const { createAuthContext, loginUI } = require('./helpers/auth');

// API authentication
const { context, auth } = await createAuthContext('admin');

// UI authentication
await loginUI(page, 'manager');
```

### API Client (`tests/helpers/api.js`)

```javascript
const { APIClient } = require('./helpers/api');

const api = new APIClient(context, auth);

// Entity operations
const budgets = await api.getBudgets();
const budget = await api.createBudget(data);

// Analytics
const analytics = await api.getDashboardAnalytics();

// AI/ML
const suggestions = await api.getAISuggestions(data);
```

### Data Creators (`tests/helpers/data.js`)

```javascript
const { createProduct, createCustomer, createBudget } = require('./helpers/data');

// Idempotent data creation
const product = await createProduct(api, { seed: 1001 });
const customer = await createCustomer(api, { seed: 1002 });
const budget = await createBudget(api, { seed: 1003 });
```

### Assertions (`tests/helpers/asserts.js`)

```javascript
const { assertBudgetUtilization, assertRevenue, assertPredictionSchema } = require('./helpers/asserts');

// Ledger invariants
assertBudgetUtilization(budgets, promotions);
assertRevenue(transactions);

// AI/ML assertions
assertPredictionSchema(prediction);
assertSuggestionsSchema(suggestions);
```

## Permissions Matrix

The `permissions-matrix.json` file contains 641 API endpoints extracted from the backend routes. This matrix is used to validate role-based access control.

Generated from:
- `backend/src/app.js` (route mount points)
- `backend/src/routes/*.js` (individual endpoints)

## Test Data Management

### Idempotent Data Creation

All data creators are idempotent and scoped to:
- **Tenant**: `DIST-TEST` (or `TENANT_ID` env var)
- **Run ID**: Unique per test run to avoid collisions
- **Seed**: Deterministic random data generation

### Cleanup

Test data is automatically scoped to the test tenant and can be cleaned up using:

```bash
node scripts/cleanup-test-data.js
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Smoke Tests
  run: ./scripts/run-smoke-tests.sh

- name: Run Full Test Suite
  run: ./scripts/run-comprehensive-tests.sh
```

### Test Reports

- **HTML Report**: `playwright-report/index.html`
- **Test Results**: `test-results/`
- **Traces**: Captured on failure for debugging

## Non-Functional Testing

### Performance

- Page load time < 10 seconds
- No 5xx errors during critical flows
- Reasonable API response times

### Security

- Role-based access control enforced
- Tenant isolation validated
- No unauthorized data access

### Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Proper ARIA attributes
- Sufficient color contrast

## Test Coverage

- **641 API endpoints** identified in permissions matrix
- **8 user roles** tested
- **5+ workflows** validated end-to-end
- **3 AI/ML features** tested with contract assertions
- **30+ UI pages** smoke tested
- **6 critical pages** accessibility tested

## Troubleshooting

### Authentication Failures

Check environment variables:
```bash
echo $ADMIN_EMAIL
echo $ADMIN_PASSWORD
```

### Test Data Conflicts

Clean up test data:
```bash
node scripts/cleanup-test-data.js
```

### UI Test Failures

Install Playwright browsers:
```bash
npx playwright install --with-deps
```

### Network Errors

Verify BASE_URL is accessible:
```bash
curl -I $BASE_URL/api/health
```

## Contributing

When adding new tests:
1. Follow existing test structure and naming conventions
2. Use test helpers for authentication, API calls, and data creation
3. Add appropriate tags (`@role`, `@workflow`, `@feat:ai`, `@ui`)
4. Ensure tests are idempotent and clean up after themselves
5. Update this README if adding new test categories

## Support

For issues or questions:
- Review test output and traces
- Check `playwright-report/` for detailed results
- Consult existing tests for examples
