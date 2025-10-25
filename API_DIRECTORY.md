# 🔌 TRADEAI API Directory
## Complete Transaction-Level TPM API Reference

**Base URL:** `https://api.tradeai.com` or `http://localhost:5000`  
**All endpoints require authentication:** `Authorization: Bearer <token>`

---

## 📊 Transaction Management APIs

### Base Route: `/api/transactions`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| **POST** | `/api/transactions` | Create new transaction | ✅ Ready |
| **GET** | `/api/transactions` | List all transactions (paginated) | ✅ Ready |
| **GET** | `/api/transactions/:id` | Get transaction by ID | ✅ Ready |
| **PUT** | `/api/transactions/:id` | Update transaction | ✅ Ready |
| **DELETE** | `/api/transactions/:id` | Delete transaction | ✅ Ready |
| **POST** | `/api/transactions/:id/approve` | Approve transaction | ✅ Ready |
| **POST** | `/api/transactions/:id/reject` | Reject transaction | ✅ Ready |
| **POST** | `/api/transactions/:id/settle` | Settle transaction | ✅ Ready |
| **GET** | `/api/transactions/search` | Search transactions | ✅ Ready |
| **POST** | `/api/transactions/bulk` | Bulk create transactions | ✅ Ready |

**Example Request:** Create Transaction
```bash
POST /api/transactions
Content-Type: application/json

{
  "type": "accrual",
  "amount": 50000,
  "customerId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "productId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "promotionId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "description": "Q4 Volume Rebate"
}
```

**Example Response:**
```json
{
  "success": true,
  "transaction": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d4",
    "type": "accrual",
    "amount": 50000,
    "status": "draft",
    "transactionDate": "2025-10-25T10:30:00Z"
  }
}
```

---

## 📥 POS Data Import APIs

### Base Route: `/api/pos-import`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| **POST** | `/api/pos-import/upload` | Upload POS data file | ✅ Ready |
| **GET** | `/api/pos-import/preview/:uploadId` | Preview uploaded data | ✅ Ready |
| **POST** | `/api/pos-import/validate/:uploadId` | Validate data mapping | ✅ Ready |
| **POST** | `/api/pos-import/confirm/:uploadId` | Confirm & import data | ✅ Ready |
| **GET** | `/api/pos-import/status/:uploadId` | Check import status | ✅ Ready |
| **GET** | `/api/pos-import/history` | View import history | ✅ Ready |
| **GET** | `/api/pos-import/template` | Download CSV template | ✅ Ready |

**Example Request:** Upload File
```bash
POST /api/pos-import/upload
Content-Type: multipart/form-data

file: pos_data_october.csv
```

**Example Response:**
```json
{
  "success": true,
  "uploadId": "64f1a2b3c4d5e6f7a8b9c0d5",
  "rowCount": 1542,
  "preview": [
    {
      "date": "2025-10-01",
      "storeCode": "ST001",
      "productSKU": "PROD-123",
      "quantity": 150,
      "revenue": 22500
    }
  ]
}
```

---

## 📐 Baseline Calculation APIs

### Base Route: `/api/baseline`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| **POST** | `/api/baseline/calculate` | Calculate baseline for period | ✅ Ready |
| **POST** | `/api/baseline/incremental` | Calculate incremental volume | ✅ Ready |
| **GET** | `/api/baseline/methods` | List available methods | ✅ Ready |

**Available Methods:**
- `pre_period` - Pre-promotion baseline (recommended)
- `control_store` - Control store comparison
- `moving_average` - 4-week moving average
- `exponential_smoothing` - Time-series forecasting
- `auto` - AI selects best method

