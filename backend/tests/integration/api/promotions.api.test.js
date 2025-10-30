/**
 * Promotions API Integration Tests
 * Tests for promotion CRUD operations and workflows
 */

const request = require('supertest');
const mongoose = require('mongoose');
const Promotion = require('../../../models/Promotion');
const User = require('../../../models/User');
const dbHelper = require('../../helpers/db-helper');
const authHelper = require('../../helpers/auth-helper');
const { promotionFactory } = require('../../helpers/factories');

let app;
try {
  app = require('../../../src/app');
} catch (error) {
  console.log('App requires setup, using mock');
}

describe('Promotions API Integration Tests', () => {
  let authHeaders;
  let testUser;
  let companyId;

  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
    
    // Create test user and get auth headers
    companyId = new mongoose.Types.ObjectId();
    testUser = await authHelper.createTestUser(User, {
      email: 'testuser@example.com',
      username: 'testuser',
      tenant: 'mondelez',
      role: 'user'
    });
    authHeaders = authHelper.createAuthHeadersForUser(testUser);
  });

  describe('GET /api/promotions', () => {
    it('should return all promotions for authenticated user', async () => {
      // Create test promotions
      await Promotion.create([
        promotionFactory.buildPromotion({ 
          company: companyId, 
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        }),
        promotionFactory.buildPromotion({ 
          company: companyId, 
          type: 'Price Reduction',
          budget: { allocated: 20000 }
        }),
        promotionFactory.buildPromotion({ 
          company: companyId, 
          type: 'Volume Discount',
          budget: { allocated: 15000 }
        })
      ]);

      const response = await request(app)
        .get('/api/promotions')
        .set(authHeaders)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(3);
    });

    it('should return empty array when no promotions exist', async () => {
      const response = await request(app)
        .get('/api/promotions')
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should support pagination', async () => {
      // Create 15 promotions
      const promotions = Array(15).fill(null).map((_, i) =>
        promotionFactory.buildPromotion({
          company: companyId,
          type: 'Price Reduction',
          name: `Promotion ${i + 1}`,
          budget: { allocated: 10000 }
        })
      );
      await Promotion.create(promotions);

      // Get first page
      const page1 = await request(app)
        .get('/api/promotions?page=1&limit=10')
        .set(authHeaders)
        .expect(200);

      expect(page1.body.data).toHaveLength(10);
      expect(page1.body.pagination).toBeDefined();
      expect(page1.body.pagination.currentPage).toBe(1);
      expect(page1.body.pagination.totalPages).toBe(2);
      expect(page1.body.pagination.totalItems).toBe(15);

      // Get second page
      const page2 = await request(app)
        .get('/api/promotions?page=2&limit=10')
        .set(authHeaders)
        .expect(200);

      expect(page2.body.data).toHaveLength(5);
      expect(page2.body.pagination.currentPage).toBe(2);
    });

    it('should filter promotions by status', async () => {
      await Promotion.create([
        promotionFactory.buildPromotionWithStatus('active', { 
          company: companyId, 
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        }),
        promotionFactory.buildPromotionWithStatus('active', { 
          company: companyId, 
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        }),
        promotionFactory.buildPromotionWithStatus('draft', { 
          company: companyId, 
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        })
      ]);

      const response = await request(app)
        .get('/api/promotions?status=active')
        .set(authHeaders)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach(promo => {
        expect(promo.status).toBe('active');
      });
    });

    it('should sort promotions by date', async () => {
      await Promotion.create([
        promotionFactory.buildPromotion({
          company: companyId,
          type: 'Price Reduction',
          name: 'Old Promotion',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-02-01'),
          budget: { allocated: 10000 }
        }),
        promotionFactory.buildPromotion({
          company: companyId,
          type: 'Price Reduction',
          name: 'New Promotion',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-02-01'),
          budget: { allocated: 10000 }
        })
      ]);

      // Sort ascending
      const asc = await request(app)
        .get('/api/promotions?sort=startDate')
        .set(authHeaders)
        .expect(200);

      expect(asc.body.data[0].name).toBe('Old Promotion');
      expect(asc.body.data[1].name).toBe('New Promotion');

      // Sort descending
      const desc = await request(app)
        .get('/api/promotions?sort=-startDate')
        .set(authHeaders)
        .expect(200);

      expect(desc.body.data[0].name).toBe('New Promotion');
      expect(desc.body.data[1].name).toBe('Old Promotion');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/promotions')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/unauthorized|token/i);
    });
  });

  describe('GET /api/promotions/:id', () => {
    it('should return single promotion by ID', async () => {
      const promotion = await Promotion.create(
        promotionFactory.buildPromotion({
          company: companyId,
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        })
      );

      const response = await request(app)
        .get(`/api/promotions/${promotion._id}`)
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(promotion._id.toString());
      expect(response.body.data.name).toBe(promotion.name);
    });

    it('should return 404 for non-existent promotion', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/promotions/${fakeId}`)
        .set(authHeaders)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/not found/i);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/promotions/invalid-id')
        .set(authHeaders)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid.*id/i);
    });
  });

  describe('POST /api/promotions', () => {
    it('should create a new promotion', async () => {
      const promotionData = {
        company: companyId,
        name: 'Summer Sale 2025',
        type: 'Price Reduction',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-08-31'),
        budget: {
          allocated: 50000,
          currency: 'ZAR'
        },
        status: 'draft'
      };

      const response = await request(app)
        .post('/api/promotions')
        .set(authHeaders)
        .send(promotionData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe(promotionData.name);
      expect(response.body.data.status).toBe('draft');

      // Verify in database
      const created = await Promotion.findById(response.body.data._id);
      expect(created).toBeDefined();
      expect(created.name).toBe(promotionData.name);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: 'Incomplete Promotion'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/promotions')
        .set(authHeaders)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/required/i);
    });

    it('should validate budget is positive', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: companyId,
        type: 'Price Reduction',
        budget: { allocated: -1000 }
      });

      const response = await request(app)
        .post('/api/promotions')
        .set(authHeaders)
        .send(promotionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate end date is after start date', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: companyId,
        type: 'Price Reduction',
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01'),
        budget: { allocated: 10000 }
      });

      const response = await request(app)
        .post('/api/promotions')
        .set(authHeaders)
        .send(promotionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/end date.*after.*start date/i);
    });

    it('should sanitize input to prevent XSS', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: companyId,
        type: 'Price Reduction',
        name: '<script>alert("xss")</script>',
        budget: { allocated: 10000 }
      });

      const response = await request(app)
        .post('/api/promotions')
        .set(authHeaders)
        .send(promotionData);

      if (response.status === 201) {
        expect(response.body.data.name).not.toContain('<script>');
      } else {
        expect(response.status).toBe(400);
      }
    });

    it('should set default status to draft', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: companyId,
        type: 'Price Reduction',
        status: undefined,
        budget: { allocated: 10000 }
      });

      const response = await request(app)
        .post('/api/promotions')
        .set(authHeaders)
        .send(promotionData)
        .expect(201);

      expect(response.body.data.status).toBe('draft');
    });
  });

  describe('PUT /api/promotions/:id', () => {
    let promotion;

    beforeEach(async () => {
      promotion = await Promotion.create(
        promotionFactory.buildPromotion({
          company: companyId,
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        })
      );
    });

    it('should update promotion', async () => {
      const updateData = {
        name: 'Updated Promotion Name',
        budget: {
          allocated: 75000,
          currency: 'ZAR'
        }
      };

      const response = await request(app)
        .put(`/api/promotions/${promotion._id}`)
        .set(authHeaders)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.budget.allocated).toBe(75000);

      // Verify in database
      const updated = await Promotion.findById(promotion._id);
      expect(updated.name).toBe(updateData.name);
      expect(updated.budget.allocated).toBe(75000);
    });

    it('should update promotion status', async () => {
      const response = await request(app)
        .put(`/api/promotions/${promotion._id}`)
        .set(authHeaders)
        .send({ status: 'active' })
        .expect(200);

      expect(response.body.data.status).toBe('active');
    });

    it('should return 404 for non-existent promotion', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/promotions/${fakeId}`)
        .set(authHeaders)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/promotions/${promotion._id}`)
        .set(authHeaders)
        .send({ budget: { allocated: -5000 } })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/promotions/:id', () => {
    let promotion;

    beforeEach(async () => {
      promotion = await Promotion.create(
        promotionFactory.buildPromotion({
          company: companyId,
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        })
      );
    });

    it('should delete promotion', async () => {
      const response = await request(app)
        .delete(`/api/promotions/${promotion._id}`)
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/deleted/i);

      // Verify deletion
      const deleted = await Promotion.findById(promotion._id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent promotion', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/promotions/${fakeId}`)
        .set(authHeaders)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not allow deletion of active promotions', async () => {
      promotion.status = 'active';
      await promotion.save();

      const response = await request(app)
        .delete(`/api/promotions/${promotion._id}`)
        .set(authHeaders)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/cannot delete active/i);

      // Verify not deleted
      const stillExists = await Promotion.findById(promotion._id);
      expect(stillExists).toBeDefined();
    });
  });

  describe('POST /api/promotions/:id/activate', () => {
    let promotion;

    beforeEach(async () => {
      promotion = await Promotion.create(
        promotionFactory.buildPromotionWithStatus('approved', {
          company: companyId,
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        })
      );
    });

    it('should activate approved promotion', async () => {
      const response = await request(app)
        .post(`/api/promotions/${promotion._id}/activate`)
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');

      const activated = await Promotion.findById(promotion._id);
      expect(activated.status).toBe('active');
    });

    it('should not activate draft promotion', async () => {
      promotion.status = 'draft';
      await promotion.save();

      const response = await request(app)
        .post(`/api/promotions/${promotion._id}/activate`)
        .set(authHeaders)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/must be approved/i);
    });
  });

  describe('POST /api/promotions/:id/complete', () => {
    let promotion;

    beforeEach(async () => {
      promotion = await Promotion.create(
        promotionFactory.buildPromotionWithStatus('active', {
          company: companyId,
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        })
      );
    });

    it('should complete active promotion', async () => {
      const response = await request(app)
        .post(`/api/promotions/${promotion._id}/complete`)
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });

    it('should not complete draft promotion', async () => {
      promotion.status = 'draft';
      await promotion.save();

      const response = await request(app)
        .post(`/api/promotions/${promotion._id}/complete`)
        .set(authHeaders)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/promotions/analytics/summary', () => {
    beforeEach(async () => {
      // Create various promotions for analytics
      await Promotion.create([
        promotionFactory.buildPromotionWithStatus('active', {
          company: companyId,
          type: 'Price Reduction',
          budget: { allocated: 50000, spent: 30000 }
        }),
        promotionFactory.buildPromotionWithStatus('completed', {
          company: companyId,
          type: 'Volume Discount',
          budget: { allocated: 40000, spent: 40000 }
        }),
        promotionFactory.buildPromotionWithStatus('draft', {
          company: companyId,
          type: 'Price Reduction',
          budget: { allocated: 20000, spent: 0 }
        })
      ]);
    });

    it('should return promotion analytics summary', async () => {
      const response = await request(app)
        .get('/api/promotions/analytics/summary')
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalPromotions');
      expect(response.body.data).toHaveProperty('activePromotions');
      expect(response.body.data).toHaveProperty('totalBudget');
      expect(response.body.data).toHaveProperty('totalSpent');
      expect(response.body.data.totalPromotions).toBe(3);
      expect(response.body.data.activePromotions).toBe(1);
    });
  });

  describe('Authorization', () => {
    it('should allow user to access their own company promotions', async () => {
      await Promotion.create(
        promotionFactory.buildPromotion({
          company: companyId,
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        })
      );

      const response = await request(app)
        .get('/api/promotions')
        .set(authHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should not allow user to access other company promotions', async () => {
      const otherCompanyId = new mongoose.Types.ObjectId();
      const promotion = await Promotion.create(
        promotionFactory.buildPromotion({
          company: otherCompanyId,
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        })
      );

      const response = await request(app)
        .get(`/api/promotions/${promotion._id}`)
        .set(authHeaders)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/access denied/i);
    });

    it('should allow admin to access all promotions', async () => {
      // Create admin user
      const adminUser = await authHelper.createTestUser(User, {
        email: 'admin@example.com',
        username: 'admin',
        role: 'admin'
      });
      const adminHeaders = authHelper.createAuthHeadersForUser(adminUser);

      const otherCompanyId = new mongoose.Types.ObjectId();
      await Promotion.create(
        promotionFactory.buildPromotion({
          company: otherCompanyId,
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        })
      );

      const response = await request(app)
        .get('/api/promotions')
        .set(adminHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
