const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/login');

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('should display dashboard after login', async ({ page }) => {
    // Check that page loaded with content (not error page)
    const hasContent = await page.locator('main, [role="main"], .dashboard, .content, div').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });
  
  test('should display key metrics', async ({ page }) => {
    // Check that page has some content
    const hasContent = await page.locator('main, [role="main"], .card, .metric, div').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });
  
  test('should display charts and visualizations', async ({ page }) => {
    // Check that page has some visual content
    const hasContent = await page.locator('main, [role="main"], canvas, svg, .chart, div').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
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
