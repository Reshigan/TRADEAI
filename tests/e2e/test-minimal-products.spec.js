const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://tradeai.gonxt.tech';
const TEST_USER = { email: 'admin@pomades.demo', password: 'Demo@123' };

test('Test minimal Products page', async ({ page }) => {
  // Login
  await page.goto(`${BASE_URL}/`);
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('✅ Logged in');
  
  // Navigate to Products page
  console.log('\n🔍 Navigating to Products page...');
  await page.goto(`${BASE_URL}/products`);
  await page.waitForTimeout(3000);
  
  // Check if error boundary is shown
  const errorBoundary = await page.locator('text=Something went wrong').count();
  console.log('\n=== ERROR BOUNDARY CHECK ===');
  console.log('Error boundary shown:', errorBoundary > 0);
  
  // Check if main element exists
  const mainElement = await page.locator('main').count();
  console.log('\n=== MAIN ELEMENT CHECK ===');
  console.log('Main element found:', mainElement > 0);
  
  // Check if minimal test text is visible
  const minimalText = await page.locator('text=Products - Minimal Test').count();
  console.log('\n=== MINIMAL TEXT CHECK ===');
  console.log('Minimal text found:', minimalText > 0);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/products-minimal-test.png', fullPage: true });
  console.log('\n📸 Screenshot saved to /tmp/products-minimal-test.png');
  
  // Assertions
  expect(errorBoundary).toBe(0);
  expect(mainElement).toBeGreaterThan(0);
  expect(minimalText).toBeGreaterThan(0);
});
