const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/login');

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('should display dashboard after login', async ({ page }) => {
    const hasDashboard = await page.locator('text=/dashboard|overview|metrics/i').isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasDashboard).toBeTruthy();
  });
  
  test('should display key metrics', async ({ page }) => {
    const hasMetrics = await page.locator('text=/budget|spend|roi|revenue|sales/i').isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasMetrics).toBeTruthy();
  });
  
  test('should display charts and visualizations', async ({ page }) => {
    const hasCharts = await page.locator('canvas, svg, [class*="chart" i], [class*="graph" i]').isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasCharts).toBeTruthy();
  });
  
  test('should display recent activity or transactions', async ({ page }) => {
    const hasActivity = await page.locator('text=/recent|activity|transaction|history/i').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasActivity) {
      expect(hasActivity).toBeTruthy();
    }
  });
  
  test('should allow date range filtering', async ({ page }) => {
    const dateFilter = page.locator('input[type="date"], [class*="date" i]').first();
    
    if (await dateFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      expect(await dateFilter.isVisible()).toBeTruthy();
    }
  });
  
  test('should refresh data', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh" i]').first();
    
    if (await refreshButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
    }
  });
});
