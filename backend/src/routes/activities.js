const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Activity = require('../models/ActivityGrid');
const logger = require('../utils/logger');

// Get all activities
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, activityType, performance, search } = req.query;
    
    const query = { tenantId: req.user.tenantId };
    
    if (status) query.status = status;
    if (activityType) query.activityType = activityType;
    if (performance) query.performance = performance;
    if (search) {
      query.$or = [
        { activityName: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: activities,
      count: activities.length
    });
  } catch (error) {
    logger.error(`Get activities error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities'
    });
  }
});

// Get activity metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [
      totalActivities,
      activeActivities,
      completedActivities,
      activitiesByType,
      activitiesByStatus,
      performanceMetrics
    ] = await Promise.all([
      Activity.countDocuments({ tenantId }),
      Activity.countDocuments({ tenantId, status: 'In Progress' }),
      Activity.countDocuments({ tenantId, status: 'Completed' }),
      Activity.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$activityType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { type: '$_id', count: 1, _id: 0 } }
      ]),
      Activity.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]),
      Activity.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$performance', count: { $sum: 1 } } },
        { $project: { performance: '$_id', count: 1, _id: 0 } }
      ])
    ]);

    const budgetMetrics = await Activity.aggregate([
      { $match: { tenantId } },
      { $group: {
        _id: null,
        totalBudget: { $sum: '$budget.allocated' },
        totalSpent: { $sum: '$budget.spent' },
        avgROI: { $avg: '$actualOutcome.roi' }
      }}
    ]);

    res.json({
      success: true,
      data: {
        totalActivities,
        activeActivities,
        completedActivities,
        totalBudget: budgetMetrics[0]?.totalBudget || 0,
        totalSpent: budgetMetrics[0]?.totalSpent || 0,
        avgROI: budgetMetrics[0]?.avgROI || 0,
        activitiesByType,
        activitiesByStatus,
        performanceMetrics
      }
    });
  } catch (error) {
    logger.error(`Get activity metrics error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics'
    });
  }
});

// Get activity count
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { tenantId: req.user.tenantId };
    
    if (status) query.status = status;

    const count = await Activity.countDocuments(query);

    res.json({
      success: true,
      data: count
    });
  } catch (error) {
    logger.error(`Get activity count error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to count activities'
    });
  }
});

// Get single activity
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    logger.error(`Get activity error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity'
    });
  }
});

// Create activity
router.post('/', authenticateToken, async (req, res) => {
  try {
    const activityData = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    };

    const activity = await Activity.create(activityData);

    logger.info(`Activity created: ${activity._id}`);

    res.status(201).json({
      success: true,
      data: activity,
      message: 'Activity created successfully'
    });
  } catch (error) {
    logger.error(`Create activity error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create activity'
    });
  }
});

// Update activity
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const activity = await Activity.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.user.tenantId
      },
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    logger.info(`Activity updated: ${activity._id}`);

    res.json({
      success: true,
      data: activity,
      message: 'Activity updated successfully'
    });
  } catch (error) {
    logger.error(`Update activity error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update activity'
    });
  }
});

// Delete activity
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const activity = await Activity.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    logger.info(`Activity deleted: ${activity._id}`);

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete activity error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity'
    });
  }
});

module.exports = router;
