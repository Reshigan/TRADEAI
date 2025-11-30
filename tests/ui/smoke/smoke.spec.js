/**
 * UI Smoke Tests
 * Quick tests to verify all major pages load without errors
 * @tags @ui:smoke
 */

const { test, expect } = require('@playwright/test');
const { loginUI, BASE_URL } = require('../../helpers/auth');

test.describe('UI Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, 'admin');
  });

  const pages = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Budgets', path: '/budgets' },
    { name: 'Promotions', path: '/promotions' },
    { name: 'Products', path: '/products' },
    { name: 'Customers', path: '/customers' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Reports', path: '/reports' },
    { name: 'Settings', path: '/settings' }
  ];

  for (const pageInfo of pages) {
    test(`should load ${pageInfo.name} page without errors`, async ({ page }) => {
      const consoleErrors = [];
      const networkErrors = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('response', response => {
        if (response.status() >= 500) {
          networkErrors.push(`${response.status()} ${response.url()}`);
        }
      });

      await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle', timeout: 30000 });

      await page.waitForLoadState('domcontentloaded');

      expect(page.url()).toContain(pageInfo.path);

      expect(networkErrors, `${pageInfo.name} should not have 5xx errors`).toHaveLength(0);

      if (consoleErrors.length > 0) {
        console.log(`Console errors on ${pageInfo.name}:`, consoleErrors);
      }
    });
  }

  test('should have working navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    const nav = await page.locator('nav, [role="navigation"], .MuiDrawer-root').first();
    expect(await nav.isVisible()).toBeTruthy();
  });

  test('should display user information', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    const userMenu = await page.locator('[data-testid="user-menu"], .user-menu, [aria-label*="user"], [aria-label*="account"]').first();
    
    expect(await userMenu.count()).toBeGreaterThan(0);
  });

  test('should not have broken images', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    const images = await page.locator('img').all();
    
    for (const img of images) {
      const naturalWidth = await img.evaluate(el => el.naturalWidth);
      const src = await img.getAttribute('src');
      
      if (src && !src.startsWith('data:') && src !== '') {
        expect(naturalWidth, `Image should load: ${src}`).toBeGreaterThan(0);
      }
    }
  });

  test('should have reasonable page load time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime, 'Page load time should be reasonable').toBeLessThan(10000);
  });
});
