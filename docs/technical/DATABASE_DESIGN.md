# 🗄️ TRADEAI - Database Design Document

## Document Information
- **Document Type**: Database Design Document
- **Version**: 1.0
- **Date**: September 2024
- **Status**: Current
- **Database**: MongoDB 7.0+

## 1. Database Overview

### 1.1 Database Architecture

TRADEAI uses MongoDB as the primary database with a multi-tenant architecture ensuring complete data isolation between companies while maintaining shared infrastructure efficiency.

### 1.2 Design Principles

1. **Multi-Tenancy**: Complete data isolation using companyId field
2. **Scalability**: Horizontal scaling with sharding support
3. **Performance**: Optimized indexes and query patterns
4. **Consistency**: ACID transactions for critical operations
5. **Flexibility**: Schema flexibility for evolving requirements

## 2. Collection Design

### 2.1 Companies Collection

**Purpose**: Store company/tenant information and configuration

```javascript
{
  _id: ObjectId("..."),
  name: "Procter & Gamble",
  domain: "pg.com",
  slug: "procter-gamble",
  settings: {
    branding: {
      logo: "https://cdn.tradeai.com/logos/pg.png",
      primaryColor: "#003DA5",
      secondaryColor: "#FFD700",
      theme: "corporate"
    },
    features: {
      aiAnalytics: true,
      advancedReporting: true,
      multiCurrency: true,
      customFields: true
    },
    limits: {
      maxUsers: 1000,
      maxBudgets: 500,
      storageGB: 100
    },
    timezone: "America/New_York",
    currency: "USD",
    fiscalYearStart: "01-01"
  },
  subscription: {
    plan: "enterprise",
    status: "active",
    startDate: ISODate("2024-01-01"),
    endDate: ISODate("2024-12-31"),
    features: ["ai_analytics", "advanced_reporting"]
  },
  contact: {
    name: "John Smith",
    email: "admin@pg.com",
    phone: "+1-555-0123"
  },
  isActive: true,
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-09-14T10:30:00Z"),
  createdBy: ObjectId("..."),
  updatedBy: ObjectId("...")
}
```

**Indexes**:
```javascript
db.companies.createIndex({ "domain": 1 }, { unique: true });
db.companies.createIndex({ "slug": 1 }, { unique: true });
db.companies.createIndex({ "isActive": 1 });
db.companies.createIndex({ "subscription.status": 1 });
```

### 2.2 Users Collection

**Purpose**: Store user accounts and authentication information

```javascript
{
  _id: ObjectId("..."),
  companyId: ObjectId("..."),
  email: "john.doe@pg.com",
  password: "$2b$12$...", // bcrypt hashed
  role: "trade_manager",
  permissions: [
    "budgets.read",
    "budgets.write",
    "campaigns.read",
    "campaigns.write",
    "reports.trade"
  ],
  profile: {
    firstName: "John",
    lastName: "Doe",
    avatar: "https://cdn.tradeai.com/avatars/john-doe.jpg",
    title: "Senior Trade Marketing Manager",
    department: "Marketing",
    phone: "+1-555-0124",
    timezone: "America/New_York",
    language: "en",
    dateFormat: "MM/DD/YYYY"
  },
  preferences: {
    dashboard: {
      layout: "grid",
      widgets: ["budget_overview", "kpi_metrics", "recent_activity"]
    },
    notifications: {
      email: true,
      push: false,
      budgetAlerts: true,
      reportSchedule: "weekly"
    }
  },
  security: {
    lastLogin: ISODate("2024-09-14T09:15:00Z"),
    lastPasswordChange: ISODate("2024-08-01T00:00:00Z"),
    failedLoginAttempts: 0,
    lockedUntil: null,
    twoFactorEnabled: false,
    loginHistory: [
      {
        timestamp: ISODate("2024-09-14T09:15:00Z"),
        ip: "192.168.1.100",
        userAgent: "Mozilla/5.0...",
        success: true
      }
    ]
  },
  isActive: true,
  isEmailVerified: true,
  createdAt: ISODate("2024-01-15T00:00:00Z"),
  updatedAt: ISODate("2024-09-14T09:15:00Z"),
  createdBy: ObjectId("..."),
  updatedBy: ObjectId("...")
}
```

