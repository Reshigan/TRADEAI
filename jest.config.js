// TRADEAI v2.0 - Comprehensive Jest Configuration for 100% Test Coverage

module.exports = {
  // Test environment setup
  testEnvironment: 'jsdom',
  
  // Root directories for tests
  roots: [
    '<rootDir>/frontend/src',
    '<rootDir>/backend/src',
    '<rootDir>/ai-services/src'
  ],
  
  // Module file extensions
  moduleFileExtensions: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'node'
  ],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.css$': 'jest-transform-css',
    '^.+\\.(png|jpg|jpeg|gif|svg)$': 'jest-transform-file'
  },
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1',
    '^@backend/(.*)$': '<rootDir>/backend/src/$1',
    '^@ai/(.*)$': '<rootDir>/ai-services/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/frontend/src/setupTests.js',
    '<rootDir>/backend/src/__tests__/setup.js'
  ],
  
  // Coverage configuration for 100% coverage
  collectCoverage: true,
  collectCoverageFrom: [
    // Frontend coverage
    'frontend/src/**/*.{js,jsx,ts,tsx}',
    '!frontend/src/index.js',
    '!frontend/src/setupTests.js',
    '!frontend/src/**/*.stories.{js,jsx,ts,tsx}',
    
    // Backend coverage
    'backend/src/**/*.{js,jsx,ts,tsx}',
    '!backend/src/server.js',
    '!backend/src/**/*.config.{js,ts}',
    '!backend/src/migrations/**',
    '!backend/src/seeds/**',
    
    // AI services coverage
    'ai-services/src/**/*.{js,jsx,ts,tsx,py}',
    '!ai-services/src/**/*.config.{js,ts,py}'
  ],
  
  // Coverage thresholds - 100% required
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    // Specific thresholds for critical modules
    'frontend/src/components/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    'frontend/src/services/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    'backend/src/controllers/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    'backend/src/services/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    'backend/src/middleware/': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'json',
    'lcov',
    'clover'
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/global-setup.js',
  globalTeardown: '<rootDir>/tests/global-teardown.js',
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/frontend/src',
    '<rootDir>/backend/src',
    '<rootDir>/ai-services/src'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '/coverage/'
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Projects for multi-project setup
  projects: [
    {
      displayName: 'Frontend',
      testMatch: ['<rootDir>/frontend/src/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/frontend/src/setupTests.js']
    },
    {
      displayName: 'Backend',
      testMatch: ['<rootDir>/backend/src/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/backend/src/__tests__/setup.js']
    },
    {
      displayName: 'Integration',
      testMatch: ['<rootDir>/tests/integration/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.js']
    },
    {
      displayName: 'E2E',
      testMatch: ['<rootDir>/tests/e2e/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.js']
    }
  ],
  
  // Error handling
  errorOnDeprecated: true,
  
  // Snapshot serializers
  snapshotSerializers: [
    'enzyme-to-json/serializer'
  ],
  
  // Custom matchers
  setupFilesAfterEnv: [
    '<rootDir>/tests/custom-matchers.js'
  ]
};