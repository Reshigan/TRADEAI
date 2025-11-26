const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://tradeai.gonxt.tech';
const TEST_USER = { email: 'admin@pomades.demo', password: 'Demo@123' };

test('Debug auth flow for Products vs Customers', async ({ page }) => {
  // Login
  await page.goto(`${BASE_URL}/`);
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('✅ Logged in, current URL:', page.url());
  
  // Check localStorage token
  const tokenAfterLogin = await page.evaluate(() => localStorage.getItem('token'));
  console.log('🔑 Token after login:', tokenAfterLogin ? 'EXISTS' : 'MISSING');
  
  // Navigate to Customers page (working)
  console.log('\n📍 Testing Customers page...');
  await page.goto(`${BASE_URL}/customers`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  console.log('🔗 Customers URL:', page.url());
  const customersHasMain = await page.locator('main').count();
  console.log('✅ Customers has main element:', customersHasMain > 0);
  
  // Navigate to Products page (failing)
  console.log('\n📍 Testing Products page...');
  await page.goto(`${BASE_URL}/products`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  console.log('🔗 Products URL:', page.url());
  const productsHasMain = await page.locator('main').count();
  console.log('❌ Products has main element:', productsHasMain > 0);
  
  // Check token again
  const tokenAfterProducts = await page.evaluate(() => localStorage.getItem('token'));
  console.log('🔑 Token after Products navigation:', tokenAfterProducts ? 'EXISTS' : 'MISSING');
});
