const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://tradeai.gonxt.tech';
const TEST_USER = {
  email: 'admin@pomades.demo',
  password: 'Demo@123'
};

test('Debug Dashboard rendering', async ({ page }) => {
  // Login
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[name="email"], input[type="email"]', TEST_USER.email);
  await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('✅ Login successful');
  
  // Go to dashboard
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/dashboard_screenshot.png', fullPage: true });
  console.log('📸 Screenshot saved');
  
  // Check what elements exist
  const html = await page.content();
  const hasMegaMenu = html.includes('data-testid="mega-menu"');
  const hasMain = html.includes('<main');
  
  console.log('🔍 Has mega-menu:', hasMegaMenu);
  console.log('🔍 Has main element:', hasMain);
  
  // Try to find what IS on the page
  const bodyText = await page.locator('body').textContent();
  console.log('📄 Page text (first 200 chars):', bodyText.substring(0, 200));
});
