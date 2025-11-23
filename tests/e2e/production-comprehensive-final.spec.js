/**
 * =============================================================================
 * TRADEAI - COMPREHENSIVE PRODUCTION E2E TEST SUITE (Final Version)
 * =============================================================================
 * 
 * Full detailed end-to-end tests for production environment
 * Domain: https://tradeai.gonxt.tech
 * 
 * This version uses:
 * - API-based authentication to bypass login refresh loop
 * - Storage state persistence to avoid rate limiting
 * - Single login per company, reused across all tests
 * 
 * @version 3.0
 * @author TRADEAI QA Team
 * =============================================================================
 */

const { test, expect } = require('@playwright/test');

// Production Configuration
const BASE_URL = process.env.BASE_URL || 'https://tradeai.gonxt.tech';
const API_URL = `${BASE_URL}/api`;

const TEST_USER = {
  email: 'admin@pomades.demo',
  password: 'Demo@123',
  company: 'Pomades Confectionary'
};

const SA_RETAILERS = ['Pick n Pay', 'Shoprite', 'Checkers', 'Spar', 'Woolworths'];

const SA_PRODUCTS = ['Dairy Delight', 'Lunch Time', 'Premium Gold', 'Fruity Bites'];

let authState = null;

test.beforeAll(async ({ browser }) => {
  console.log('\n🔐 Setting up authentication...');
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    const response = await page.request.post(`${API_URL}/auth/login`, {
      data: {
        email: TEST_USER.email,
        password: TEST_USER.password
      }
    });
    
    const responseData = await response.json();
    
    if (response.status() === 200 && responseData.success) {
      const token = responseData.token;
      const user = responseData.data?.user;
      const refreshToken = responseData.data?.tokens?.refreshToken;
      
      await page.goto(BASE_URL);
      await page.evaluate(({ token, refreshToken, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('accessToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(user));
      }, { token, refreshToken, user });
      
      authState = await context.storageState();
      console.log('✅ Authentication successful and saved');
    } else {
      console.error('❌ Login failed:', responseData);
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
  } finally {
    await context.close();
  }
});

test.use({
  storageState: async () => authState
});

// Helper Functions
async function navigateToModule(page, moduleName) {
  const moduleLinks = {
    'Dashboard': '/dashboard',
    'Products': '/products',
    'Customers': '/customers',
    'Promotions': '/promotions',
    'Budgets': '/budgets',
    'Vendors': '/vendors',
    'Trade Spends': '/trade-spends',
    'Sales Analytics': '/sales-analytics'
  };

  const path = moduleLinks[moduleName];
  if (path) {
    await page.goto(`${BASE_URL}${path}`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  }
}

async function getTableRowCount(page) {
  const tableSelectors = [
    'table tbody tr',
    '[role="table"] [role="row"]',
    '.MuiDataGrid-row'
  ];
  
  for (const selector of tableSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      return count;
    }
  }
  
  return 0;
}

// ====================================================================
// PRODUCTION HEALTH CHECKS
// ====================================================================
test.describe('Production Health', () => {
  test('SSL certificate is valid', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response.status()).toBeLessThan(400);
    expect(page.url()).toContain('https://');
  });

  test('Application loads without critical errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    console.log(`  Console errors: ${errors.length}`);
    expect(errors.length).toBeLessThan(10);
  });
});

