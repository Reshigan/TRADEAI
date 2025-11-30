/**
 * Accessibility Tests
 * Tests for WCAG compliance and accessibility
 * @tags @ui:accessibility
 */

const { test, expect } = require('@playwright/test');
const { loginUI, BASE_URL } = require('../../helpers/auth');
const AxeBuilder = require('@axe-core/playwright').default;

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUI(page, 'admin');
  });

  const criticalPages = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Budgets', path: '/budgets' },
    { name: 'Promotions', path: '/promotions' },
    { name: 'Products', path: '/products' },
    { name: 'Customers', path: '/customers' },
    { name: 'Analytics', path: '/analytics' }
  ];

  for (const pageInfo of criticalPages) {
    test(`should have no critical accessibility violations on ${pageInfo.name}`, async ({ page }) => {
      await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle', timeout: 30000 });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      if (criticalViolations.length > 0) {
        console.log(`Accessibility violations on ${pageInfo.name}:`, 
          JSON.stringify(criticalViolations, null, 2));
      }

      expect(criticalViolations, `${pageInfo.name} should have no critical accessibility violations`).toHaveLength(0);
    });
  }

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    const h1 = await page.locator('h1').count();
    expect(h1, 'Page should have at least one h1').toBeGreaterThan(0);

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingLevels = await Promise.all(
      headings.map(h => h.evaluate(el => parseInt(el.tagName.substring(1))))
    );

    expect(headingLevels[0], 'First heading should be h1').toBe(1);
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/budgets`);

    const createButton = await page.locator('button:has-text("Create"), button:has-text("New")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(1000);

      const inputs = await page.locator('input:not([type="hidden"])').all();
      
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
        const isLabeled = hasLabel || ariaLabel || ariaLabelledBy;
        
        expect(isLabeled, 'Input should have proper label').toBeTruthy();
      }
    }
  });

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    await page.keyboard.press('Tab');
    
    const focusedElement = await page.locator(':focus').first();
    expect(await focusedElement.count()).toBeGreaterThan(0);

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.locator(':focus').first();
      expect(await focused.count(), 'Should have focused element after Tab').toBeGreaterThan(0);
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .disableRules(['region', 'landmark-one-main']) // Focus on color contrast
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id.includes('color-contrast')
    );

    expect(contrastViolations, 'Should have no color contrast violations').toHaveLength(0);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    const buttons = await page.locator('button, [role="button"]').all();
    
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      expect(ariaLabel || text?.trim(), 'Button should have accessible name').toBeTruthy();
    }
  });
});
