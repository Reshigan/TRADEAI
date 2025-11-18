/**
 * Advanced Analytics API Routes
 * Phase 2 Features - Enterprise Business Intelligence
 *
 * Endpoints for:
 * - Accrual management & reconciliation
 * - Budget variance analysis & forecasting
 * - Promotion ROI & effectiveness
 * - Customer segmentation (ABC, RFM)
 */

const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../../middleware/auth');
const { catchAsync } = require('../../middleware/errorHandler');
const advancedAccrualService = require('../services/advancedAccrualService');
const advancedBudgetService = require('../services/advancedBudgetService');
const advancedPromotionService = require('../services/advancedPromotionService');
const customerSegmentationService = require('../services/customerSegmentationService');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACCRUAL MANAGEMENT ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// POST /api/advanced/accruals/calculate - Calculate monthly accruals
router.post('/accruals/calculate',
  protect,
  restrictTo('manager', 'admin'),
  catchAsync(async (req, res) => {
    const { year, month, tenant, calculateBy } = req.body;

    const results = await advancedAccrualService.calculateMonthlyAccruals({
      year: parseInt(year),
      month: parseInt(month),
      tenant,
      calculateBy,
      userId: req.user._id
    });

    res.status(200).json({ success: true, data: results });
  })
);

// POST /api/advanced/accruals/:id/reconcile - Reconcile with actuals
router.post('/accruals/:id/reconcile',
  protect,
  restrictTo('manager', 'admin'),
  catchAsync(async (req, res) => {
    const accrual = await advancedAccrualService.reconcileAccruals(
      req.params.id,
      parseFloat(req.body.actualAmount),
      req.user._id
    );
    res.status(200).json({ success: true, data: accrual });
  })
);

// GET /api/advanced/accruals/:id/journal-entries - Generate GL entries
router.get('/accruals/:id/journal-entries',
  protect,
  restrictTo('manager', 'admin'),
  catchAsync(async (req, res) => {
    const entries = await advancedAccrualService.generateJournalEntries(req.params.id);
    res.status(200).json({ success: true, data: entries });
  })
);

// POST /api/advanced/accruals/:id/post - Post to GL
router.post('/accruals/:id/post',
  protect,
  restrictTo('admin'),
  catchAsync(async (req, res) => {
    const accrual = await advancedAccrualService.postAccrual(
      req.params.id,
      req.body.glDocument,
      req.user._id
    );
    res.status(200).json({ success: true, data: accrual });
  })
);

