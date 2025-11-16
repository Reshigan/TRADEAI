# Route Audit Matrix

**Generated:** 2025-11-16  
**Purpose:** Identify missing routes, broken navigation, and gaps between frontend navigation targets and defined routes

## Summary

- **Frontend Navigate Targets:** 59 unique paths
- **App.js Defined Routes:** 92 routes
- **Backend Route Files:** 64 files

## Status Legend
- 🔴 **RED**: Missing route - frontend navigates to it but no route defined
- 🟡 **YELLOW**: Route exists but may have issues (missing detail pages, modal components used as pages, etc.)
- 🟢 **GREEN**: Route exists and appears functional

---

## Missing Routes (RED 🔴)

### Critical - Causes 404 Errors

| Navigate Target | Status | Issue | Fix Required |
|----------------|--------|-------|--------------|
| `/reports/schedule` | 🔴 | No route in App.js | Add route + component |
| `/profile` | 🔴 | No route in App.js | Add route + component |
| `/register` | 🔴 | No route in App.js | Add route + component |
| `/enterprise/budget` | 🔴 | No route in App.js | Add route + component |
| `/enterprise/promotions` | 🔴 | No route in App.js | Add route + component |
| `/enterprise/trade-spend` | 🔴 | No route in App.js | Add route + component |
| `/vendors/:id` | 🔴 | Missing detail route | Add route (VendorDetail exists) |
| `/vendors/:id/edit` | 🔴 | Missing edit route | Add route (VendorForm exists) |

---

## Routes with Issues (YELLOW 🟡)

### Modal Components Used as Pages

| Route | Component | Issue | Fix Required |
|-------|-----------|-------|--------------|
| `/activities/:id` | ActivityDetail | Expects modal props (open, onClose, onUpdate, onDelete) | Create ActivityDetailPage wrapper |
| `/activities/new` | ActivityForm | Expects modal props (open, onClose, onSubmit) | Create ActivityFormPage wrapper |

### Admin Routes - Potential 404 Issues

| Route | Status | Issue | Fix Required |
|-------|--------|-------|--------------|
| `/admin/users` | 🟡 | No AdminLayout, no base /admin route | Create AdminLayout with nested routes |
| `/admin/users/:id` | 🟡 | Uses UserDetail but may not work in admin context | Verify component works |
| `/admin/users/:id/edit` | 🟡 | Uses UserForm but may not work in admin context | Verify component works |
| `/admin/users/new` | 🟡 | Uses UserForm but may not work in admin context | Verify component works |

### Path Inconsistencies

| Issue | Paths | Fix Required |
|-------|-------|--------------|
| Duplicate directories | `pages/trading-terms/` AND `pages/tradingterms/` | Standardize on one path |
| Query params in navigate | `/analytics?view=inventory`, `/simulations?type=budget`, etc. | Verify routes handle query params |

---

## Functional Routes (GREEN 🟢)

### Core Modules - Fully Wired

