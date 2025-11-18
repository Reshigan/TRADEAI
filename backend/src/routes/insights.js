const express = require('express');
const router = express.Router();
const Insight = require('../models/Insight');
const insightScanner = require('../services/insightScanner');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { module, severity, status, limit = 50, skip = 0 } = req.query;
    
    const query = {
      $or: [
        { owner: req.user._id },
        { assignedTo: req.user._id }
      ]
    };
    
    if (module) query.module = module;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    
    const insights = await Insight.find(query)
      .sort({ severity: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('owner', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');
    
    const total = await Insight.countDocuments(query);
    
    res.json({
      success: true,
      data: insights,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > (parseInt(skip) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insights',
      error: error.message
    });
  }
});

router.get('/summary', protect, async (req, res) => {
  try {
    const { module } = req.query;
    
    const filters = {
      $or: [
        { owner: req.user._id },
        { assignedTo: req.user._id }
      ]
    };
    
    if (module) filters.module = module;
    
    const summary = await Insight.getSummary(filters);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching insights summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insights summary',
      error: error.message
    });
  }
});

router.get('/top/:module', protect, async (req, res) => {
  try {
    const { module } = req.params;
    const { limit = 10 } = req.query;
    
    const insights = await Insight.getTopByModule(module, parseInt(limit));
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error fetching top insights:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top insights',
      error: error.message
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const insight = await Insight.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName email');
    
    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }
    
    res.json({
      success: true,
      data: insight
    });
  } catch (error) {
    console.error('Error fetching insight:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insight',
      error: error.message
    });
  }
});

router.post('/:id/acknowledge', protect, async (req, res) => {
  try {
    const insight = await Insight.findById(req.params.id);
    
    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }
    
    await insight.acknowledge(req.user._id);
    
    res.json({
      success: true,
      data: insight
    });
  } catch (error) {
    console.error('Error acknowledging insight:', error);
    res.status(500).json({
      success: false,
      message: 'Error acknowledging insight',
      error: error.message
    });
  }
});

router.post('/:id/assign', protect, async (req, res) => {
  try {
    const { assignedTo } = req.body;
    
    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'assignedTo is required'
      });
    }
    
    const insight = await Insight.findById(req.params.id);
    
    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }
    
    await insight.assign(req.user._id, assignedTo);
    
    res.json({
      success: true,
      data: insight
    });
  } catch (error) {
    console.error('Error assigning insight:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning insight',
      error: error.message
    });
  }
});

router.post('/:id/resolve', protect, async (req, res) => {
  try {
    const { notes } = req.body;
    
    const insight = await Insight.findById(req.params.id);
    
    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }
    
    await insight.resolve(req.user._id, notes);
    
    res.json({
      success: true,
      data: insight
    });
  } catch (error) {
    console.error('Error resolving insight:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving insight',
      error: error.message
    });
  }
});

router.post('/:id/dismiss', protect, async (req, res) => {
  try {
    const { notes } = req.body;
    
    const insight = await Insight.findById(req.params.id);
    
    if (!insight) {
      return res.status(404).json({
        success: false,
        message: 'Insight not found'
      });
    }
    
    await insight.dismiss(req.user._id, notes);
    
    res.json({
      success: true,
      data: insight
    });
  } catch (error) {
    console.error('Error dismissing insight:', error);
    res.status(500).json({
      success: false,
      message: 'Error dismissing insight',
      error: error.message
    });
  }
});

router.post('/scan/:module/:entityId', protect, async (req, res) => {
  try {
    const { module, entityId } = req.params;
    
    const insights = await insightScanner.scanEntityOnDemand(module, entityId);
    
    res.json({
      success: true,
      data: insights,
      message: `Generated ${insights.length} insights`
    });
  } catch (error) {
    console.error('Error scanning entity:', error);
    res.status(500).json({
      success: false,
      message: 'Error scanning entity',
      error: error.message
    });
  }
});

module.exports = router;
