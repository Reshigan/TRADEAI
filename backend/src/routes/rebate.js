const express = require('express');
const router = express.Router();
const rebateController = require('../controllers/rebateController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/rebates
 * @desc    Get all rebates with optional filtering
 * @access  Private
 */
router.get('/', rebateController.getAllRebates);

/**
 * @route   GET /api/rebates/statistics
 * @desc    Get rebate statistics
 * @access  Private
 */
router.get('/statistics', rebateController.getRebateStatistics);

/**
 * @route   GET /api/rebates/accruals
 * @desc    Get rebate accruals
 * @access  Private
 */
router.get('/accruals', rebateController.getRebateAccruals);

/**
 * @route   GET /api/rebates/customer/:customerId/history
 * @desc    Get rebate history for a customer
 * @access  Private
 */
router.get('/customer/:customerId/history', rebateController.getCustomerRebateHistory);

/**
 * @route   POST /api/rebates/calculate
 * @desc    Calculate rebates for a transaction
 * @access  Private
 */
router.post('/calculate', rebateController.calculateRebatesForTransaction);

/**
 * @route   POST /api/rebates/calculate-margin
 * @desc    Calculate net margin with rebates
 * @access  Private
 */
router.post('/calculate-margin', rebateController.calculateNetMargin);

/**
 * @route   POST /api/rebates/accrue
 * @desc    Accrue rebates for a period
 * @access  Private (Admin or Manager)
 */
router.post('/accrue', authorize(['admin', 'manager']), rebateController.accrueRebatesForPeriod);

/**
 * @route   GET /api/rebates/:id
 * @desc    Get rebate by ID
 * @access  Private
 */
router.get('/:id', rebateController.getRebateById);

/**
 * @route   POST /api/rebates
 * @desc    Create new rebate
 * @access  Private (Admin or Manager)
 */
router.post('/', authorize(['admin', 'manager']), rebateController.createRebate);

/**
 * @route   PUT /api/rebates/:id
 * @desc    Update rebate
 * @access  Private (Admin or Manager)
 */
router.put('/:id', authorize(['admin', 'manager']), rebateController.updateRebate);

/**
 * @route   DELETE /api/rebates/:id
 * @desc    Delete rebate
 * @access  Private (Admin only)
 */
router.delete('/:id', authorize(['admin']), rebateController.deleteRebate);

/**
 * @route   POST /api/rebates/:id/approve
 * @desc    Approve rebate (activate)
 * @access  Private (Admin only)
 */
router.post('/:id/approve', authorize(['admin']), rebateController.approveRebate);

/**
 * @route   POST /api/rebates/:id/deactivate
 * @desc    Deactivate rebate
 * @access  Private (Admin only)
 */
router.post('/:id/deactivate', authorize(['admin']), rebateController.deactivateRebate);

module.exports = router;
