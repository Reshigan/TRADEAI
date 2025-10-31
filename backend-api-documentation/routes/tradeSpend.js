const express = require('express');
const router = express.Router();
const tradeSpendController = require('../controllers/tradeSpendController');
const { authorize, checkPermission, checkApprovalLimit } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validate, commonValidations } = require('../middleware/validation');

// Validation rules
const createTradeSpendValidation = [
  body('spendType').isIn(['marketing', 'cash_coop', 'trading_terms', 'rebate', 'promotion']),
  body('category').notEmpty().withMessage('Category is required'),
  body('amount.requested').isFloat({ min: 0 }).withMessage('Valid amount required'),
  body('period.startDate').isISO8601().toDate(),
  body('period.endDate').isISO8601().toDate(),
  body('customer').isMongoId().withMessage('Valid customer ID required')
];

// Routes
router.post('/',
  checkPermission('trade_spend', 'create'),
  ...createTradeSpendValidation,
  validate,
  tradeSpendController.createTradeSpend
);

router.get('/',
  checkPermission('trade_spend', 'read'),
  query('spendType').optional().isIn(['marketing', 'cash_coop', 'trading_terms', 'rebate', 'promotion']),
  query('status').optional(),
  query('customer').optional().isMongoId(),
  query('vendor').optional().isMongoId(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  tradeSpendController.getTradeSpends
);

router.get('/summary',
  checkPermission('trade_spend', 'read'),
  query('year').optional().isInt({ min: 2020, max: 2030 }),
  query('groupBy').optional().isIn(['month', 'quarter', 'year']),
  validate,
  tradeSpendController.getTradeSpendSummary
);

router.get('/wallet/:customerId',
  checkPermission('trade_spend', 'read'),
  param('customerId').isMongoId(),
  validate,
  tradeSpendController.getWalletBalance
);

router.get('/:id',
  checkPermission('trade_spend', 'read'),
  param('id').isMongoId(),
  validate,
  tradeSpendController.getTradeSpend
);

router.put('/:id',
  checkPermission('trade_spend', 'update'),
  param('id').isMongoId(),
  validate,
  tradeSpendController.updateTradeSpend
);

router.post('/:id/submit',
  checkPermission('trade_spend', 'update'),
  param('id').isMongoId(),
  validate,
  tradeSpendController.submitForApproval
);

router.post('/:id/approve',
  checkApprovalLimit('trade_spend'),
  param('id').isMongoId(),
  body('approvedAmount').optional().isFloat({ min: 0 }),
  body('comments').optional().isString(),
  validate,
  tradeSpendController.approveTradeSpend
);

router.post('/:id/reject',
  authorize('kam', 'manager', 'director', 'admin'),
  param('id').isMongoId(),
  body('reason').notEmpty().withMessage('Rejection reason is required'),
  validate,
  tradeSpendController.rejectTradeSpend
);

router.post('/:id/record-spend',
  checkPermission('trade_spend', 'update'),
  param('id').isMongoId(),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  body('documents').optional().isArray(),
  validate,
  tradeSpendController.recordSpend
);

router.delete('/:id',
  checkPermission('trade_spend', 'delete'),
  param('id').isMongoId(),
  validate,
  tradeSpendController.deleteTradeSpend
);

module.exports = router;