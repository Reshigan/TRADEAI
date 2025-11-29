const { chromium } = require('@playwright/test');

module.exports = async config => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const email = process.env.TEST_USER_EMAIL || 'admin@testdistributor.com';
  const password = process.env.TEST_USER_PASSWORD || 'Admin@123';
  
  console.log('[E2E GLOBAL SETUP] Authenticating once for all E2E tests...');
  
  try {
    await page.goto('https://tradeai.gonxt.tech/');
    
    await page.locator('input[type="email"], input[name="email"]').fill(email);
    await page.locator('input[type="password"], input[name="password"]').fill(password);
    
    await Promise.all([
      page.waitForURL(url => {
        const pathname = new URL(url).pathname;
        return pathname.includes('/dashboard') || pathname.includes('/home');
      }, { timeout: 15000 }),
      page.locator('button:has-text("ACCESS PLATFORM"), button[type="submit"]').click()
    ]);
    
    console.log('[E2E GLOBAL SETUP] Login successful, saving auth state...');
    
    await page.context().storageState({ path: '.auth/user.json' });
    
    console.log('[E2E GLOBAL SETUP] Auth state saved to .auth/user.json');
  } catch (error) {
    console.error('[E2E GLOBAL SETUP] Failed to authenticate:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
};
