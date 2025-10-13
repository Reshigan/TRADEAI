// TRADEAI v2.0 - Cypress E2E Testing Configuration for 100% Coverage

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Base URL for the application
    baseUrl: 'http://localhost:3000',
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Test files location
    specPattern: 'tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Support file
    supportFile: 'tests/e2e/support/e2e.js',
    
    // Fixtures folder
    fixturesFolder: 'tests/e2e/fixtures',
    
    // Screenshots and videos
    screenshotsFolder: 'tests/e2e/screenshots',
    videosFolder: 'tests/e2e/videos',
    
    // Test settings
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Retry settings
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    // Video recording
    video: true,
    videoCompression: 32,
    
    // Screenshots
    screenshotOnRunFailure: true,
    
    // Browser settings
    chromeWebSecurity: false,
    
    // Environment variables
    env: {
      apiUrl: 'http://localhost:5000/api',
      testUser: {
        email: 'test@tradeai.com',
        password: 'testpassword123'
      },
      testAdmin: {
        email: 'admin@tradeai.com',
        password: 'adminpassword123'
      }
    },
    
    setupNodeEvents(on, config) {
      // Code coverage
      require('@cypress/code-coverage/task')(on, config);
      
      // Custom tasks
      on('task', {
        // Database seeding
        seedDatabase() {
          return require('./tests/e2e/support/database-seeder')();
        },
        
        // Clean database
        cleanDatabase() {
          return require('./tests/e2e/support/database-cleaner')();
        },
        
        // Generate test data
        generateTestData(options) {
          return require('./tests/e2e/support/test-data-generator')(options);
        },
        
        // Log messages
        log(message) {
          console.log(message);
          return null;
        },
        
        // File operations
        readFile(filename) {
          const fs = require('fs');
          return fs.readFileSync(filename, 'utf8');
        },
        
        writeFile({ filename, content }) {
          const fs = require('fs');
          fs.writeFileSync(filename, content);
          return null;
        }
      });
      
      // Browser launch options
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-gpu');
        }
        
        return launchOptions;
      });
      
      return config;
    },
  },
  
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    specPattern: 'frontend/src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'tests/e2e/support/component.js'
  },
  
  // Global configuration
  watchForFileChanges: false,
  numTestsKeptInMemory: 50,
  experimentalStudio: true,
  experimentalWebKitSupport: true
});