// POST /api/advanced/accruals/variance-report - Variance report
router.post('/accruals/variance-report',
  protect,
  restrictTo('manager', 'admin', 'analyst'),
  catchAsync(async (req, res) => {
    const report = await advancedAccrualService.generateVarianceReport(req.body);
    res.status(200).json({ success: true, data: report });
  })
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUDGET ANALYSIS ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// POST /api/advanced/budgets/variance-analysis - Full variance analysis
router.post('/budgets/variance-analysis',
  protect,
  catchAsync(async (req, res) => {
    const analysis = await advancedBudgetService.calculateVarianceAnalysis(req.body);
    res.status(200).json({ success: true, data: analysis });
  })
);

// POST /api/advanced/budgets/hierarchy - Create parent-child budgets
router.post('/budgets/hierarchy',
  protect,
  restrictTo('manager', 'admin'),
  catchAsync(async (req, res) => {
    const hierarchy = await advancedBudgetService.createBudgetHierarchy({
      ...req.body,
      userId: req.user._id
    });
    res.status(201).json({ success: true, data: hierarchy });
  })
);

// POST /api/advanced/budgets/scenario-analysis - What-if scenarios
router.post('/budgets/scenario-analysis',
  protect,
  restrictTo('manager', 'admin', 'analyst'),
  catchAsync(async (req, res) => {
    const results = await advancedBudgetService.scenarioAnalysis(req.body);
    res.status(200).json({ success: true, data: results });
  })
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROMOTION ANALYTICS ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET /api/advanced/promotions/:id/roi - Calculate ROI
router.get('/promotions/:id/roi',
  protect,
  catchAsync(async (req, res) => {
    const roi = await advancedPromotionService.calculatePromotionROI(req.params.id);
    res.status(200).json({ success: true, data: roi });
  })
);

// POST /api/advanced/promotions/compare - Compare multiple promotions
router.post('/promotions/compare',
  protect,
  catchAsync(async (req, res) => {
    const comparison = await advancedPromotionService.comparePromotions(req.body.promotionIds);
    res.status(200).json({ success: true, data: comparison });
  })
);

// POST /api/advanced/promotions/:id/create-template - Save as template
router.post('/promotions/:id/create-template',
  protect,
  restrictTo('manager', 'admin'),
  catchAsync(async (req, res) => {
    const template = await advancedPromotionService.createPromotionTemplate(
      req.params.id,
      req.body.templateName
    );
    res.status(201).json({ success: true, data: template });
  })
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CUSTOMER SEGMENTATION ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// POST /api/advanced/customers/abc-analysis - ABC Analysis (Pareto)
router.post('/customers/abc-analysis',
  protect,
  restrictTo('manager', 'admin', 'analyst'),
  catchAsync(async (req, res) => {
    const analysis = await customerSegmentationService.performABCAnalysis(req.body);
    res.status(200).json({ success: true, data: analysis });
  })
);

// POST /api/advanced/customers/rfm-analysis - RFM Segmentation
router.post('/customers/rfm-analysis',
  protect,
  restrictTo('manager', 'admin', 'analyst'),
  catchAsync(async (req, res) => {
    const analysis = await customerSegmentationService.performRFMAnalysis(req.body);
    res.status(200).json({ success: true, data: analysis });
  })
);

// GET /api/advanced/customers/:id/ltv - Customer lifetime value
router.get('/customers/:id/ltv',
  protect,
  catchAsync(async (req, res) => {
    const ltv = await customerSegmentationService.calculateCustomerLTV(req.params.id);
    res.status(200).json({ success: true, data: ltv });
  })
);

// POST /api/advanced/customers/churn-prediction - Predict churn
router.post('/customers/churn-prediction',
  protect,
  restrictTo('manager', 'admin', 'analyst'),
  catchAsync(async (req, res) => {
    const predictions = await customerSegmentationService.predictChurn(req.body.tenant);
    res.status(200).json({ success: true, data: predictions });
  })
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HEALTH & DOCUMENTATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// GET /api/advanced/health - Service health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Advanced Analytics API',
    version: '2.0.0',
    phase: 'Phase 2 - Production Ready',
    timestamp: new Date(),
    features: {
      accruals: {
        endpoints: 5,
        capabilities: [
          'Auto-calculation from promotions & trade spend',
          'Accrual vs actual reconciliation',
          'GL journal entry generation',
          'Variance reporting'
        ]
      },
      budgets: {
        endpoints: 3,
        capabilities: [
          'Variance analysis with forecasting',
          'Budget hierarchy (parent-child)',
          'What-if scenario modeling',
          'Automated alerts'
        ]
      },
      promotions: {
        endpoints: 3,
        capabilities: [
          'ROI calculation with lift analysis',
          'Multi-promotion comparison',
          'Effectiveness scoring (A-F)',
          'Template creation'
        ]
      },
      customers: {
        endpoints: 4,
        capabilities: [
          'ABC Analysis (Pareto 80/20)',
          'RFM Segmentation (10 segments)',
          'Customer lifetime value',
          'Churn prediction'
        ]
      }
    }
  });
});

// GET /api/advanced/docs - API documentation
router.get('/docs', (req, res) => {
  res.status(200).json({
    success: true,
    api: 'Advanced Analytics',
    baseUrl: '/api/advanced',
    endpoints: [
      {
        category: 'Accruals',
        routes: [
          { method: 'POST', path: '/accruals/calculate', auth: 'manager/admin', description: 'Calculate monthly accruals' },
          { method: 'POST', path: '/accruals/:id/reconcile', auth: 'manager/admin', description: 'Reconcile with actuals' },
          { method: 'GET', path: '/accruals/:id/journal-entries', auth: 'manager/admin', description: 'Generate GL entries' },
          { method: 'POST', path: '/accruals/:id/post', auth: 'admin', description: 'Post to GL' },
          { method: 'POST', path: '/accruals/variance-report', auth: 'manager/admin/analyst', description: 'Variance report' }
        ]
      },
      {
        category: 'Budgets',
        routes: [
          { method: 'POST', path: '/budgets/variance-analysis', auth: 'all', description: 'Full variance analysis' },
          { method: 'POST', path: '/budgets/hierarchy', auth: 'manager/admin', description: 'Create budget hierarchy' },
          { method: 'POST', path: '/budgets/scenario-analysis', auth: 'manager/admin/analyst', description: 'What-if scenarios' }
        ]
      },
      {
        category: 'Promotions',
        routes: [
          { method: 'GET', path: '/promotions/:id/roi', auth: 'all', description: 'Calculate ROI' },
          { method: 'POST', path: '/promotions/compare', auth: 'all', description: 'Compare promotions' },
          { method: 'POST', path: '/promotions/:id/create-template', auth: 'manager/admin', description: 'Create template' }
        ]
      },
      {
        category: 'Customers',
        routes: [
          { method: 'POST', path: '/customers/abc-analysis', auth: 'manager/admin/analyst', description: 'ABC Analysis' },
          { method: 'POST', path: '/customers/rfm-analysis', auth: 'manager/admin/analyst', description: 'RFM Segmentation' },
          { method: 'GET', path: '/customers/:id/ltv', auth: 'all', description: 'Lifetime value' },
          { method: 'POST', path: '/customers/churn-prediction', auth: 'manager/admin/analyst', description: 'Predict churn' }
        ]
      }
    ]
  });
});

module.exports = router;
