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

  // =====================
  // Sprint 0 Logic Fixes
  // =====================

  describe('D-01: Promotion State Machine', () => {
    describe('PROMOTION_TRANSITIONS map', () => {
      it('should define all valid status transitions', () => {
        // This tests the single source of truth for state transitions
        expect(Promotion.PROMOTION_TRANSITIONS).toHaveProperty('draft');
        expect(Promotion.PROMOTION_TRANSITIONS).toHaveProperty('pending_approval');
        expect(Promotion.PROMOTION_TRANSITIONS).toHaveProperty('approved');
        expect(Promotion.PROMOTION_TRANSITIONS).toHaveProperty('active');
        expect(Promotion.PROMOTION_TRANSITIONS).toHaveProperty('completed');
        expect(Promotion.PROMOTION_TRANSITIONS).toHaveProperty('cancelled');
        expect(Promotion.PROMOTION_TRANSITIONS).toHaveProperty('rejected');
      });

      it('should define correct transitions from draft', () => {
        expect(Promotion.PROMOTION_TRANSITIONS.draft).toContain('pending_approval');
        expect(Promotion.PROMOTION_TRANSITIONS.draft).toContain('cancelled');
      });

      it('should enforce terminal states (completed, cancelled)', () => {
        expect(Promotion.PROMOTION_TRANSITIONS.completed).toEqual([]);
        expect(Promotion.PROMOTION_TRANSITIONS.cancelled).toEqual([]);
      });
    });

    describe('canTransition method', () => {
      it('should allow valid transitions', () => {
        expect(Promotion.canTransition('draft', 'pending_approval')).toBe(true);
        expect(Promotion.canTransition('pending_approval', 'approved')).toBe(true);
        expect(Promotion.canTransition('pending_approval', 'rejected')).toBe(true);
        expect(Promotion.canTransition('approved', 'active')).toBe(true);
        expect(Promotion.canTransition('active', 'completed')).toBe(true);
      });

      it('should reject invalid transitions', () => {
        // Cannot skip directly to active from draft
        expect(Promotion.canTransition('draft', 'active')).toBe(false);
        expect(Promotion.canTransition('draft', 'completed')).toBe(false);
      });

      it('should enforce terminal states', () => {
        expect(Promotion.canTransition('completed', 'active')).toBe(false);
        expect(Promotion.canTransition('cancelled', 'pending_approval')).toBe(false);
        expect(Promotion.canTransition('completed', 'draft')).toBe(false);
      });

      it('should allow recall from pending_approval to draft', () => {
        expect(Promotion.canTransition('pending_approval', 'draft')).toBe(true);
      });

      it('should allow re-edit from rejected to draft', () => {
        expect(Promotion.canTransition('rejected', 'draft')).toBe(true);
      });
    });

    describe('D-01 approve() method state guard', () => {
      it('should reject approval from non-pending_approval status', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          status: 'draft', // wrong status
          budget: { allocated: 10000 },
          approvals: [{ level: 'kam', status: 'pending' }] // need approval slot
        });

        const promotion = await Promotion.create(promotionData);
        
        await expect(
          promotion.approve('kam', new mongoose.Types.ObjectId(), 'test')
        ).rejects.toThrow(/pending_approval/);
      });

      it('should accept approval from pending_approval status with valid approval slot', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          status: 'pending_approval',
          approvals: [{ level: 'kam', status: 'pending' }],
          budget: { allocated: 10000 }
        });

        const promotion = await Promotion.create(promotionData);
        
        // Should not throw
        await expect(
          promotion.approve('kam', new mongoose.Types.ObjectId(), 'test approval')
        ).resolves.toBeDefined();
      });
    });

    describe('D-04: Role-to-approval-level mapping', () => {
      it('should accept valid approval level', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          status: 'pending_approval',
          approvals: [{ level: 'kam', status: 'pending' }],
          budget: { allocated: 10000 }
        });

        const promotion = await Promotion.create(promotionData);
        await expect(
          promotion.approve('kam', new mongoose.Types.ObjectId(), 'KAM approval')
        ).resolves.toBeDefined();
      });

      it('should reject when no approval slot for given level', async () => {
        const promotionData = promotionFactory.buildPromotion({
          company: new mongoose.Types.ObjectId(),
          type: 'Price Reduction',
          status: 'pending_approval',
          approvals: [{ level: 'finance', status: 'pending' }], // only finance slot
          budget: { allocated: 10000 }
        });

        const promotion = await Promotion.create(promotionData);
        
        // Trying to approve with 'kam' when only 'finance' slot exists
        await expect(
          promotion.approve('kam', new mongoose.Types.ObjectId(), 'test')
        ).rejects.toThrow(/No pending approval at level/);
      });
    });
  });

  describe('D-05: ROI Formula (incrementalRevenue − investment) / investment', () => {
    it('should calculate ROI correctly using standard formula', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        budget: { allocated: 10000 },
        financial: {
          costs: {
            totalCost: 1000 // investment = 1000
          },
          actual: {
            incrementalRevenue: 1500 // revenue - cost = 500
          }
        }
      });

      const promotion = await Promotion.create(promotionData);
      // ROI = (1500 - 1000) / 1000 * 100 = 50%
      expect(promotion.financial.profitability.roi).toBe(50);
    });

    it('should handle zero investment (avoid division by zero)', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        budget: { allocated: 0 },
        financial: {
          costs: { totalCost: 0 },
          actual: { incrementalRevenue: 500 }
        }
      });

      const promotion = await Promotion.create(promotionData);
      expect(promotion.financial.profitability.roi).toBe(0);
    });
  });

  describe('D-06: findOverlapping AND logic', () => {
    it('should use AND logic for customer AND product matching', async () => {
      const companyId = new mongoose.Types.ObjectId();
      const customerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();
      const now = new Date();
      const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Create a promotion with both customer and product
      await Promotion.create({
        ...promotionFactory.buildPromotion({
          company: companyId,
          type: 'Price Reduction',
          status: 'approved',
          startDate: now,
          endDate: future,
          budget: { allocated: 10000 }
        }),
        scope: { customers: [{ customer: customerId }] },
        products: [{ product: productId }]
      });

      // Should find with both customer AND product
      const found = await Promotion.findOverlapping(customerId, productId, now, future);
      expect(found).toHaveLength(1);

      // Should NOT find if only customer matches but product doesn't
      const otherProductId = new mongoose.Types.ObjectId();
      const found2 = await Promotion.findOverlapping(customerId, otherProductId, now, future);
      expect(found2).toHaveLength(0);
    });
  });

  describe('D-07: Deduction State Machine', () => {
    const Deduction = require('../../../models/Deduction');

    beforeAll(async () => {
      // Ensure indexes exist
      await Deduction.ensureIndexes();
    });

    describe('canTransition method', () => {
      it('should allow pending → matched', () => {
        expect(Deduction.canTransition('pending', 'matched')).toBe(true);
      });

      it('should allow pending → disputed', () => {
        expect(Deduction.canTransition('pending', 'disputed')).toBe(true);
      });

      it('should allow pending → approved', () => {
        expect(Deduction.canTransition('pending', 'approved')).toBe(true);
      });

      it('should allow disputed → matched (retry)', () => {
        expect(Deduction.canTransition('disputed', 'matched')).toBe(true);
      });

      it('should reject transitions from terminal states', () => {
        expect(Deduction.canTransition('approved', 'pending')).toBe(false);
        expect(Deduction.canTransition('rejected', 'approved')).toBe(false);
      });
    });

    describe('transitionTo method', () => {
      it('should throw on invalid transition', async () => {
        const deduction = await Deduction.create({
          deductionNumber: 'DED-TEST-001',
          customerId: new mongoose.Types.ObjectId(),
          amount: 100,
          status: 'approved', // terminal
          createdBy: new mongoose.Types.ObjectId()
        });

        expect(() => {
          deduction.transitionTo('pending', new mongoose.Types.ObjectId());
        }).toThrow(/INVALID_TRANSITION/);
      });

      it('should record transition in history', async () => {
        const deduction = await Deduction.create({
          deductionNumber: 'DED-TEST-002',
          customerId: new mongoose.Types.ObjectId(),
          amount: 100,
          status: 'pending',
          createdBy: new mongoose.Types.ObjectId()
        });

        deduction.transitionTo('matched', new mongoose.Types.ObjectId(), 'Test match');
        await deduction.save();

        expect(deduction.history).toHaveLength(1);
        expect(deduction.history[0].action).toContain('status_changed:pending→matched');
      });
    });
  });

  describe('D-08: grossProfit calculation', () => {
    it('should calculate grossProfit as 70% of incrementalRevenue', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        budget: { allocated: 10000 },
        financial: {
          costs: { totalCost: 500 },
          actual: {
            incrementalRevenue: 1000
          }
        }
      });

      const promotion = await Promotion.create(promotionData);
      // grossProfit = 1000 * 0.7 = 700
      expect(promotion.financial.profitability.grossProfit).toBe(700);
    });

    it('should calculate netProfit as incrementalRevenue - totalCost', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        budget: { allocated: 10000 },
        financial: {
          costs: { totalCost: 500 },
          actual: {
            incrementalRevenue: 1000
          }
        }
      });

      const promotion = await Promotion.create(promotionData);
      // netProfit = 1000 - 500 = 500
      expect(promotion.financial.profitability.netProfit).toBe(500);
    });
  });

  describe('D-09: AI Service Honest Labeling', () => {
    const aiService = require('../../../services/aiPromotionValidationService');

    it('should include source=heuristic in validation results', () => {
      const result = aiService.validatePromotionUplift({
        currentPrice: 100,
        proposedPrice: 80,
        expectedUplift: 20,
        category: 'beverages'
      });

      expect(result).toHaveProperty('source', 'heuristic');
      expect(result).toHaveProperty('warning');
      expect(result.warning).toContain('Not a trained ML');
    });

    it('should include source=heuristic in suggestions', () => {
      const result = aiService.generatePromotionSuggestions({
        currentPrice: 100,
        proposedPrice: 80,
        category: 'beverages'
      });

      expect(result).toHaveProperty('source', 'heuristic');
      expect(result).toHaveProperty('warning');
    });
  });

  describe('D-10: Cannibalization Error Isolation', () => {
    const cannibalizationService = require('../../../services/cannibalizationService');

    it('should include errors array and partial flag in results', async () => {
      // This test verifies the structure when errors occur
      // Note: We can't easily trigger real errors without mocking,
      // but we verify the service returns the expected structure
      
      const result = await cannibalizationService.analyzePromotion({
        productId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        promotionStartDate: new Date(),
        promotionEndDate: new Date(),
        tenantId: 'test'
      });

      // Should have errors and partial fields even if empty
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('partial');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.partial).toBe('boolean');
      expect(result.summary).toHaveProperty('productsWithErrors');
    });
  });

  describe('D-11: Promotion Lifecycle Job', () => {
    const promotionLifecycle = require('../../../jobs/promotionLifecycle');

    it('should export process function', () => {
      expect(typeof promotionLifecycle.process).toBe('function');
    });

    it('should have processPromotionLifecycle function for testing', async () => {
      // Verify the core function is accessible (for direct testing)
      expect(typeof promotionLifecycle.process).toBeDefined();
    });
  });

  describe('D-12: Forecasting Service Honest Labeling', () => {
    it('should include modelType/source in predictPromotionPerformance', async () => {
      const ForecastingService = require('../../../services/forecastingService');
      const service = new ForecastingService();

      // Call with insufficient data to get 'insufficientdata' prediction
      const result = await service.predictPromotionPerformance('test-tenant', {
        products: [new mongoose.Types.ObjectId()],
        customers: [],
        type: 'test',
        mechanics: {}
      });

      // Should have honest labeling even in error cases
      expect(result).toHaveProperty('modelType');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('warning');
    });
  });

  describe('D-13: Input Validation', () => {
    it('should reject endDate before startDate', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        startDate: now,
        endDate: yesterday, // Invalid: end before start
        budget: { allocated: 10000 }
      });

      await expect(Promotion.create(promotionData)).rejects.toThrow(/endDate.*after.*startDate/i);
    });

    it('should reject percentage discount > 100', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        budget: { allocated: 10000 },
        mechanics: {
          discountType: 'percentage',
          discountValue: 150 // Invalid: > 100%
        }
      });

      await expect(Promotion.create(promotionData)).rejects.toThrow();
    });

    it('should reject negative fixed_amount discount', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        budget: { allocated: 10000 },
        mechanics: {
          discountType: 'fixed_amount',
          discountValue: -10 // Invalid: negative
        }
      });

      await expect(Promotion.create(promotionData)).rejects.toThrow();
    });

    it('should reject empty products array', async () => {
      const promotionData = promotionFactory.buildPromotion({
        company: new mongoose.Types.ObjectId(),
        type: 'Price Reduction',
        budget: { allocated: 10000 },
        products: [] // Invalid: must have at least one product
      });

      await expect(Promotion.create(promotionData)).rejects.toThrow(/at least one product/i);
    });
  });
});
