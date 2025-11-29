const { expect } = require('@playwright/test');

/**
 * Login helper - uses storageState from global setup
 * This function just navigates to dashboard since auth is already set up
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function login(page) {
  await page.goto('/dashboard');
  await page.waitForTimeout(2000);
  
  const currentUrl = page.url();
  expect(currentUrl).toMatch(/\/(dashboard|home)/);
}

module.exports = { login };
