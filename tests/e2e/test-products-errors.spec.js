const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://tradeai.gonxt.tech';
const TEST_USER = { email: 'admin@pomades.demo', password: 'Demo@123' };

test('Debug Products page errors in detail', async ({ page }) => {
  const consoleMessages = [];
  const errors = [];
  const requests = [];
  
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  page.on('requestfailed', request => {
    requests.push(`FAILED: ${request.url()} - ${request.failure().errorText}`);
  });
  
  // Login
  await page.goto(`${BASE_URL}/`);
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  console.log('✅ Logged in');
  
  // Clear previous messages
  consoleMessages.length = 0;
  errors.length = 0;
  requests.length = 0;
  
  // Navigate to Products page
  await page.goto(`${BASE_URL}/products`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  console.log('\n📋 Console messages on Products page:');
  consoleMessages.forEach(msg => console.log(msg));
  
  console.log('\n❌ JavaScript errors:');
  if (errors.length === 0) {
    console.log('No JavaScript errors');
  } else {
    errors.forEach(err => console.log(err));
  }
  
  console.log('\n🌐 Failed requests:');
  if (requests.length === 0) {
    console.log('No failed requests');
  } else {
    requests.forEach(req => console.log(req));
  }
  
  // Check what's actually rendered
  const bodyContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return 'No root element';
    
    const main = document.querySelector('main');
    if (!main) return 'No main element, root innerHTML: ' + root.innerHTML.substring(0, 500);
    
    return 'Main element exists with content: ' + main.innerHTML.substring(0, 500);
  });
  
  console.log('\n📄 Body content:', bodyContent);
  
  // Check if we're still on products page
  console.log('\n🔗 Current URL:', page.url());
  console.log('🔄 Still on products page:', page.url().includes('/products'));
});
