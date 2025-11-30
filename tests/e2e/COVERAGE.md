# E2E Test Coverage Matrix

This document tracks comprehensive E2E test coverage for the TRADEAI platform.

## Test Execution Strategy

- **@smoke**: Fast critical path tests (run on every PR)
- **@core**: CRUD + data accuracy tests (run on merge to main)
- **@ai**: ML/AI validation tests (run nightly)
- **@txn**: Transaction workflow tests (run pre-release)
- **@admin**: Admin-only functionality tests

## Coverage by Module

### 1. Authentication & Authorization
| Feature | Test Coverage | Data Validation | Status |
|---------|--------------|-----------------|--------|
| Login page display | ✅ Skipped (storageState) | N/A | Complete |
| Session persistence | ✅ auth.spec.js | N/A | Complete |
| Logout | ✅ auth.spec.js | N/A | Complete |
| Role-based access | ⏳ Pending | N/A | Pending |
| MFA (if enabled) | ⏳ Pending | N/A | Pending |

### 2. Dashboard & Home
| Feature | Test Coverage | Data Validation | Status |
|---------|--------------|-----------------|--------|
| Dashboard display | ✅ dashboard.spec.js | ⏳ Pending | Partial |
| Key metrics (Budget Optimization) | ✅ dashboard.spec.js | ⏳ Pending | Partial |
| Charts & visualizations | ✅ dashboard.spec.js | ⏳ Pending | Partial |
| Recent activity | ✅ dashboard.spec.js | ⏳ Pending | Partial |
| Date range filtering | ✅ dashboard.spec.js | ⏳ Pending | Partial |
| Data refresh | ✅ dashboard.spec.js | ⏳ Pending | Partial |

### 3. Budgets
| Feature | Test Coverage | Data Validation | Status |
|---------|--------------|-----------------|--------|
| Budget list display | ✅ budgets.spec.js | ⏳ Pending | Partial |
| Budget details | ✅ budgets.spec.js | ⏳ Pending | Partial |
| Budget filters | ✅ budgets.spec.js | ⏳ Pending | Partial |
| Budget utilization metrics | ✅ budgets.spec.js | ⏳ Pending | Partial |
| Budget CRUD operations | ⏳ Pending | ⏳ Pending | Pending |
| Budget approval workflow | ⏳ Pending | ⏳ Pending | Pending |
| Budget allocation | ⏳ Pending | ⏳ Pending | Pending |
| Budget Console (AI) | ⏳ Pending | ⏳ Pending | Pending |

### 4. Promotions
| Feature | Test Coverage | Data Validation | Status |
|---------|--------------|-----------------|--------|
| Promotion list | ⏳ Pending | ⏳ Pending | Pending |
| Promotion details | ⏳ Pending | ⏳ Pending | Pending |
| Create promotion | ⏳ Pending | ⏳ Pending | Pending |
| Edit promotion | ⏳ Pending | ⏳ Pending | Pending |
| Promotion approval workflow | ⏳ Pending | ⏳ Pending | Pending |
| Promotion timeline | ⏳ Pending | ⏳ Pending | Pending |
| Promotion Planner (AI) | ⏳ Pending | ⏳ Pending | Pending |

### 5. Products
| Feature | Test Coverage | Data Validation | Status |
|---------|--------------|-----------------|--------|
| Product list | ✅ products.spec.js | ⏳ Pending | Partial |
| Product information | ✅ products.spec.js | ⏳ Pending | Partial |
| Product search | ✅ products.spec.js | ⏳ Pending | Partial |
| Product category filters | ✅ products.spec.js | ⏳ Pending | Partial |
| Product CRUD | ⏳ Pending | ⏳ Pending | Pending |

### 6. Customers
| Feature | Test Coverage | Data Validation | Status |
|---------|--------------|-----------------|--------|
| Customer list | ⏳ Pending | ⏳ Pending | Pending |
| Customer details | ⏳ Pending | ⏳ Pending | Pending |
| Customer search | ⏳ Pending | ⏳ Pending | Pending |
| Customer CRUD | ⏳ Pending | ⏳ Pending | Pending |
| Customer assignment (KAM) | ⏳ Pending | ⏳ Pending | Pending |
| Customer segmentation (AI) | ⏳ Pending | ⏳ Pending | Pending |

