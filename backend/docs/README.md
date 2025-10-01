# Trade AI Platform API Documentation

## Overview

The Trade AI Platform API is a comprehensive RESTful API that powers a multi-tenant FMCG (Fast-Moving Consumer Goods) trade promotion management system. This API provides advanced analytics, real-time monitoring, and intelligent automation capabilities for trade promotion optimization.

## 🚀 Quick Start

### Base URL
```
Production: https://api.tradeai.com/v2
Staging: https://staging-api.tradeai.com/v2
Development: http://localhost:3000/api
```

### Authentication
All API endpoints require JWT authentication unless otherwise specified. Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting Started
1. Register a new account or login to get your JWT token
2. Include the token in all subsequent requests
3. Explore the interactive API documentation at `/api-docs`

## 📚 Documentation

### Interactive Documentation
- **Swagger UI**: `/api-docs` - Interactive API explorer
- **OpenAPI JSON**: `/api-docs/json` - Machine-readable API specification
- **OpenAPI YAML**: `/api-docs/yaml` - Human-readable API specification

### API Versions
- **v2.0** (Current): Latest version with all advanced features
- **v1.0** (Deprecated): Legacy version, will be sunset in Q2 2024

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "id": "user_id",
  "email": "user@company.com",
  "companyId": "company_id",
  "role": "admin|manager|user",
  "iat": 1640995200,
  "exp": 1641081600
}
```

### Role-Based Access Control
- **Admin**: Full access to all company resources
- **Manager**: Read/write access to promotions and budgets
- **User**: Read-only access to assigned resources

## 📊 Core Features

### 1. Dashboard & Analytics
- Real-time KPI monitoring
- Advanced analytics with AI predictions
- Custom metric calculations
- Trend analysis and forecasting

### 2. Promotion Management
- Create and manage trade promotions
- Track promotion performance
- ROI calculation and optimization
- Multi-channel promotion support

### 3. Budget Management
- Budget allocation and tracking
- Spend monitoring and alerts
- Variance analysis
- Approval workflows

### 4. Advanced Reporting
- Multi-format report generation (Excel, PDF, JSON)
- Custom report builder
- Scheduled report delivery
- Template-based reporting

### 5. Real-time Monitoring
- Live dashboard updates
- WebSocket-based event streaming
- Intelligent alerting system
- System health monitoring

### 6. AI-Powered Analytics
- Machine learning predictions
- Ensemble model support
- Confidence intervals
- Feature importance analysis

## 🛠️ API Endpoints

### Authentication
```http
POST /auth/login          # User login
POST /auth/register       # User registration
POST /auth/refresh        # Refresh JWT token
POST /auth/logout         # User logout
```

### Dashboard
```http
GET  /dashboard           # Get dashboard metrics
GET  /dashboard/kpis      # Get key performance indicators
GET  /dashboard/trends    # Get trend analysis
```

### Promotions
```http
GET    /promotions        # List promotions
POST   /promotions        # Create promotion
GET    /promotions/{id}   # Get promotion details
PUT    /promotions/{id}   # Update promotion
DELETE /promotions/{id}   # Delete promotion
```

### Analytics
```http
GET  /analytics/dashboard     # Analytics dashboard
GET  /analytics/advanced      # Advanced analytics
POST /analytics/predictions   # Generate AI predictions
GET  /analytics/performance   # Performance metrics
```

### Reports
```http
POST /reports/excel       # Generate Excel report
POST /reports/pdf         # Generate PDF report
POST /reports/custom      # Build custom report
GET  /reports/templates   # Get report templates
GET  /reports/history     # Get report history
```

### Monitoring
```http
GET  /monitoring/dashboard    # Real-time monitoring
GET  /monitoring/alerts       # Get alerts
POST /monitoring/alerts       # Setup alerts
GET  /monitoring/events       # Event stream (SSE)
GET  /monitoring/health       # System health
```

## 📝 Request/Response Examples

### Login Request
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "securePassword123"
}
```

### Login Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "manager",
    "companyId": "507f1f77bcf86cd799439012"
  },
  "expiresIn": "24h"
}
```

### Create Promotion Request
```http
POST /promotions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Summer Sale 2024",
  "description": "Comprehensive summer promotion campaign",
  "type": "discount",
  "period": {
    "startDate": "2024-06-01",
    "endDate": "2024-08-31"
  },
  "budget": 50000.00,
  "products": ["product_id_1", "product_id_2"],
  "customer": "customer_id"
}
```

### Generate AI Predictions Request
```http
POST /analytics/predictions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "sales",
  "targetId": "promotion_id",
  "horizon": 30,
  "features": {
    "seasonality": true,
    "promotionType": "discount",
    "historicalData": true
  }
}
```

## 🔄 Real-time Features

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:3000/ws?token=<jwt-token>');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

### Server-Sent Events
```javascript
const eventSource = new EventSource('/monitoring/events');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Monitoring event:', data);
};
```

## 📊 Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

### Example Response
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🚦 Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Anonymous users**: 100 requests per hour
- **Burst limit**: 50 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## ❌ Error Handling

### Standard Error Response
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

## 🔧 Development Tools

### Postman Collection
Import our Postman collection for easy API testing:
```
GET /api-docs/postman
```

### SDK Libraries
- **JavaScript/Node.js**: `npm install @tradeai/api-client`
- **Python**: `pip install tradeai-client`
- **PHP**: `composer require tradeai/api-client`

### Code Examples
```javascript
// Node.js Example
const TradeAI = require('@tradeai/api-client');

const client = new TradeAI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.tradeai.com/v2'
});

const promotions = await client.promotions.list();
```

## 🧪 Testing

### Test Environment
- **Base URL**: `https://staging-api.tradeai.com/v2`
- **Test Data**: Pre-populated with sample data
- **Rate Limits**: Relaxed for testing

### Test Credentials
```json
{
  "email": "test@tradeai.com",
  "password": "TestPassword123"
}
```

## 📈 Performance

### Response Times
- **Average**: < 200ms
- **95th percentile**: < 500ms
- **99th percentile**: < 1000ms

### Availability
- **SLA**: 99.9% uptime
- **Monitoring**: 24/7 system monitoring
- **Alerts**: Real-time incident notifications

## 🔒 Security

### Data Protection
- **Encryption**: TLS 1.3 for data in transit
- **Storage**: AES-256 encryption at rest
- **Compliance**: GDPR, SOC 2 Type II

### Security Headers
```http
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

## 📞 Support

### Documentation
- **API Docs**: `/api-docs`
- **Guides**: `/docs/guides`
- **Tutorials**: `/docs/tutorials`

### Contact
- **Email**: support@tradeai.com
- **Slack**: #api-support
- **Status Page**: https://status.tradeai.com

### SLA & Support Tiers
- **Enterprise**: 24/7 support, 1-hour response
- **Professional**: Business hours, 4-hour response
- **Standard**: Best effort, 24-hour response

## 🔄 Changelog

### v2.0.0 (Current)
- ✅ Advanced AI analytics with ensemble models
- ✅ Real-time monitoring and alerting
- ✅ Enhanced reporting with multiple formats
- ✅ WebSocket support for live updates
- ✅ Comprehensive API documentation

### v1.0.0 (Deprecated)
- Basic promotion management
- Simple reporting
- Limited analytics

## 🗺️ Roadmap

### Q1 2024
- [ ] GraphQL API support
- [ ] Advanced ML model marketplace
- [ ] Enhanced mobile SDK

### Q2 2024
- [ ] Multi-region deployment
- [ ] Advanced workflow automation
- [ ] Third-party integrations marketplace

---

*Last updated: January 2024*
*API Version: 2.0.0*