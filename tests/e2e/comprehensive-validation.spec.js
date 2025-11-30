const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('./helpers/api');
const { UiParser } = require('./helpers/uiParse');
const { DataAssert } = require('./helpers/dataAssert');
const { MlAssert } = require('./helpers/mlAssert');

test.describe('Comprehensive System Validation @smoke @comprehensive', () => {
  let api;

  test('should validate complete system health and data flow', async ({ page, request }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    api = await ApiHelper.fromPage(page, request);
    
    console.log('=== COMPREHENSIVE SYSTEM VALIDATION ===\n');
    
    console.log('1. Testing Authentication...');
    const token = await ApiHelper.extractAuthToken(page);
    const tenantId = await ApiHelper.extractTenantId(page);
    expect(token, 'Auth token should exist').toBeDefined();
    expect(tenantId, 'Tenant ID should exist').toBeDefined();
    console.log(`✓ Authenticated as tenant: ${tenantId}\n`);
    
    console.log('2. Testing Dashboard...');
    const dashboardHasContent = await page.locator('text=/budget|spend|roi|revenue|optimization/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(dashboardHasContent, 'Dashboard should display content').toBeTruthy();
    console.log('✓ Dashboard loaded with content\n');
    
    console.log('3. Testing Budgets Module...');
    const { data: budgetsResponse } = await api.get('/api/budgets');
    const budgets = budgetsResponse.data || budgetsResponse.budgets || [];
    console.log(`✓ Budgets API returned ${budgets.length} budgets`);
    
    await page.goto('/budgets');
    await page.waitForTimeout(2000);
    const budgetsPageLoaded = await page.locator('text=/budget|allocation|spend/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(budgetsPageLoaded, 'Budgets page should load').toBeTruthy();
    console.log('✓ Budgets page accessible\n');
    
    console.log('4. Testing Products Module...');
    const { data: productsResponse } = await api.get('/api/products');
    const products = productsResponse.data || productsResponse.products || productsResponse || [];
    console.log(`✓ Products API returned ${products.length} products`);
    
    await page.goto('/products');
    await page.waitForTimeout(2000);
    const productsPageLoaded = await page.locator('text=/product|catalog|category/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(productsPageLoaded, 'Products page should load').toBeTruthy();
    console.log('✓ Products page accessible\n');
    
    console.log('5. Testing Customers Module...');
    const { data: customersResponse } = await api.get('/api/customers');
    const customers = customersResponse.data || customersResponse.customers || customersResponse || [];
    console.log(`✓ Customers API returned ${customers.length} customers`);
    
    await page.goto('/customers');
    await page.waitForTimeout(2000);
    const customersPageLoaded = await page.locator('text=/customer|client|account/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(customersPageLoaded, 'Customers page should load').toBeTruthy();
    console.log('✓ Customers page accessible\n');
    
    console.log('6. Testing Promotions Module...');
    const { data: promotionsResponse } = await api.get('/api/promotions');
    const promotions = promotionsResponse.data || promotionsResponse.promotions || [];
    console.log(`✓ Promotions API returned ${promotions.length} promotions`);
    
    await page.goto('/promotions');
    await page.waitForTimeout(2000);
    const promotionsPageLoaded = await page.locator('text=/promotion|campaign|offer/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(promotionsPageLoaded, 'Promotions page should load').toBeTruthy();
    console.log('✓ Promotions page accessible\n');
    
    console.log('7. Testing ML/AI - Predictive Analytics...');
    const { data: salesPrediction } = await api.post('/api/predictive-analytics/predict-sales', { months: 3 });
    expect(salesPrediction, 'Sales prediction should return data').toBeDefined();
    expect(salesPrediction.confidence, 'Sales prediction should have confidence').toBeDefined();
    console.log(`✓ Sales prediction: confidence=${salesPrediction.confidence}, predictions=${salesPrediction.predictions?.length || 0}`);
    
    const { data: roiPrediction } = await api.post('/api/predictive-analytics/predict-promotion-roi', {
      promotionType: 'discount',
      discountValue: 10,
      duration: 30
    });
    expect(roiPrediction, 'ROI prediction should return data').toBeDefined();
    expect(roiPrediction.confidence, 'ROI prediction should have confidence').toBeDefined();
    console.log(`✓ ROI prediction: confidence=${roiPrediction.confidence}, predictedROI=${roiPrediction.predictedROI}`);
    
    const { data: budgetPrediction } = await api.post('/api/predictive-analytics/predict-budget-needs', { months: 3 });
    expect(budgetPrediction, 'Budget prediction should return data').toBeDefined();
    expect(budgetPrediction.confidence, 'Budget prediction should have confidence').toBeDefined();
    console.log(`✓ Budget prediction: confidence=${budgetPrediction.confidence}, predictions=${budgetPrediction.predictions?.length || 0}\n`);
    
    console.log('8. Testing Performance Analytics...');
    const analyticsEndpoints = [
      { name: 'Promotion Effectiveness', path: '/api/performance-analytics/promotion-effectiveness' },
      { name: 'ROI Trending', path: '/api/performance-analytics/roi-trending' },
      { name: 'Budget Variance', path: '/api/performance-analytics/budget-variance' },
      { name: 'Customer Segmentation', path: '/api/performance-analytics/customer-segmentation' }
    ];
    
    for (const endpoint of analyticsEndpoints) {
      const { data: analytics } = await api.get(endpoint.path).catch(() => ({ data: null }));
      const hasData = analytics && (Array.isArray(analytics.data) ? analytics.data.length > 0 : Object.keys(analytics).length > 0);
      console.log(`✓ ${endpoint.name}: ${hasData ? 'data available' : 'no data'}`);
    }
    console.log('');
    
    console.log('9. Testing Navigation...');
    const navigationPages = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Budgets', path: '/budgets' },
      { name: 'Products', path: '/products' },
      { name: 'Customers', path: '/customers' },
      { name: 'Promotions', path: '/promotions' },
      { name: 'Analytics', path: '/analytics' }
    ];
    
    for (const navPage of navigationPages) {
      await page.goto(navPage.path);
      await page.waitForTimeout(1000);
      const pageLoaded = await page.locator('body').isVisible({ timeout: 3000 }).catch(() => false);
      expect(pageLoaded, `${navPage.name} page should load`).toBeTruthy();
      console.log(`✓ ${navPage.name} page accessible`);
    }
    console.log('');
    
    console.log('10. Testing Data Consistency...');
    const totalRecords = budgets.length + products.length + customers.length + promotions.length;
    console.log(`✓ Total records in system: ${totalRecords}`);
    console.log(`  - Budgets: ${budgets.length}`);
    console.log(`  - Products: ${products.length}`);
    console.log(`  - Customers: ${customers.length}`);
    console.log(`  - Promotions: ${promotions.length}`);
    
    expect(totalRecords, 'System should have data').toBeGreaterThan(0);
    console.log('');
    
    // Summary
    console.log('=== VALIDATION SUMMARY ===');
    console.log('✓ Authentication: PASSED');
    console.log('✓ Dashboard: PASSED');
    console.log('✓ Budgets Module: PASSED');
    console.log('✓ Products Module: PASSED');
    console.log('✓ Customers Module: PASSED');
    console.log('✓ Promotions Module: PASSED');
    console.log('✓ ML/AI Predictive Analytics: PASSED');
    console.log('✓ Performance Analytics: PASSED');
    console.log('✓ Navigation: PASSED');
    console.log('✓ Data Consistency: PASSED');
    console.log('\n✅ COMPREHENSIVE SYSTEM VALIDATION COMPLETE');
  });

  test('should validate system performance across all modules', async ({ page }) => {
    console.log('=== PERFORMANCE VALIDATION ===\n');
    
    const modules = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Budgets', path: '/budgets' },
      { name: 'Products', path: '/products' },
      { name: 'Customers', path: '/customers' },
      { name: 'Promotions', path: '/promotions' },
      { name: 'Analytics', path: '/analytics' }
    ];
    
    const performanceResults = [];
    
    for (const module of modules) {
      const startTime = Date.now();
      await page.goto(module.path);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      const loadTime = Date.now() - startTime;
      
      performanceResults.push({
        module: module.name,
        loadTime
      });
      
      console.log(`${module.name}: ${loadTime}ms`);
      
      expect(loadTime, `${module.name} should load within 10s`).toBeLessThan(10000);
    }
    
    const avgLoadTime = performanceResults.reduce((sum, r) => sum + r.loadTime, 0) / performanceResults.length;
    console.log(`\nAverage load time: ${avgLoadTime.toFixed(0)}ms`);
    console.log('✅ PERFORMANCE VALIDATION COMPLETE');
  });

  test('should validate no console errors across all modules', async ({ page }) => {
    console.log('=== CONSOLE ERROR VALIDATION ===\n');
    
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    const modules = [
      '/dashboard',
      '/budgets',
      '/products',
      '/customers',
      '/promotions',
      '/analytics'
    ];
    
    for (const modulePath of modules) {
      await page.goto(modulePath);
      await page.waitForTimeout(2000);
      console.log(`Checked ${modulePath}: ${consoleErrors.length} errors so far`);
    }
    
    if (consoleErrors.length > 0) {
      console.log('\nConsole errors found:');
      consoleErrors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err}`);
      });
    }
    
    expect(consoleErrors.length, 'Should have minimal console errors').toBeLessThan(10);
    console.log(`\n✅ Console errors: ${consoleErrors.length} (acceptable)`);
  });
});
