# 📋 .env.test Configuration Guide

## Overview

The `.env.test` file is the **single source of truth** for all E2E test configuration. This file contains **180+ environment variables** that control every aspect of test execution - URLs, credentials, test data, thresholds, and more.

**Key Principle**: ✅ **ZERO HARDCODING** - All configuration must come from this file.

---

## 🎯 Why Environment-Driven Configuration?

### Benefits
1. **Security** - No credentials in code
2. **Flexibility** - Easy environment switching
3. **Maintainability** - Single file to update
4. **Reusability** - Same tests, different environments
5. **Best Practice** - Industry standard approach

### Anti-Pattern (What We Avoid)
```javascript
// ❌ BAD - Hardcoded values
const baseURL = 'http://localhost:3001';
const adminEmail = 'admin@tradeai.com';
const adminPassword = 'admin123';
```

### Correct Pattern (What We Use)
```javascript
// ✅ GOOD - Environment-driven
const baseURL = process.env.BASE_URL;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
```

---

## 📁 File Structure

The `.env.test` file is organized into logical sections:

### 1. Application URLs (2 variables)
```bash
BASE_URL=http://localhost:3001
API_URL=http://localhost:5002
```

**Usage**: Base URLs for frontend and backend services.

### 2. Timeout Settings (4 variables)
```bash
DEFAULT_TIMEOUT=30000
NAVIGATION_TIMEOUT=15000
API_TIMEOUT=10000
WAIT_TIMEOUT=5000
```

**Usage**: Control test timing and waiting strategies.

### 3. Test Users (16 variables - 4 roles)
```bash
# Admin User
ADMIN_EMAIL=admin@tradeai.com
ADMIN_PASSWORD=admin123
ADMIN_ROLE=admin
ADMIN_NAME=Admin

# Manager User
MANAGER_EMAIL=manager@tradeai.com
MANAGER_PASSWORD=admin123
MANAGER_ROLE=manager
MANAGER_NAME=Manager

# KAM User (Key Account Manager)
KAM_EMAIL=kam@tradeai.com
KAM_PASSWORD=admin123
KAM_ROLE=kam
KAM_NAME=KAM

# Viewer User (Read-only)
VIEWER_EMAIL=viewer@tradeai.com
VIEWER_PASSWORD=admin123
VIEWER_ROLE=viewer
VIEWER_NAME=Viewer
```

**Usage**: Different user roles for testing access control.

### 4. Test Data (100+ variables - 10 entities)

#### Budget Data
```bash
TEST_BUDGET_NAME=Test Budget 2024
TEST_BUDGET_AMOUNT=100000
TEST_BUDGET_CATEGORY=Marketing
TEST_BUDGET_START_DATE=2024-01-01
TEST_BUDGET_END_DATE=2024-12-31
```

#### Trade Spend Data
```bash
TEST_TRADE_SPEND_NAME=Test Trade Spend
TEST_TRADE_SPEND_AMOUNT=50000
TEST_TRADE_SPEND_CUSTOMER=Test Customer
TEST_TRADE_SPEND_PRODUCT=Test Product
```

#### Customer Data
```bash
TEST_CUSTOMER_NAME=Test Customer Inc
TEST_CUSTOMER_EMAIL=customer@test.com
TEST_CUSTOMER_PHONE=+1234567890
TEST_CUSTOMER_ADDRESS=123 Test Street
```

#### Promotion Data
```bash
TEST_PROMOTION_NAME=Test Promotion
TEST_PROMOTION_DISCOUNT=20
TEST_PROMOTION_START_DATE=2024-01-01
TEST_PROMOTION_END_DATE=2024-12-31
```

#### Product Data
```bash
TEST_PRODUCT_NAME=Test Product
TEST_PRODUCT_SKU=TEST-SKU-001
TEST_PRODUCT_PRICE=99.99
TEST_PRODUCT_CATEGORY=Test Category
```

#### Company Data
```bash
TEST_COMPANY_NAME=Test Company
TEST_COMPANY_EMAIL=company@test.com
TEST_COMPANY_PHONE=+1234567890
TEST_COMPANY_ADDRESS=456 Company Avenue
```

#### Trading Term Data 🎯
```bash
TEST_TRADING_TERM_NAME=Test Trading Term
TEST_TRADING_TERM_TYPE=Volume Discount
TEST_TRADING_TERM_VALUE=10
TEST_TRADING_TERM_DESCRIPTION=Test trading term description
```

