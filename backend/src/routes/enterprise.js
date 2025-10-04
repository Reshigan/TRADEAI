const express = require('express');
const router = express.Router();
const { authenticateToken: auth, authorize } = require('../middleware/auth');

// Controllers
const enterpriseDashboardController = require('../controllers/enterpriseDashboardController');
const transactionController = require('../controllers/transactionController');
const simulationController = require('../controllers/simulationController');
const reportingController = require('../controllers/reportingController');

/**
 * ENTERPRISE ROUTES
 * Advanced enterprise-level endpoints for dashboards, simulations, transactions, and reporting
 */

// =====================================================
// EXECUTIVE DASHBOARDS
// =====================================================

/**
 * @route   GET /api/enterprise/dashboards/executive
 * @desc    Get comprehensive executive dashboard
 * @access  Private (Executive, Admin)
 */
router.get(
  '/dashboards/executive',
  auth,
  authorize(['superadmin', 'admin', 'executive']),
  enterpriseDashboardController.getExecutiveDashboard
);

/**
 * @route   GET /api/enterprise/dashboards/kpis/realtime
 * @desc    Get real-time KPI metrics
 * @access  Private
 */
router.get(
  '/dashboards/kpis/realtime',
  auth,
  enterpriseDashboardController.getRealTimeKPIs
);

/**
 * @route   POST /api/enterprise/dashboards/drilldown
 * @desc    Get drill-down data for specific metric
 * @access  Private
 */
router.post(
  '/dashboards/drilldown',
  auth,
  enterpriseDashboardController.getDrillDownData
);

// =====================================================
// OPERATIONAL DASHBOARDS
// =====================================================

/**
 * @route   GET /api/enterprise/dashboards/trade-spend
 * @desc    Get trade spend tracking dashboard
 * @access  Private
 */
router.get(
  '/dashboards/trade-spend',
  auth,
  authorize(['superadmin', 'admin', 'finance', 'trade_marketing']),
  enterpriseDashboardController.getTradeSpendDashboard
);

/**
 * @route   GET /api/enterprise/dashboards/promotions
 * @desc    Get promotion performance dashboard
 * @access  Private
 */
router.get(
  '/dashboards/promotions',
  auth,
  enterpriseDashboardController.getPromotionDashboard
);

/**
 * @route   GET /api/enterprise/dashboards/budget
 * @desc    Get budget utilization dashboard
 * @access  Private
 */
router.get(
  '/dashboards/budget',
  auth,
  authorize(['superadmin', 'admin', 'finance']),
  enterpriseDashboardController.getBudgetDashboard
);

// =====================================================
// ANALYTICS DASHBOARDS
// =====================================================

/**
 * @route   GET /api/enterprise/dashboards/sales-performance
 * @desc    Get sales performance dashboard
 * @access  Private
 */
router.get(
  '/dashboards/sales-performance',
  auth,
  enterpriseDashboardController.getSalesPerformanceDashboard
);

/**
 * @route   GET /api/enterprise/dashboards/customer-analytics
 * @desc    Get customer analytics dashboard
 * @access  Private
 */
router.get(
  '/dashboards/customer-analytics',
  auth,
  enterpriseDashboardController.getCustomerAnalyticsDashboard
);

/**
 * @route   GET /api/enterprise/dashboards/product-analytics
 * @desc    Get product analytics dashboard
 * @access  Private
 */
router.get(
  '/dashboards/product-analytics',
  auth,
  enterpriseDashboardController.getProductAnalyticsDashboard
);

// =====================================================
// SIMULATION ENGINE
// =====================================================

/**
 * @route   POST /api/enterprise/simulations/promotion-impact
 * @desc    Simulate promotion impact
 * @access  Private
 */
router.post(
  '/simulations/promotion-impact',
  auth,
  authorize(['superadmin', 'admin', 'marketing', 'trade_marketing']),
  simulationController.simulatePromotionImpact
);

/**
 * @route   POST /api/enterprise/simulations/budget-allocation
 * @desc    Simulate budget allocation scenarios
 * @access  Private
 */
router.post(
  '/simulations/budget-allocation',
  auth,
  authorize(['superadmin', 'admin', 'finance']),
  simulationController.simulateBudgetAllocation
);

/**
 * @route   POST /api/enterprise/simulations/pricing-strategy
 * @desc    Simulate pricing strategy impact
 * @access  Private
 */
