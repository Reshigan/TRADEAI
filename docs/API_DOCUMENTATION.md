# TradeAI API Documentation

## Overview

The TradeAI API provides comprehensive endpoints for managing trade intelligence data, analytics, and reporting. All endpoints require authentication and implement tenant isolation for multi-organization support.

## Authentication

### JWT Token Authentication

All API requests must include a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Login Endpoint

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "admin",
    "organization": "org_id"
  }
}
```

## Report Endpoints

### Product Reports

#### Get Product Overview
```http
GET /api/reports/products/overview
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (optional): Start date for data range (YYYY-MM-DD)
- `endDate` (optional): End date for data range (YYYY-MM-DD)
- `category` (optional): Product category filter
- `limit` (optional): Number of records to return (default: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalRevenue": 2847392,
      "unitsSold": 18429,
      "avgMargin": 34.2,
      "activeProducts": 127
    },
    "topProducts": [
      {
        "id": "prod_001",
        "name": "Product A",
        "revenue": 450000,
        "units": 2500,
        "margin": 38.5
      }
    ],
    "trends": [
      {
        "date": "2025-01-01",
        "revenue": 125000,
        "units": 850
      }
    ]
  }
}
```

#### Get Sales Performance
```http
GET /api/reports/products/sales-performance
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "salesData": [
      {
        "productId": "prod_001",
        "productName": "Product A",
        "monthlySales": [
          {
            "month": "2025-01",
            "revenue": 125000,
            "units": 850,
            "growth": 12.5
          }
        ]
      }
    ],
    "summary": {
      "totalRevenue": 2847392,
      "growthRate": 15.3,
      "topPerformer": "Product A"
    }
  }
}
```

### Promotion Reports

#### Get Campaign Overview
```http
GET /api/reports/promotions/campaigns
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Campaign status filter (active, completed, planned)
- `channel` (optional): Channel filter
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalROI": 264.8,
      "totalSpend": 911767,
      "avgUplift": 25.0,
      "totalConversions": 13162
    },
    "campaigns": [
      {
        "id": "camp_001",
        "name": "Summer Sale 2025",
        "status": "active",
        "roi": 285.5,
        "spend": 125000,
        "uplift": 28.3,
        "conversions": 2450
      }
    ]
  }
}
```

#### Get ROI Analysis
```http
GET /api/reports/promotions/roi-analysis
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roiAnalysis": [
      {
        "campaignId": "camp_001",
        "campaignName": "Summer Sale 2025",
        "investment": 125000,
        "revenue": 356875,
        "roi": 285.5,
        "roiTrend": [
          {
            "week": 1,
            "roi": 150.2
          },
          {
            "week": 2,
            "roi": 285.5
          }
        ]
      }
    ],
    "benchmarks": {
      "industryAverage": 220.0,
      "companyAverage": 264.8
    }
  }
}
```

### Trade Spend Reports

#### Get Spend Overview
```http
GET /api/reports/tradespend/overview
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalBudget": 1390585,
      "actualSpend": 1391281,
      "averageROI": 359.8,
      "budgetUtilization": 100.1
    },
    "programs": [
      {
        "customer": "Customer A",
        "budget": 1088900,
        "actualSpend": 723447,
        "salesImpact": 260230,
        "roi": 365.7,
        "utilization": 66.4,
        "status": "Completed"
      }
    ],
    "categoryBreakdown": [
      {
        "category": "Beverages",
        "percentage": 52,
        "amount": 723447
      },
      {
        "category": "FMCG",
        "percentage": 48,
        "amount": 667834
      }
    ]
  }
}
```

#### Get Budget vs Actual Analysis
```http
GET /api/reports/tradespend/budget-actual
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comparison": [
      {
        "period": "2025-01",
        "budget": 115882,
        "actual": 115940,
        "variance": 58,
        "variancePercent": 0.05
      }
    ],
    "summary": {
      "totalBudget": 1390585,
      "totalActual": 1391281,
      "totalVariance": 696,
      "variancePercent": 0.05
    },
    "forecasts": [
      {
        "period": "2025-02",
        "budgetForecast": 120000,
        "spendForecast": 118500,
        "confidence": 85.2
      }
    ]
  }
}
```

## Core Entity Endpoints

### Customers

#### List Customers
```http
GET /api/customers
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 20)
- `search` (optional): Search term
- `status` (optional): Status filter
- `channel` (optional): Channel filter

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "cust_001",
        "name": "Customer A",
        "code": "CUST001",
        "status": "active",
        "channel": "retail",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### Create Customer
