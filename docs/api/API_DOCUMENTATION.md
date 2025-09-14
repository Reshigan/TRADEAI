# 🔌 TRADEAI - API Documentation

## Document Information
- **Document Type**: API Documentation
- **Version**: 1.0
- **Date**: September 2024
- **Base URL**: `https://tradeai.gonxt.tech/api/v1`
- **Authentication**: JWT Bearer Token

## 1. API Overview

### 1.1 Introduction

The TRADEAI API provides comprehensive access to all platform functionality through RESTful endpoints. The API follows REST principles with JSON request/response format and standard HTTP status codes.

### 1.2 Base Information

- **Protocol**: HTTPS only
- **Format**: JSON
- **Encoding**: UTF-8
- **Rate Limiting**: 1000 requests/hour per user
- **Versioning**: URL path versioning (`/api/v1/`)

### 1.3 Authentication

All API endpoints require authentication using JWT Bearer tokens.

```http
Authorization: Bearer <jwt_token>
```

#### Authentication Flow

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "64f1234567890abcdef123456",
      "email": "user@company.com",
      "role": "trade_manager",
      "company": {
        "id": "64f1234567890abcdef123457",
        "name": "Procter & Gamble"
      }
    }
  }
}
```

## 2. Standard Response Format

### 2.1 Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2024-09-14T10:30:00Z",
    "requestId": "req_abc123xyz789"
  }
}
```

### 2.2 Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-09-14T10:30:00Z",
    "requestId": "req_abc123xyz789"
  }
}
```

### 2.3 Paginated Response

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 3. Authentication Endpoints

### 3.1 Login

**Endpoint:** `POST /api/v1/auth/login`

Authenticate user and receive access tokens.

**Request Body:**
```json
{
  "email": "user@company.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "64f1234567890abcdef123456",
      "email": "user@company.com",
      "role": "trade_manager",
      "permissions": ["budgets.read", "budgets.write"],
      "company": {
        "id": "64f1234567890abcdef123457",
        "name": "Procter & Gamble"
      }
    }
  }
}
```

### 3.2 Refresh Token

**Endpoint:** `POST /api/v1/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

### 3.3 Logout

**Endpoint:** `POST /api/v1/auth/logout`

Invalidate current session and tokens.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

## 4. User Management Endpoints

### 4.1 Get Current User

**Endpoint:** `GET /api/v1/users/me`

