const Settlement = require('../models/Settlement');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Deduction = require('../models/Deduction');

/**
 * SETTLEMENT & RECONCILIATION SERVICE
 * Automated settlement matching, clearing, and bank reconciliation
 */
class SettlementService {
  /**
   * Create settlement for customer
   */
  async createSettlement(customerId, periodStart, periodEnd, userId) {
    const settlementNumber = await this._generateSettlementNumber();

    // Find all unsettled items for the period
    const [invoices, payments, deductions] = await Promise.all([
      Invoice.find({
        customerId,
        status: { $in: ['approved', 'paid'] },
        invoiceDate: { $gte: periodStart, $lte: periodEnd }
      }),
      Payment.find({
        customerId,
        status: 'cleared',
        settled: false,
        paymentDate: { $gte: periodStart, $lte: periodEnd }
      }),
      Deduction.find({
        customerId,
        status: 'approved',
        deductionDate: { $gte: periodStart, $lte: periodEnd }
      })
    ]);

    // Build settlement items
    const items = [];

    // Add invoices
    invoices.forEach((invoice) => {
      items.push({
        itemType: 'invoice',
        referenceId: invoice._id,
        referenceModel: 'Invoice',
        referenceNumber: invoice.invoiceNumber,
        amount: invoice.total
      });
    });

    // Add payments
    payments.forEach((payment) => {
      items.push({
        itemType: 'payment',
        referenceId: payment._id,
        referenceModel: 'Payment',
        referenceNumber: payment.paymentNumber,
        amount: payment.amount
      });
    });

    // Add deductions
    deductions.forEach((deduction) => {
      items.push({
        itemType: 'deduction',
        referenceId: deduction._id,
        referenceModel: 'Deduction',
        referenceNumber: deduction.deductionNumber,
        amount: deduction.amount
      });
    });

    const settlement = new Settlement({
      settlementNumber,
      customerId,
      settlementDate: new Date(),
      periodStart,
      periodEnd,
      items,
      settlementType: 'periodic',
      status: 'draft',
      createdBy: userId
    });

    await settlement.save();
    return settlement;
  }

