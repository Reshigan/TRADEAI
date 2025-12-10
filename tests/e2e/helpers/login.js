const { expect } = require('@playwright/test');

/**
 * Login helper - uses storageState from global setup
 * This function just navigates to dashboard since auth is already set up
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function login(page) {
  await page.goto('/dashboard');
  await page.waitForTimeout(2000);
  
  // Check if we're on a valid authenticated page (not login page)
  const currentUrl = page.url();
  const isAuthenticated = !currentUrl.includes('/login') && !currentUrl.endsWith('/');
  
  // If redirected to login, the test will handle it
  if (!isAuthenticated) {
    console.log('[Login Helper] Not authenticated, may need to login manually');
  }
}

module.exports = { login };
