const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const controller = require('../controllers/businessRulesController');

// Read current business rules config (requires auth)
router.get('/', authenticateToken, controller.getConfig);

// Update business rules config (admin/manager roles)
router.put('/', authenticateToken, authorize('admin', 'manager'), controller.updateConfig);

module.exports = router;
