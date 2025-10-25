const express = require('express');
const router = express.Router();

const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Settlement = require('../models/Settlement');
const Dispute = require('../models/Dispute');
const Accrual = require('../models/Accrual');

const threeWayMatchingService = require('../services/threeWayMatchingService');
const accrualManagementService = require('../services/accrualManagementService');
const disputeManagementService = require('../services/disputeManagementService');
const settlementService = require('../services/settlementService');
const auditTrailService = require('../services/auditTrailService');

// Middleware (placeholder - implement authentication middleware)
const authenticate = (req, res, next) => {
  // TODO: Implement actual authentication
  req.user = { _id: 'user123', name: 'System User', email: 'system@tradeai.com', role: 'admin' };
  next();
};

// ================== PURCHASE ORDERS ==================

router.post('/purchase-orders', authenticate, async (req, res) => {
  try {
    const po = new PurchaseOrder({ ...req.body, createdBy: req.user._id });
    await po.save();
    await auditTrailService.logCreate('PurchaseOrder', po, req.user._id, req.user, req);
    res.status(201).json({ success: true, data: po });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/purchase-orders', authenticate, async (req, res) => {
  try {
    const { customerId, status } = req.query;
    const query = {};
    if (customerId) query.customerId = customerId;
    if (status) query.status = status;

    const pos = await PurchaseOrder.find(query)
      .populate('customerId')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: pos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/purchase-orders/:id', authenticate, async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('customerId');
    if (!po) return res.status(404).json({ success: false, error: 'PO not found' });
    res.json({ success: true, data: po });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== INVOICES ==================

router.post('/invoices', authenticate, async (req, res) => {
  try {
    const invoice = new Invoice({ ...req.body, createdBy: req.user._id });
    await invoice.save();
    await auditTrailService.logCreate('Invoice', invoice, req.user._id, req.user, req);
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/invoices', authenticate, async (req, res) => {
  try {
    const { customerId, status, matchStatus } = req.query;
    const query = {};
    if (customerId) query.customerId = customerId;
    if (status) query.status = status;
    if (matchStatus) query.matchStatus = matchStatus;

    const invoices = await Invoice.find(query)
      .populate('customerId')
      .populate('purchaseOrderId')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/invoices/:id/approve', authenticate, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    
    await invoice.approve(req.user._id);
    await auditTrailService.logApproval('Invoice', invoice, req.user._id, req.user, true, req);
    
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ================== PAYMENTS ==================

router.post('/payments', authenticate, async (req, res) => {
  try {
    const payment = new Payment({ ...req.body, createdBy: req.user._id });
    await payment.save();
    await auditTrailService.logCreate('Payment', payment, req.user._id, req.user, req);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/payments', authenticate, async (req, res) => {
  try {
    const { customerId, status } = req.query;
    const query = {};
    if (customerId) query.customerId = customerId;
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('customerId')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== 3-WAY MATCHING ==================

router.post('/matching/invoice-to-po', authenticate, async (req, res) => {
  try {
    const { invoiceId, purchaseOrderId } = req.body;
    const result = await threeWayMatchingService.matchInvoiceToPO(invoiceId, purchaseOrderId);
    
    if (result.matched) {
      const invoice = await Invoice.findById(invoiceId);
      await auditTrailService.logMatching('Invoice', invoice, 'PurchaseOrder', purchaseOrderId, result.confidence, req.user._id, req.user, req);
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/matching/payment-to-invoice', authenticate, async (req, res) => {
  try {
    const { paymentId, invoiceId, amount } = req.body;
    const result = await threeWayMatchingService.matchPaymentToInvoice(paymentId, invoiceId, amount);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/matching/3-way', authenticate, async (req, res) => {
  try {
    const { purchaseOrderId, invoiceId, paymentId } = req.body;
    const result = await threeWayMatchingService.complete3WayMatch(purchaseOrderId, invoiceId, paymentId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/matching/auto-match-payment/:paymentId', authenticate, async (req, res) => {
  try {
    const result = await threeWayMatchingService.autoMatchPayment(req.params.paymentId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/matching/batch-match-invoices', authenticate, async (req, res) => {
  try {
    const { customerId } = req.body;
    const result = await threeWayMatchingService.batchMatchInvoices(customerId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/matching/unmatched/:customerId', authenticate, async (req, res) => {
  try {
    const result = await threeWayMatchingService.getUnmatchedItems(req.params.customerId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== ACCRUALS ==================

router.post('/accruals/calculate', authenticate, async (req, res) => {
  try {
    const { tradeSpendId, period } = req.body;
    const accrual = await accrualManagementService.calculateTradeSpendAccrual(tradeSpendId, period);
    await auditTrailService.logCreate('Accrual', accrual, req.user._id, req.user, req);
    res.status(201).json({ success: true, data: accrual });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/accruals/update-actuals', authenticate, async (req, res) => {
  try {
    const { period } = req.body;
    const result = await accrualManagementService.updateAccrualsWithActuals(period);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/accruals/close-period', authenticate, async (req, res) => {
  try {
    const { year, month } = req.body;
    const result = await accrualManagementService.closePeriod(year, month, req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/accruals/:id/adjust', authenticate, async (req, res) => {
  try {
    const { adjustmentAmount, reason } = req.body;
    const accrual = await accrualManagementService.adjustAccrual(req.params.id, adjustmentAmount, reason, req.user._id);
    res.json({ success: true, data: accrual });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/accruals/variance-analysis', authenticate, async (req, res) => {
  try {
    const options = {
      customerId: req.query.customerId,
      accrualType: req.query.accrualType,
      period: req.query.period ? JSON.parse(req.query.period) : undefined
    };
    const analysis = await accrualManagementService.getVarianceAnalysis(options);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== DISPUTES ==================

router.post('/disputes/from-deduction', authenticate, async (req, res) => {
  try {
    const { deductionId, disputeData } = req.body;
    const dispute = await disputeManagementService.createDisputeFromDeduction(deductionId, disputeData, req.user._id);
    res.status(201).json({ success: true, data: dispute });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/disputes/:id/assign', authenticate, async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const dispute = await disputeManagementService.assignDispute(req.params.id, assignedTo, req.user._id);
    res.json({ success: true, data: dispute });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/disputes/:id/resolve', authenticate, async (req, res) => {
  try {
    const dispute = await disputeManagementService.resolveDispute(req.params.id, req.user._id, req.body);
    res.json({ success: true, data: dispute });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/disputes/analytics', authenticate, async (req, res) => {
  try {
    const options = {
      customerId: req.query.customerId,
      startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate) : undefined
    };
    const analytics = await disputeManagementService.getDisputeAnalytics(options);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== SETTLEMENTS ==================

router.post('/settlements', authenticate, async (req, res) => {
  try {
    const { customerId, periodStart, periodEnd } = req.body;
    const settlement = await settlementService.createSettlement(
      customerId,
      new Date(periodStart),
      new Date(periodEnd),
      req.user._id
    );
    await auditTrailService.logCreate('Settlement', settlement, req.user._id, req.user, req);
    res.status(201).json({ success: true, data: settlement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/settlements/:id/approve', authenticate, async (req, res) => {
  try {
    const settlement = await settlementService.approveSettlement(req.params.id, req.user._id);
    await auditTrailService.logApproval('Settlement', settlement, req.user._id, req.user, true, req);
    res.json({ success: true, data: settlement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/settlements/:id/process', authenticate, async (req, res) => {
  try {
    const result = await settlementService.processSettlement(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/settlements/:id/reconcile', authenticate, async (req, res) => {
  try {
    const settlement = await settlementService.reconcileWithBankStatement(req.params.id, req.body, req.user._id);
    res.json({ success: true, data: settlement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/settlements/reconciliation-status/:customerId', authenticate, async (req, res) => {
  try {
    const options = {
      startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate) : undefined
    };
    const status = await settlementService.getReconciliationStatus(req.params.customerId, options);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================== AUDIT TRAIL ==================

router.get('/audit/entity/:entityType/:entityId', authenticate, async (req, res) => {
  try {
    const options = {
      startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
      action: req.query.action,
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    const history = await auditTrailService.getEntityHistory(req.params.entityType, req.params.entityId, options);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/audit/user/:userId', authenticate, async (req, res) => {
  try {
    const options = {
      startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
      entityType: req.query.entityType,
      action: req.query.action,
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };
    const activity = await auditTrailService.getUserActivity(req.params.userId, options);
    res.json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/audit/statistics', authenticate, async (req, res) => {
  try {
    const options = {
      startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
      userId: req.query.userId,
      entityType: req.query.entityType
    };
    const stats = await auditTrailService.getAuditStatistics(options);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
