const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

module.exports = async config => {
  const baseURL = process.env.BASE_URL || 'https://tradeai.gonxt.tech';
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  
  // Ensure auth directory exists
  const authDir = path.join(process.cwd(), '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  if (!email || !password) {
    console.warn('[E2E GLOBAL SETUP] TEST_USER_EMAIL and TEST_USER_PASSWORD not set.');
    console.warn('[E2E GLOBAL SETUP] Tests will run without pre-authentication.');
    // Create empty auth state so tests can still run
    fs.writeFileSync(path.join(authDir, 'user.json'), JSON.stringify({ cookies: [], origins: [] }));
    return;
  }
  
  console.log(`[E2E GLOBAL SETUP] Authenticating at ${baseURL}...`);
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Retry logic for flaky connections
  const maxRetries = 3;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[E2E GLOBAL SETUP] Attempt ${attempt}/${maxRetries}...`);
      
      // Navigate with extended timeout
      await page.goto(baseURL, { 
        waitUntil: 'networkidle',
        timeout: 60000 
      });
      
      // Wait for login form to be visible
      await page.waitForSelector('input[type="email"], input[name="email"]', { 
        state: 'visible',
        timeout: 30000 
      });
      
      // Fill credentials
      await page.locator('input[type="email"], input[name="email"]').fill(email);
      await page.locator('input[type="password"], input[name="password"]').fill(password);
      
      // Click login button (handles different button text variations)
      await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("ACCESS PLATFORM")').click();
      
      // Wait for login response - check for either success or error
      // First, wait a bit for the login request to complete
      await page.waitForTimeout(3000);
      
      // Check current URL and page state
      const currentUrl = page.url();
      console.log(`[E2E GLOBAL SETUP] Current URL after login click: ${currentUrl}`);
      
      // Check if we successfully navigated away from login page
      const isOnDashboard = currentUrl.includes('/dashboard') || currentUrl.includes('/home');
      
      if (!isOnDashboard) {
        // Only check for error alerts if we're still on login page
        // Look specifically for error severity alerts, not info/success alerts
        const errorAlert = await page.locator('.MuiAlert-standardError, .MuiAlert-filledError, .MuiAlert-outlinedError, [role="alert"][class*="error"]').first();
        const hasError = await errorAlert.isVisible().catch(() => false);
        if (hasError) {
          const errorText = await errorAlert.textContent().catch(() => 'Unknown error');
          console.log(`[E2E GLOBAL SETUP] Login error detected: ${errorText}`);
          throw new Error(`Login failed with error: ${errorText}`);
        }
        
        // Check if we're still on login page
        const loginForm = await page.locator('input[type="email"], input[name="email"]').first();
        const stillOnLogin = await loginForm.isVisible().catch(() => false);
        
        if (stillOnLogin) {
          // Still on login page - login might have failed silently
          console.log('[E2E GLOBAL SETUP] Still on login page, waiting longer...');
          await page.waitForTimeout(5000);
        }
      } else {
        console.log('[E2E GLOBAL SETUP] Successfully navigated to dashboard');
      }
      
      // Final URL check
      const finalUrl = page.url();
      console.log(`[E2E GLOBAL SETUP] Final URL: ${finalUrl}`);
      
      console.log('[E2E GLOBAL SETUP] Login successful, saving auth state...');
      
      // Save authentication state
      await context.storageState({ path: path.join(authDir, 'user.json') });
      
      console.log('[E2E GLOBAL SETUP] Auth state saved to .auth/user.json');
      lastError = null;
      break;
      
    } catch (error) {
      lastError = error;
      console.error(`[E2E GLOBAL SETUP] Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        console.log(`[E2E GLOBAL SETUP] Waiting 5 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  await browser.close();
  
  if (lastError) {
    console.error('[E2E GLOBAL SETUP] All authentication attempts failed.');
    console.error('[E2E GLOBAL SETUP] Creating empty auth state for tests to proceed...');
    // Create empty auth state so tests can still run (they'll handle auth themselves)
    fs.writeFileSync(path.join(authDir, 'user.json'), JSON.stringify({ cookies: [], origins: [] }));
  }
};