**Example Request:** Calculate Baseline
```bash
POST /api/baseline/calculate
Content-Type: application/json

{
  "productId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "customerId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "promotionStartDate": "2025-10-01",
  "promotionEndDate": "2025-10-14",
  "method": "pre_period"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "method": "pre_period",
    "baseline": [
      {
        "date": "2025-10-01",
        "baselineQuantity": 120,
        "actualQuantity": 215,
        "incrementalQuantity": 95,
        "lift": 79.2
      }
    ],
    "summary": {
      "totalBaseline": 1680,
      "totalActual": 3010,
      "totalIncremental": 1330,
      "averageLift": 79.2,
      "totalIncrementalRevenue": 199500
    }
  }
}
```

**Example Request:** Calculate Incremental
```bash
POST /api/baseline/incremental
Content-Type: application/json

{
  "productId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "customerId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "promotionStartDate": "2025-10-01",
  "promotionEndDate": "2025-10-14"
}
```

---

## 🔄 Cannibalization Analysis APIs

### Base Route: `/api/cannibalization`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| **POST** | `/api/cannibalization/analyze-promotion` | Analyze promotion cannibalization | ✅ Ready |
| **POST** | `/api/cannibalization/substitution-matrix` | Calculate product substitution | ✅ Ready |
| **POST** | `/api/cannibalization/category-impact` | Category-level impact | ✅ Ready |
| **POST** | `/api/cannibalization/net-incremental` | Net incremental (gross - cann) | ✅ Ready |
| **POST** | `/api/cannibalization/predict` | Predict cannibalization risk | ✅ Ready |

**Example Request:** Analyze Promotion
```bash
POST /api/cannibalization/analyze-promotion
Content-Type: application/json

{
  "promotionId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "productId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "customerId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "promotionStartDate": "2025-10-01",
  "promotionEndDate": "2025-10-14"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "cannibalizationDetected": true,
    "severity": "moderate",
    "promotedProduct": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
      "name": "Premium Cola 2L",
      "sku": "COLA-PRE-2L"
    },
    "incrementalVolume": 1330,
    "cannibalized": [
      {
        "product": {
          "name": "Premium Cola 1.5L",
          "sku": "COLA-PRE-1.5L"
        },
        "volumeDecline": 280,
        "cannibalizationRate": 21.1,
        "revenueImpact": -42000
      }
    ],
    "netIncremental": {
      "grossIncremental": 1330,
      "totalCannibalized": 280,
      "netIncremental": 1050,
      "netIncrementalRate": 78.9
    },
    "interpretation": {
      "summary": "MODERATE cannibalization detected",
      "recommendation": "Monitor this pattern. 21% of lift came from other products."
    }
  }
}
```

**Example Request:** Calculate Net Incremental
```bash
POST /api/cannibalization/net-incremental
Content-Type: application/json

{
  "promotionId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "productId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "customerId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "promotionStartDate": "2025-10-01",
  "promotionEndDate": "2025-10-14"
}
```

**Example Request:** Predict Risk
```bash
POST /api/cannibalization/predict
Content-Type: application/json

{
  "productId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "customerId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "plannedStartDate": "2025-11-01",
  "plannedEndDate": "2025-11-14"
}
```

---

## 📉 Forward Buy Detection APIs

### Base Route: `/api/forward-buy`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| **POST** | `/api/forward-buy/detect` | Detect forward buying | ✅ Ready |
| **POST** | `/api/forward-buy/net-impact` | Net impact (gross - forward buy) | ✅ Ready |
| **POST** | `/api/forward-buy/predict-risk` | Predict forward buy risk | ✅ Ready |
| **POST** | `/api/forward-buy/category-analysis` | Category-level patterns | ✅ Ready |

