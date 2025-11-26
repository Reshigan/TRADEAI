const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://tradeai.gonxt.tech';
const TEST_USER = { email: 'admin@pomades.demo', password: 'Demo@123' };

test('Get console errors from Products page', async ({ page }) => {
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.toString());
  });
  
  // Login
  await page.goto(`${BASE_URL}/`);
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Clear previous messages
  consoleMessages.length = 0;
  errors.length = 0;
  
  // Navigate to Products page
  await page.goto(`${BASE_URL}/products`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  console.log('\n=== CONSOLE ERROR MESSAGES ===');
  if (consoleMessages.length === 0) {
    console.log('No console error messages');
  } else {
    consoleMessages.forEach(msg => console.log(msg));
  }
  
  console.log('\n=== PAGE ERRORS ===');
  if (errors.length === 0) {
    console.log('No page errors');
  } else {
    errors.forEach(err => console.log(err));
  }
});