### 7. Claims & Deductions
| Feature | Test Coverage | Data Validation | Status |
|---------|--------------|-----------------|--------|
| Claims list | ⏳ Pending | ⏳ Pending | Pending |
| Submit claim | ⏳ Pending | ⏳ Pending | Pending |
| Claim approval workflow | ⏳ Pending | ⏳ Pending | Pending |
| Claim settlement | ⏳ Pending | ⏳ Pending | Pending |
| Deductions tracking | ⏳ Pending | ⏳ Pending | Pending |
| Reconciliation | ⏳ Pending | ⏳ Pending | Pending |

### 8. Approvals
| Feature | Test Coverage | Data Validation | Status |
|---------|--------------|-----------------|--------|
| Pending approvals list | ⏳ Pending | ⏳ Pending | Pending |
| Approve/reject promotion | ⏳ Pending | ⏳ Pending | Pending |
| Approve/reject trade spend | ⏳ Pending | ⏳ Pending | Pending |
| Approve/reject claim | ⏳ Pending | ⏳ Pending | Pending |
| Approval history | ⏳ Pending | ⏳ Pending | Pending |

### 9. Analytics & Insights
| Feature | Test Coverage | Data Validation | Status |
|---------|--------------|-----------------|--------|
| Live Performance dashboard | ⏳ Pending | ⏳ Pending | Pending |
| AI Insights | ⏳ Pending | ⏳ Pending | Pending |
| Promotion Analytics | ⏳ Pending | ⏳ Pending | Pending |
| Budget Analytics | ⏳ Pending | ⏳ Pending | Pending |
| Reports | ⏳ Pending | ⏳ Pending | Pending |
| Forecasting | ⏳ Pending | ⏳ Pending | Pending |

### 10. ML/AI Features
| Feature | API Endpoint | Test Coverage | Validation Type | Status |
|---------|-------------|--------------|-----------------|--------|
| Predict Sales | POST /api/predictive-analytics/predict-sales | ⏳ Pending | Invariants + Golden | Pending |
| Predict Promotion ROI | POST /api/predictive-analytics/predict-promotion-roi | ⏳ Pending | Invariants + Golden | Pending |
| Predict Budget Needs | POST /api/predictive-analytics/predict-budget-needs | ⏳ Pending | Invariants + Golden | Pending |
| What-If Scenarios | POST /api/predictive-analytics/what-if | ⏳ Pending | Invariants + Golden | Pending |
| Promotion Effectiveness | GET /api/performance-analytics/promotion-effectiveness | ⏳ Pending | Data Accuracy | Pending |
| ROI Trending | GET /api/performance-analytics/roi-trending | ⏳ Pending | Data Accuracy | Pending |
| Budget Variance | GET /api/performance-analytics/budget-variance | ⏳ Pending | Data Accuracy | Pending |
| Customer Segmentation | GET /api/performance-analytics/customer-segmentation | ⏳ Pending | Data Accuracy | Pending |
| Budget Optimization | ⏳ TBD | ⏳ Pending | Invariants + Golden | Pending |
| AI Recommendations | ⏳ TBD | ⏳ Pending | Invariants + Golden | Pending |

### 11. Planning & Simulation
| Feature | Test Coverage | Data Validation | Status |
|---------|--------------|-----------------|--------|
| Simulation Studio | ⏳ Pending | ⏳ Pending | Pending |
| Scenario Planning | ⏳ Pending | ⏳ Pending | Pending |
| Predictive Analytics page | ⏳ Pending | ⏳ Pending | Pending |

### 12. Admin & Data Management
| Feature | Test Coverage | Data Validation | Status |
|---------|--------------|-----------------|--------|
| User management | ⏳ Pending | ⏳ Pending | Pending |
| Customer assignment | ⏳ Pending | ⏳ Pending | Pending |
| Bulk import | ⏳ Pending | ⏳ Pending | Pending |
| Bulk export | ⏳ Pending | ⏳ Pending | Pending |
| Settings | ⏳ Pending | ⏳ Pending | Pending |
| Alerts | ⏳ Pending | ⏳ Pending | Pending |

### 13. Navigation & Performance
| Feature | Test Coverage | Data Validation | Status |
|---------|--------------|-----------------|--------|
| Main navigation menu | ✅ navigation.spec.js | N/A | Complete |
| Navigate to Dashboard | ✅ navigation.spec.js | N/A | Complete |
| Navigate to Budgets | ✅ navigation.spec.js | N/A | Complete |
| Navigate to Products | ✅ navigation.spec.js | N/A | Complete |
| Navigate to Analytics | ✅ navigation.spec.js | N/A | Complete |
| Login page load time | ✅ performance.spec.js | N/A | Complete |
| Dashboard load time | ✅ performance.spec.js | N/A | Complete |
| Console errors | ✅ performance.spec.js | N/A | Complete |
| Rapid navigation | ✅ performance.spec.js | N/A | Complete |

