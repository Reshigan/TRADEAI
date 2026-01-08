const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');
const { authenticate } = require('../middleware/auth');

/**
 * Allocation Routes
 * API endpoints for proportional allocation across product/customer hierarchies
 */

// All routes require authentication
router.use(authenticate);

// Preview allocation (POST for complex body)
router.post('/preview', allocationController.previewAllocation);

// Create new allocation
router.post('/', allocationController.createAllocation);

// Get allocation statistics
router.get('/stats', allocationController.getAllocationStats);

// Get hierarchy tree for selection UI
router.get('/hierarchy/:entityType', allocationController.getHierarchyTree);

// List allocations with filters
router.get('/', allocationController.listAllocations);

// Get allocation by source type and ID
router.get('/source/:sourceType/:sourceId', allocationController.getAllocationBySource);

// Get allocation history by source
router.get('/source/:sourceType/:sourceId/history', allocationController.getAllocationHistory);

// Get single allocation by ID
router.get('/:id', allocationController.getAllocation);

// Update allocation actuals
router.patch('/:id/actuals', allocationController.updateActuals);

// Recalculate allocation
router.post('/:id/recalculate', allocationController.recalculateAllocation);

// Archive allocation
router.delete('/:id', allocationController.archiveAllocation);

module.exports = router;
