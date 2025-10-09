const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('TRADEAI - Complete End-to-End Tests', () => {
  let authToken;

  test.beforeAll(async ({ request }) => {
    // Login and get auth token
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'admin@example.com',
        password: 'Admin123!@#'
      }
    });
    
    const data = await response.json();
    authToken = data.token;
  });

  test.describe('Authentication Workflows', () => {
    test('User can login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      await page.fill('[name="email"]', 'admin@example.com');
      await page.fill('[name="password"]', 'Admin123!@#');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('User can logout', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.click('[aria-label="User menu"]');
      await page.click('text=Logout');
      
      await expect(page).toHaveURL(`${BASE_URL}/login`);
    });
  });

  test.describe('Trade Spend Workflows', () => {
    test('Complete trade spend workflow', async ({ page }) => {
      await page.goto(`${BASE_URL}/trade-spends`);
      
      // Create
      await page.click('button:has-text("Create")');
      await page.fill('[name="name"]', 'E2E Test Trade Spend');
      await page.fill('[name="amount"]', '10000');
      await page.click('button:has-text("Save")');
      
      await expect(page.locator('text=E2E Test Trade Spend')).toBeVisible();
      
      // Edit
      await page.click('[aria-label="Edit"]');
      await page.fill('[name="amount"]', '15000');
      await page.click('button:has-text("Update")');
      
      // Delete
      await page.click('[aria-label="Delete"]');
      await page.click('button:has-text("Confirm")');
    });
  });

  test.describe('Budget Workflows', () => {
    test('Create and manage budget', async ({ page }) => {
      await page.goto(`${BASE_URL}/budgets`);
      
      await page.click('button:has-text("Create")');
      await page.fill('[name="name"]', 'Q1 2025 Budget');
      await page.fill('[name="amount"]', '100000');
      await page.click('button:has-text("Save")');
      
      await expect(page.locator('text=Q1 2025 Budget')).toBeVisible();
    });
  });

  test.describe('Customer Workflows', () => {
    test('Complete customer management', async ({ page }) => {
      await page.goto(`${BASE_URL}/customers`);
      
      // Create customer
      await page.click('button:has-text("Add Customer")');
      await page.fill('[name="name"]', 'Test Customer Inc');
      await page.fill('[name="email"]', 'test@customer.com');
      await page.click('button:has-text("Save")');
      
      await expect(page.locator('text=Test Customer Inc')).toBeVisible();
    });
  });

  test.describe('Product Workflows', () => {
    test('Product CRUD operations', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      
      // Create
      await page.click('button:has-text("Add Product")');
      await page.fill('[name="name"]', 'Test Product');
      await page.fill('[name="sku"]', 'TEST-001');
      await page.fill('[name="price"]', '99.99');
      await page.click('button:has-text("Save")');
      
      await expect(page.locator('text=Test Product')).toBeVisible();
    });
  });

  test.describe('Campaign Workflows', () => {
    test('Create and launch campaign', async ({ page }) => {
      await page.goto(`${BASE_URL}/campaigns`);
      
      await page.click('button:has-text("New Campaign")');
      await page.fill('[name="name"]', 'Summer Sale 2025');
      await page.selectOption('[name="type"]', 'promotion');
      await page.click('button:has-text("Create")');
      
      await expect(page.locator('text=Summer Sale 2025')).toBeVisible();
    });
  });

  test.describe('Analytics & Reporting', () => {
    test('View dashboard analytics', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-customers"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-campaigns"]')).toBeVisible();
    });

    test('Generate and export report', async ({ page }) => {
      await page.goto(`${BASE_URL}/reports`);
      
      await page.click('button:has-text("Generate Report")');
      await page.selectOption('[name="reportType"]', 'sales');
      await page.click('button:has-text("Generate")');
      
      await expect(page.locator('text=Report generated')).toBeVisible();
    });
  });

  test.describe('Admin Workflows', () => {
    test('User management', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/users`);
      
      await page.click('button:has-text("Add User")');
      await page.fill('[name="name"]', 'New User');
      await page.fill('[name="email"]', 'newuser@example.com');
      await page.fill('[name="password"]', 'Password123!');
      await page.selectOption('[name="role"]', 'user');
      await page.click('button:has-text("Create")');
      
      await expect(page.locator('text=New User')).toBeVisible();
    });
  });

  test.describe('Performance Tests', () => {
    test('Page load performance', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/dashboard`);
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // Page should load in < 3 seconds
    });

    test('API response time', async ({ request }) => {
      const startTime = Date.now();
      await request.get(`${BASE_URL}/api/dashboard`);
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(500); // API should respond in < 500ms
    });
  });
});