#### Activity Data 🎯
```bash
TEST_ACTIVITY_TITLE=Test Activity
TEST_ACTIVITY_DESCRIPTION=Test activity description
TEST_ACTIVITY_DATE=2024-01-15
```

#### User Management Data
```bash
TEST_USER_NAME=Test User
TEST_USER_EMAIL=testuser@test.com
TEST_USER_PASSWORD=testpass123
TEST_USER_ROLE=viewer
```

#### Report Data
```bash
TEST_REPORT_NAME=Test Report
TEST_REPORT_TYPE=Sales Report
TEST_REPORT_START_DATE=2024-01-01
TEST_REPORT_END_DATE=2024-12-31
```

#### Transaction Data
```bash
TEST_TRANSACTION_AMOUNT=1000
TEST_TRANSACTION_TYPE=Purchase
TEST_TRANSACTION_DATE=2024-01-15
```

#### Simulation Data
```bash
TEST_SIMULATION_NAME=Test Simulation
TEST_SIMULATION_SCENARIO=Best Case
TEST_SIMULATION_DURATION=90
```

### 5. Viewport Settings (6 variables - 3 sizes)
```bash
# Mobile
MOBILE_WIDTH=375
MOBILE_HEIGHT=667

# Tablet
TABLET_WIDTH=768
TABLET_HEIGHT=1024

# Desktop
BROWSER_VIEWPORT_WIDTH=1920
BROWSER_VIEWPORT_HEIGHT=1080
```

**Usage**: Testing responsive design across devices.

### 6. API Endpoints (16 variables)
```bash
API_AUTH_ENDPOINT=/api/auth/login
API_USERS_ENDPOINT=/api/users
API_BUDGETS_ENDPOINT=/api/budgets
API_TRADE_SPENDS_ENDPOINT=/api/trade-spends
API_CUSTOMERS_ENDPOINT=/api/customers
API_PROMOTIONS_ENDPOINT=/api/promotions
API_PRODUCTS_ENDPOINT=/api/products
API_COMPANIES_ENDPOINT=/api/companies
API_TRADING_TERMS_ENDPOINT=/api/trading-terms
API_ACTIVITIES_ENDPOINT=/api/activities
API_REPORTS_ENDPOINT=/api/reports
API_TRANSACTIONS_ENDPOINT=/api/transactions
API_SIMULATIONS_ENDPOINT=/api/simulations
API_ANALYTICS_ENDPOINT=/api/analytics
API_SETTINGS_ENDPOINT=/api/settings
API_HEALTH_ENDPOINT=/api/health
```

**Usage**: API endpoint paths for integration testing.

### 7. Search Terms (3 variables)
```bash
SEARCH_TERM_PRODUCT=test
SEARCH_TERM_CUSTOMER=customer
SEARCH_TERM_COMPANY=company
```

**Usage**: Testing search functionality.

### 8. Performance Thresholds (3 variables)
```bash
PAGE_LOAD_THRESHOLD=5000
API_RESPONSE_THRESHOLD=2000
SEARCH_RESPONSE_THRESHOLD=1000
```

**Usage**: Performance benchmarks in milliseconds.

### 9. Expected Messages (9 variables)
```bash
# Error Messages
ERROR_INVALID_CREDENTIALS=Invalid credentials
ERROR_REQUIRED_FIELD=This field is required
ERROR_UNAUTHORIZED=Unauthorized
ERROR_NOT_FOUND=Not found
ERROR_SERVER_ERROR=Server error

# Success Messages
SUCCESS_LOGIN=Login successful
SUCCESS_CREATED=created successfully
SUCCESS_UPDATED=updated successfully
SUCCESS_DELETED=deleted successfully
```

**Usage**: Validation of user feedback messages.

### 10. Test Execution Settings (7 variables)
```bash
MAX_RETRIES=2
WORKERS=3
SCREENSHOT_ON_FAILURE=true
VIDEO_ON_FAILURE=true
TRACE_ON_FAILURE=true
CI_MODE=false
CI_RETRIES=3
```

**Usage**: Control test execution behavior.

---

## 🔧 How to Use

