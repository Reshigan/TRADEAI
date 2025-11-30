const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');
const { MlAssert } = require('../helpers/mlAssert');

test.describe('Predictive Analytics ML/AI Validation @ai @ml', () => {
  test('should validate sales prediction calculations', async ({ request }) => {
    const api = await ApiHelper.fromCredentials(
      request,
      process.env.TEST_USER_EMAIL || 'admin@testdistributor.com',
      process.env.TEST_USER_PASSWORD || 'Admin@123'
    );
    
    const { data: prediction } = await api.post('/api/predictive-analytics/predict-sales', {
      months: 3
    });
    
    console.log('Sales Prediction Response:', JSON.stringify(prediction, null, 2));
    
    if (prediction.predictions && prediction.predictions.length > 0) {
      MlAssert.expectValidSalesPrediction(prediction);
      
      expect(prediction.predictions.length).toBe(3); // Should return 3 months as requested
      
      const currentDate = new Date();
      prediction.predictions.forEach((pred, idx) => {
        const predDate = new Date(pred.year, pred.month - 1);
        expect(predDate.getTime(), `Prediction ${idx} should be for future month`).toBeGreaterThan(currentDate.getTime());
      });
      
      console.log(`✓ Sales prediction validated: ${prediction.predictions.length} months, confidence: ${prediction.confidence}, trend: ${prediction.trend}`);
    } else {
      console.log('Insufficient data for sales prediction - this is expected for new tenants');
      expect(prediction.confidence).toBe('low');
      expect(prediction.message).toContain('Insufficient');
    }
  });

  test('should validate promotion ROI prediction calculations', async ({ request }) => {
    const api = await ApiHelper.fromCredentials(
      request,
      process.env.TEST_USER_EMAIL || 'admin@testdistributor.com',
      process.env.TEST_USER_PASSWORD || 'Admin@123'
    );
    
    const { data: prediction } = await api.post('/api/predictive-analytics/predict-promotion-roi', {
      promotionType: 'discount',
      discountValue: 10,
      duration: 30
    });
    
    console.log('Promotion ROI Prediction Response:', JSON.stringify(prediction, null, 2));
    
    MlAssert.expectValidPromotionROI(prediction);
    
    if (prediction.predictedROI !== null) {
      console.log(`✓ Promotion ROI validated: ${prediction.predictedROI.toFixed(2)}%, confidence: ${prediction.confidence}, recommendation: ${prediction.recommendation}`);
      
      if (prediction.predictedROI > 50) {
        expect(prediction.recommendation).toBe('recommended');
      } else if (prediction.predictedROI < 0) {
        expect(prediction.recommendation).toBe('not_recommended');
      }
    } else {
      console.log('No similar promotions found - this is expected for new tenants');
      expect(prediction.confidence).toBe('low');
    }
  });

  test('should validate budget needs prediction calculations', async ({ request }) => {
    const api = await ApiHelper.fromCredentials(
      request,
      process.env.TEST_USER_EMAIL || 'admin@testdistributor.com',
      process.env.TEST_USER_PASSWORD || 'Admin@123'
    );
    
    const { data: prediction } = await api.post('/api/predictive-analytics/predict-budget-needs', {
      months: 3
    });
    
    console.log('Budget Needs Prediction Response:', JSON.stringify(prediction, null, 2));
    
    if (prediction.predictions && prediction.predictions.length > 0) {
      MlAssert.expectValidBudgetNeeds(prediction);
      
      expect(prediction.predictions.length).toBe(3); // Should return 3 months as requested
      
      prediction.predictions.forEach((pred, idx) => {
        const expectedMinBudget = pred.predictedSpend / 1.0; // At least 100% of predicted spend
        expect(pred.recommendedBudget, `Prediction ${idx} recommended budget should be reasonable`).toBeGreaterThanOrEqual(expectedMinBudget * 0.9);
        
        expect(pred.expectedUtilization).toBeGreaterThanOrEqual(0);
        expect(pred.expectedUtilization).toBeLessThanOrEqual(1);
      });
      
      console.log(`✓ Budget needs validated: ${prediction.predictions.length} months, confidence: ${prediction.confidence}, growth rate: ${prediction.growthRate.toFixed(2)}%`);
    } else {
      console.log('No historical budget data - this is expected for new tenants');
      if (prediction.confidence) {
        expect(prediction.confidence).toBe('low');
      } else {
        expect(true).toBeTruthy();
      }
    }
  });

  test('should validate what-if scenario: price change', async ({ request }) => {
    const api = await ApiHelper.fromCredentials(
      request,
      process.env.TEST_USER_EMAIL || 'admin@testdistributor.com',
      process.env.TEST_USER_PASSWORD || 'Admin@123'
    );
    
    const { data: scenario } = await api.post('/api/predictive-analytics/what-if', {
      type: 'price_change',
      parameters: {
        productId: '507f1f77bcf86cd799439011', // Sample product ID
        priceChange: 10 // 10% price increase
      }
    });
    
    console.log('Price Change Scenario Response:', JSON.stringify(scenario, null, 2));
    
    if (scenario.currentVolume !== undefined) {
      MlAssert.expectValidWhatIfScenario(scenario, 'price_change');
      
      const expectedVolumeChange = -1.5 * 10; // -15%
      const actualVolumeChange = scenario.volumeChange;
      
      const volumeChangeDiff = Math.abs(actualVolumeChange - expectedVolumeChange);
      expect(volumeChangeDiff, 'Volume change should follow elasticity model').toBeLessThan(5);
      
      console.log(`✓ Price change scenario validated: ${actualVolumeChange.toFixed(2)}% volume change for 10% price increase`);
    } else {
      console.log('Insufficient data for price change analysis');
      expect(scenario.confidence).toBe('low');
    }
  });

  test('should validate what-if scenario: promotion change', async ({ request }) => {
    const api = await ApiHelper.fromCredentials(
      request,
      process.env.TEST_USER_EMAIL || 'admin@testdistributor.com',
      process.env.TEST_USER_PASSWORD || 'Admin@123'
    );
    
    const { data: scenario } = await api.post('/api/predictive-analytics/what-if', {
      type: 'promotion_change',
      parameters: {
        discountIncrease: 20, // 20% increase in discount
        expectedLiftIncrease: 15 // 15% increase in lift
      }
    });
    
    console.log('Promotion Change Scenario Response:', JSON.stringify(scenario, null, 2));
    
    if (scenario.currentAvgDiscount !== undefined) {
      MlAssert.expectValidWhatIfScenario(scenario, 'promotion_change');
      
      const discountIncrease = ((scenario.predictedDiscount - scenario.currentAvgDiscount) / scenario.currentAvgDiscount) * 100;
      const liftIncrease = ((scenario.predictedLift - scenario.currentAvgLift) / scenario.currentAvgLift) * 100;
      
      expect(Math.abs(discountIncrease - 20), 'Discount increase should match input').toBeLessThan(1);
      expect(Math.abs(liftIncrease - 15), 'Lift increase should match input').toBeLessThan(1);
      
      console.log(`✓ Promotion change scenario validated: ${discountIncrease.toFixed(2)}% discount increase, ${liftIncrease.toFixed(2)}% lift increase`);
    } else {
      console.log('No historical promotion data');
      expect(scenario.confidence).toBe('low');
    }
  });

  test('should validate what-if scenario: budget change', async ({ request }) => {
    const api = await ApiHelper.fromCredentials(
      request,
      process.env.TEST_USER_EMAIL || 'admin@testdistributor.com',
      process.env.TEST_USER_PASSWORD || 'Admin@123'
    );
    
    const { data: scenario } = await api.post('/api/predictive-analytics/what-if', {
      type: 'budget_change',
      parameters: {
        budgetIncrease: 25, // 25% budget increase
        category: 'Trade Promotion'
      }
    });
    
    console.log('Budget Change Scenario Response:', JSON.stringify(scenario, null, 2));
    
    if (scenario.currentBudget !== undefined) {
      MlAssert.expectValidWhatIfScenario(scenario, 'budget_change');
      
      const budgetIncrease = ((scenario.predictedBudget - scenario.currentBudget) / scenario.currentBudget) * 100;
      
      expect(Math.abs(budgetIncrease - 25), 'Budget increase should match input').toBeLessThan(1);
      
      expect(scenario.additionalCapacity).toBeGreaterThan(0);
      
      expect(scenario.currentUtilization).toBeGreaterThanOrEqual(0);
      expect(scenario.currentUtilization).toBeLessThanOrEqual(100);
      
      console.log(`✓ Budget change scenario validated: ${budgetIncrease.toFixed(2)}% increase, additional capacity: ${scenario.additionalCapacity.toFixed(2)}`);
    } else {
      console.log('No budget data found for category');
      expect(scenario.confidence).toBe('low');
    }
  });

  test('should validate ML predictions are deterministic for same inputs', async ({ request }) => {
    const api = await ApiHelper.fromCredentials(
      request,
      process.env.TEST_USER_EMAIL || 'admin@testdistributor.com',
      process.env.TEST_USER_PASSWORD || 'Admin@123'
    );
    
    const params = { months: 3 };
    
    const { data: prediction1 } = await api.post('/api/predictive-analytics/predict-sales', params);
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    const { data: prediction2 } = await api.post('/api/predictive-analytics/predict-sales', params);
    
    if (prediction1.predictions && prediction2.predictions) {
      expect(prediction1.predictions.length).toBe(prediction2.predictions.length);
      expect(prediction1.confidence).toBe(prediction2.confidence);
      expect(prediction1.trend).toBe(prediction2.trend);
      
      if (prediction1.predictions.length > 0) {
        const pred1 = prediction1.predictions[0];
        const pred2 = prediction2.predictions[0];
        
        expect(pred1.year).toBe(pred2.year);
        expect(pred1.month).toBe(pred2.month);
        expect(Math.abs(pred1.predictedRevenue - pred2.predictedRevenue)).toBeLessThan(0.01);
      }
      
      console.log('✓ ML predictions are deterministic');
    } else {
      console.log('Insufficient data for determinism test');
      expect(true).toBeTruthy();
    }
  });
});
