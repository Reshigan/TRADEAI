// TRADEAI v2.0 - API Integration Tests for 100% Coverage

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../backend/src/app');
const { createFactories } = require('../factories');

describe('API Integration Tests', () => {
  let factories;
  let testCompany;
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI);
    
    // Initialize factories
    factories = createFactories({
      User: require('../../backend/src/models/User'),
      Company: require('../../backend/src/models/Company'),
      TradeSpend: require('../../backend/src/models/TradeSpend'),
      Budget: require('../../backend/src/models/Budget'),
      Product: require('../../backend/src/models/Product'),
      Customer: require('../../backend/src/models/Customer')
    });
  });

  beforeEach(async () => {
    // Clean all collections
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
    
    // Create test company and user
    testCompany = await factories.company.create();
    testUser = await factories.user.create({
      companyId: testCompany._id,
      role: 'admin'
    });
    
    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'password123'
      });
    
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Authentication Flow', () => {
    test('should complete full authentication workflow', async () => {
      // 1. Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          companyName: 'Test Company'
        })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.token).toBeDefined();

      // 2. Login with new user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.token).toBeDefined();

      // 3. Access protected route
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      expect(profileResponse.body.data.email).toBe('john.doe@example.com');

      // 4. Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);
    });

    test('should handle password reset workflow', async () => {
      // 1. Request password reset
      const resetRequestResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email
        })
        .expect(200);

      expect(resetRequestResponse.body.success).toBe(true);

      // 2. Verify reset token (in real scenario, this would come from email)
      const user = await factories.user.model.findById(testUser._id);
      const resetToken = user.passwordResetToken;

      // 3. Reset password
      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'newpassword123'
        })
        .expect(200);

      expect(resetResponse.body.success).toBe(true);

      // 4. Login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });
  });

  describe('Trade Spend Workflow', () => {
    test('should complete full trade spend lifecycle', async () => {
      // Create supporting data
      const customer = await factories.customer.create({
        companyId: testCompany._id
      });
      
      const product = await factories.product.create({
        companyId: testCompany._id
      });

      // 1. Create trade spend
      const createResponse = await request(app)
        .post('/api/tradespends')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: customer._id,
          productId: product._id,
          amount: 50000,
          currency: 'USD',
          type: 'promotion',
          description: 'Summer promotion campaign',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
        .expect(201);

      const tradeSpendId = createResponse.body.data._id;
      expect(createResponse.body.data.status).toBe('draft');

      // 2. Update trade spend
      const updateResponse = await request(app)
        .put(`/api/tradespends/${tradeSpendId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 55000,
          description: 'Updated summer promotion campaign'
        })
        .expect(200);

      expect(updateResponse.body.data.amount).toBe(55000);

      // 3. Submit for approval
      const submitResponse = await request(app)
        .post(`/api/tradespends/${tradeSpendId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(submitResponse.body.data.status).toBe('pending');

      // 4. Approve trade spend
      const approveResponse = await request(app)
        .post(`/api/tradespends/${tradeSpendId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(approveResponse.body.data.status).toBe('approved');
      expect(approveResponse.body.data.approvedBy).toBe(testUser._id.toString());

      // 5. Verify in analytics
      const analyticsResponse = await request(app)
        .get('/api/tradespends/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(analyticsResponse.body.data.totalSpend).toBe(55000);
      expect(analyticsResponse.body.data.totalCount).toBe(1);
    });

    test('should handle trade spend rejection workflow', async () => {
      // Create trade spend
      const tradeSpend = await factories.tradeSpend.create({
        companyId: testCompany._id,
        status: 'pending',
        amount: 100000
      });

      // Reject trade spend
      const rejectResponse = await request(app)
        .post(`/api/tradespends/${tradeSpend._id}/reject`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Budget exceeded for this quarter'
        })
        .expect(200);

      expect(rejectResponse.body.data.status).toBe('rejected');
      expect(rejectResponse.body.data.rejectionReason).toBe('Budget exceeded for this quarter');

      // Verify cannot be approved after rejection
      await request(app)
        .post(`/api/tradespends/${tradeSpend._id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('Budget Management Workflow', () => {
    test('should complete budget allocation and tracking', async () => {
      // 1. Create budget
      const createBudgetResponse = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '2024 Marketing Budget',
          year: 2024,
          totalAmount: 1000000,
          currency: 'USD',
          categories: [
            {
              name: 'Trade Marketing',
              allocated: 400000
            },
            {
              name: 'Consumer Promotion',
              allocated: 300000
            },
            {
              name: 'Shopper Marketing',
              allocated: 300000
            }
          ]
        })
        .expect(201);

      const budgetId = createBudgetResponse.body.data._id;
      expect(createBudgetResponse.body.data.status).toBe('draft');

      // 2. Activate budget
      const activateResponse = await request(app)
        .post(`/api/budgets/${budgetId}/activate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(activateResponse.body.data.status).toBe('active');

      // 3. Create trade spends against budget
      const customer = await factories.customer.create({
        companyId: testCompany._id
      });
      
      const product = await factories.product.create({
        companyId: testCompany._id
      });

      const tradeSpend1 = await request(app)
        .post('/api/tradespends')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: customer._id,
          productId: product._id,
          amount: 50000,
          currency: 'USD',
          type: 'promotion',
          category: 'Trade Marketing',
          budgetId: budgetId,
          description: 'Q1 Trade Marketing Campaign'
        })
        .expect(201);

      // Approve trade spend
      await request(app)
        .post(`/api/tradespends/${tradeSpend1.body.data._id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 4. Check budget utilization
      const budgetResponse = await request(app)
        .get(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const tradeMarketingCategory = budgetResponse.body.data.categories.find(
        cat => cat.name === 'Trade Marketing'
      );
      expect(tradeMarketingCategory.spent).toBe(50000);
      expect(tradeMarketingCategory.remaining).toBe(350000);

      // 5. Get budget analytics
      const analyticsResponse = await request(app)
        .get(`/api/budgets/${budgetId}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(analyticsResponse.body.data.utilizationPercentage).toBe(5); // 50k/1M = 5%
      expect(analyticsResponse.body.data.spentAmount).toBe(50000);
    });

    test('should prevent overspending budget', async () => {
      // Create small budget
      const budget = await factories.budget.create({
        companyId: testCompany._id,
        totalAmount: 10000,
        status: 'active',
        categories: [{
          name: 'Test Category',
          allocated: 10000,
          spent: 0
        }]
      });

      const customer = await factories.customer.create({
        companyId: testCompany._id
      });
      
      const product = await factories.product.create({
        companyId: testCompany._id
      });

      // Try to create trade spend exceeding budget
      const response = await request(app)
        .post('/api/tradespends')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: customer._id,
          productId: product._id,
          amount: 15000, // Exceeds budget
          currency: 'USD',
          type: 'promotion',
          category: 'Test Category',
          budgetId: budget._id,
          description: 'Overspend test'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('exceeds available budget');
    });
  });

  describe('Analytics and Reporting Integration', () => {
    test('should generate comprehensive analytics', async () => {
      // Create test data
      const customer1 = await factories.customer.create({
        companyId: testCompany._id,
        name: 'Customer A'
      });
      
      const customer2 = await factories.customer.create({
        companyId: testCompany._id,
        name: 'Customer B'
      });
      
      const product1 = await factories.product.create({
        companyId: testCompany._id,
        name: 'Product X'
      });

      // Create multiple trade spends
      const tradeSpends = [
        {
          customerId: customer1._id,
          productId: product1._id,
          amount: 25000,
          type: 'promotion',
          status: 'approved',
          createdAt: new Date('2024-01-15')
        },
        {
          customerId: customer2._id,
          productId: product1._id,
          amount: 35000,
          type: 'discount',
          status: 'approved',
          createdAt: new Date('2024-02-15')
        },
        {
          customerId: customer1._id,
          productId: product1._id,
          amount: 15000,
          type: 'rebate',
          status: 'approved',
          createdAt: new Date('2024-03-15')
        }
      ];

      for (const tsData of tradeSpends) {
        await factories.tradeSpend.create({
          companyId: testCompany._id,
          ...tsData
        });
      }

      // 1. Get overall analytics
      const summaryResponse = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(summaryResponse.body.data.totalSpend).toBe(75000);
      expect(summaryResponse.body.data.totalCount).toBe(3);

      // 2. Get spend by type
      const byTypeResponse = await request(app)
        .get('/api/analytics/spend-by-type')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(byTypeResponse.body.data.promotion).toBe(25000);
      expect(byTypeResponse.body.data.discount).toBe(35000);
      expect(byTypeResponse.body.data.rebate).toBe(15000);

      // 3. Get spend by customer
      const byCustomerResponse = await request(app)
        .get('/api/analytics/spend-by-customer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const customerASpend = byCustomerResponse.body.data.find(
        item => item.customerName === 'Customer A'
      );
      const customerBSpend = byCustomerResponse.body.data.find(
        item => item.customerName === 'Customer B'
      );

      expect(customerASpend.totalSpend).toBe(40000); // 25k + 15k
      expect(customerBSpend.totalSpend).toBe(35000);

      // 4. Get trend data
      const trendResponse = await request(app)
        .get('/api/analytics/spend-trend?period=monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(trendResponse.body.data).toHaveLength(3); // 3 months
      expect(trendResponse.body.data[0].amount).toBe(25000); // January
      expect(trendResponse.body.data[1].amount).toBe(35000); // February
      expect(trendResponse.body.data[2].amount).toBe(15000); // March
    });

    test('should generate and download reports', async () => {
      // Create test data
      await factories.tradeSpend.createMany(5, {
        companyId: testCompany._id,
        status: 'approved'
      });

      // 1. Generate report
      const generateResponse = await request(app)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'trade-spend-summary',
          format: 'pdf',
          dateRange: {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31')
          }
        })
        .expect(200);

      const reportId = generateResponse.body.data.reportId;
      expect(reportId).toBeDefined();

      // 2. Check report status
      const statusResponse = await request(app)
        .get(`/api/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse.body.data.status).toMatch(/generating|completed/);

      // 3. Download report (if completed)
      if (statusResponse.body.data.status === 'completed') {
        const downloadResponse = await request(app)
          .get(`/api/reports/${reportId}/download`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(downloadResponse.headers['content-type']).toBe('application/pdf');
      }
    });
  });

  describe('User Management Integration', () => {
    test('should handle user role management', async () => {
      // Create regular user
      const regularUser = await factories.user.create({
        companyId: testCompany._id,
        role: 'user'
      });

      // Login as regular user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: regularUser.email,
          password: 'password123'
        })
        .expect(200);

      const userToken = loginResponse.body.token;

      // Try to access admin-only endpoint
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      // Admin should be able to upgrade user role
      const upgradeResponse = await request(app)
        .put(`/api/admin/users/${regularUser._id}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'manager'
        })
        .expect(200);

      expect(upgradeResponse.body.data.role).toBe('manager');

      // User should now have manager permissions
      const managerLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: regularUser.email,
          password: 'password123'
        })
        .expect(200);

      const managerToken = managerLoginResponse.body.token;

      // Should now be able to access manager endpoints
      await request(app)
        .get('/api/manager/team-analytics')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });
  });

  describe('Data Consistency and Integrity', () => {
    test('should maintain data consistency across operations', async () => {
      // Create budget
      const budget = await factories.budget.create({
        companyId: testCompany._id,
        totalAmount: 100000,
        status: 'active',
        categories: [{
          name: 'Marketing',
          allocated: 100000,
          spent: 0
        }]
      });

      const customer = await factories.customer.create({
        companyId: testCompany._id
      });
      
      const product = await factories.product.create({
        companyId: testCompany._id
      });

      // Create and approve trade spend
      const createResponse = await request(app)
        .post('/api/tradespends')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: customer._id,
          productId: product._id,
          amount: 30000,
          currency: 'USD',
          type: 'promotion',
          category: 'Marketing',
          budgetId: budget._id,
          description: 'Consistency test'
        })
        .expect(201);

      const tradeSpendId = createResponse.body.data._id;

      await request(app)
        .post(`/api/tradespends/${tradeSpendId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify budget was updated
      const budgetResponse = await request(app)
        .get(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const marketingCategory = budgetResponse.body.data.categories.find(
        cat => cat.name === 'Marketing'
      );
      expect(marketingCategory.spent).toBe(30000);

      // Verify analytics reflect the change
      const analyticsResponse = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(analyticsResponse.body.data.totalSpend).toBe(30000);

      // Delete trade spend and verify rollback
      await request(app)
        .delete(`/api/tradespends/${tradeSpendId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Budget should be updated
      const updatedBudgetResponse = await request(app)
        .get(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updatedMarketingCategory = updatedBudgetResponse.body.data.categories.find(
        cat => cat.name === 'Marketing'
      );
      expect(updatedMarketingCategory.spent).toBe(0);

      // Analytics should reflect the change
      const updatedAnalyticsResponse = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedAnalyticsResponse.body.data.totalSpend).toBe(0);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent requests efficiently', async () => {
      const customer = await factories.customer.create({
        companyId: testCompany._id
      });
      
      const product = await factories.product.create({
        companyId: testCompany._id
      });

      // Create multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/tradespends')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              customerId: customer._id,
              productId: product._id,
              amount: 1000 + i,
              currency: 'USD',
              type: 'promotion',
              description: `Concurrent test ${i}`
            })
        );
      }

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.data.amount).toBe(1000 + index);
      });

      // Verify all trade spends were created
      const listResponse = await request(app)
        .get('/api/tradespends')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body.data).toHaveLength(10);
    });

    test('should handle large dataset queries efficiently', async () => {
      // Create large dataset
      const tradeSpends = [];
      for (let i = 0; i < 1000; i++) {
        tradeSpends.push({
          companyId: testCompany._id,
          customerId: new mongoose.Types.ObjectId(),
          productId: new mongoose.Types.ObjectId(),
          amount: Math.floor(Math.random() * 100000),
          currency: 'USD',
          type: 'promotion',
          description: `Large dataset test ${i}`,
          status: 'approved'
        });
      }

      await factories.tradeSpend.model.insertMany(tradeSpends);

      const startTime = Date.now();

      // Query with pagination
      const response = await request(app)
        .get('/api/tradespends?page=1&limit=100&sortBy=amount&sortOrder=desc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(response.body.data).toHaveLength(100);
      expect(response.body.pagination.total).toBe(1000);
      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds

      // Verify sorting
      const amounts = response.body.data.map(ts => ts.amount);
      for (let i = 1; i < amounts.length; i++) {
        expect(amounts[i]).toBeLessThanOrEqual(amounts[i - 1]);
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should handle database connection failures gracefully', async () => {
      // Simulate database connection failure
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/tradespends')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Database connection error');

      // Reconnect for other tests
      await mongoose.connect(process.env.MONGODB_TEST_URI);
    });

    test('should handle transaction rollbacks on failures', async () => {
      const budget = await factories.budget.create({
        companyId: testCompany._id,
        totalAmount: 50000,
        status: 'active',
        categories: [{
          name: 'Test Category',
          allocated: 50000,
          spent: 0
        }]
      });

      // Mock a failure during trade spend approval
      const originalApprove = factories.tradeSpend.model.prototype.approve;
      factories.tradeSpend.model.prototype.approve = function() {
        throw new Error('Simulated approval failure');
      };

      const customer = await factories.customer.create({
        companyId: testCompany._id
      });
      
      const product = await factories.product.create({
        companyId: testCompany._id
      });

      const createResponse = await request(app)
        .post('/api/tradespends')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: customer._id,
          productId: product._id,
          amount: 30000,
          currency: 'USD',
          type: 'promotion',
          category: 'Test Category',
          budgetId: budget._id,
          description: 'Transaction rollback test'
        })
        .expect(201);

      // Try to approve (should fail)
      await request(app)
        .post(`/api/tradespends/${createResponse.body.data._id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      // Verify budget was not updated due to rollback
      const budgetResponse = await request(app)
        .get(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const testCategory = budgetResponse.body.data.categories.find(
        cat => cat.name === 'Test Category'
      );
      expect(testCategory.spent).toBe(0); // Should remain 0 due to rollback

      // Restore original method
      factories.tradeSpend.model.prototype.approve = originalApprove;
    });
  });
});