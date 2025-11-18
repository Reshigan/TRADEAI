const express = require('express');
const router = express.Router();
const metricsService = require('../services/metricsService');
const { protect } = require('../middleware/auth');

router.get('/:module/:entityId', protect, async (req, res) => {
  try {
    const { module, entityId } = req.params;
    const { refresh } = req.query;
    
    const modelMap = {
      budget: require('../models/Budget'),
      promotion: require('../models/Promotion'),
      tradeSpend: require('../models/TradeSpend'),
      tradingTerm: require('../models/TradingTerm'),
      activityGrid: require('../models/ActivityGrid'),
      claim: require('../models/Claim'),
      deduction: require('../models/Deduction'),
      kamWallet: require('../models/KAMWallet'),
      campaign: require('../models/Campaign'),
      customer: require('../models/Customer'),
      product: require('../models/Product')
    };
    
    const Model = modelMap[module];
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: `Invalid module: ${module}`
      });
    }
    
    const entity = await Model.findById(entityId);
    if (!entity) {
      return res.status(404).json({
        success: false,
        message: 'Entity not found'
      });
    }
    
    const context = {
      currency: entity.currency || 'ZAR'
    };
    
    let metrics;
    if (refresh === 'true') {
      metricsService.clearCache(module, entityId);
      metrics = await metricsService.calculateMetrics(module, entityId, Model, context);
    } else {
      metrics = await metricsService.getMetricsWithCache(module, entityId, Model, context);
    }
    
    res.json({
      success: true,
      data: metrics,
      module,
      entityId
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching metrics',
      error: error.message
    });
  }
});

router.get('/cache/stats', protect, async (req, res) => {
  try {
    const stats = metricsService.getCacheStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cache stats',
      error: error.message
    });
  }
});

router.delete('/cache/:module/:entityId', protect, async (req, res) => {
  try {
    const { module, entityId } = req.params;
    
    metricsService.clearCache(module, entityId);
    
    res.json({
      success: true,
      message: 'Cache cleared'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cache',
      error: error.message
    });
  }
});

router.delete('/cache', protect, async (req, res) => {
  try {
    metricsService.clearAllCache();
    
    res.json({
      success: true,
      message: 'All cache cleared'
    });
  } catch (error) {
    console.error('Error clearing all cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing all cache',
      error: error.message
    });
  }
});

module.exports = router;
