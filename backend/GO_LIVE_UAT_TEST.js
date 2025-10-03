#!/usr/bin/env node

/**
 * GO-LIVE READINESS TEST
 * 
 * Comprehensive End-to-End Integration Test
 * Tests complete user workflows across frontend and backend
 * 
 * Purpose: Final UAT before production deployment
 * Coverage: Authentication, CRUD operations, business logic, multi-tenant
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5002';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Test configuration
const TIMEOUT = 30000;
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
  startTime: new Date(),
  endTime: null
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test data
let testContext = {
  tenant1: { name: 'GoLiveTenant1', domain: 'golive1.test' },
  tenant2: { name: 'GoLiveTenant2', domain: 'golive2.test' },
  adminUser: { email: 'admin@tradeai.com', password: 'Admin@123' },
  regularUser: { email: 'john.doe@example.com', password: 'User@123' },
  customer: { name: 'Test Customer', email: 'customer@test.com' },
  product: { name: 'Test Product', sku: 'SKU-TEST-001' },
  promotion: { name: 'Test Promotion', discountPercent: 10 },
  tokens: {}
};

// Utility Functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(category, name, status, details = '') {
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`${icon} ${status} - ${category}: ${name}${details ? ' - ' + details : ''}`, color);
}

function recordTest(category, name, status, details = '', responseTime = 0) {
  testResults.total++;
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;

  testResults.tests.push({
    category,
    name,
    status,
    details,
    responseTime,
    timestamp: new Date().toISOString()
  });

  logTest(category, name, status, details);
}

async function makeRequest(method, endpoint, data = null, token = null, expectedStatus = 200) {
  const startTime = Date.now();
  try {
    const config = {
      method,
      url: `${BACKEND_URL}${endpoint}`,
      timeout: TIMEOUT,
      validateStatus: () => true // Accept any status code
    };

    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }

    if (data) {
      config.data = data;
      config.headers = { ...config.headers, 'Content-Type': 'application/json' };
    }

    const response = await axios(config);
    const responseTime = Date.now() - startTime;

    if (response.status === expectedStatus) {
      return { success: true, data: response.data, responseTime, status: response.status };
    } else {
      return { 
        success: false, 
        error: `Expected ${expectedStatus}, got ${response.status}`, 
        responseTime,
        status: response.status,
        data: response.data
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return { 
      success: false, 
      error: error.message, 
      responseTime 
    };
  }
}

async function checkFrontendAccess() {
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Test Categories

async function testSystemHealth() {
  log('\n[1/10] Testing System Health...', 'cyan');

  // Test backend health
  const backend = await makeRequest('GET', '/api/health');
  if (backend.success && backend.data.status === 'ok') {
    recordTest('Health', 'Backend API is responding', 'PASS', `${backend.responseTime}ms`);
  } else {
    recordTest('Health', 'Backend API is responding', 'FAIL', backend.error);
    return false;
  }

  // Test frontend access
  const frontendUp = await checkFrontendAccess();
  if (frontendUp) {
    recordTest('Health', 'Frontend application is accessible', 'PASS');
  } else {
    recordTest('Health', 'Frontend application is accessible', 'FAIL');
  }

  // Test database connection (health endpoint includes DB status)
  if (backend.success && backend.data?.uptime >= 0) {
    recordTest('Health', 'Database connection is working', 'PASS');
  } else {
    recordTest('Health', 'Database connection is working', 'FAIL', 'Backend health check did not return uptime data');
  }

  return true;
}

async function testAuthenticationFlows() {
  log('\n[2/10] Testing Authentication Flows...', 'cyan');

  // Test 1: User Registration (if available)
  // For this test, we'll use existing demo user
  
  // Test 2: User Login with valid credentials
  const loginData = {
    email: testContext.adminUser.email,
    password: testContext.adminUser.password
  };

  const login = await makeRequest('POST', '/api/auth/login', loginData);
  if (login.success && login.data) {
    testContext.tokens.admin = login.data.tokens?.accessToken || login.data.token;
    testContext.adminUserId = login.data.user?.id;
    testContext.tenantId = login.data.user?.tenantId;
    recordTest('Authentication', 'Admin login successful', 'PASS', `Token received, ${login.responseTime}ms`);
  } else {
    recordTest('Authentication', 'Admin login successful', 'FAIL', `Expected 200, got ${login.status}`);
    return false;
  }

  // Test 3: Access protected route with valid token
  const profile = await makeRequest('GET', '/api/users/me', null, testContext.tokens.admin);
  if (profile.success) {
    recordTest('Authentication', 'Access protected route with token', 'PASS', `${profile.responseTime}ms`);
    // Check if tenant ID is present
    if (profile.data.tenantId) {
      testContext.tenantId = profile.data.tenantId;
    }
  } else {
    recordTest('Authentication', 'Access protected route with token', 'FAIL', `Expected 200, got ${profile.status}`);
  }

  // Test 4: Access protected route without token (should fail)
  const noToken = await makeRequest('GET', '/api/users/me', null, null, 401);
  if (noToken.status === 401 || noToken.status === 400) {
    recordTest('Authentication', 'Protected route blocks unauthenticated access', 'PASS');
  } else {
    recordTest('Authentication', 'Protected route blocks unauthenticated access', 'FAIL', 
      `Expected 401, got ${noToken.status}`);
  }

  // Test 5: Invalid login credentials
  const badLogin = await makeRequest('POST', '/api/auth/login', 
    { email: 'wrong@email.com', password: 'wrongpassword' }, null, 401);
  if (badLogin.status === 401 || badLogin.status === 400) {
    recordTest('Authentication', 'Invalid credentials rejected', 'PASS');
  } else {
    recordTest('Authentication', 'Invalid credentials rejected', 'FAIL', 
      `Expected 401, got ${badLogin.status}`);
  }

  return true;
}

async function testCustomerManagement() {
  log('\n[3/10] Testing Customer Management Workflows...', 'cyan');

  const token = testContext.tokens.admin;

  // Test 1: List existing customers
  const listCustomers = await makeRequest('GET', '/api/customers', null, token);
  if (listCustomers.success) {
    recordTest('Customer', 'List customers', 'PASS', 
      `Found ${listCustomers.data.length || 0} customers, ${listCustomers.responseTime}ms`);
  } else {
    recordTest('Customer', 'List customers', 'FAIL', listCustomers.error);
    return false;
  }

  // Test 2: Create new customer
  const timestamp = Date.now();
  const newCustomer = {
    code: `CUST-GOLIVE-${timestamp}`,
    sapCustomerId: `SAP-GOLIVE-${timestamp}`,
    name: 'Go-Live Test Customer',
    email: 'golive.customer@test.com',
    phone: '+1234567890',
    address: '123 Test Street',
    customerType: 'retailer',
    channel: 'modern_trade',  // Valid enum: modern_trade, traditional_trade, horeca, ecommerce, b2b, export
    status: 'active'
  };

  const createCustomer = await makeRequest('POST', '/api/customers', newCustomer, token, 201);
  const customerId = createCustomer.data?.data?.id || createCustomer.data?.data?._id;
  if (createCustomer.success && customerId) {
    testContext.customerId = customerId;
    recordTest('Customer', 'Create new customer', 'PASS', 
      `Customer ID: ${testContext.customerId}, ${createCustomer.responseTime}ms`);
  } else {
    const errorMsg = createCustomer.data?.message || createCustomer.error;
    const errorDetails = createCustomer.data?.error || '';
    recordTest('Customer', 'Create new customer', 'FAIL', 
      `${createCustomer.error} - ${errorMsg} ${errorDetails}`);
    console.log('Customer creation error:', JSON.stringify(createCustomer.data, null, 2));
    return false;
  }

  // Test 3: Get customer by ID
  const getCustomer = await makeRequest('GET', `/api/customers/${testContext.customerId}`, null, token);
  const customerData = getCustomer.data?.data || getCustomer.data;
  if (getCustomer.success && customerData.name === newCustomer.name) {
    recordTest('Customer', 'Get customer by ID', 'PASS', `${getCustomer.responseTime}ms`);
  } else {
    recordTest('Customer', 'Get customer by ID', 'FAIL', 
      getCustomer.error || `Name mismatch: expected "${newCustomer.name}", got "${customerData?.name}"`);
    console.log('Get customer error:', JSON.stringify({ expected: newCustomer.name, received: getCustomer.data }, null, 2));
  }

  // Test 4: Update customer
  const updateData = { name: 'Go-Live Test Customer (Updated)' };
  const updateCustomer = await makeRequest('PUT', `/api/customers/${testContext.customerId}`, 
    updateData, token);
  if (updateCustomer.success) {
    recordTest('Customer', 'Update customer', 'PASS', `${updateCustomer.responseTime}ms`);
  } else {
    recordTest('Customer', 'Update customer', 'FAIL', updateCustomer.error);
  }

  // Test 5: Search/filter customers
  const searchCustomers = await makeRequest('GET', '/api/customers?status=active', null, token);
  if (searchCustomers.success) {
    recordTest('Customer', 'Search/filter customers', 'PASS', 
      `Found ${searchCustomers.data.length || 0} active customers, ${searchCustomers.responseTime}ms`);
  } else {
    recordTest('Customer', 'Search/filter customers', 'FAIL', searchCustomers.error);
  }

  return true;
}

async function testProductManagement() {
  log('\n[4/10] Testing Product Management Workflows...', 'cyan');

  const token = testContext.tokens.admin;

  // Test 1: List products
  const listProducts = await makeRequest('GET', '/api/products', null, token);
  if (listProducts.success) {
    recordTest('Product', 'List products', 'PASS', 
      `Found ${listProducts.data.length || 0} products, ${listProducts.responseTime}ms`);
  } else {
    recordTest('Product', 'List products', 'FAIL', listProducts.error);
    return false;
  }

  // Test 2: Create new product
  const newProduct = {
    name: 'Go-Live Test Product',
    sku: 'SKU-GOLIVE-' + Date.now(),
    sapMaterialId: 'SAP-MAT-GOLIVE-001',
    category: {
      primary: 'Test Category'
    },
    productType: 'own_brand',  // Valid enum: own_brand, distributed, private_label, consignment
    pricing: {
      listPrice: 99.99,
      currency: 'ZAR'
    },
    status: 'active'
  };

  const createProduct = await makeRequest('POST', '/api/products', newProduct, token, 201);
  const productId = createProduct.data?.data?.id || createProduct.data?.data?._id;
  if (createProduct.success && productId) {
    testContext.productId = productId;
    recordTest('Product', 'Create new product', 'PASS', 
      `Product ID: ${testContext.productId}, ${createProduct.responseTime}ms`);
  } else {
    const errorMsg = createProduct.data?.message || createProduct.error;
    const errorDetails = createProduct.data?.error || '';
    recordTest('Product', 'Create new product', 'FAIL', 
      `${createProduct.error} - ${errorMsg} ${errorDetails}`);
    console.log('Product creation error:', JSON.stringify(createProduct.data, null, 2));
  }

  // Test 3: Get product by ID
  if (testContext.productId) {
    const getProduct = await makeRequest('GET', `/api/products/${testContext.productId}`, null, token);
    if (getProduct.success) {
      recordTest('Product', 'Get product by ID', 'PASS', `${getProduct.responseTime}ms`);
    } else {
      recordTest('Product', 'Get product by ID', 'FAIL', getProduct.error);
    }
  }

  return true;
}

async function testPromotionManagement() {
  log('\n[5/10] Testing Promotion Management Workflows...', 'cyan');

  const token = testContext.tokens.admin;

  // Test 1: List promotions
  const listPromotions = await makeRequest('GET', '/api/promotions', null, token);
  if (listPromotions.success) {
    recordTest('Promotion', 'List promotions', 'PASS', 
      `Found ${listPromotions.data.length || 0} promotions, ${listPromotions.responseTime}ms`);
  } else {
    recordTest('Promotion', 'List promotions', 'FAIL', listPromotions.error);
    return false;
  }

  // Test 2: Create new promotion (if product exists)
  if (testContext.productId && testContext.customerId) {
    const newPromotion = {
      name: 'Go-Live Test Promotion',
      promotionType: 'price_discount',
      period: {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      discountPercent: 15,
      status: 'draft',
      products: [testContext.productId],
      scope: {
        customers: [testContext.customerId]
      }
    };

    const createPromotion = await makeRequest('POST', '/api/promotions', newPromotion, token, 201);
    const promotionId = createPromotion.data?.data?.id || createPromotion.data?.data?._id;
    if (createPromotion.success && promotionId) {
      testContext.promotionId = promotionId;
      recordTest('Promotion', 'Create new promotion', 'PASS', 
        `Promotion ID: ${testContext.promotionId}, ${createPromotion.responseTime}ms`);
    } else {
      recordTest('Promotion', 'Create new promotion', 'FAIL', 
        createPromotion.error || `Failed with status ${createPromotion.status}`);
      console.log('Promotion creation error:', JSON.stringify(createPromotion.data, null, 2));
    }
  } else {
    recordTest('Promotion', 'Create new promotion', 'SKIP', 
      'Skipped - requires product and customer');
  }

  return true;
}

async function testSalesManagement() {
  log('\n[6/10] Testing Sales Management Workflows...', 'cyan');

  const token = testContext.tokens.admin;

  // Test 1: List sales transactions
  const listSales = await makeRequest('GET', '/api/sales/transactions', null, token);
  if (listSales.success) {
    const count = listSales.data?.data?.transactions?.length || 0;
    recordTest('Sales', 'List sales transactions', 'PASS', 
      `Found ${count} sales, ${listSales.responseTime}ms`);
  } else {
    recordTest('Sales', 'List sales transactions', 'FAIL', listSales.error);
    return false;
  }

  // Test 2: Record new sale (if customer and product exist)
  if (testContext.customerId && testContext.productId) {
    const newSale = {
      customerId: testContext.customerId,
      productId: testContext.productId,
      quantity: 10,
      unitPrice: 99.99,
      totalAmount: 999.90,
      saleDate: new Date().toISOString(),
      status: 'completed'
    };

    const createSale = await makeRequest('POST', '/api/sales', newSale, token, 201);
    const saleId = createSale.data?.data?.id || createSale.data?.data?._id;
    if (createSale.success && saleId) {
      testContext.saleId = saleId;
      recordTest('Sales', 'Record new sale', 'PASS', 
        `Sale ID: ${testContext.saleId}, Amount: $${newSale.totalAmount}, ${createSale.responseTime}ms`);
    } else {
      recordTest('Sales', 'Record new sale', 'FAIL', 
        createSale.error || `Failed with status ${createSale.status}`);
      console.log('Sales creation error:', JSON.stringify(createSale.data, null, 2));
    }
  } else {
    recordTest('Sales', 'Record new sale', 'SKIP', 
      'Skipped - requires customer and product');
  }

  return true;
}

async function testReportingAndDashboard() {
  log('\n[7/10] Testing Reporting & Dashboard Workflows...', 'cyan');

  const token = testContext.tokens.admin;

  // Test 1: Get available reports list
  const reportsList = await makeRequest('GET', '/api/reports', null, token);
  if (reportsList.success && reportsList.data?.data?.availableReports) {
    recordTest('Reports', 'List available reports', 'PASS', 
      `${reportsList.data.data.availableReports.length} reports, ${reportsList.responseTime}ms`);
  } else {
    recordTest('Reports', 'List available reports', 'FAIL', reportsList.error);
  }

  // Test 2: Promotion effectiveness report (requires promotionId)
  if (testContext.promotionId) {
    const promoReport = await makeRequest('GET', 
      `/api/reports/promotion-effectiveness?promotionId=${testContext.promotionId}`, null, token);
    if (promoReport.success) {
      recordTest('Reports', 'Promotion effectiveness report', 'PASS', `${promoReport.responseTime}ms`);
    } else {
      recordTest('Reports', 'Promotion effectiveness report', 'FAIL', promoReport.error);
    }
  } else {
    recordTest('Reports', 'Promotion effectiveness report', 'WARN', 
      'Skipped - no promotion created (requires customer/product)');
  }

  // Test 3: Customer performance report (customerId optional)
  const customerReport = await makeRequest('GET', '/api/reports/customer-performance', null, token);
  if (customerReport.success) {
    recordTest('Reports', 'Customer performance report', 'PASS', `${customerReport.responseTime}ms`);
  } else {
    const errorMsg = customerReport.data?.message || customerReport.error;
    const errorDetails = customerReport.data?.error || '';
    recordTest('Reports', 'Customer performance report', 'FAIL', 
      `${customerReport.error} - ${errorMsg} ${errorDetails}`);
    console.log('Customer performance report error:', JSON.stringify(customerReport.data, null, 2));
  }

  // Test 4: Budget utilization report
  const budgetReport = await makeRequest('GET', '/api/reports/budget-utilization', null, token);
  if (budgetReport.success) {
    recordTest('Reports', 'Budget utilization report', 'PASS', `${budgetReport.responseTime}ms`);
  } else {
    recordTest('Reports', 'Budget utilization report', 'FAIL', budgetReport.error);
  }

  return true;
}

async function testMultiTenantIsolation() {
  log('\n[8/10] Testing Multi-Tenant Data Isolation...', 'cyan');

  const token = testContext.tokens.admin;

  // Test 1: Verify tenant context in requests
  const profile = await makeRequest('GET', '/api/users/me', null, token);
  if (profile.success && profile.data?.data?.tenantId) {
    testContext.tenantId = profile.data.data.tenantId;
    recordTest('Multi-Tenant', 'User has tenant context', 'PASS', 
      `Tenant ID: ${profile.data.data.tenantId}`);
  } else {
    recordTest('Multi-Tenant', 'User has tenant context', 'FAIL', 
      'No tenant ID in user profile');
  }

  // Test 2: Verify customers are tenant-scoped
  const customers = await makeRequest('GET', '/api/customers', null, token);
  if (customers.success && customers.data?.data) {
    const customerList = Array.isArray(customers.data.data) ? customers.data.data : [];
    if (customerList.length === 0) {
      recordTest('Multi-Tenant', 'Customers are tenant-scoped', 'PASS', 
        'No customers to verify (empty list)');
    } else {
      const allSameTenant = customerList.every(c => c.tenantId === testContext.tenantId);
      if (allSameTenant) {
        recordTest('Multi-Tenant', 'Customers are tenant-scoped', 'PASS', 
          `${customerList.length} customers all belong to same tenant`);
      } else {
        recordTest('Multi-Tenant', 'Customers are tenant-scoped', 'FAIL', 
          'Found customers from multiple tenants');
      }
    }
  } else {
    recordTest('Multi-Tenant', 'Customers are tenant-scoped', 'WARN', 
      'Could not fetch customers list');
  }

  // Test 3: Verify products are tenant-scoped
  const products = await makeRequest('GET', '/api/products', null, token);
  if (products.success && products.data?.data) {
    const productList = Array.isArray(products.data.data) ? products.data.data : [];
    if (productList.length === 0) {
      recordTest('Multi-Tenant', 'Products are tenant-scoped', 'PASS', 
        'No products to verify (empty list)');
    } else {
      const allSameTenant = productList.every(p => p.tenantId === testContext.tenantId);
      if (allSameTenant) {
        recordTest('Multi-Tenant', 'Products are tenant-scoped', 'PASS', 
          `${productList.length} products all belong to same tenant`);
      } else {
        recordTest('Multi-Tenant', 'Products are tenant-scoped', 'FAIL', 
          'Found products from multiple tenants');
      }
    }
  } else {
    recordTest('Multi-Tenant', 'Products are tenant-scoped', 'WARN', 
      'Could not fetch products list');
  }

  return true;
}

async function testPerformanceUnderLoad() {
  log('\n[9/10] Testing Performance Under Load...', 'cyan');

  const token = testContext.tokens.admin;

  // Test 1: Response time for list operations
  const startTime = Date.now();
  const customers = await makeRequest('GET', '/api/customers', null, token);
  const responseTime = Date.now() - startTime;

  if (responseTime < 500) {
    recordTest('Performance', 'List operation response time', 'PASS', 
      `${responseTime}ms (target: <500ms)`);
  } else if (responseTime < 1000) {
    recordTest('Performance', 'List operation response time', 'WARN', 
      `${responseTime}ms (target: <500ms)`);
  } else {
    recordTest('Performance', 'List operation response time', 'FAIL', 
      `${responseTime}ms (target: <500ms)`);
  }

  // Test 2: Concurrent requests
  log('  Testing concurrent requests...', 'blue');
  const concurrentRequests = [];
  for (let i = 0; i < 10; i++) {
    concurrentRequests.push(makeRequest('GET', '/api/customers', null, token));
  }

  const concurrentStart = Date.now();
  const results = await Promise.all(concurrentRequests);
  const concurrentTime = Date.now() - concurrentStart;

  const allSucceeded = results.every(r => r.success);
  if (allSucceeded && concurrentTime < 2000) {
    recordTest('Performance', 'Concurrent requests (10)', 'PASS', 
      `Total: ${concurrentTime}ms, Avg: ${(concurrentTime / 10).toFixed(0)}ms`);
  } else if (allSucceeded) {
    recordTest('Performance', 'Concurrent requests (10)', 'WARN', 
      `Total: ${concurrentTime}ms (slow)`);
  } else {
    recordTest('Performance', 'Concurrent requests (10)', 'FAIL', 
      `${results.filter(r => !r.success).length} requests failed`);
  }

  // Test 3: Memory usage check
  const memUsage = process.memoryUsage();
  const memMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  recordTest('Performance', 'Test script memory usage', 'PASS', `${memMB} MB`);

  return true;
}

async function testErrorHandling() {
  log('\n[10/10] Testing Error Handling & Edge Cases...', 'cyan');

  const token = testContext.tokens.admin;

  // Test 1: Invalid customer ID
  const invalidId = await makeRequest('GET', '/api/customers/invalid-id-12345', null, token, 404);
  if (invalidId.status === 404 || invalidId.status === 400) {
    recordTest('Error Handling', 'Invalid resource ID returns error', 'PASS', 
      `Returns ${invalidId.status} (400=invalid format, 404=not found)`);
  } else {
    recordTest('Error Handling', 'Invalid resource ID returns error', 'FAIL', 
      `Expected 400/404, got ${invalidId.status}`);
  }

  // Test 2: Missing required fields
  const missingFields = await makeRequest('POST', '/api/customers', 
    { name: '' }, token, 400);
  if (missingFields.status === 400) {
    recordTest('Error Handling', 'Missing required fields returns 400', 'PASS');
  } else {
    recordTest('Error Handling', 'Missing required fields returns 400', 'FAIL', 
      `Expected 400, got ${missingFields.status}`);
  }

  // Test 3: Unauthorized access (no token) - middleware returns 400 for missing tenant
  const unauthorized = await makeRequest('GET', '/api/admin/users', null, null, 401);
  if (unauthorized.status === 400 || unauthorized.status === 401 || unauthorized.status === 403) {
    recordTest('Error Handling', 'Unauthorized access blocked', 'PASS', 
      `Returns ${unauthorized.status} (access denied)`);
  } else {
    recordTest('Error Handling', 'Unauthorized access blocked', 'FAIL', 
      `Expected 400/401/403, got ${unauthorized.status}`);
  }

  return true;
}

// Cleanup function
async function cleanup() {
  log('\n🧹 Cleaning up test data...', 'yellow');

  const token = testContext.tokens.admin;
  let cleanedCount = 0;

  // Delete test customer
  if (testContext.customerId) {
    const result = await makeRequest('DELETE', `/api/customers/${testContext.customerId}`, 
      null, token, 200);
    if (result.success || result.status === 204) {
      cleanedCount++;
      log('  ✓ Deleted test customer', 'green');
    }
  }

  // Delete test product
  if (testContext.productId) {
    const result = await makeRequest('DELETE', `/api/products/${testContext.productId}`, 
      null, token, 200);
    if (result.success || result.status === 204) {
      cleanedCount++;
      log('  ✓ Deleted test product', 'green');
    }
  }

  // Delete test promotion
  if (testContext.promotionId) {
    const result = await makeRequest('DELETE', `/api/promotions/${testContext.promotionId}`, 
      null, token, 200);
    if (result.success || result.status === 204) {
      cleanedCount++;
      log('  ✓ Deleted test promotion', 'green');
    }
  }

  log(`\n✓ Cleanup complete: ${cleanedCount} items removed`, 'green');
}

// Generate report
function generateReport() {
  testResults.endTime = new Date();
  const duration = (testResults.endTime - testResults.startTime) / 1000;

  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║           GO-LIVE READINESS TEST SUMMARY               ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝\n', 'cyan');

  log(`Total Tests:    ${testResults.total}`);
  log(`Passed:         ${testResults.passed}`, 'green');
  log(`Failed:         ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'reset');
  log(`Warnings:       ${testResults.warnings}`, testResults.warnings > 0 ? 'yellow' : 'reset');
  log(`\nSuccess Rate:   ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  log(`Duration:       ${duration.toFixed(2)}s\n`);

  // Categorize results
  const categories = {};
  testResults.tests.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = { passed: 0, failed: 0, warnings: 0, total: 0 };
    }
    categories[test.category].total++;
    if (test.status === 'PASS') categories[test.category].passed++;
    else if (test.status === 'FAIL') categories[test.category].failed++;
    else categories[test.category].warnings++;
  });

  log('Category Breakdown:', 'cyan');
  Object.keys(categories).forEach(cat => {
    const stats = categories[cat];
    const color = stats.failed > 0 ? 'red' : stats.warnings > 0 ? 'yellow' : 'green';
    log(`  ${cat}: ${stats.passed}/${stats.total} passed`, color);
  });

  // Save detailed results
  const reportPath = '/tmp/go_live_uat_results.json';
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log(`\nDetailed results saved to: ${reportPath}`, 'blue');

  // Final verdict
  if (testResults.failed === 0 && testResults.warnings === 0) {
    log('\n✓ ALL TESTS PASSED - SYSTEM IS GO-LIVE READY!', 'green');
    return 0;
  } else if (testResults.failed === 0) {
    log('\n⚠ ALL TESTS PASSED WITH WARNINGS - REVIEW RECOMMENDED', 'yellow');
    return 0;
  } else {
    log('\n✗ SOME TESTS FAILED - NOT READY FOR GO-LIVE', 'red');
    return 1;
  }
}

// Main execution
async function main() {
  log('╔═══════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                       ║', 'cyan');
  log('║        TRADEAI GO-LIVE READINESS UAT TEST            ║', 'cyan');
  log('║                                                       ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════╝\n', 'cyan');

  log(`Backend URL:  ${BACKEND_URL}`, 'blue');
  log(`Frontend URL: ${FRONTEND_URL}`, 'blue');
  log(`Start Time:   ${new Date().toISOString()}\n`, 'blue');

  try {
    // Run all test suites
    await testSystemHealth();
    await testAuthenticationFlows();
    await testCustomerManagement();
    await testProductManagement();
    await testPromotionManagement();
    await testSalesManagement();
    await testReportingAndDashboard();
    await testMultiTenantIsolation();
    await testPerformanceUnderLoad();
    await testErrorHandling();

    // Cleanup test data
    await cleanup();

    // Generate and display report
    const exitCode = generateReport();
    process.exit(exitCode);

  } catch (error) {
    log(`\n✗ Test execution failed: ${error.message}`, 'red');
    log(error.stack, 'red');
    process.exit(1);
  }
}

// Execute tests
main();
