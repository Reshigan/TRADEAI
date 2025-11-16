# AI/ML Services Consolidation Guide

**Date:** November 13, 2025  
**Migration:** Consolidation to Single Canonical ML Service

---

## Overview

This document explains the consolidation of multiple AI/ML service directories into a single canonical version for the TRADEAI platform.

## Directory Status

### ✅ Canonical ML Service: `ml-services/`
- **Technology:** Python 3.10+, FastAPI, scikit-learn, PyTorch, TensorFlow
- **Status:** Active and maintained
- **API Version:** v1.0.0 with versioned endpoints (`/api/v1/`)
- **Port:** 8001 (production)
- **Features:**
  - ✅ Demand forecasting with confidence intervals
  - ✅ Price optimization with elasticity modeling
  - ✅ Promotion lift analysis with causal impact
  - ✅ Product recommendations (collaborative filtering)
  - ✅ Customer segmentation (RFM, ABC, clustering)
  - ✅ Anomaly detection (statistical + ML)
  - ✅ Comprehensive test suite (83 unit tests)
  - ✅ Model versioning and metadata
  - ✅ Health check endpoints
  - ✅ OpenAPI/Swagger documentation

**Directory Structure:**
```
ml-services/
├── serving/
│   └── api.py              # FastAPI application with versioned endpoints
├── models/
│   ├── demand_forecasting/ # Forecaster implementation
│   ├── price_optimization/ # Price optimizer
│   ├── promotion_lift/     # Promotion analyzer
│   └── recommendation/     # Recommendation engine
├── training/
│   ├── train_all_models.py # Batch training script
│   └── train_simple.py     # Simple training
├── tests/
│   └── unit/               # 83 unit tests
├── data/                   # Training data
├── trained_models/         # Model artifacts
├── config.yaml             # Configuration
└── requirements.txt        # Python dependencies (50+ packages)
```

**Endpoints:**
- `POST /api/v1/forecast/demand` - Demand forecasting
- `POST /api/v1/optimize/price` - Price optimization
- `POST /api/v1/analyze/promotion-lift` - Promotion lift analysis
- `POST /api/v1/recommend/products` - Product recommendations
- `POST /api/v1/segment/customers` - Customer segmentation
- `POST /api/v1/detect/anomalies` - Anomaly detection
- `GET /health` - Health check
- `GET /api/v1/models/{model_type}` - Model metadata

### ⚠️ Archived: `ai-service/` → `_archived/ai-service/`
- **Technology:** Node.js, Express
- **Reason for Archival:** Superseded by Python-based `ml-services/`
- **Key Features:**
  - Basic AI service wrapper
  - Express server on port 8001
  - Limited ML capabilities
- **Notable Files:**
  - `server.js` - Express server implementation
  - `README.md` - Service documentation
  - `package.json` - Node dependencies
- **Archived On:** November 13, 2025
- **Archived By:** Devin (automated refactoring)

### ⚠️ Archived: `ai-services/` → `_archived/ai-services/`
- **Technology:** Python, FastAPI (early version)
- **Reason for Archival:** Superseded by more complete `ml-services/`
- **Key Features:**
  - Early Python ML service implementation
  - Basic prediction API
  - Training scripts
- **Notable Files:**
  - `src/prediction_api.py` - Prediction API
  - `src/train_models.py` - Model training
  - `config.py` - Configuration
  - `requirements.txt` - Python dependencies
- **Archived On:** November 13, 2025
- **Archived By:** Devin (automated refactoring)

---

## Migration Instructions

### For Backend Developers

**If you were integrating with `ai-service/` or `ai-services/`:**

1. **Update API endpoints to use `ml-services/` versioned endpoints:**

   **Old (ai-service):**
   ```javascript
   const response = await axios.post('http://localhost:8001/predict', data);
   ```

   **New (ml-services):**
   ```javascript
   const response = await axios.post('http://localhost:8001/api/v1/forecast/demand', {
     product_id: 'prod-123',
     customer_id: 'cust-456',
     horizon_days: 90,
     include_promotions: true,
     confidence_level: 0.95
   });
   ```

2. **Update response handling to use new envelope format:**

   **New Response Format:**
   ```json
   {
     "product_id": "prod-123",
     "customer_id": "cust-456",
     "forecast": [...],
     "accuracy_estimate": 0.11,
     "model_version": "v1.2.3",
     "features_count": 120,
     "timestamp": "2025-11-13T17:00:00Z"
   }
   ```

3. **Use versioned endpoints for all ML calls:**
   - `/api/v1/forecast/demand` - Demand forecasting
   - `/api/v1/optimize/price` - Price optimization
   - `/api/v1/analyze/promotion-lift` - Promotion lift
   - `/api/v1/recommend/products` - Recommendations
   - `/api/v1/segment/customers` - Customer segmentation
   - `/api/v1/detect/anomalies` - Anomaly detection

### For Frontend Developers

**Update ML integration service (`frontend/src/services/mlIntegration.js`):**