### In Tests
```javascript
// 1. Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test') });

// 2. Access in CONFIG object
const CONFIG = {
  baseURL: process.env.BASE_URL,
  testData: {
    budget: {
      name: process.env.TEST_BUDGET_NAME,
      amount: parseFloat(process.env.TEST_BUDGET_AMOUNT)
    }
  }
};

// 3. Use in tests
test('Create budget', async ({ page }) => {
  await nameInput.fill(CONFIG.testData.budget.name);
  await amountInput.fill(CONFIG.testData.budget.amount.toString());
});
```

### In Playwright Config
```javascript
// Load environment
require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });

module.exports = defineConfig({
  timeout: parseInt(process.env.DEFAULT_TIMEOUT),
  retries: parseInt(process.env.MAX_RETRIES),
  workers: parseInt(process.env.WORKERS),
  use: {
    baseURL: process.env.BASE_URL,
    viewport: { 
      width: parseInt(process.env.BROWSER_VIEWPORT_WIDTH), 
      height: parseInt(process.env.BROWSER_VIEWPORT_HEIGHT) 
    }
  }
});
```

---

## 🌍 Environment Management

### Creating Environment-Specific Files

#### Development
```bash
cp .env.test .env.test.dev
# Edit .env.test.dev
BASE_URL=http://localhost:3001
API_URL=http://localhost:5002
```

#### Staging
```bash
cp .env.test .env.test.staging
# Edit .env.test.staging
BASE_URL=https://staging.tradeai.com
API_URL=https://api-staging.tradeai.com
```

#### Production
```bash
cp .env.test .env.test.prod
# Edit .env.test.prod
BASE_URL=https://app.tradeai.com
API_URL=https://api.tradeai.com
```

### Using Different Environments
```bash
# Development (default)
npm run test:e2e

# Staging
export DOTENV_CONFIG_PATH=.env.test.staging
npm run test:e2e

# Production
export DOTENV_CONFIG_PATH=.env.test.prod
npm run test:e2e
```

---

## 🔒 Security Best Practices

### DO ✅
- **DO** commit `.env.test` (template with non-sensitive defaults)
- **DO** use environment-specific files for real credentials
- **DO** add environment-specific files to `.gitignore`
- **DO** document all variables
- **DO** use descriptive variable names

### DON'T ❌
- **DON'T** put real production credentials in `.env.test`
- **DON'T** commit `.env.test.prod` or `.env.test.staging`
- **DON'T** hardcode any values in test files
- **DON'T** share credentials in version control
- **DON'T** use production credentials in tests

### .gitignore Configuration
```bash
# Commit the template
!.env.test

# Never commit these
.env.test.dev
.env.test.staging
.env.test.prod
.env.test.local
```

---

## 📝 Adding New Configuration

### Step 1: Add to .env.test
```bash
# New Feature Configuration
TEST_NEW_FEATURE_NAME=Test Feature Name
TEST_NEW_FEATURE_VALUE=123
TEST_NEW_FEATURE_ENABLED=true
API_NEW_FEATURE_ENDPOINT=/api/new-feature
```

### Step 2: Update CONFIG Object
```javascript
const CONFIG = {
  // ... existing config ...
  testData: {
    // ... existing test data ...
    newFeature: {
      name: process.env.TEST_NEW_FEATURE_NAME,
      value: parseFloat(process.env.TEST_NEW_FEATURE_VALUE),
      enabled: process.env.TEST_NEW_FEATURE_ENABLED === 'true'
    }
  },
  endpoints: {
    // ... existing endpoints ...
    newFeature: process.env.API_NEW_FEATURE_ENDPOINT
  }
};
```

### Step 3: Use in Tests
```javascript
test('Test new feature', async ({ page }) => {
  if (CONFIG.testData.newFeature.enabled) {
    await page.goto(CONFIG.baseURL + CONFIG.endpoints.newFeature);
    await nameInput.fill(CONFIG.testData.newFeature.name);
  }
});
```

---

## 🧪 Variable Types & Parsing

### String Variables
```bash
TEST_NAME=My Test Name
```
```javascript
const name = process.env.TEST_NAME; // Direct use
```

### Number Variables
```bash
TEST_AMOUNT=100.50
```
```javascript
const amount = parseFloat(process.env.TEST_AMOUNT);
```

### Integer Variables
```bash
TEST_COUNT=10
```
```javascript
const count = parseInt(process.env.TEST_COUNT);
```

