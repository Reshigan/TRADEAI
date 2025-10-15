const { test, expect } = require('@playwright/test');

test.describe('TradeAI Reports E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@tradeai.com');
    await page.fill('[data-testid="password-input"]', 'Admin@123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]');
  });

  test.describe('Product Reports', () => {
    test('should navigate to product reports and display data', async ({ page }) => {
      // Navigate to product reports
      await page.click('[data-testid="reports-menu"]');
      await page.click('[data-testid="product-reports-link"]');
      
      // Wait for page to load
      await page.waitForSelector('[data-testid="product-reports"]');
      
      // Verify page title
      await expect(page.locator('h1')).toContainText('Product Performance Reports');
      
      // Verify key metrics are displayed
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
      await expect(page.locator('[data-testid="units-sold"]')).toBeVisible();
      await expect(page.locator('[data-testid="avg-margin"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-products"]')).toBeVisible();
      
      // Verify charts are rendered
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-chart"]')).toBeVisible();
      
      // Verify data table is present
      await expect(page.locator('[data-testid="products-table"]')).toBeVisible();
    });

    test('should switch between product report tabs', async ({ page }) => {
      await page.goto('/reports/products');
      await page.waitForSelector('[data-testid="product-reports"]');
      
      // Test Sales Performance tab
      await page.click('[data-testid="sales-performance-tab"]');
      await expect(page.locator('[data-testid="sales-performance-content"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('Sales Performance Analysis');
      
      // Test Inventory Analytics tab
      await page.click('[data-testid="inventory-analytics-tab"]');
      await expect(page.locator('[data-testid="inventory-analytics-content"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('Inventory Performance Metrics');
      
      // Test Profitability tab
      await page.click('[data-testid="profitability-tab"]');
      await expect(page.locator('[data-testid="profitability-content"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('Profitability Analysis');
      
      // Test Comparison tab
      await page.click('[data-testid="comparison-tab"]');
      await expect(page.locator('[data-testid="comparison-content"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('Product Comparison Analysis');
    });

    test('should filter product reports by date range', async ({ page }) => {
      await page.goto('/reports/products');
      await page.waitForSelector('[data-testid="product-reports"]');
      
      // Open filter dialog
      await page.click('[data-testid="filter-button"]');
      await expect(page.locator('[data-testid="filter-dialog"]')).toBeVisible();
      
      // Set date range
      await page.fill('[data-testid="start-date"]', '2025-01-01');
      await page.fill('[data-testid="end-date"]', '2025-01-31');
      
      // Apply filter
      await page.click('[data-testid="apply-filter"]');
      
      // Verify filter is applied
      await expect(page.locator('[data-testid="filter-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="filter-indicator"]')).toContainText('Jan 2025');
    });

    test('should export product reports', async ({ page }) => {
      await page.goto('/reports/products');
      await page.waitForSelector('[data-testid="product-reports"]');
      
      // Click export button
      await page.click('[data-testid="export-button"]');
      
      // Wait for export dialog
      await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible();
      
      // Select PDF format
      await page.click('[data-testid="export-pdf"]');
      
      // Start download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-button"]');
      
      // Verify download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('product-reports');
      expect(download.suggestedFilename()).toContain('.pdf');
    });
  });

  test.describe('Promotion Reports', () => {
    test('should navigate to promotion reports and display campaign data', async ({ page }) => {
      await page.goto('/reports/promotions');
      await page.waitForSelector('[data-testid="promotion-reports"]');
      
      // Verify page title
      await expect(page.locator('h1')).toContainText('Promotion Performance Reports');
      
      // Verify key metrics are displayed
      await expect(page.locator('[data-testid="total-roi"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-spend"]')).toBeVisible();
      await expect(page.locator('[data-testid="avg-uplift"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-conversions"]')).toBeVisible();
      
      // Verify campaign table is present
      await expect(page.locator('[data-testid="campaigns-table"]')).toBeVisible();
      
      // Verify campaign names are displayed
      await expect(page.locator('[data-testid="campaign-name"]').first()).toBeVisible();
    });

    test('should switch between promotion report tabs', async ({ page }) => {
      await page.goto('/reports/promotions');
      await page.waitForSelector('[data-testid="promotion-reports"]');
      
      // Test ROI Analysis tab
      await page.click('[data-testid="roi-analysis-tab"]');
      await expect(page.locator('[data-testid="roi-analysis-content"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('ROI Performance Analysis');
      
      // Test Uplift Measurement tab
      await page.click('[data-testid="uplift-measurement-tab"]');
      await expect(page.locator('[data-testid="uplift-measurement-content"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('Uplift Analysis');
      
      // Test Channel Performance tab
      await page.click('[data-testid="channel-performance-tab"]');
      await expect(page.locator('[data-testid="channel-performance-content"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('Channel Performance Analysis');
      
      // Test Effectiveness Report tab
      await page.click('[data-testid="effectiveness-report-tab"]');
      await expect(page.locator('[data-testid="effectiveness-report-content"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('Campaign Effectiveness Analysis');
    });

    test('should display ROI trends and analysis', async ({ page }) => {
      await page.goto('/reports/promotions');
      await page.waitForSelector('[data-testid="promotion-reports"]');
      
      // Switch to ROI Analysis tab
      await page.click('[data-testid="roi-analysis-tab"]');
      
      // Verify ROI trend chart is displayed
      await expect(page.locator('[data-testid="roi-trend-chart"]')).toBeVisible();
      
      // Verify ROI breakdown table
      await expect(page.locator('[data-testid="roi-breakdown-table"]')).toBeVisible();
      
      // Verify ROI values are displayed
      await expect(page.locator('[data-testid="roi-value"]').first()).toBeVisible();
    });

    test('should filter promotions by status', async ({ page }) => {
      await page.goto('/reports/promotions');
      await page.waitForSelector('[data-testid="promotion-reports"]');
      
      // Open filter dialog
      await page.click('[data-testid="filter-button"]');
      
      // Select active campaigns only
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-active"]');
      
      // Apply filter
      await page.click('[data-testid="apply-filter"]');
      
      // Verify only active campaigns are shown
      const statusCells = page.locator('[data-testid="campaign-status"]');
      const count = await statusCells.count();
      
      for (let i = 0; i < count; i++) {
        await expect(statusCells.nth(i)).toContainText('Active');
      }
    });
  });

  test.describe('Trade Spend Reports', () => {
    test('should navigate to trade spend reports and display spend data', async ({ page }) => {
      await page.goto('/reports/tradespend');
      await page.waitForSelector('[data-testid="tradespend-reports"]');
      
      // Verify page title
      await expect(page.locator('h1')).toContainText('Trade Spend Performance Reports');
      
      // Verify key metrics are displayed
      await expect(page.locator('[data-testid="total-budget"]')).toBeVisible();
      await expect(page.locator('[data-testid="actual-spend"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-roi"]')).toBeVisible();
      await expect(page.locator('[data-testid="budget-utilization"]')).toBeVisible();
      
      // Verify spend program table is present
      await expect(page.locator('[data-testid="spend-programs-table"]')).toBeVisible();
      
      // Verify customer data is displayed
      await expect(page.locator('[data-testid="customer-name"]').first()).toBeVisible();
    });

    test('should switch between trade spend report tabs', async ({ page }) => {
      await page.goto('/reports/tradespend');
      await page.waitForSelector('[data-testid="tradespend-reports"]');
      
      // Test Budget vs Actual tab
      await page.click('[data-testid="budget-actual-tab"]');
      await expect(page.locator('[data-testid="budget-actual-content"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('Budget vs Actual Analysis');
      
      // Test Channel Performance tab
      await page.click('[data-testid="channel-performance-tab"]');
      await expect(page.locator('[data-testid="channel-performance-content"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('Channel Performance Analysis');
      
      // Test Optimization Analytics tab
      await page.click('[data-testid="optimization-analytics-tab"]');
      await expect(page.locator('[data-testid="optimization-analytics-content"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('Spend Optimization Analysis');
      
      // Test ROI Analysis tab
      await page.click('[data-testid="roi-analysis-tab"]');
      await expect(page.locator('[data-testid="roi-analysis-content"]')).toBeVisible();
      await expect(page.locator('h2')).toContainText('ROI Performance Analysis');
    });

    test('should display budget variance analysis', async ({ page }) => {
      await page.goto('/reports/tradespend');
      await page.waitForSelector('[data-testid="tradespend-reports"]');
      
      // Switch to Budget vs Actual tab
      await page.click('[data-testid="budget-actual-tab"]');
      
      // Verify budget variance chart is displayed
      await expect(page.locator('[data-testid="budget-variance-chart"]')).toBeVisible();
      
      // Verify variance indicators
      await expect(page.locator('[data-testid="variance-indicator"]')).toBeVisible();
      
      // Verify monthly tracking table
      await expect(page.locator('[data-testid="monthly-tracking-table"]')).toBeVisible();
    });

    test('should display spend by category breakdown', async ({ page }) => {
      await page.goto('/reports/tradespend');
      await page.waitForSelector('[data-testid="tradespend-reports"]');
      
      // Verify category breakdown chart
      await expect(page.locator('[data-testid="category-breakdown-chart"]')).toBeVisible();
      
      // Verify category labels
      await expect(page.locator('[data-testid="category-beverages"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-fmcg"]')).toBeVisible();
      
      // Verify percentages are displayed
      await expect(page.locator('[data-testid="category-percentage"]').first()).toBeVisible();
    });
  });

  test.describe('Cross-Report Navigation', () => {
    test('should navigate between different report types', async ({ page }) => {
      // Start at product reports
      await page.goto('/reports/products');
      await page.waitForSelector('[data-testid="product-reports"]');
      
      // Navigate to promotion reports
      await page.click('[data-testid="reports-menu"]');
      await page.click('[data-testid="promotion-reports-link"]');
      await page.waitForSelector('[data-testid="promotion-reports"]');
      await expect(page.locator('h1')).toContainText('Promotion Performance Reports');
      
      // Navigate to trade spend reports
      await page.click('[data-testid="reports-menu"]');
      await page.click('[data-testid="tradespend-reports-link"]');
      await page.waitForSelector('[data-testid="tradespend-reports"]');
      await expect(page.locator('h1')).toContainText('Trade Spend Performance Reports');
      
      // Navigate back to product reports
      await page.click('[data-testid="reports-menu"]');
      await page.click('[data-testid="product-reports-link"]');
      await page.waitForSelector('[data-testid="product-reports"]');
      await expect(page.locator('h1')).toContainText('Product Performance Reports');
    });

    test('should maintain state when switching between reports', async ({ page }) => {
      // Go to product reports and apply filter
      await page.goto('/reports/products');
      await page.waitForSelector('[data-testid="product-reports"]');
      
      await page.click('[data-testid="filter-button"]');
      await page.fill('[data-testid="start-date"]', '2025-01-01');
      await page.click('[data-testid="apply-filter"]');
      
      // Navigate to promotion reports
      await page.goto('/reports/promotions');
      await page.waitForSelector('[data-testid="promotion-reports"]');
      
      // Navigate back to product reports
      await page.goto('/reports/products');
      await page.waitForSelector('[data-testid="product-reports"]');
      
      // Verify filter state is maintained (if implemented)
      // This would depend on whether the application maintains filter state
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/reports/products');
      await page.waitForSelector('[data-testid="product-reports"]');
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-reports"]')).toBeVisible();
      
      // Verify charts are responsive
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      
      // Test tab navigation on mobile
      await page.click('[data-testid="sales-performance-tab"]');
      await expect(page.locator('[data-testid="sales-performance-content"]')).toBeVisible();
    });

    test('should display correctly on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/reports/promotions');
      await page.waitForSelector('[data-testid="promotion-reports"]');
      
      // Verify tablet layout
      await expect(page.locator('[data-testid="promotion-reports"]')).toBeVisible();
      await expect(page.locator('[data-testid="campaigns-table"]')).toBeVisible();
      
      // Verify metrics cards layout
      const metricsCards = page.locator('[data-testid="metrics-card"]');
      const count = await metricsCards.count();
      expect(count).toBe(4);
    });
  });

  test.describe('Performance', () => {
    test('should load reports within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/reports/products');
      await page.waitForSelector('[data-testid="product-reports"]');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      await page.goto('/reports/tradespend');
      await page.waitForSelector('[data-testid="tradespend-reports"]');
      
      // Verify table loads with data
      await expect(page.locator('[data-testid="spend-programs-table"]')).toBeVisible();
      
      // Verify charts render
      await expect(page.locator('[data-testid="spend-chart"]')).toBeVisible();
      
      // Test scrolling performance
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.evaluate(() => window.scrollTo(0, 0));
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/reports/**', route => route.abort());
      
      await page.goto('/reports/products');
      
      // Verify error message is displayed
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Unable to load data');
      
      // Verify retry button is available
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should handle empty data states', async ({ page }) => {
      // Mock empty data response
      await page.route('**/api/reports/products/overview', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              metrics: { totalRevenue: 0, unitsSold: 0, avgMargin: 0, activeProducts: 0 },
              topProducts: [],
              trends: []
            }
          })
        });
      });
      
      await page.goto('/reports/products');
      await page.waitForSelector('[data-testid="product-reports"]');
      
      // Verify empty state message
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
      await expect(page.locator('[data-testid="empty-state"]')).toContainText('No data available');
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/reports/products');
      await page.waitForSelector('[data-testid="product-reports"]');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Verify filter dialog opens
      await expect(page.locator('[data-testid="filter-dialog"]')).toBeVisible();
      
      // Test escape key
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="filter-dialog"]')).not.toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/reports/promotions');
      await page.waitForSelector('[data-testid="promotion-reports"]');
      
      // Verify ARIA labels are present
      await expect(page.locator('[aria-label="Export reports"]')).toBeVisible();
      await expect(page.locator('[aria-label="Filter reports"]')).toBeVisible();
      
      // Verify tab panels have proper ARIA attributes
      await expect(page.locator('[role="tabpanel"]')).toBeVisible();
    });

    test('should support screen readers', async ({ page }) => {
      await page.goto('/reports/tradespend');
      await page.waitForSelector('[data-testid="tradespend-reports"]');
      
      // Verify heading structure
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h2')).toBeVisible();
      
      // Verify table headers
      await expect(page.locator('th[scope="col"]')).toHaveCount(7); // Customer, Budget, Actual Spend, Sales Impact, ROI, Utilization, Status
    });
  });
});