/**
 * Transaction Routes
 * Enterprise-level transaction management endpoints
 */

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { body, param, query } = require('express-validator');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

// Apply authentication to all transaction routes
router.use(authenticateToken);

// Validation rules
const createTransactionValidation = [
  body('transactionType').isIn(['debit', 'credit', 'accrual', 'payment', 'adjustment']).withMessage('Invalid transaction type'),
  body('customerId').isMongoId().withMessage('Invalid customer ID'),
  body('amount.gross').isNumeric().withMessage('Gross amount must be numeric'),
  body('transactionDate').isISO8601().withMessage('Invalid transaction date')
];

const updateTransactionValidation = [
  param('id').isMongoId().withMessage('Invalid transaction ID')
];

const approvalValidation = [
  param('id').isMongoId().withMessage('Invalid transaction ID'),
  body('comments').optional().isString()
];

// Routes

// Get all transactions (with advanced filtering)
router.get('/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  transactionController.getTransactions
);

// Get pending approvals
router.get('/pending-approvals',
  transactionController.getPendingApprovals
);

// Get single transaction by ID
router.get('/:id',
  param('id').isMongoId(),
  validate,
  transactionController.getTransactionById
);

// Create new transaction
router.post('/',
  createTransactionValidation,
  validate,
  transactionController.createTransaction
);

// Update transaction
router.put('/:id',
  updateTransactionValidation,
  validate,
  transactionController.updateTransaction
);

// Delete transaction (soft delete)
router.delete('/:id',
  param('id').isMongoId(),
  validate,
  transactionController.deleteTransaction
);

// Workflow actions
router.post('/:id/approve',
  approvalValidation,
  validate,
  authorize('manager', 'admin'),
  transactionController.approveTransaction
);

router.post('/:id/reject',
  approvalValidation,
  validate,
  authorize('manager', 'admin'),
  transactionController.rejectTransaction
);

router.post('/:id/settle',
  param('id').isMongoId(),
  validate,
  authorize('finance', 'admin'),
  transactionController.settleTransaction
);

// Bulk operations
router.post('/bulk/approve',
  body('transactionIds').isArray().withMessage('Transaction IDs must be an array'),
  body('transactionIds.*').isMongoId().withMessage('Invalid transaction ID'),
  validate,
  authorize('manager', 'admin'),
  transactionController.bulkApprove
);

// Bulk upload
router.post('/bulk/upload',
  upload.single('file'),
  transactionController.bulkUpload
);

// Download template
router.get('/template',
  query('format').optional().isIn(['csv', 'xlsx']),
  validate,
  transactionController.downloadTemplate
);

// Export transactions
router.get('/export',
  query('format').optional().isIn(['csv', 'xlsx']),
  validate,
  transactionController.exportTransactions
);

module.exports = router;
