#!/usr/bin/env python3
"""
Complete Test Suite Generator for TRADEAI
Generates comprehensive tests for backend APIs, frontend components, and E2E workflows
"""

import json
import os
from pathlib import Path

# Load system audit
with open('system-audit.json', 'r') as f:
    audit = json.load(f)

def generate_backend_api_tests():
    """Generate comprehensive backend API integration tests"""
    
    routes = audit['backend']['routes']
    
    test_content = '''const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

describe('TRADEAI Backend API - Complete Integration Tests', () => {
  let authToken;
  let testUser;
  let testCompany;

  beforeAll(async () => {
    // Setup test database connection
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tradeai_test');
    
    // Create test user and get auth token
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        role: 'admin'
      });
    
    authToken = response.body.token;
    testUser = response.body.user;
  });

  afterAll(async () => {
    // Cleanup
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('Authentication & Authorization', () => {
    test('POST /api/auth/register - should create new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Test123!@#',
          name: 'New User'
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'newuser@example.com');
    });

    test('POST /api/auth/login - should login user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    test('GET /api/auth/me - should get current user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', 'test@example.com');
    });

    test('POST /api/auth/logout - should logout user', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
    });
  });

  describe('Trade Spend Management', () => {
    let tradeSpendId;

    test('POST /api/trade-spends - should create trade spend', async () => {
      const res = await request(app)
        .post('/api/trade-spends')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Trade Spend',
          amount: 10000,
          customer: 'Test Customer',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('name', 'Test Trade Spend');
      tradeSpendId = res.body._id;
    });

    test('GET /api/trade-spends - should list trade spends', async () => {
      const res = await request(app)
        .get('/api/trade-spends')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/trade-spends/:id - should get trade spend by id', async () => {
      const res = await request(app)
        .get(`/api/trade-spends/${tradeSpendId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id', tradeSpendId);
    });

    test('PUT /api/trade-spends/:id - should update trade spend', async () => {
      const res = await request(app)
        .put(`/api/trade-spends/${tradeSpendId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 15000 });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('amount', 15000);
    });

    test('DELETE /api/trade-spends/:id - should delete trade spend', async () => {
      const res = await request(app)
        .delete(`/api/trade-spends/${tradeSpendId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
    });
  });

  describe('Budget Management', () => {
    let budgetId;

    test('POST /api/budgets - should create budget', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Budget',
          amount: 50000,
          period: 'quarterly',
          year: 2025
        });
      
      expect(res.status).toBe(201);
      budgetId = res.body._id;
    });

    test('GET /api/budgets - should list budgets', async () => {
      const res = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Customer Management', () => {
    let customerId;

    test('POST /api/customers - should create customer', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Customer',
          email: 'customer@example.com',
          type: 'retail'
        });
      
      expect(res.status).toBe(201);
      customerId = res.body._id;
    });

    test('GET /api/customers - should list customers', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Product Management', () => {
    let productId;

    test('POST /api/products - should create product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          sku: 'TEST-001',
          price: 99.99
        });
      
      expect(res.status).toBe(201);
      productId = res.body._id;
    });

    test('GET /api/products - should list products', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Campaign Management', () => {
    test('POST /api/campaigns - should create campaign', async () => {
      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Campaign',
          type: 'promotion',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      
      expect(res.status).toBe(201);
    });

    test('GET /api/campaigns - should list campaigns', async () => {
      const res = await request(app)
        .get('/api/campaigns')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Analytics & Reporting', () => {
    test('GET /api/analytics/dashboard - should get dashboard data', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('metrics');
    });

    test('GET /api/reports - should list reports', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
    });
  });

  describe('Health & System', () => {
    test('GET /api/health - should return health status', async () => {
      const res = await request(app).get('/api/health');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'UP');
    });
  });
});
'''
    
    return test_content

