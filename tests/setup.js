import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillUpdate'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Global test utilities
global.testUtils = {
  // Mock user data
  mockUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin',
    tenantId: 'test-tenant-id'
  },

  // Mock tenant data
  mockTenant: {
    id: 'test-tenant-id',
    name: 'Test Organization',
    domain: 'test.com',
    settings: {
      currency: 'ZAR',
      timezone: 'Africa/Johannesburg'
    }
  },

  // Mock API responses
  mockApiResponse: (data, success = true) => ({
    success,
    data,
    message: success ? 'Success' : 'Error',
    timestamp: new Date().toISOString()
  }),

  // Mock error response
  mockErrorResponse: (message = 'Test error', code = 'TEST_ERROR') => ({
    success: false,
    error: {
      code,
      message,
      details: {}
    },
    timestamp: new Date().toISOString()
  }),

  // Wait for async operations
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate test data
  generateTestData: {
    product: (overrides = {}) => ({
      id: 'test-product-id',
      name: 'Test Product',
      sku: 'TEST-SKU',
      category: 'Test Category',
      price: 100,
      cost: 60,
      margin: 40,
      ...overrides
    }),

    promotion: (overrides = {}) => ({
      id: 'test-promotion-id',
      name: 'Test Promotion',
      type: 'discount',
      value: 20,
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      status: 'active',
      roi: 250,
      spend: 10000,
      uplift: 25,
      ...overrides
    }),

    tradeSpend: (overrides = {}) => ({
      id: 'test-tradespend-id',
      customer: 'Test Customer',
      budget: 50000,
      actualSpend: 45000,
      salesImpact: 125000,
      roi: 278,
      utilization: 90,
      status: 'active',
      ...overrides
    })
  }
};