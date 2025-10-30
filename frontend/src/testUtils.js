/**
 * Test Utilities for Frontend Testing
 * Custom render functions and test helpers
 */

import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { createMemoryHistory } from 'history';

/**
 * Custom render with Router wrapper
 */
export function renderWithRouter(ui, { route = '/', history = createMemoryHistory({ initialEntries: [route] }), ...renderOptions } = {}) {
  const Wrapper = ({ children }) => (
    <BrowserRouter history={history}>
      {children}
    </BrowserRouter>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    history,
  };
}

/**
 * Create mock user
 */
export function createMockUser(overrides = {}) {
  return {
    id: '123456789',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    tenant: 'mondelez',
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Create mock promotion
 */
export function createMockPromotion(overrides = {}) {
  return {
    _id: 'promo123',
    name: 'Test Promotion',
    type: 'Price Reduction',
    status: 'draft',
    startDate: '2025-11-01',
    endDate: '2025-12-31',
    budget: {
      allocated: 50000,
      spent: 0,
      currency: 'ZAR'
    },
    company: 'comp123',
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Create mock customer
 */
export function createMockCustomer(overrides = {}) {
  return {
    _id: 'cust123',
    name: 'Test Customer',
    code: 'CUST001',
    tier: 'Gold',
    channel: 'Retail',
    status: 'active',
    ...overrides
  };
}

/**
 * Create mock product
 */
export function createMockProduct(overrides = {}) {
  return {
    _id: 'prod123',
    name: 'Test Product',
    code: 'PROD001',
    brand: 'Cadbury',
    category: 'Chocolate',
    status: 'active',
    pricing: {
      cost: 10,
      listPrice: 20,
      currency: 'ZAR'
    },
    ...overrides
  };
}

/**
 * Create mock budget
 */
export function createMockBudget(overrides = {}) {
  return {
    _id: 'budget123',
    name: 'Test Budget',
    category: 'Marketing',
    fiscalYear: 2025,
    totalBudget: 100000,
    allocated: 50000,
    spent: 30000,
    remaining: 70000,
    currency: 'ZAR',
    status: 'active',
    ...overrides
  };
}

/**
 * Mock API response
 */
export function mockApiResponse(data, options = {}) {
  return {
    success: true,
    data,
    message: options.message || 'Success',
    ...options
  };
}

/**
 * Mock API error
 */
export function mockApiError(message = 'An error occurred', statusCode = 400) {
  return {
    success: false,
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
  };
}

/**
 * Mock pagination response
 */
export function mockPaginatedResponse(data, page = 1, limit = 10, total = data.length) {
  return {
    success: true,
    data,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  };
}

/**
 * Wait for async updates
 */
export function wait(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store = {};
  
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn(index => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
}

/**
 * Mock axios
 */
export function mockAxios() {
  return {
    get: jest.fn(() => Promise.resolve({ data: mockApiResponse({}) })),
    post: jest.fn(() => Promise.resolve({ data: mockApiResponse({}) })),
    put: jest.fn(() => Promise.resolve({ data: mockApiResponse({}) })),
    patch: jest.fn(() => Promise.resolve({ data: mockApiResponse({}) })),
    delete: jest.fn(() => Promise.resolve({ data: mockApiResponse({}) })),
    request: jest.fn(() => Promise.resolve({ data: mockApiResponse({}) })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  };
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
