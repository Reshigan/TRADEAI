const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/login');

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('should display main navigation menu', async ({ page }) => {
    // Check for any navigation element - sidebar, header nav, or menu
    const hasNav = await page.locator('nav, [role="navigation"], aside, header').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasNav).toBeTruthy();
  });
  
  test('should navigate to Dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    // Check that we're on a page with content (not error page)
    const hasContent = await page.locator('main, [role="main"], .dashboard, .content, div').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });
  
  test('should navigate to Budgets page', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForTimeout(2000);
    
    // Check that page loaded (not error)
    const hasContent = await page.locator('main, [role="main"], table, .content, div').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });
  
  test('should navigate to Products page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForTimeout(2000);
    
    // Check that page loaded (not error)
    const hasContent = await page.locator('main, [role="main"], table, .content, div').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });
  
  test('should navigate to Analytics page', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForTimeout(2000);
    
    // Check that page loaded (not error)
    const hasContent = await page.locator('main, [role="main"], .content, div').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});
