const { test, expect } = require('@playwright/test');

/**
 * Navigation E2E Tests
 * 
 * Tests navigation, menu functionality, and page accessibility
 */

async function login(page) {
  await page.goto('/');
  await page.locator('input[type="email"], input[name="email"]').fill('admin@testdistributor.com');
  await page.locator('input[type="password"], input[name="password"]').fill('Admin@123');
  await page.locator('button:has-text("ACCESS PLATFORM"), button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|home)?/, { timeout: 10000 });
}

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('should display main navigation menu', async ({ page }) => {
    const hasNav = await page.locator('nav, [role="navigation"]').isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasNav).toBeTruthy();
  });
  
  test('should navigate to Dashboard', async ({ page }) => {
    const dashboardLink = page.locator('a:has-text("Dashboard"), button:has-text("Dashboard")').first();
    
    if (await dashboardLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dashboardLink.click();
      await page.waitForTimeout(2000);
      
      const hasDashboard = await page.locator('text=/dashboard|overview|metrics/i').isVisible().catch(() => false);
      expect(hasDashboard).toBeTruthy();
    }
  });
  
  test('should navigate to Budgets page', async ({ page }) => {
    const budgetsLink = page.locator('a:has-text("Budget"), button:has-text("Budget")').first();
    
    if (await budgetsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await budgetsLink.click();
      await page.waitForTimeout(2000);
      
      const hasBudgets = await page.locator('text=/budget|allocation|spend/i').isVisible().catch(() => false);
      expect(hasBudgets).toBeTruthy();
    }
  });
  
  test('should navigate to Products page', async ({ page }) => {
    const productsLink = page.locator('a:has-text("Product"), button:has-text("Product")').first();
    
    if (await productsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await productsLink.click();
      await page.waitForTimeout(2000);
      
      const hasProducts = await page.locator('text=/product|item|catalog/i').isVisible().catch(() => false);
      expect(hasProducts).toBeTruthy();
    }
  });
  
  test('should navigate to Analytics page', async ({ page }) => {
    const analyticsLink = page.locator('a:has-text("Analytics"), button:has-text("Analytics"), a:has-text("Reports"), button:has-text("Reports")').first();
    
    if (await analyticsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await analyticsLink.click();
      await page.waitForTimeout(2000);
      
      const hasAnalytics = await page.locator('text=/analytic|report|insight|chart/i').isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasAnalytics).toBeTruthy();
    }
  });
});
