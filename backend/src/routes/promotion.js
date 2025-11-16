const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { authorize, checkPermission } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validate, commonValidations } = require('../middleware/validation');

// Validation rules
const createPromotionValidation = [
  body('name').notEmpty().withMessage('Promotion name is required'),
  body('promotionType').isIn(['price_discount', 'volume_discount', 'bogo', 'bundle', 'gift', 'loyalty', 'display', 'feature']),
  body('period.startDate').isISO8601().toDate(),
  body('period.endDate').isISO8601().toDate().custom((value, { req }) => {
    return new Date(value) > new Date(req.body.period.startDate);
  }).withMessage('End date must be after start date'),
  body('products').isArray({ min: 1 }).withMessage('At least one product required'),
  body('scope.customers').isArray({ min: 1 }).withMessage('At least one customer required')
];

// Routes
router.post('/',
  checkPermission('promotion', 'create'),
  ...createPromotionValidation,
  validate,
  promotionController.createPromotion
);

router.get('/',
  checkPermission('promotion', 'read'),
  query('status').optional().isIn(['draft', 'pending_approval', 'approved', 'active', 'completed', 'cancelled']),
  query('promotionType').optional(),
  query('customer').optional().isMongoId(),
  query('customerId').optional().isMongoId(),
  query('product').optional().isMongoId(),
  query('productId').optional().isMongoId(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  promotionController.getPromotions
);

router.get('/calendar',
  checkPermission('promotion', 'read'),
  query('year').isInt({ min: 2020, max: 2030 }),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('view').optional().isIn(['month', 'quarter', 'year']),
  validate,
  promotionController.getPromotionCalendar
);

router.get('/:id',
  checkPermission('promotion', 'read'),
  param('id').isMongoId(),
  validate,
  promotionController.getPromotion
);

router.put('/:id',
  checkPermission('promotion', 'update'),
  param('id').isMongoId(),
  validate,
  promotionController.updatePromotion
);

router.post('/:id/submit',
  checkPermission('promotion', 'update'),
  param('id').isMongoId(),
  validate,
  promotionController.submitForApproval
);

router.post('/:id/approve',
  authorize('kam', 'manager', 'director', 'admin'),
  param('id').isMongoId(),
  body('comments').optional().isString(),
  validate,
  promotionController.approvePromotion
);

router.post('/:id/calculate-performance',
  checkPermission('promotion', 'read'),
  param('id').isMongoId(),
  validate,
  promotionController.calculatePerformance
);

router.get('/:id/cannibalization',
  checkPermission('promotion', 'read'),
  param('id').isMongoId(),
  validate,
  promotionController.analyzeCannibalization
);

router.post('/:id/clone',
  checkPermission('promotion', 'create'),
  param('id').isMongoId(),
  validate,
  promotionController.clonePromotion
);

router.delete('/:id',
  checkPermission('promotion', 'delete'),
  param('id').isMongoId(),
  validate,
  promotionController.deletePromotion
);


router.get('/:id/products',
  checkPermission('promotion', 'read'),
  param('id').isMongoId(),
  validate,
  promotionController.getPromotionProducts
);

router.post('/:id/products',
  checkPermission('promotion', 'update'),
  param('id').isMongoId(),
  body('products').isArray({ min: 1 }),
  validate,
  promotionController.addPromotionProducts
);

router.put('/:id/products/:productId',
  checkPermission('promotion', 'update'),
  param('id').isMongoId(),
  param('productId').isMongoId(),
  validate,
  promotionController.updatePromotionProduct
);

router.delete('/:id/products/:productId',
  checkPermission('promotion', 'update'),
  param('id').isMongoId(),
  param('productId').isMongoId(),
  validate,
  promotionController.removePromotionProduct
);

router.get('/:id/customers',
  checkPermission('promotion', 'read'),
  param('id').isMongoId(),
  validate,
  promotionController.getPromotionCustomers
);

router.post('/:id/customers',
  checkPermission('promotion', 'update'),
  param('id').isMongoId(),
  body('customers').isArray({ min: 1 }),
  validate,
  promotionController.addPromotionCustomers
);

router.delete('/:id/customers/:customerId',
  checkPermission('promotion', 'update'),
  param('id').isMongoId(),
  param('customerId').isMongoId(),
  validate,
  promotionController.removePromotionCustomer
);

router.get('/:id/budget',
  checkPermission('promotion', 'read'),
  param('id').isMongoId(),
  validate,
  promotionController.getPromotionBudget
);

router.put('/:id/budget',
  checkPermission('promotion', 'update'),
  param('id').isMongoId(),
  validate,
  promotionController.updatePromotionBudget
);

// Approvals
router.get('/:id/approvals',
  checkPermission('promotion', 'read'),
  param('id').isMongoId(),
  validate,
  promotionController.getPromotionApprovals
);

router.post('/:id/approvals/:approvalId/action',
  authorize('kam', 'manager', 'director', 'finance', 'admin'),
  param('id').isMongoId(),
  param('approvalId').isMongoId(),
  body('action').isIn(['approve', 'reject', 'reassign']),
  body('comments').optional().isString(),
  validate,
  promotionController.processApproval
);

router.get('/:id/documents',
  checkPermission('promotion', 'read'),
  param('id').isMongoId(),
  validate,
  promotionController.getPromotionDocuments
);

router.post('/:id/documents',
  checkPermission('promotion', 'update'),
  param('id').isMongoId(),
  validate,
  promotionController.addPromotionDocument
);

router.delete('/:id/documents/:documentId',
  checkPermission('promotion', 'update'),
  param('id').isMongoId(),
  param('documentId').isMongoId(),
  validate,
  promotionController.removePromotionDocument
);

router.get('/:id/conflicts',
  checkPermission('promotion', 'read'),
  param('id').isMongoId(),
  validate,
  promotionController.getPromotionConflicts
);

// Performance
router.get('/:id/performance',
  checkPermission('promotion', 'read'),
  param('id').isMongoId(),
  validate,
  promotionController.getPromotionPerformance
);

router.get('/:id/history',
  checkPermission('promotion', 'read'),
  param('id').isMongoId(),
  validate,
  promotionController.getPromotionHistory
);

module.exports = router;