Get current authenticated user information.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "64f1234567890abcdef123456",
    "email": "user@company.com",
    "role": "trade_manager",
    "permissions": ["budgets.read", "budgets.write"],
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://cdn.tradeai.com/avatars/john-doe.jpg",
      "title": "Senior Trade Marketing Manager",
      "department": "Marketing"
    },
    "company": {
      "id": "64f1234567890abcdef123457",
      "name": "Procter & Gamble"
    },
    "lastLogin": "2024-09-14T09:15:00Z"
  }
}
```

### 4.2 Update User Profile

**Endpoint:** `PUT /api/v1/users/me`

Update current user profile information.

**Request Body:**
```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Smith",
    "title": "Senior Trade Marketing Manager",
    "phone": "+1-555-0124"
  },
  "preferences": {
    "timezone": "America/New_York",
    "language": "en",
    "notifications": {
      "email": true,
      "budgetAlerts": true
    }
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "64f1234567890abcdef123456",
    "profile": {
      "firstName": "John",
      "lastName": "Smith",
      "title": "Senior Trade Marketing Manager",
      "phone": "+1-555-0124"
    },
    "updatedAt": "2024-09-14T10:30:00Z"
  }
}
```

### 4.3 List Users

**Endpoint:** `GET /api/v1/users`

Get list of users in the company (Admin only).

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `role` (string): Filter by user role
- `search` (string): Search by name or email
- `isActive` (boolean): Filter by active status

**Example:** `GET /api/v1/users?page=1&limit=20&role=trade_manager&search=john`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "64f1234567890abcdef123456",
      "email": "john.doe@company.com",
      "role": "trade_manager",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "title": "Senior Trade Marketing Manager"
      },
      "isActive": true,
      "lastLogin": "2024-09-14T09:15:00Z",
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 5. Budget Management Endpoints

### 5.1 List Budgets

**Endpoint:** `GET /api/v1/budgets`

Get list of budgets accessible to the current user.

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `type` (string): Budget type (annual, quarterly, campaign)
- `status` (string): Budget status (draft, active, locked, archived)
- `year` (integer): Fiscal year
- `search` (string): Search by budget name

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "64f1234567890abcdef123458",
      "name": "Q4 2024 Trade Marketing Budget",
      "type": "quarterly",
      "status": "active",
      "financial": {
        "totalAmount": 5000000.00,
        "spent": 1250000.00,
        "committed": 750000.00,
        "available": 3000000.00,
        "currency": "USD"
      },
      "period": {
        "startDate": "2024-10-01T00:00:00Z",
        "endDate": "2024-12-31T23:59:59Z",
        "fiscalYear": 2024,
        "quarter": 4
      },
      "owner": {
        "id": "64f1234567890abcdef123456",
        "name": "John Doe"
      },
      "createdAt": "2024-08-15T00:00:00Z",
      "updatedAt": "2024-09-14T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### 5.2 Get Budget Details

**Endpoint:** `GET /api/v1/budgets/{budgetId}`

Get detailed information about a specific budget.

**Path Parameters:**
- `budgetId` (string): Budget ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "64f1234567890abcdef123458",
    "name": "Q4 2024 Trade Marketing Budget",
    "description": "Fourth quarter trade marketing budget for all brands",
    "type": "quarterly",
    "status": "active",
    "financial": {
      "totalAmount": 5000000.00,
      "spent": 1250000.00,
      "committed": 750000.00,
      "available": 3000000.00,
      "variance": -50000.00,
      "currency": "USD",
      "lastCalculated": "2024-09-14T10:00:00Z"
    },
    "period": {
      "startDate": "2024-10-01T00:00:00Z",
      "endDate": "2024-12-31T23:59:59Z",
      "fiscalYear": 2024,
      "quarter": 4
    },
    "allocations": [
      {
        "id": "64f1234567890abcdef123459",
        "category": "Trade Promotions",
        "subcategory": "Price Reductions",
        "budgetAmount": 2000000.00,
        "spentAmount": 500000.00,
        "committedAmount": 300000.00,
        "availableAmount": 1200000.00,
        "brands": ["Tide", "Ariel", "Downy"],
        "channels": ["Walmart", "Target", "Amazon"],
        "owner": {
          "id": "64f1234567890abcdef123456",
          "name": "John Doe"
        }
      }
    ],
    "approvals": [
      {
        "level": 1,
        "approver": {
          "id": "64f1234567890abcdef123460",
          "name": "Jane Smith"
        },
        "status": "approved",
        "timestamp": "2024-09-01T14:30:00Z",
        "comments": "Approved with minor adjustments"
      }
    ],
    "metadata": {
      "tags": ["Q4", "holiday", "premium"],
      "customFields": {
        "region": "North America",
        "businessUnit": "Beauty & Grooming"
      }
    },
    "createdAt": "2024-08-15T00:00:00Z",
    "updatedAt": "2024-09-14T10:00:00Z"
  }
}
```

### 5.3 Create Budget

**Endpoint:** `POST /api/v1/budgets`

Create a new budget.

**Request Body:**
```json
{
  "name": "Q1 2025 Trade Marketing Budget",
  "description": "First quarter trade marketing budget",
  "type": "quarterly",
  "financial": {
    "totalAmount": 4500000.00,
    "currency": "USD"
  },
  "period": {
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-03-31T23:59:59Z",
    "fiscalYear": 2025,
    "quarter": 1
  },
  "allocations": [
    {
      "category": "Trade Promotions",
      "subcategory": "Price Reductions",
      "budgetAmount": 1800000.00,
      "brands": ["Tide", "Ariel"],
      "channels": ["Walmart", "Target"]
    }
  ],
  "metadata": {
    "tags": ["Q1", "new-year"],
    "customFields": {
      "region": "North America"
    }
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "64f1234567890abcdef123461",
    "name": "Q1 2025 Trade Marketing Budget",
    "status": "draft",
    "createdAt": "2024-09-14T10:30:00Z"
  }
}
```

### 5.4 Update Budget

**Endpoint:** `PUT /api/v1/budgets/{budgetId}`

Update an existing budget.

**Path Parameters:**
- `budgetId` (string): Budget ID

