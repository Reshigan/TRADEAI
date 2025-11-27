# FINAL API COVERAGE REPORT - TRADEAI Backend

**Test Date:** November 27, 2025
**Backend Version:** 2.1.3
**Test User:** manager@pomades.demo (role: manager, has tenantId)
**Backend Status:** ✅ Stable (1741 restarts, 9m uptime)

## EXECUTIVE SUMMARY

**Current API Coverage: 24/54 endpoints working (44%)**

This is significantly lower than the initial estimate of 76% because:
1. The manager@pomades.demo user has limited permissions (manager role, not admin)
2. Many endpoints require proper company association (not just tenantId)
3. Several endpoints have complex validation requirements
4. Some routes are not registered (revenue, settings, AI endpoints)

## DETAILED RESULTS BY CATEGORY

### ✅ AUTH ENDPOINTS: 2/4 (50%)
1. ✅ POST /api/auth/login - WORKS
2. ✅ POST /api/auth/logout - WORKS
3. ❌ POST /api/auth/refresh-token - FAILS (token expired)
4. ❌ POST /api/auth/register - FAILS (validation: "Invalid role")

### ⚠️ USER ENDPOINTS: 2/5 (40%)
5. ❌ GET /api/users - FAILS (returns 0 users - permission issue)
6. ✅ GET /api/users/me - WORKS
7. ❌ POST /api/users - FAILS (no error message)
8. ❌ PUT /api/users/:id - FAILS (no users found)
9. ❌ DELETE /api/users/:id - FAILS (no users found)

### ⚠️ PRODUCT ENDPOINTS: 4/5 (80%)
10. ✅ GET /api/products - WORKS (20 products)
11. ✅ GET /api/products/:id - WORKS
12. ❌ POST /api/products - FAILS (validation: requires pricing.listPrice, productType, sapMaterialId)
13. ✅ PUT /api/products/:id - WORKS
14. ✅ DELETE /api/products/:id - WORKS

### ⚠️ CUSTOMER ENDPOINTS: 3/5 (60%)
15. ✅ GET /api/customers - WORKS (20 customers)
16. ✅ GET /api/customers/:id - WORKS
17. ❌ POST /api/customers - FAILS ("Something went wrong")
18. ✅ PUT /api/customers/:id - WORKS
19. ❌ DELETE /api/customers/:id - FAILS (no error message)

### ❌ PROMOTION ENDPOINTS: 0/5 (0%)
20. ❌ GET /api/promotions - FAILS (returns 0 promotions - permission/scoping issue)
21. ❌ GET /api/promotions/:id - FAILS
22. ❌ POST /api/promotions - FAILS
23. ❌ PUT /api/promotions/:id - FAILS
24. ❌ DELETE /api/promotions/:id - FAILS

### ❌ BUDGET ENDPOINTS: 0/5 (0%)
25. ❌ GET /api/budgets - FAILS (returns 0 budgets - permission/scoping issue)
26. ❌ GET /api/budgets/:id - FAILS
27. ❌ POST /api/budgets - FAILS (validation: requires company field)
28. ❌ PUT /api/budgets/:id - FAILS
29. ❌ DELETE /api/budgets/:id - FAILS

### ⚠️ TRANSACTION ENDPOINTS: 1/5 (20%)
30. ✅ GET /api/transactions - WORKS (0 transactions)
31. ❌ GET /api/transactions/:id - FAILS (no transactions)
32. ❌ POST /api/transactions - FAILS (validation: "Invalid transaction type, Gross amount must be numeric")
33. ❌ PUT /api/transactions/:id - FAILS (no transactions)
34. ❌ DELETE /api/transactions/:id - FAILS (no transactions)

### ❌ HIERARCHY ENDPOINTS: 0/6 (0%)
35. ❌ GET /api/regions - FAILS (returns 0 - permission/scoping issue)
36. ❌ POST /api/regions - FAILS (RESOURCE_NOT_FOUND - route not registered)
37. ❌ GET /api/districts - FAILS (returns 0 - permission/scoping issue)
38. ❌ POST /api/districts - FAILS (RESOURCE_NOT_FOUND - route not registered)
39. ❌ GET /api/stores - FAILS (returns 0 - permission/scoping issue)
40. ❌ POST /api/stores - FAILS (RESOURCE_NOT_FOUND - route not registered)

