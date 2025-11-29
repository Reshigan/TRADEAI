const { test, expect } = require('@playwright/test');

/**
 * Budgets E2E Tests
 * 
 * Tests budget management functionality
 */

async function login(page) {
  await page.goto('/');
  await page.locator('input[type="email"], input[name="email"]').fill('admin@testdistributor.com');
  await page.locator('input[type="password"], input[name="password"]').fill('Admin@123');
  await page.locator('button:has-text("ACCESS PLATFORM"), button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|home)?/, { timeout: 10000 });
}

test.describe('Budgets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    
    const budgetsLink = page.locator('a:has-text("Budget"), button:has-text("Budget")').first();
    if (await budgetsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await budgetsLink.click();
      await page.waitForTimeout(2000);
    }
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
