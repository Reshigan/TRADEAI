/**
 * End-to-End Dashboard Tests
 * Comprehensive browser automation testing for dashboard functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
  });

  test('should display main dashboard with all components', async ({ page }) => {
    // Check main dashboard title
    await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('TRADEAI v2.0 Dashboard');
    
    // Check for stats cards
    await expect(page.locator('[data-testid="stats-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-customers-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-products-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-budgets-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-trade-spend-card"]')).toBeVisible();
    
    // Check for recent activities section
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible();
    
    // Check for quick actions section
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
  });

  test('should display correct statistics', async ({ page }) => {
    // Wait for stats to load
    await page.waitForSelector('[data-testid="stats-loaded"]');
    
    // Check that numeric values are displayed
    const customerCount = await page.locator('[data-testid="customer-count"]').textContent();
    const productCount = await page.locator('[data-testid="product-count"]').textContent();
    const budgetCount = await page.locator('[data-testid="budget-count"]').textContent();
    
    expect(customerCount).toMatch(/^\d+$/); // Should be a number
    expect(productCount).toMatch(/^\d+$/);
    expect(budgetCount).toMatch(/^\d+$/);
    
    // Check currency formatting
    const tradeSpendAmount = await page.locator('[data-testid="trade-spend-amount"]').textContent();
    expect(tradeSpendAmount).toMatch(/^\$[\d,]+\.\d{2}$/); // Should be currency format
  });

  test('should display recent activities with proper formatting', async ({ page }) => {
    // Wait for activities to load
    await page.waitForSelector('[data-testid="activities-loaded"]');
    
    // Check for activity items
    const activityItems = page.locator('[data-testid="activity-item"]');
    await expect(activityItems.first()).toBeVisible();
    
    // Check activity structure
    await expect(activityItems.first().locator('[data-testid="activity-type"]')).toBeVisible();
    await expect(activityItems.first().locator('[data-testid="activity-description"]')).toBeVisible();
    await expect(activityItems.first().locator('[data-testid="activity-timestamp"]')).toBeVisible();
    await expect(activityItems.first().locator('[data-testid="activity-user"]')).toBeVisible();
  });

  test('should handle quick action buttons', async ({ page }) => {
    // Test Add Customer quick action
    await page.click('[data-testid="quick-action-add-customer"]');
    await expect(page.locator('[data-testid="customer-form"]')).toBeVisible();
    await page.goBack();
    
    // Test Add Product quick action
    await page.click('[data-testid="quick-action-add-product"]');
    await expect(page.locator('[data-testid="product-form"]')).toBeVisible();
    await page.goBack();
    
    // Test Create Budget quick action
    await page.click('[data-testid="quick-action-create-budget"]');
    await expect(page.locator('[data-testid="budget-form"]')).toBeVisible();
    await page.goBack();
    
    // Test New Campaign quick action
    await page.click('[data-testid="quick-action-new-campaign"]');
    await expect(page.locator('[data-testid="campaign-form"]')).toBeVisible();
  });

  test('should refresh dashboard data', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="stats-loaded"]');
    
    // Get initial customer count
    const initialCount = await page.locator('[data-testid="customer-count"]').textContent();
    
    // Click refresh button
    await page.click('[data-testid="refresh-dashboard-btn"]');
    
    // Check for loading state
    await expect(page.locator('[data-testid="dashboard-loading"]')).toBeVisible();
    
    // Wait for refresh to complete
    await page.waitForSelector('[data-testid="stats-loaded"]');
    
    // Verify data is refreshed (in a real scenario, data might change)
    const refreshedCount = await page.locator('[data-testid="customer-count"]').textContent();
    expect(refreshedCount).toBeDefined();
  });

  test('should display budget utilization chart', async ({ page }) => {
    // Check for budget utilization section
    await expect(page.locator('[data-testid="budget-utilization"]')).toBeVisible();
    
    // Check for progress bars
    const progressBars = page.locator('[data-testid="budget-progress-bar"]');
    await expect(progressBars.first()).toBeVisible();
    
    // Check for percentage labels
    await expect(page.locator('[data-testid="budget-percentage"]')).toBeVisible();
  });

  test('should handle empty states gracefully', async ({ page }) => {
    // Mock empty data response
    await page.route('**/api/v1/dashboard/activities', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] })
      });
    });
    
    await page.reload();
    
    // Check for empty state message
    await expect(page.locator('[data-testid="no-activities-message"]')).toContainText('No recent activities');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/dashboard/stats', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.reload();
    
    // Check for error message
    await expect(page.locator('[data-testid="dashboard-error"]')).toContainText('Error loading dashboard data');
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="stats-grid"]')).toHaveCSS('grid-template-columns', /repeat\(4, 1fr\)/);
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="stats-grid"]')).toHaveCSS('grid-template-columns', /repeat\(2, 1fr\)/);
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="stats-grid"]')).toHaveCSS('grid-template-columns', '1fr');
    
    // Check mobile navigation
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
  });

  test('should display notifications for pending approvals', async ({ page }) => {
    // Check for notification badge
    const notificationBadge = page.locator('[data-testid="pending-approvals-badge"]');
    await expect(notificationBadge).toBeVisible();
    
    // Click on notifications
    await page.click('[data-testid="notifications-btn"]');
    
    // Check notifications panel
    await expect(page.locator('[data-testid="notifications-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-item"]')).toBeVisible();
  });

  test('should navigate to detailed views from dashboard cards', async ({ page }) => {
    // Click on customers card
    await page.click('[data-testid="total-customers-card"]');
    await expect(page.url()).toContain('/customers');
    await page.goBack();
    
    // Click on products card
    await page.click('[data-testid="total-products-card"]');
    await expect(page.url()).toContain('/products');
    await page.goBack();
    
    // Click on budgets card
    await page.click('[data-testid="total-budgets-card"]');
    await expect(page.url()).toContain('/budgets');
  });

  test('should display real-time updates', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="stats-loaded"]');
    
    // Simulate real-time update (in a real app, this might come via WebSocket)
    await page.evaluate(() => {
      // Trigger a custom event that the dashboard listens to
      window.dispatchEvent(new CustomEvent('dashboard-update', {
        detail: { type: 'new-activity', data: { description: 'New test activity' } }
      }));
    });
    
    // Check that new activity appears
    await expect(page.locator('[data-testid="activity-item"]').first()).toContainText('New test activity');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation through quick actions
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check that focus is on a quick action button
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('data-testid', /quick-action/);
    
    // Test Enter key activation
    await page.keyboard.press('Enter');
    
    // Should navigate to the corresponding form
    await expect(page.locator('[data-testid*="form"]')).toBeVisible();
  });

  test('should persist user preferences', async ({ page }) => {
    // Change dashboard layout preference (if implemented)
    await page.click('[data-testid="dashboard-settings-btn"]');
    await page.click('[data-testid="compact-view-toggle"]');
    
    // Reload page
    await page.reload();
    
    // Check that preference is persisted
    await expect(page.locator('[data-testid="dashboard-container"]')).toHaveClass(/compact-view/);
  });
});