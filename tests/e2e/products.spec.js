const { test, expect } = require('@playwright/test');

/**
 * Products E2E Tests
 * 
 * Tests product management functionality
 */

async function login(page) {
  await page.goto('/');
  await page.locator('input[type="email"], input[name="email"]').fill('admin@testdistributor.com');
  await page.locator('input[type="password"], input[name="password"]').fill('Admin@123');
  await page.locator('button:has-text("Login"), button:has-text("Sign In")').click();
  await page.waitForURL(/\/(dashboard|home)?/, { timeout: 10000 });
}

test.describe('Products', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    
    const productsLink = page.locator('a:has-text("Product"), button:has-text("Product")').first();
    if (await productsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await productsLink.click();
      await page.waitForTimeout(2000);
    }
  });
  
  test('should display products list', async ({ page }) => {
    const hasProductsList = await page.locator('table, [role="table"], [class*="grid" i], [class*="list" i]').isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasProductsList).toBeTruthy();
  });
  
  test('should display product information', async ({ page }) => {
    const hasProductInfo = await page.locator('text=/product|sku|price|name/i').isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasProductInfo).toBeTruthy();
  });
  
  test('should search products', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      const hasResults = await page.locator('table, [role="table"], [class*="grid" i]').isVisible().catch(() => false);
      expect(hasResults).toBeTruthy();
    }
  });
  
  test('should filter products by category', async ({ page }) => {
    const categoryFilter = page.locator('select, [role="combobox"]').first();
    
    if (await categoryFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await categoryFilter.click();
      await page.waitForTimeout(500);
    }
  });
});
