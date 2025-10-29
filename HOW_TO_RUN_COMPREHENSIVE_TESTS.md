# 🧪 How to Run Comprehensive Tests & Seed Data
## TRADEAI System - Complete Testing Guide

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Start services
./scripts/start-production.sh

# 2. Seed ALL data for frontend validation
node scripts/seed-all-frontend-data.js

# 3. Open browser and test
open http://localhost:3000
```

**Login**: `john.vandermerwe@mdlz.co.za` / `Mondelez@2024`

---

## 📋 What Data Gets Seeded

### Core Master Data
- ✅ **1 Company**: Mondelez South Africa
- ✅ **12 Users**: Admin, Directors, Managers, KAMs, Analysts
- ✅ **150+ Customers**: 4-level hierarchy (National → Banner → Region → Store)
- ✅ **60+ Products**: 3-level hierarchy (Category → Brand → SKU)
- ✅ **3 Vendors**: Logistics, Packaging, Marketing

### Transactional Data
- ✅ **10 Promotions**: Hierarchy-assigned campaigns
- ✅ **15 Trading Terms**: Volume/revenue-based allocations
- ✅ **2 Campaigns**: Seasonal marketing campaigns
- ✅ **3 Budgets**: Category-level marketing budgets
- ✅ **4,000+ Transactions**: 6 months of sales data
- ✅ **12,000+ Sales History**: 12 months for AI/forecasting

### Financial Data
- ✅ **50 Invoices**: With line items and pricing
- ✅ **30 Payments**: Multiple payment methods
- ✅ **60 Settlements**: Monthly settlement records
- ✅ **30 Deductions**: Various deduction types
- ✅ **10 Disputes**: Active and resolved
- ✅ **180+ Accruals**: Monthly accrual tracking

### Operational Data
- ✅ **Trade Spends**: Monthly trade spend by customer/product
- ✅ **Activity Grids**: Promotion calendars and task tracking
- ✅ **Purchase Orders**: Vendor purchase orders
- ✅ **Budget Allocations**: Marketing budget distribution

### Analytics & Reports
- ✅ **5 Promotion Analyses**: ROI and lift calculations
- ✅ **15 Reports**: Various report types
- ✅ **20 AI Chats**: Sample AI conversations
- ✅ **100 Audit Logs**: User activity tracking
- ✅ **50 Security Events**: Login and security monitoring

**Total Records**: ~20,000+

---

## 🎯 Complete Testing Workflow

### Step 1: Prerequisites

```bash
# Ensure Docker is running
docker ps

# Ensure MongoDB and Redis are running
docker ps | grep mongo
docker ps | grep redis

# If not running, start them
cd /workspace/project/TRADEAI
docker compose up -d mongodb redis
```

### Step 2: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### Step 3: Configure Environment

```bash
# Verify backend/.env settings
cat backend/.env | grep -E "DATABASE_MODE|MOCK_DATA_ENABLED"

# Should show:
# DATABASE_MODE=real
# MOCK_DATA_ENABLED=false
```

### Step 4: Seed Data

```bash
# Option A: Seed everything (RECOMMENDED)
node scripts/seed-all-frontend-data.js

# Option B: Seed only Mondelez SA data
node scripts/seed-mondelez-sa-data.js

# Option C: Reset and seed from scratch
node scripts/seed-all-frontend-data.js --reset
```

### Step 5: Start Application

```bash
# Automated startup (recommended)
./scripts/start-production.sh