```javascript
// Old
const ML_SERVICE_URL = 'http://localhost:8001';

// New - use versioned endpoints
const ML_SERVICE_URL = 'http://localhost:8001/api/v1';

// Example: Demand forecasting
export const forecastDemand = async (productId, customerId, horizonDays = 90) => {
  const response = await axios.post(`${ML_SERVICE_URL}/forecast/demand`, {
    product_id: productId,
    customer_id: customerId,
    horizon_days: horizonDays,
    include_promotions: true,
    confidence_level: 0.95
  });
  return response.data;
};
```

### For DevOps/Deployment

**Update docker-compose files to use `ml-services/`:**

```yaml
ml-service:
  build:
    context: ./ml-services
    dockerfile: Dockerfile
  ports:
    - "8001:8001"
  environment:
    - ENVIRONMENT=production
    - LOG_LEVEL=INFO
  volumes:
    - ./ml-services/trained_models:/app/trained_models
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

**Update Nginx routing:**

```nginx
# ML Service - versioned API
location /ml/v1/ {
    proxy_pass http://ml-service:8001/api/v1/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 300s;
}

# ML Service - health check
location /ml/health {
    proxy_pass http://ml-service:8001/health;
}
```

---

## Technical Comparison

### Technology Stack Differences

| Feature | `ml-services/` (Canonical) | `ai-service/` | `ai-services/` |
|---------|---------------------------|---------------|----------------|
| **Language** | Python 3.10+ | Node.js | Python |
| **Framework** | FastAPI | Express | FastAPI (early) |
| **ML Libraries** | scikit-learn, PyTorch, TensorFlow, XGBoost, LightGBM | None | Basic scikit-learn |
| **API Versioning** | ✅ `/api/v1/` | ❌ No versioning | ❌ No versioning |
| **Model Metadata** | ✅ Version, confidence, features | ❌ Not supported | ⚠️ Partial |
| **Test Coverage** | ✅ 83 unit tests | ❌ No tests | ⚠️ Minimal |
| **OpenAPI Docs** | ✅ Auto-generated | ❌ No docs | ❌ No docs |
| **Health Checks** | ✅ Comprehensive | ⚠️ Basic | ⚠️ Basic |
| **Status** | ✅ Active | ⚠️ Archived | ⚠️ Archived |

### Feature Completeness

| Feature | `ml-services/` | `ai-service/` | `ai-services/` |
|---------|---------------|---------------|----------------|
| **Demand Forecasting** | ✅ Complete | ❌ Missing | ⚠️ Basic |
| **Price Optimization** | ✅ Complete | ❌ Missing | ⚠️ Basic |
| **Promotion Lift** | ✅ Complete | ❌ Missing | ❌ Missing |
| **Recommendations** | ✅ Complete | ❌ Missing | ⚠️ Basic |
| **Customer Segmentation** | ✅ Complete | ❌ Missing | ❌ Missing |
| **Anomaly Detection** | ✅ Complete | ❌ Missing | ❌ Missing |
| **Model Versioning** | ✅ Complete | ❌ Missing | ❌ Missing |
| **Confidence Scores** | ✅ Complete | ❌ Missing | ⚠️ Partial |
| **Feature Attribution** | ✅ Complete | ❌ Missing | ❌ Missing |

---

## API Migration Examples

### 1. Demand Forecasting

**Old (ai-services):**
```python
POST /predict
{
  "model": "demand",
  "data": {...}
}
```

**New (ml-services):**
```python
POST /api/v1/forecast/demand
{
  "product_id": "prod-123",
  "customer_id": "cust-456",
  "horizon_days": 90,
  "include_promotions": true,
  "confidence_level": 0.95
}

Response:
{
  "product_id": "prod-123",
  "customer_id": "cust-456",
  "forecast": [
    {
      "date": "2025-11-14",
      "predicted_volume": 1050,
      "confidence_lower": 892,
      "confidence_upper": 1207
    },
    ...
  ],
  "accuracy_estimate": 0.11,
  "model_version": "v1.2.3",
  "features_count": 120,
  "timestamp": "2025-11-13T17:00:00Z"
}
```

### 2. Price Optimization

**New (ml-services):**
```python
POST /api/v1/optimize/price
{
  "product_id": "prod-123",
  "current_price": 10.50,
  "cost": 6.30,
  "constraints": {
    "min_price": 8.00,
    "max_price": 15.00
  },
  "optimization_objective": "profit"
}

Response:
{
  "product_id": "prod-123",
  "current_price": 10.50,
  "optimal_price": 10.80,
  "price_change_pct": 2.86,
  "expected_impact": {
    "volume_change_pct": -1.43,
    "revenue_change_pct": 1.43,
    "profit_change_pct": 4.29
  },
  "confidence": 0.85,
  "model_version": "v2.1.0",
  "timestamp": "2025-11-13T17:00:00Z"
}
```

### 3. Promotion Lift Analysis

**New (ml-services):**
```python
POST /api/v1/analyze/promotion-lift
{
  "promotion_id": "promo-789",
  "pre_period": {
    "start_date": "2025-09-01",
    "end_date": "2025-10-12"
  },
  "post_period": {
    "start_date": "2025-10-13",
    "end_date": "2025-10-27"
  }
}

