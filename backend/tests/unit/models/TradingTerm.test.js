/**
 * TradingTerm Model Tests
 * Comprehensive tests for TradingTerm model validation and operations
 */

const mongoose = require('mongoose');
const TradingTerm = require('../../../models/TradingTerm');
const dbHelper = require('../../helpers/db-helper');
const { faker } = require('@faker-js/faker');

const buildTradingTerm = (overrides = {}) => ({
  termId: `TERM-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  customer: new mongoose.Types.ObjectId(),
  customerName: faker.company.name(),
  termType: 'Volume Discount',
  description: faker.commerce.productDescription(),
  paymentTerms: 'Net 30',
  value: 5.5,
  valueType: 'Percentage',
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  status: 'Active',
  targetVolume: 100000,
  actualVolume: 0,
  estimatedPayout: 5500,
  actualPayout: 0,
  currency: 'INR',
  createdBy: faker.person.fullName(),
  ...overrides
});

describe('TradingTerm Model', () => {
  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  afterEach(async () => {
    await dbHelper.clearDatabase();
  });

  describe('Schema Validation - Required Fields', () => {
    it('should create valid trading term with all required fields', async () => {
      const termData = buildTradingTerm();
      const term = await TradingTerm.create(termData);

      expect(term).toHaveProperty('_id');
      expect(term.termId).toBe(termData.termId);
      expect(term.customerName).toBe(termData.customerName);
      expect(term.termType).toBe('Volume Discount');
    });

    it('should require termId', async () => {
      const termData = buildTradingTerm({ termId: undefined });
      await expect(TradingTerm.create(termData)).rejects.toThrow(/termId.*required/i);
    });

    it('should require customer', async () => {
      const termData = buildTradingTerm({ customer: undefined });
      await expect(TradingTerm.create(termData)).rejects.toThrow(/customer.*required/i);
    });

    it('should require customerName', async () => {
      const termData = buildTradingTerm({ customerName: undefined });
      await expect(TradingTerm.create(termData)).rejects.toThrow(/customerName.*required/i);
    });

    it('should require termType', async () => {
      const termData = buildTradingTerm({ termType: undefined });
      await expect(TradingTerm.create(termData)).rejects.toThrow(/termType.*required/i);
    });

    it('should require value', async () => {
      const termData = buildTradingTerm({ value: undefined });
      await expect(TradingTerm.create(termData)).rejects.toThrow(/value.*required/i);
    });

    it('should require startDate', async () => {
      const termData = buildTradingTerm({ startDate: undefined });
      await expect(TradingTerm.create(termData)).rejects.toThrow(/startDate.*required/i);
    });

    it('should require endDate', async () => {
      const termData = buildTradingTerm({ endDate: undefined });
      await expect(TradingTerm.create(termData)).rejects.toThrow(/endDate.*required/i);
    });

    it('should enforce unique termId', async () => {
      const termId = 'TERM-UNIQUE-123';
      await TradingTerm.create(buildTradingTerm({ termId }));
      await expect(TradingTerm.create(buildTradingTerm({ termId }))).rejects.toThrow();
    });
  });

  describe('Term Type Validation', () => {
    it('should reject invalid term type', async () => {
      const termData = buildTradingTerm({ termType: 'Invalid Type' });
      await expect(TradingTerm.create(termData)).rejects.toThrow();
    });

    it('should accept all valid term types', async () => {
      const termTypes = [
        'Volume Discount',
        'Growth Incentive',
        'Listing Fee',
        'Annual Rebate',
        'Promotional Support',
        'Marketing Fund',
        'Distribution Support'
      ];

      for (const termType of termTypes) {
        const term = await TradingTerm.create(buildTradingTerm({ 
          termType,
          termId: `TERM-${termType}-${Date.now()}`.replace(/\s+/g, '-')
        }));
        expect(term.termType).toBe(termType);
        await TradingTerm.deleteMany({});
      }
    });
  });

  describe('Payment Terms Validation', () => {
    it('should reject invalid payment terms', async () => {
      const termData = buildTradingTerm({ paymentTerms: 'Invalid Terms' });
      await expect(TradingTerm.create(termData)).rejects.toThrow();
    });

    it('should accept all valid payment terms', async () => {
      const paymentTerms = ['Immediate', 'Net 30', 'Net 60', 'Net 90', 'Quarterly', 'Annual'];

      for (const terms of paymentTerms) {
        const term = await TradingTerm.create(buildTradingTerm({ 
          paymentTerms: terms,
          termId: `TERM-${terms}-${Date.now()}`.replace(/\s+/g, '-')
        }));
        expect(term.paymentTerms).toBe(terms);
        await TradingTerm.deleteMany({});
      }
    });

    it('should default to Net 30', async () => {
      const term = await TradingTerm.create(buildTradingTerm({ paymentTerms: undefined }));
      expect(term.paymentTerms).toBe('Net 30');
    });
  });

  describe('Value Type Validation', () => {
    it('should reject invalid value type', async () => {
      const termData = buildTradingTerm({ valueType: 'Invalid Type' });
      await expect(TradingTerm.create(termData)).rejects.toThrow();
    });

    it('should accept Percentage', async () => {
      const term = await TradingTerm.create(buildTradingTerm({ valueType: 'Percentage', value: 10 }));
      expect(term.valueType).toBe('Percentage');
    });

    it('should accept Fixed Amount', async () => {
      const term = await TradingTerm.create(buildTradingTerm({ valueType: 'Fixed Amount', value: 50000 }));
      expect(term.valueType).toBe('Fixed Amount');
    });

    it('should default to Percentage', async () => {
      const term = await TradingTerm.create(buildTradingTerm({ valueType: undefined }));
      expect(term.valueType).toBe('Percentage');
    });
  });

  describe('Status Validation', () => {
    it('should reject invalid status', async () => {
      const termData = buildTradingTerm({ status: 'Invalid Status' });
      await expect(TradingTerm.create(termData)).rejects.toThrow();
    });

    it('should accept all valid statuses', async () => {
      const statuses = ['Active', 'Pending', 'Expired', 'Cancelled'];

      for (const status of statuses) {
        const term = await TradingTerm.create(buildTradingTerm({ 
          status,
          termId: `TERM-${status}-${Date.now()}`
        }));
        expect(term.status).toBe(status);
        await TradingTerm.deleteMany({});
      }
    });

    it('should default to Active', async () => {
      const term = await TradingTerm.create(buildTradingTerm({ status: undefined }));
      expect(term.status).toBe('Active');
    });
  });

  describe('Default Values', () => {
    it('should default actualVolume to 0', async () => {
      const term = await TradingTerm.create(buildTradingTerm({ actualVolume: undefined }));
      expect(term.actualVolume).toBe(0);
    });

    it('should default actualPayout to 0', async () => {
      const term = await TradingTerm.create(buildTradingTerm({ actualPayout: undefined }));
      expect(term.actualPayout).toBe(0);
    });

    it('should default currency to INR', async () => {
      const term = await TradingTerm.create(buildTradingTerm({ currency: undefined }));
      expect(term.currency).toBe('INR');
    });
  });

  describe('Volume Tracking', () => {
    it('should store target and actual volume', async () => {
      const term = await TradingTerm.create(buildTradingTerm({
        targetVolume: 500000,
        actualVolume: 325000
      }));

      expect(term.targetVolume).toBe(500000);
      expect(term.actualVolume).toBe(325000);
    });

    it('should update actual volume', async () => {
      const term = await TradingTerm.create(buildTradingTerm({ actualVolume: 0 }));
      
      term.actualVolume = 150000;
      await term.save();

      const updated = await TradingTerm.findById(term._id);
      expect(updated.actualVolume).toBe(150000);
    });
  });

  describe('Payout Calculations', () => {
    it('should store estimated and actual payout', async () => {
      const term = await TradingTerm.create(buildTradingTerm({
        estimatedPayout: 25000,
        actualPayout: 18500
      }));

      expect(term.estimatedPayout).toBe(25000);
      expect(term.actualPayout).toBe(18500);
    });

    it('should update actual payout', async () => {
      const term = await TradingTerm.create(buildTradingTerm({ actualPayout: 0 }));
      
      term.actualPayout = 22000;
      await term.save();

      const updated = await TradingTerm.findById(term._id);
      expect(updated.actualPayout).toBe(22000);
    });
  });

  describe('Approval Tracking', () => {
    it('should store approval information', async () => {
      const approvedDate = new Date();
      const term = await TradingTerm.create(buildTradingTerm({
        approvedBy: 'Jane Manager',
        approvedDate
      }));

      expect(term.approvedBy).toBe('Jane Manager');
      expect(term.approvedDate).toEqual(approvedDate);
    });
  });

  describe('Queries', () => {
    it('should find terms by customer', async () => {
      const customerId = new mongoose.Types.ObjectId();

      await TradingTerm.create([
        buildTradingTerm({ customer: customerId, termId: 'TERM-1' }),
        buildTradingTerm({ customer: customerId, termId: 'TERM-2' }),
        buildTradingTerm({ customer: new mongoose.Types.ObjectId(), termId: 'TERM-3' })
      ]);

      const terms = await TradingTerm.find({ customer: customerId });
      expect(terms).toHaveLength(2);
    });

    it('should find terms by status', async () => {
      await TradingTerm.create([
        buildTradingTerm({ status: 'Active', termId: 'TERM-1' }),
        buildTradingTerm({ status: 'Active', termId: 'TERM-2' }),
        buildTradingTerm({ status: 'Expired', termId: 'TERM-3' })
      ]);

      const terms = await TradingTerm.find({ status: 'Active' });
      expect(terms).toHaveLength(2);
    });

    it('should find terms by type', async () => {
      await TradingTerm.create([
        buildTradingTerm({ termType: 'Volume Discount', termId: 'TERM-1' }),
        buildTradingTerm({ termType: 'Volume Discount', termId: 'TERM-2' }),
        buildTradingTerm({ termType: 'Annual Rebate', termId: 'TERM-3' })
      ]);

      const terms = await TradingTerm.find({ termType: 'Volume Discount' });
      expect(terms).toHaveLength(2);
    });

    it('should find terms by date range', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await TradingTerm.create([
        buildTradingTerm({ 
          startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          termId: 'TERM-1'
        }),
        buildTradingTerm({ 
          startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          termId: 'TERM-2'
        }),
        buildTradingTerm({ 
          startDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
          termId: 'TERM-3'
        })
      ]);

      const terms = await TradingTerm.find({
        startDate: { $lte: future }
      });
      expect(terms).toHaveLength(2);
    });
  });

  describe('Updates', () => {
    it('should update status from Active to Expired', async () => {
      const term = await TradingTerm.create(buildTradingTerm({ status: 'Active' }));

      term.status = 'Expired';
      await term.save();

      const updated = await TradingTerm.findById(term._id);
      expect(updated.status).toBe('Expired');
    });

    it('should update description', async () => {
      const term = await TradingTerm.create(buildTradingTerm());

      term.description = 'Updated description for trading term';
      await term.save();

      const updated = await TradingTerm.findById(term._id);
      expect(updated.description).toBe('Updated description for trading term');
    });

    it('should update notes', async () => {
      const term = await TradingTerm.create(buildTradingTerm({ notes: 'Initial notes' }));

      term.notes = 'Updated notes with new information';
      await term.save();

      const updated = await TradingTerm.findById(term._id);
      expect(updated.notes).toBe('Updated notes with new information');
    });
  });

  describe('Complex Queries', () => {
    it('should find active terms with target volume', async () => {
      await TradingTerm.create([
        buildTradingTerm({ status: 'Active', targetVolume: 100000, termId: 'TERM-1' }),
        buildTradingTerm({ status: 'Active', targetVolume: 200000, termId: 'TERM-2' }),
        buildTradingTerm({ status: 'Expired', targetVolume: 150000, termId: 'TERM-3' })
      ]);

      const terms = await TradingTerm.find({ 
        status: 'Active', 
        targetVolume: { $gte: 150000 } 
      });
      expect(terms).toHaveLength(1);
      expect(terms[0].targetVolume).toBe(200000);
    });

    it('should calculate volume achievement percentage', async () => {
      const term = await TradingTerm.create(buildTradingTerm({
        targetVolume: 100000,
        actualVolume: 75000
      }));

      const achievement = (term.actualVolume / term.targetVolume) * 100;
      expect(achievement).toBe(75);
    });
  });

  describe('Timestamps', () => {
    it('should add createdAt timestamp', async () => {
      const term = await TradingTerm.create(buildTradingTerm());
      expect(term.createdAt).toBeDefined();
      expect(term.createdAt).toBeInstanceOf(Date);
    });

    it('should add updatedAt timestamp', async () => {
      const term = await TradingTerm.create(buildTradingTerm());
      expect(term.updatedAt).toBeDefined();
      expect(term.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const term = await TradingTerm.create(buildTradingTerm());
      const originalUpdatedAt = term.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));
      term.actualVolume = 50000;
      await term.save();

      expect(term.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Deletion', () => {
    it('should delete a term', async () => {
      const term = await TradingTerm.create(buildTradingTerm());
      await TradingTerm.deleteOne({ _id: term._id });

      const deleted = await TradingTerm.findById(term._id);
      expect(deleted).toBeNull();
    });

    it('should delete multiple terms by customer', async () => {
      const customerId = new mongoose.Types.ObjectId();

      await TradingTerm.create([
        buildTradingTerm({ customer: customerId, termId: 'TERM-1' }),
        buildTradingTerm({ customer: customerId, termId: 'TERM-2' })
      ]);

      const result = await TradingTerm.deleteMany({ customer: customerId });
      expect(result.deletedCount).toBe(2);
    });
  });
});
