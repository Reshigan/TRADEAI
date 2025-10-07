const { test, expect } = require('@playwright/test');

test.describe('Simple Smoke Test', () => {
  test('should load the login page', async ({ page }) => {
    console.log('🧪 Loading login page...');
    await page.goto('http://localhost:3001');
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForLoadState('load', { timeout: 10000 });
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    
    console.log('✅ Page loaded successfully!');
    
    // Check if email input exists
    const emailInput = await page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Email input found!');
  });

  test('should perform login', async ({ page, context }) => {
    console.log('🧪 Testing login...');
    
    // Clear all cookies and storage
    await context.clearCookies();
    
    // Listen to console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    
    // Listen to page errors
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    // Listen to network requests
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`API: ${response.status()} ${response.url()}`);
      }
    });
    
    // Force reload without cache
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    
    // Fill credentials
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('admin@tradeai.com');
    
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('admin123');
    
    console.log('📸 Before clicking login...');
    await page.screenshot({ path: 'before-login.png', fullPage: true });
    
    // Click login
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    
    console.log('⏳ Waiting for navigation...');
    await page.waitForTimeout(5000); // Wait 5 seconds to see what happens
    
    console.log('📸 After clicking login...');
    await page.screenshot({ path: 'after-login.png', fullPage: true });
    
    console.log('Current URL:', page.url());
    
    // Check for error messages
    const errorMsg = await page.locator('[class*="error"], [role="alert"]').first().textContent().catch(() => 'No error message');
    console.log('Error message:', errorMsg);
  });
});
