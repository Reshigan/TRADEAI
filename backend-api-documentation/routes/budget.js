const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { authorize, checkPermission } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validate, commonValidations } = require('../middleware/validation');

// Validation rules
const createBudgetValidation = [
  body('name').notEmpty().withMessage('Budget name is required'),
  body('year').isInt({ min: 2020, max: 2030 }).withMessage('Valid year required'),
  body('budgetType').isIn(['forecast', 'budget', 'revised_budget', 'scenario']).withMessage('Invalid budget type'),
  body('scope.level').isIn(['company', 'vendor', 'customer', 'product', 'mixed']).withMessage('Invalid scope level'),
  body('generateForecast').optional().isBoolean()
];

const budgetIdValidation = [
  param('id').isMongoId().withMessage('Invalid budget ID')
];

// Routes
router.post('/',
  checkPermission('budget', 'create'),
  createBudgetValidation,
  validate,
  budgetController.createBudget
);

router.get('/',
  checkPermission('budget', 'read'),
  query('year').optional().isInt(),
  query('budgetType').optional().isIn(['forecast', 'budget', 'revised_budget', 'scenario']),
  query('status').optional().isIn(['draft', 'submitted', 'approved', 'locked', 'archived']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  budgetController.getBudgets
);

router.get('/:id',
  checkPermission('budget', 'read'),
  ...budgetIdValidation,
  validate,
  budgetController.getBudget
);

router.put('/:id',
  checkPermission('budget', 'update'),
  ...budgetIdValidation,
  validate,
  budgetController.updateBudget
);

router.post('/:id/submit',
  checkPermission('budget', 'update'),
  ...budgetIdValidation,
  validate,
  budgetController.submitForApproval
);

router.post('/:id/approve',
  authorize('manager', 'director', 'board', 'admin'),
  ...budgetIdValidation,
  body('comments').optional().isString(),
  validate,
  budgetController.approveBudget
);

router.post('/generate-forecast',
  checkPermission('budget', 'create'),
  body('year').isInt({ min: 2020, max: 2030 }),
  body('scope').isObject(),
  body('historicalMonths').optional().isInt({ min: 12, max: 36 }),
  validate,
  budgetController.generateForecast
);

router.post('/compare',
  checkPermission('budget', 'read'),
  body('budgetIds').isArray({ min: 2 }).withMessage('At least 2 budget IDs required'),
  validate,
  budgetController.compareBudgets
);

router.get('/:id/performance',
  checkPermission('budget', 'read'),
  ...budgetIdValidation,
  validate,
  budgetController.getBudgetPerformance
);

router.post('/:id/new-version',
  checkPermission('budget', 'create'),
  ...budgetIdValidation,
  validate,
  budgetController.createNewVersion
);

router.post('/:id/lock',
  authorize('director', 'board', 'admin'),
  ...budgetIdValidation,
  body('reason').notEmpty().withMessage('Lock reason is required'),
  validate,
  budgetController.lockBudget
);

router.delete('/:id',
  checkPermission('budget', 'delete'),
  ...budgetIdValidation,
  validate,
  budgetController.deleteBudget
);

module.exports = router;