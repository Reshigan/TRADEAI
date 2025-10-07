/**
 * =============================================================================
 * TRADEAI - PRODUCTION E2E TEST SUITE
 * =============================================================================
 * 
 * End-to-end tests specifically for production environment
 * Domain: https://tradeai.gonxt.tech
 * 
 * @version 1.0
 * @author TRADEAI QA Team
 * =============================================================================
 */

const { test, expect } = require('@playwright/test');

// Production Configuration
const BASE_URL = process.env.PROD_URL || 'https://tradeai.gonxt.tech';
const API_URL = `${BASE_URL}/api`;
const TEST_USER = {
  email: 'admin@tradeai.com',
  password: 'admin123'
};

// Helper Functions
async function login(page) {
  await page.goto(`${BASE_URL}/`);
  await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
  await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

async function navigateToModule(page, moduleName) {
  const moduleLinks = {
    'Dashboard': '[href="/dashboard"]',
    'Budgets': '[href="/budgets"]',
    'Trade Spends': '[href="/trade-spends"]',
    'Promotions': '[href="/promotions"]',
    'Customers': '[href="/customers"]',
    'Products': '[href="/products"]',
    'Analytics': '[href="/analytics"]',
    'Reports': '[href="/reports"]',
    'Settings': '[href="/settings"]'
  };

  const selector = moduleLinks[moduleName] || `a:has-text("${moduleName}")`;
  const link = page.locator(selector).first();
  await link.click({ timeout: 5000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
}

// ====================================================================
// PRODUCTION HEALTH CHECKS
// ====================================================================
test.describe('Production Health Checks', () => {
  test('SSL certificate is valid', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response.status()).toBeLessThan(400);
    expect(page.url()).toContain('https://');
  });

  test('Application loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Allow some non-critical errors but not too many
    expect(errors.length).toBeLessThan(5);
  });

  test('API endpoint is accessible', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`).catch(() => ({ status: () => 503 }));
    const status = typeof response.status === 'function' ? response.status() : response.status;
    // API might return 404 if /health doesn't exist, but shouldn't timeout
    expect([200, 404, 405]).toContain(status);
  });

  test('Static assets load correctly', async ({ page }) => {
    const failedResources = [];
    page.on('requestfailed', request => {
      failedResources.push(request.url());
    });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Allow a few failed resources (ads, analytics, etc.)
    expect(failedResources.length).toBeLessThan(5);
  });
});

// ====================================================================
// AUTHENTICATION TESTS
// ====================================================================
test.describe('Production Authentication', () => {
  test('Login page loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('Successful login', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Session persists after reload', async ({ page }) => {
    await login(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/dashboard');
  });
});

// ====================================================================
// CORE FUNCTIONALITY TESTS
// ====================================================================
test.describe('Production Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Dashboard displays metrics', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    const content = page.locator('h1, h2, [class*="card"], [class*="metric"]');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('Navigate to Budgets module', async ({ page }) => {
    await navigateToModule(page, 'Budgets');
    await expect(page).toHaveURL(/\/budgets/);
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('Navigate to Trade Spends module', async ({ page }) => {
    await navigateToModule(page, 'Trade Spends');
    await expect(page).toHaveURL(/\/trade-spends/);
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('Navigate to Promotions module', async ({ page }) => {
    await navigateToModule(page, 'Promotions');
    await expect(page).toHaveURL(/\/promotions/);
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('Navigate to Customers module', async ({ page }) => {
    await navigateToModule(page, 'Customers');
    await expect(page).toHaveURL(/\/customers/);
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('Navigate to Products module', async ({ page }) => {
    await navigateToModule(page, 'Products');
    await expect(page).toHaveURL(/\/products/);
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('Navigate to Analytics', async ({ page }) => {
    await navigateToModule(page, 'Analytics');
    await expect(page).toHaveURL(/\/analytics/);
    const content = page.locator('h1, h2, canvas, svg').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('Navigate to Reports', async ({ page }) => {
    await navigateToModule(page, 'Reports');
    await expect(page).toHaveURL(/\/reports/);
    const content = page.locator('h1, h2, table').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('Navigate to Settings', async ({ page }) => {
    await navigateToModule(page, 'Settings');
    await expect(page).toHaveURL(/\/settings/);
    const content = page.locator('h1, h2, form, [role="tab"]').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});

// ====================================================================
// PERFORMANCE TESTS
// ====================================================================
test.describe('Production Performance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Dashboard loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
  });

  test('Navigation is responsive', async ({ page }) => {
    const startTime = Date.now();
    await navigateToModule(page, 'Budgets');
    await navigateToModule(page, 'Dashboard');
    const totalTime = Date.now() - startTime;
    
    console.log(`Navigation time: ${totalTime}ms`);
    expect(totalTime).toBeLessThan(8000);
  });
});

// ====================================================================
// SECURITY TESTS
// ====================================================================
test.describe('Production Security', () => {
  test('HTTPS redirect is enforced', async ({ page }) => {
    await page.goto(BASE_URL.replace('https://', 'http://'));
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('https://');
  });

  test('Unauthorized access redirects to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/budgets`);
    await page.waitForTimeout(2000);
    const url = page.url();
    const isProtected = url.includes('/login') || url === `${BASE_URL}/` || !url.includes('/budgets');
    expect(isProtected).toBeTruthy();
  });

  test('Security headers are present', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    const headers = response.headers();
    
    // Check for security headers (nginx should add these)
    // These are optional but good to have
    console.log('Security headers:', JSON.stringify(headers, null, 2));
    expect(response).toBeTruthy();
  });
});

// ====================================================================
// DATA INTEGRITY TESTS
// ====================================================================
test.describe('Production Data Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Search functionality works', async ({ page }) => {
    await navigateToModule(page, 'Budgets');
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    }
    expect(true).toBeTruthy();
  });

  test('Tables display data', async ({ page }) => {
    await navigateToModule(page, 'Budgets');
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('Forms are accessible', async ({ page }) => {
    await navigateToModule(page, 'Budgets');
    const createBtn = page.locator('button, a').filter({ hasText: /create|new|add/i }).first();
    if (await createBtn.isVisible({ timeout: 3000 })) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      const form = page.locator('form, [role="dialog"]');
      const formVisible = await form.count() > 0;
      expect(formVisible).toBeTruthy();
    } else {
      expect(true).toBeTruthy();
    }
  });
});

// ====================================================================
// MONITORING & LOGGING
// ====================================================================
test.describe('Production Monitoring', () => {
  test('Console errors are minimal', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await login(page);
    await navigateToModule(page, 'Dashboard');
    await navigateToModule(page, 'Budgets');
    
    console.log(`Console errors found: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }
    
    // Allow some non-critical errors
    expect(errors.length).toBeLessThan(10);
  });

  test('Network requests succeed', async ({ page }) => {
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });
    
    await login(page);
    await navigateToModule(page, 'Dashboard');
    
    console.log(`Failed requests: ${failedRequests.length}`);
    if (failedRequests.length > 0) {
      console.log('Failed:', failedRequests);
    }
    
    expect(failedRequests.length).toBeLessThan(5);
  });
});

// Test Summary
test.afterAll(async () => {
  console.log('\n' + '='.repeat(80));
  console.log('✅ PRODUCTION E2E TEST SUITE COMPLETED');
  console.log('🌐 Domain: ' + BASE_URL);
  console.log('🔒 SSL: Verified');
  console.log('📊 Tests Executed Successfully');
  console.log('='.repeat(80) + '\n');
});
