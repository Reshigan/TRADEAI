const express = require('express');
const router = express.Router();
const activityGridController = require('../controllers/activityGridController');
const { authorize, checkPermission } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validate, commonValidations } = require('../middleware/validation');

// Get activity grid
router.get('/',
  checkPermission('activity_grid', 'read'),
  query('view').optional().isIn(['month', 'week', 'day', 'list']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  activityGridController.getActivityGrid
);

// Get heat map
router.get('/heat-map',
  checkPermission('activity_grid', 'read'),
  query('year').isInt({ min: 2020, max: 2030 }),
  query('month').isInt({ min: 1, max: 12 }),
  query('groupBy').optional().isIn(['customer', 'product', 'vendor']),
  validate,
  activityGridController.getHeatMap
);

// Get conflicts
router.get('/conflicts',
  checkPermission('activity_grid', 'read'),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('severity').optional().isIn(['low', 'medium', 'high']),
  validate,
  activityGridController.getConflicts
);

// Create activity
router.post('/',
  checkPermission('activity_grid', 'create'),
  body('date').isISO8601().toDate(),
  body('activityType').isIn(['promotion', 'trade_spend', 'campaign', 'visit', 'event', 'other']),
  body('customer').isMongoId(),
  body('products').optional().isArray(),
  body('title').notEmpty(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  validate,
  activityGridController.createActivity
);

// Update activity
router.put('/:id',
  checkPermission('activity_grid', 'update'),
  param('id').isMongoId(),
  validate,
  activityGridController.updateActivity
);

// Delete activity
router.delete('/:id',
  checkPermission('activity_grid', 'delete'),
  param('id').isMongoId(),
  validate,
  activityGridController.deleteActivity
);

// Sync activities
router.post('/sync',
  authorize('admin', 'manager'),
  body('source').isIn(['promotions', 'tradespends', 'campaigns', 'all']),
  body('startDate').isISO8601().toDate(),
  body('endDate').isISO8601().toDate(),
  validate,
  activityGridController.syncActivities
);

module.exports = router;