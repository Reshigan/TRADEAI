/**
 * AI/ML Routes
 * REST API endpoints for AI features
 */

const express = require('express');
const router = express.Router();
const mlService = require('../../services/mlService');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/health', async (req, res) => {
  const health = await mlService.healthCheck();
  res.json(health);
});

router.post('/forecast/demand', async (req, res) => {
  const { productId, customerId, horizonDays, includePromotions } = req.body;
  if (!productId || !customerId) {
    return res.status(400).json({ error: 'productId and customerId required' });
  }
  const result = await mlService.forecastDemand({ productId, customerId, horizonDays, includePromotions });
  res.json(result.success ? result.data : { ...result.fallback, error: result.error, usingFallback: true });
});

router.post('/optimize/price', async (req, res) => {
  const { productId, currentPrice, cost, constraints } = req.body;
  if (!productId || !currentPrice || !cost) {
    return res.status(400).json({ error: 'productId, currentPrice, and cost required' });
  }
  const result = await mlService.optimizePrice({ productId, currentPrice, cost, constraints });
  res.json(result.success ? result.data : { ...result.fallback, error: result.error, usingFallback: true });
});

router.post('/analyze/promotion-lift', async (req, res) => {
  const { promotionId, preStartDate, preEndDate, postStartDate, postEndDate } = req.body;
  if (!promotionId || !preStartDate || !preEndDate || !postStartDate || !postEndDate) {
    return res.status(400).json({ error: 'All date parameters required' });
  }
  const result = await mlService.analyzePromotionLift({ promotionId, preStartDate, preEndDate, postStartDate, postEndDate });
  res.status(result.success ? 200 : 500).json(result.success ? result.data : { error: result.error });
});

router.post('/recommend/products', async (req, res) => {
  const { customerId, context, topN } = req.body;
  if (!customerId) {
    return res.status(400).json({ error: 'customerId required' });
  }
  const result = await mlService.recommendProducts({ customerId, context, topN });
  res.json(result.success ? result.data : { recommendations: result.fallback, error: result.error, usingFallback: true });
});

router.post('/segment/customers', async (req, res) => {
  try {
    const { method = 'rfm', tenantId, startDate, endDate } = req.body;
    const tenant = tenantId || req.user.tenantId;
    
    if (!tenant) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    
    const result = await mlService.segmentCustomers({ 
      method, 
      tenant, 
      startDate, 
      endDate 
    });
    
    res.json(result.success ? result.data : { 
      ...result.fallback, 
      error: result.error, 
      usingFallback: true 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/segment/customers/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID required' });
    }
    
    const result = await mlService.getCustomerSegment(customerId);
    
    res.json(result.success ? result.data : { 
      error: result.error, 
      usingFallback: true 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/detect/anomalies', async (req, res) => {
  try {
    const { 
      metricType, 
      tenantId, 
      startDate, 
      endDate, 
      threshold 
    } = req.body;
    
    const tenant = tenantId || req.user.tenantId;
    
    if (!tenant || !metricType) {
      return res.status(400).json({ 
        error: 'Tenant ID and metric type required' 
      });
    }
    
    const result = await mlService.detectAnomalies({ 
      metricType, 
      tenant, 
      startDate, 
      endDate, 
      threshold 
    });
    
    res.json(result.success ? result.data : { 
      ...result.fallback, 
      error: result.error, 
      usingFallback: true 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
