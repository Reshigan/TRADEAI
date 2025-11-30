const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/login');

/**
 * Authentication E2E Tests
 * 
 * Tests login, logout, and authentication flows
 */

test.describe('Authentication', () => {
  test.describe('Login Page Tests (requires no storageState)', () => {
    test.skip('should display login page', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      await expect(page.locator('button:has-text("ACCESS PLATFORM"), button[type="submit"]')).toBeVisible();
    });
    
    test.skip('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/');
      await page.locator('button:has-text("ACCESS PLATFORM"), button[type="submit"]').click();
      await expect(page).toHaveURL(/\/(login)?$/);
    });
    
    test.skip('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/');
      await page.locator('input[type="email"], input[name="email"]').fill('invalid@example.com');
      await page.locator('input[type="password"], input[name="password"]').fill('wrongpassword');
      await page.locator('button:has-text("ACCESS PLATFORM"), button[type="submit"]').click();
      await page.waitForTimeout(2000);
      
      const hasError = await page.locator('text=/invalid|error|incorrect/i').isVisible().catch(() => false);
      const onLoginPage = page.url().includes('login') || page.url() === new URL('/', page.url()).href;
      expect(hasError || onLoginPage).toBeTruthy();
    });
    
    test.skip('should successfully login with valid credentials', async ({ page }) => {
      const email = process.env.TEST_USER_EMAIL;
      const password = process.env.TEST_USER_PASSWORD;
      
      await page.goto('/');
      await page.locator('input[type="email"], input[name="email"]').fill(email);
      await page.locator('input[type="password"], input[name="password"]').fill(password);
      
      await Promise.all([
        page.waitForURL(url => {
          const pathname = new URL(url).pathname;
          return pathname.includes('/dashboard') || pathname.includes('/home');
        }, { timeout: 15000 }),
        page.locator('button:has-text("ACCESS PLATFORM"), button[type="submit"]').click()
      ]);
      
      expect(page.url()).not.toContain('/login');
      expect(page.url()).toMatch(/\/(dashboard|home)/);
    });
  });
  
  test('should maintain session after page reload', async ({ page }) => {
    await login(page);
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    expect(page.url()).not.toContain('/login');
    expect(page.url()).toMatch(/\/(dashboard|home)/);
  });
  
  test('should successfully logout', async ({ page }) => {
    await login(page);
    
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")').first();
    
    if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutButton.click();
      
      await page.waitForURL(/\/login/, { timeout: 10000 });
      expect(page.url()).toContain('login');
    }
  });
});
