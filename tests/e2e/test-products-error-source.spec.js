const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://tradeai.gonxt.tech';
const TEST_USER = { email: 'admin@pomades.demo', password: 'Demo@123' };

test('Find exact source of Products page error', async ({ page }) => {
  // Enable console logging
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('❌ PAGE ERROR:', error.message);
    console.log('Stack:', error.stack);
  });

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
  console.log('\n=== ERROR BOUNDARY ===');
  console.log('Error boundary shown:', errorBoundary > 0);
  
  // Get the full page HTML to see what's rendered
  const bodyHTML = await page.locator('body').innerHTML();
  console.log('\n=== PAGE HTML (first 500 chars) ===');
  console.log(bodyHTML.substring(0, 500));
  
  // Check for specific error text
  const hasReactError = bodyHTML.includes('Minified React error');
  console.log('\n=== REACT ERROR CHECK ===');
  console.log('Has React error:', hasReactError);
  
  if (hasReactError) {
    // Extract the error URL
    const errorMatch = bodyHTML.match(/https:\/\/reactjs\.org\/docs\/error-decoder\.html[^"'\s]*/);
    if (errorMatch) {
      console.log('Error URL:', errorMatch[0]);
    }
  }
  
  // Print all errors
  console.log('\n=== ALL ERRORS ===');
  errors.forEach((err, i) => {
    console.log(`Error ${i + 1}:`, err);
  });
  
  // Print console messages
  console.log('\n=== CONSOLE MESSAGES (last 10) ===');
  consoleMessages.slice(-10).forEach((msg, i) => {
    console.log(`${msg.type}: ${msg.text}`);
  });
});
