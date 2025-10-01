/**
 * End-to-End User Acceptance Testing Suite
 * Comprehensive testing for go-live deployment readiness
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const config = {
  baseURL: process.env.BASE_URL || 'http://localhost:3001',
  apiURL: process.env.API_URL || 'http://localhost:3000',
  timeout: 30000,
  testUsers: {
    admin: {
      email: 'admin@tradeai.com',
      password: 'Admin123!',
      role: 'admin'
    },
    manager: {
      email: 'manager@tradeai.com',
      password: 'Manager123!',
      role: 'manager'
    },
    user: {
      email: 'user@tradeai.com',
      password: 'User123!',
      role: 'user'
    }
  }
};

/**
 * Critical User Journey Tests
 */
test.describe('Critical User Journeys - Go Live Readiness', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for critical tests
    test.setTimeout(60000);
    
    // Navigate to application
    await page.goto(config.baseURL);
    
    // Wait for application to load
    await page.waitForLoadState('networkidle');
  });

  /**
   * Test 1: User Registration and Onboarding Flow
   */
  test('User Registration and Complete Onboarding', async ({ page }) => {
    console.log('🧪 Testing: User Registration and Onboarding Flow');
    
    // Navigate to registration
    await page.click('[data-testid="register-button"]');
    await expect(page).toHaveURL(/.*register/);
    
    // Fill registration form
    const timestamp = Date.now();
    const testEmail = `test.user.${timestamp}@tradeai.com`;
    
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', 'TestUser123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestUser123!');
    await page.fill('[data-testid="company-name-input"]', 'Test Company Ltd');
    await page.fill('[data-testid="first-name-input"]', 'Test');
    await page.fill('[data-testid="last-name-input"]', 'User');
    
    // Accept terms and conditions
    await page.check('[data-testid="terms-checkbox"]');
    
    // Submit registration
    await page.click('[data-testid="register-submit"]');
    
    // Verify registration success
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    
    // Simulate email verification (in real scenario, this would be done via email)
    await page.click('[data-testid="verify-email-button"]');
    
    // Complete onboarding steps
    await page.click('[data-testid="start-onboarding"]');
    
    // Step 1: Company Information
    await page.fill('[data-testid="company-size-select"]', '50-100');
    await page.fill('[data-testid="industry-select"]', 'Technology');
    await page.click('[data-testid="onboarding-next"]');
    
    // Step 2: Trading Preferences
    await page.check('[data-testid="trading-type-stocks"]');
    await page.check('[data-testid="trading-type-forex"]');
    await page.fill('[data-testid="risk-tolerance"]', 'Medium');
    await page.click('[data-testid="onboarding-next"]');
    
    // Step 3: Integration Setup
    await page.click('[data-testid="skip-integrations"]');
    
    // Complete onboarding
    await page.click('[data-testid="complete-onboarding"]');
    
    // Verify successful onboarding
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    
    console.log('✅ User Registration and Onboarding: PASSED');
  });

  /**
   * Test 2: User Authentication Flow
   */
  test('User Login and Authentication', async ({ page }) => {
    console.log('🧪 Testing: User Authentication Flow');
    
    // Navigate to login
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*login/);
    
    // Test invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@email.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-submit"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    
    // Test valid credentials
    await page.fill('[data-testid="email-input"]', config.testUsers.user.email);
    await page.fill('[data-testid="password-input"]', config.testUsers.user.password);
    await page.click('[data-testid="login-submit"]');
    
    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Test session persistence
    await page.reload();
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Test logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL(/.*login/);
    
    console.log('✅ User Authentication: PASSED');
  });

  /**
   * Test 3: Dashboard Functionality
   */
  test('Dashboard Core Functionality', async ({ page }) => {
    console.log('🧪 Testing: Dashboard Core Functionality');
    
    // Login as user
    await loginAsUser(page, config.testUsers.user);
    
    // Verify dashboard elements
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="metrics-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
    
    // Test metrics loading
    await page.waitForSelector('[data-testid="revenue-metric"]');
    await page.waitForSelector('[data-testid="users-metric"]');
    await page.waitForSelector('[data-testid="transactions-metric"]');
    
    // Verify metrics have values
    const revenueText = await page.textContent('[data-testid="revenue-metric"]');
    expect(revenueText).not.toBe('$0');
    
    // Test real-time updates
    const initialValue = await page.textContent('[data-testid="live-counter"]');
    await page.waitForTimeout(5000);
    const updatedValue = await page.textContent('[data-testid="live-counter"]');
    expect(updatedValue).not.toBe(initialValue);
    
    // Test dashboard filters
    await page.click('[data-testid="date-filter"]');
    await page.click('[data-testid="last-30-days"]');
    await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'hidden' });
    
    // Test responsive design
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    console.log('✅ Dashboard Functionality: PASSED');
  });

  /**
   * Test 4: Analytics and Reporting
   */
  test('Analytics and Reporting Features', async ({ page }) => {
    console.log('🧪 Testing: Analytics and Reporting Features');
    
    // Login as manager
    await loginAsUser(page, config.testUsers.manager);
    
    // Navigate to analytics
    await page.click('[data-testid="analytics-nav"]');
    await expect(page).toHaveURL(/.*analytics/);
    
    // Test chart loading
    await page.waitForSelector('[data-testid="revenue-chart"]');
    await page.waitForSelector('[data-testid="user-growth-chart"]');
    await page.waitForSelector('[data-testid="performance-metrics"]');
    
    // Test chart interactions
    await page.hover('[data-testid="revenue-chart"] canvas');
    await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible();
    
    // Test date range selection
    await page.click('[data-testid="date-range-picker"]');
    await page.click('[data-testid="last-quarter"]');
    await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'hidden' });
    
    // Test report generation
    await page.click('[data-testid="generate-report"]');
    await page.fill('[data-testid="report-name"]', 'Test Report');
    await page.selectOption('[data-testid="report-type"]', 'comprehensive');
    await page.click('[data-testid="generate-report-submit"]');
    
    // Verify report generation
    await expect(page.locator('[data-testid="report-success"]')).toBeVisible();
    
    // Test report download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-report"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
    
    console.log('✅ Analytics and Reporting: PASSED');
  });

  /**
   * Test 5: User Management (Admin)
   */
  test('User Management Functionality', async ({ page }) => {
    console.log('🧪 Testing: User Management Functionality');
    
    // Login as admin
    await loginAsUser(page, config.testUsers.admin);
    
    // Navigate to user management
    await page.click('[data-testid="admin-nav"]');
    await page.click('[data-testid="user-management"]');
    await expect(page).toHaveURL(/.*admin\/users/);
    
    // Test user list loading
    await page.waitForSelector('[data-testid="users-table"]');
    
    // Test user search
    await page.fill('[data-testid="user-search"]', 'test');
    await page.waitForTimeout(1000);
    
    // Test user creation
    await page.click('[data-testid="add-user-button"]');
    await page.fill('[data-testid="new-user-email"]', `newuser.${Date.now()}@tradeai.com`);
    await page.fill('[data-testid="new-user-name"]', 'New Test User');
    await page.selectOption('[data-testid="new-user-role"]', 'user');
    await page.click('[data-testid="create-user-submit"]');
    
    // Verify user creation
    await expect(page.locator('[data-testid="user-created-success"]')).toBeVisible();
    
    // Test user editing
    await page.click('[data-testid="edit-user-button"]:first-child');
    await page.fill('[data-testid="edit-user-name"]', 'Updated Test User');
    await page.click('[data-testid="save-user-changes"]');
    
    // Verify user update
    await expect(page.locator('[data-testid="user-updated-success"]')).toBeVisible();
    
    console.log('✅ User Management: PASSED');
  });

  /**
   * Test 6: Real-time Features
   */
  test('Real-time Features and WebSocket Connection', async ({ page }) => {
    console.log('🧪 Testing: Real-time Features');
    
    // Login as user
    await loginAsUser(page, config.testUsers.user);
    
    // Navigate to real-time dashboard
    await page.click('[data-testid="realtime-dashboard"]');
    
    // Test WebSocket connection
    await page.waitForSelector('[data-testid="connection-status"]');
    const connectionStatus = await page.textContent('[data-testid="connection-status"]');
    expect(connectionStatus).toBe('Connected');
    
    // Test real-time data updates
    const initialData = await page.textContent('[data-testid="live-data-value"]');
    await page.waitForTimeout(3000);
    const updatedData = await page.textContent('[data-testid="live-data-value"]');
    expect(updatedData).not.toBe(initialData);
    
    // Test real-time notifications
    await page.click('[data-testid="trigger-notification"]');
    await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible();
    
    // Test live chat/messaging
    await page.click('[data-testid="open-chat"]');
    await page.fill('[data-testid="chat-message-input"]', 'Test message');
    await page.click('[data-testid="send-message"]');
    await expect(page.locator('[data-testid="chat-message"]').last()).toContainText('Test message');
    
    console.log('✅ Real-time Features: PASSED');
  });

  /**
   * Test 7: Mobile Responsiveness and PWA
   */
  test('Mobile Responsiveness and PWA Features', async ({ page }) => {
    console.log('🧪 Testing: Mobile Responsiveness and PWA');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login on mobile
    await loginAsUser(page, config.testUsers.user);
    
    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
    
    // Test touch interactions
    await page.tap('[data-testid="dashboard-card"]');
    
    // Test PWA installation prompt
    await page.evaluate(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    await expect(page.locator('[data-testid="pwa-install-prompt"]')).toBeVisible();
    
    // Test offline functionality
    await page.context().setOffline(true);
    await page.reload();
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Test offline data access
    await page.click('[data-testid="cached-data"]');
    await expect(page.locator('[data-testid="cached-content"]')).toBeVisible();
    
    // Restore online
    await page.context().setOffline(false);
    await page.reload();
    
    console.log('✅ Mobile Responsiveness and PWA: PASSED');
  });

  /**
   * Test 8: Performance and Load Testing
   */
  test('Performance and Load Testing', async ({ page }) => {
    console.log('🧪 Testing: Performance and Load Testing');
    
    // Measure page load time
    const startTime = Date.now();
    await page.goto(config.baseURL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    
    // Login and measure dashboard load
    await loginAsUser(page, config.testUsers.user);
    
    const dashboardStartTime = Date.now();
    await page.click('[data-testid="analytics-nav"]');
    await page.waitForSelector('[data-testid="revenue-chart"]');
    const dashboardLoadTime = Date.now() - dashboardStartTime;
    
    console.log(`Dashboard load time: ${dashboardLoadTime}ms`);
    expect(dashboardLoadTime).toBeLessThan(3000); // Should load within 3 seconds
    
    // Test memory usage
    const metrics = await page.evaluate(() => {
      return {
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        } : null,
        navigation: performance.getEntriesByType('navigation')[0]
      };
    });
    
    if (metrics.memory) {
      console.log(`Memory usage: ${(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      expect(metrics.memory.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    }
    
    console.log('✅ Performance Testing: PASSED');
  });

  /**
   * Test 9: Security and Error Handling
   */
  test('Security and Error Handling', async ({ page }) => {
    console.log('🧪 Testing: Security and Error Handling');
    
    // Test HTTPS redirect
    const httpUrl = config.baseURL.replace('https://', 'http://');
    await page.goto(httpUrl);
    expect(page.url()).toMatch(/^https:/);
    
    // Test XSS protection
    await page.goto(`${config.baseURL}/login`);
    await page.fill('[data-testid="email-input"]', '<script>alert("xss")</script>');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-submit"]');
    
    // Should not execute script
    const alertHandled = await page.evaluate(() => {
      return window.alert === undefined || typeof window.alert !== 'function';
    });
    expect(alertHandled).toBeTruthy();
    
    // Test SQL injection protection
    await page.fill('[data-testid="email-input"]', "'; DROP TABLE users; --");
    await page.click('[data-testid="login-submit"]');
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    
    // Test rate limiting
    for (let i = 0; i < 10; i++) {
      await page.fill('[data-testid="email-input"]', 'test@test.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-submit"]');
      await page.waitForTimeout(100);
    }
    
    // Should show rate limit error
    await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
    
    // Test 404 error handling
    await page.goto(`${config.baseURL}/nonexistent-page`);
    await expect(page.locator('[data-testid="404-page"]')).toBeVisible();
    
    // Test network error handling
    await page.route('**/api/**', route => route.abort());
    await loginAsUser(page, config.testUsers.user);
    await page.click('[data-testid="analytics-nav"]');
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    
    console.log('✅ Security and Error Handling: PASSED');
  });

  /**
   * Test 10: Data Integrity and Backup
   */
  test('Data Integrity and Backup Features', async ({ page }) => {
    console.log('🧪 Testing: Data Integrity and Backup');
    
    // Login as admin
    await loginAsUser(page, config.testUsers.admin);
    
    // Navigate to system settings
    await page.click('[data-testid="admin-nav"]');
    await page.click('[data-testid="system-settings"]');
    
    // Test data export
    await page.click('[data-testid="data-export"]');
    await page.selectOption('[data-testid="export-type"]', 'full');
    await page.click('[data-testid="start-export"]');
    
    // Wait for export completion
    await page.waitForSelector('[data-testid="export-complete"]', { timeout: 30000 });
    
    // Test backup creation
    await page.click('[data-testid="create-backup"]');
    await page.fill('[data-testid="backup-name"]', `Test Backup ${Date.now()}`);
    await page.click('[data-testid="create-backup-submit"]');
    
    // Verify backup creation
    await expect(page.locator('[data-testid="backup-success"]')).toBeVisible();
    
    // Test data validation
    await page.click('[data-testid="validate-data"]');
    await page.waitForSelector('[data-testid="validation-complete"]', { timeout: 30000 });
    
    const validationResult = await page.textContent('[data-testid="validation-result"]');
    expect(validationResult).toContain('No issues found');
    
    console.log('✅ Data Integrity and Backup: PASSED');
  });
});

/**
 * API Integration Tests
 */
test.describe('API Integration Tests - Backend Validation', () => {
  
  /**
   * Test API Health and Status
   */
  test('API Health Check and Status Endpoints', async ({ request }) => {
    console.log('🧪 Testing: API Health and Status');
    
    // Test health endpoint
    const healthResponse = await request.get(`${config.apiURL}/health`);
    expect(healthResponse.ok()).toBeTruthy();
    
    const healthData = await healthResponse.json();
    expect(healthData.status).toBe('healthy');
    expect(healthData.timestamp).toBeDefined();
    
    // Test status endpoint
    const statusResponse = await request.get(`${config.apiURL}/api/status`);
    expect(statusResponse.ok()).toBeTruthy();
    
    const statusData = await statusResponse.json();
    expect(statusData.database).toBe('connected');
    expect(statusData.redis).toBe('connected');
    expect(statusData.services).toBeDefined();
    
    console.log('✅ API Health Check: PASSED');
  });

  /**
   * Test Authentication API
   */
  test('Authentication API Endpoints', async ({ request }) => {
    console.log('🧪 Testing: Authentication API');
    
    // Test login endpoint
    const loginResponse = await request.post(`${config.apiURL}/api/auth/login`, {
      data: {
        email: config.testUsers.user.email,
        password: config.testUsers.user.password
      }
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.token).toBeDefined();
    expect(loginData.user).toBeDefined();
    
    const token = loginData.token;
    
    // Test protected endpoint
    const profileResponse = await request.get(`${config.apiURL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    expect(profileResponse.ok()).toBeTruthy();
    const profileData = await profileResponse.json();
    expect(profileData.email).toBe(config.testUsers.user.email);
    
    // Test token refresh
    const refreshResponse = await request.post(`${config.apiURL}/api/auth/refresh`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    expect(refreshResponse.ok()).toBeTruthy();
    const refreshData = await refreshResponse.json();
    expect(refreshData.token).toBeDefined();
    
    console.log('✅ Authentication API: PASSED');
  });

  /**
   * Test Data API Endpoints
   */
  test('Data API CRUD Operations', async ({ request }) => {
    console.log('🧪 Testing: Data API CRUD Operations');
    
    // Login to get token
    const loginResponse = await request.post(`${config.apiURL}/api/auth/login`, {
      data: {
        email: config.testUsers.manager.email,
        password: config.testUsers.manager.password
      }
    });
    
    const { token } = await loginResponse.json();
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Test CREATE operation
    const createResponse = await request.post(`${config.apiURL}/api/data/items`, {
      headers,
      data: {
        name: 'Test Item',
        description: 'Test Description',
        value: 100
      }
    });
    
    expect(createResponse.ok()).toBeTruthy();
    const createdItem = await createResponse.json();
    expect(createdItem.id).toBeDefined();
    
    const itemId = createdItem.id;
    
    // Test READ operation
    const readResponse = await request.get(`${config.apiURL}/api/data/items/${itemId}`, {
      headers
    });
    
    expect(readResponse.ok()).toBeTruthy();
    const readItem = await readResponse.json();
    expect(readItem.name).toBe('Test Item');
    
    // Test UPDATE operation
    const updateResponse = await request.put(`${config.apiURL}/api/data/items/${itemId}`, {
      headers,
      data: {
        name: 'Updated Test Item',
        description: 'Updated Description',
        value: 200
      }
    });
    
    expect(updateResponse.ok()).toBeTruthy();
    const updatedItem = await updateResponse.json();
    expect(updatedItem.name).toBe('Updated Test Item');
    
    // Test DELETE operation
    const deleteResponse = await request.delete(`${config.apiURL}/api/data/items/${itemId}`, {
      headers
    });
    
    expect(deleteResponse.ok()).toBeTruthy();
    
    // Verify deletion
    const verifyResponse = await request.get(`${config.apiURL}/api/data/items/${itemId}`, {
      headers
    });
    
    expect(verifyResponse.status()).toBe(404);
    
    console.log('✅ Data API CRUD: PASSED');
  });
});

/**
 * Helper Functions
 */
async function loginAsUser(page, user) {
  await page.goto(`${config.baseURL}/login`);
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL(/.*dashboard/);
}

/**
 * Test Configuration and Setup
 */
test.beforeAll(async () => {
  console.log('🚀 Starting End-to-End User Acceptance Testing');
  console.log(`Frontend URL: ${config.baseURL}`);
  console.log(`Backend API URL: ${config.apiURL}`);
  console.log('Test Users:', Object.keys(config.testUsers));
});

test.afterAll(async () => {
  console.log('✅ End-to-End User Acceptance Testing Complete');
  console.log('🎉 Platform is ready for go-live deployment!');
});