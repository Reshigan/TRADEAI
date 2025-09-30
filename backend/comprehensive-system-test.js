#!/usr/bin/env node

/**
 * Comprehensive System Test Suite for Trade AI Platform
 * Tests all major functionality with Modelex South Africa data
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5002/api';
const FRONTEND_URL = 'http://localhost:3000';

// Test configuration
const TEST_USER = {
  email: 'thabo.mthembu@modelex.co.za',
  password: 'Modelex2024!'
};

let authToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to log test results
function logTest(testName, passed, message = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: ${message}`);
  }
  testResults.details.push({ testName, passed, message });
}

// Helper function to make authenticated API calls
async function apiCall(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      status: error.response?.status 
    };
  }
}

// Test authentication system
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication System...');
  
  // Test login
  const loginResult = await apiCall('POST', '/auth/login', TEST_USER);
  logTest('User Login', loginResult.success && loginResult.data.token, loginResult.error);
  
  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    
    // Test token validation
    const profileResult = await apiCall('GET', '/auth/me');
    logTest('Token Validation', profileResult.success, profileResult.error);
    
    // Test user profile data
    if (profileResult.success) {
      const user = profileResult.data.data?.user || profileResult.data.user || profileResult.data;
      logTest('User Profile Data', 
        user.email === TEST_USER.email && user.role === 'admin',
        `Expected admin user, got role: ${user.role}, email: ${user.email}`
      );
    }
  }
}

// Test customer management
async function testCustomers() {
  console.log('\n👥 Testing Customer Management...');
  
  const customersResult = await apiCall('GET', '/customers');
  logTest('Fetch Customers', customersResult.success, customersResult.error);
  
  if (customersResult.success) {
    const customers = customersResult.data.data;
    logTest('Customer Count', customers.length >= 8, `Expected >= 8 customers, got ${customers.length}`);
    
    // Test South African retailers
    const shoprite = customers.find(c => c.name === 'Shoprite Holdings Ltd');
    logTest('Shoprite Customer', !!shoprite, 'Shoprite not found in customer list');
    
    const pickNPay = customers.find(c => c.name === 'Pick n Pay Stores Ltd');
    logTest('Pick n Pay Customer', !!pickNPay, 'Pick n Pay not found in customer list');
    
    // Test customer data structure
    if (shoprite) {
      logTest('Customer Data Structure', 
        shoprite.sapCustomerId && shoprite.code && shoprite.tier,
        'Missing required customer fields'
      );
    }
  }
}

// Test product management
async function testProducts() {
  console.log('\n📦 Testing Product Management...');
  
  const productsResult = await apiCall('GET', '/products');
  logTest('Fetch Products', productsResult.success, productsResult.error);
  
  if (productsResult.success) {
    const products = productsResult.data.data;
    logTest('Product Count', products.length >= 20, `Expected >= 20 products, got ${products.length}`);
    
    // Test FMCG categories
    const categories = [...new Set(products.map(p => p.category?.primary))];
    const expectedCategories = ['Snacks', 'Dairy', 'Personal Care', 'Household'];
    const hasExpectedCategories = expectedCategories.some(cat => categories.includes(cat));
    logTest('FMCG Categories', hasExpectedCategories, `Categories: ${categories.join(', ')}`);
    
    // Test product data structure
    const sampleProduct = products[0];
    logTest('Product Data Structure',
      sampleProduct.sku && sampleProduct.barcode && sampleProduct.pricing?.listPrice,
      'Missing required product fields'
    );
    
    // Test South African pricing (ZAR)
    const hasZARPricing = products.some(p => p.pricing?.currency === 'ZAR');
    logTest('ZAR Currency', hasZARPricing, 'No products with ZAR currency found');
  }
}

// Test budget management
async function testBudgets() {
  console.log('\n💰 Testing Budget Management...');
  
  const budgetsResult = await apiCall('GET', '/budgets');
  logTest('Fetch Budgets', budgetsResult.success, budgetsResult.error);
  
  if (budgetsResult.success) {
    const budgets = budgetsResult.data.data || budgetsResult.data;
    logTest('Budget System Available', Array.isArray(budgets), 'Budget data not in expected format');
  }
}

// Test promotions
async function testPromotions() {
  console.log('\n🎯 Testing Promotions...');
  
  const promotionsResult = await apiCall('GET', '/promotions');
  logTest('Fetch Promotions', promotionsResult.success, promotionsResult.error);
  
  if (promotionsResult.success) {
    const promotions = promotionsResult.data.data || promotionsResult.data;
    logTest('Promotion System Available', Array.isArray(promotions), 'Promotion data not in expected format');
  }
}

// Test dashboard data
async function testDashboard() {
  console.log('\n📊 Testing Dashboard...');
  
  // Test health endpoint
  const healthResult = await apiCall('GET', '/health');
  logTest('API Health Check', healthResult.success, healthResult.error);
  
  // Test dashboard endpoints (may not have data yet)
  const dashboardResult = await apiCall('GET', '/dashboards');
  logTest('Dashboard Endpoint', 
    dashboardResult.success || dashboardResult.status === 404,
    dashboardResult.error
  );
}

// Test frontend accessibility
async function testFrontend() {
  console.log('\n🌐 Testing Frontend Accessibility...');
  
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    logTest('Frontend Accessible', response.status === 200, `Status: ${response.status}`);
    
    // Check if it's the React app
    const isReactApp = response.data.includes('Trade AI Platform') || response.data.includes('react');
    logTest('React App Loading', isReactApp, 'Frontend not serving React app');
    
  } catch (error) {
    logTest('Frontend Accessible', false, error.message);
  }
}

// Test data integrity
async function testDataIntegrity() {
  console.log('\n🔍 Testing Data Integrity...');
  
  // Test company data
  const customersResult = await apiCall('GET', '/customers');
  const productsResult = await apiCall('GET', '/products');
  
  if (customersResult.success && productsResult.success) {
    const customers = customersResult.data.data;
    const products = productsResult.data.data;
    
    // Check if all customers belong to Modelex company
    const modelexCompanyId = customers[0]?.company;
    const allSameCompany = customers.every(c => c.company === modelexCompanyId);
    logTest('Customer Company Consistency', allSameCompany, 'Customers belong to different companies');
    
    // Check if all products belong to Modelex company
    const allProductsSameCompany = products.every(p => p.company === modelexCompanyId);
    logTest('Product Company Consistency', allProductsSameCompany, 'Products belong to different companies');
    
    // Check for South African addresses
    const saAddresses = customers.filter(c => 
      c.addresses?.some(addr => addr.country === 'South Africa')
    );
    logTest('South African Addresses', saAddresses.length > 0, 'No South African addresses found');
  }
}

// Test API performance
async function testPerformance() {
  console.log('\n⚡ Testing API Performance...');
  
  const startTime = Date.now();
  const customersResult = await apiCall('GET', '/customers');
  const customerLoadTime = Date.now() - startTime;
  
  logTest('Customer Load Time', customerLoadTime < 2000, `${customerLoadTime}ms (should be < 2000ms)`);
  
  const startTime2 = Date.now();
  const productsResult = await apiCall('GET', '/products');
  const productLoadTime = Date.now() - startTime2;
  
  logTest('Product Load Time', productLoadTime < 2000, `${productLoadTime}ms (should be < 2000ms)`);
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Comprehensive System Test Suite');
  console.log('=' .repeat(60));
  
  try {
    await testAuthentication();
    await testCustomers();
    await testProducts();
    await testBudgets();
    await testPromotions();
    await testDashboard();
    await testFrontend();
    await testDataIntegrity();
    await testPerformance();
    
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  }
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total:  ${testResults.total}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(t => !t.passed)
      .forEach(t => console.log(`   • ${t.testName}: ${t.message}`));
  }
  
  console.log('\n🏁 Test suite completed!');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});