router.post(
  '/simulations/pricing-strategy',
  auth,
  authorize(['superadmin', 'admin', 'pricing']),
  simulationController.simulatePricingStrategy
);

/**
 * @route   POST /api/enterprise/simulations/volume-projection
 * @desc    Project sales volumes
 * @access  Private
 */
router.post(
  '/simulations/volume-projection',
  auth,
  simulationController.simulateVolumeProjection
);

/**
 * @route   POST /api/enterprise/simulations/market-share
 * @desc    Simulate market share scenarios
 * @access  Private
 */
router.post(
  '/simulations/market-share',
  auth,
  authorize(['superadmin', 'admin', 'executive']),
  simulationController.simulateMarketShare
);

/**
 * @route   POST /api/enterprise/simulations/roi-optimization
 * @desc    Optimize ROI across activities
 * @access  Private
 */
router.post(
  '/simulations/roi-optimization',
  auth,
  authorize(['superadmin', 'admin', 'finance']),
  simulationController.simulateROIOptimization
);

/**
 * @route   POST /api/enterprise/simulations/what-if
 * @desc    Perform what-if analysis
 * @access  Private
 */
router.post(
  '/simulations/what-if',
  auth,
  simulationController.whatIfAnalysis
);

/**
 * @route   POST /api/enterprise/simulations/compare
 * @desc    Compare multiple scenarios
 * @access  Private
 */
router.post(
  '/simulations/compare',
  auth,
  simulationController.compareScenarios
);

/**
 * @route   GET /api/enterprise/simulations/saved
 * @desc    Get saved simulations
 * @access  Private
 */
router.get(
  '/simulations/saved',
  auth,
  simulationController.getSavedSimulations
);

/**
 * @route   POST /api/enterprise/simulations/save
 * @desc    Save simulation scenario
 * @access  Private
 */
router.post(
  '/simulations/save',
  auth,
  simulationController.saveSimulation
);

// =====================================================
// TRANSACTION MANAGEMENT
// =====================================================

/**
 * @route   POST /api/enterprise/transactions
 * @desc    Create new transaction
 * @access  Private
 */
router.post(
  '/transactions',
  auth,
  transactionController.createTransaction
);

/**
 * @route   GET /api/enterprise/transactions
 * @desc    Get transactions with advanced filtering
 * @access  Private
 */
router.get(
  '/transactions',
  auth,
  transactionController.getTransactions
);

/**
 * @route   GET /api/enterprise/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 */
router.get(
  '/transactions/:id',
  auth,
  transactionController.getTransactionById
);

/**
 * @route   PUT /api/enterprise/transactions/:id
 * @desc    Update transaction
 * @access  Private
 */
router.put(
  '/transactions/:id',
  auth,
  transactionController.updateTransaction
);

/**
 * @route   DELETE /api/enterprise/transactions/:id
 * @desc    Delete transaction
 * @access  Private
 */
router.delete(
  '/transactions/:id',
  auth,
  authorize(['superadmin', 'admin']),
  transactionController.deleteTransaction
);

/**
 * @route   POST /api/enterprise/transactions/:id/approve
 * @desc    Approve transaction
 * @access  Private
 */
router.post(
  '/transactions/:id/approve',
  auth,
  transactionController.approveTransaction
);

/**
 * @route   POST /api/enterprise/transactions/:id/reject
 * @desc    Reject transaction
 * @access  Private
 */
router.post(
  '/transactions/:id/reject',
  auth,
  transactionController.rejectTransaction
);

/**
 * @route   POST /api/enterprise/transactions/:id/settle
 * @desc    Settle transaction
 * @access  Private
 */
router.post(
  '/transactions/:id/settle',
  auth,
  authorize(['superadmin', 'admin', 'finance']),
  transactionController.settleTransaction
);

/**
 * @route   GET /api/enterprise/transactions/pending-approvals
 * @desc    Get pending approvals for current user
 * @access  Private
 */
router.get(
  '/transactions/pending-approvals',
  auth,
  transactionController.getPendingApprovals
);

/**
 * @route   POST /api/enterprise/transactions/bulk-approve
 * @desc    Bulk approve transactions
 * @access  Private
 */
router.post(
  '/transactions/bulk-approve',
  auth,
  transactionController.bulkApprove
);

// =====================================================
// ADVANCED REPORTING
// =====================================================

/**
 * @route   GET /api/enterprise/reports/custom
 * @desc    Generate custom report
 * @access  Private
 */
router.get(
  '/reports/custom',
  auth,
  reportingController.generateCustomReport
);

