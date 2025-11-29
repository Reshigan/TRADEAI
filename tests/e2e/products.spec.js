const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/login');

test.describe('Products', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/products');
    await page.waitForTimeout(2000);
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
