const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

// Load environment variables from .env.test file
require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });

/**
 * Playwright Configuration for TRADEAI E2E Testing
 * All configuration values are loaded from .env.test file
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Maximum time one test can run (from .env.test)
  timeout: parseInt(process.env.CI_TIMEOUT) || parseInt(process.env.DEFAULT_TIMEOUT) || 60000,
  
  // Test execution settings (from .env.test)
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? parseInt(process.env.CI_RETRIES || '3') : parseInt(process.env.MAX_RETRIES || '2'),
  workers: process.env.CI ? 1 : parseInt(process.env.WORKERS || '3'),
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for the application (from .env.test)
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    
    // API URL for backend testing
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
    
    // Collect trace on first retry (from .env.test)
    trace: process.env.TRACE_ON_FAILURE === 'true' ? 'on-first-retry' : 'off',
    
    // Screenshot on failure (from .env.test)
    screenshot: process.env.SCREENSHOT_ON_FAILURE === 'true' ? 'only-on-failure' : 'off',
    
    // Video on failure (from .env.test)
    video: process.env.VIDEO_ON_FAILURE === 'true' ? 'retain-on-failure' : 'off',
    
    // Browser viewport (from .env.test)
    viewport: { 
      width: parseInt(process.env.BROWSER_VIEWPORT_WIDTH) || 1920, 
      height: parseInt(process.env.BROWSER_VIEWPORT_HEIGHT) || 1080 
    },
    
    // Ignore HTTPS errors (for development)
    ignoreHTTPSErrors: true,
    
    // Action timeout
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-application-cache',
            '--disable-cache',
            '--disable-gpu-shader-disk-cache',
            '--disable-offline-load-stale-cache',
            '--disk-cache-size=1'
          ]
        },
        // Disable service workers
        serviceWorkers: 'block',
      },
    },
    
    // Uncomment to test on Firefox
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // Uncomment to test on Safari
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Web server configuration (if needed)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3001',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
