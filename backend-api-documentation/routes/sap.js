const express = require('express');
const router = express.Router();
const sapController = require('../controllers/sapController');
const { authorize, checkPermission } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validation');

// Only admin and specific roles can access SAP integration
const sapAuthorize = authorize('admin', 'analyst', 'director');

// Sync master data
router.post('/sync/master-data',
  sapAuthorize,
  body('dataType').isIn(['customers', 'products', 'vendors', 'all']).withMessage('Invalid data type'),
  body('fullSync').optional().isBoolean(),
  validate,
  sapController.syncMasterData
);

// Get sync status
router.get('/sync/status/:jobId',
  sapAuthorize,
  param('jobId').notEmpty(),
  validate,
  sapController.getSyncStatus
);

// Manual customer sync
router.post('/sync/customers',
  sapAuthorize,
  body('customerCodes').optional().isArray(),
  validate,
  sapController.syncCustomers
);

// Manual product sync
router.post('/sync/products',
  sapAuthorize,
  body('materialNumbers').optional().isArray(),
  validate,
  sapController.syncProducts
);

// Sync sales data
router.post('/sync/sales',
  sapAuthorize,
  body('startDate').isISO8601().toDate(),
  body('endDate').isISO8601().toDate(),
  body('customerCode').optional().isString(),
  validate,
  sapController.syncSalesData
);

// Post trade spend to SAP
router.post('/post/trade-spend',
  authorize('admin', 'finance'),
  body('tradeSpendId').isMongoId(),
  validate,
  sapController.postTradeSpend
);

// Get connection status
router.get('/status',
  sapAuthorize,
  sapController.getConnectionStatus
);

module.exports = router;