| Module | List | Detail | Create | Edit | Notes |
|--------|------|--------|--------|------|-------|
| Campaigns | ✅ `/campaigns` | ✅ `/campaigns/:id` | ✅ `/campaigns/new` | ✅ `/campaigns/:id/edit` | Recently added |
| Trade Spends | ✅ `/trade-spends` | ✅ `/trade-spends/:id` | ✅ `/trade-spends/new` | ✅ `/trade-spends/:id/edit` | Recently fixed |
| Rebates | ✅ `/rebates` | ✅ `/rebates/:id` | ✅ `/rebates/new` | ✅ `/rebates/:id/edit` | Recently added |
| Approvals | ✅ `/approvals` | ✅ `/approvals/:id` | N/A | N/A | Recently added |
| Claims | ✅ `/claims` | ✅ `/claims/:id` | ✅ `/claims/create` | N/A | Recently added |
| Deductions | ✅ `/deductions` | ✅ `/deductions/:id` | ✅ `/deductions/create` | N/A | Recently added |
| Customers | ✅ `/customers` | ✅ `/customers/:id` | ✅ `/customers/new-flow` | ✅ `/customers/:id/edit` | ✅ |
| Products | ✅ `/products` | ✅ `/products/:id` | ✅ `/products/new-flow` | ✅ `/products/:id/edit` | ✅ |
| Promotions | ✅ `/promotions` | ✅ `/promotions/:id` | ✅ `/promotions/new` | ✅ `/promotions/:id/edit` | ✅ |
| Budgets | ✅ `/budgets` | ✅ `/budgets/:id` | ✅ `/budgets/new-flow` | ✅ `/budgets/:id/edit` | ✅ |
| Trading Terms | ✅ `/trading-terms` | ✅ `/trading-terms/:id` | ✅ `/trading-terms/new` | ✅ `/trading-terms/:id/edit` | ✅ |
| Companies | ✅ `/companies` | ✅ `/companies/:id` | ✅ `/companies/new` | ✅ `/companies/:id/edit` | ✅ |
| Users | ✅ `/users` | ✅ `/users/:id` | ✅ `/users/new` | ✅ `/users/:id/edit` | ✅ |

### Partial Routes - Missing Detail/Edit

| Module | List | Detail | Create | Edit | Missing |
|--------|------|--------|--------|------|---------|
| Vendors | ✅ `/vendors` | 🔴 Missing | ✅ `/vendors/new` | 🔴 Missing | Detail + Edit routes |
| Activities | ✅ `/activities` | 🟡 `/activities/:id` | 🟡 `/activities/new` | 🔴 Missing | Edit route + wrappers |

---

## Backend API Coverage

**Note:** Backend route extraction needs improvement. Manual verification required for:
- `/api/activities` endpoints
- `/api/rebates` endpoints  
- `/api/vendors` endpoints
- `/api/admin/users` endpoints
- `/api/reports/schedule` endpoint

---

## Action Items

### Immediate (Track 1 - Stabilize Navigation)

1. **Add Missing Routes (8 routes)**
   - `/reports/schedule` → ReportSchedule component
   - `/profile` → UserProfile component
   - `/register` → Register component
   - `/enterprise/budget` → EnterpriseBudget component
   - `/enterprise/promotions` → EnterprisePromotions component
   - `/enterprise/trade-spend` → EnterpriseTradeSpend component
   - `/vendors/:id` → VendorDetail component
   - `/vendors/:id/edit` → VendorForm component

2. **Fix Admin Layout**
   - Create AdminLayout component
   - Add base `/admin` route
   - Nest all admin routes under AdminLayout
   - Add role guards (admin/super_admin only)

3. **Create Modal-to-Page Wrappers**
   - ActivityDetailPage wrapper for `/activities/:id`
   - ActivityFormPage wrapper for `/activities/new`

4. **Standardize Paths**
   - Resolve trading-terms vs tradingterms duplicate directories
   - Update all imports to use consistent path

### Systematic (Track 2 - Full Depth System)

5. **Master Data Context**
   - Create MasterFilterContext (brandId, customerId, period, productId)
   - Sync with URL query params
   - Apply filters across all list pages

6. **CRUD Depth Per Module**
   - Verify each module has complete CRUD operations
   - Add missing backend endpoints
   - Ensure all pages use real services (no mocks)

7. **Cross-Module Relationships**
   - Wire brand → products filtering
   - Wire customer → promotions/spends filtering
   - Wire vendor → trade spends filtering
   - Add breadcrumbs and cross-links

---

## Next Steps

1. Fix all RED items (missing routes)
2. Fix all YELLOW items (admin layout, modal wrappers)
3. Verify backend endpoints exist for all frontend routes
4. Build Master Data Context for cross-compatibility
5. Implement full CRUD depth for all modules
6. Test end-to-end navigation flows