**Indexes**:
```javascript
db.users.createIndex({ "companyId": 1, "email": 1 }, { unique: true });
db.users.createIndex({ "companyId": 1, "role": 1 });
db.users.createIndex({ "companyId": 1, "isActive": 1 });
db.users.createIndex({ "email": 1 });
```

### 2.3 Budgets Collection

**Purpose**: Store budget information and allocations

```javascript
{
  _id: ObjectId("..."),
  companyId: ObjectId("..."),
  name: "Q4 2024 Trade Marketing Budget",
  description: "Fourth quarter trade marketing budget for all brands",
  type: "quarterly", // annual, quarterly, campaign, project
  status: "active", // draft, active, locked, archived
  
  financial: {
    totalAmount: 5000000.00,
    currency: "USD",
    spent: 1250000.00,
    committed: 750000.00,
    available: 3000000.00,
    variance: -50000.00, // negative = over budget
    lastCalculated: ISODate("2024-09-14T10:00:00Z")
  },
  
  period: {
    startDate: ISODate("2024-10-01T00:00:00Z"),
    endDate: ISODate("2024-12-31T23:59:59Z"),
    fiscalYear: 2024,
    quarter: 4
  },
  
  allocations: [
    {
      _id: ObjectId("..."),
      category: "Trade Promotions",
      subcategory: "Price Reductions",
      budgetAmount: 2000000.00,
      spentAmount: 500000.00,
      committedAmount: 300000.00,
      availableAmount: 1200000.00,
      brands: ["Tide", "Ariel", "Downy"],
      channels: ["Walmart", "Target", "Amazon"],
      owner: ObjectId("..."), // user responsible
      notes: "Focus on premium products"
    },
    {
      _id: ObjectId("..."),
      category: "Display & Merchandising",
      subcategory: "End Cap Displays",
      budgetAmount: 1500000.00,
      spentAmount: 375000.00,
      committedAmount: 225000.00,
      availableAmount: 900000.00,
      brands: ["Pampers", "Gillette"],
      channels: ["CVS", "Walgreens"],
      owner: ObjectId("..."),
      notes: "Holiday season focus"
    }
  ],
  
  approvals: [
    {
      level: 1,
      approver: ObjectId("..."),
      status: "approved",
      timestamp: ISODate("2024-09-01T14:30:00Z"),
      comments: "Approved with minor adjustments"
    },
    {
      level: 2,
      approver: ObjectId("..."),
      status: "approved",
      timestamp: ISODate("2024-09-02T09:15:00Z"),
      comments: "Final approval granted"
    }
  ],
  
  metadata: {
    tags: ["Q4", "holiday", "premium"],
    customFields: {
      region: "North America",
      businessUnit: "Beauty & Grooming",
      priority: "high"
    }
  },
  
  isActive: true,
  createdAt: ISODate("2024-08-15T00:00:00Z"),
  updatedAt: ISODate("2024-09-14T10:00:00Z"),
  createdBy: ObjectId("..."),
  updatedBy: ObjectId("...")
}
```

**Indexes**:
```javascript
db.budgets.createIndex({ "companyId": 1, "period.startDate": -1 });
db.budgets.createIndex({ "companyId": 1, "status": 1 });
db.budgets.createIndex({ "companyId": 1, "type": 1 });
db.budgets.createIndex({ "allocations.owner": 1 });
db.budgets.createIndex({ "metadata.tags": 1 });
```

### 2.4 Transactions Collection

**Purpose**: Store all financial transactions and budget movements

