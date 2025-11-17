const express = require('express');
const router = express.Router();
const enterpriseBudgetController = require('../controllers/enterpriseBudgetController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { _validateRequest } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/enterprise-budget/scenarios
 * @desc    Create budget scenario for what-if analysis
 * @access  Private (Manager+)
 */
router.post('/scenarios',
  authorize('manager', 'director', 'admin'),
  enterpriseBudgetController.createScenario
);

/**
 * @route   POST /api/enterprise-budget/scenarios/compare
 * @desc    Compare multiple budget scenarios
 * @access  Private (Manager+)
 */
router.post('/scenarios/compare',
  authorize('manager', 'director', 'admin'),
  enterpriseBudgetController.compareScenarios
);

/**
 * @route   POST /api/enterprise-budget/:budgetId/variance
 * @desc    Analyze budget variance
 * @access  Private (Manager+)
 */
router.post('/:budgetId/variance',
  authorize('manager', 'director', 'admin'),
  enterpriseBudgetController.analyzeVariance
);

/**
 * @route   POST /api/enterprise-budget/multi-year-plan
 * @desc    Create multi-year budget plan
 * @access  Private (Director+)
 */
router.post('/multi-year-plan',
  authorize('director', 'admin'),
  enterpriseBudgetController.createMultiYearPlan
);

/**
 * @route   POST /api/enterprise-budget/optimize
 * @desc    Optimize budget allocation using AI
 * @access  Private (Manager+)
 */
router.post('/optimize',
  authorize('manager', 'director', 'admin'),
  enterpriseBudgetController.optimizeBudgetAllocation
);

/**
 * @route   POST /api/enterprise-budget/:budgetId/workflow
 * @desc    Process budget workflow (submit, approve, reject)
 * @access  Private
 */
router.post('/:budgetId/workflow',
  enterpriseBudgetController.processWorkflow
);

/**
 * @route   POST /api/enterprise-budget/consolidate
 * @desc    Consolidate multiple budgets
 * @access  Private (Director+)
 */
router.post('/consolidate',
  authorize('director', 'admin'),
  enterpriseBudgetController.consolidateBudgets
);

/**
 * @route   GET /api/enterprise-budget/dashboard
 * @desc    Get budget performance dashboard
 * @access  Private (Manager+)
 */
router.get('/dashboard',
  authorize('manager', 'director', 'admin'),
  enterpriseBudgetController.getPerformanceDashboard
);

/**
 * @route   POST /api/enterprise-budget/bulk/create
 * @desc    Bulk create budgets
 * @access  Private (Manager+)
 */
router.post('/bulk/create',
  authorize('manager', 'director', 'admin'),
  enterpriseBudgetController.bulkCreate
);

/**
 * @route   PUT /api/enterprise-budget/bulk/update
 * @desc    Bulk update budgets
 * @access  Private (Manager+)
 */
router.put('/bulk/update',
  authorize('manager', 'director', 'admin'),
  enterpriseBudgetController.bulkUpdate
);

/**
 * @route   DELETE /api/enterprise-budget/bulk/delete
 * @desc    Bulk delete budgets
 * @access  Private (Director+)
 */
router.delete('/bulk/delete',
  authorize('director', 'admin'),
  enterpriseBudgetController.bulkDelete
);

/**
 * @route   GET /api/enterprise-budget/export
 * @desc    Export budgets in various formats
 * @access  Private (Manager+)
 */
router.get('/export',
  authorize('manager', 'director', 'admin'),
  enterpriseBudgetController.exportBudgets
);

/**
 * @route   POST /api/enterprise-budget/import
 * @desc    Import budgets from file
 * @access  Private (Manager+)
 */
router.post('/import',
  authorize('manager', 'director', 'admin'),
  enterpriseBudgetController.importBudgets
);

/**
 * @route   POST /api/enterprise-budget/simulate
 * @desc    Run budget simulation
 * @access  Private (Manager+)
 */
router.post('/simulate',
  authorize('manager', 'director', 'admin'),
  enterpriseBudgetController.runSimulation
);

module.exports = router;