**Request Body:**
```json
{
  "name": "Q1 2025 Trade Marketing Budget - Updated",
  "financial": {
    "totalAmount": 4750000.00
  },
  "allocations": [
    {
      "id": "64f1234567890abcdef123459",
      "budgetAmount": 1900000.00
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "64f1234567890abcdef123461",
    "name": "Q1 2025 Trade Marketing Budget - Updated",
    "updatedAt": "2024-09-14T10:35:00Z"
  }
}
```

## 6. Transaction Endpoints

### 6.1 List Transactions

**Endpoint:** `GET /api/v1/transactions`

Get list of transactions.

**Query Parameters:**
- `budgetId` (string): Filter by budget ID
- `type` (string): Transaction type (expense, commitment, adjustment)
- `status` (string): Transaction status
- `startDate` (string): Start date filter (ISO 8601)
- `endDate` (string): End date filter (ISO 8601)
- `brand` (string): Filter by brand
- `channel` (string): Filter by channel

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "64f1234567890abcdef123462",
      "budgetId": "64f1234567890abcdef123458",
      "transaction": {
        "type": "expense",
        "amount": 25000.00,
        "currency": "USD",
        "description": "Walmart End Cap Display - Tide Pods",
        "reference": "INV-2024-09-001"
      },
      "details": {
        "vendor": "Walmart Inc.",
        "brand": "Tide",
        "product": "Tide Pods",
        "channel": "Walmart",
        "campaign": "Holiday Promotion 2024"
      },
      "dates": {
        "transactionDate": "2024-09-14T00:00:00Z",
        "effectiveDate": "2024-09-14T00:00:00Z",
        "dueDate": "2024-10-14T00:00:00Z"
      },
      "status": "pending",
      "createdAt": "2024-09-14T10:00:00Z"
    }
  ]
}
```

### 6.2 Create Transaction

**Endpoint:** `POST /api/v1/transactions`

Create a new transaction.

**Request Body:**
```json
{
  "budgetId": "64f1234567890abcdef123458",
  "allocationId": "64f1234567890abcdef123459",
  "transaction": {
    "type": "expense",
    "amount": 15000.00,
    "currency": "USD",
    "description": "Target Display Campaign - Ariel",
    "reference": "INV-2024-09-002"
  },
  "details": {
    "vendor": "Target Corporation",
    "brand": "Ariel",
    "channel": "Target",
    "campaign": "Back to School 2024"
  },
  "dates": {
    "transactionDate": "2024-09-15T00:00:00Z",
    "effectiveDate": "2024-09-15T00:00:00Z",
    "dueDate": "2024-10-15T00:00:00Z"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "64f1234567890abcdef123463",
    "status": "pending",
    "createdAt": "2024-09-14T10:30:00Z"
  }
}
```

## 7. Analytics Endpoints

### 7.1 Get Dashboard Data

**Endpoint:** `GET /api/v1/analytics/dashboard`

Get dashboard analytics data for the current user.

**Query Parameters:**
- `period` (string): Time period (week, month, quarter, year)
- `startDate` (string): Custom start date
- `endDate` (string): Custom end date

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalBudget": 15000000.00,
      "totalSpent": 3750000.00,
      "totalCommitted": 2250000.00,
      "totalAvailable": 9000000.00,
      "utilizationRate": 0.40,
      "variance": -125000.00
    },
    "budgetsByStatus": {
      "active": 8,
      "draft": 3,
      "locked": 2,
      "archived": 1
    },
    "spendByCategory": [
      {
        "category": "Trade Promotions",
        "amount": 2000000.00,
        "percentage": 53.3
      },
      {
        "category": "Display & Merchandising",
        "amount": 1250000.00,
        "percentage": 33.3
      },
      {
        "category": "Advertising",
        "amount": 500000.00,
        "percentage": 13.3
      }
    ],
    "spendTrend": [
      {
        "date": "2024-09-01",
        "amount": 125000.00
      },
      {
        "date": "2024-09-02",
        "amount": 87500.00
      }
    ],
    "topBrands": [
      {
        "brand": "Tide",
        "spent": 1500000.00,
        "budget": 2500000.00,
        "utilization": 0.60
      }
    ]
  }
}
```

### 7.2 Get Budget Performance

**Endpoint:** `GET /api/v1/analytics/budget-performance`