```javascript
{
  _id: ObjectId("..."),
  companyId: ObjectId("..."),
  budgetId: ObjectId("..."),
  allocationId: ObjectId("..."), // reference to budget allocation
  
  transaction: {
    type: "expense", // expense, commitment, adjustment, transfer
    amount: 25000.00,
    currency: "USD",
    description: "Walmart End Cap Display - Tide Pods",
    reference: "INV-2024-09-001",
    externalId: "ERP-TXN-123456"
  },
  
  details: {
    vendor: "Walmart Inc.",
    brand: "Tide",
    product: "Tide Pods",
    channel: "Walmart",
    campaign: "Holiday Promotion 2024",
    costCenter: "CC-001-TRADE",
    glAccount: "60001-TRADE-PROMO"
  },
  
  dates: {
    transactionDate: ISODate("2024-09-14T00:00:00Z"),
    effectiveDate: ISODate("2024-09-14T00:00:00Z"),
    dueDate: ISODate("2024-10-14T00:00:00Z"),
    paidDate: null
  },
  
  status: "pending", // pending, approved, paid, cancelled
  
  approvals: [
    {
      level: 1,
      approver: ObjectId("..."),
      status: "approved",
      timestamp: ISODate("2024-09-14T10:30:00Z"),
      comments: "Approved - within budget"
    }
  ],
  
  attachments: [
    {
      filename: "walmart_invoice_001.pdf",
      url: "https://cdn.tradeai.com/attachments/...",
      type: "invoice",
      uploadedBy: ObjectId("..."),
      uploadedAt: ISODate("2024-09-14T10:00:00Z")
    }
  ],
  
  audit: {
    createdAt: ISODate("2024-09-14T10:00:00Z"),
    updatedAt: ISODate("2024-09-14T10:30:00Z"),
    createdBy: ObjectId("..."),
    updatedBy: ObjectId("..."),
    version: 1
  }
}
```

**Indexes**:
```javascript
db.transactions.createIndex({ "companyId": 1, "dates.transactionDate": -1 });
db.transactions.createIndex({ "budgetId": 1, "status": 1 });
db.transactions.createIndex({ "companyId": 1, "transaction.type": 1 });
db.transactions.createIndex({ "details.brand": 1, "details.channel": 1 });
db.transactions.createIndex({ "status": 1, "dates.dueDate": 1 });
```

### 2.5 Analytics Collection

**Purpose**: Store pre-calculated analytics and KPI data

```javascript
{
  _id: ObjectId("..."),
  companyId: ObjectId("..."),
  
  metric: {
    name: "budget_utilization",
    category: "financial",
    subcategory: "budget_performance"
  },
  
  dimensions: {
    period: "2024-Q4",
    brand: "Tide",
    channel: "Walmart",
    region: "North America",
    budgetType: "quarterly"
  },
  
  values: {
    current: 0.65, // 65% utilization
    previous: 0.58, // previous period comparison
    target: 0.75,
    variance: -0.10,
    trend: "increasing"
  },
  
  calculations: {
    totalBudget: 2000000.00,
    spentAmount: 1300000.00,
    remainingAmount: 700000.00,
    projectedSpend: 1850000.00,
    efficiency: 0.92
  },
  
  metadata: {
    calculatedAt: ISODate("2024-09-14T10:00:00Z"),
    dataSource: "transactions",
    confidence: 0.95,
    sampleSize: 1250
  },
  
  date: ISODate("2024-09-14T00:00:00Z"),
  createdAt: ISODate("2024-09-14T10:00:00Z")
}
```

**Indexes**:
```javascript
db.analytics.createIndex({ "companyId": 1, "date": -1, "metric.name": 1 });
db.analytics.createIndex({ "companyId": 1, "metric.category": 1 });
db.analytics.createIndex({ "dimensions.brand": 1, "dimensions.channel": 1 });
db.analytics.createIndex({ "date": -1 });
```

### 2.6 Campaigns Collection

**Purpose**: Store marketing campaign information and performance

```javascript
{
  _id: ObjectId("..."),
  companyId: ObjectId("..."),
  budgetId: ObjectId("..."),
  
  campaign: {
    name: "Holiday Tide Promotion 2024",
    description: "End-of-year promotion for Tide products",
    type: "promotion", // promotion, display, advertising, sampling
    status: "active", // planning, active, paused, completed, cancelled
    priority: "high"
  },
  
  targeting: {
    brands: ["Tide", "Tide Pods"],
    channels: ["Walmart", "Target", "Kroger"],
    regions: ["Northeast", "Southeast"],
    demographics: {
      ageRange: "25-54",
      income: "middle-upper",
      lifestyle: "family-oriented"
    }
  },
  
  timeline: {
    planningStart: ISODate("2024-08-01T00:00:00Z"),
    campaignStart: ISODate("2024-11-01T00:00:00Z"),
    campaignEnd: ISODate("2024-12-31T23:59:59Z"),
    reportingEnd: ISODate("2025-01-15T00:00:00Z")
  },
  
  budget: {
    totalBudget: 500000.00,
    spentAmount: 125000.00,
    committedAmount: 75000.00,
    availableAmount: 300000.00,
    breakdown: {
      media: 200000.00,
      production: 50000.00,
      incentives: 200000.00,
      other: 50000.00
    }
  },
  
  performance: {
    impressions: 2500000,
    clicks: 125000,
    conversions: 5000,
    revenue: 750000.00,
    roi: 1.5,
    ctr: 0.05,
    conversionRate: 0.04,
    lastUpdated: ISODate("2024-09-14T10:00:00Z")
  },
  
  createdAt: ISODate("2024-08-01T00:00:00Z"),
  updatedAt: ISODate("2024-09-14T10:00:00Z"),
  createdBy: ObjectId("..."),
  updatedBy: ObjectId("...")
}
```