  /**
   * Auto-create settlements for all customers
   */
  async autoCreateSettlements(periodStart, periodEnd, userId) {
    // Get all customers with unsettled transactions
    const customers = await Invoice.distinct('customerId', {
      status: { $in: ['approved', 'paid'] },
      invoiceDate: { $gte: periodStart, $lte: periodEnd }
    });

    const results = {
      total: customers.length,
      created: 0,
      failed: [],
      settlements: []
    };

    for (const customerId of customers) {
      try {
        const settlement = await this.createSettlement(
          customerId,
          periodStart,
          periodEnd,
          userId
        );

        results.created++;
        results.settlements.push({
          settlementNumber: settlement.settlementNumber,
          customerId,
          netAmount: settlement.netSettlement,
          itemCount: settlement.items.length
        });
      } catch (error) {
        results.failed.push({
          customerId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Approve settlement
   */
  async approveSettlement(settlementId, userId) {
    const settlement = await Settlement.findById(settlementId);
    if (!settlement) throw new Error('Settlement not found');

    await settlement.approve(userId);
    return settlement;
  }

  /**
   * Process settlement
   */
  async processSettlement(settlementId) {
    const settlement = await Settlement.findById(settlementId)
      .populate('customerId')
      .populate({
        path: 'items.referenceId',
        model(doc) {
          return doc.items.map((item) => item.referenceModel);
        }
      });

    if (!settlement) throw new Error('Settlement not found');

    await settlement.process();

    // Process each item
    const results = {
      success: true,
      processed: 0,
      failed: [],
      errors: []
    };

    for (const item of settlement.items) {
      try {
        await this._processSettlementItem(item);
        item.settled = true;
        item.settledDate = new Date();
        results.processed++;
      } catch (error) {
        results.failed.push(item.referenceNumber);
        results.errors.push({
          item: item.referenceNumber,
          error: error.message
        });
      }
    }

    // Complete settlement if all items processed
    if (results.failed.length === 0) {
      await settlement.complete();
    } else {
      await settlement.fail(`Failed to process ${results.failed.length} items`);
      results.success = false;
    }

    await settlement.save();

    return results;
  }

  /**
   * Process individual settlement item
   */
  async _processSettlementItem(item) {
    switch (item.itemType) {
      case 'payment': {
        const payment = await Payment.findById(item.referenceId);
        if (payment) {
          await payment.settle(item._id);
        }
        break;
      }

      case 'invoice': {
        const invoice = await Invoice.findById(item.referenceId);
        if (invoice && invoice.status === 'paid') {
          // Mark as settled in GL
          invoice.metadata = invoice.metadata || {};
          invoice.metadata.settled = true;
          invoice.metadata.settlementDate = new Date();
          await invoice.save();
        }
        break;
      }

      case 'deduction': {
        const deduction = await Deduction.findById(item.referenceId);
        if (deduction) {
          deduction.settled = true;
          deduction.settlementDate = new Date();
          await deduction.save();
        }
        break;
      }

      default:
        throw new Error(`Unknown item type: ${item.itemType}`);
    }
  }

  /**
   * Bank reconciliation
   */
  async reconcileWithBankStatement(settlementId, bankStatementData, userId) {
    const settlement = await Settlement.findById(settlementId);
    if (!settlement) throw new Error('Settlement not found');

    // Match bank statement amount with settlement net amount
    const variance = Math.abs(bankStatementData.amount - settlement.netSettlement);
    const tolerancePercent = 0.01; // 1% tolerance

    if (variance > settlement.netSettlement * tolerancePercent) {
      throw new Error(
        `Bank statement amount (${bankStatementData.amount}) ` +
        `does not match settlement net amount (${settlement.netSettlement}). ` +
        `Variance: ${variance}`
      );
    }

    settlement.bankTransactionId = bankStatementData.transactionId;
    settlement.bankReferenceNumber = bankStatementData.referenceNumber;

    await settlement.reconcile(userId, bankStatementData.statementId);

    return settlement;
  }

  /**
   * Auto-reconcile cleared payments
   */
  async autoReconcilePayments(customerId, options = {}) {
    const query = {
      status: 'cleared',
      reconciled: false
    };

    if (customerId) {
      query.customerId = customerId;
    }

    if (options.startDate || options.endDate) {
      query.clearedDate = {};
      if (options.startDate) query.clearedDate.$gte = options.startDate;
      if (options.endDate) query.clearedDate.$lte = options.endDate;
    }

    const payments = await Payment.find(query);

    const results = {
      total: payments.length,
      reconciled: 0,
      failed: []
    };

    for (const payment of payments) {
      try {
        // Simple auto-reconciliation: if payment is fully applied and cleared
        if (payment.appliedAmount >= payment.amount && payment.settled) {
          await payment.reconcile(`AUTO-RECON-${Date.now()}`);
          results.reconciled++;
        }
      } catch (error) {
        results.failed.push({
          paymentNumber: payment.paymentNumber,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get reconciliation status
   */
  async getReconciliationStatus(customerId, options = {}) {
    const query = {};

    if (customerId) {
      query.customerId = customerId;
    }

    if (options.startDate || options.endDate) {
      query.settlementDate = {};
      if (options.startDate) query.settlementDate.$gte = options.startDate;
      if (options.endDate) query.settlementDate.$lte = options.endDate;
    }

    const settlements = await Settlement.find(query)
      .populate('customerId');

    const status = {
      total: settlements.length,
      reconciled: 0,
      pending: 0,
      failed: 0,
      totalAmount: 0,
      reconciledAmount: 0,
      pendingAmount: 0,
      settlements: []
    };

    for (const settlement of settlements) {
      status.totalAmount += settlement.netSettlement;

      if (settlement.reconciled) {
        status.reconciled++;
        status.reconciledAmount += settlement.netSettlement;
      } else if (settlement.status === 'completed') {
        status.pending++;
        status.pendingAmount += settlement.netSettlement;
      } else if (settlement.status === 'failed') {
        status.failed++;
      }

      status.settlements.push({
        settlementNumber: settlement.settlementNumber,
        customer: settlement.customerId?.name,
        date: settlement.settlementDate,
        netAmount: settlement.netSettlement,
        status: settlement.status,
        reconciled: settlement.reconciled
      });
    }

    return status;
  }

  /**
   * Get unreconciled items
   */
  async getUnreconciledItems(customerId) {
    const [payments, settlements] = await Promise.all([
      Payment.find({
        customerId,
        status: 'cleared',
        reconciled: false
      }),
      Settlement.getUnreconciledSettlements(customerId)
    ]);

    return {
      payments: {
        count: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
        items: payments
      },
      settlements: {
        count: settlements.length,
        totalAmount: settlements.reduce((sum, s) => sum + s.netSettlement, 0),
        items: settlements
      }
    };
  }

  /**
   * Generate GL posting for settlement
   */
  async generateGLPosting(settlementId) {
    const settlement = await Settlement.findById(settlementId)
      .populate('customerId');

    if (!settlement) throw new Error('Settlement not found');

    if (settlement.status !== 'completed') {
      throw new Error('Only completed settlements can be posted to GL');
    }

    // Generate GL document number
    const glDocument = await this._generateGLDocumentNumber();

    // Create GL entries
    const glEntries = [];

    // Debit: Accounts Receivable (for invoices)
    if (settlement.totalInvoices > 0) {
      glEntries.push({
        account: '1200', // A/R
        debit: settlement.totalInvoices,
        credit: 0,
        description: `Settlement ${settlement.settlementNumber} - Invoices`
      });
    }

    // Credit: Cash/Bank (for payments)
    if (settlement.totalPayments > 0) {
      glEntries.push({
        account: '1000', // Cash
        debit: 0,
        credit: settlement.totalPayments,
        description: `Settlement ${settlement.settlementNumber} - Payments`
      });
    }

    // Credit: Trade Spend (for deductions)
    if (settlement.totalDeductions > 0) {
      glEntries.push({
        account: '5100', // Trade Spend Expense
        debit: 0,
        credit: settlement.totalDeductions,
        description: `Settlement ${settlement.settlementNumber} - Deductions`
      });
    }

    await settlement.postToGL(glDocument);

    return {
      glDocument,
      glEntries,
      totalDebit: glEntries.reduce((sum, e) => sum + e.debit, 0),
      totalCredit: glEntries.reduce((sum, e) => sum + e.credit, 0),
      balanced: glEntries.reduce((sum, e) => sum + e.debit, 0) ===
                glEntries.reduce((sum, e) => sum + e.credit, 0)
    };
  }

  /**
   * Generate settlement number
   */
  async _generateSettlementNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const count = await Settlement.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });

    return `STL-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }

  /**
   * Generate GL document number
   */
  async _generateGLDocumentNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().substr(-4);

    return `GL-${year}${month}${day}-${timestamp}`;
  }
}

module.exports = new SettlementService();