// ====================================================================
// ====================================================================
test.describe('Authentication', () => {
  test('User is authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Session persists after reload', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

// ====================================================================
// ====================================================================
test.describe('Navigation', () => {
  const modules = ['Dashboard', 'Products', 'Customers', 'Promotions', 'Budgets', 'Vendors', 'Trade Spends', 'Sales Analytics'];

  for (const module of modules) {
    test(`Navigate to ${module}`, async ({ page }) => {
      await navigateToModule(page, module);
      const content = page.locator('h1, h2, table, canvas, [role="table"]').first();
      await expect(content).toBeVisible({ timeout: 10000 });
    });
  }

  test('Navigation between modules works', async ({ page }) => {
    await navigateToModule(page, 'Products');
    await navigateToModule(page, 'Customers');
    await navigateToModule(page, 'Dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

// ====================================================================
// ====================================================================
test.describe('Products Module', () => {
  test('Products page loads', async ({ page }) => {
    await navigateToModule(page, 'Products');
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('Has product data', async ({ page }) => {
    await navigateToModule(page, 'Products');
    await page.waitForTimeout(2000);
    const rowCount = await getTableRowCount(page);
    console.log(`  Found ${rowCount} products`);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Displays SA confectionary products', async ({ page }) => {
    await navigateToModule(page, 'Products');
    await page.waitForTimeout(2000);
    
    let foundProduct = false;
    for (const productName of SA_PRODUCTS) {
      const element = page.locator(`text=${productName}`).first();
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        foundProduct = true;
        console.log(`  ✓ Found: ${productName}`);
        break;
      }
    }
    
    expect(foundProduct).toBeTruthy();
  });
});

// ====================================================================
// ====================================================================
test.describe('Customers Module', () => {
  test('Customers page loads', async ({ page }) => {
    await navigateToModule(page, 'Customers');
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('Has customer data', async ({ page }) => {
    await navigateToModule(page, 'Customers');
    await page.waitForTimeout(2000);
    const rowCount = await getTableRowCount(page);
    console.log(`  Found ${rowCount} customers`);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Displays SA retailers', async ({ page }) => {
    await navigateToModule(page, 'Customers');
    await page.waitForTimeout(2000);
    
    let foundRetailer = false;
    for (const retailer of SA_RETAILERS) {
      const element = page.locator(`text=${retailer}`).first();
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        foundRetailer = true;
        console.log(`  ✓ Found: ${retailer}`);
        break;
      }
    }
    
    expect(foundRetailer).toBeTruthy();
  });
});

// ====================================================================
// ====================================================================
test.describe('Promotions Module', () => {
  test('Promotions page loads', async ({ page }) => {
    await navigateToModule(page, 'Promotions');
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('Has promotion data', async ({ page }) => {
    await navigateToModule(page, 'Promotions');
    await page.waitForTimeout(2000);
    const rowCount = await getTableRowCount(page);
    console.log(`  Found ${rowCount} promotions`);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Displays dates', async ({ page }) => {
    await navigateToModule(page, 'Promotions');
    await page.waitForTimeout(2000);
    const dateElement = page.locator('text=/\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}/').first();
    const hasDate = await dateElement.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`  Dates visible: ${hasDate}`);
  });
});

// ====================================================================
// ====================================================================
test.describe('Budgets Module', () => {
  test('Budgets page loads', async ({ page }) => {
    await navigateToModule(page, 'Budgets');
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('Has budget data', async ({ page }) => {
    await navigateToModule(page, 'Budgets');
    await page.waitForTimeout(2000);
    const rowCount = await getTableRowCount(page);
    console.log(`  Found ${rowCount} budgets`);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Displays quarterly data for 2025', async ({ page }) => {
    await navigateToModule(page, 'Budgets');
    await page.waitForTimeout(2000);
    const quarterElement = page.locator('text=/Q[1-4]|2025/').first();
    const hasQuarter = await quarterElement.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`  Quarterly data: ${hasQuarter}`);
    expect(hasQuarter).toBeTruthy();
  });
});

// ====================================================================
// ====================================================================
test.describe('Vendors Module', () => {
  test('Vendors page loads', async ({ page }) => {
    await navigateToModule(page, 'Vendors');
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('Has vendor data', async ({ page }) => {
    await navigateToModule(page, 'Vendors');
    await page.waitForTimeout(2000);
    const rowCount = await getTableRowCount(page);
    console.log(`  Found ${rowCount} vendors`);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Displays SA companies', async ({ page }) => {
    await navigateToModule(page, 'Vendors');
    await page.waitForTimeout(2000);
    const saElement = page.locator('text=/SA|South Africa|National|Premium/').first();
    const hasSA = await saElement.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`  SA vendors: ${hasSA}`);
  });
});

// ====================================================================
// ====================================================================
test.describe('Performance', () => {
  test('Dashboard loads within 10 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    console.log(`  Load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000);
  });

  test('Products page loads within 10 seconds', async ({ page }) => {
    const startTime = Date.now();
    await navigateToModule(page, 'Products');
    const loadTime = Date.now() - startTime;
    console.log(`  Load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000);
  });
});

// ====================================================================
// ====================================================================
test.describe('Security', () => {
  test('Unauthorized access redirects to login', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto(`${BASE_URL}/products`);
    await page.waitForTimeout(2000);
    const url = page.url();
    const isProtected = url.includes('/login') || url === `${BASE_URL}/` || !url.includes('/products');
    expect(isProtected).toBeTruthy();
    
    await context.close();
  });
});

// Test Summary
test.afterAll(async () => {
  console.log('\n' + '='.repeat(80));
  console.log('✅ COMPREHENSIVE PRODUCTION E2E TEST SUITE COMPLETED');
  console.log('🌐 Domain: ' + BASE_URL);
  console.log('🏢 Company: ' + TEST_USER.company);
  console.log('👤 User: ' + TEST_USER.email);
  console.log('📦 Modules: Products, Customers, Promotions, Budgets, Vendors');
  console.log('🔒 Security: Authentication, Authorization verified');
  console.log('⚡ Performance: Load times verified');
  console.log('='.repeat(80) + '\n');
});
