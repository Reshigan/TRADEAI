const express = require('express');
const router = express.Router();
const kamWalletController = require('../controllers/kamWalletController');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

// All routes require authentication
router.use(auth);

// Get all wallets (filtered by user role)
router.get('/', kamWalletController.getWallets);

// Get wallet by ID
router.get('/:id', kamWalletController.getWallet);

// Create new wallet (admin/manager only)
router.post('/',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('period.startDate').isISO8601().withMessage('Valid start date is required'),
    body('period.endDate').isISO8601().withMessage('Valid end date is required'),
    body('totalAllocation').isNumeric().withMessage('Total allocation must be a number')
  ],
  kamWalletController.createWallet
);

// Allocate to customer
router.post('/:id/allocate',
  [
    body('customerId').notEmpty().withMessage('Customer ID is required'),
    body('amount').isNumeric().withMessage('Amount must be a number')
  ],
  kamWalletController.allocateToCustomer
);

// Record usage
router.post('/:id/record-usage',
  [
    body('customerId').notEmpty().withMessage('Customer ID is required'),
    body('amount').isNumeric().withMessage('Amount must be a number')
  ],
  kamWalletController.recordUsage
);

// Get wallet balance
router.get('/:id/balance', kamWalletController.getBalance);

// Get allocations for a specific customer
router.get('/customer/:customerId/allocations', kamWalletController.getCustomerAllocations);

// Update wallet status
router.patch('/:id/status',
  [
    body('status').isIn(['active', 'exhausted', 'expired']).withMessage('Invalid status')
  ],
  kamWalletController.updateStatus
);

module.exports = router;
