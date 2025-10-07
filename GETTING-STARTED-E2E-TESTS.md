# 🚀 Getting Started with TRADEAI E2E Tests

## 5-Minute Quick Start

### Step 1: Install Dependencies (2 minutes)

```bash
# Install npm packages
npm install

# Install Playwright and browsers
npx playwright install --with-deps chromium
```

### Step 2: Start Application (1 minute)

```bash
# Start all services with Docker
docker-compose up -d

# Wait for services to be ready (check status)
docker-compose ps
```

### Step 3: Run Tests (2 minutes)

```bash
# Run all E2E tests
npm run test:e2e
```

That's it! 🎉

---

## View Test Results

```bash
# Open the HTML report in your browser
npm run test:e2e:report
```

---

## Common Commands

```bash
# Run tests with visible browser (watch them execute)
npm run test:e2e:headed

# Run tests in interactive UI mode
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run specific test
npx playwright test -g "Admin Login"

# Run specific test suite
npx playwright test -g "Authentication"
```

---

## Test Credentials

Use these accounts to manually test:

| Role    | Email                  | Password  |
|---------|------------------------|-----------|
| Admin   | admin@tradeai.com      | admin123  |
| Manager | manager@tradeai.com    | admin123  |
| KAM     | kam@tradeai.com        | admin123  |

---

## What Gets Tested?

✅ **User Login/Logout** - Authentication flows  
✅ **Dashboard** - Main dashboard and navigation  
✅ **Budget Management** - Create, view, search budgets  
✅ **Trade Spends** - View and filter trade spends  
✅ **Customers** - Customer management  
✅ **Promotions** - Promotion planning  
✅ **Analytics** - Reports and charts  
✅ **User Management** - Admin features  
✅ **Settings** - Configuration  
✅ **Performance** - API health and speed  
✅ **Responsive Design** - Mobile, tablet, desktop  

**Total: 35+ automated tests**

---

## Project Structure

```
TRADEAI/
├── tests/e2e/
│   └── complete-system.spec.js    ← All tests here
├── playwright.config.js            ← Configuration
├── run-e2e-tests.sh               ← Test runner script
└── package.json                    ← npm scripts
```

---

## Troubleshooting

### Problem: Tests fail with "Connection refused"
**Solution**: Make sure the application is running
```bash
docker-compose up -d
curl http://localhost:3001
```

### Problem: Browser doesn't launch
**Solution**: Reinstall Playwright browsers
```bash
npx playwright install --with-deps chromium
```

### Problem: Tests timeout
**Solution**: Increase timeout or check if services are slow
```bash
# Check service logs
docker-compose logs

# Or run tests with more time
npx playwright test --timeout=90000
```

### Problem: Can't find test reports
**Solution**: Reports are in:
- HTML: `playwright-report/index.html`
- JSON: `test-results/results.json`
- View: `npm run test:e2e:report`

---

## Next Steps

1. ✅ Run tests successfully
2. 📖 Read `E2E-QUICK-REFERENCE.md` for more commands
3. 📚 Check `E2E-TESTING-GUIDE.md` for detailed docs
4. 🔧 Customize `playwright.config.js` for your needs
5. ➕ Add your own tests to `tests/e2e/complete-system.spec.js`

---

## Need Help?

- 📖 **Quick Reference**: `E2E-QUICK-REFERENCE.md`
- 📚 **Full Guide**: `E2E-TESTING-GUIDE.md`
- 🏗️ **Architecture**: `E2E-TEST-ARCHITECTURE.md`
- 📝 **Summary**: `E2E-TEST-IMPLEMENTATION-SUMMARY.md`
- 🐛 **Issues**: GitHub Issues
- 💬 **Questions**: Team Slack

---

## Tips

💡 **Tip 1**: Use UI mode for interactive debugging
```bash
npm run test:e2e:ui
```

💡 **Tip 2**: Run specific tests when developing
```bash
npx playwright test -g "the feature you're working on"
```

💡 **Tip 3**: Keep the test report open while developing
```bash
npm run test:e2e:report
```

💡 **Tip 4**: Use headed mode to watch tests
```bash
npm run test:e2e:headed
```

💡 **Tip 5**: Check application logs if tests fail
```bash
docker-compose logs -f
```

---

## Success!

You're now ready to run and maintain E2E tests for TRADEAI! 🎉

**Happy Testing!** 🚀

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-07