**Example Request:** Detect Forward Buy
```bash
POST /api/forward-buy/detect
Content-Type: application/json

{
  "promotionId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "productId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "customerId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "promotionStartDate": "2025-10-01",
  "promotionEndDate": "2025-10-14",
  "postPromoPeriodWeeks": 4
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "forwardBuyDetected": true,
    "severity": "moderate",
    "product": {
      "name": "Premium Cola 2L",
      "sku": "COLA-PRE-2L"
    },
    "promotionPeriod": {
      "start": "2025-10-01",
      "end": "2025-10-14"
    },
    "postPromotionPeriod": {
      "start": "2025-10-15",
      "end": "2025-11-11",
      "weeks": 4
    },
    "analysis": {
      "totalBaseline": 1680,
      "totalActual": 1260,
      "totalDip": 420,
      "dipPercentage": 25.0,
      "averageDailyDip": 15,
      "daysWithSignificantDip": 18,
      "recoveryWeek": 3
    },
    "interpretation": {
      "summary": "MODERATE forward buying detected",
      "details": "Post-promotion sales dropped 25.0% below baseline. Some pantry loading occurred. Sales recovered to normal levels in week 3.",
      "recommendation": "Monitor this pattern. If it continues, consider adjusting promotion strategy."
    }
  }
}
```

**Example Request:** Calculate Net Impact
```bash
POST /api/forward-buy/net-impact
Content-Type: application/json

{
  "promotionId": "64f1a2b3c4d5e6f7a8b9c0d3",
  "productId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "customerId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "promotionStartDate": "2025-10-01",
  "promotionEndDate": "2025-10-14"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "promotion": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d3",
      "productId": "64f1a2b3c4d5e6f7a8b9c0d2"
    },
    "volumeAnalysis": {
      "grossIncremental": 1330,
      "forwardBuyVolume": 420,
      "netIncremental": 910,
      "forwardBuyRate": 31.6,
      "trueIncrementalRate": 68.4
    },
    "revenueAnalysis": {
      "grossRevenue": 199500,
      "forwardBuyRevenue": 63000,
      "netRevenue": 136500,
      "netMarginImpact": 40950
    },
    "interpretation": {
      "summary": "ACCEPTABLE: 68.4% of promotion lift was truly incremental.",
      "recommendation": "Forward buy impact is within acceptable range, but monitor ongoing."
    }
  }
}
```

**Example Request:** Predict Risk
```bash
POST /api/forward-buy/predict-risk
Content-Type: application/json

{
  "productId": "64f1a2b3c4d5e6f7a8b9c0d2",
  "customerId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "plannedDiscountPercent": 25
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "prediction": "success",
    "product": {
      "name": "Premium Cola 2L",
      "sku": "COLA-PRE-2L"
    },
    "plannedPromotion": {
      "discountPercent": 25
    },
    "predictedImpact": {
      "risk": "medium",
      "severity": "moderate",
      "expectedDipPercentage": "18.5",
      "confidence": "high"
    },
    "historicalPromotions": [
      {
        "promotionId": "...",
        "startDate": "2025-07-01",
        "discountPercent": 20,
        "dipPercentage": 15.2,
        "recoveryWeek": 3
      }
    ],
    "recommendation": {
      "action": "MONITOR",
      "message": "This discount level (25%) may cause moderate forward buying. Proceed with monitoring.",
      "alternatives": [
        "Test with limited stores first",
        "Monitor post-promotion sales closely"
      ]
    }
  }
}
```

---

## 🏪 Store Hierarchy APIs

### Coming Soon (Backend Complete, Routes Pending)

The store hierarchy functionality is fully built in the backend services but doesn't have API routes yet. Here's what will be available:

**Planned Endpoints:**

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| **GET** | `/api/stores/region/:regionId/performance` | Region performance rollup | ⚠️ Backend Ready |
| **GET** | `/api/stores/district/:districtId/performance` | District performance rollup | ⚠️ Backend Ready |
| **GET** | `/api/stores/:storeId/performance` | Store performance | ⚠️ Backend Ready |
| **GET** | `/api/stores/:storeId/compare` | Compare store vs peers | ⚠️ Backend Ready |
| **GET** | `/api/stores/promotion/:promotionId/analysis` | Promotion by hierarchy | ⚠️ Backend Ready |

**To activate:** Need to create `storeAnalyticsController.js` and `routes/storeAnalytics.js` (2 hours)

---

## 📊 Complete API Summary

