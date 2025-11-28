const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const predictiveAnalyticsService = require('../services/predictiveAnalytics');

router.post('/predict-sales', protect, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const options = req.body;

    const predictions = await predictiveAnalyticsService.predictSales(tenantId, options);

    res.json(predictions);
  } catch (error) {
    console.error('Predict sales error:', error);
    res.status(500).json({ message: 'Error predicting sales', error: error.message });
  }
});

router.post('/predict-promotion-roi', protect, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const promotionParams = req.body;

    const prediction = await predictiveAnalyticsService.predictPromotionROI(tenantId, promotionParams);

    res.json(prediction);
  } catch (error) {
    console.error('Predict promotion ROI error:', error);
    res.status(500).json({ message: 'Error predicting promotion ROI', error: error.message });
  }
});

router.post('/predict-budget-needs', protect, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const options = req.body;

    const predictions = await predictiveAnalyticsService.predictBudgetNeeds(tenantId, options);

    res.json(predictions);
  } catch (error) {
    console.error('Predict budget needs error:', error);
    res.status(500).json({ message: 'Error predicting budget needs', error: error.message });
  }
});

router.post('/what-if', protect, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const scenario = req.body;

    const analysis = await predictiveAnalyticsService.whatIfScenario(tenantId, scenario);

    res.json(analysis);
  } catch (error) {
    console.error('What-if scenario error:', error);
    res.status(500).json({ message: 'Error analyzing scenario', error: error.message });
  }
});

module.exports = router;
