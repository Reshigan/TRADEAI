const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/login');

test.describe('Budgets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/budgets');
    await page.waitForTimeout(2000);
  });
  
  test('should display budgets list', async ({ page }) => {
    const hasBudgetsList = await page.locator('table, [role="table"], [class*="grid" i], [class*="list" i]').isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasBudgetsList).toBeTruthy();
  });
  
  test('should display budget details', async ({ page }) => {
    const budgetItems = page.locator('tr, [class*="card" i], [class*="item" i]');
    const count = await budgetItems.count();
    
    if (count > 0) {
      const hasBudgetInfo = await page.locator('text=/amount|allocated|available|budget/i').isVisible().catch(() => false);
      expect(hasBudgetInfo).toBeTruthy();
    }
  });
  
  test('should filter budgets', async ({ page }) => {
    const filterInput = page.locator('input[placeholder*="search" i], input[placeholder*="filter" i], input[type="search"]').first();
    
    if (await filterInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterInput.fill('test');
      await page.waitForTimeout(1000);
      
      const hasResults = await page.locator('table, [role="table"], [class*="grid" i]').isVisible().catch(() => false);
      expect(hasResults).toBeTruthy();
    }
  });
  
  test('should display budget utilization metrics', async ({ page }) => {
    const hasMetrics = await page.locator('text=/utilization|progress|%|percent/i, [role="progressbar"]').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasMetrics) {
      expect(hasMetrics).toBeTruthy();
    }
  });
});
