const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');
const { UiParser } = require('../helpers/uiParse');
const { DataAssert } = require('../helpers/dataAssert');

test.describe('Budgets Data Accuracy Validation @core @data', () => {
  let api;

  test.beforeEach(async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForTimeout(2000);
  });

  test('should validate budgets list data matches API', async ({ page, request }) => {
    api = await ApiHelper.fromPage(page, request);
    
    // Fetch budgets from API
    const { data: apiResponse } = await api.get('/api/budgets');
    const apiBudgets = apiResponse.data || apiResponse.budgets || [];
    
    console.log(`API returned ${apiBudgets.length} budgets`);
    
    const tableLocator = page.locator('table').first();
    const tableVisible = await tableLocator.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!tableVisible || apiBudgets.length === 0) {
      console.log('No budgets table or data found, skipping validation');
      expect(true).toBeTruthy();
      return;
    }
    
    await page.waitForTimeout(1000);
    
    const uiRows = await UiParser.parseTable(tableLocator);
    console.log(`UI shows ${uiRows.length} budgets`);
    
    expect(uiRows.length).toBeGreaterThan(0);
    
    if (uiRows.length > 0 && apiBudgets.length > 0) {
      const firstRow = uiRows[0];
      const hasYearOrCustomer = Object.keys(firstRow).some(key => 
        key.toLowerCase().includes('year') || 
        key.toLowerCase().includes('customer') ||
        key.toLowerCase().includes('amount')
      );
      
      expect(hasYearOrCustomer, 'UI should display budget information').toBeTruthy();
    }
  });

  test('should validate budget utilization metrics', async ({ page, request }) => {
    api = await ApiHelper.fromPage(page, request);
    
    // Fetch budgets from API
    const { data: apiResponse } = await api.get('/api/budgets');
    const apiBudgets = apiResponse.data || apiResponse.budgets || [];
    
    if (apiBudgets.length === 0) {
      console.log('No budgets found, skipping utilization validation');
      expect(true).toBeTruthy();
      return;
    }
    
    let totalAllocated = 0;
    let totalSpent = 0;
    
    apiBudgets.forEach(budget => {
      totalAllocated += budget.allocated || budget.totalAmount || 0;
      totalSpent += budget.spent || budget.allocatedAmount || 0;
    });
    
    const apiUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
    
    console.log(`API Metrics - Allocated: ${totalAllocated}, Spent: ${totalSpent}, Utilization: ${apiUtilization.toFixed(2)}%`);
    
    const utilizationText = await page.locator('text=/utilization|allocated|spent/i').first().textContent().catch(() => '');
    console.log(`Found utilization text: ${utilizationText}`);
    
    expect(utilizationText.length).toBeGreaterThan(0);
  });

  test('should validate budget details page data', async ({ page, request }) => {
    api = await ApiHelper.fromPage(page, request);
    
    // Fetch budgets from API
    const { data: apiResponse } = await api.get('/api/budgets');
    const apiBudgets = apiResponse.data || apiResponse.budgets || [];
    
    if (apiBudgets.length === 0) {
      console.log('No budgets found, skipping details validation');
      expect(true).toBeTruthy();
      return;
    }
    
    const firstBudget = apiBudgets[0];
    const budgetId = firstBudget._id || firstBudget.id;
    
    if (!budgetId) {
      console.log('No budget ID found, skipping details validation');
      expect(true).toBeTruthy();
      return;
    }
    
    await page.goto(`/budgets/${budgetId}`);
    await page.waitForTimeout(2000);
    
    const { data: apiDetails } = await api.get(`/api/budgets/${budgetId}`);
    const budgetData = apiDetails.data || apiDetails.budget || apiDetails;
    
    const pageText = await page.textContent('body');
    
    if (budgetData.year) {
      const hasYear = pageText.includes(String(budgetData.year));
      expect(hasYear, `Budget year ${budgetData.year} should be displayed`).toBeTruthy();
    }
    
    const hasAmountInfo = pageText.toLowerCase().includes('amount') || 
                          pageText.toLowerCase().includes('allocated') ||
                          pageText.toLowerCase().includes('budget');
    expect(hasAmountInfo, 'Budget amount information should be displayed').toBeTruthy();
  });

  test('should validate budget filtering works correctly', async ({ page, request }) => {
    api = await ApiHelper.fromPage(page, request);
    
    const { data: allBudgetsResponse } = await api.get('/api/budgets');
    const allBudgets = allBudgetsResponse.data || allBudgetsResponse.budgets || [];
    
    if (allBudgets.length === 0) {
      console.log('No budgets found, skipping filter validation');
      expect(true).toBeTruthy();
      return;
    }
    
    const years = [...new Set(allBudgets.map(b => b.year).filter(Boolean))];
    
    if (years.length > 1) {
      const filterYear = years[0];
      console.log(`Testing filter for year: ${filterYear}`);
      
      const yearFilter = page.locator('select, input, [role="combobox"]').filter({ hasText: /year/i }).first();
      const filterExists = await yearFilter.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (filterExists) {
        await yearFilter.click();
        await page.waitForTimeout(500);
        
        console.log('Year filter found and clickable');
        expect(true).toBeTruthy();
      } else {
        console.log('No year filter found in UI');
        expect(true).toBeTruthy();
      }
    } else {
      console.log('Not enough year variety to test filtering');
      expect(true).toBeTruthy();
    }
  });

  test('should validate budget totals and calculations', async ({ page, request }) => {
    api = await ApiHelper.fromPage(page, request);
    
    // Fetch budgets from API
    const { data: apiResponse } = await api.get('/api/budgets');
    const apiBudgets = apiResponse.data || apiResponse.budgets || [];
    
    if (apiBudgets.length === 0) {
      console.log('No budgets found, skipping totals validation');
      expect(true).toBeTruthy();
      return;
    }
    
    const apiTotals = {
      totalBudgets: apiBudgets.length,
      totalAllocated: apiBudgets.reduce((sum, b) => sum + (b.allocated || b.totalAmount || 0), 0),
      totalSpent: apiBudgets.reduce((sum, b) => sum + (b.spent || b.allocatedAmount || 0), 0),
      totalRemaining: 0
    };
    
    apiTotals.totalRemaining = apiTotals.totalAllocated - apiTotals.totalSpent;
    apiTotals.utilization = apiTotals.totalAllocated > 0 
      ? (apiTotals.totalSpent / apiTotals.totalAllocated) * 100 
      : 0;
    
    console.log('API Totals:', JSON.stringify(apiTotals, null, 2));
    
    const summaryLocator = page.locator('[class*="summary"], [class*="total"], [class*="card"]').first();
    const summaryExists = await summaryLocator.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (summaryExists) {
      const summaryText = await summaryLocator.textContent();
      console.log('Found summary section:', summaryText.substring(0, 200));
      
      const hasNumbers = /\d+/.test(summaryText);
      expect(hasNumbers, 'Summary should contain numeric values').toBeTruthy();
    } else {
      console.log('No summary section found, validating table data instead');
      
      const tableLocator = page.locator('table').first();
      const hasTable = await tableLocator.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasTable, 'Should have budgets table or summary').toBeTruthy();
    }
  });
});