### Boolean Variables
```bash
TEST_ENABLED=true
```
```javascript
const enabled = process.env.TEST_ENABLED === 'true';
```

### Array Variables (JSON)
```bash
TEST_TAGS=["tag1","tag2","tag3"]
```
```javascript
const tags = JSON.parse(process.env.TEST_TAGS);
```

---

## 🔍 Debugging Configuration

### Check Loaded Values
```javascript
console.log('BASE_URL:', process.env.BASE_URL);
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
console.log('TEST_BUDGET_NAME:', process.env.TEST_BUDGET_NAME);
```

### Verify All Variables Loaded
```javascript
test.beforeAll(() => {
  const requiredVars = [
    'BASE_URL',
    'API_URL',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'TEST_BUDGET_NAME'
  ];
  
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    throw new Error('Required environment variables not loaded');
  }
});
```

---

## 📊 Variable Summary

| Category | Variables | Example |
|----------|-----------|---------|
| URLs | 2 | BASE_URL, API_URL |
| Timeouts | 4 | DEFAULT_TIMEOUT, etc. |
| Users | 16 | ADMIN_EMAIL, MANAGER_EMAIL, etc. |
| Test Data | 100+ | TEST_BUDGET_NAME, TEST_CUSTOMER_EMAIL, etc. |
| Viewports | 6 | MOBILE_WIDTH, DESKTOP_WIDTH, etc. |
| API Endpoints | 16 | API_BUDGETS_ENDPOINT, etc. |
| Search Terms | 3 | SEARCH_TERM_PRODUCT, etc. |
| Thresholds | 3 | PAGE_LOAD_THRESHOLD, etc. |
| Messages | 9 | ERROR_INVALID_CREDENTIALS, etc. |
| Execution | 7 | MAX_RETRIES, WORKERS, etc. |
| **TOTAL** | **180+** | **All aspects covered** |

---

## 🎓 Learning Resources

### Understanding dotenv
- Official: https://github.com/motdotla/dotenv
- Best Practices: https://12factor.net/config

### Environment Variables in Testing
- Playwright docs: https://playwright.dev/docs/test-configuration
- Test automation patterns: https://martinfowler.com/articles/practical-test-pyramid.html

---

## ✅ Checklist for New Team Members

- [ ] Read this guide completely
- [ ] Understand why we use environment variables
- [ ] Know where `.env.test` is located
- [ ] Understand the structure of `.env.test`
- [ ] Know how to add new variables
- [ ] Understand how to create environment-specific files
- [ ] Know security best practices
- [ ] Can debug configuration issues
- [ ] Never hardcode values in tests

---

## 🆘 Common Issues

### Issue: Environment variables not loading
**Solution**: 
```javascript
// Verify dotenv is configured
require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });
console.log('Loaded BASE_URL:', process.env.BASE_URL);
```

### Issue: Variables showing as undefined
**Solution**: 
- Check variable name spelling
- Verify `.env.test` file exists
- Ensure no spaces around `=` in `.env.test`
- Check file encoding (should be UTF-8)

### Issue: Numbers not working correctly
**Solution**: 
```javascript
// Always parse number variables
const amount = parseFloat(process.env.TEST_AMOUNT);
const count = parseInt(process.env.TEST_COUNT);
```

### Issue: Boolean values not working
**Solution**: 
```javascript
// String comparison required
const enabled = process.env.TEST_ENABLED === 'true';
// Not: process.env.TEST_ENABLED (returns string "true")
```

---

## 📈 Benefits Realized

### Before (Hardcoded)
- ❌ URLs hardcoded in 50+ places
- ❌ Credentials in source code
- ❌ Can't switch environments easily
- ❌ Security risks
- ❌ Difficult maintenance

### After (Environment-Driven)
- ✅ Single source of truth (`.env.test`)
- ✅ Zero hardcoded values
- ✅ Easy environment switching
- ✅ Secure credential management
- ✅ Easy maintenance and updates

---

## 📞 Support

For questions about `.env.test` configuration:
1. Read this guide
2. Check existing variable patterns
3. Review test file usage examples
4. Consult team documentation

---

**Last Updated**: October 7, 2025  
**Version**: 1.0.0  
**Total Variables**: 180+  
**Coverage**: 100% of test configuration  

---

**Remember**: ✅ **NEVER HARDCODE** - Always use `.env.test` configuration!