**Indexes**:
```javascript
db.campaigns.createIndex({ "companyId": 1, "timeline.campaignStart": -1 });
db.campaigns.createIndex({ "companyId": 1, "campaign.status": 1 });
db.campaigns.createIndex({ "targeting.brands": 1, "targeting.channels": 1 });
db.campaigns.createIndex({ "budgetId": 1 });
```

### 2.7 Reports Collection

**Purpose**: Store generated reports and report configurations

```javascript
{
  _id: ObjectId("..."),
  companyId: ObjectId("..."),
  
  report: {
    name: "Monthly Budget Performance Report",
    type: "budget_performance", // predefined report types
    format: "pdf", // pdf, excel, csv, json
    status: "completed", // generating, completed, failed
    size: 2048576 // bytes
  },
  
  parameters: {
    period: {
      startDate: ISODate("2024-09-01T00:00:00Z"),
      endDate: ISODate("2024-09-30T23:59:59Z")
    },
    filters: {
      brands: ["Tide", "Ariel"],
      channels: ["Walmart", "Target"],
      budgetTypes: ["quarterly"]
    },
    groupBy: ["brand", "channel"],
    metrics: ["spend", "budget", "variance", "roi"]
  },
  
  schedule: {
    frequency: "monthly", // once, daily, weekly, monthly, quarterly
    nextRun: ISODate("2024-10-01T09:00:00Z"),
    timezone: "America/New_York",
    recipients: [
      "john.doe@pg.com",
      "jane.smith@pg.com"
    ]
  },
  
  files: [
    {
      filename: "budget_performance_202409.pdf",
      url: "https://cdn.tradeai.com/reports/...",
      generatedAt: ISODate("2024-10-01T09:00:00Z"),
      expiresAt: ISODate("2024-11-01T09:00:00Z")
    }
  ],
  
  metadata: {
    generatedBy: ObjectId("..."),
    generationTime: 45.2, // seconds
    recordCount: 1250,
    dataSource: "transactions"
  },
  
  createdAt: ISODate("2024-09-01T00:00:00Z"),
  updatedAt: ISODate("2024-10-01T09:00:00Z"),
  createdBy: ObjectId("..."),
  updatedBy: ObjectId("...")
}
```

**Indexes**:
```javascript
db.reports.createIndex({ "companyId": 1, "createdAt": -1 });
db.reports.createIndex({ "companyId": 1, "report.type": 1 });
db.reports.createIndex({ "schedule.nextRun": 1, "report.status": 1 });
db.reports.createIndex({ "createdBy": 1 });
```

### 2.8 Audit Logs Collection

**Purpose**: Store all system activities for compliance and debugging

```javascript
{
  _id: ObjectId("..."),
  companyId: ObjectId("..."),
  
  event: {
    type: "budget.update", // action type
    category: "data_modification",
    severity: "info", // debug, info, warn, error, critical
    description: "Budget allocation updated"
  },
  
  actor: {
    userId: ObjectId("..."),
    email: "john.doe@pg.com",
    role: "trade_manager",
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0..."
  },
  
  target: {
    resourceType: "budget",
    resourceId: ObjectId("..."),
    resourceName: "Q4 2024 Trade Marketing Budget"
  },
  
  changes: {
    before: {
      "allocations.0.budgetAmount": 1800000.00
    },
    after: {
      "allocations.0.budgetAmount": 2000000.00
    }
  },
  
  context: {
    sessionId: "sess_abc123",
    requestId: "req_xyz789",
    endpoint: "/api/budgets/64f...",
    method: "PUT"
  },
  
  timestamp: ISODate("2024-09-14T10:30:00Z"),
  createdAt: ISODate("2024-09-14T10:30:00Z")
}
```

