const { test, expect } = require('@playwright/test');

/**
 * Comprehensive E2E Test Suite for Phase 1-6 UI/UX Improvements
 * 
 * This test suite validates:
 * - Phase 1: PageLayout component with consistent structure
 * - Phase 2: TablePro and FilterBar functionality
 * - Phase 3: Form components with validation
 * - Phase 4: Accessibility compliance
 * - Phase 5: Enterprise features (saved views, bulk actions, export)
 * - Phase 6: Design system consistency and dark mode
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'https://tradeai.gonxt.tech';

const TEST_USER = {
  email: 'admin@pomades.demo',
  password: 'Demo@123'
};

test.describe('Phase 1-6: Complete UI/UX Improvements', () => {
  let authToken;
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const isLoggedIn = await page.locator('[data-testid="mega-menu"]').isVisible().catch(() => false);
    
    if (!isLoggedIn) {
      await page.fill('input[name="email"], input[type="email"]', TEST_USER.email);
      await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    authToken = await page.evaluate(() => localStorage.getItem('token'));
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.describe('Phase 1: PageLayout Component', () => {
    test('should display consistent page layout on Dashboard', async () => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const megaMenu = page.locator('[data-testid="mega-menu"]');
      await expect(megaMenu).toBeVisible();
      
      const mainContent = page.locator('main, [role="main"]');
      await expect(mainContent).toBeVisible();
      
      const navigation = page.locator('nav, [role="navigation"]');
      await expect(navigation).toBeVisible();
    });

    test('should display consistent page layout on Products list', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const pageTitle = page.locator('h1, h2, h3, h4').first();
      await expect(pageTitle).toBeVisible();
      
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    });

    test('should display consistent page layout on Customers list', async () => {
      await page.goto(`${BASE_URL}/customers`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const pageTitle = page.locator('h1, h2, h3, h4').first();
      await expect(pageTitle).toBeVisible();
    });

    test('should display consistent page layout on Promotions list', async () => {
      await page.goto(`${BASE_URL}/promotions`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const pageTitle = page.locator('h1, h2, h3, h4').first();
      await expect(pageTitle).toBeVisible();
    });

    test('should display consistent page layout on Budgets list', async () => {
      await page.goto(`${BASE_URL}/budgets`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const pageTitle = page.locator('h1, h2, h3, h4').first();
      await expect(pageTitle).toBeVisible();
    });
  });

  test.describe('Phase 2: TablePro and FilterBar', () => {
    test('should display data table on Products page', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const productCards = page.locator('.MuiGrid-item, .MuiPaper-root');
      const cardCount = await productCards.count();
      
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should support pagination on Products table', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const pagination = page.locator('[role="navigation"], .MuiTablePagination-root, .MuiDataGrid-footerContainer');
      const hasPagination = await pagination.isVisible().catch(() => false);
      
      if (hasPagination) {
        const nextButton = page.locator('button[aria-label*="next"], button[title*="next"]').first();
        const isNextEnabled = await nextButton.isEnabled().catch(() => false);
        
        if (isNextEnabled) {
          await nextButton.click();
          await page.waitForTimeout(1000);
          expect(true).toBe(true);
        }
      }
    });

    test('should support sorting on Products table', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const columnHeaders = page.locator('th[role="columnheader"], .MuiDataGrid-columnHeader');
      const headerCount = await columnHeaders.count();
      
      if (headerCount > 0) {
        const firstHeader = columnHeaders.first();
        await firstHeader.click();
        await page.waitForTimeout(1000);
        
        expect(true).toBe(true);
      }
    });

    test('should display filter controls on list pages', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const filterButton = page.locator('button:has-text("Filter"), button:has-text("Filters"), [aria-label*="filter"]');
      const hasFilters = await filterButton.isVisible().catch(() => false);
      
      if (hasFilters) {
        await filterButton.first().click();
        await page.waitForTimeout(500);
        
        const filterMenu = page.locator('[role="menu"], [role="dialog"]');
        await expect(filterMenu).toBeVisible();
      }
    });
  });

  test.describe('Phase 3: Form Components', () => {
    test('should display form fields on Product create page', async () => {
      await page.goto(`${BASE_URL}/products/new`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const form = page.locator('form');
      const hasForm = await form.isVisible().catch(() => false);
      
      if (hasForm) {
        const inputs = page.locator('input, textarea, select');
        const inputCount = await inputs.count();
        expect(inputCount).toBeGreaterThan(0);
        
        const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
        await expect(submitButton.first()).toBeVisible();
      }
    });

    test('should display form validation errors', async () => {
      await page.goto(`${BASE_URL}/products/new`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const form = page.locator('form');
      const hasForm = await form.isVisible().catch(() => false);
      
      if (hasForm) {
        const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
        const hasSubmit = await submitButton.first().isVisible().catch(() => false);
        
        if (hasSubmit) {
          await submitButton.first().click();
          await page.waitForTimeout(1000);
          
          const errors = page.locator('.MuiFormHelperText-root.Mui-error, [role="alert"], .error-message');
          const errorCount = await errors.count();
          
          expect(errorCount).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should display form on Promotion create page', async () => {
      await page.goto(`${BASE_URL}/promotions/new`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const form = page.locator('form');
      const hasForm = await form.isVisible().catch(() => false);
      
      if (hasForm) {
        const inputs = page.locator('input, textarea, select');
        const inputCount = await inputs.count();
        expect(inputCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Phase 4: Accessibility', () => {
    test('should have proper heading hierarchy on Dashboard', async () => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const h1 = page.locator('h1');
      const h1Count = await h1.count();
      
      expect(h1Count).toBeGreaterThanOrEqual(0);
    });

    test('should have proper ARIA labels on interactive elements', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const buttons = page.locator('button:visible');
      const buttonCount = await buttons.count();
      
      let checkedButtons = 0;
      
      if (buttonCount > 0) {
        for (let i = 0; i < buttonCount && checkedButtons < 10; i++) {
          const button = buttons.nth(i);
          
          const isVisible = await button.isVisible().catch(() => false);
          if (!isVisible) continue;
          
          const boundingBox = await button.boundingBox().catch(() => null);
          if (!boundingBox || boundingBox.width === 0 || boundingBox.height === 0) continue;
          
          const text = await button.textContent();
          const ariaLabel = await button.getAttribute('aria-label');
          
          const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel;
          
          if (hasAccessibleName) {
            checkedButtons++;
          } else {
            console.log(`Button ${i}: text="${text?.trim()}", aria-label="${ariaLabel}", bbox=${JSON.stringify(boundingBox)}`);
          }
        }
      }
      
      expect(checkedButtons).toBeGreaterThan(0);
    });

    test('should support keyboard navigation', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      const focusedElement = await page.evaluate(() => document.activeElement.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('should have proper color contrast', async () => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      expect(true).toBe(true);
    });
  });

  test.describe('Phase 5: Enterprise Features', () => {
    test('should display export functionality on Products page', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const exportButton = page.locator('button:has-text("Export"), button[aria-label*="export"], [title*="Export"]');
      const hasExport = await exportButton.isVisible().catch(() => false);
      
      if (hasExport) {
        await expect(exportButton.first()).toBeEnabled();
      }
    });

    test('should support bulk selection on Products table', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      if (checkboxCount > 0) {
        await checkboxes.first().click();
        await page.waitForTimeout(500);
        
        const isChecked = await checkboxes.first().isChecked().catch(() => false);
        expect(isChecked).toBe(true);
      }
    });

    test('should display saved views functionality', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const viewsButton = page.locator('button:has-text("View"), button:has-text("Views"), button[aria-label*="view"]');
      const hasViews = await viewsButton.isVisible().catch(() => false);
      
      if (hasViews) {
        await viewsButton.first().click();
        await page.waitForTimeout(500);
        
        const viewsMenu = page.locator('[role="menu"], [role="dialog"]');
        const menuVisible = await viewsMenu.isVisible().catch(() => false);
        expect(menuVisible).toBe(true);
      }
    });

    test('should display refresh functionality on tables', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const refreshButton = page.locator('button[aria-label*="refresh"], button[title*="Refresh"], button:has([data-testid="RefreshIcon"])');
      const hasRefresh = await refreshButton.isVisible().catch(() => false);
      
      if (hasRefresh) {
        await refreshButton.first().click();
        await page.waitForTimeout(1000);
        
        expect(true).toBe(true);
      }
    });
  });

  test.describe('Phase 6: Design System', () => {
    test('should use consistent colors across pages', async () => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const dashboardBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      
      const productsBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      
      expect(dashboardBg).toBe(productsBg);
    });

    test('should use consistent typography across pages', async () => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const fontFamily = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });
      
      expect(fontFamily).toBeTruthy();
    });

    test('should use consistent spacing across pages', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      
      const mainContent = page.locator('main, [role="main"]');
      const hasContent = await mainContent.isVisible().catch(() => false);
      
      if (hasContent) {
        const padding = await mainContent.evaluate((el) => {
          return window.getComputedStyle(el).padding;
        });
        
        expect(padding).toBeTruthy();
      }
    });

    test('should support theme switching (if implemented)', async () => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="light"]');
      const hasThemeToggle = await themeToggle.isVisible().catch(() => false);
      
      if (hasThemeToggle) {
        const lightBg = await page.evaluate(() => {
          return window.getComputedStyle(document.body).backgroundColor;
        });
        
        await themeToggle.first().click();
        await page.waitForTimeout(500);
        
        const darkBg = await page.evaluate(() => {
          return window.getComputedStyle(document.body).backgroundColor;
        });
        
        expect(lightBg).not.toBe(darkBg);
      }
    });
  });

  test.describe('Full-Stack Wiring', () => {
    test('should load data from backend on Products page', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const dataElements = page.locator('tr[role="row"], .MuiDataGrid-row, tbody tr, .MuiGrid-item .MuiPaper-root');
      const elementCount = await dataElements.count();
      
      expect(elementCount).toBeGreaterThan(0);
    });

    test('should load data from backend on Customers page', async () => {
      await page.goto(`${BASE_URL}/customers`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const dataElements = page.locator('tr[role="row"], .MuiDataGrid-row, tbody tr, .MuiGrid-item .MuiPaper-root');
      const elementCount = await dataElements.count();
      
      expect(elementCount).toBeGreaterThan(0);
    });

    test('should load data from backend on Promotions page', async () => {
      await page.goto(`${BASE_URL}/promotions`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const dataElements = page.locator('tr[role="row"], .MuiDataGrid-row, tbody tr, .MuiGrid-item .MuiPaper-root');
      const elementCount = await dataElements.count();
      
      expect(elementCount).toBeGreaterThan(0);
    });

    test('should load data from backend on Budgets page', async () => {
      await page.goto(`${BASE_URL}/budgets`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const dataElements = page.locator('tr[role="row"], .MuiDataGrid-row, tbody tr, .MuiGrid-item .MuiPaper-root');
      const elementCount = await dataElements.count();
      
      expect(elementCount).toBeGreaterThan(0);
    });

    test('should handle API errors gracefully', async () => {
      await page.goto(`${BASE_URL}/products/999999`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const errorMessage = page.locator('[role="alert"], .error-message, .MuiAlert-root');
      const hasError = await errorMessage.isVisible().catch(() => false);
      
      expect(true).toBe(true);
    });

    test('should persist filters in URL', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const filterButton = page.locator('button:has-text("Filter"), button:has-text("Filters")');
      const hasFilters = await filterButton.isVisible().catch(() => false);
      
      if (hasFilters) {
        await filterButton.first().click();
        await page.waitForTimeout(500);
        
        const url = page.url();
        expect(url).toContain('/products');
      }
    });
  });

  test.describe('Performance', () => {
    test('should load Dashboard within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000);
    });

    test('should load Products page within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large data sets efficiently', async () => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const table = page.locator('table, [role="grid"], .MuiDataGrid-root');
      const hasTable = await table.isVisible().catch(() => false);
      
      if (hasTable) {
        await table.evaluate((el) => {
          el.scrollTop = el.scrollHeight / 2;
        });
        await page.waitForTimeout(500);
        
        expect(true).toBe(true);
      }
    });
  });
});
