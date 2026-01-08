const express = require('express');
const router = express.Router();
const DataLineage = require('../models/DataLineage');
const BaselineConfig = require('../models/BaselineConfig');
const VarianceReasonCode = require('../models/VarianceReasonCode');
const ImportBatch = require('../models/ImportBatch');
const BaselineCalculationService = require('../services/baselineCalculationService');
const VarianceAnalysisService = require('../services/varianceAnalysisService');
const ReconciliationService = require('../services/reconciliationService');
const { authenticateToken } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenantIsolation');

router.use(authenticateToken);
router.use(requireTenant);

router.get('/entity/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const lineage = await DataLineage.findForEntity(req.tenantId, entityType, entityId);
    res.json({ success: true, data: lineage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/calculation-summary/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const summary = await DataLineage.getCalculationSummary(req.tenantId, entityType, entityId);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/overridden', async (req, res) => {
  try {
    const { entityType, startDate, endDate } = req.query;
    const options = {};
    if (entityType) options.entityType = entityType;
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    const overridden = await DataLineage.findOverridden(req.tenantId, options);
    res.json({ success: true, data: overridden });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/override', async (req, res) => {
  try {
    const { entityType, entityId, metricType, newValue, reason, reasonCodeId } = req.body;

    const lineage = await DataLineage.findOne({
      tenantId: req.tenantId,
      entityType,
      entityId,
      metricType
    });

    if (!lineage) {
      return res.status(404).json({ success: false, error: 'Lineage record not found' });
    }

    await lineage.override(newValue, req.user._id, reason, reasonCodeId);
    res.json({ success: true, data: lineage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/baseline-configs', async (req, res) => {
  try {
    const configs = await BaselineConfig.find({ tenantId: req.tenantId, isActive: true });
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/baseline-configs/default', async (req, res) => {
  try {
    const config = await BaselineConfig.getDefault(req.tenantId);
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/baseline-configs', async (req, res) => {
  try {
    const config = new BaselineConfig({
      ...req.body,
      tenantId: req.tenantId,
      createdBy: req.user._id
    });
    await config.save();
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/baseline-configs/:id', async (req, res) => {
  try {
    const config = await BaselineConfig.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { ...req.body, updatedBy: req.user._id },
      { new: true }
    );
    if (!config) {
      return res.status(404).json({ success: false, error: 'Config not found' });
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/baseline-configs/:id/set-default', async (req, res) => {
  try {
    const config = await BaselineConfig.setDefault(req.tenantId, req.params.id);
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/variance-reason-codes', async (req, res) => {
  try {
    const { category, entityType } = req.query;
    let codes;

    if (category) {
      codes = await VarianceReasonCode.findByCategory(req.tenantId, category);
    } else if (entityType) {
      codes = await VarianceReasonCode.findForEntity(req.tenantId, entityType);
    } else {
      codes = await VarianceReasonCode.find({ tenantId: req.tenantId, isActive: true });
    }

    res.json({ success: true, data: codes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/variance-reason-codes', async (req, res) => {
  try {
    const code = new VarianceReasonCode({
      ...req.body,
      tenantId: req.tenantId,
      createdBy: req.user._id
    });
    await code.save();
    res.status(201).json({ success: true, data: code });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/variance-reason-codes/seed-defaults', async (req, res) => {
  try {
    await VarianceReasonCode.seedDefaults(req.tenantId, req.user._id);
    const codes = await VarianceReasonCode.find({ tenantId: req.tenantId, isSystemDefined: true });
    res.json({ success: true, data: codes, message: 'Default reason codes seeded' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/import-batches', async (req, res) => {
  try {
    const { entityType, status, limit } = req.query;
    const options = {};
    if (status) options.status = status;
    if (limit) options.limit = parseInt(limit);

    let batches;
    if (entityType) {
      batches = await ImportBatch.findByEntity(req.tenantId, entityType, options);
    } else {
      batches = await ImportBatch.getRecentBatches(req.tenantId);
    }

    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/import-batches/:id', async (req, res) => {
  try {
    const batch = await ImportBatch.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate('uploadedBy', 'firstName lastName email');
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Import batch not found' });
    }
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/calculate-baseline/:promotionId', async (req, res) => {
  try {
    const Promotion = require('../models/Promotion');
    const promotion = await Promotion.findOne({ _id: req.params.promotionId, company: req.tenantId });

    if (!promotion) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }

    const service = new BaselineCalculationService(req.tenantId);
    const configId = req.body.baselineConfigId;
    let config = null;

    if (configId) {
      config = await BaselineConfig.findById(configId);
    }

    const result = await service.calculateBaseline(promotion, config);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/calculate-uplift/:promotionId', async (req, res) => {
  try {
    const Promotion = require('../models/Promotion');
    const SalesTransaction = require('../models/SalesTransaction');

    const promotion = await Promotion.findOne({ _id: req.params.promotionId, company: req.tenantId });
    if (!promotion) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }

    const actualSales = await SalesTransaction.find({
      company: req.tenantId,
      promotion: promotion._id,
      status: 'completed'
    });

    const service = new BaselineCalculationService(req.tenantId);
    const result = await service.calculateUplift(promotion, actualSales);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/calculate-roi/:promotionId', async (req, res) => {
  try {
    const Promotion = require('../models/Promotion');
    const promotion = await Promotion.findOne({ _id: req.params.promotionId, company: req.tenantId });

    if (!promotion) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }

    const costs = promotion.financial?.costs || req.body.costs || {};
    const revenue = {
      incremental: promotion.financial?.actual?.incrementalRevenue || req.body.incrementalRevenue || 0
    };

    const service = new BaselineCalculationService(req.tenantId);
    const result = await service.calculateROI(promotion, costs, revenue);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analyze-variance/promotion/:promotionId', async (req, res) => {
  try {
    const Promotion = require('../models/Promotion');
    const promotion = await Promotion.findOne({ _id: req.params.promotionId, company: req.tenantId });

    if (!promotion) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }

    const service = new VarianceAnalysisService(req.tenantId);
    const result = await service.analyzePromotionVariance(promotion);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analyze-variance/budget/:budgetId', async (req, res) => {
  try {
    const Budget = require('../models/Budget');
    const budget = await Budget.findOne({ _id: req.params.budgetId, company: req.tenantId });

    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }

    const service = new VarianceAnalysisService(req.tenantId);
    const result = await service.analyzeBudgetVariance(budget);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analyze-variance/trade-spend/:tradeSpendId', async (req, res) => {
  try {
    const TradeSpend = require('../models/TradeSpend');
    const tradeSpend = await TradeSpend.findOne({ _id: req.params.tradeSpendId, company: req.tenantId });

    if (!tradeSpend) {
      return res.status(404).json({ success: false, error: 'Trade spend not found' });
    }

    const service = new VarianceAnalysisService(req.tenantId);
    const result = await service.analyzeTradeSpendVariance(tradeSpend);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tag-variance', async (req, res) => {
  try {
    const { entityType, entityId, metricType, reasonCodeId, notes } = req.body;

    const service = new VarianceAnalysisService(req.tenantId);
    const result = await service.tagVariance(entityType, entityId, metricType, reasonCodeId, notes, req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/variance-report', async (req, res) => {
  try {
    const { entityType, startDate, endDate, hasReasonCode } = req.query;

    const service = new VarianceAnalysisService(req.tenantId);
    const result = await service.getVarianceReport(
      entityType,
      new Date(startDate),
      new Date(endDate),
      { hasReasonCode: hasReasonCode === 'true' }
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reconciliation/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const period = {};
    if (startDate) period.startDate = new Date(startDate);
    if (endDate) period.endDate = new Date(endDate);

    const service = new ReconciliationService(req.tenantId);
    const result = await service.getReconciliationDashboard(period);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reconciliation/match-deduction', async (req, res) => {
  try {
    const { deductionId, claimId, matchedAmount } = req.body;

    const service = new ReconciliationService(req.tenantId);
    const result = await service.matchDeductionToClaim(deductionId, claimId, matchedAmount, req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reconciliation/auto-match', async (req, res) => {
  try {
    const service = new ReconciliationService(req.tenantId);
    const result = await service.autoMatchDeductions(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reconciliation/create-settlement', async (req, res) => {
  try {
    const { customerId, periodStart, periodEnd } = req.body;

    const service = new ReconciliationService(req.tenantId);
    const result = await service.createSettlement(
      customerId,
      new Date(periodStart),
      new Date(periodEnd),
      req.user._id
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reconciliation/export', async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;
    const period = {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    };

    const service = new ReconciliationService(req.tenantId);
    const result = await service.exportReconciliationReport(period, format || 'csv');

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=reconciliation-report-${startDate}-${endDate}.csv`);
      res.send(result);
    } else {
      res.json({ success: true, data: result });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
