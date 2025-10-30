/**
 * Promotion Model Tests
 * Comprehensive tests for Promotion model validation, methods, and business logic
 */

const mongoose = require('mongoose');
const Promotion = require('../../../models/Promotion');
const dbHelper = require('../../helpers/db-helper');
const { promotionFactory } = require('../../helpers/factories');

describe('Promotion Model', () => {
  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  afterEach(async () => {
    await dbHelper.clearDatabase();
  });

  describe('Schema Validation', () => {
    describe('Required Fields', () => {
      it('should create a valid promotion with all required fields', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          budget: {
            allocated: 10000,
            currency: 'ZAR'
          }
        });

        const promotion = await Promotion.create(promotionData);

        expect(promotion).toHaveProperty('_id');
        expect(promotion.name).toBe(promotionData.name);
        expect(promotion.status).toBe('draft');
        expect(promotion.type).toBe('Price Reduction');
      });

      it('should require name field', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          name: undefined,
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        });

        await expect(Promotion.create(promotionData)).rejects.toThrow(/name.*required/i);
      });

      it('should require company field', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: undefined,
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        });

        await expect(Promotion.create(promotionData)).rejects.toThrow(/company.*required/i);
      });

      it('should require type field', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: undefined,
          budget: { allocated: 10000 }
        });

        await expect(Promotion.create(promotionData)).rejects.toThrow(/type.*required/i);
      });

      it('should require startDate field', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          startDate: undefined,
          budget: { allocated: 10000 }
        });

        await expect(Promotion.create(promotionData)).rejects.toThrow(/startDate.*required/i);
      });

      it('should require endDate field', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          endDate: undefined,
          budget: { allocated: 10000 }
        });

        await expect(Promotion.create(promotionData)).rejects.toThrow(/endDate.*required/i);
      });

      it('should require budget.allocated field', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          budget: { allocated: undefined }
        });

        await expect(Promotion.create(promotionData)).rejects.toThrow(/allocated.*required/i);
      });
    });

    describe('Field Validation', () => {
      it('should validate promotion type enum', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Invalid Type',
          budget: { allocated: 10000 }
        });

        await expect(Promotion.create(promotionData)).rejects.toThrow();
      });

      it('should validate status enum', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          status: 'invalid_status',
          budget: { allocated: 10000 }
        });

        await expect(Promotion.create(promotionData)).rejects.toThrow();
      });

      it('should accept valid status values', async () => {
        const statuses = ['draft', 'pending', 'active', 'paused', 'completed', 'cancelled'];

        for (const status of statuses) {
          const promotionData = promotionFactory.buildPromotion({
            company: new mongoose.Types.ObjectId(),
            type: 'Price Reduction',
            status,
            budget: { allocated: 10000 }
          });

          const promotion = await Promotion.create(promotionData);
          expect(promotion.status).toBe(status);
          await Promotion.deleteMany({});
        }
      });

      it('should validate budget.allocated is non-negative', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          budget: { allocated: -1000 }
        });

        await expect(Promotion.create(promotionData)).rejects.toThrow();
      });

      it('should validate budget.spent is non-negative', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          budget: { allocated: 10000, spent: -500 }
        });

        await expect(Promotion.create(promotionData)).rejects.toThrow();
      });

      it('should validate discount percentage range (0-100)', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          budget: { allocated: 10000 },
          terms: { discountPercentage: 150 }
        });

        await expect(Promotion.create(promotionData)).rejects.toThrow();
      });

      it('should accept valid discount percentage', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          budget: { allocated: 10000 },
          terms: { discountPercentage: 25 }
        });

        const promotion = await Promotion.create(promotionData);
        expect(promotion.terms.discountPercentage).toBe(25);
      });

      it('should validate currency enum', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          budget: { allocated: 10000, currency: 'INVALID' }
        });

        await expect(Promotion.create(promotionData)).rejects.toThrow();
      });

      it('should accept valid currencies', async () => {
        const currencies = ['ZAR', 'USD', 'EUR', 'GBP'];

        for (const currency of currencies) {
          const promotionData = promotionFactory.buildPromotion({
            company: new mongoose.Types.ObjectId(),
            type: 'Price Reduction',
            budget: { allocated: 10000, currency }
          });

          const promotion = await Promotion.create(promotionData);
          expect(promotion.budget.currency).toBe(currency);
          await Promotion.deleteMany({});
        }
      });
    });

    describe('Default Values', () => {
      it('should set default status to draft', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          status: undefined,
          budget: { allocated: 10000 }
        });

        const promotion = await Promotion.create(promotionData);
        expect(promotion.status).toBe('draft');
      });

      it('should set default currency to ZAR', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          budget: { allocated: 10000, currency: undefined }
        });

        const promotion = await Promotion.create(promotionData);
        expect(promotion.budget.currency).toBe('ZAR');
      });

      it('should set default budget.spent to 0', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          budget: { allocated: 10000 }
        });

        const promotion = await Promotion.create(promotionData);
        expect(promotion.budget.spent).toBe(0);
      });
    });
  });

  describe('Relationships', () => {
    it('should store customer references', async () => {
      const customerIds = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ];

      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        customers: customerIds,
        budget: { allocated: 10000 }
      });

      const promotion = await Promotion.create(promotionData);
      expect(promotion.customers).toHaveLength(2);
      expect(promotion.customers[0].toString()).toBe(customerIds[0].toString());
    });

    it('should store product references', async () => {
      const productIds = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ];

      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        products: productIds,
        budget: { allocated: 10000 }
      });

      const promotion = await Promotion.create(promotionData);
      expect(promotion.products).toHaveLength(3);
      expect(promotion.products[0].toString()).toBe(productIds[0].toString());
    });

    it('should allow empty customer array', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        customers: [],
        budget: { allocated: 10000 }
      });

      const promotion = await Promotion.create(promotionData);
      expect(promotion.customers).toHaveLength(0);
    });
  });

  describe('Timestamps', () => {
    it('should automatically add createdAt timestamp', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        budget: { allocated: 10000 }
      });

      const promotion = await Promotion.create(promotionData);
      expect(promotion.createdAt).toBeDefined();
      expect(promotion.createdAt).toBeInstanceOf(Date);
    });

    it('should automatically add updatedAt timestamp', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        budget: { allocated: 10000 }
      });

      const promotion = await Promotion.create(promotionData);
      expect(promotion.updatedAt).toBeDefined();
      expect(promotion.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        budget: { allocated: 10000 }
      });

      const promotion = await Promotion.create(promotionData);
      const originalUpdatedAt = promotion.updatedAt;

      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 10));
      promotion.name = 'Updated Name';
      await promotion.save();

      expect(promotion.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Queries', () => {
    it('should find promotions by status', async () => {
      const companyId = new mongoose.Types.ObjectId();

      await Promotion.create([
        promotionFactory.buildPromotion({ company: companyId, type: 'Price Reduction', status: 'active', budget: { allocated: 10000 } }),
        promotionFactory.buildPromotion({ company: companyId, type: 'Price Reduction', status: 'active', budget: { allocated: 10000 } }),
        promotionFactory.buildPromotion({ company: companyId, type: 'Price Reduction', status: 'draft', budget: { allocated: 10000 } })
      ]);

      const activePromotions = await Promotion.find({ status: 'active' });
      expect(activePromotions).toHaveLength(2);
    });

    it('should find promotions by company', async () => {
      const companyId1 = new mongoose.Types.ObjectId();
      const companyId2 = new mongoose.Types.ObjectId();

      await Promotion.create([
        promotionFactory.buildPromotion({ company: companyId1, type: 'Price Reduction', budget: { allocated: 10000 } }),
        promotionFactory.buildPromotion({ company: companyId1, type: 'Price Reduction', budget: { allocated: 10000 } }),
        promotionFactory.buildPromotion({ company: companyId2, type: 'Price Reduction', budget: { allocated: 10000 } })
      ]);

      const company1Promotions = await Promotion.find({ company: companyId1 });
      expect(company1Promotions).toHaveLength(2);
    });

    it('should find promotions by date range', async () => {
      const companyId = new mongoose.Types.ObjectId();
      const now = new Date();
      const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const farFuture = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

      await Promotion.create([
        promotionFactory.buildPromotion({
          company: companyId,
          type: 'Price Reduction',
          startDate: now,
          endDate: future,
          budget: { allocated: 10000 }
        }),
        promotionFactory.buildPromotion({
          company: companyId,
          type: 'Price Reduction',
          startDate: future,
          endDate: farFuture,
          budget: { allocated: 10000 }
        })
      ]);

      const currentPromotions = await Promotion.find({
        startDate: { $lte: now },
        endDate: { $gte: now }
      });

      expect(currentPromotions).toHaveLength(1);
    });
  });

  describe('Updates', () => {
    it('should update promotion status', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        status: 'draft',
        budget: { allocated: 10000 }
      });

      const promotion = await Promotion.create(promotionData);
      expect(promotion.status).toBe('draft');

      promotion.status = 'active';
      await promotion.save();

      const updated = await Promotion.findById(promotion._id);
      expect(updated.status).toBe('active');
    });

    it('should update budget spent', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        budget: { allocated: 10000, spent: 0 },
      });

      const promotion = await Promotion.create(promotionData);
      expect(promotion.budget.spent).toBe(0);

      promotion.budget.spent = 5000;
      await promotion.save();

      const updated = await Promotion.findById(promotion._id);
      expect(updated.budget.spent).toBe(5000);
    });
  });

  describe('Deletion', () => {
    it('should delete a promotion', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        budget: { allocated: 10000 }
      });

      const promotion = await Promotion.create(promotionData);
      const promotionId = promotion._id;

      await Promotion.deleteOne({ _id: promotionId });

      const deleted = await Promotion.findById(promotionId);
      expect(deleted).toBeNull();
    });

    it('should delete multiple promotions', async () => {
      const companyId = new mongoose.Types.ObjectId();

      await Promotion.create([
        promotionFactory.buildPromotion({ company: companyId, type: 'Price Reduction', budget: { allocated: 10000 } }),
        promotionFactory.buildPromotion({ company: companyId, type: 'Price Reduction', budget: { allocated: 10000 } }),
        promotionFactory.buildPromotion({ company: companyId, type: 'Price Reduction', budget: { allocated: 10000 } })
      ]);

      const result = await Promotion.deleteMany({ company: companyId });
      expect(result.deletedCount).toBe(3);

      const remaining = await Promotion.find({ company: companyId });
      expect(remaining).toHaveLength(0);
    });
  });
});