Get detailed budget performance analytics.

**Query Parameters:**
- `budgetId` (string): Specific budget ID
- `groupBy` (string): Group by dimension (brand, channel, category)
- `period` (string): Time period

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overall": {
      "budgetUtilization": 0.65,
      "spendEfficiency": 0.92,
      "forecastAccuracy": 0.87,
      "roi": 1.45
    },
    "byBrand": [
      {
        "brand": "Tide",
        "budget": 2500000.00,
        "spent": 1625000.00,
        "utilization": 0.65,
        "roi": 1.52,
        "variance": -25000.00
      }
    ],
    "byChannel": [
      {
        "channel": "Walmart",
        "budget": 3000000.00,
        "spent": 1950000.00,
        "utilization": 0.65,
        "roi": 1.38
      }
    ],
    "trends": {
      "utilizationTrend": [
        {
          "date": "2024-09-01",
          "utilization": 0.58
        },
        {
          "date": "2024-09-14",
          "utilization": 0.65
        }
      ]
    }
  }
}
```

## 8. Reporting Endpoints

### 8.1 Generate Report

**Endpoint:** `POST /api/v1/reports/generate`

Generate a new report.

**Request Body:**
```json
{
  "name": "Monthly Budget Performance Report",
  "type": "budget_performance",
  "format": "pdf",
  "parameters": {
    "period": {
      "startDate": "2024-09-01T00:00:00Z",
      "endDate": "2024-09-30T23:59:59Z"
    },
    "filters": {
      "brands": ["Tide", "Ariel"],
      "channels": ["Walmart", "Target"]
    },
    "groupBy": ["brand", "channel"],
    "metrics": ["spend", "budget", "variance", "roi"]
  },
  "schedule": {
    "frequency": "monthly",
    "recipients": ["john.doe@company.com"]
  }
}
```

**Response:** `202 Accepted`
```json
{
  "success": true,
  "data": {
    "reportId": "64f1234567890abcdef123464",
    "status": "generating",
    "estimatedCompletion": "2024-09-14T10:35:00Z"
  }
}
```

### 8.2 Get Report Status

**Endpoint:** `GET /api/v1/reports/{reportId}`

Get report generation status and download link.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "64f1234567890abcdef123464",
    "name": "Monthly Budget Performance Report",
    "status": "completed",
    "format": "pdf",
    "size": 2048576,
    "downloadUrl": "https://cdn.tradeai.com/reports/monthly_budget_202409.pdf",
    "expiresAt": "2024-10-14T10:30:00Z",
    "generatedAt": "2024-09-14T10:32:00Z"
  }
}
```

## 9. Error Codes

### 9.1 HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 202 | Accepted - Request accepted for processing |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### 9.2 Application Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_FAILED` | Invalid credentials |
| `AUTHORIZATION_FAILED` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `BUDGET_EXCEEDED` | Budget limit exceeded |
| `INVALID_PERIOD` | Invalid date period |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |

## 10. Rate Limiting

### 10.1 Rate Limits

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| Read Operations | 1000 requests | 1 hour |
| Write Operations | 500 requests | 1 hour |
| Report Generation | 50 requests | 1 hour |
| File Uploads | 100 requests | 1 hour |

### 10.2 Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1631234567
X-RateLimit-Window: 3600
```

## 11. Webhooks

### 11.1 Webhook Events

TRADEAI supports webhooks for real-time notifications:

- `budget.created` - New budget created
- `budget.updated` - Budget modified
- `budget.approved` - Budget approved
- `transaction.created` - New transaction
- `transaction.approved` - Transaction approved
- `report.completed` - Report generation completed

### 11.2 Webhook Payload

```json
{
  "event": "budget.created",
  "timestamp": "2024-09-14T10:30:00Z",
  "data": {
    "id": "64f1234567890abcdef123458",
    "name": "Q4 2024 Trade Marketing Budget",
    "companyId": "64f1234567890abcdef123457"
  },
  "meta": {
    "version": "1.0",
    "requestId": "req_abc123xyz789"
  }
}
```

---

**API Support**

For API support and questions:
- **Documentation**: https://tradeai.gonxt.tech/api/docs
- **Support Email**: api-support@tradeai.com
- **Status Page**: https://status.tradeai.com

**Next Review Date**: December 2024  
**Document Owner**: API Development Team