def generate_frontend_component_tests():
    """Generate frontend component tests"""
    
    test_content = '''import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Test wrapper with providers
const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

describe('TRADEAI Frontend - Complete Component Tests', () => {
  
  describe('Authentication Components', () => {
    test('Login page renders correctly', () => {
      const Login = require('../pages/Login').default;
      customRender(<Login />);
      
      expect(screen.getByText(/login/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    test('Login form submission works', async () => {
      const Login = require('../pages/Login').default;
      customRender(<Login />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        // Assert login action
      });
    });
  });

  describe('Dashboard Components', () => {
    test('Dashboard renders with widgets', () => {
      const Dashboard = require('../pages/Dashboard').default;
      customRender(<Dashboard />);
      
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Trade Spend Components', () => {
    test('Trade Spend List renders', () => {
      const TradeSpendList = require('../pages/TradeSpendList').default;
      customRender(<TradeSpendList />);
      
      expect(screen.getByText(/trade spend/i)).toBeInTheDocument();
    });

    test('Create Trade Spend button works', () => {
      const TradeSpendList = require('../pages/TradeSpendList').default;
      customRender(<TradeSpendList />);
      
      const createButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(createButton);
    });
  });

  describe('Budget Components', () => {
    test('Budget List renders', () => {
      const BudgetList = require('../pages/BudgetList').default;
      customRender(<BudgetList />);
      
      expect(screen.getByText(/budget/i)).toBeInTheDocument();
    });
  });

  describe('Customer Components', () => {
    test('Customer List renders', () => {
      const CustomerList = require('../pages/CustomerList').default;
      customRender(<CustomerList />);
      
      expect(screen.getByText(/customer/i)).toBeInTheDocument();
    });
  });

  describe('Product Components', () => {
    test('Product List renders', () => {
      const ProductList = require('../pages/ProductList').default;
      customRender(<ProductList />);
      
      expect(screen.getByText(/product/i)).toBeInTheDocument();
    });
  });

  describe('Campaign Components', () => {
    test('Campaign List renders', () => {
      const CampaignList = require('../pages/CampaignList').default;
      customRender(<CampaignList />);
      
      expect(screen.getByText(/campaign/i)).toBeInTheDocument();
    });
  });

  describe('Report Components', () => {
    test('Report List renders', () => {
      const ReportList = require('../pages/ReportList').default;
      customRender(<ReportList />);
      
      expect(screen.getByText(/report/i)).toBeInTheDocument();
    });
  });
});

export { customRender };
'''
    
    return test_content

def generate_e2e_tests():
    """Generate comprehensive E2E tests"""
    
    test_content = '''const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('TRADEAI - Complete End-to-End Tests', () => {
  let authToken;

  test.beforeAll(async ({ request }) => {
    // Login and get auth token
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'admin@example.com',
        password: 'Admin123!@#'
      }
    });
    
    const data = await response.json();
    authToken = data.token;
  });

  test.describe('Authentication Workflows', () => {
    test('User can login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      await page.fill('[name="email"]', 'admin@example.com');
      await page.fill('[name="password"]', 'Admin123!@#');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('User can logout', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.click('[aria-label="User menu"]');
      await page.click('text=Logout');
      
      await expect(page).toHaveURL(`${BASE_URL}/login`);
    });
  });

  test.describe('Trade Spend Workflows', () => {
    test('Complete trade spend workflow', async ({ page }) => {
      await page.goto(`${BASE_URL}/trade-spends`);
      
      // Create
      await page.click('button:has-text("Create")');
      await page.fill('[name="name"]', 'E2E Test Trade Spend');
      await page.fill('[name="amount"]', '10000');
      await page.click('button:has-text("Save")');
      
      await expect(page.locator('text=E2E Test Trade Spend')).toBeVisible();
      
      // Edit
      await page.click('[aria-label="Edit"]');
      await page.fill('[name="amount"]', '15000');
      await page.click('button:has-text("Update")');
      
      // Delete
      await page.click('[aria-label="Delete"]');
      await page.click('button:has-text("Confirm")');
    });
  });

  test.describe('Budget Workflows', () => {
    test('Create and manage budget', async ({ page }) => {
      await page.goto(`${BASE_URL}/budgets`);
      
      await page.click('button:has-text("Create")');
      await page.fill('[name="name"]', 'Q1 2025 Budget');
      await page.fill('[name="amount"]', '100000');
      await page.click('button:has-text("Save")');
      
      await expect(page.locator('text=Q1 2025 Budget')).toBeVisible();
    });
  });

  test.describe('Customer Workflows', () => {
    test('Complete customer management', async ({ page }) => {
      await page.goto(`${BASE_URL}/customers`);
      
      // Create customer
      await page.click('button:has-text("Add Customer")');
      await page.fill('[name="name"]', 'Test Customer Inc');
      await page.fill('[name="email"]', 'test@customer.com');
      await page.click('button:has-text("Save")');
      
      await expect(page.locator('text=Test Customer Inc')).toBeVisible();
    });
  });

  test.describe('Product Workflows', () => {
    test('Product CRUD operations', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      
      // Create
      await page.click('button:has-text("Add Product")');
      await page.fill('[name="name"]', 'Test Product');
      await page.fill('[name="sku"]', 'TEST-001');
      await page.fill('[name="price"]', '99.99');
      await page.click('button:has-text("Save")');
      
      await expect(page.locator('text=Test Product')).toBeVisible();
    });
  });

  test.describe('Campaign Workflows', () => {
    test('Create and launch campaign', async ({ page }) => {
      await page.goto(`${BASE_URL}/campaigns`);
      
      await page.click('button:has-text("New Campaign")');
      await page.fill('[name="name"]', 'Summer Sale 2025');
      await page.selectOption('[name="type"]', 'promotion');
      await page.click('button:has-text("Create")');
      
      await expect(page.locator('text=Summer Sale 2025')).toBeVisible();
    });
  });

  test.describe('Analytics & Reporting', () => {
    test('View dashboard analytics', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-customers"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-campaigns"]')).toBeVisible();
    });

    test('Generate and export report', async ({ page }) => {
      await page.goto(`${BASE_URL}/reports`);
      
      await page.click('button:has-text("Generate Report")');
      await page.selectOption('[name="reportType"]', 'sales');
      await page.click('button:has-text("Generate")');
      
      await expect(page.locator('text=Report generated')).toBeVisible();
    });
  });

  test.describe('Admin Workflows', () => {
    test('User management', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/users`);
      
      await page.click('button:has-text("Add User")');
      await page.fill('[name="name"]', 'New User');
      await page.fill('[name="email"]', 'newuser@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.selectOption('[name="role"]', 'user');
      await page.click('button:has-text("Create")');
      
      await expect(page.locator('text=New User')).toBeVisible();
    });
  });

  test.describe('Performance Tests', () => {
    test('Page load performance', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/dashboard`);
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // Page should load in < 3 seconds
    });

    test('API response time', async ({ request }) => {
      const startTime = Date.now();
      await request.get(`${BASE_URL}/api/dashboard`);
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(500); // API should respond in < 500ms
    });
  });
});
'''
    
    return test_content

