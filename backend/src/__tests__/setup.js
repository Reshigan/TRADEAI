/**
 * TRADEAI Backend Test Setup
 * Industry-leading test configuration
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const redis = require('redis');
const RedisServer = require('redis-server');

let mongod;
let redisServer;
let redisClient;

// Increase timeout for all tests
jest.setTimeout(30000);

// Mock console methods to reduce noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  
  // Connect to in-memory MongoDB
  const opts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
  
  await mongoose.connect(mongoUri, opts);
  
  // Start in-memory Redis
  redisServer = new RedisServer({
    port: 6379,
    host: 'localhost',
  });
  
  await redisServer.open();
  
  redisClient = redis.createClient({
    url: 'redis://localhost:6379',
  });
  
  await redisClient.connect();
  
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongoUri;
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  
  // Clear Redis
  await redisClient.flushDb();
  
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

afterEach(async () => {
  // Clear mocks
  jest.clearAllMocks();
});

afterAll(async () => {
  // Disconnect from MongoDB
  await mongoose.disconnect();
  
  // Disconnect from Redis
  await redisClient.disconnect();
  
  // Stop Redis server
  await redisServer.close();
  
  // Stop MongoDB server
  await mongod.stop();
});

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (overrides = {}) => {
    const User = require('../models/User');
    return User.create({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      ...overrides,
    });
  },
  
  // Create test company
  createTestCompany: async (overrides = {}) => {
    const Company = require('../models/Company');
    return Company.create({
      name: `Test Company ${Date.now()}`,
      domain: 'test.com',
      ...overrides,
    });
  },
  
  // Create test budget
  createTestBudget: async (overrides = {}) => {
    const Budget = require('../models/Budget');
    return Budget.create({
      name: `Test Budget ${Date.now()}`,
      amount: 100000,
      currency: 'USD',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      ...overrides,
    });
  },
  
  // Create test promotion
  createTestPromotion: async (overrides = {}) => {
    const Promotion = require('../models/Promotion');
    return Promotion.create({
      name: `Test Promotion ${Date.now()}`,
      budget: 10000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ...overrides,
    });
  },
  
  // Generate test JWT token
  generateTestToken: async (user, overrides = {}) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        ...overrides,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },
  
  // Create authenticated request headers
  createAuthHeaders: async (user) => {
    const token = await global.testUtils.generateTestToken(user);
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  },
  
  // Mock external services
  mockExternalServices: () => {
    // Mock SendGrid
    jest.mock('@sendgrid/mail', () => ({
      setApiKey: jest.fn(),
      send: jest.fn(),
    }));
    
    // Mock AWS S3
    jest.mock('aws-sdk', () => ({
      S3: jest.fn(() => ({
        upload: jest.fn().mockReturnThis(),
        send: jest.fn(),
      })),
    }));
  },
  
  // Wait for async operations
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Suppress console output
  suppressConsole: () => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  },
  
  // Restore console output
  restoreConsole: () => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = console.warn;
  },
};

// Custom matchers
expect.extend({
  toBeValidDate(received) {
    const passed = received instanceof Date && !isNaN(received.getTime());
    return {
      pass: passed,
      message: () => `expected ${received} ${passed ? 'not ' : ''}to be a valid date`,
    };
  },
  
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passed = emailRegex.test(received);
    return {
      pass: passed,
      message: () => `expected ${received} ${passed ? 'not ' : ''}to be a valid email`,
    };
  },
  
  toBeValidMongoId(received) {
    const mongoose = require('mongoose');
    const passed = mongoose.Types.ObjectId.isValid(received);
    return {
      pass: passed,
      message: () => `expected ${received} ${passed ? 'not ' : ''}to be a valid MongoDB ID`,
    };
  },
  
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be within range ${floor}-${ceiling}`,
    };
  },
  
  toBeValidCurrency(received) {
    const pass = typeof received === 'number' && received >= 0;
    return {
      pass,
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be a valid currency amount`,
    };
  },
});

// Performance monitoring helper
global.performanceMonitor = {
  measurements: [],
  
  startTimer(label) {
    const start = performance.now();
    this.timers = this.timers || {};
    this.timers[label] = start;
  },
  
  endTimer(label) {
    const end = performance.now();
    const start = this.timers[label];
    const duration = end - start;
    this.measurements.push({ label, duration });
    console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  },
  
  getAverage(label) {
    const measurements = this.measurements.filter(m => m.label === label);
    if (measurements.length === 0) return 0;
    const sum = measurements.reduce((acc, m) => acc + m.duration, 0);
    return sum / measurements.length;
  },
  
  report() {
    console.log('\n📊 Performance Report:');
    const labels = [...new Set(this.measurements.map(m => m.label))];
    labels.forEach(label => {
      const avg = this.getAverage(label);
      console.log(`  ${label}: ${avg.toFixed(2)}ms (avg)`);
    });
  },
};

// Memory monitoring helper
global.memoryMonitor = {
  checkMemory(label) {
    const used = process.memoryUsage();
    console.log(`\n💾 Memory Usage - ${label}:`);
    for (const key in used) {
      console.log(`  ${key}: ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`);
    }
  },
};

// Test data factories
global.factories = {
  user: (overrides = {}) => ({
    email: `user-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    ...overrides,
  }),
  
  company: (overrides = {}) => ({
    name: `Company ${Date.now()}`,
    domain: 'company.com',
    industry: 'Retail',
    ...overrides,
  }),
  
  budget: (overrides = {}) => ({
    name: `Budget ${Date.now()}`,
    amount: 100000,
    currency: 'USD',
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    ...overrides,
  }),
  
  promotion: (overrides = {}) => ({
    name: `Promotion ${Date.now()}`,
    budget: 10000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    type: 'discount',
    ...overrides,
  }),
  
  customer: (overrides = {}) => ({
    name: `Customer ${Date.now()}`,
    email: `customer-${Date.now()}@example.com`,
    phone: '+1234567890',
    ...overrides,
  }),
  
  product: (overrides = {}) => ({
    name: `Product ${Date.now()}`,
    sku: `SKU-${Date.now()}`,
    price: 99.99,
    cost: 49.99,
    ...overrides,
  }),
};
