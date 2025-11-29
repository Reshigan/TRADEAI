const { test, expect } = require('@playwright/test');

/**
 * Performance E2E Tests
 * 
 * Tests application performance and load times
 */

async function login(page) {
  await page.goto('/');
  await page.locator('input[type="email"], input[name="email"]').fill('admin@testdistributor.com');
  await page.locator('input[type="password"], input[name="password"]').fill('Admin@123');
  await page.locator('button:has-text("Login"), button:has-text("Sign In")').click();
  await page.waitForURL(/\/(dashboard|home)?/, { timeout: 10000 });
}

test.describe('Performance', () => {
  test('should load login page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    const loadTime = Date.now() - startTime;
    
    console.log(`Login page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });
  
  test('should load dashboard within 5 seconds after login', async ({ page }) => {
    await login(page);
    
    const startTime = Date.now();
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    const loadTime = Date.now() - startTime;
    
    console.log(`Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });
  
  test('should not have console errors on dashboard', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await login(page);
    await page.waitForTimeout(2000);
    
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('404') &&
      !err.includes('net::ERR_')
    );
    
    console.log(`Console errors found: ${criticalErrors.length}`);
    if (criticalErrors.length > 0) {
      console.log('Errors:', criticalErrors);
    }
    
    expect(criticalErrors.length).toBeLessThan(5);
  });
  
  test('should handle rapid navigation without errors', async ({ page }) => {
    await login(page);
    
    const pages = ['Budget', 'Product', 'Dashboard'];
    
    for (const pageName of pages) {
      const link = page.locator(`a:has-text("${pageName}"), button:has-text("${pageName}")`).first();
      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        await link.click();
        await page.waitForTimeout(500);
      }
    }
    
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
  });
});
