/**
 * SalesTransaction Model Tests
 * Comprehensive tests including virtual properties and static analytics methods
 */

const mongoose = require('mongoose');
const SalesTransaction = require('../../../models/SalesTransaction');
const dbHelper = require('../../helpers/db-helper');
const { faker } = require('@faker-js/faker');

const buildTransaction = (overrides = {}) => ({
  company: new mongoose.Types.ObjectId(),
  transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  customer: new mongoose.Types.ObjectId(),
  product: new mongoose.Types.ObjectId(),
  date: new Date(),
  quantity: 100,
  unitPrice: 50,
  totalAmount: 5000,
  discountAmount: 250,
  netAmount: 4750,
  currency: 'ZAR',
  salesRep: faker.person.fullName(),
  channel: 'Direct',
  region: faker.location.state(),
  status: 'completed',
  ...overrides
});

describe('SalesTransaction Model', () => {
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
    it('should create valid transaction with all required fields', async () => {
      const txnData = buildTransaction();
      const txn = await SalesTransaction.create(txnData);

      expect(txn).toHaveProperty('_id');
      expect(txn.transactionId).toBe(txnData.transactionId);
      expect(txn.quantity).toBe(100);
      expect(txn.netAmount).toBe(4750);
    });

    it('should require company', async () => {
      const txnData = buildTransaction({ company: undefined });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow(/company.*required/i);
    });

    it('should require transactionId', async () => {
      const txnData = buildTransaction({ transactionId: undefined });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow(/transactionId.*required/i);
    });

    it('should require customer', async () => {
      const txnData = buildTransaction({ customer: undefined });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow(/customer.*required/i);
    });

    it('should require product', async () => {
      const txnData = buildTransaction({ product: undefined });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow(/product.*required/i);
    });

    it('should require date', async () => {
      const txnData = buildTransaction({ date: undefined });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow(/date.*required/i);
    });

    it('should require quantity', async () => {
      const txnData = buildTransaction({ quantity: undefined });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow(/quantity.*required/i);
    });

    it('should require unitPrice', async () => {
      const txnData = buildTransaction({ unitPrice: undefined });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow(/unitPrice.*required/i);
    });

    it('should require totalAmount', async () => {
      const txnData = buildTransaction({ totalAmount: undefined });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow(/totalAmount.*required/i);
    });

    it('should require netAmount', async () => {
      const txnData = buildTransaction({ netAmount: undefined });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow(/netAmount.*required/i);
    });

    it('should require salesRep', async () => {
      const txnData = buildTransaction({ salesRep: undefined });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow(/salesRep.*required/i);
    });

    it('should require channel', async () => {
      const txnData = buildTransaction({ channel: undefined });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow(/channel.*required/i);
    });

    it('should require region', async () => {
      const txnData = buildTransaction({ region: undefined });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow(/region.*required/i);
    });

    it('should enforce unique transactionId', async () => {
      const transactionId = 'TXN-UNIQUE-123';
      await SalesTransaction.create(buildTransaction({ transactionId }));
      await expect(SalesTransaction.create(buildTransaction({ transactionId }))).rejects.toThrow();
    });
  });

  describe('Numeric Field Validation', () => {
    it('should reject negative quantity', async () => {
      const txnData = buildTransaction({ quantity: -10 });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow();
    });

    it('should reject negative unitPrice', async () => {
      const txnData = buildTransaction({ unitPrice: -50 });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow();
    });

    it('should reject negative totalAmount', async () => {
      const txnData = buildTransaction({ totalAmount: -1000 });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow();
    });

    it('should reject negative netAmount', async () => {
      const txnData = buildTransaction({ netAmount: -500 });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow();
    });

    it('should reject negative discountAmount', async () => {
      const txnData = buildTransaction({ discountAmount: -100 });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow();
    });

    it('should accept zero quantity', async () => {
      const txn = await SalesTransaction.create(buildTransaction({ quantity: 0 }));
      expect(txn.quantity).toBe(0);
    });
  });

  describe('Currency Validation', () => {
    it('should reject invalid currency', async () => {
      const txnData = buildTransaction({ currency: 'INVALID' });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow();
    });

    it('should accept all valid currencies', async () => {
      const currencies = ['ZAR', 'USD', 'EUR', 'GBP'];

      for (const currency of currencies) {
        const txn = await SalesTransaction.create(buildTransaction({ 
          currency,
          transactionId: `TXN-${currency}-${Date.now()}`
        }));
        expect(txn.currency).toBe(currency);
        await SalesTransaction.deleteMany({});
      }
    });

    it('should default to ZAR', async () => {
      const txn = await SalesTransaction.create(buildTransaction({ currency: undefined }));
      expect(txn.currency).toBe('ZAR');
    });
  });

  describe('Channel Validation', () => {
    it('should reject invalid channel', async () => {
      const txnData = buildTransaction({ channel: 'Invalid Channel' });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow();
    });

    it('should accept all valid channels', async () => {
      const channels = ['Direct', 'Distributor', 'Online', 'Retail', 'Wholesale'];

      for (const channel of channels) {
        const txn = await SalesTransaction.create(buildTransaction({ 
          channel,
          transactionId: `TXN-${channel}-${Date.now()}`
        }));
        expect(txn.channel).toBe(channel);
        await SalesTransaction.deleteMany({});
      }
    });
  });

  describe('Status Validation', () => {
    it('should reject invalid status', async () => {
      const txnData = buildTransaction({ status: 'invalid' });
      await expect(SalesTransaction.create(txnData)).rejects.toThrow();
    });

    it('should accept all valid statuses', async () => {
      const statuses = ['pending', 'completed', 'cancelled', 'refunded'];

      for (const status of statuses) {
        const txn = await SalesTransaction.create(buildTransaction({ 
          status,
          transactionId: `TXN-${status}-${Date.now()}`
        }));
        expect(txn.status).toBe(status);
        await SalesTransaction.deleteMany({});
      }
    });

    it('should default to completed', async () => {
      const txn = await SalesTransaction.create(buildTransaction({ status: undefined }));
      expect(txn.status).toBe('completed');
    });
  });

  describe('Default Values', () => {
    it('should default discountAmount to 0', async () => {
      const txn = await SalesTransaction.create(buildTransaction({ discountAmount: undefined }));
      expect(txn.discountAmount).toBe(0);
    });

    it('should default promotion to null', async () => {
      const txn = await SalesTransaction.create(buildTransaction({ promotion: undefined }));
      expect(txn.promotion).toBeNull();
    });
  });

  describe('Metadata Field', () => {
    it('should store metadata fields', async () => {
      const txn = await SalesTransaction.create(buildTransaction({
        metadata: {
          orderNumber: 'ORD-12345',
          invoiceNumber: 'INV-67890',
          paymentTerms: 'Net 30',
          deliveryDate: new Date('2025-11-15'),
          notes: 'Urgent delivery required'
        }
      }));

      expect(txn.metadata.orderNumber).toBe('ORD-12345');
      expect(txn.metadata.invoiceNumber).toBe('INV-67890');
      expect(txn.metadata.paymentTerms).toBe('Net 30');
      expect(txn.metadata.notes).toBe('Urgent delivery required');
    });
  });

  describe('Virtual Properties', () => {
    it('should calculate profitMargin virtual property', async () => {
      const txn = await SalesTransaction.create(buildTransaction({
        unitPrice: 100,
        quantity: 10,
        totalAmount: 1000,
        netAmount: 900
      }));

      const txnObj = txn.toObject({ virtuals: true });
      expect(txnObj.profitMargin).toBeDefined();
      expect(typeof txnObj.profitMargin).toBe('number');
    });

    it('should return 0 profitMargin when totalAmount is 0', async () => {
      const txn = await SalesTransaction.create(buildTransaction({
        totalAmount: 0,
        netAmount: 0
      }));

      const txnObj = txn.toObject({ virtuals: true });
      expect(txnObj.profitMargin).toBe(0);
    });
  });

  describe('Promotion Link', () => {
    it('should link to promotion', async () => {
      const promotionId = new mongoose.Types.ObjectId();
      const txn = await SalesTransaction.create(buildTransaction({ promotion: promotionId }));

      expect(txn.promotion.toString()).toBe(promotionId.toString());
    });

    it('should allow null promotion', async () => {
      const txn = await SalesTransaction.create(buildTransaction({ promotion: null }));
      expect(txn.promotion).toBeNull();
    });
  });

  describe('Queries', () => {
    it('should find transactions by company', async () => {
      const companyId = new mongoose.Types.ObjectId();

      await SalesTransaction.create([
        buildTransaction({ company: companyId, transactionId: 'TXN-1' }),
        buildTransaction({ company: companyId, transactionId: 'TXN-2' }),
        buildTransaction({ company: new mongoose.Types.ObjectId(), transactionId: 'TXN-3' })
      ]);

      const txns = await SalesTransaction.find({ company: companyId });
      expect(txns).toHaveLength(2);
    });

    it('should find transactions by customer', async () => {
      const customerId = new mongoose.Types.ObjectId();

      await SalesTransaction.create([
        buildTransaction({ customer: customerId, transactionId: 'TXN-1' }),
        buildTransaction({ customer: customerId, transactionId: 'TXN-2' }),
        buildTransaction({ customer: new mongoose.Types.ObjectId(), transactionId: 'TXN-3' })
      ]);

      const txns = await SalesTransaction.find({ customer: customerId });
      expect(txns).toHaveLength(2);
    });

    it('should find transactions by product', async () => {
      const productId = new mongoose.Types.ObjectId();

      await SalesTransaction.create([
        buildTransaction({ product: productId, transactionId: 'TXN-1' }),
        buildTransaction({ product: productId, transactionId: 'TXN-2' }),
        buildTransaction({ product: new mongoose.Types.ObjectId(), transactionId: 'TXN-3' })
      ]);

      const txns = await SalesTransaction.find({ product: productId });
      expect(txns).toHaveLength(2);
    });

    it('should find transactions by date range', async () => {
      const startDate = new Date('2025-10-01');
      const endDate = new Date('2025-10-31');

      await SalesTransaction.create([
        buildTransaction({ date: new Date('2025-10-15'), transactionId: 'TXN-1' }),
        buildTransaction({ date: new Date('2025-10-20'), transactionId: 'TXN-2' }),
        buildTransaction({ date: new Date('2025-11-05'), transactionId: 'TXN-3' })
      ]);

      const txns = await SalesTransaction.find({
        date: { $gte: startDate, $lte: endDate }
      });
      expect(txns).toHaveLength(2);
    });

    it('should find transactions by status', async () => {
      await SalesTransaction.create([
        buildTransaction({ status: 'completed', transactionId: 'TXN-1' }),
        buildTransaction({ status: 'completed', transactionId: 'TXN-2' }),
        buildTransaction({ status: 'pending', transactionId: 'TXN-3' })
      ]);

      const txns = await SalesTransaction.find({ status: 'completed' });
      expect(txns).toHaveLength(2);
    });

    it('should find transactions by channel', async () => {
      await SalesTransaction.create([
        buildTransaction({ channel: 'Online', transactionId: 'TXN-1' }),
        buildTransaction({ channel: 'Online', transactionId: 'TXN-2' }),
        buildTransaction({ channel: 'Direct', transactionId: 'TXN-3' })
      ]);

      const txns = await SalesTransaction.find({ channel: 'Online' });
      expect(txns).toHaveLength(2);
    });

    it('should find transactions by region', async () => {
      await SalesTransaction.create([
        buildTransaction({ region: 'Gauteng', transactionId: 'TXN-1' }),
        buildTransaction({ region: 'Gauteng', transactionId: 'TXN-2' }),
        buildTransaction({ region: 'Western Cape', transactionId: 'TXN-3' })
      ]);

      const txns = await SalesTransaction.find({ region: 'Gauteng' });
      expect(txns).toHaveLength(2);
    });
  });

  describe('Static Analytics Methods', () => {
    describe('getRevenueByPeriod', () => {
      it('should aggregate revenue by period', async () => {
        const companyId = new mongoose.Types.ObjectId();
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-12-31');

        await SalesTransaction.create([
          buildTransaction({ 
            company: companyId,
            date: new Date('2025-01-15'),
            netAmount: 1000,
            quantity: 10,
            status: 'completed',
            transactionId: 'TXN-1'
          }),
          buildTransaction({ 
            company: companyId,
            date: new Date('2025-01-20'),
            netAmount: 2000,
            quantity: 20,
            status: 'completed',
            transactionId: 'TXN-2'
          }),
          buildTransaction({ 
            company: companyId,
            date: new Date('2025-02-10'),
            netAmount: 1500,
            quantity: 15,
            status: 'completed',
            transactionId: 'TXN-3'
          })
        ]);

        const revenue = await SalesTransaction.getRevenueByPeriod(companyId, startDate, endDate);
        
        expect(revenue).toBeInstanceOf(Array);
        expect(revenue.length).toBeGreaterThan(0);
        expect(revenue[0]).toHaveProperty('totalRevenue');
        expect(revenue[0]).toHaveProperty('totalQuantity');
      });
    });

    describe('getTopCustomers', () => {
      it('should return top customers by revenue', async () => {
        const companyId = new mongoose.Types.ObjectId();
        const customer1 = new mongoose.Types.ObjectId();
        const customer2 = new mongoose.Types.ObjectId();

        await SalesTransaction.create([
          buildTransaction({ 
            company: companyId,
            customer: customer1,
            netAmount: 5000,
            status: 'completed',
            transactionId: 'TXN-1'
          }),
          buildTransaction({ 
            company: companyId,
            customer: customer1,
            netAmount: 3000,
            status: 'completed',
            transactionId: 'TXN-2'
          }),
          buildTransaction({ 
            company: companyId,
            customer: customer2,
            netAmount: 2000,
            status: 'completed',
            transactionId: 'TXN-3'
          })
        ]);

        const topCustomers = await SalesTransaction.getTopCustomers(companyId, 5);
        
        expect(topCustomers).toBeInstanceOf(Array);
        expect(topCustomers.length).toBeGreaterThan(0);
        expect(topCustomers[0]).toHaveProperty('totalRevenue');
        expect(topCustomers[0].totalRevenue).toBeGreaterThanOrEqual(topCustomers[topCustomers.length - 1]?.totalRevenue || 0);
      });
    });

    describe('getTopProducts', () => {
      it('should return top products by revenue', async () => {
        const companyId = new mongoose.Types.ObjectId();
        const product1 = new mongoose.Types.ObjectId();
        const product2 = new mongoose.Types.ObjectId();

        await SalesTransaction.create([
          buildTransaction({ 
            company: companyId,
            product: product1,
            netAmount: 8000,
            quantity: 80,
            status: 'completed',
            transactionId: 'TXN-1'
          }),
          buildTransaction({ 
            company: companyId,
            product: product1,
            netAmount: 5000,
            quantity: 50,
            status: 'completed',
            transactionId: 'TXN-2'
          }),
          buildTransaction({ 
            company: companyId,
            product: product2,
            netAmount: 3000,
            quantity: 30,
            status: 'completed',
            transactionId: 'TXN-3'
          })
        ]);

        const topProducts = await SalesTransaction.getTopProducts(companyId, 5);
        
        expect(topProducts).toBeInstanceOf(Array);
        expect(topProducts.length).toBeGreaterThan(0);
        expect(topProducts[0]).toHaveProperty('totalRevenue');
        expect(topProducts[0]).toHaveProperty('totalQuantity');
      });
    });
  });

  describe('Updates', () => {
    it('should update status', async () => {
      const txn = await SalesTransaction.create(buildTransaction({ status: 'pending' }));

      txn.status = 'completed';
      await txn.save();

      const updated = await SalesTransaction.findById(txn._id);
      expect(updated.status).toBe('completed');
    });

    it('should update metadata', async () => {
      const txn = await SalesTransaction.create(buildTransaction());

      txn.metadata = {
        ...txn.metadata,
        notes: 'Updated notes'
      };
      await txn.save();

      const updated = await SalesTransaction.findById(txn._id);
      expect(updated.metadata.notes).toBe('Updated notes');
    });
  });

  describe('Timestamps', () => {
    it('should add createdAt timestamp', async () => {
      const txn = await SalesTransaction.create(buildTransaction());
      expect(txn.createdAt).toBeDefined();
      expect(txn.createdAt).toBeInstanceOf(Date);
    });

    it('should add updatedAt timestamp', async () => {
      const txn = await SalesTransaction.create(buildTransaction());
      expect(txn.updatedAt).toBeDefined();
      expect(txn.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const txn = await SalesTransaction.create(buildTransaction());
      const originalUpdatedAt = txn.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));
      txn.status = 'refunded';
      await txn.save();

      expect(txn.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Deletion', () => {
    it('should delete a transaction', async () => {
      const txn = await SalesTransaction.create(buildTransaction());
      await SalesTransaction.deleteOne({ _id: txn._id });

      const deleted = await SalesTransaction.findById(txn._id);
      expect(deleted).toBeNull();
    });

    it('should delete multiple transactions', async () => {
      const companyId = new mongoose.Types.ObjectId();

      await SalesTransaction.create([
        buildTransaction({ company: companyId, transactionId: 'TXN-1' }),
        buildTransaction({ company: companyId, transactionId: 'TXN-2' })
      ]);

      const result = await SalesTransaction.deleteMany({ company: companyId });
      expect(result.deletedCount).toBe(2);
    });
  });
});
