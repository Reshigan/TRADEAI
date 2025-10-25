const mongoose = require('mongoose');
const Transaction = require('../../../src/models/Transaction');

/**
 * TRANSACTION MODEL TESTS
 * Comprehensive test suite covering ALL transaction features
 * 
 * Test Coverage:
 * - ✅ Transaction creation & validation
 * - ✅ Transaction types (6 types)
 * - ✅ Status states (9 states)
 * - ✅ Amount calculations
 * - ✅ Multi-currency support
 * - ✅ Line items (SKU-level)
 * - ✅ Payment tracking
 * - ✅ Documents & notes
 * - ✅ Audit trail
 * - ✅ Soft delete
 * - ✅ Approval workflow
 * - ✅ Settlement tracking
 * 
 * This test file ensures all transaction features work correctly
 * and are included in automated testing as requested.
 */

describe('Transaction Model - Comprehensive Tests', () => {
  let mockTenantId, mockCustomerId, mockUserId, mockProductId;

  beforeEach(() => {
    mockTenantId = new mongoose.Types.ObjectId();
    mockCustomerId = new mongoose.Types.ObjectId();
    mockUserId = new mongoose.Types.ObjectId();
    mockProductId = new mongoose.Types.ObjectId();
  });

  const createMockData = (overrides = {}) => ({
    transactionType: 'order',
    customerId: mockCustomerId,
    tenantId: mockTenantId,
    transactionDate: new Date(),
    amount: {
      gross: 1000,
      net: 900,
      tax: 90,
      discount: 10
    },
    items: [{
      productId: mockProductId,
      sku: 'TEST-001',
      quantity: 10,
      unitPrice: 100,
      total: 1000
    }],
    createdBy: mockUserId,
    ...overrides
  });

  describe('✅ Transaction Creation & Validation', () => {
    test('should create transaction with required fields', async () => {
      const transaction = new Transaction(createMockData());
      const saved = await transaction.save();
      
      expect(saved._id).toBeDefined();
      expect(saved.transactionNumber).toMatch(/^ORD-\d{8}-\d{3}$/);
      expect(saved.status).toBe('draft');
    });

    test('should support all 6 transaction types', async () => {
      const types = ['order', 'trade_deal', 'settlement', 'payment', 'accrual', 'deduction'];
      
      for (const type of types) {
        const transaction = new Transaction(createMockData({ transactionType: type }));
        await transaction.save();
        expect(transaction.transactionType).toBe(type);
      }
    });

    test('should support all 9 status states', async () => {
      const statuses = ['draft', 'pending_approval', 'approved', 'rejected',
        'processing', 'completed', 'cancelled', 'failed', 'on_hold'];
      
      for (const status of statuses) {
        const transaction = new Transaction(createMockData({ status }));
        await transaction.save();
        expect(transaction.status).toBe(status);
      }
    });
  });

  describe('✅ Amount Calculations', () => {
    test('should calculate totals correctly', async () => {
      const transaction = new Transaction(createMockData({
        items: [
          { productId: mockProductId, quantity: 10, unitPrice: 100, discount: 50, tax: 25, total: 975 },
          { productId: new mongoose.Types.ObjectId(), quantity: 5, unitPrice: 200, discount: 100, tax: 50, total: 950 }
        ]
      }));
      
      transaction.calculateTotals();
      
      expect(transaction.amount.gross).toBe(2000);
      expect(transaction.amount.discount).toBe(150);
      expect(transaction.amount.tax).toBe(75);
      expect(transaction.amount.net).toBe(1925);
    });
  });

  describe('✅ Multi-Currency Support', () => {
    test('should support multiple currencies', async () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];
      
      for (const currency of currencies) {
        const transaction = new Transaction(createMockData({ currency }));
        await transaction.save();
        expect(transaction.currency).toBe(currency);
      }
    });
  });

  describe('✅ Line Items (SKU-level tracking)', () => {
    test('should support multiple line items', async () => {
      const transaction = new Transaction(createMockData({
        items: [
          { productId: mockProductId, sku: 'SKU-001', quantity: 10, unitPrice: 100, total: 1000 },
          { productId: new mongoose.Types.ObjectId(), sku: 'SKU-002', quantity: 5, unitPrice: 200, total: 1000 }
        ]
      }));
      await transaction.save();
      
      expect(transaction.items.length).toBe(2);
      expect(transaction.items[0].sku).toBe('SKU-001');
    });
  });

  describe('✅ Payment Tracking', () => {
    test('should support payment methods', async () => {
      const methods = ['credit', 'debit', 'wire_transfer', 'check', 'cash', 'credit_memo'];
      
      for (const method of methods) {
        const transaction = new Transaction(createMockData({
          payment: { method }
        }));
        await transaction.save();
        expect(transaction.payment.method).toBe(method);
      }
    });

    test('should support payment terms', async () => {
      const terms = ['net_30', 'net_60', 'net_90', 'cod', 'prepaid', 'custom'];
      
      for (const term of terms) {
        const transaction = new Transaction(createMockData({
          payment: { terms: term }
        }));
        await transaction.save();
        expect(transaction.payment.terms).toBe(term);
      }
    });
  });

  describe('✅ Documents & Notes', () => {
    test('should attach documents', async () => {
      const transaction = new Transaction(createMockData());
      transaction.documents.push({
        name: 'invoice.pdf',
        type: 'pdf',
        url: 'https://example.com/invoice.pdf',
        uploadedBy: mockUserId,
        uploadedAt: new Date()
      });
      await transaction.save();
      
      expect(transaction.documents.length).toBe(1);
      expect(transaction.documents[0].name).toBe('invoice.pdf');
    });

    test('should add notes with internal flag', async () => {
      const transaction = new Transaction(createMockData());
      transaction.notes.push({
        text: 'Internal note',
        createdBy: mockUserId,
        isInternal: true
      });
      await transaction.save();
      
      expect(transaction.notes[0].isInternal).toBe(true);
    });
  });

  describe('✅ Audit Trail', () => {
    test('should track creator and timestamps', async () => {
      const transaction = new Transaction(createMockData());
      await transaction.save();
      
      expect(transaction.createdBy).toEqual(mockUserId);
      expect(transaction.createdAt).toBeDefined();
      expect(transaction.updatedAt).toBeDefined();
    });
  });

  describe('✅ Soft Delete', () => {
    test('should soft delete transaction', async () => {
      const transaction = new Transaction(createMockData());
      await transaction.save();
      
      transaction.isDeleted = true;
      transaction.deletedAt = new Date();
      transaction.deletedBy = mockUserId;
      await transaction.save();
      
      expect(transaction.isDeleted).toBe(true);
      expect(transaction.deletedAt).toBeDefined();
    });
  });

  describe('✅ Approval Workflow', () => {
    test('should approve transaction', async () => {
      const approverId = new mongoose.Types.ObjectId();
      const transaction = new Transaction(createMockData({
        status: 'pending_approval',
        workflow: {
          approvers: [{
            userId: approverId,
            action: 'pending',
            level: 1
          }]
        }
      }));
      await transaction.save();
      
      await transaction.approve(approverId, 'Approved');
      
      expect(transaction.workflow.approvers[0].action).toBe('approved');
      expect(transaction.status).toBe('approved');
    });

    test('should reject transaction', async () => {
      const approverId = new mongoose.Types.ObjectId();
      const transaction = new Transaction(createMockData({
        status: 'pending_approval',
        workflow: {
          approvers: [{
            userId: approverId,
            action: 'pending',
            level: 1
          }]
        }
      }));
      await transaction.save();
      
      await transaction.reject(approverId, 'Rejected');
      
      expect(transaction.status).toBe('rejected');
    });
  });

  describe('✅ Settlement Tracking', () => {
    test('should track settlement information', async () => {
      const transaction = new Transaction(createMockData({
        status: 'approved',
        settlement: {
          scheduledDate: new Date(),
          method: 'wire_transfer',
          referenceNumber: 'WIRE-123'
        }
      }));
      await transaction.save();
      
      expect(transaction.settlement.method).toBe('wire_transfer');
      expect(transaction.settlement.referenceNumber).toBe('WIRE-123');
    });
  });
});
