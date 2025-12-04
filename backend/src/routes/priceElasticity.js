/**
 * Price Elasticity Routes
 * API endpoints for price elasticity analysis and volume uplift predictions
 */

const express = require('express');
const router = express.Router();
const priceElasticityService = require('../services/priceElasticityService');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth.authenticate);

/**
 * @route GET /api/price-elasticity/product/:productId
 * @desc Get price elasticity for a specific product
 * @access Private
 */
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const tenantId = req.user.companyId;

    const elasticity = await priceElasticityService.calculateProductElasticity(
      tenantId,
      productId
    );

    res.json({
      success: true,
      data: elasticity
    });
  } catch (error) {
    console.error('Product elasticity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate product elasticity',
      details: error.message
    });
  }
});

/**
 * @route GET /api/price-elasticity/category/:category
 * @desc Get price elasticity for a product category
 * @access Private
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const tenantId = req.user.companyId;

    const elasticity = await priceElasticityService.calculateCategoryElasticity(
      tenantId,
      category
    );

    res.json({
      success: true,
      data: elasticity
    });
  } catch (error) {
    console.error('Category elasticity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate category elasticity',
      details: error.message
    });
  }
});

/**
 * @route POST /api/price-elasticity/predict-volume
 * @desc Predict volume at a given price point
 * @access Private
 */
router.post('/predict-volume', async (req, res) => {
  try {
    const { productId, newPrice } = req.body;
    const tenantId = req.user.companyId;

    if (!productId || !newPrice) {
      return res.status(400).json({
        success: false,
        error: 'productId and newPrice are required'
      });
    }

    const prediction = await priceElasticityService.predictVolumeAtPrice(
      tenantId,
      productId,
      newPrice
    );

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Volume prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict volume',
      details: error.message
    });
  }
});

/**
 * @route POST /api/price-elasticity/optimal-prices
 * @desc Get optimal price suggestions for a product
 * @access Private
 */
router.post('/optimal-prices', async (req, res) => {
  try {
    const { productId, minPrice, maxPrice, steps } = req.body;
    const tenantId = req.user.companyId;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'productId is required'
      });
    }

    const suggestions = await priceElasticityService.suggestOptimalPrices(
      tenantId,
      productId,
      { minPrice, maxPrice, steps }
    );

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Optimal prices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suggest optimal prices',
      details: error.message
    });
  }
});

/**
 * @route GET /api/price-elasticity/cached
 * @desc Get all cached elasticities for the tenant
 * @access Private
 */
router.get('/cached', async (req, res) => {
  try {
    const tenantId = req.user.companyId;
    const cached = priceElasticityService.getCachedElasticities(tenantId);

    res.json({
      success: true,
      data: cached
    });
  } catch (error) {
    console.error('Cached elasticities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cached elasticities',
      details: error.message
    });
  }
});

/**
 * @route POST /api/price-elasticity/clear-cache
 * @desc Clear elasticity cache
 * @access Private
 */
router.post('/clear-cache', async (req, res) => {
  try {
    const result = priceElasticityService.clearCache();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      details: error.message
    });
  }
});

module.exports = router;
