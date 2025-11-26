const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://tradeai.gonxt.tech';
const TEST_USER = { email: 'admin@pomades.demo', password: 'Demo@123' };

test('Debug Products page console errors', async ({ page }) => {
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
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
  
  console.log('📋 Console messages:', consoleMessages.slice(-10));
  console.log('❌ Errors:', errors);
  
  // Check if React root exists
  const rootExists = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      exists: !!root,
      innerHTML: root ? root.innerHTML.substring(0, 200) : 'No root element'
    };
  });
  console.log('🔍 React root:', rootExists);
  
  // Check current URL
  const currentURL = page.url();
  console.log('🔗 Current URL:', currentURL);
  
  // Check if redirected
  console.log('🔄 Was redirected:', currentURL !== `${BASE_URL}/products`);
});