### 14. Transaction Workflows (End-to-End)
| Workflow | Test Coverage | Data Validation | Status |
|----------|--------------|-----------------|--------|
| Create Budget → Allocate → Track Utilization | ⏳ Pending | ⏳ Pending | Pending |
| Create Promotion → Submit → Approve → Activate | ⏳ Pending | ⏳ Pending | Pending |
| Process Sales → Accrue → Claim → Settle → Impact Budgets | ⏳ Pending | ⏳ Pending | Pending |
| Submit Claim → Approve → Settle → Verify Budget Impact | ⏳ Pending | ⏳ Pending | Pending |
| Budget Reallocation → Verify ML Recommendations Update | ⏳ Pending | ⏳ Pending | Pending |

## Test Infrastructure

### Helpers Implemented
- ⏳ `tests/e2e/helpers/api.js` - API request wrapper with auth + tenant scoping
- ⏳ `tests/e2e/helpers/uiParse.js` - UI parsing utilities (tables, currency, dates)
- ⏳ `tests/e2e/helpers/dataAssert.js` - Data accuracy assertions (UI vs API)
- ⏳ `tests/e2e/helpers/mlAssert.js` - ML/AI validation assertions
- ⏳ `tests/e2e/helpers/testData.js` - Test data seeding and cleanup
- ✅ `tests/e2e/helpers/login.js` - Login helper (existing)

### Test Configuration
- ✅ Playwright config with storageState
- ✅ Global setup for authentication
- ⏳ Test tags (@smoke, @core, @ai, @txn, @admin)
- ⏳ Separate projects (e2e-core, e2e-auth)

## Coverage Summary

| Category | Total Features | Tested | Data Validated | Coverage % |
|----------|---------------|--------|----------------|------------|
| Authentication | 5 | 2 | 0 | 40% |
| Dashboard | 6 | 6 | 0 | 100% (partial) |
| Budgets | 8 | 4 | 0 | 50% (partial) |
| Promotions | 7 | 0 | 0 | 0% |
| Products | 5 | 4 | 0 | 80% (partial) |
| Customers | 6 | 0 | 0 | 0% |
| Claims | 6 | 0 | 0 | 0% |
| Approvals | 5 | 0 | 0 | 0% |
| Analytics | 6 | 0 | 0 | 0% |
| ML/AI | 10 | 0 | 0 | 0% |
| Planning | 3 | 0 | 0 | 0% |
| Admin | 6 | 0 | 0 | 0% |
| Navigation | 5 | 5 | 0 | 100% |
| Performance | 4 | 4 | 0 | 100% |
| Workflows | 5 | 0 | 0 | 0% |
| **TOTAL** | **87** | **25** | **0** | **29%** |

## Next Steps

1. ✅ Phase 0: Basic navigation and performance tests (Complete)
2. ⏳ Phase 1: Build test infrastructure (helpers, utilities)
3. ⏳ Phase 2: Data accuracy validation (budgets, products, customers, promotions)
4. ⏳ Phase 3: ML/AI calculation validation (predictive analytics, recommendations)
5. ⏳ Phase 4: Transaction workflow tests (end-to-end)
6. ⏳ Phase 5: Admin and bulk operations tests
7. ⏳ Phase 6: Complete coverage of all modules

## Demo Tenant Information

- **Tenant ID**: `692a6dcfaa920d747686c46d`
- **Test User**: `admin@testdistributor.com`
- **Role**: `admin`
- **Isolation**: All tests scoped to this tenant via JWT token

## Data Validation Strategy

1. **UI vs API Comparison**: For every page, parse UI data and compare with API responses
2. **Tolerance Handling**: Currency (±0.01), Percentages (±0.1%), Dates (timezone normalized)
3. **ML/AI Validation**: Invariant checks + golden dataset assertions
4. **Transaction Impact**: Verify side effects (budget utilization, KPI updates, ML recommendations)

## Performance Budgets

- Login page: < 4s
- Dashboard: < 5s
- Console errors: 0
- Navigation: No errors during rapid switching
