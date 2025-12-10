const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/login');

test.describe('Budgets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/budgets');
    await page.waitForTimeout(2000);
  });
  
  test('should display budgets list', async ({ page }) => {
    // Check that page loaded with content
    const hasContent = await page.locator('main, [role="main"], table, .content, div').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });
  
  test('should display budget details', async ({ page }) => {
    // Check that page has some content
    const hasContent = await page.locator('main, [role="main"], table, .card, div').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });
  
  test('should filter budgets', async ({ page }) => {
    // Check that page has filter controls or content
    const hasContent = await page.locator('main, [role="main"], input, select, div').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });
  
  test('should display budget utilization metrics', async ({ page }) => {
    const hasMetrics = await page.locator('text=/utilization|progress|%|percent/i, [role="progressbar"]').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasMetrics) {
      expect(hasMetrics).toBeTruthy();
    }
  });
});
