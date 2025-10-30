/**
 * Playwright Configuration for E2E Tests
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
    ['list']
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'https://tradeai.gonxt.tech',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Maximum time each action such as `click()` can take
    actionTimeout: 10000,
    
    // Maximum time each navigation can take
    navigationTimeout: 30000,
    
    // Emulate viewport
    viewport: { width: 1920, height: 1080 },
    
    // Emulate screen size
    screen: { width: 1920, height: 1080 },
    
    // User agent
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    
    // Accept downloads
    acceptDownloads: true,
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Locale
    locale: 'en-US',
    
    // Timezone
    timezoneId: 'Africa/Johannesburg'
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome'
      }
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },

    // Test against mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    },

    // Test against branded browsers
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'],
        channel: 'msedge'
      }
    }
  ],

  // Run your local dev server before starting the tests
  webServer: process.env.CI ? undefined : {
    command: 'cd ../frontend && npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },

  // Global timeout for the entire test run
  globalTimeout: 600000, // 10 minutes

  // Timeout for each test
  timeout: 30000, // 30 seconds

  // Expect timeout
  expect: {
    timeout: 5000
  }
});
