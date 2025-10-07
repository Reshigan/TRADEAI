# 🧪 TRADEAI End-to-End Tests

This directory contains comprehensive end-to-end tests for the TRADEAI platform using Playwright.

## Test Files

### `complete-system.spec.js`
Comprehensive test suite covering all major system functionalities with 35+ tests organized into 11 test suites:

1. **Authentication & Authorization** (5 tests)
   - Admin login
   - Manager login
   - Invalid login rejection
   - Session persistence
   - Logout functionality

2. **Dashboard & Navigation** (5 tests)
   - Dashboard loading
   - Navigation menu
   - Page navigation

3. **Budget Management** (3 tests)
   - View budgets
   - Create budgets
   - Search and filter

4. **Trade Spend Management** (2 tests)
   - View trade spends
   - Filter functionality

5. **Customer Management** (2 tests)
   - View customers
   - Customer details

6. **Promotion Management** (2 tests)
   - View promotions
   - Calendar view

7. **Analytics & Reporting** (3 tests)
   - Analytics dashboard
   - Report generation
   - Data export

8. **User Management** (3 tests)
   - View users
   - Create users
   - Manage roles

9. **Settings & Configuration** (3 tests)
   - Settings page
   - Profile updates
   - Password change

10. **System Integration & Performance** (4 tests)
    - API health
    - Page performance
    - Concurrent operations
    - Error handling

11. **Responsive Design** (3 tests)
    - Mobile view
    - Tablet view
    - Desktop view

## Running Tests

### Quick Start

```bash
# From project root
npm run test:e2e

# From this directory
npx playwright test
```

### Interactive Mode

```bash
# UI mode for interactive testing
npm run test:e2e:ui
```

### Debug Mode

```bash
# Debug mode with DevTools
npm run test:e2e:debug
```

### Headed Mode

```bash
# Run with visible browser
npm run test:e2e:headed
```

## Test Configuration

Tests are configured in `playwright.config.js` at the project root:

- **Base URL**: `http://localhost:3001`
- **API URL**: `http://localhost:5002`
- **Timeout**: 60 seconds per test
- **Retries**: 1 retry on failure
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Trace**: Enabled on first retry

## Test Users

The following test users are available:

```javascript
admin: {
  email: 'admin@tradeai.com',
  password: 'admin123'
}

manager: {
  email: 'manager@tradeai.com',
  password: 'admin123'
}

kam: {
  email: 'kam@tradeai.com',
  password: 'admin123'
}
```

## Helper Functions

The test suite includes several helper functions:

### `helpers.login(page, user)`
Logs in a user with automatic form detection and submission.

```javascript
await helpers.login(page, CONFIG.users.admin);
```

### `helpers.logout(page)`
Logs out the current user with multiple detection methods.

```javascript
await helpers.logout(page);
```

### `helpers.navigateTo(page, route)`
Navigates to a specific route and waits for loading.

```javascript
await helpers.navigateTo(page, '/dashboard');
```

### `helpers.waitForElement(page, selector, timeout)`
Waits for an element to be visible and ready.

```javascript
const element = await helpers.waitForElement(page, '.data-loaded');
```

## Writing New Tests

### Template

```javascript
test.describe('Feature Name', () => {
  
  test.beforeEach(async ({ page }) => {
    await helpers.login(page, CONFIG.users.admin);
  });

  test('Test Description', async ({ page }) => {
    console.log('🧪 Test: Description');
    
    // Navigate
    await helpers.navigateTo(page, '/feature');
    
    // Interact
    await page.click('button');
    await page.fill('input', 'value');
    
    // Assert
    await expect(page.locator('.result')).toBeVisible();
    
    console.log('✅ Test Passed');
  });
});
```

### Best Practices

1. **Use descriptive test names**
   ```javascript
   test('User should be able to create a budget with valid data', ...)
   ```

2. **Add console logs for clarity**
   ```javascript
   console.log('🧪 Test 1.1: Admin Login');
   console.log('✅ Test 1.1 Passed');
   ```

3. **Use proper waits**
   ```javascript
   await page.waitForLoadState('networkidle');
   await page.waitForSelector('.element');
   ```

4. **Handle optional elements**
   ```javascript
   if (await element.count() > 0) {
     await element.click();
   } else {
     console.log('⚠️ Element not found, skipping');
   }
   ```

5. **Use flexible selectors**
   ```javascript
   // Multiple selector options
   const button = page.locator('button:has-text("Submit"), button[type="submit"]').first();
   ```

## Debugging Tests

### View Last Run Report

```bash
npm run test:e2e:report
```

### Run Specific Test

```bash
npx playwright test -g "Admin Login"
```

### Run Specific Suite

```bash
npx playwright test -g "Authentication"
```

### Enable Tracing

```javascript
// In test
await page.context().tracing.start({ screenshots: true, snapshots: true });
// ... test code ...
await page.context().tracing.stop({ path: 'trace.zip' });
```

### View Trace

```bash
npx playwright show-trace trace.zip
```

## Test Reports

After running tests, view reports at:

- **HTML Report**: `../../playwright-report/index.html`
- **JSON Report**: `../../test-results/results.json`
- **JUnit Report**: `../../test-results/junit.xml`

## CI/CD Integration

Tests are designed for CI/CD integration:

```yaml
# GitHub Actions example
- name: Run E2E tests
  run: npm run test:e2e
  
- name: Upload test results
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Tests Timeout
- Increase timeout in `playwright.config.js`
- Check if application is running
- Verify network connectivity

### Element Not Found
- Use more flexible selectors
- Add proper waits
- Check if element is actually rendered

### Login Fails
- Verify test user credentials
- Check backend is running
- Verify database is seeded

### Browser Launch Fails
- Run: `npx playwright install --with-deps chromium`
- Check system dependencies
- Try headed mode: `--headed`

## Support

- 📖 Full Guide: `../../E2E-TESTING-GUIDE.md`
- 🚀 Quick Reference: `../../E2E-QUICK-REFERENCE.md`
- 🐛 Issues: GitHub Issues
- 💬 Questions: Team Slack

## Version History

### v1.0.0 (2025-10-07)
- Initial comprehensive E2E test suite
- 35+ tests across 11 test suites
- Complete coverage of critical user journeys
- Helper functions for common operations
- Comprehensive documentation

---

**Maintained By**: TRADEAI Development Team  
**Last Updated**: 2025-10-07
