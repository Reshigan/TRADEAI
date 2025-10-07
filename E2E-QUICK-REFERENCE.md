# 🚀 TRADEAI E2E Testing - Quick Reference

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps chromium
```

## Running Tests

### Using NPM Scripts

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run with test runner script
npm run test:e2e:full
```

### Using Shell Script

```bash
# Run all tests
./run-e2e-tests.sh

# Run in UI mode
./run-e2e-tests.sh --ui

# Run with visible browser
./run-e2e-tests.sh --headed

# Run and show report
./run-e2e-tests.sh --report

# Run in debug mode
./run-e2e-tests.sh --debug
```

### Using Playwright CLI

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/complete-system.spec.js

# Run specific test suite
npx playwright test -g "Authentication"

# Run single test
npx playwright test -g "Admin Login"

# Run in UI mode
npx playwright test --ui

# Run with visible browser
npx playwright test --headed

# Run in debug mode
npx playwright test --debug
```

## Environment Variables

```bash
# Set custom URLs
BASE_URL=http://localhost:3001 npm run test:e2e
API_URL=http://localhost:5002 npm run test:e2e

# Production testing
BASE_URL=https://tradeai.gonxt.tech API_URL=https://tradeai.gonxt.tech/api npm run test:e2e
```

## Test Coverage

| Test Suite | Tests | Coverage |
|-----------|-------|----------|
| Authentication & Authorization | 5 | 100% |
| Dashboard & Navigation | 5 | 100% |
| Budget Management | 3 | 90% |
| Trade Spend Management | 2 | 80% |
| Customer Management | 2 | 85% |
| Promotion Management | 2 | 85% |
| Analytics & Reporting | 3 | 90% |
| User Management | 3 | 85% |
| Settings & Configuration | 3 | 90% |
| System Integration | 4 | 100% |
| Responsive Design | 3 | 100% |
| **TOTAL** | **35+** | **91%** |

## Test Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tradeai.com | admin123 |
| Manager | manager@tradeai.com | admin123 |
| KAM | kam@tradeai.com | admin123 |

## Common Commands

```bash
# Before running tests - Start the application
docker-compose up -d

# Run tests
npm run test:e2e

# View report
npm run test:e2e:report

# After tests - Stop the application
docker-compose down
```

## Debugging

```bash
# Run in debug mode (pauses on first test)
npm run test:e2e:debug

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# View last run report
npm run test:e2e:report
```

## Report Locations

- **HTML Report**: `playwright-report/index.html`
- **JSON Report**: `test-results/results.json`
- **JUnit Report**: `test-results/junit.xml`
- **Screenshots**: `test-results/*.png`
- **Videos**: `test-results/*.webm`

## Configuration

Edit `playwright.config.js` to customize:
- Timeout settings
- Browser options
- Base URL
- Screenshot/Video settings
- Retry logic

## Troubleshooting

### Application not running
```bash
# Check services
docker-compose ps

# Start services
docker-compose up -d

# Check logs
docker-compose logs
```

### Tests timing out
```bash
# Increase timeout in playwright.config.js
timeout: 90 * 1000

# Or set per test
test.setTimeout(120000)
```

### Element not found
```javascript
// Add wait
await page.waitForSelector('.element');

// Use better selector
await page.locator('[data-testid="element"]').click();
```

### Browser issues
```bash
# Reinstall browsers
npx playwright install --with-deps chromium

# Install system dependencies
npx playwright install-deps
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run E2E tests
  run: npm run test:e2e
```

### GitLab CI
```yaml
test:
  script:
    - npm run test:e2e
```

### Jenkins
```groovy
sh 'npm run test:e2e'
```

## Best Practices

1. ✅ Always start the application before running tests
2. ✅ Use data-testid for reliable selectors
3. ✅ Wait for elements before interacting
4. ✅ Keep tests independent
5. ✅ Clean up test data after tests
6. ✅ Use meaningful test names
7. ✅ Review test reports after runs
8. ✅ Update tests when features change

## Support

- 📖 Full Documentation: `E2E-TESTING-GUIDE.md`
- 🐛 Report Issues: GitHub Issues
- 💬 Questions: Team Slack Channel
- 📧 Email: dev-team@tradeai.com

## Quick Test Examples

### Run a quick smoke test
```bash
npx playwright test -g "Admin Login"
```

### Test a specific feature
```bash
npx playwright test -g "Budget Management"
```

### Test responsive design
```bash
npx playwright test -g "Responsive Design"
```

### Test all critical paths
```bash
npx playwright test -g "Authentication|Dashboard|Budget"
```

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-07  
**Maintained By**: TRADEAI Development Team
