/**
 * End-to-End Product Management Tests
 * Comprehensive browser automation testing for product workflows
 */

import { test, expect } from '@playwright/test';

test.describe('Product Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
  });

  test('should display product management dashboard', async ({ page }) => {
    // Check that the main dashboard loads
    await expect(page.locator('h1')).toContainText('TRADEAI v2.0');
    
    // Check for navigation menu
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for product management section
    await expect(page.locator('[data-testid="products-section"]')).toBeVisible();
  });

  test('should create a new product successfully', async ({ page }) => {
    // Navigate to product creation
    await page.click('[data-testid="add-product-btn"]');
    
    // Wait for product form to load
    await expect(page.locator('[data-testid="product-form"]')).toBeVisible();
    
    // Fill out the product form
    await page.fill('[data-testid="product-name"]', 'Test Product E2E');
    await page.fill('[data-testid="product-sku"]', 'TEST-E2E-001');
    await page.fill('[data-testid="product-description"]', 'End-to-end test product');
    await page.fill('[data-testid="product-category"]', 'Electronics');
    await page.fill('[data-testid="product-brand"]', 'TestBrand');
    await page.fill('[data-testid="product-unit-price"]', '199.99');
    await page.fill('[data-testid="product-cost-price"]', '120.00');
    await page.selectOption('[data-testid="product-currency"]', 'USD');
    await page.selectOption('[data-testid="product-status"]', 'active');
    
    // Submit the form
    await page.click('[data-testid="save-product-btn"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Product created successfully');
    
    // Verify product appears in the list
    await expect(page.locator('[data-testid="product-list"]')).toContainText('Test Product E2E');
  });

  test('should validate required fields in product form', async ({ page }) => {
    // Navigate to product creation
    await page.click('[data-testid="add-product-btn"]');
    
    // Try to submit empty form
    await page.click('[data-testid="save-product-btn"]');
    
    // Check for validation errors
    await expect(page.locator('[data-testid="error-product-name"]')).toContainText('Product name is required');
    await expect(page.locator('[data-testid="error-product-sku"]')).toContainText('SKU is required');
    await expect(page.locator('[data-testid="error-unit-price"]')).toContainText('Unit price is required');
  });

  test('should edit an existing product', async ({ page }) => {
    // First create a product to edit
    await page.click('[data-testid="add-product-btn"]');
    await page.fill('[data-testid="product-name"]', 'Product to Edit');
    await page.fill('[data-testid="product-sku"]', 'EDIT-001');
    await page.fill('[data-testid="product-unit-price"]', '99.99');
    await page.click('[data-testid="save-product-btn"]');
    
    // Wait for product to be created
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Find and click edit button for the product
    await page.click('[data-testid="edit-product-EDIT-001"]');
    
    // Modify the product
    await page.fill('[data-testid="product-name"]', 'Edited Product Name');
    await page.fill('[data-testid="product-unit-price"]', '149.99');
    
    // Save changes
    await page.click('[data-testid="save-product-btn"]');
    
    // Verify changes
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Product updated successfully');
    await expect(page.locator('[data-testid="product-list"]')).toContainText('Edited Product Name');
  });

  test('should search and filter products', async ({ page }) => {
    // Create multiple products for testing
    const products = [
      { name: 'Electronics Product', sku: 'ELEC-001', category: 'Electronics' },
      { name: 'Clothing Product', sku: 'CLOTH-001', category: 'Clothing' }
    ];
    
    for (const product of products) {
      await page.click('[data-testid="add-product-btn"]');
      await page.fill('[data-testid="product-name"]', product.name);
      await page.fill('[data-testid="product-sku"]', product.sku);
      await page.fill('[data-testid="product-category"]', product.category);
      await page.fill('[data-testid="product-unit-price"]', '99.99');
      await page.click('[data-testid="save-product-btn"]');
      await page.waitForSelector('[data-testid="success-message"]');
    }
    
    // Test search functionality
    await page.fill('[data-testid="product-search"]', 'Electronics');
    await expect(page.locator('[data-testid="product-list"]')).toContainText('Electronics Product');
    await expect(page.locator('[data-testid="product-list"]')).not.toContainText('Clothing Product');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that mobile navigation works
    await page.click('[data-testid="mobile-menu-btn"]');
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // Check that forms are usable on mobile
    await page.click('[data-testid="add-product-btn"]');
    await expect(page.locator('[data-testid="product-form"]')).toBeVisible();
    
    // Verify form fields are accessible
    await page.fill('[data-testid="product-name"]', 'Mobile Test Product');
    await expect(page.locator('[data-testid="product-name"]')).toHaveValue('Mobile Test Product');
  });
});