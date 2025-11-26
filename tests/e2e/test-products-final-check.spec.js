const { test, expect } = require('@playwright/test');

test.describe('Products Page Final Check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://tradeai.gonxt.tech/login');
    await page.fill('input[type="email"]', 'admin@pomades.demo');
    await page.fill('input[type="password"]', 'Demo@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Logged in');
  });

  test('Check for React Error #31 on Products page', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('🔍 Navigating to Products page...');
    await page.goto('https://tradeai.gonxt.tech/products');
    await page.waitForTimeout(3000);

    console.log('\n=== CONSOLE ERRORS ===');
    consoleErrors.forEach(err => console.log(err));

    console.log('\n=== PAGE CONTENT CHECK ===');
    const errorBoundary = await page.locator('text=/error boundary|something went wrong/i').count();
    console.log(`Error boundary shown: ${errorBoundary > 0}`);

    const mainElement = await page.locator('main').count();
    console.log(`Main element found: ${mainElement > 0}`);

    const productCards = await page.locator('[data-testid="product-card"]').count();
    console.log(`Product cards found: ${productCards}`);

    const anyText = await page.locator('text=/products/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Any "Products" text visible: ${anyText}`);

    // Take screenshot
    await page.screenshot({ path: '/tmp/products-final-check.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/products-final-check.png');

    // Check for React Error #31
    const hasReactError31 = consoleErrors.some(err => err.includes('Objects are not valid as a React child'));
    console.log(`\nReact Error #31 present: ${hasReactError31}`);

    expect(hasReactError31).toBe(false);
  });
});
