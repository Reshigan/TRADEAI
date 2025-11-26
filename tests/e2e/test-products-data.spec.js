const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://tradeai.gonxt.tech';
const TEST_USER = { email: 'admin@pomades.demo', password: 'Demo@123' };

test('Check products API data structure', async ({ page }) => {
  // Login
  await page.goto(`${BASE_URL}/`);
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('✅ Logged in');
  
  // Intercept API call to products
  const response = await page.goto(`${BASE_URL}/api/products`, {
    waitUntil: 'networkidle'
  });
  
  const data = await response.json();
  console.log('\n=== PRODUCTS API RESPONSE ===');
  console.log('Success:', data.success);
  console.log('Data length:', data.data?.length || 0);
  
  if (data.data && data.data.length > 0) {
    const firstProduct = data.data[0];
    console.log('\n=== FIRST PRODUCT ===');
    console.log('Product keys:', Object.keys(firstProduct));
    console.log('Product name:', firstProduct.productName);
    console.log('Product category:', firstProduct.category);
    console.log('Category type:', typeof firstProduct.category);
    console.log('Category is object:', typeof firstProduct.category === 'object');
    if (typeof firstProduct.category === 'object') {
      console.log('Category keys:', Object.keys(firstProduct.category));
      console.log('Category value:', JSON.stringify(firstProduct.category));
    }
  }
});
