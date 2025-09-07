const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const reportController = require('../controllers/reportController');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

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
    endDate
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