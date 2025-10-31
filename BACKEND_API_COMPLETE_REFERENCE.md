# TRADEAI Backend API - Complete Reference
## Discovered from Actual Backend Source Code

**Backend URL**: `https://tradeai.gonxt.tech/api`  
**Date**: October 31, 2025  
**Source**: Production Backend Server  
**Total Route Files**: 32  
**Total Controllers**: 20+

---

## Table of Contents

1. [Authentication & Security](#authentication--security)
2. [Dashboard & Analytics](#dashboard--analytics)
3. [Budget Management](#budget-management)
4. [Promotion Management](#promotion-management)
5. [Customer Management](#customer-management)
6. [Product Management](#product-management)
7. [Sales & Trade Spend](#sales--trade-spend)
8. [Reporting](#reporting)
9. [ML & AI Features](#ml--ai-features)
10. [Enterprise Features](#enterprise-features)
11. [System Integration](#system-integration)
12. [Administration](#administration)

---

## Authentication & Security

### Base Path: `/api/auth`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login with email/username + password | No |
| POST | `/quick-login` | Demo quick login | No |
| POST | `/logout` | Logout current user | Yes |
| POST | `/refresh-token` | Refresh access token | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |
| POST | `/change-password` | Change password (logged in) | Yes |
| GET | `/me` | Get current user profile | Yes |
| PUT | `/me` | Update current user profile | Yes |
| POST | `/verify-2fa` | Verify 2FA code | Yes |
| POST | `/enable-2fa` | Enable 2FA for account | Yes |
| POST | `/disable-2fa` | Disable 2FA for account | Yes |

**Login Request**:
```json
{
  "email": "user@example.com",  // or "username": "johndoe"
  "password": "SecurePass123!",
  "tenantId": "optional-tenant-id"
}
```

**Login Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-token-here",
    "refreshToken": "refresh-token-here",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "kam",
      "department": "sales"
    }
  }
}
```

### Security Module: `/api/security`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/authenticate` | Authenticate user |
| GET | `/session/validate` | Validate current session |
| POST | `/logout` | Logout user |
| POST | `/permissions/check` | Check user permissions |
| GET | `/permissions/user/:userId` | Get user permissions |
| GET | `/roles` | List all roles |
| POST | `/roles` | Create new role |
| GET | `/roles/:id` | Get role by ID |
| PUT | `/roles/:id` | Update role |
| DELETE | `/roles/:id` | Delete role |
| POST | `/roles/:roleId/assign` | Assign role to user |
| GET | `/permissions` | List all permissions |
| GET | `/permissions/matrix` | Get permission matrix |
| POST | `/permissions` | Create permission |
| GET | `/audit-logs` | Get audit logs |
| GET | `/audit-logs/summary` | Audit log summary |
| GET | `/audit-logs/:id` | Get specific audit log |
| GET | `/events` | Get security events |
| GET | `/dashboard` | Security dashboard |
| PUT | `/events/:id` | Update security event |

---

## Dashboard & Analytics

### Dashboard: `/api/dashboards`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get main dashboard data |
| GET | `/executive` | Executive dashboard |
| GET | `/kam` | KAM dashboard |
| GET | `/analytics` | Analytics dashboard |
| POST | `/subscribe/:dashboardType` | Subscribe to dashboard updates |

### Analytics: `/api/analytics`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Analytics overview |
| GET | `/dashboard` | Analytics dashboard |
| GET | `/currencies` | Get available currencies |
| GET | `/sales` | Sales analytics |
| GET | `/promotions` | Promotion analytics |
| GET | `/budgets` | Budget analytics |
| GET | `/trade-spend` | Trade spend analytics |
| GET | `/customers` | Customer analytics |
| GET | `/products` | Product analytics |
| GET | `/predictions` | Predictive analytics |
| GET | `/roi/:promotionId` | Calculate promotion ROI |
| POST | `/bulk-roi` | Bulk ROI calculation |
| GET | `/lift/:promotionId` | Calculate promotion lift |
| POST | `/bulk-lift` | Bulk lift calculation |
| POST | `/predict` | Predict performance |
| POST | `/optimize-spend` | Optimize spending |
| GET | `/insights` | Get AI insights |
| GET | `/export` | Export analytics data |
| GET | `/performance` | Performance metrics |
| DELETE | `/cache` | Clear analytics cache |

---

## Budget Management

### Budgets: `/api/budgets`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create new budget |
| GET | `/` | List all budgets |
| GET | `/:id` | Get budget by ID |
| PUT | `/:id` | Update budget |
| DELETE | `/:id` | Delete budget |
| POST | `/:id/submit` | Submit budget for approval |
| POST | `/:id/approve` | Approve budget |
| POST | `/generate-forecast` | Generate budget forecast |
| POST | `/compare` | Compare budgets |
| GET | `/:id/performance` | Get budget performance |
| POST | `/:id/new-version` | Create new budget version |
| POST | `/:id/lock` | Lock budget |

### Enterprise Budgets: `/api/enterprise/budget`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/scenarios` | Create budget scenario |
| POST | `/scenarios/compare` | Compare scenarios |
| POST | `/:budgetId/variance` | Calculate variance |
| POST | `/multi-year-plan` | Multi-year planning |
| POST | `/optimize` | Optimize budget allocation |
| POST | `/:budgetId/workflow` | Budget workflow |
| POST | `/consolidate` | Consolidate budgets |
| GET | `/dashboard` | Budget dashboard |
| POST | `/bulk/create` | Bulk create budgets |
| PUT | `/bulk/update` | Bulk update budgets |
| DELETE | `/bulk/delete` | Bulk delete budgets |
| GET | `/export` | Export budgets |
| POST | `/import` | Import budgets |
| POST | `/simulate` | Simulate budget scenarios |

---

## Promotion Management

### Promotions: `/api/promotions`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create new promotion |
| GET | `/` | List all promotions |
| GET | `/calendar` | Promotion calendar view |
| GET | `/:id` | Get promotion by ID |
| PUT | `/:id` | Update promotion |
| DELETE | `/:id` | Delete promotion |
| POST | `/:id/submit` | Submit for approval |
| POST | `/:id/approve` | Approve promotion |
| POST | `/:id/calculate-performance` | Calculate performance |
| GET | `/:id/cannibalization` | Analyze cannibalization |
| POST | `/:id/clone` | Clone promotion |

### Campaigns: `/api/campaigns` (if mounted)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List campaigns |
| GET | `/:id` | Get campaign by ID |
| POST | `/` | Create campaign |
| PUT | `/:id` | Update campaign |
| DELETE | `/:id` | Delete campaign |
| POST | `/:id/promotions` | Add promotion to campaign |
| DELETE | `/:id/promotions/:promotionId` | Remove promotion from campaign |

---

## Customer Management

### Customers: `/api/customers`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all customers |
| GET | `/:id` | Get customer by ID |
| POST | `/` | Create new customer |
| PUT | `/:id` | Update customer |
| DELETE | `/:id` | Delete customer |
| GET | `/:id/hierarchy` | Get customer hierarchy |

**Customer Object**:
```json
{
  "id": "customer-id",
  "name": "Walmart",
  "tier": "platinum",
  "industry": "retail",
  "accountManager": "user-id",
  "creditLimit": 1000000,
  "paymentTerms": "net30"
}
```

---

## Product Management

### Products: `/api/products`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all products |
| GET | `/:id` | Get product by ID |
| POST | `/` | Create new product |
| PUT | `/:id` | Update product |
| DELETE | `/:id` | Delete product |
| GET | `/:id/hierarchy` | Get product hierarchy |
| GET | `/category/:category` | Get products by category |

**Product Object**:
```json
{
  "id": "product-id",
  "sku": "PRD-001",
  "name": "Product Name",
  "category": "beverages",
  "brand": "Brand Name",
  "price": 99.99,
  "cost": 50.00,
  "margin": 49.99
}
```

---

## Sales & Trade Spend

### Sales: `/api/sales`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/overview` | Sales overview |
| GET | `/by-period` | Sales by time period |
| GET | `/top-customers` | Top performing customers |
| GET | `/top-products` | Top performing products |
| GET | `/by-channel` | Sales by channel |
| GET | `/trends` | Sales trends |
| POST | `/` | Create sales record |
| GET | `/transactions` | Get transactions |

### Sales History: `/api/sales-history`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get sales history |
| GET | `/aggregate` | Aggregated sales data |
| POST | `/import` | Import sales data |
| GET | `/trends` | Sales trends analysis |

### Trade Spend: `/api/trade-spends`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List trade spends |
| POST | `/` | Create trade spend |
| GET | `/:id` | Get trade spend details |
| PUT | `/:id` | Update trade spend |
| DELETE | `/:id` | Delete trade spend |

---

## Reporting

### Reports: `/api/reports`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all reports |
| GET | `/promotion-effectiveness` | Promotion effectiveness report |
| GET | `/budget-utilization` | Budget utilization report |
| GET | `/customer-performance` | Customer performance report |
| GET | `/product-performance` | Product performance report |
| GET | `/trade-spend-roi` | Trade spend ROI report |
| POST | `/export` | Export report data |
| POST | `/schedule` | Schedule automated report |

---

## ML & AI Features

### ML Models: `/api/ml`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict/customer-behavior` | Predict customer behavior |
| POST | `/predict/demand-forecast` | Forecast demand |
| POST | `/predict/churn` | Predict customer churn |
| POST | `/optimize/promotion` | Optimize promotion strategy |
| POST | `/optimize/price` | Optimize pricing |
| POST | `/predict/batch` | Batch predictions |
| GET | `/recommendations/products/:userId` | Product recommendations |
| POST | `/recommendations/personalized-promotions/:userId` | Personalized promotions |
| GET | `/recommendations/hybrid/:userId` | Hybrid recommendations |
| POST | `/recommendations/realtime/:userId` | Real-time recommendations |
| POST | `/recommendations/batch` | Batch recommendations |
| POST | `/segment/customer` | Customer segmentation |
| GET | `/insights/generate` | Generate AI insights |
| POST | `/alerts/check` | Check for alerts |
| GET | `/models/metrics` | Model performance metrics |
| GET | `/models/training-status` | Training status |
| POST | `/models/retrain` | Retrain models |
| POST | `/ab-test/create` | Create A/B test |
| GET | `/ab-test/:testId/results` | Get A/B test results |
| GET | `/models` | List all models |

### AI Chatbot: `/api/ai/chatbot`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/initialize` | Initialize chatbot session |
| POST | `/message` | Send message to chatbot |
| POST | `/data-query` | Query data via chatbot |
| POST | `/insights` | Get AI insights |
| POST | `/generate-report` | Generate report via chatbot |
| POST | `/suggested-questions` | Get suggested questions |
| POST | `/search` | Search data |

---

## Enterprise Features

### Enterprise: `/api/enterprise`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Enterprise dashboard |
| GET | `/multi-company` | Multi-company view |
| POST | `/consolidate` | Consolidate data |
| GET | `/hierarchy` | Organization hierarchy |
| GET | `/approvals` | Approval workflows |
| GET | `/governance` | Governance settings |
| POST | `/workflow` | Create workflow |
| POST | `/allocation` | Resource allocation |

---

## System Integration

### SAP Integration: `/api/sap`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sync/master-data` | Sync master data from SAP |
| GET | `/sync/status/:jobId` | Get sync job status |
| POST | `/sync/customers` | Sync customers from SAP |
| POST | `/sync/products` | Sync products from SAP |
| POST | `/sync/sales` | Sync sales data from SAP |
| POST | `/post/trade-spend` | Post trade spend to SAP |
| GET | `/status` | SAP connection status |

### Integrations: `/api/integrations`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/external` | List external integrations |
| GET | `/external/:integrationId` | Get integration details |
| POST | `/external/:integrationId/connect` | Connect to external system |
| POST | `/external/:integrationId/disconnect` | Disconnect integration |
| POST | `/external/:integrationId/sync` | Sync with external system |
| GET | `/external/metrics/overview` | Integration metrics |
| POST | `/external/bulk/sync` | Bulk sync |
| POST | `/webhooks` | Create webhook |
| GET | `/webhooks` | List webhooks |
| GET | `/webhooks/:webhookId` | Get webhook details |
| PUT | `/webhooks/:webhookId` | Update webhook |
| DELETE | `/webhooks/:webhookId` | Delete webhook |
| POST | `/webhooks/:webhookId/test` | Test webhook |
| GET | `/webhooks/:webhookId/stats` | Webhook statistics |
| GET | `/webhooks/system/stats` | System webhook stats |
| POST | `/webhooks/events/publish` | Publish webhook event |
| POST | `/webhooks/bulk/update` | Bulk update webhooks |
| POST | `/webhooks/receive/:integrationId` | Receive webhook data |
| POST | `/api/keys/generate` | Generate API key |
| DELETE | `/api/keys/:apiKey` | Delete API key |

### Master Data: `/api/master-data`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/types` | Get master data types |
| POST | `/export` | Export master data |
| POST | `/import` | Import master data |
| POST | `/sync` | Sync master data |

---

## Administration

### Super Admin: `/api/super-admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tenants` | Create new tenant |
| GET | `/tenants` | List all tenants |
| GET | `/tenants/:tenantId` | Get tenant details |
| PATCH | `/tenants/:tenantId/status` | Update tenant status |
| DELETE | `/tenants/:tenantId` | Delete tenant |

### Tenants: `/api/tenants`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List tenants |
| POST | `/` | Create tenant |
| GET | `/:id` | Get tenant details |
| PUT | `/:id` | Update tenant |
| DELETE | `/:id` | Delete tenant |

### Users: `/api/users`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all users |
| GET | `/:id` | Get user by ID |
| POST | `/` | Create new user |
| PUT | `/:id` | Update user |
| DELETE | `/:id` | Delete user |

### Companies: `/api/companies`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List companies |
| GET | `/stats` | Company statistics |
| GET | `/:id` | Get company details |
| POST | `/` | Create company |
| PUT | `/:id` | Update company |
| DELETE | `/:id` | Delete company |
| PATCH | `/:id/toggle-status` | Toggle company status |
| POST | `/:id/admin` | Create company admin |

### Activity Grid: `/api/activity-grid`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get activity grid |
| GET | `/heat-map` | Activity heat map |
| GET | `/conflicts` | Detect conflicts |
| POST | `/` | Create activity |
| PUT | `/:id` | Update activity |
| DELETE | `/:id` | Delete activity |
| POST | `/sync` | Sync activities |

### Trading Terms: `/api/trading-terms`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List trading terms |
| POST | `/` | Create trading terms |
| GET | `/:id` | Get trading terms |
| PUT | `/:id` | Update trading terms |
| DELETE | `/:id` | Delete trading terms |

### Vendors: `/api/vendors`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List vendors |
| POST | `/` | Create vendor |
| GET | `/:id` | Get vendor details |
| PUT | `/:id` | Update vendor |
| DELETE | `/:id` | Delete vendor |

### Inventory: `/api/inventory`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List inventory |
| GET | `/low-stock` | Low stock items |

---

## Health & Status

### Health: `/api/health`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/detailed` | Detailed health status |
| GET | `/health/live` | Liveness probe |
| GET | `/health/liveness` | Liveness probe (alt) |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/readiness` | Readiness probe (alt) |
| GET | `/health/startup` | Startup probe |
| GET | `/health/test-tenant/:tenantId` | Test tenant health |

---

## API Response Formats

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* optional error details */ }
}
```

### Pagination
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Authentication

All protected endpoints require an Authorization header:

```
Authorization: Bearer {access_token}
```

Tokens expire after 15 minutes and can be refreshed using the refresh token.

---

## Rate Limiting

- Standard endpoints: 100 requests/minute
- Bulk operations: 10 requests/minute
- Auth endpoints: 5 requests/minute (login/register)

---

## Data Models Summary

### User Roles
- `admin` - System administrator
- `board` - Board member
- `director` - Director level
- `manager` - Manager
- `kam` - Key Account Manager
- `sales_rep` - Sales Representative
- `sales_admin` - Sales Admin
- `analyst` - Data Analyst

### Departments
- `sales`
- `marketing`
- `finance`
- `operations`
- `admin`

### Customer Tiers
- `platinum`
- `gold`
- `silver`
- `bronze`

### Promotion Status
- `draft`
- `submitted`
- `approved`
- `active`
- `completed`
- `cancelled`

### Budget Status
- `draft`
- `submitted`
- `approved`
- `locked`
- `active`

---

**Total Endpoints Discovered**: 200+  
**Authentication Required**: ~95% of endpoints  
**Multi-tenant**: Yes (tenant-based isolation)  
**Real-time**: WebSocket support available

---

This documentation reflects the actual production backend API as of October 31, 2025.
