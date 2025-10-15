# TradeAI Platform - Complete System Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Modules](#core-modules)
4. [Enterprise Features](#enterprise-features)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [Security](#security)
8. [Deployment](#deployment)
9. [Monitoring](#monitoring)
10. [Development Guide](#development-guide)

## System Overview

TradeAI is an enterprise-grade trade intelligence platform that provides comprehensive analytics, forecasting, and optimization tools for retail and FMCG companies. The platform combines advanced machine learning algorithms with intuitive user interfaces to deliver actionable insights for trade spend optimization, promotion effectiveness, and sales forecasting.

### Key Capabilities

- **Trade Spend Management**: Budget allocation, spend tracking, and ROI optimization
- **Promotion Analytics**: Campaign performance analysis and uplift measurement
- **Sales Forecasting**: AI-powered demand prediction and scenario planning
- **Customer Intelligence**: Customer segmentation and performance analytics
- **Product Analytics**: Sales performance, inventory optimization, and profitability analysis
- **Simulation Studio**: What-if analysis and scenario modeling
- **Real-time Dashboards**: Executive dashboards with KPI monitoring

### Technology Stack

**Frontend:**
- React 18.3.1 with TypeScript
- Material-UI (MUI) v5 for components
- Recharts for data visualization
- React Router for navigation
- Axios for API communication

**Backend:**
- Node.js with Express.js framework
- MongoDB with Mongoose ODM
- Redis for caching and session management
- JWT for authentication
- PM2 for process management

**Infrastructure:**
- Ubuntu 20.04 LTS
- Nginx as reverse proxy
- Docker for containerization
- GitHub for version control

## Architecture

### System Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Backend       │
│   React App     │◄──►│   Nginx         │◄──►│   Node.js       │
│   Port: 3000    │    │   Port: 80/443  │    │   Port: 5000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐             │
                       │   Redis Cache   │◄────────────┤
                       │   Port: 6379    │             │
                       └─────────────────┘             │
                                                        │
                       ┌─────────────────┐             │
                       │   MongoDB       │◄────────────┘
                       │   Port: 27017   │
                       └─────────────────┘
```

### Component Architecture

```
src/
├── components/
│   ├── analytics/          # Analytics dashboards
│   ├── budgets/           # Budget management
│   ├── customers/         # Customer management
│   ├── enterprise/        # Enterprise features
│   ├── forecasting/       # Sales forecasting
│   ├── products/          # Product management
│   ├── promotions/        # Promotion management
│   ├── reports/           # Reporting modules
│   ├── tradeSpends/       # Trade spend management
│   ├── tradingTerms/      # Trading terms
│   └── common/            # Shared components
├── services/              # API services
├── utils/                 # Utility functions
├── hooks/                 # Custom React hooks
└── contexts/              # React contexts
```

## Core Modules

### 1. Dashboard Module

**Purpose**: Executive overview with key performance indicators

**Features:**
- Real-time KPI monitoring
- Interactive charts and graphs
- Quick access to all modules
- Customizable widgets
- Alert notifications

**Components:**
- `Dashboard.js` - Main dashboard component
- `KPICard.js` - Individual KPI widgets
- `ChartWidget.js` - Chart components

### 2. Budget Management Module

**Purpose**: Marketing budget allocation and tracking

**Features:**
- Hierarchical budget structure
- Budget allocation methods (Equal, Weighted, Performance-based)
- Timeframe management (Monthly, Quarterly, Yearly)
- Budget vs actual reporting
- Approval workflows

**Components:**
- `BudgetPage.js` - Main budget interface
- `BudgetList.js` - Budget listing
- `HierarchicalBudgetManager.js` - Tree-view budget management
- `BudgetReports.js` - Budget reporting

**API Endpoints:**
```
GET    /api/budgets
POST   /api/budgets
PUT    /api/budgets/:id
DELETE /api/budgets/:id
GET    /api/budgets/hierarchy
POST   /api/budgets/allocate
```

### 3. Trade Spend Management Module

**Purpose**: Trade spend optimization and ROI analysis

**Features:**
- Spend tracking and monitoring
- ROI calculation and analysis
- Channel performance analysis
- Budget variance reporting
- Optimization recommendations

**Components:**
- `TradeSpendList.js` - Spend listing
- `TradeSpendDetail.js` - Detailed spend view
- `TradeSpendForm.js` - Spend creation/editing
- `TradeSpendReports.js` - Comprehensive reporting

### 4. Promotion Management Module

**Purpose**: Promotion campaign management and effectiveness analysis

**Features:**
- Campaign creation and management
- Uplift measurement and analysis
- ROI tracking and optimization
- Channel performance analysis
- A/B testing capabilities

**Components:**
- `PromotionList.js` - Campaign listing
- `PromotionDetail.js` - Campaign details
- `PromotionForm.js` - Campaign creation
- `PromotionReports.js` - Performance analytics

### 5. Customer Management Module

**Purpose**: Customer relationship and performance management

**Features:**
- Customer profiling and segmentation
- Performance tracking
- Relationship management
- Communication history
- Revenue analysis

**Components:**
- `CustomerList.js` - Customer listing
- `CustomerDetail.js` - Customer profile
- `CustomerForm.js` - Customer management
- `CustomerReports.js` - Customer analytics

### 6. Product Management Module

**Purpose**: Product catalog and performance management

**Features:**
- Product catalog management
- Sales performance tracking
- Inventory analytics
- Profitability analysis
- Product lifecycle management

**Components:**
- `ProductList.js` - Product catalog
- `ProductDetail.js` - Product details
- `ProductForm.js` - Product management
- `ProductReports.js` - Product analytics

### 7. Forecasting Module

**Purpose**: AI-powered sales and demand forecasting

**Features:**
- Sales forecasting with multiple algorithms
- Demand prediction
- Scenario analysis
- Confidence intervals
- Seasonality detection

**Components:**
- `ForecastingDashboard.js` - Main forecasting interface
- `ForecastChart.js` - Forecast visualization
- `ScenarioAnalysis.js` - What-if scenarios

**ML Algorithms:**
- ARIMA (AutoRegressive Integrated Moving Average)
- Exponential Smoothing
- Linear Regression
- Ensemble Methods

### 8. Analytics Module

**Purpose**: Advanced analytics and business intelligence

**Features:**
- Custom dashboard creation
- Advanced visualizations
- Data exploration tools
- Statistical analysis
- Trend analysis

**Components:**
- `AnalyticsDashboard.js` - Main analytics interface
- `ChartBuilder.js` - Custom chart creation
- `DataExplorer.js` - Data exploration tools

## Enterprise Features

### 1. Simulation Studio

**Purpose**: Advanced scenario modeling and what-if analysis

**Features:**
- Budget optimization simulations
- Promotion effectiveness modeling
- Market scenario analysis
- Risk assessment
- Sensitivity analysis

**Components:**
- `SimulationStudio.js` - Main simulation interface
- `BudgetOptimizer.js` - Budget optimization
- `PromotionSimulator.js` - Promotion modeling
- `WhatIfAnalyzer.js` - Scenario analysis

### 2. Executive Dashboard

**Purpose**: C-level executive reporting and insights

**Features:**
- High-level KPI monitoring
- Strategic insights
- Performance summaries
- Trend analysis
- Alert management

**Components:**
- `ExecutiveDashboardEnhanced.js` - Executive overview
- `StrategicInsights.js` - Strategic analysis
- `PerformanceSummary.js` - Performance overview

### 3. Transaction Management

**Purpose**: Enterprise-grade transaction processing

**Features:**
- Transaction tracking
- Audit trails
- Compliance reporting
- Data integrity
- Performance monitoring

**Components:**
- `TransactionManagement.js` - Transaction interface
- `AuditTrail.js` - Audit logging
- `ComplianceReports.js` - Compliance tracking

## API Documentation

### Authentication

All API endpoints require JWT authentication:

```javascript
Headers: {
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

### Core API Endpoints

#### Authentication
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/logout
```

#### Budgets
```
GET    /api/budgets              # Get all budgets
POST   /api/budgets              # Create budget
GET    /api/budgets/:id          # Get budget by ID
PUT    /api/budgets/:id          # Update budget
DELETE /api/budgets/:id          # Delete budget
GET    /api/budgets/hierarchy    # Get budget hierarchy
POST   /api/budgets/allocate     # Allocate budget
```

#### Trade Spends
```
GET    /api/trade-spends         # Get all trade spends
POST   /api/trade-spends         # Create trade spend
GET    /api/trade-spends/:id     # Get trade spend by ID
PUT    /api/trade-spends/:id     # Update trade spend
DELETE /api/trade-spends/:id     # Delete trade spend
```

#### Promotions
```
GET    /api/promotions           # Get all promotions
POST   /api/promotions           # Create promotion
GET    /api/promotions/:id       # Get promotion by ID
PUT    /api/promotions/:id       # Update promotion
DELETE /api/promotions/:id       # Delete promotion
POST   /api/promotions/analyze   # Analyze promotion
```

#### Customers
```
GET    /api/customers            # Get all customers
POST   /api/customers            # Create customer
GET    /api/customers/:id        # Get customer by ID
PUT    /api/customers/:id        # Update customer
DELETE /api/customers/:id        # Delete customer
```

#### Products
```
GET    /api/products             # Get all products
POST   /api/products             # Create product
GET    /api/products/:id         # Get product by ID
PUT    /api/products/:id         # Update product
DELETE /api/products/:id         # Delete product
```

#### Forecasting
```
GET    /api/forecasting/sales    # Get sales forecast
GET    /api/forecasting/demand   # Get demand forecast
GET    /api/forecasting/budget   # Get budget forecast
POST   /api/forecasting/generate # Generate forecast
```

#### Analytics
```
GET    /api/analytics/dashboard  # Get dashboard data
GET    /api/analytics/kpis       # Get KPI data
POST   /api/analytics/custom     # Custom analytics query
```

#### Reports
```
GET    /api/reports/products     # Product reports
GET    /api/reports/promotions   # Promotion reports
GET    /api/reports/tradespend   # Trade spend reports
GET    /api/reports/customers    # Customer reports
POST   /api/reports/export       # Export reports
```

### Response Format

All API responses follow this format:

```javascript
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message",
  "timestamp": "2025-10-15T02:30:00Z"
}
```

Error responses:

```javascript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  },
  "timestamp": "2025-10-15T02:30:00Z"
}
```

## Database Schema

### MongoDB Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String, // Hashed
  firstName: String,
  lastName: String,
  role: String, // admin, manager, user
  tenantId: ObjectId,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Tenants Collection
```javascript
{
  _id: ObjectId,
  name: String,
  domain: String,
  settings: {
    currency: String,
    timezone: String,
    features: [String]
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Budgets Collection
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: String,
  description: String,
  totalAmount: Number,
  allocatedAmount: Number,
  spentAmount: Number,
  currency: String,
  period: {
    startDate: Date,
    endDate: Date,
    type: String // monthly, quarterly, yearly
  },
  hierarchy: {
    parentId: ObjectId,
    level: Number,
    path: String
  },
  status: String, // active, completed, cancelled
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### TradeSpends Collection
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  customerId: ObjectId,
  budgetId: ObjectId,
  name: String,
  description: String,
  amount: Number,
  currency: String,
  category: String,
  channel: String,
  startDate: Date,
  endDate: Date,
  status: String,
  roi: Number,
  salesImpact: Number,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### Promotions Collection
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: String,
  description: String,
  type: String, // discount, bogo, cashback
  products: [ObjectId],
  customers: [ObjectId],
  budget: Number,
  spend: Number,
  startDate: Date,
  endDate: Date,
  metrics: {
    impressions: Number,
    clicks: Number,
    conversions: Number,
    revenue: Number,
    roi: Number,
    uplift: Number
  },
  status: String,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### Customers Collection
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: String,
  code: String,
  sapCustomerId: String,
  email: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  channel: String,
  segment: String,
  status: String,
  metrics: {
    totalRevenue: Number,
    totalOrders: Number,
    averageOrderValue: Number,
    lastOrderDate: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Products Collection
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: String,
  sku: String,
  description: String,
  category: String,
  brand: String,
  price: Number,
  cost: Number,
  currency: String,
  inventory: {
    quantity: Number,
    reorderLevel: Number,
    maxStock: Number
  },
  metrics: {
    totalSales: Number,
    totalRevenue: Number,
    averageMargin: Number,
    turnoverRate: Number
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### TradingTerms Collection
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  customerId: ObjectId,
  productId: ObjectId,
  termType: String,
  value: Number,
  unit: String,
  startDate: Date,
  endDate: Date,
  conditions: [String],
  status: String,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
// Performance indexes
db.users.createIndex({ "email": 1, "tenantId": 1 })
db.budgets.createIndex({ "tenantId": 1, "status": 1 })
db.tradeSpends.createIndex({ "tenantId": 1, "customerId": 1 })
db.promotions.createIndex({ "tenantId": 1, "status": 1, "startDate": 1 })
db.customers.createIndex({ "tenantId": 1, "status": 1 })
db.products.createIndex({ "tenantId": 1, "isActive": 1 })
db.tradingTerms.createIndex({ "tenantId": 1, "customerId": 1, "productId": 1 })

// Text search indexes
db.customers.createIndex({ "name": "text", "code": "text" })
db.products.createIndex({ "name": "text", "sku": "text" })
db.promotions.createIndex({ "name": "text", "description": "text" })
```

## Security

### Authentication & Authorization

**JWT Authentication:**
- Token-based authentication
- Refresh token mechanism
- Token expiration handling
- Secure token storage

**Role-Based Access Control (RBAC):**
```javascript
const roles = {
  admin: ['*'], // All permissions
  manager: ['read:*', 'write:budgets', 'write:promotions'],
  user: ['read:own', 'write:own']
};
```

### Tenant Isolation

**Automatic Tenant Filtering:**
```javascript
// Middleware automatically adds tenant filter
const tenantIsolation = (req, res, next) => {
  req.query.tenantId = req.user.tenantId;
  next();
};
```

**Database Query Filtering:**
```javascript
// All queries automatically filtered by tenant
Customer.find({ tenantId: req.user.tenantId });
```

### Data Security

**Encryption:**
- Passwords hashed with bcrypt
- Sensitive data encrypted at rest
- TLS/SSL for data in transit
- API key encryption

**Input Validation:**
- Request validation middleware
- SQL injection prevention
- XSS protection
- CSRF protection

**Security Headers:**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

## Deployment

### Production Environment

**Server Specifications:**
- Ubuntu 20.04 LTS
- 4 CPU cores
- 8GB RAM
- 100GB SSD storage
- IP: 3.10.212.143

**Services:**
- Nginx (Port 80/443)
- Node.js Backend (Port 5000)
- MongoDB (Port 27017)
- Redis (Port 6379)

### Deployment Process

**1. Frontend Deployment:**
```bash
# Build React application
npm run build

# Deploy to nginx
sudo cp -r build/* /var/www/tradeai/frontend/build/
sudo systemctl reload nginx
```

**2. Backend Deployment:**
```bash
# Install dependencies
npm install --production

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

**3. Database Setup:**
```bash
# MongoDB setup
sudo systemctl start mongod
mongo < init-mongo.js

# Redis setup
sudo systemctl start redis
```

### Environment Configuration

**Production Environment Variables:**
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tradeai
REDIS_URL=redis://localhost:6379
JWT_SECRET=<secure_secret>
JWT_REFRESH_SECRET=<secure_refresh_secret>
ENCRYPTION_KEY=<encryption_key>
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name tradeai.gonxt.tech;
    
    location / {
        root /var/www/tradeai/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### PM2 Configuration

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'tradeai-backend',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log'
  }]
};
```

## Monitoring

### Application Monitoring

**PM2 Monitoring:**
```bash
pm2 monit              # Real-time monitoring
pm2 logs               # View logs
pm2 status             # Process status
```

**Health Checks:**
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

### Performance Monitoring

**Key Metrics:**
- Response time
- Throughput (requests/second)
- Error rate
- Memory usage
- CPU utilization
- Database performance

**Logging:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Database Monitoring

**MongoDB Metrics:**
- Query performance
- Index usage
- Connection pool
- Disk usage
- Replication lag

**Redis Metrics:**
- Memory usage
- Hit/miss ratio
- Connection count
- Command statistics

## Development Guide

### Setup Development Environment

**Prerequisites:**
- Node.js 16+
- MongoDB 4.4+
- Redis 6+
- Git

**Installation:**
```bash
# Clone repository
git clone https://github.com/Reshigan/TRADEAI.git
cd TRADEAI

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Setup environment variables
cp .env.example .env
```

**Development Scripts:**
```bash
# Start backend
npm run dev

# Start frontend
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Code Standards

**ESLint Configuration:**
```javascript
{
  "extends": ["react-app", "react-app/jest"],
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "warn",
    "prefer-const": "error"
  }
}
```

**Prettier Configuration:**
```javascript
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Git Workflow

**Branch Strategy:**
- `main` - Production branch
- `dev` - Development branch
- `feature/*` - Feature branches
- `hotfix/*` - Hotfix branches

**Commit Convention:**
```
feat: add new feature
fix: bug fix
docs: documentation update
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### Testing Strategy

**Unit Tests:**
- Jest for JavaScript testing
- React Testing Library for component tests
- Supertest for API testing

**Integration Tests:**
- Database integration tests
- API endpoint tests
- Service integration tests

**E2E Tests:**
- Cypress for end-to-end testing
- User journey testing
- Cross-browser testing

### Performance Optimization

**Frontend Optimization:**
- Code splitting with React.lazy()
- Memoization with React.memo()
- Virtual scrolling for large lists
- Image optimization
- Bundle size optimization

**Backend Optimization:**
- Database query optimization
- Caching strategies
- Connection pooling
- Compression middleware
- Rate limiting

### Troubleshooting

**Common Issues:**

1. **Build Failures:**
   - Check Node.js version compatibility
   - Clear node_modules and reinstall
   - Verify environment variables

2. **Database Connection:**
   - Check MongoDB service status
   - Verify connection string
   - Check network connectivity

3. **Authentication Issues:**
   - Verify JWT secret configuration
   - Check token expiration
   - Validate user permissions

4. **Performance Issues:**
   - Monitor database queries
   - Check memory usage
   - Analyze network requests
   - Review caching strategies

---

*Last Updated: October 15, 2025*
*Version: 2.1.3*
*Document Maintainer: TradeAI Development Team*