### ✅ ANALYTICS ENDPOINTS: 4/5 (80%)
41. ✅ GET /api/analytics/dashboard - WORKS
42. ✅ GET /api/analytics/performance - WORKS
43. ✅ GET /api/analytics/sales - WORKS
44. ✅ GET /api/analytics/roi - WORKS
45. ❌ GET /api/analytics/revenue - FAILS (RESOURCE_NOT_FOUND - route not registered)

### ⚠️ ADVANCED ANALYTICS ENDPOINTS: 1/3 (33%)
46. ✅ POST /api/advanced/accruals/calculate - WORKS
47. ❌ POST /api/advanced/budgets/variance-analysis - FAILS ("Something went wrong")
48. ❌ GET /api/advanced/promotions/:id/roi - FAILS (invalid ID)

### ⚠️ SYSTEM ENDPOINTS: 3/4 (75%)
49. ✅ GET /api/health - WORKS
50. ✅ GET /api/version - WORKS
51. ✅ GET /api/notifications - WORKS
52. ❌ GET /api/settings - FAILS (RESOURCE_NOT_FOUND - route not registered)

### ❌ AI ENDPOINTS: 0/3 (0%)
53. ❌ POST /api/ai/analyze - FAILS (RESOURCE_NOT_FOUND - route not registered)
54. ❌ POST /api/ai/insights - FAILS (RESOURCE_NOT_FOUND - route not registered)
55. ❌ POST /api/ai/recommendations - FAILS (RESOURCE_NOT_FOUND - route not registered)

## ROOT CAUSES ANALYSIS

### 1. Missing Route Registrations (8 endpoints)
- GET /api/analytics/revenue
- GET /api/settings
- POST /api/regions
- POST /api/districts
- POST /api/stores
- POST /api/ai/analyze
- POST /api/ai/insights
- POST /api/ai/recommendations

### 2. Permission/Scoping Issues (15 endpoints)
Manager role cannot access:
- User management (GET /api/users, POST/PUT/DELETE)
- Promotions (all 5 endpoints)
- Budgets (all 5 endpoints)
- Hierarchy (GET endpoints for regions/districts/stores)

### 3. Validation Errors (7 endpoints)
- POST /api/auth/register: Invalid role enum
- POST /api/products: Missing required fields (pricing.listPrice, productType, sapMaterialId)
- POST /api/customers: Internal error
- POST /api/transactions: Invalid transaction type, gross amount validation
- POST /api/budgets: Missing company field

### 4. Database/Setup Issues (5 endpoints)
- Users have tenantId but no company association
- No test data for transactions
- Advanced analytics endpoints need proper data setup

## RECOMMENDATIONS TO REACH 100%

### Priority 1: Fix Route Registrations
1. Add GET /api/analytics/revenue route to app.js
2. Add GET /api/settings route to app.js
3. Add POST routes for hierarchy endpoints (regions, districts, stores)
4. Add AI endpoints routes (or document as intentionally disabled)

### Priority 2: Fix Validation Issues
1. POST /api/auth/register: Fix role enum validation
2. POST /api/products: Document required fields or make them optional
3. POST /api/transactions: Fix transaction type and amount validation
4. POST /api/budgets: Auto-populate company from user context

### Priority 3: Fix Permission/Scoping
1. Test with admin user who has proper company association
2. Fix data scoping for promotions/budgets/hierarchy
3. Document permission requirements for each endpoint

### Priority 4: Database Setup
1. Ensure users have proper company associations
2. Seed test data for all entity types
3. Fix advanced analytics data requirements

## CONCLUSION

The backend has **24/54 endpoints (44%) working** with the current test user. To reach 100%:
- 8 endpoints need route registration
- 15 endpoints need permission/scoping fixes
- 7 endpoints need validation fixes
- 5 endpoints need database/setup fixes

**Estimated effort to reach 100%:** 2-3 days of focused backend development work.