Response:
{
  "promotion_id": "promo-789",
  "incremental_lift": {
    "volume": 200,
    "percentage": 20.0,
    "confidence_interval": [15.2, 24.8]
  },
  "statistics": {
    "p_value": 0.001,
    "is_significant": true,
    "confidence_level": 0.95
  },
  "roi": {
    "promotion_cost": 5000,
    "incremental_revenue": 50000,
    "incremental_profit": 20000,
    "roi_percentage": 300.0,
    "payback_ratio": 4.0
  },
  "recommendation": "✅ EXCELLENT: Promotion highly successful with 20% lift and 300% ROI. Repeat this promotion!",
  "model_version": "v1.0.5",
  "timestamp": "2025-11-13T17:00:00Z"
}
```

---

## Deployment Updates Required

### 1. Docker Compose Production

**File:** `docker-compose.production.yml`

**Add ML service:**
```yaml
ml-service:
  build:
    context: ./ml-services
    dockerfile: Dockerfile
  container_name: tradeai-ml-service
  ports:
    - "8001:8001"
  environment:
    - ENVIRONMENT=production
    - LOG_LEVEL=INFO
    - MONGODB_URI=${MONGODB_URI}
    - REDIS_URL=${REDIS_URL}
  volumes:
    - ./ml-services/trained_models:/app/trained_models
    - ./ml-services/data:/app/data
  networks:
    - tradeai-network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
    interval: 30s
    timeout: 10s
    retries: 3
  restart: unless-stopped
```

### 2. Nginx Configuration

**File:** `docker/nginx.conf` or `nginx/nginx-aws-production.conf`

**Add ML service routing:**
```nginx
# ML Service API (versioned)
location /ml/v1/ {
    proxy_pass http://ml-service:8001/api/v1/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Company-Code $company_code;
    proxy_read_timeout 300s;
    proxy_connect_timeout 60s;
}

# ML Service Health Check
location /ml/health {
    proxy_pass http://ml-service:8001/health;
    proxy_set_header Host $host;
}

# ML Service Docs (optional, for internal use)
location /ml/docs {
    proxy_pass http://ml-service:8001/docs;
    proxy_set_header Host $host;
}
```

### 3. Environment Variables

**Add to `.env` files:**
```bash
# ML Service Configuration
ML_SERVICE_URL=http://ml-service:8001
ML_SERVICE_TIMEOUT=300000
ML_SERVICE_RETRY_ATTEMPTS=3
ML_SERVICE_FALLBACK_ENABLED=true
```

---

## Retrieving Archived Code

If you need to reference code from archived directories:

```bash
# View archived ai-service
ls _archived/ai-service/

# View archived ai-services
ls _archived/ai-services/

# Compare with canonical version
diff _archived/ai-services/src/prediction_api.py ml-services/serving/api.py
```

---

## Rollback Procedure

If you need to temporarily rollback to an archived version:

```bash
# 1. Copy archived version to temporary location
cp -r _archived/ai-services ai-services-temp

# 2. Update docker-compose to use temporary location
# Edit docker-compose.production.yml

# 3. Deploy temporary version
docker-compose -f docker-compose.production.yml up -d ml-service

# 4. Report issues to development team
# 5. Plan proper migration to canonical ml-services
```

**Note:** Rollback should only be used as emergency measure. Plan migration to canonical `ml-services/` as soon as possible.

---

## Testing the Migration

### 1. Health Check
```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T17:00:00Z",
  "models": {
    "demand_forecasting": true,
    "price_optimization": true,
    "promotion_lift": true,
    "recommendations": true
  },
  "version": "1.0.0"
}
```

### 2. Test Demand Forecast
```bash
curl -X POST http://localhost:8001/api/v1/forecast/demand \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "prod-123",
    "customer_id": "cust-456",
    "horizon_days": 30
  }'
```

### 3. Run Unit Tests
```bash
cd ml-services
pytest tests/unit/ -v
```

Expected: 83 tests passing

---

## Questions?

**For questions about this migration:**
- Review this document thoroughly
- Check `ml-services/README.md` for ML service documentation
- Review `ml-services/serving/api.py` for endpoint details
- Test endpoints using `/docs` (Swagger UI)
- Contact ML/AI team lead

---

## Changelog

| Date | Action | Details |
|------|--------|---------|
| 2025-11-13 | Initial Migration | Archived `ai-service/` and `ai-services/` to `_archived/` directory |
| 2025-11-13 | Documentation | Created this migration guide |
| 2025-11-13 | Standardization | Established `ml-services/` as canonical with versioned API |

---

**Document Owner:** ML/AI Team  
**Last Updated:** November 13, 2025  
**Status:** Active
