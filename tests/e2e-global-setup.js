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
      
      // Wait for successful login - either URL change or dashboard content appearing
      // Some SPAs don't change the URL immediately, so we check for multiple indicators
      await Promise.race([
        // Option 1: URL changes to dashboard or other authenticated page
        page.waitForURL(url => {
          const pathname = new URL(url).pathname;
          return pathname.includes('/dashboard') || pathname.includes('/home') || 
                 (pathname !== '/' && pathname !== '/login' && pathname.length > 1);
        }, { timeout: 30000 }),
        // Option 2: Dashboard content appears (login form disappears)
        page.waitForSelector('[data-testid="dashboard"], .dashboard, nav, .MuiDrawer-root, .sidebar', { 
          state: 'visible', 
          timeout: 30000 
        })
      ]);
      
      // Additional wait to ensure auth state is fully set
      await page.waitForTimeout(2000);
      
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