**Indexes**:
```javascript
db.auditLogs.createIndex({ "companyId": 1, "timestamp": -1 });
db.auditLogs.createIndex({ "actor.userId": 1, "timestamp": -1 });
db.auditLogs.createIndex({ "event.type": 1, "timestamp": -1 });
db.auditLogs.createIndex({ "target.resourceType": 1, "target.resourceId": 1 });
db.auditLogs.createIndex({ "timestamp": -1 }); // TTL index for retention
```

## 3. Data Relationships

### 3.1 Entity Relationship Diagram

```
Companies (1) ←→ (N) Users
    ↓
    └─→ (N) Budgets (1) ←→ (N) Transactions
            ↓
            └─→ (N) Campaigns
            └─→ (N) Analytics
            └─→ (N) Reports

Users (1) ←→ (N) Audit Logs
```

### 3.2 Reference Patterns

#### Embedded Documents
- **Budget Allocations**: Embedded in budgets for atomic updates
- **User Preferences**: Embedded in users for performance
- **Campaign Performance**: Embedded in campaigns for consistency

#### Referenced Documents
- **Company References**: All collections reference companyId
- **User References**: createdBy, updatedBy, approver fields
- **Budget References**: Transactions reference budgetId

## 4. Data Validation

### 4.1 Schema Validation

```javascript
// Budget collection validation
db.createCollection("budgets", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["companyId", "name", "type", "financial", "period"],
      properties: {
        companyId: {
          bsonType: "objectId",
          description: "Company ID is required"
        },
        name: {
          bsonType: "string",
          minLength: 3,
          maxLength: 100,
          description: "Budget name must be 3-100 characters"
        },
        financial: {
          bsonType: "object",
          required: ["totalAmount", "currency"],
          properties: {
            totalAmount: {
              bsonType: "double",
              minimum: 0,
              description: "Total amount must be positive"
            },
            currency: {
              bsonType: "string",
              enum: ["USD", "EUR", "GBP", "CAD"],
              description: "Currency must be valid ISO code"
            }
          }
        }
      }
    }
  }
});
```

### 4.2 Application-Level Validation

```javascript
// Mongoose schema example
const budgetSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
    trim: true
  },
  financial: {
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function(v) {
          return v > 0;
        },
        message: 'Total amount must be positive'
      }
    }
  }
});
```

## 5. Performance Optimization

### 5.1 Indexing Strategy

#### Compound Indexes
```javascript
// Multi-tenant queries
db.budgets.createIndex({ "companyId": 1, "period.startDate": -1 });
db.transactions.createIndex({ "companyId": 1, "dates.transactionDate": -1 });

// Reporting queries
db.analytics.createIndex({ 
  "companyId": 1, 
  "metric.name": 1, 
  "date": -1 
});

// Search queries
db.users.createIndex({ 
  "companyId": 1, 
  "profile.firstName": "text", 
  "profile.lastName": "text" 
});
```

#### Partial Indexes
```javascript
// Index only active records
db.users.createIndex(
  { "companyId": 1, "email": 1 },
  { partialFilterExpression: { "isActive": true } }
);

// Index only pending transactions
db.transactions.createIndex(
  { "companyId": 1, "dates.dueDate": 1 },
  { partialFilterExpression: { "status": "pending" } }
);
```

### 5.2 Query Optimization

#### Aggregation Pipelines
```javascript
// Budget utilization by brand
db.transactions.aggregate([
  { $match: { companyId: ObjectId("..."), status: "approved" } },
  { $group: {
    _id: "$details.brand",
    totalSpent: { $sum: "$transaction.amount" },
    transactionCount: { $sum: 1 }
  }},
  { $sort: { totalSpent: -1 } },
  { $limit: 10 }
]);
```

#### Projection Optimization
```javascript
// Return only required fields
db.budgets.find(
  { companyId: ObjectId("...") },
  { name: 1, "financial.totalAmount": 1, "financial.spent": 1 }
);
```

### 5.3 Sharding Strategy