# OR Manual startup
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
cd frontend && npm start
```

### Step 6: Test in Browser

Open http://localhost:3000

---

## 🧪 Manual Testing Checklist

### Dashboard & Analytics
- [ ] Dashboard loads and shows widgets
- [ ] Revenue metrics display
- [ ] Top products chart renders
- [ ] Top customers chart renders
- [ ] Recent activity shows
- [ ] Quick actions work

### Customer Management
- [ ] Customer list loads with data
- [ ] Can filter by hierarchy level
- [ ] Can search customers
- [ ] Customer detail page shows hierarchy
- [ ] Can create new customer
- [ ] Can edit customer
- [ ] Hierarchy path displays correctly

### Product Management
- [ ] Product list loads with data
- [ ] Can filter by category/brand
- [ ] Can search products
- [ ] Product detail shows pricing
- [ ] Can create new product
- [ ] Can edit product
- [ ] Hierarchy breadcrumbs work

### Promotions
- [ ] Promotion list loads
- [ ] Can create promotion
- [ ] Can assign at hierarchy levels
- [ ] Discount calculations work
- [ ] Budget tracking displays
- [ ] Can approve/reject promotion
- [ ] Promotion effectiveness shows

### Trading Terms
- [ ] Trading terms list loads
- [ ] Can create new term
- [ ] Volume tiers display
- [ ] Revenue allocation calculates
- [ ] Can assign to customer hierarchy
- [ ] Can assign to product hierarchy
- [ ] Growth incentives calculate

### Transactions
- [ ] Transaction list loads with filters
- [ ] Can view transaction details
- [ ] Hierarchy data displays
- [ ] Discount calculations correct
- [ ] Can export transactions
- [ ] Bulk import works

### Invoices & Payments
- [ ] Invoice list loads
- [ ] Invoice details show line items
- [ ] Payment status displays correctly
- [ ] Can record payment
- [ ] Payment methods work
- [ ] Balance updates correctly

### Settlements
- [ ] Settlement list loads
- [ ] Monthly settlements display
- [ ] Amounts calculate correctly
- [ ] Deductions included
- [ ] Disputes tracked
- [ ] Can approve settlement

### Deductions & Disputes
- [ ] Deduction list loads
- [ ] Can create deduction
- [ ] Can attach documents
- [ ] Can dispute deduction
- [ ] Dispute workflow works
- [ ] Resolution recorded

### Budgets
- [ ] Budget list loads
- [ ] Budget allocations display
- [ ] Spent vs planned shows
- [ ] Can create budget
- [ ] Can allocate to products
- [ ] Variance tracking works

### Reports
- [ ] Report list loads
- [ ] Can generate new report
- [ ] Report filters work
- [ ] Hierarchy grouping works
- [ ] Can export report
- [ ] Charts render correctly

### AI Features
- [ ] AI chat interface loads
- [ ] Can ask questions
- [ ] Gets AI responses
- [ ] Demand forecast works
- [ ] Price optimization shows
- [ ] Scenario simulation works

### User Management
- [ ] User list loads
- [ ] Can create user
- [ ] Can assign roles
- [ ] Permissions work
- [ ] Can edit user
- [ ] Can deactivate user

### Settings & Configuration
- [ ] Company settings load
- [ ] Can update settings
- [ ] User profile loads
- [ ] Can change password
- [ ] Notifications work
- [ ] System preferences save

---

## 🔍 Automated Testing

### Run Backend Tests

```bash
cd backend
npm test

# Run specific test suite
npm test -- --grep "Customer"
npm test -- --grep "Promotion"
npm test -- --grep "Authentication"
```

### Run Frontend Tests

```bash
cd frontend
npm test

# Run with coverage
npm test -- --coverage

# Run specific component tests
npm test -- --testPathPattern=Dashboard
```

### Run Integration Tests

```bash
# Full integration test suite
npm run test:integration

# API endpoint tests
npm run test:api

# End-to-end tests
npm run test:e2e
```

---

## 📊 Performance Testing

### Load Testing with k6

```bash
# Install k6
brew install k6  # macOS
# OR
sudo apt install k6  # Linux

# Run load test
k6 run scripts/load-test.js

# Stress test with more users
k6 run --vus 50 --duration 5m scripts/load-test.js
```

### Database Performance

```bash
# Check database stats
mongosh "mongodb://admin:admin123@localhost:27017/tradeai?authSource=admin"

# In mongo shell:
db.stats()
db.customers.stats()
db.products.stats()
db.transactions.stats()

# Check index usage
db.transactions.aggregate([
  { $indexStats: {} }
])
```

### Frontend Performance

```bash
# Lighthouse audit
npm install -g lighthouse

lighthouse http://localhost:3000 --view

# Bundle size analysis
cd frontend
npm run build
npm run analyze
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to MongoDB"

```bash
# Check MongoDB is running
docker ps | grep mongo

# Start MongoDB if stopped
docker compose up -d mongodb

# Test connection
mongosh "mongodb://admin:admin123@localhost:27017/?authSource=admin"
```

### Issue: "No data showing in UI"

```bash
# Verify data was seeded
mongosh "mongodb://admin:admin123@localhost:27017/tradeai?authSource=admin"

# In mongo shell:
db.customers.countDocuments()
db.products.countDocuments()
db.transactions.countDocuments()

# If counts are zero, re-run seed script
node scripts/seed-all-frontend-data.js --reset
```

### Issue: "Authentication failed"

```bash
# Verify users were created
mongosh "mongodb://admin:admin123@localhost:27017/tradeai?authSource=admin"

# In mongo shell:
db.users.find({}, {email: 1, role: 1})

# If no users, seed them
node scripts/seed-production-users.js
```

