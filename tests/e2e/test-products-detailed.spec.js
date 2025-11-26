const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://tradeai.gonxt.tech';
const TEST_USER = { email: 'admin@pomades.demo', password: 'Demo@123' };

test('Detailed Products page inspection', async ({ page }) => {
  // Login
  await page.goto(`${BASE_URL}/`);
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('✅ Logged in');
  
  // Navigate to Products page
  await page.goto(`${BASE_URL}/products`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  // Check for main element
  const mainElements = await page.locator('main').count();
  console.log('🔍 Main elements found:', mainElements);
  
  // Check for Box with component="main"
  const boxMain = await page.locator('Box[component="main"]').count();
  console.log('🔍 Box[component="main"] found:', boxMain);
  
  // Check for any Box elements
  const boxes = await page.locator('div.MuiBox-root').count();
  console.log('🔍 MuiBox-root elements found:', boxes);
  
  // Check page title
  const pageTitle = await page.locator('h4, h5, h6').filter({ hasText: /products/i }).count();
  console.log('📄 Products title found:', pageTitle);
  
  // Check for error boundary
  const errorIcon = await page.locator('[data-testid="ErrorIcon"]').count();
  console.log('❌ Error icon visible:', errorIcon > 0);
  
  // Get body HTML
  const bodyHTML = await page.locator('body').innerHTML();
  console.log('📄 Body HTML length:', bodyHTML.length);
  console.log('📄 Body contains "Products":', bodyHTML.includes('Products'));
  console.log('📄 Body contains "Something went wrong":', bodyHTML.includes('Something went wrong'));
  console.log('📄 Body contains "MegaMenu":', bodyHTML.includes('MegaMenu') || bodyHTML.includes('mega-menu'));
  
  // Check if Layout is rendered
  const layoutBox = await page.locator('div[style*="display: flex"]').count();
  console.log('📦 Flex containers found:', layoutBox);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/products-page-debug.png', fullPage: true });
  console.log('📸 Screenshot saved to /tmp/products-page-debug.png');
});
