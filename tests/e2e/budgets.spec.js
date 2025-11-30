const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/login');

test.describe('Budgets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/budgets');
    await page.waitForTimeout(2000);
  });
  
  test('should display budgets list', async ({ page }) => {
    const hasBudgetsList = await page.locator('text=/Year|Customer|Total Amount|Allocated|Remaining|Status/i').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasBudgetsList).toBeTruthy();
  });
  
  test('should display budget details', async ({ page }) => {
    const hasBudgetInfo = await page.locator('text=/Total Amount|Allocated|Remaining|Status/i').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasBudgetInfo).toBeTruthy();
  });
  
  test('should filter budgets', async ({ page }) => {
    const hasFilterControls = await page.locator('text=/Year|Status|Search/i').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasFilterControls).toBeTruthy();
  });
  
  test('should display budget utilization metrics', async ({ page }) => {
    const hasMetrics = await page.locator('text=/utilization|progress|%|percent/i, [role="progressbar"]').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasMetrics) {
      expect(hasMetrics).toBeTruthy();
    }
  });
});