### Issue: "Frontend not loading"

```bash
# Check frontend is running
curl http://localhost:3000

# Check backend API is running  
curl http://localhost:5000/health

# Check for errors
cd frontend
npm start

# Clear cache and restart
rm -rf node_modules/.cache
npm start
```

### Issue: "Slow performance"

```bash
# Check database indexes
mongosh "mongodb://admin:admin123@localhost:27017/tradeai?authSource=admin"

# In mongo shell:
db.customers.getIndexes()
db.products.getIndexes()
db.transactions.getIndexes()

# If missing indexes, create them
db.customers.createIndex({ "path": 1, "company": 1 })
db.products.createIndex({ "path": 1, "company": 1 })
db.transactions.createIndex({ "transactionDate": -1, "company": 1 })
```

---

## 📈 Monitoring Test Results

### Check Application Logs

```bash
# Backend logs
docker compose logs -f backend

# Database logs
docker compose logs -f mongodb

# All services
docker compose logs -f
```

### Monitor System Resources

```bash
# Docker stats
docker stats

# Disk usage
df -h

# Memory usage
free -h

# Process list
ps aux | grep node
```

### Database Metrics

```bash
# Connect to MongoDB
mongosh "mongodb://admin:admin123@localhost:27017/tradeai?authSource=admin"

# Database size
db.stats().dataSize / (1024*1024)  # Size in MB

# Collection sizes
db.customers.stats().size / (1024*1024)
db.products.stats().size / (1024*1024)
db.transactions.stats().size / (1024*1024)

# Query performance
db.setProfilingLevel(2)  # Enable profiling
db.system.profile.find().sort({ts:-1}).limit(10)  # Slow queries
```

---

## ✅ Test Coverage Report

After running all tests, generate a coverage report:

```bash
# Backend coverage
cd backend
npm run test:coverage

# Frontend coverage
cd frontend
npm run test:coverage

# View HTML reports
open backend/coverage/lcov-report/index.html
open frontend/coverage/lcov-report/index.html
```

---

## 📝 Test Results Documentation

### Create Test Report

```bash
# Run tests and save output
npm test > test-results.txt 2>&1

# Generate HTML report
npm run test:report

# View report
open test-report.html
```

### Share Results

```bash
# Create summary
cat <<EOF > TEST_RESULTS_SUMMARY.md
# Test Results Summary

Date: $(date)
Environment: Local Development

## Results
- Total Tests: XXX
- Passed: XXX
- Failed: XXX
- Coverage: XX%

## Issues Found
1. [List any issues]
2. [List any issues]

## Recommendations
1. [List recommendations]
2. [List recommendations]
EOF
```

---

## 🎯 Success Criteria

Your system passes comprehensive testing when:

### Functional Tests
- ✅ All CRUD operations work for every entity
- ✅ Hierarchy navigation works at all levels
- ✅ Proportional allocation calculates correctly
- ✅ All financial calculations are accurate
- ✅ Workflows progress correctly
- ✅ Reports generate without errors

### Performance Tests
- ✅ Pages load in < 2 seconds
- ✅ API responses in < 200ms
- ✅ Can handle 50 concurrent users
- ✅ Database queries optimized
- ✅ No memory leaks
- ✅ Frontend bundle size < 2MB

### Data Validation
- ✅ All frontend pages have data
- ✅ No null/undefined errors
- ✅ Calculations match expected results
- ✅ Hierarchies display correctly
- ✅ Audit trails complete
- ✅ Data integrity maintained

### User Experience
- ✅ No console errors
- ✅ Forms validate correctly
- ✅ Error messages clear
- ✅ Loading states work
- ✅ Responsive design works
- ✅ Navigation intuitive

---

## 📞 Need Help?

### Documentation References
- `COMPREHENSIVE_TEST_PLAN_AND_PRODUCTION_READINESS.md` - Full test plan
- `EXECUTIVE_SUMMARY_PRODUCTION_READINESS.md` - Production readiness
- `README_AUTHENTICATION_FIX.md` - Authentication guide
- `DEPLOYMENT_INSTRUCTIONS.md` - Deployment guide

### Quick Commands Reference

```bash
# Start everything
./scripts/start-production.sh

# Seed data
node scripts/seed-all-frontend-data.js

# Verify setup
./scripts/verify-authentication-setup.sh

# Run tests
npm test

# Check logs
docker compose logs -f

# Stop everything
docker compose down
```

---

**Happy Testing! 🎉**

All systems are ready for comprehensive validation. Follow this guide to ensure every frontend element has data and works correctly.
