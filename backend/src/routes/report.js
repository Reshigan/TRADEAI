const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const reportController = require('../controllers/reportController');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// CRUD Routes for Report entities
router.post('/reports', authenticateToken, reportController.createReport);
router.get('/reports', authenticateToken, reportController.getReports);
router.get('/reports/:id', authenticateToken, reportController.getReport);
router.put('/reports/:id', authenticateToken, reportController.updateReport);
router.delete('/reports/:id', authenticateToken, reportController.deleteReport);

// Get all available report types
router.get('/', authenticateToken, asyncHandler((req, res) => {
  res.json({
    success: true,
    data: {
      availableReports: [
        { id: 'promotion-effectiveness', name: 'Promotion Effectiveness Report', endpoint: '/api/reports/promotion-effectiveness' },
        { id: 'budget-utilization', name: 'Budget Utilization Report', endpoint: '/api/reports/budget-utilization' },
        { id: 'customer-performance', name: 'Customer Performance Report', endpoint: '/api/reports/customer-performance' },
        { id: 'trade-spend-analysis', name: 'Trade Spend Analysis Report', endpoint: '/api/reports/trade-spend-analysis' }
      ]
    }
  });
}));

// Generate promotion effectiveness report
router.get('/promotion-effectiveness', authenticateToken, asyncHandler(async (req, res) => {
  const { promotionId, startDate, endDate } = req.query;

  if (!promotionId) {
    throw new AppError('Promotion ID is required', 400);
  }

  const report = await reportController.generatePromotionEffectivenessReport({
    promotionId,
    startDate,
    endDate
  });

  res.json({
    success: true,
    data: report
  });
}));

// Generate budget utilization report
router.get('/budget-utilization', authenticateToken, asyncHandler(async (req, res) => {
  const { budgetId, year, quarter } = req.query;

  const report = await reportController.generateBudgetUtilizationReport({
    budgetId,
    year: year ? parseInt(year) : new Date().getFullYear(),
    quarter
  });

  res.json({
    success: true,
    data: report
  });
}));

// Generate customer performance report
router.get('/customer-performance', authenticateToken, asyncHandler(async (req, res) => {
  const { customerId, startDate, endDate } = req.query;

  const report = await reportController.generateCustomerPerformanceReport({
    customerId,
    startDate,
    endDate,
    tenantId: req.tenant?.id
  });

  res.json({
    success: true,
    data: report
  });
}));

// Generate product performance report
router.get('/product-performance', authenticateToken, asyncHandler(async (req, res) => {
  const { productId, startDate, endDate } = req.query;

  const report = await reportController.generateProductPerformanceReport({
    productId,
    startDate,
    endDate
  });

  res.json({
    success: true,
    data: report
  });
}));

// Generate trade spend ROI report
router.get('/trade-spend-roi', authenticateToken, asyncHandler(async (req, res) => {
  const { startDate, endDate, customerId, vendorId } = req.query;

  const report = await reportController.generateTradeSpendROIReport({
    startDate,
    endDate,
    customerId,
    vendorId
  });

  res.json({
    success: true,
    data: report
  });
}));

// Generate report from template
router.post('/generate', authenticateToken, asyncHandler(async (req, res) => {
  const { template_id, filters } = req.body;
  const tenantId = req.user.company;

  // Map template IDs to report generation logic
  const templateHandlers = {
    'promotion_summary': () => reportController.generatePromotionEffectivenessReport({ tenantId, ...filters }),
    'budget_utilization': () => reportController.generateBudgetUtilizationReport({ tenantId, year: new Date().getFullYear(), ...filters }),
    'roi_analysis': () => reportController.generateTradeSpendROIReport({ tenantId, ...filters }),
    'trade_spend_by_customer': () => reportController.generateTradeSpendROIReport({ tenantId, ...filters }),
    'deduction_aging': () => reportController.generateCustomerPerformanceReport({ tenantId, ...filters }),
    'claim_status': () => reportController.generateCustomerPerformanceReport({ tenantId, ...filters }),
    'pnl_by_promotion': () => reportController.generatePromotionEffectivenessReport({ tenantId, ...filters }),
    'accrual_report': () => reportController.generateBudgetUtilizationReport({ tenantId, year: new Date().getFullYear(), ...filters }),
  };

  const handler = templateHandlers[template_id];
  if (!handler) {
    throw new AppError(`Unknown report template: ${template_id}`, 400);
  }

  const report = await handler();

  res.json({
    success: true,
    data: {
      id: `rpt-${Date.now()}`,
      template_id,
      name: template_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      created_at: new Date().toISOString(),
      status: 'completed',
      report
    }
  });
}));

// Export report as Excel
router.post('/export', authenticateToken, asyncHandler(async (req, res) => {
  const { reportType, filters, format = 'xlsx' } = req.body;

  if (!reportType) {
    throw new AppError('Report type is required', 400);
  }

  const exportData = await reportController.exportReport({
    reportType,
    filters,
    format
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report-${Date.now()}.${format}`);
  res.send(exportData);
}));

// Schedule report
router.post('/schedule', authenticateToken, asyncHandler(async (req, res) => {
  const { reportType, filters, schedule, recipients } = req.body;

  const scheduledReport = await reportController.scheduleReport({
    reportType,
    filters,
    schedule,
    recipients,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    data: scheduledReport
  });
}));

module.exports = router;
