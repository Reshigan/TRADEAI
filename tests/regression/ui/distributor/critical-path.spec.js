/**
 * Critical Path UI Tests - Distributor
 * Tests essential user journeys and UI functionality
 */

const { test, expect } = require('@playwright/test');

test.describe('Critical Path - Distributor', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('https://tradeai.gonxt.tech/');
    await page.locator('input[type="email"], input[name="email"]').fill(process.env.TEST_USER_EMAIL || 'admin@testdistributor.com');
    await page.locator('input[type="password"], input[name="password"]').fill(process.env.TEST_USER_PASSWORD || 'Admin@123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(url => url.pathname !== '/' && url.pathname !== '/login');
  });

  test('should load dashboard without errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('https://tradeai.gonxt.tech/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/budget|revenue|promotion/i').first()).toBeVisible({ timeout: 10000 });

    expect(errors.length).toBe(0);
  });

  test('should navigate to budgets page', async ({ page }) => {
    await page.goto('https://tradeai.gonxt.tech/budgets');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/budget/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to promotions page', async ({ page }) => {
    await page.goto('https://tradeai.gonxt.tech/promotions');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/promotion/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to products page', async ({ page }) => {
    await page.goto('https://tradeai.gonxt.tech/products');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/product|sku/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to customers page', async ({ page }) => {
    await page.goto('https://tradeai.gonxt.tech/customers');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/customer/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should load reports without errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('https://tradeai.gonxt.tech/reports');
    await page.waitForLoadState('networkidle');

    expect(errors.length).toBe(0);
  });

  test('should not have 5xx errors on any page', async ({ page }) => {
    const pages = ['/dashboard', '/budgets', '/promotions', '/products', '/customers'];
    
    for (const pagePath of pages) {
      const response = await page.goto(`https://tradeai.gonxt.tech${pagePath}`);
      expect(response.status()).toBeLessThan(500);
    }
  });
});
