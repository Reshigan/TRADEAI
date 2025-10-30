/**
 * Login E2E Tests
 * Tests user authentication flow
 */

const { test, expect } = require('@playwright/test');

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page).toHaveTitle(/Trade AI/i);
    await expect(page.locator('h1, h2').filter({ hasText: /login|sign in/i })).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    // Wait for validation messages
    await expect(page.locator('text=/required|cannot be empty/i')).toBeVisible({ timeout: 3000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"], input[type="email"]', 'invalid@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('text=/invalid credentials|authentication failed/i')).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Use test credentials
    await page.fill('input[name="email"], input[type="email"]', 'admin@trade-ai.com');
    await page.fill('input[name="password"], input[type="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    
    // Should see welcome message or user menu
    await expect(page.locator('text=/welcome|dashboard/i')).toBeVisible({ timeout: 5000 });
  });

  test('should remember me option work', async ({ page }) => {
    const rememberMe = page.locator('input[type="checkbox"][name="remember"], label:has-text("Remember")');
    
    if (await rememberMe.isVisible()) {
      await rememberMe.check();
      await page.fill('input[name="email"]', 'admin@trade-ai.com');
      await page.fill('input[name="password"]', 'Admin@123456');
      await page.click('button[type="submit"]');
      
      await page.waitForURL(/dashboard/, { timeout: 10000 });
      
      // Check if token is stored in localStorage
      const hasToken = await page.evaluate(() => {
        return localStorage.getItem('token') !== null || localStorage.getItem('authToken') !== null;
      });
      
      expect(hasToken).toBeTruthy();
    }
  });

  test('should navigate to forgot password', async ({ page }) => {
    const forgotPasswordLink = page.locator('a:has-text("Forgot"), a:has-text("Reset")');
    
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      await expect(page).toHaveURL(/forgot|reset/, { timeout: 5000 });
    }
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('button[aria-label*="password"], button:has([class*="eye"])');
    
    if (await toggleButton.isVisible()) {
      // Initially should be password type
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click toggle
      await toggleButton.click();
      
      // Should be text type
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click again
      await toggleButton.click();
      
      // Should be password again
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('should show loading state during login', async ({ page }) => {
    await page.fill('input[name="email"]', 'admin@trade-ai.com');
    await page.fill('input[name="password"]', 'Admin@123456');
    
    // Click submit and immediately check for loading state
    await page.click('button[type="submit"]');
    
    // Should show loading indicator
    const loadingIndicator = page.locator('button[disabled], [class*="loading"], [class*="spinner"]');
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 1000 });
  });

  test('should handle network error gracefully', async ({ page, context }) => {
    // Simulate network failure
    await context.setOffline(true);
    
    await page.fill('input[name="email"]', 'admin@trade-ai.com');
    await page.fill('input[name="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    
    // Should show network error
    await expect(page.locator('text=/network error|connection failed|offline/i')).toBeVisible({ timeout: 5000 });
    
    await context.setOffline(false);
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    // Tab to email field
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]')).toBeFocused();
    
    // Type email
    await page.keyboard.type('admin@trade-ai.com');
    
    // Tab to password field
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="password"]')).toBeFocused();
    
    // Type password
    await page.keyboard.type('Admin@123456');
    
    // Tab to submit button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should attempt login
    await page.waitForURL(/dashboard/, { timeout: 10000 });
  });
});
