const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://tradeai.gonxt.tech';
const TEST_USER = { email: 'admin@pomades.demo', password: 'Demo@123' };

test('Test Products page with cache busting', async ({ page }) => {
  // Clear all cache and cookies
  await page.context().clearCookies();
  await page.context().clearPermissions();
  
  // Login
  await page.goto(`${BASE_URL}/`);
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('✅ Logged in');
  
  // Navigate to Products page with cache busting
  await page.goto(`${BASE_URL}/products?_=${Date.now()}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  // Check for main element
  const mainElements = await page.locator('main').count();
  console.log('🔍 Main elements found:', mainElements);
  
  // Check for product cards
  const productCards = await page.locator('.MuiGrid-container .MuiGrid-item .MuiPaper-root').count();
  console.log('🔍 Product cards found:', productCards);
  
  // Check page title
  const pageTitle = await page.locator('h4, h5, h6').filter({ hasText: 'Products' }).count();
  console.log('📄 Products title found:', pageTitle);
  
  // Check for error boundary
  const errorIcon = await page.locator('[data-testid="ErrorIcon"]').count();
  console.log('❌ Error icon visible:', errorIcon > 0);
  
  // Get page text
  const bodyText = await page.textContent('body');
  console.log('📄 Page contains "Products":', bodyText.includes('Products'));
  console.log('📄 Page contains "No products":', bodyText.includes('No products'));
  console.log('📄 Page contains "Something went wrong":', bodyText.includes('Something went wrong'));
});
