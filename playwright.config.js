const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright E2E Test Configuration for TRADEAI
 * 
 * Tests run against production: https://tradeai.gonxt.tech
 */
module.exports = defineConfig({
  testDir: './tests',
  testMatch: [
    '**/e2e/**/*.spec.{ts,js}',
    '**/regression/**/*.spec.{ts,js}',
    '**/roles/**/*.spec.{ts,js}',
    '**/workflows/**/*.spec.{ts,js}',
    '**/ai/**/*.spec.{ts,js}',
    '**/ui/**/*.spec.{ts,js}'
  ],
  
  timeout: 60 * 1000,
  
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  
  globalSetup: require.resolve('./tests/e2e-global-setup.js'),
  
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'https://tradeai.gonxt.tech',
    
    storageState: '.auth/user.json',
    
    trace: 'on-first-retry',
    
    screenshot: 'only-on-failure',
    
    video: 'retain-on-failure',
    
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
