# TRADEAI Testing Framework Configuration
# Industry-Leading Test Coverage Target: 80%+

module.exports = {
  // Test Environment
  testEnvironment: 'node',
  
  // Test Match Patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js',
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Coverage Configuration - Industry Leading Targets
  collectCoverageFrom: [
    'backend/src/**/*.js',
    '!backend/src/**/*.test.js',
    '!backend/src/**/*.spec.js',
    '!backend/src/migrations/**',
    '!backend/src/seeders/**',
    '!backend/src/config/**'
  ],
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json'
  ],
  
  coverageDirectory: 'coverage',
  
  // Reporter Configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'jest-results.xml',
      classNameTemplate: '{classname}-{title}',
      titleTemplate: '{classname}-{title}',
      ancestorSeparator: ' › ',
      suiteNameTemplate: '{filename}',
    }],
    ['jest-html-reporters', {
      publicPath: 'test-results',
      filename: 'jest-report.html',
      expand: true
    }]
  ],
  
  // Verbose Output
  verbose: true,
  
  // Clear Mocks Between Tests
  clearMocks: true,
  
  // Reset Modules Between Tests
  resetModules: true,
  
  // Restore Mocks Between Tests
  restoreMocks: true,
  
  // Test Timeout (5 minutes for integration tests)
  testTimeout: 300000,
  
  // Max Workers
  maxWorkers: '50%',
  
  // Worker Idle Timeout
  workerIdleMemoryLimit: '512MB',
  
  // Transform Configuration
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.jsx$': 'babel-jest'
  },
  
  // Module File Extensions
  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
  
  // Setup Files
  setupFilesAfterEnv: ['<rootDir>/backend/src/__tests__/setup.js'],
  
  // Global Setup (runs once before all tests)
  globalSetup: '<rootDir>/backend/src/__tests__/global-setup.js',
  
  // Global Teardown (runs once after all tests)
  globalTeardown: '<rootDir>/backend/src/__tests__/global-teardown.js',
  
  // Test Runner
  testRunner: 'jest-circus/runner',
  
  // Detect Open Handles
  detectOpenHandles: true,
  
  // Detect Leaks
  detectLeaks: true,
  
  // Error on Deprecation
  errorOnDeprecated: true,
  
  // Bail on First Failure (disable for CI)
  bail: false,
  
  // Fail Fast (disable for CI)
  failFast: false,
  
  // Force Exit
  forceExit: true,
  
  // Log Heap Usage
  logHeapUsage: true,
  
  // List Tests
  listTests: false,
  
  // No Colors (for CI)
  colors: true,
  
  // Notify on Failure
  notify: false,
  
  // Notify Mode
  notifyMode: 'failure-change',
  
  // Only Changed (for watch mode)
  onlyChanged: false,
  
  // Pass With No Tests
  passWithNoTests: false,
  
  // Root Directory
  rootDir: '../',
  
  // Module Name Mapper
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/backend/src/$1',
    '^@services/(.*)$': '<rootDir>/backend/src/services/$1',
    '^@models/(.*)$': '<rootDir>/backend/src/models/$1',
    '^@controllers/(.*)$': '<rootDir>/backend/src/controllers/$1',
    '^@middleware/(.*)$': '<rootDir>/backend/src/middleware/$1',
    '^@utils/(.*)$': '<rootDir>/backend/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/backend/src/config/$1'
  },
  
  // Test Path Ignore Patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/test-results/',
    '/dist/',
    '/build/'
  ],
  
  // Coverage Path Ignore Patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/test-results/',
    '/dist/',
    '/build/',
    '/migrations/',
    '/seeders/'
  ],
  
  // Slow Test Threshold
  slowTestThreshold: 5,
  
  // Snapshot Format
  snapshotFormat: {
    escapeString: false,
    printBasicPrototype: false
  }
};