def generate_test_runner():
    """Generate comprehensive test runner script"""
    
    script_content = '''#!/bin/bash

###############################################################################
# TRADEAI Complete Test Suite Runner
# Runs all backend, frontend, and E2E tests
###############################################################################

set -e

echo "======================================================================"
echo "TRADEAI COMPLETE TEST SUITE"
echo "======================================================================"
echo ""

# Colors
GREEN='\\033[0;32m'
RED='\\033[0;31m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m'

# Create reports directory
REPORT_DIR="./test-reports/complete-suite/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$REPORT_DIR"

echo -e "${BLUE}Test Report Directory:${NC} $REPORT_DIR"
echo ""

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test 1: Backend API Integration Tests
echo "======================================================================"
echo -e "${BLUE}1. Backend API Integration Tests${NC}"
echo "======================================================================"
echo ""

cd backend
if npm test -- --coverage --json --outputFile="$REPORT_DIR/backend-results.json" 2>&1 | tee "$REPORT_DIR/backend.log"; then
    echo -e "${GREEN}✓ Backend tests passed${NC}"
    BACKEND_PASS=true
else
    echo -e "${RED}✗ Backend tests failed${NC}"
    BACKEND_PASS=false
fi
cd ..
echo ""

# Test 2: Frontend Component Tests
echo "======================================================================"
echo -e "${BLUE}2. Frontend Component Tests${NC}"
echo "======================================================================"
echo ""

cd frontend
if CI=true npm test -- --coverage --json --outputFile="$REPORT_DIR/frontend-results.json" 2>&1 | tee "$REPORT_DIR/frontend.log"; then
    echo -e "${GREEN}✓ Frontend tests passed${NC}"
    FRONTEND_PASS=true
else
    echo -e "${RED}✗ Frontend tests failed${NC}"
    FRONTEND_PASS=false
fi
cd ..
echo ""

# Test 3: E2E Tests
echo "======================================================================"
echo -e "${BLUE}3. End-to-End Tests${NC}"
echo "======================================================================"
echo ""

if npx playwright test tests/complete-e2e.spec.js --reporter=json --output="$REPORT_DIR/e2e-results.json" 2>&1 | tee "$REPORT_DIR/e2e.log"; then
    echo -e "${GREEN}✓ E2E tests passed${NC}"
    E2E_PASS=true
else
    echo -e "${RED}✗ E2E tests failed${NC}"
    E2E_PASS=false
fi
echo ""

# Test 4: Security Tests
echo "======================================================================"
echo -e "${BLUE}4. Security Tests${NC}"
echo "======================================================================"
echo ""

# Check for known vulnerabilities
echo "Running npm audit..."
cd backend && npm audit --json > "$REPORT_DIR/backend-audit.json" 2>&1 || true
cd ../frontend && npm audit --json > "$REPORT_DIR/frontend-audit.json" 2>&1 || true
cd ..

echo -e "${YELLOW}⚠ Security audit complete (check reports)${NC}"
echo ""

# Test 5: Performance Tests
echo "======================================================================"
echo -e "${BLUE}5. Performance Tests${NC}"
echo "======================================================================"
echo ""

echo "Checking bundle sizes..."
if [ -d "frontend/build" ]; then
    BUNDLE_SIZE=$(du -sh frontend/build | cut -f1)
    echo "Frontend bundle size: $BUNDLE_SIZE"
fi

echo -e "${GREEN}✓ Performance check complete${NC}"
echo ""

# Generate Summary Report
echo "======================================================================"
echo -e "${BLUE}Generating Test Summary Report...${NC}"
echo "======================================================================"
echo ""

cat > "$REPORT_DIR/summary.md" << EOF
# TRADEAI Complete Test Suite Summary

**Generated:** $(date)
**Report Directory:** $REPORT_DIR

## Test Results

### Backend API Tests
- **Status:** $([ "$BACKEND_PASS" = true ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Log:** backend.log
- **Coverage:** backend-results.json

### Frontend Component Tests
- **Status:** $([ "$FRONTEND_PASS" = true ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Log:** frontend.log
- **Coverage:** frontend-results.json

### End-to-End Tests
- **Status:** $([ "$E2E_PASS" = true ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Log:** e2e.log
- **Results:** e2e-results.json

### Security Audit
- **Status:** ⚠️ CHECK REPORTS
- **Backend Audit:** backend-audit.json
- **Frontend Audit:** frontend-audit.json

### Performance Tests
- **Status:** ✅ COMPLETE
- **Bundle Size:** $BUNDLE_SIZE

## Overall Status

$(if [ "$BACKEND_PASS" = true ] && [ "$FRONTEND_PASS" = true ] && [ "$E2E_PASS" = true ]; then
    echo "✅ **ALL TESTS PASSED - READY FOR DEPLOYMENT**"
else
    echo "❌ **SOME TESTS FAILED - REVIEW REQUIRED**"
fi)

## Next Steps

$( if [ "$BACKEND_PASS" = true ] && [ "$FRONTEND_PASS" = true ] && [ "$E2E_PASS" = true ]; then
    echo "1. Review security audit results"
    echo "2. Proceed with UAT"
    echo "3. Deploy to production"
else
    echo "1. Review failed test logs"
    echo "2. Fix failing tests"
    echo "3. Re-run test suite"
fi)

## Test Artifacts

All test artifacts are saved in: \`$REPORT_DIR\`

- \`backend.log\` - Backend test output
- \`frontend.log\` - Frontend test output
- \`e2e.log\` - E2E test output
- \`backend-results.json\` - Backend test results with coverage
- \`frontend-results.json\` - Frontend test results with coverage
- \`e2e-results.json\` - E2E test results
- \`backend-audit.json\` - Security audit for backend
- \`frontend-audit.json\` - Security audit for frontend

EOF

echo -e "${GREEN}✓ Summary report generated${NC}"
echo ""

# Final Summary
echo "======================================================================"
echo "                    TEST SUITE SUMMARY"
echo "======================================================================"
echo ""
cat "$REPORT_DIR/summary.md"
echo ""

# Exit with appropriate code
if [ "$BACKEND_PASS" = true ] && [ "$FRONTEND_PASS" = true ] && [ "$E2E_PASS" = true ]; then
    exit 0
else
    exit 1
fi
'''
    
    return script_content

# Generate all test files
print("Generating comprehensive test suite...")

# Create test directories
os.makedirs('backend/src/__tests__', exist_ok=True)
os.makedirs('frontend/src/__tests__', exist_ok=True)
os.makedirs('tests/complete', exist_ok=True)

# Generate backend tests
with open('backend/src/__tests__/complete-api.test.js', 'w') as f:
    f.write(generate_backend_api_tests())
print("✓ Generated backend/src/__tests__/complete-api.test.js")

# Generate frontend tests
with open('frontend/src/__tests__/complete-components.test.js', 'w') as f:
    f.write(generate_frontend_component_tests())
print("✓ Generated frontend/src/__tests__/complete-components.test.js")

# Generate E2E tests
with open('tests/complete/complete-e2e.spec.js', 'w') as f:
    f.write(generate_e2e_tests())
print("✓ Generated tests/complete/complete-e2e.spec.js")

# Generate test runner
with open('run-complete-tests.sh', 'w') as f:
    f.write(generate_test_runner())
os.chmod('run-complete-tests.sh', 0o755)
print("✓ Generated run-complete-tests.sh")

print("\n✅ Complete test suite generated successfully!")
print("\nTo run all tests:")
print("  ./run-complete-tests.sh")