```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Customer",
  "code": "NEWCUST",
  "email": "customer@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "status": "active",
  "channel": "retail"
}
```

### Products

#### List Products
```http
GET /api/products
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_001",
        "name": "Product A",
        "sku": "SKU001",
        "category": "Beverages",
        "price": 25.99,
        "cost": 16.00,
        "status": "active"
      }
    ]
  }
}
```

### Promotions

#### List Promotions
```http
GET /api/promotions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "promotions": [
      {
        "id": "promo_001",
        "name": "Summer Sale",
        "type": "discount",
        "value": 20,
        "startDate": "2025-06-01",
        "endDate": "2025-08-31",
        "status": "active"
      }
    ]
  }
}
```

### Trade Spends

#### List Trade Spends
```http
GET /api/trade-spends
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tradeSpends": [
      {
        "id": "ts_001",
        "customer": "Customer A",
        "amount": 50000,
        "type": "promotional_allowance",
        "startDate": "2025-01-01",
        "endDate": "2025-03-31",
        "status": "active"
      }
    ]
  }
}
```

## Analytics Endpoints

### Dashboard Analytics
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalRevenue": 5847392,
      "totalCustomers": 150,
      "activePromotions": 12,
      "avgROI": 285.5
    },
    "trends": {
      "revenue": [
        {
          "period": "2025-01",
          "value": 487283
        }
      ]
    }
  }
}
```

### Forecasting
```http
GET /api/forecasting/sales
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (required): Forecast type (sales, demand, budget)
- `horizon` (optional): Forecast horizon in months (default: 12)
- `product` (optional): Product ID filter
- `customer` (optional): Customer ID filter

**Response:**
```json
{
  "success": true,
  "data": {
    "forecast": [
      {
        "period": "2025-02",
        "predicted": 520000,
        "confidence": 85.2,
        "lower_bound": 468000,
        "upper_bound": 572000
      }
    ],
    "accuracy": {
      "mape": 8.5,
      "rmse": 45000,
      "r2": 0.92
    },
    "model": {
      "type": "ensemble",
      "features": ["seasonality", "trend", "promotions"],
      "last_trained": "2025-01-15T10:30:00Z"
    }
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "message": "Email is required"
    }
  }
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED`: Missing or invalid authentication token
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid request parameters
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_SERVER_ERROR`: Server error

## Rate Limiting

API requests are rate-limited per user:

- **Standard Users**: 1000 requests per hour
- **Premium Users**: 5000 requests per hour
- **Enterprise Users**: 10000 requests per hour

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination:

**Request:**
```http
GET /api/customers?page=2&limit=50
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 500,
    "pages": 10,
    "hasNext": true,
    "hasPrev": true
  }
}
```

## Filtering and Sorting

### Filtering
```http
GET /api/products?category=Beverages&status=active
```

### Sorting
```http
GET /api/customers?sort=name&order=asc
```

### Search
```http
GET /api/customers?search=customer%20name
```

## Webhooks

### Webhook Events

- `customer.created`
- `customer.updated`
- `promotion.started`
- `promotion.ended`
- `trade_spend.created`
- `report.generated`

### Webhook Payload

```json
{
  "event": "customer.created",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "id": "cust_001",
    "name": "New Customer",
    "organization": "org_001"
  }
}
```

## SDK and Libraries

### JavaScript SDK

```javascript
import TradeAI from '@tradeai/sdk';

const client = new TradeAI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.tradeai.com'
});

// Get product reports
const reports = await client.reports.products.overview();
```

### Python SDK

```python
from tradeai import TradeAI

client = TradeAI(api_key='your-api-key')

# Get promotion reports
reports = client.reports.promotions.campaigns()
```

## Testing

### Test Environment

Base URL: `https://api-test.tradeai.com`

### Test Credentials

```
Email: test@tradeai.com
Password: TestPassword123
```

### Postman Collection

Download the Postman collection: [TradeAI API Collection](./postman/TradeAI_API.postman_collection.json)

---

*Last Updated: October 15, 2025*
*API Version: v1.0*