/**
 * @route   POST /api/enterprise/reports/schedule
 * @desc    Schedule report generation
 * @access  Private
 */
router.post(
  '/reports/schedule',
  auth,
  reportingController.scheduleReport
);

/**
 * @route   GET /api/enterprise/reports/scheduled
 * @desc    Get scheduled reports
 * @access  Private
 */
router.get(
  '/reports/scheduled',
  auth,
  reportingController.getScheduledReports
);

/**
 * @route   POST /api/enterprise/reports/export
 * @desc    Export data in various formats
 * @access  Private
 */
router.post(
  '/reports/export',
  auth,
  reportingController.exportData
);

/**
 * @route   GET /api/enterprise/reports/templates
 * @desc    Get report templates
 * @access  Private
 */
router.get(
  '/reports/templates',
  auth,
  reportingController.getReportTemplates
);

// =====================================================
// DATA MANAGEMENT (CRUD)
// =====================================================

/**
 * @route   POST /api/enterprise/data/:entity/bulk-create
 * @desc    Bulk create records
 * @access  Private
 */
router.post(
  '/data/:entity/bulk-create',
  auth,
  authorize(['superadmin', 'admin']),
  async (req, res, next) => {
    // Generic bulk create endpoint
    try {
      const { entity } = req.params;
      const { records } = req.body;
      
      const Model = require(`../models/${entity.charAt(0).toUpperCase() + entity.slice(1)}`);
      const EnterpriseCrudService = require('../services/enterpriseCrudService');
      const crudService = new EnterpriseCrudService(Model);
      
      const result = await crudService.bulkCreate(records, {
        validate: true,
        auditLog: true,
        userId: req.user._id
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/enterprise/data/:entity/import
 * @desc    Import data from file
 * @access  Private
 */
router.post(
  '/data/:entity/import',
  auth,
  authorize(['superadmin', 'admin']),
  async (req, res, next) => {
    // Generic import endpoint
    // Implementation would handle file upload and processing
    res.json({
      success: true,
      message: 'Import feature - implementation pending'
    });
  }
);

/**
 * @route   POST /api/enterprise/data/:entity/export
 * @desc    Export data to file
 * @access  Private
 */
router.post(
  '/data/:entity/export',
  auth,
  async (req, res, next) => {
    try {
      const { entity } = req.params;
      const { format = 'csv', filters = {}, fields = [] } = req.body;
      
      const Model = require(`../models/${entity.charAt(0).toUpperCase() + entity.slice(1)}`);
      const EnterpriseCrudService = require('../services/enterpriseCrudService');
      const crudService = new EnterpriseCrudService(Model);
      
      let exportData;
      
      switch(format) {
        case 'csv':
          exportData = await crudService.exportToCSV(filters, fields);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename=${entity}-export.csv`);
          break;
        case 'excel':
          exportData = await crudService.exportToExcel(filters, fields);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename=${entity}-export.xlsx`);
          break;
        case 'json':
          exportData = await crudService.exportToJSON(filters, fields);
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename=${entity}-export.json`);
          break;
        default:
          throw new Error('Unsupported export format');
      }
      
      res.send(exportData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/enterprise/data/:entity/search
 * @desc    Advanced search with facets
 * @access  Private
 */
router.post(
  '/data/:entity/search',
  auth,
  async (req, res, next) => {
    try {
      const { entity } = req.params;
      const { filters = {}, facets = [] } = req.body;
      
      const Model = require(`../models/${entity.charAt(0).toUpperCase() + entity.slice(1)}`);
      const EnterpriseCrudService = require('../services/enterpriseCrudService');
      const crudService = new EnterpriseCrudService(Model);
      
      const result = await crudService.facetedSearch(filters, facets);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/enterprise/data/:entity/duplicates
 * @desc    Find duplicate records
 * @access  Private
 */
router.get(
  '/data/:entity/duplicates',
  auth,
  authorize(['superadmin', 'admin']),
  async (req, res, next) => {
    try {
      const { entity } = req.params;
      const { fields } = req.query;
      
      const Model = require(`../models/${entity.charAt(0).toUpperCase() + entity.slice(1)}`);
      const EnterpriseCrudService = require('../services/enterpriseCrudService');
      const crudService = new EnterpriseCrudService(Model);
      
      const duplicates = await crudService.findDuplicates(fields.split(','));
      
      res.json({
        success: true,
        data: duplicates
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
