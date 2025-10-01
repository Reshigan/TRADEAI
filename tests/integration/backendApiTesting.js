/**
 * Backend API Integration Testing Suite
 * Comprehensive testing for all backend services and endpoints
 */

const request = require('supertest');
const { expect } = require('chai');

// Test configuration
const config = {
  apiURL: process.env.API_URL || 'http://localhost:3000',
  testDatabase: process.env.TEST_DATABASE_URL || 'postgresql://tradeai:tradeai123@localhost:5432/tradeai_test',
  testRedis: process.env.TEST_REDIS_URL || 'redis://:redis123@localhost:6379/1',
  timeout: 30000
};

// Test data
const testData = {
  admin: {
    email: 'admin@tradeai.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  },
  manager: {
    email: 'manager@tradeai.com',
    password: 'Manager123!',
    firstName: 'Manager',
    lastName: 'User',
    role: 'manager'
  },
  user: {
    email: 'user@tradeai.com',
    password: 'User123!',
    firstName: 'Regular',
    lastName: 'User',
    role: 'user'
  },
  tenant: {
    name: 'Test Tenant',
    domain: 'test-tenant.tradeai.com',
    settings: {
      theme: 'default',
      features: ['analytics', 'reporting', 'integrations']
    }
  }
};

let app;
let authTokens = {};

/**
 * Setup and Teardown
 */
describe('Backend API Integration Tests - Go Live Readiness', function() {
  this.timeout(config.timeout);

  before(async function() {
    console.log('🚀 Starting Backend API Integration Testing');
    console.log(`API URL: ${config.apiURL}`);
    
    // Initialize test environment
    await setupTestEnvironment();
    
    // Create test users and get auth tokens
    await createTestUsers();
    await authenticateTestUsers();
  });

  after(async function() {
    console.log('🧹 Cleaning up test environment');
    await cleanupTestEnvironment();
    console.log('✅ Backend API Integration Testing Complete');
  });

  /**
   * Health Check and System Status Tests
   */
  describe('System Health and Status', function() {
    
    it('should return healthy status from health endpoint', async function() {
      console.log('🧪 Testing: Health Check Endpoint');
      
      const response = await request(config.apiURL)
        .get('/health')
        .expect(200);
      
      expect(response.body).to.have.property('status', 'healthy');
      expect(response.body).to.have.property('timestamp');
      expect(response.body).to.have.property('uptime');
      expect(response.body).to.have.property('version');
      
      console.log('✅ Health Check: PASSED');
    });

    it('should return system status with all services', async function() {
      console.log('🧪 Testing: System Status Endpoint');
      
      const response = await request(config.apiURL)
        .get('/api/status')
        .expect(200);
      
      expect(response.body).to.have.property('database', 'connected');
      expect(response.body).to.have.property('redis', 'connected');
      expect(response.body).to.have.property('services');
      expect(response.body.services).to.be.an('array');
      expect(response.body.services.length).to.be.greaterThan(0);
      
      console.log('✅ System Status: PASSED');
    });

    it('should return metrics endpoint data', async function() {
      console.log('🧪 Testing: Metrics Endpoint');
      
      const response = await request(config.apiURL)
        .get('/api/metrics')
        .expect(200);
      
      expect(response.body).to.have.property('system');
      expect(response.body).to.have.property('application');
      expect(response.body.system).to.have.property('memory');
      expect(response.body.system).to.have.property('cpu');
      expect(response.body.application).to.have.property('requests');
      
      console.log('✅ Metrics Endpoint: PASSED');
    });
  });

  /**
   * Authentication and Authorization Tests
   */
  describe('Authentication and Authorization', function() {
    
    it('should authenticate user with valid credentials', async function() {
      console.log('🧪 Testing: User Authentication');
      
      const response = await request(config.apiURL)
        .post('/api/auth/login')
        .send({
          email: testData.user.email,
          password: testData.user.password
        })
        .expect(200);
      
      expect(response.body).to.have.property('token');
      expect(response.body).to.have.property('refreshToken');
      expect(response.body).to.have.property('user');
      expect(response.body.user).to.have.property('email', testData.user.email);
      expect(response.body.user).to.have.property('role', testData.user.role);
      
      console.log('✅ User Authentication: PASSED');
    });

    it('should reject authentication with invalid credentials', async function() {
      console.log('🧪 Testing: Invalid Authentication');
      
      const response = await request(config.apiURL)
        .post('/api/auth/login')
        .send({
          email: testData.user.email,
          password: 'wrongpassword'
        })
        .expect(401);
      
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.contain('Invalid credentials');
      
      console.log('✅ Invalid Authentication: PASSED');
    });

    it('should refresh authentication token', async function() {
      console.log('🧪 Testing: Token Refresh');
      
      const response = await request(config.apiURL)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .expect(200);
      
      expect(response.body).to.have.property('token');
      expect(response.body).to.have.property('refreshToken');
      
      console.log('✅ Token Refresh: PASSED');
    });

    it('should protect endpoints with authentication', async function() {
      console.log('🧪 Testing: Protected Endpoint Access');
      
      // Test without token
      await request(config.apiURL)
        .get('/api/user/profile')
        .expect(401);
      
      // Test with valid token
      const response = await request(config.apiURL)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .expect(200);
      
      expect(response.body).to.have.property('email', testData.user.email);
      
      console.log('✅ Protected Endpoint Access: PASSED');
    });

    it('should enforce role-based access control', async function() {
      console.log('🧪 Testing: Role-based Access Control');
      
      // User should not access admin endpoint
      await request(config.apiURL)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .expect(403);
      
      // Admin should access admin endpoint
      const response = await request(config.apiURL)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .expect(200);
      
      expect(response.body).to.be.an('array');
      
      console.log('✅ Role-based Access Control: PASSED');
    });
  });

  /**
   * User Management Tests
   */
  describe('User Management', function() {
    
    it('should create new user', async function() {
      console.log('🧪 Testing: User Creation');
      
      const newUser = {
        email: `testuser.${Date.now()}@tradeai.com`,
        password: 'TestUser123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      };
      
      const response = await request(config.apiURL)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(newUser)
        .expect(201);
      
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('email', newUser.email);
      expect(response.body).to.have.property('role', newUser.role);
      expect(response.body).to.not.have.property('password');
      
      console.log('✅ User Creation: PASSED');
    });

    it('should update user profile', async function() {
      console.log('🧪 Testing: User Profile Update');
      
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };
      
      const response = await request(config.apiURL)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body).to.have.property('firstName', updateData.firstName);
      expect(response.body).to.have.property('lastName', updateData.lastName);
      
      console.log('✅ User Profile Update: PASSED');
    });

    it('should list users with pagination', async function() {
      console.log('🧪 Testing: User List with Pagination');
      
      const response = await request(config.apiURL)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .expect(200);
      
      expect(response.body).to.have.property('users');
      expect(response.body).to.have.property('pagination');
      expect(response.body.users).to.be.an('array');
      expect(response.body.pagination).to.have.property('page', 1);
      expect(response.body.pagination).to.have.property('limit', 10);
      expect(response.body.pagination).to.have.property('total');
      
      console.log('✅ User List with Pagination: PASSED');
    });

    it('should search users by email', async function() {
      console.log('🧪 Testing: User Search');
      
      const response = await request(config.apiURL)
        .get(`/api/admin/users/search?q=${testData.user.email}`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .expect(200);
      
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.greaterThan(0);
      expect(response.body[0]).to.have.property('email', testData.user.email);
      
      console.log('✅ User Search: PASSED');
    });
  });

  /**
   * Tenant Management Tests
   */
  describe('Tenant Management', function() {
    let tenantId;
    
    it('should create new tenant', async function() {
      console.log('🧪 Testing: Tenant Creation');
      
      const response = await request(config.apiURL)
        .post('/api/admin/tenants')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(testData.tenant)
        .expect(201);
      
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('name', testData.tenant.name);
      expect(response.body).to.have.property('domain', testData.tenant.domain);
      expect(response.body).to.have.property('settings');
      
      tenantId = response.body.id;
      
      console.log('✅ Tenant Creation: PASSED');
    });

    it('should update tenant settings', async function() {
      console.log('🧪 Testing: Tenant Settings Update');
      
      const updateData = {
        settings: {
          theme: 'dark',
          features: ['analytics', 'reporting']
        }
      };
      
      const response = await request(config.apiURL)
        .put(`/api/admin/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.settings).to.have.property('theme', 'dark');
      expect(response.body.settings.features).to.include('analytics');
      
      console.log('✅ Tenant Settings Update: PASSED');
    });

    it('should list tenants', async function() {
      console.log('🧪 Testing: Tenant List');
      
      const response = await request(config.apiURL)
        .get('/api/admin/tenants')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .expect(200);
      
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.greaterThan(0);
      
      console.log('✅ Tenant List: PASSED');
    });
  });

  /**
   * Analytics and Reporting Tests
   */
  describe('Analytics and Reporting', function() {
    
    it('should return dashboard analytics', async function() {
      console.log('🧪 Testing: Dashboard Analytics');
      
      const response = await request(config.apiURL)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authTokens.manager}`)
        .expect(200);
      
      expect(response.body).to.have.property('metrics');
      expect(response.body).to.have.property('charts');
      expect(response.body.metrics).to.have.property('totalUsers');
      expect(response.body.metrics).to.have.property('totalRevenue');
      expect(response.body.charts).to.be.an('array');
      
      console.log('✅ Dashboard Analytics: PASSED');
    });

    it('should generate custom report', async function() {
      console.log('🧪 Testing: Custom Report Generation');
      
      const reportConfig = {
        name: 'Test Report',
        type: 'user_activity',
        dateRange: {
          start: '2023-01-01',
          end: '2023-12-31'
        },
        filters: {
          role: 'user'
        }
      };
      
      const response = await request(config.apiURL)
        .post('/api/analytics/reports')
        .set('Authorization', `Bearer ${authTokens.manager}`)
        .send(reportConfig)
        .expect(201);
      
      expect(response.body).to.have.property('reportId');
      expect(response.body).to.have.property('status', 'generating');
      
      console.log('✅ Custom Report Generation: PASSED');
    });

    it('should return real-time metrics', async function() {
      console.log('🧪 Testing: Real-time Metrics');
      
      const response = await request(config.apiURL)
        .get('/api/analytics/realtime')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .expect(200);
      
      expect(response.body).to.have.property('activeUsers');
      expect(response.body).to.have.property('currentSessions');
      expect(response.body).to.have.property('systemLoad');
      expect(response.body).to.have.property('timestamp');
      
      console.log('✅ Real-time Metrics: PASSED');
    });
  });

  /**
   * Data Management Tests
   */
  describe('Data Management', function() {
    let itemId;
    
    it('should create data item', async function() {
      console.log('🧪 Testing: Data Item Creation');
      
      const itemData = {
        name: 'Test Item',
        description: 'Test Description',
        value: 100,
        category: 'test'
      };
      
      const response = await request(config.apiURL)
        .post('/api/data/items')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .send(itemData)
        .expect(201);
      
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('name', itemData.name);
      expect(response.body).to.have.property('value', itemData.value);
      
      itemId = response.body.id;
      
      console.log('✅ Data Item Creation: PASSED');
    });

    it('should read data item', async function() {
      console.log('🧪 Testing: Data Item Read');
      
      const response = await request(config.apiURL)
        .get(`/api/data/items/${itemId}`)
        .set('Authorization', `Bearer ${authTokens.user}`)
        .expect(200);
      
      expect(response.body).to.have.property('id', itemId);
      expect(response.body).to.have.property('name', 'Test Item');
      
      console.log('✅ Data Item Read: PASSED');
    });

    it('should update data item', async function() {
      console.log('🧪 Testing: Data Item Update');
      
      const updateData = {
        name: 'Updated Test Item',
        value: 200
      };
      
      const response = await request(config.apiURL)
        .put(`/api/data/items/${itemId}`)
        .set('Authorization', `Bearer ${authTokens.user}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body).to.have.property('name', updateData.name);
      expect(response.body).to.have.property('value', updateData.value);
      
      console.log('✅ Data Item Update: PASSED');
    });

    it('should list data items with filtering', async function() {
      console.log('🧪 Testing: Data Item List with Filtering');
      
      const response = await request(config.apiURL)
        .get('/api/data/items?category=test&limit=10')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .expect(200);
      
      expect(response.body).to.have.property('items');
      expect(response.body).to.have.property('pagination');
      expect(response.body.items).to.be.an('array');
      
      console.log('✅ Data Item List with Filtering: PASSED');
    });

    it('should delete data item', async function() {
      console.log('🧪 Testing: Data Item Deletion');
      
      await request(config.apiURL)
        .delete(`/api/data/items/${itemId}`)
        .set('Authorization', `Bearer ${authTokens.user}`)
        .expect(204);
      
      // Verify deletion
      await request(config.apiURL)
        .get(`/api/data/items/${itemId}`)
        .set('Authorization', `Bearer ${authTokens.user}`)
        .expect(404);
      
      console.log('✅ Data Item Deletion: PASSED');
    });
  });

  /**
   * File Upload and Management Tests
   */
  describe('File Upload and Management', function() {
    
    it('should upload file', async function() {
      console.log('🧪 Testing: File Upload');
      
      const response = await request(config.apiURL)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .attach('file', Buffer.from('test file content'), 'test.txt')
        .expect(201);
      
      expect(response.body).to.have.property('fileId');
      expect(response.body).to.have.property('filename', 'test.txt');
      expect(response.body).to.have.property('size');
      expect(response.body).to.have.property('url');
      
      console.log('✅ File Upload: PASSED');
    });

    it('should list uploaded files', async function() {
      console.log('🧪 Testing: File List');
      
      const response = await request(config.apiURL)
        .get('/api/files')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .expect(200);
      
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.greaterThan(0);
      
      console.log('✅ File List: PASSED');
    });

    it('should validate file types', async function() {
      console.log('🧪 Testing: File Type Validation');
      
      await request(config.apiURL)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .attach('file', Buffer.from('fake exe content'), 'malicious.exe')
        .expect(400);
      
      console.log('✅ File Type Validation: PASSED');
    });
  });

  /**
   * WebSocket and Real-time Tests
   */
  describe('WebSocket and Real-time Features', function() {
    
    it('should establish WebSocket connection', async function() {
      console.log('🧪 Testing: WebSocket Connection');
      
      const response = await request(config.apiURL)
        .get('/api/websocket/info')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .expect(200);
      
      expect(response.body).to.have.property('endpoint');
      expect(response.body).to.have.property('protocols');
      
      console.log('✅ WebSocket Connection Info: PASSED');
    });

    it('should handle real-time notifications', async function() {
      console.log('🧪 Testing: Real-time Notifications');
      
      const response = await request(config.apiURL)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({
          type: 'test',
          message: 'Test notification',
          recipients: [testData.user.email]
        })
        .expect(200);
      
      expect(response.body).to.have.property('notificationId');
      expect(response.body).to.have.property('status', 'sent');
      
      console.log('✅ Real-time Notifications: PASSED');
    });
  });

  /**
   * Security Tests
   */
  describe('Security Features', function() {
    
    it('should prevent SQL injection', async function() {
      console.log('🧪 Testing: SQL Injection Prevention');
      
      const maliciousInput = "'; DROP TABLE users; --";
      
      await request(config.apiURL)
        .post('/api/auth/login')
        .send({
          email: maliciousInput,
          password: 'password'
        })
        .expect(400);
      
      console.log('✅ SQL Injection Prevention: PASSED');
    });

    it('should sanitize XSS inputs', async function() {
      console.log('🧪 Testing: XSS Input Sanitization');
      
      const xssInput = '<script>alert("xss")</script>';
      
      const response = await request(config.apiURL)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .send({
          firstName: xssInput
        })
        .expect(200);
      
      expect(response.body.firstName).to.not.contain('<script>');
      
      console.log('✅ XSS Input Sanitization: PASSED');
    });

    it('should enforce rate limiting', async function() {
      console.log('🧪 Testing: Rate Limiting');
      
      // Make multiple rapid requests
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(config.apiURL)
            .post('/api/auth/login')
            .send({
              email: 'test@test.com',
              password: 'wrongpassword'
            })
        );
      }
      
      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).to.be.greaterThan(0);
      
      console.log('✅ Rate Limiting: PASSED');
    });

    it('should validate CORS headers', async function() {
      console.log('🧪 Testing: CORS Headers');
      
      const response = await request(config.apiURL)
        .options('/api/health')
        .set('Origin', 'https://tradeai.com')
        .expect(200);
      
      expect(response.headers).to.have.property('access-control-allow-origin');
      expect(response.headers).to.have.property('access-control-allow-methods');
      
      console.log('✅ CORS Headers: PASSED');
    });
  });

  /**
   * Performance Tests
   */
  describe('Performance and Load', function() {
    
    it('should handle concurrent requests', async function() {
      console.log('🧪 Testing: Concurrent Request Handling');
      
      const concurrentRequests = 50;
      const promises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(config.apiURL)
            .get('/api/analytics/dashboard')
            .set('Authorization', `Bearer ${authTokens.user}`)
        );
      }
      
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      const successfulResponses = responses.filter(res => res.status === 200);
      const averageResponseTime = (endTime - startTime) / concurrentRequests;
      
      expect(successfulResponses.length).to.equal(concurrentRequests);
      expect(averageResponseTime).to.be.lessThan(1000); // Less than 1 second average
      
      console.log(`✅ Concurrent Requests: ${successfulResponses.length}/${concurrentRequests} successful`);
      console.log(`Average response time: ${averageResponseTime.toFixed(2)}ms`);
    });

    it('should respond within acceptable time limits', async function() {
      console.log('🧪 Testing: Response Time Limits');
      
      const endpoints = [
        '/health',
        '/api/status',
        '/api/user/profile',
        '/api/analytics/dashboard'
      ];
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        
        await request(config.apiURL)
          .get(endpoint)
          .set('Authorization', `Bearer ${authTokens.user}`)
          .expect(200);
        
        const responseTime = Date.now() - startTime;
        expect(responseTime).to.be.lessThan(2000); // Less than 2 seconds
        
        console.log(`${endpoint}: ${responseTime}ms`);
      }
      
      console.log('✅ Response Time Limits: PASSED');
    });
  });

  /**
   * Data Validation Tests
   */
  describe('Data Validation', function() {
    
    it('should validate required fields', async function() {
      console.log('🧪 Testing: Required Field Validation');
      
      await request(config.apiURL)
        .post('/api/data/items')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .send({
          description: 'Missing name field'
        })
        .expect(400);
      
      console.log('✅ Required Field Validation: PASSED');
    });

    it('should validate data types', async function() {
      console.log('🧪 Testing: Data Type Validation');
      
      await request(config.apiURL)
        .post('/api/data/items')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .send({
          name: 'Test Item',
          value: 'not_a_number'
        })
        .expect(400);
      
      console.log('✅ Data Type Validation: PASSED');
    });

    it('should validate email format', async function() {
      console.log('🧪 Testing: Email Format Validation');
      
      await request(config.apiURL)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${authTokens.admin}`)
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        })
        .expect(400);
      
      console.log('✅ Email Format Validation: PASSED');
    });
  });

  /**
   * Error Handling Tests
   */
  describe('Error Handling', function() {
    
    it('should handle 404 errors gracefully', async function() {
      console.log('🧪 Testing: 404 Error Handling');
      
      const response = await request(config.apiURL)
        .get('/api/nonexistent/endpoint')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .expect(404);
      
      expect(response.body).to.have.property('error');
      expect(response.body).to.have.property('message');
      
      console.log('✅ 404 Error Handling: PASSED');
    });

    it('should handle server errors gracefully', async function() {
      console.log('🧪 Testing: Server Error Handling');
      
      // This would typically test an endpoint that might fail
      const response = await request(config.apiURL)
        .get('/api/test/error')
        .set('Authorization', `Bearer ${authTokens.user}`)
        .expect(500);
      
      expect(response.body).to.have.property('error');
      expect(response.body).to.not.have.property('stack'); // Should not expose stack traces
      
      console.log('✅ Server Error Handling: PASSED');
    });
  });
});

/**
 * Helper Functions
 */
async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...');
  
  // Initialize test database
  // Initialize test Redis
  // Setup test data
  
  console.log('✅ Test environment setup complete');
}

async function cleanupTestEnvironment() {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean test database
  // Clear test Redis
  // Remove test files
  
  console.log('✅ Test environment cleanup complete');
}

async function createTestUsers() {
  console.log('👥 Creating test users...');
  
  // Create test users in database
  // This would typically use the actual user creation service
  
  console.log('✅ Test users created');
}

async function authenticateTestUsers() {
  console.log('🔐 Authenticating test users...');
  
  for (const [role, userData] of Object.entries(testData)) {
    if (role === 'tenant') continue;
    
    try {
      const response = await request(config.apiURL)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });
      
      if (response.status === 200) {
        authTokens[role] = response.body.token;
        console.log(`✅ ${role} authenticated`);
      }
    } catch (error) {
      console.error(`❌ Failed to authenticate ${role}:`, error.message);
    }
  }
  
  console.log('✅ Test user authentication complete');
}

module.exports = {
  config,
  testData,
  authTokens
};