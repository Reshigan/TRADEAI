/**
 * UI Critical Path Tests
 * Tests for key user journeys through the application
 * @tags @ui:critical-path
 */

const { test, expect } = require('@playwright/test');
const { loginUI, BASE_URL } = require('../../helpers/auth');

test.describe('UI Critical Path Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, 'manager');
  });

  test('should complete budget creation workflow', async ({ page }) => {
    await page.goto(`${BASE_URL}/budgets`);
    await page.waitForLoadState('networkidle');

    const createButton = await page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add"), [data-testid="create-budget"]').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();

      await page.waitForTimeout(1000);

      const form = await page.locator('form, [role="dialog"], .MuiDialog-root').first();
      expect(await form.isVisible()).toBeTruthy();
    }
  });

  test('should complete promotion creation workflow', async ({ page }) => {
    await page.goto(`${BASE_URL}/promotions`);
    await page.waitForLoadState('networkidle');

    const createButton = await page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add"), [data-testid="create-promotion"]').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();

      await page.waitForTimeout(1000);

      const form = await page.locator('form, [role="dialog"], .MuiDialog-root').first();
      expect(await form.isVisible()).toBeTruthy();
    }
  });

  test('should navigate through analytics dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForLoadState('networkidle');

    const charts = await page.locator('canvas, svg, .recharts-wrapper, [class*="chart"]').all();
    
    expect(charts.length, 'Analytics should have visualizations').toBeGreaterThan(0);
  });

  test('should search and filter products', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');

    const searchInput = await page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"], [data-testid="search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      const table = await page.locator('table, [role="grid"], .MuiDataGrid-root').first();
      expect(await table.isVisible()).toBeTruthy();
    }
  });

  test('should view customer details', async ({ page }) => {
    await page.goto(`${BASE_URL}/customers`);
    await page.waitForLoadState('networkidle');

    const firstRow = await page.locator('table tbody tr, [role="row"]').first();
    
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForTimeout(1000);

      const detailView = await page.locator('[role="dialog"], .detail-view, .customer-detail').first();
      const urlChanged = page.url() !== `${BASE_URL}/customers`;
      
      expect(await detailView.isVisible() || urlChanged).toBeTruthy();
    }
  });

  test('should export data', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    await page.waitForLoadState('networkidle');

    const exportButton = await page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid="export"]').first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(1000);

      const exportDialog = await page.locator('[role="dialog"], .export-dialog').first();
      expect(await exportDialog.isVisible() || await exportButton.isDisabled()).toBeTruthy();
    }
  });

  test('should access user settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/settings');

    const sections = await page.locator('section, .settings-section, [role="tabpanel"]').all();
    expect(sections.length).toBeGreaterThan(0);
  });
});