### ✅ Production-Ready Endpoints: 29

| Category | Endpoints | Status |
|----------|-----------|--------|
| **Transactions** | 10 | ✅ Ready |
| **POS Import** | 7 | ✅ Ready |
| **Baseline** | 3 | ✅ Ready |
| **Cannibalization** | 5 | ✅ Ready |
| **Forward Buy** | 4 | ✅ Ready |
| **Store Analytics** | 5 | ⚠️ Backend Ready, Routes Pending |

**Total Available:** 29 endpoints  
**Total Planned:** 34 endpoints  
**Completion:** 85% (routes), 100% (services)

---

## 🔐 Authentication

All API endpoints require authentication using Bearer token:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get Token:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d0",
    "name": "John Doe",
    "email": "user@example.com",
    "tenantId": "64f1a2b3c4d5e6f7a8b9c0d6"
  }
}
```

---

## 🧪 Testing APIs

### Using cURL

```bash
# Create transaction
curl -X POST http://localhost:5000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "accrual",
    "amount": 50000,
    "description": "Q4 Rebate"
  }'

# Upload POS data
curl -X POST http://localhost:5000/api/pos-import/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@pos_data.csv"

# Calculate baseline
curl -X POST http://localhost:5000/api/baseline/calculate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "customerId": "CUSTOMER_ID",
    "promotionStartDate": "2025-10-01",
    "promotionEndDate": "2025-10-14",
    "method": "pre_period"
  }'
```

### Using Postman

1. Import collection: [TRADEAI_API.postman_collection.json](coming soon)
2. Set environment variables:
   - `base_url`: http://localhost:5000 or https://api.tradeai.com
   - `token`: Your auth token
3. Run requests

### Using JavaScript

```javascript
// Calculate baseline
const response = await fetch('http://localhost:5000/api/baseline/calculate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productId: '64f1a2b3c4d5e6f7a8b9c0d2',
    customerId: '64f1a2b3c4d5e6f7a8b9c0d1',
    promotionStartDate: '2025-10-01',
    promotionEndDate: '2025-10-14',
    method: 'pre_period'
  })
});

const data = await response.json();
console.log('Baseline:', data);
```

---

## 📚 Additional Resources

- **Full API Documentation:** [Link to Swagger/OpenAPI] (coming soon)
- **Integration Guides:** [Link to guides]
- **SDK Libraries:** [Link to SDKs]
- **Code Examples:** [Link to examples repo]

---

## 🚀 What You Can Build With These APIs

### 1. **Transaction Management System**
- Import POS data
- Create accruals
- Track deductions
- Settle payments

### 2. **Promotion Analytics Platform**
- Calculate baselines
- Measure incremental volume
- Detect cannibalization
- Detect forward buying
- Calculate true net impact

### 3. **Predictive Planning Tool**
- Predict cannibalization risk
- Predict forward buy risk
- Optimize promotion strategy

### 4. **Store Performance Dashboard**
- Regional performance
- District performance
- Store comparisons
- Hierarchy rollups

### 5. **Executive Reporting**
- Net promotion impact
- ROI calculations
- Performance benchmarks
- Trend analysis

---

## ✅ API Checklist

What's working RIGHT NOW:

- [x] Transaction CRUD
- [x] Transaction workflow (approve/reject/settle)
- [x] POS data upload
- [x] Data validation
- [x] Baseline calculation (5 methods)
- [x] Incremental volume
- [x] Cannibalization detection
- [x] Substitution matrix
- [x] Net incremental calculation
- [x] Forward buy detection
- [x] Forward buy risk prediction
- [x] Category-level analysis
- [ ] Store hierarchy routes (backend ready)
- [ ] Advanced ML predictions
- [ ] Halo effect detection
- [ ] Price elasticity

**29 of 34 planned endpoints live = 85% complete**

---

**Last Updated:** 2025-10-25  
**API Version:** v2.1.3  
**Backend Status:** Production-ready ✅
