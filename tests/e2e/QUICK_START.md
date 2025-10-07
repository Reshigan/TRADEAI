# 🚀 E2E Tests - Quick Start Guide

## Prerequisites

Ensure both services are running:

```bash
# Terminal 1: Start Frontend (port 3001)
npm run dev

# Terminal 2: Start Backend (port 5002)
# (Follow backend startup instructions)
```

---

## Run All Tests (Recommended)

```bash
# Run complete test suite (45 tests, ~3.3 minutes)
npx playwright test tests/e2e/full-system.spec.js
```

---

## View Test Report

```bash
# Open HTML report in browser
npx playwright show-report
```

---

## Run Specific Test Categories

```bash
# Authentication tests only
npx playwright test tests/e2e/full-system.spec.js -g "Authentication"

# Budget management tests
npx playwright test tests/e2e/full-system.spec.js -g "Budget"

# Performance tests
npx playwright test tests/e2e/full-system.spec.js -g "Performance"

# Error handling tests
npx playwright test tests/e2e/full-system.spec.js -g "Error"
```

---

## Debug Mode

```bash
# Run with visible browser (headed mode)
npx playwright test tests/e2e/full-system.spec.js --headed

# Run with Playwright Inspector (step through tests)
npx playwright test tests/e2e/full-system.spec.js --debug

# Run in UI mode (interactive)
npx playwright test tests/e2e/full-system.spec.js --ui
```

---

## Run Specific Tests

```bash
# Run single test by line number
npx playwright test tests/e2e/full-system.spec.js:122

# Run only failed tests (from previous run)
npx playwright test tests/e2e/full-system.spec.js --last-failed

# Run with retries
npx playwright test tests/e2e/full-system.spec.js --retries=2
```

---

## Generate Reports

```bash
# Generate HTML report
npx playwright test tests/e2e/full-system.spec.js --reporter=html

# Generate JSON report
npx playwright test tests/e2e/full-system.spec.js --reporter=json

# Multiple reporters
npx playwright test tests/e2e/full-system.spec.js --reporter=list --reporter=html
```

---

## Test Credentials

**Admin User:**
- Email: `admin@tradeai.com`
- Password: `admin123`

**Environment:**
- Frontend: http://localhost:3001
- Backend: http://localhost:5002
- Test Config: `.env.test`

---

## Expected Results

✅ **All 45 tests should PASS**  
⏱️ **Execution time: ~3.3 minutes**  
📊 **Pass rate: 100%**

---

## Troubleshooting

### Tests fail immediately?
- ✅ Check frontend is running on port 3001
- ✅ Check backend is running on port 5002
- ✅ Verify test credentials in .env.test

### Tests timeout?
- ✅ Increase timeout: `npx playwright test --timeout=60000`
- ✅ Check network connectivity
- ✅ Verify services are responsive

### Specific test fails?
- ✅ Run in headed mode: `npx playwright test --headed`
- ✅ Use debug mode: `npx playwright test --debug`
- ✅ Check screenshots in `test-results/` folder

---

## Useful Commands

```bash
# Install Playwright browsers (if needed)
npx playwright install

# Update Playwright
npm install -D @playwright/test@latest

# Show installed browsers
npx playwright show-browsers

# Clear test results
rm -rf test-results/
rm -rf playwright-report/
```

---

## Documentation

📄 **Comprehensive Results:** [TEST_RESULTS.md](./TEST_RESULTS.md)  
📄 **Executive Summary:** [../../E2E_TEST_SUMMARY.md](../../E2E_TEST_SUMMARY.md)  
📄 **Full README:** [README.md](./README.md)  

---

## CI/CD Integration (Future)

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: npx playwright test tests/e2e/full-system.spec.js
  
- name: Upload Test Report
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

---

*Last Updated: 2025-10-07*  
*Test Suite: full-system.spec.js (45 tests, 100% pass rate)* ✅