#### Shard Key Selection
```javascript
// Shard by companyId for tenant isolation
sh.shardCollection("tradeai.budgets", { "companyId": 1 });
sh.shardCollection("tradeai.transactions", { "companyId": 1, "_id": 1 });
sh.shardCollection("tradeai.analytics", { "companyId": 1, "date": 1 });
```

## 6. Data Retention and Archival

### 6.1 Retention Policies

| Collection | Retention Period | Archive Strategy |
|------------|------------------|------------------|
| auditLogs | 7 years | Cold storage after 2 years |
| transactions | 10 years | Archive after 3 years |
| analytics | 5 years | Aggregate after 1 year |
| reports | 3 years | Delete generated files after 1 year |
| campaigns | Indefinite | Archive completed campaigns |

### 6.2 TTL Indexes

```javascript
// Auto-delete old audit logs
db.auditLogs.createIndex(
  { "timestamp": 1 },
  { expireAfterSeconds: 220752000 } // 7 years
);

// Auto-delete temporary reports
db.reports.createIndex(
  { "files.expiresAt": 1 },
  { expireAfterSeconds: 0 }
);
```

## 7. Backup and Recovery

### 7.1 Backup Strategy

#### Full Backups
- **Frequency**: Daily at 2 AM UTC
- **Retention**: 30 days
- **Storage**: AWS S3 with cross-region replication
- **Compression**: gzip compression

#### Incremental Backups
- **Frequency**: Every 6 hours
- **Method**: MongoDB oplog replay
- **Retention**: 7 days

### 7.2 Point-in-Time Recovery

```bash
# Restore to specific timestamp
mongorestore --host replica-set/mongo1:27017,mongo2:27017,mongo3:27017 \
  --oplogReplay \
  --oplogLimit 1631234567:1 \
  /backup/path
```

## 8. Security Considerations

### 8.1 Data Encryption

#### Encryption at Rest
- **Method**: MongoDB native encryption
- **Key Management**: AWS KMS
- **Algorithm**: AES-256

#### Encryption in Transit
- **TLS Version**: 1.3
- **Certificate**: Let's Encrypt or corporate CA
- **Cipher Suites**: Strong ciphers only

### 8.2 Access Control

#### Database Users
```javascript
// Application user with limited permissions
db.createUser({
  user: "tradeai_app",
  pwd: "secure_password",
  roles: [
    { role: "readWrite", db: "tradeai" },
    { role: "dbAdmin", db: "tradeai" }
  ]
});

// Read-only user for reporting
db.createUser({
  user: "tradeai_readonly",
  pwd: "secure_password",
  roles: [
    { role: "read", db: "tradeai" }
  ]
});
```

#### Field-Level Security
```javascript
// Sensitive field encryption
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    encrypt: true // mongoose-encryption
  },
  ssn: {
    type: String,
    encrypt: true,
    select: false // exclude from queries by default
  }
});
```

## 9. Monitoring and Maintenance

### 9.1 Performance Monitoring

#### Key Metrics
- **Query Performance**: Slow query log analysis
- **Index Usage**: Index hit ratios and unused indexes
- **Connection Pool**: Connection utilization
- **Replication Lag**: Secondary lag monitoring

#### Monitoring Queries
```javascript
// Find slow queries
db.getProfilingData().find().sort({ ts: -1 }).limit(5);

// Check index usage
db.budgets.aggregate([{ $indexStats: {} }]);

// Monitor replication lag
rs.printSlaveReplicationInfo();
```

### 9.2 Maintenance Tasks

#### Regular Maintenance
- **Index Optimization**: Monthly index analysis
- **Collection Stats**: Weekly collection statistics
- **Disk Usage**: Daily disk space monitoring
- **Backup Verification**: Weekly backup restoration tests

#### Automated Scripts
```javascript
// Cleanup old analytics data
db.analytics.deleteMany({
  date: { $lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
  "metric.category": "temporary"
});

// Update budget calculations
db.budgets.updateMany(
  { status: "active" },
  [{ $set: {
    "financial.available": {
      $subtract: ["$financial.totalAmount", "$financial.spent"]
    }
  }}]
);
```

---

**Document Maintenance**

This document should be updated whenever schema changes are made or new collections are added.

**Next Review Date**: December 2024  
**Document Owner**: Database Architecture Team  
**Stakeholders**: Development Team, DevOps, Data Team