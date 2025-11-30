# Comprehensive Regression Testing System

This document describes the comprehensive regression testing system for the Trade AI Platform.

## Overview

The regression testing system simulates realistic business activity for different company types and validates data accuracy, calculations, and UI functionality across the entire platform.

## Architecture

### 1. Company Type Configurations

Located in `scripts/simulate/company-types/`:
- **distributor.json**: Small regional distributor (500 SKUs, 100 customers)
- **manufacturer.json**: Large CPG manufacturer (8,000 SKUs, 2,000 customers)
- **retail.json**: Multi-store retail chain (12,000 SKUs, 250 stores)

Each configuration defines:
- Product/customer counts
- Promotion/claim rates
- Approval chain depth
- Budget model
- KPI expectations

### 2. Simulation Orchestrator

`scripts/simulate/simulator/monthOrchestrator.js`

Simulates one month of business activity:
- **Week 1**: Planning and setup (create promotions)
- **Week 2**: Execution (transactions, claims)
- **Week 3**: Mid-month adjustments (more promotions, transactions)
- **Week 4**: Close and review (final transactions, claims, trading terms)

Features:
- Deterministic RNG for reproducible results
- Ledger tracking for all entities and calculations
- Configurable via company type JSON

### 3. Utilities

Located in `scripts/simulate/utils/`:

- **rng.js**: Deterministic random number generator using seedrandom
- **apiClient.js**: API client for validation tests
- **ledger.js**: Single source of truth for simulation data
- **invariants.js**: Business rule validators

### 4. Test Suites

#### API Validation Tests
Located in `tests/regression/api/{company_type}/`:

- **budget-validation.spec.js**: Validates budget calculations and utilization
- **promotion-validation.spec.js**: Validates promotion data and ROI calculations

Features:
- Compares API responses against ledger
- Validates business invariants
- Checks data integrity

#### UI Regression Tests
Located in `tests/regression/ui/{company_type}/`:

- **critical-path.spec.js**: Tests essential user journeys

Features:
- No console errors
- No 5xx HTTP errors
- Critical widgets load correctly
- Navigation works across all pages

### 5. Data Validation Helpers

`tests/regression/helpers/dataAssert.js`

Provides assertions for:
- Budget utilization (cap >= used >= 0, available = cap - used)
- Promotion data (dates, ROI, units)
- Transaction totals
- Report aggregations
- Ledger comparisons

### 6. CI/CD Integration

`.github/workflows/regression.yml`

Features:
- Matrix strategy for parallel execution by company type
- Triggered by PR label "regression", schedule (nightly), or manual dispatch
- Uploads artifacts: ledger, Playwright reports, traces
- Generates summary report

## Usage

### Local Testing

Run regression tests for a specific company type:

```bash
./scripts/run-regression.sh distributor
```

Run with custom parameters:

```bash
./scripts/run-regression.sh manufacturer run-12345 42
# company_type run_id seed
```

### CI/CD

**Trigger on PR:**
Add the `regression` label to your pull request.

**Manual trigger:**
Go to Actions → Comprehensive Regression Tests → Run workflow

**Nightly:**
Automatically runs at 2 AM UTC daily.

### Simulation Only

Run just the simulation:

```bash
node scripts/simulate/simulator/monthOrchestrator.js distributor run-test 12345
```

### API Tests Only

```bash
export RUN_ID=run-test
npx playwright test tests/regression/api/distributor/
```

### UI Tests Only

```bash
npx playwright test tests/regression/ui/distributor/
```

## Data Invariants

The system validates these business rules:

### Budgets
- `used >= 0` (never negative)
- `available = cap - used` (correct calculation)
- `used <= cap` (not overutilized)
- `utilization = used / cap` (between 0 and 1)

### Promotions
- `startDate < endDate` (valid date range)
- `actualUnits >= 0` (non-negative)
- `netSpend >= 0` (non-negative)
- `ROI = incrementalMargin / netSpend` (correct calculation)

### Transactions
- `quantity > 0` (positive)
- `amount > 0` (positive)
- `total = subtotal + tax` (correct calculation)

### Reports
- Sum of children = parent at each grouping level
- Totals match ledger calculations

## Artifacts

After each run, the following artifacts are generated:

### Ledger
`artifacts/ledger/{run_id}/{company_type}/ledger.json`

Contains:
- All entities created (users, products, customers, budgets, promotions, etc.)
- Expected calculations (budget utilization, ROI, etc.)
- KPIs
- Errors encountered

### Summary Report
`artifacts/ledger/{run_id}/summary.txt`

Contains:
- Test results
- Pass/fail status
- Timestamp

### Playwright Reports
- HTML report with test results
- Screenshots on failure
- Traces for debugging

## KPI Expectations

Each company type has target KPIs defined in its configuration:

### Distributor
- Budget utilization: 85%
- Promotion ROI: >= 1.2
- Claim approval rate: >= 92%
- Forecast MAPE: <= 15%

### Manufacturer
- Budget utilization: 92%
- Promotion ROI: >= 1.5
- Claim approval rate: >= 95%
- Forecast MAPE: <= 12%

### Retail
- Budget utilization: 98%
- Promotion ROI: >= 1.3
- Claim approval rate: >= 90%
- Forecast MAPE: <= 18%
- OOS rate: <= 5%

## Extending the System

### Add a New Company Type

1. Create configuration: `scripts/simulate/company-types/newtype.json`
2. Create API tests: `tests/regression/api/newtype/`
3. Create UI tests: `tests/regression/ui/newtype/`
4. Update CI matrix in `.github/workflows/regression.yml`

### Add New Validation

1. Add assertion method to `tests/regression/helpers/dataAssert.js`
2. Add invariant to `scripts/simulate/utils/invariants.js`
3. Use in test specs

### Add New Simulation Activity

1. Add method to `MonthOrchestrator` class
2. Call from `simulateMonth()` method
3. Track in ledger

## Troubleshooting

### Simulation Fails

Check:
- MongoDB connection string
- Existing data conflicts
- Model schema changes

### API Tests Fail

Check:
- Ledger file exists
- API authentication
- Base URL configuration

### UI Tests Fail

Check:
- Test credentials
- Page selectors
- Network connectivity

## Best Practices

1. **Use deterministic seeds** for reproducible results
2. **Keep simulations modest** - start with lower volumes and scale up
3. **Run locally first** before pushing to CI
4. **Review ledger** when tests fail to understand expected vs actual
5. **Add new invariants** as you discover business rules
6. **Keep UI tests minimal** - focus on critical paths
7. **Use API tests** for comprehensive validation

## Maintenance

### Regular Tasks

- Review and update KPI expectations quarterly
- Add new test scenarios as features are added
- Update company type configurations to match production patterns
- Review and optimize simulation performance
- Archive old ledger artifacts

### When to Update

- New features added to platform
- Business rules change
- New company types needed
- Performance issues identified
- Test flakiness detected
