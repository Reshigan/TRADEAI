const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://tradeai.gonxt.tech';
const TEST_USER = { email: 'admin@pomades.demo', password: 'Demo@123' };

test('Debug Products page rendering', async ({ page }) => {
  // Login
  await page.goto(`${BASE_URL}/`);
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  
  // Navigate to Products page
  await page.goto(`${BASE_URL}/products`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/products-page-debug.png', fullPage: true });
  
  // Check for main element
  const mainElements = await page.locator('main').count();
  console.log('🔍 Main elements found:', mainElements);
  
  // Check for Box component
  const boxElements = await page.locator('div[class*="MuiBox"]').count();
  console.log('🔍 Box elements found:', boxElements);
  
  // Check for product cards
  const productCards = await page.locator('.MuiGrid-container .MuiGrid-item .MuiPaper-root').count();
  console.log('🔍 Product cards found:', productCards);
  
  // Check page content
  const pageText = await page.textContent('body');
  console.log('📄 Page contains "Products":', pageText.includes('Products'));
  console.log('📄 Page contains "No products":', pageText.includes('No products'));
  
  // Check if loading
  const loadingSpinner = await page.locator('svg[class*="MuiCircularProgress"]').count();
  console.log('⏳ Loading spinner visible:', loadingSpinner > 0);
  
  // Get HTML structure
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  console.log('📄 Body HTML length:', bodyHTML.length);
  console.log('📄 Contains <main>:', bodyHTML.includes('<main'));
});
