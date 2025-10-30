/**
 * TradeSpend Model Tests
 * Comprehensive tests for TradeSpend model validation and relationships
 */

const mongoose = require('mongoose');
const TradeSpend = require('../../../models/TradeSpend');
const dbHelper = require('../../helpers/db-helper');
const { faker } = require('@faker-js/faker');

// TradeSpend factory
const buildTradeSpend = (overrides = {}) => {
  return {
    spendId: `TS-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    customer: new mongoose.Types.ObjectId(),
    customerName: faker.company.name(),
    product: new mongoose.Types.ObjectId(),
    productName: faker.commerce.productName(),
    spendType: 'Trade Promotion',
    category: 'Promotional',
    amount: faker.number.int({ min: 1000, max: 50000 }),
    currency: 'INR',
    spendDate: new Date(),
    status: 'Planned',
    createdBy: 'test@example.com',
    ...overrides
  };
};

describe('TradeSpend Model', () => {
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
      it('should create a valid trade spend with all required fields', async () => {
        const spendData = buildTradeSpend();
        const spend = await TradeSpend.create(spendData);

        expect(spend).toHaveProperty('_id');
        expect(spend.spendId).toBe(spendData.spendId);
        expect(spend.customerName).toBe(spendData.customerName);
        expect(spend.amount).toBe(spendData.amount);
      });

      it('should require spendId field', async () => {
        const spendData = buildTradeSpend({ spendId: undefined });
        await expect(TradeSpend.create(spendData)).rejects.toThrow(/spendId.*required/i);
      });

      it('should require customer field', async () => {
        const spendData = buildTradeSpend({ customer: undefined });
        await expect(TradeSpend.create(spendData)).rejects.toThrow(/customer.*required/i);
      });

      it('should require customerName field', async () => {
        const spendData = buildTradeSpend({ customerName: undefined });
        await expect(TradeSpend.create(spendData)).rejects.toThrow(/customerName.*required/i);
      });

      it('should require spendType field', async () => {
        const spendData = buildTradeSpend({ spendType: undefined });
        await expect(TradeSpend.create(spendData)).rejects.toThrow(/spendType.*required/i);
      });

      it('should require amount field', async () => {
        const spendData = buildTradeSpend({ amount: undefined });
        await expect(TradeSpend.create(spendData)).rejects.toThrow(/amount.*required/i);
      });

      it('should require spendDate field', async () => {
        const spendData = buildTradeSpend({ spendDate: undefined });
        await expect(TradeSpend.create(spendData)).rejects.toThrow(/spendDate.*required/i);
      });
    });

    describe('SpendId Uniqueness', () => {
      it('should enforce unique spendId', async () => {
        const spendId = 'TS-UNIQUE-123';
        const spendData1 = buildTradeSpend({ spendId });
        const spendData2 = buildTradeSpend({ spendId, customerName: 'Different Customer' });

        await TradeSpend.create(spendData1);
        await expect(TradeSpend.create(spendData2)).rejects.toThrow();
      });
    });

    describe('SpendType Validation', () => {
      it('should validate spendType enum', async () => {
        const spendData = buildTradeSpend({ spendType: 'Invalid Type' });
        await expect(TradeSpend.create(spendData)).rejects.toThrow();
      });

      it('should accept valid spend types', async () => {
        const spendTypes = [
          'Trade Promotion', 'Volume Discount', 'Slotting Fee', 
          'Display Allowance', 'Marketing Co-op', 'Rebate', 
          'Sample & Demo', 'Freight Allowance'
        ];

        for (const spendType of spendTypes) {
          const spendData = buildTradeSpend({ 
            spendType,
            spendId: `TS-${Date.now()}-${spendType}`.replace(/\s+/g, '-')
          });
          const spend = await TradeSpend.create(spendData);
          expect(spend.spendType).toBe(spendType);
          await TradeSpend.deleteMany({});
        }
      });
    });

    describe('Category Validation', () => {
      it('should validate category enum', async () => {
        const spendData = buildTradeSpend({ category: 'Invalid Category' });
        await expect(TradeSpend.create(spendData)).rejects.toThrow();
      });

      it('should accept valid categories', async () => {
        const categories = ['Promotional', 'Non-Promotional', 'Fixed', 'Variable'];

        for (const category of categories) {
          const spendData = buildTradeSpend({ 
            category,
            spendId: `TS-${Date.now()}-${category}`
          });
          const spend = await TradeSpend.create(spendData);
          expect(spend.category).toBe(category);
          await TradeSpend.deleteMany({});
        }
      });

      it('should default category to Promotional', async () => {
        const spendData = buildTradeSpend({ category: undefined });
        const spend = await TradeSpend.create(spendData);
        expect(spend.category).toBe('Promotional');
      });
    });

    describe('Status Validation', () => {
      it('should validate status enum', async () => {
        const spendData = buildTradeSpend({ status: 'Invalid Status' });
        await expect(TradeSpend.create(spendData)).rejects.toThrow();
      });

      it('should accept valid statuses', async () => {
        const statuses = ['Planned', 'Approved', 'Active', 'Completed', 'Cancelled'];

        for (const status of statuses) {
          const spendData = buildTradeSpend({ 
            status,
            spendId: `TS-${Date.now()}-${status}`
          });
          const spend = await TradeSpend.create(spendData);
          expect(spend.status).toBe(status);
          await TradeSpend.deleteMany({});
        }
      });

      it('should default status to Planned', async () => {
        const spendData = buildTradeSpend({ status: undefined });
        const spend = await TradeSpend.create(spendData);
        expect(spend.status).toBe('Planned');
      });
    });

    describe('Default Values', () => {
      it('should default currency to INR', async () => {
        const spendData = buildTradeSpend({ currency: undefined });
        const spend = await TradeSpend.create(spendData);
        expect(spend.currency).toBe('INR');
      });
    });
  });

  describe('Relationships', () => {
    it('should store customer reference', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const spendData = buildTradeSpend({ customer: customerId });
      const spend = await TradeSpend.create(spendData);

      expect(spend.customer.toString()).toBe(customerId.toString());
    });

    it('should store product reference', async () => {
      const productId = new mongoose.Types.ObjectId();
      const spendData = buildTradeSpend({ product: productId });
      const spend = await TradeSpend.create(spendData);

      expect(spend.product.toString()).toBe(productId.toString());
    });

    it('should store budget reference', async () => {
      const budgetId = new mongoose.Types.ObjectId();
      const spendData = buildTradeSpend({ budget: budgetId });
      const spend = await TradeSpend.create(spendData);

      expect(spend.budget.toString()).toBe(budgetId.toString());
    });

    it('should store promotion reference', async () => {
      const promotionId = new mongoose.Types.ObjectId();
      const spendData = buildTradeSpend({ promotion: promotionId });
      const spend = await TradeSpend.create(spendData);

      expect(spend.promotion.toString()).toBe(promotionId.toString());
    });
  });

  describe('ROI and Volume Tracking', () => {
    it('should store expected and actual ROI', async () => {
      const spendData = buildTradeSpend({
        expectedROI: 3.5,
        actualROI: 3.2
      });
      const spend = await TradeSpend.create(spendData);

      expect(spend.expectedROI).toBe(3.5);
      expect(spend.actualROI).toBe(3.2);
    });

    it('should store expected and actual volume', async () => {
      const spendData = buildTradeSpend({
        expectedVolume: 10000,
        actualVolume: 9500
      });
      const spend = await TradeSpend.create(spendData);

      expect(spend.expectedVolume).toBe(10000);
      expect(spend.actualVolume).toBe(9500);
    });
  });

  describe('Approval Tracking', () => {
    it('should store approval information', async () => {
      const approvalDate = new Date();
      const spendData = buildTradeSpend({
        approvedBy: 'manager@example.com',
        approvedDate: approvalDate,
        status: 'Approved'
      });
      const spend = await TradeSpend.create(spendData);

      expect(spend.approvedBy).toBe('manager@example.com');
      expect(spend.approvedDate).toEqual(approvalDate);
      expect(spend.status).toBe('Approved');
    });
  });

  describe('Date Ranges', () => {
    it('should store start and end dates', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const spendData = buildTradeSpend({
        startDate,
        endDate
      });
      const spend = await TradeSpend.create(spendData);

      expect(spend.startDate).toEqual(startDate);
      expect(spend.endDate).toEqual(endDate);
    });
  });

  describe('Queries', () => {
    it('should find trade spends by customer', async () => {
      const customerId = new mongoose.Types.ObjectId();

      await TradeSpend.create([
        buildTradeSpend({ customer: customerId, spendId: 'TS-1' }),
        buildTradeSpend({ customer: customerId, spendId: 'TS-2' }),
        buildTradeSpend({ customer: new mongoose.Types.ObjectId(), spendId: 'TS-3' })
      ]);

      const spends = await TradeSpend.find({ customer: customerId });
      expect(spends).toHaveLength(2);
    });

    it('should find trade spends by status', async () => {
      await TradeSpend.create([
        buildTradeSpend({ status: 'Active', spendId: 'TS-1' }),
        buildTradeSpend({ status: 'Active', spendId: 'TS-2' }),
        buildTradeSpend({ status: 'Planned', spendId: 'TS-3' })
      ]);

      const activeSpends = await TradeSpend.find({ status: 'Active' });
      expect(activeSpends).toHaveLength(2);
    });

    it('should find trade spends by spend type', async () => {
      await TradeSpend.create([
        buildTradeSpend({ spendType: 'Trade Promotion', spendId: 'TS-1' }),
        buildTradeSpend({ spendType: 'Trade Promotion', spendId: 'TS-2' }),
        buildTradeSpend({ spendType: 'Rebate', spendId: 'TS-3' })
      ]);

      const promotions = await TradeSpend.find({ spendType: 'Trade Promotion' });
      expect(promotions).toHaveLength(2);
    });

    it('should find trade spends by date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      await TradeSpend.create([
        buildTradeSpend({ spendDate: new Date('2025-01-15'), spendId: 'TS-1' }),
        buildTradeSpend({ spendDate: new Date('2025-01-20'), spendId: 'TS-2' }),
        buildTradeSpend({ spendDate: new Date('2025-02-15'), spendId: 'TS-3' })
      ]);

      const janSpends = await TradeSpend.find({
        spendDate: { $gte: startDate, $lte: endDate }
      });
      expect(janSpends).toHaveLength(2);
    });
  });

  describe('Updates', () => {
    it('should update status from Planned to Approved', async () => {
      const spendData = buildTradeSpend({ status: 'Planned' });
      const spend = await TradeSpend.create(spendData);

      spend.status = 'Approved';
      spend.approvedBy = 'manager@example.com';
      spend.approvedDate = new Date();
      await spend.save();

      const updated = await TradeSpend.findById(spend._id);
      expect(updated.status).toBe('Approved');
      expect(updated.approvedBy).toBe('manager@example.com');
    });

    it('should update actualROI and actualVolume', async () => {
      const spendData = buildTradeSpend({
        expectedROI: 3.0,
        expectedVolume: 10000
      });
      const spend = await TradeSpend.create(spendData);

      spend.actualROI = 3.5;
      spend.actualVolume = 11000;
      await spend.save();

      const updated = await TradeSpend.findById(spend._id);
      expect(updated.actualROI).toBe(3.5);
      expect(updated.actualVolume).toBe(11000);
    });
  });

  describe('Timestamps', () => {
    it('should add createdAt timestamp', async () => {
      const spendData = buildTradeSpend();
      const spend = await TradeSpend.create(spendData);

      expect(spend.createdAt).toBeDefined();
      expect(spend.createdAt).toBeInstanceOf(Date);
    });

    it('should add updatedAt timestamp', async () => {
      const spendData = buildTradeSpend();
      const spend = await TradeSpend.create(spendData);

      expect(spend.updatedAt).toBeDefined();
      expect(spend.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const spendData = buildTradeSpend();
      const spend = await TradeSpend.create(spendData);
      const originalUpdatedAt = spend.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));
      spend.amount = 25000;
      await spend.save();

      expect(spend.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Deletion', () => {
    it('should delete a trade spend', async () => {
      const spendData = buildTradeSpend();
      const spend = await TradeSpend.create(spendData);
      const spendId = spend._id;

      await TradeSpend.deleteOne({ _id: spendId });

      const deleted = await TradeSpend.findById(spendId);
      expect(deleted).toBeNull();
    });

    it('should delete multiple trade spends', async () => {
      const customerId = new mongoose.Types.ObjectId();

      await TradeSpend.create([
        buildTradeSpend({ customer: customerId, spendId: 'TS-1' }),
        buildTradeSpend({ customer: customerId, spendId: 'TS-2' }),
        buildTradeSpend({ customer: customerId, spendId: 'TS-3' })
      ]);

      const result = await TradeSpend.deleteMany({ customer: customerId });
      expect(result.deletedCount).toBe(3);
    });
  });
});
