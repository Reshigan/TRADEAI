/**
 * ML/AI Assertion Utilities for E2E Tests
 * Validates ML/AI calculations and recommendations
 */

const { expect } = require('@playwright/test');

class MlAssert {
  /**
   * Assert sales prediction invariants
   */
  static expectValidSalesPrediction(prediction) {
    const { predictions, confidence, trend, trendStrength, historicalAverage } = prediction;
    
    expect(predictions, 'predictions should be an array').toBeInstanceOf(Array);
    expect(confidence, 'confidence should be defined').toBeDefined();
    expect(['low', 'medium', 'high'].includes(confidence), `confidence should be low/medium/high, got ${confidence}`).toBeTruthy();
    
    predictions.forEach((pred, idx) => {
      expect(pred.predictedRevenue, `prediction[${idx}].predictedRevenue should be >= 0`).toBeGreaterThanOrEqual(0);
      expect(pred.year, `prediction[${idx}].year should be defined`).toBeDefined();
      expect(pred.month, `prediction[${idx}].month should be 1-12`).toBeGreaterThanOrEqual(1);
      expect(pred.month, `prediction[${idx}].month should be 1-12`).toBeLessThanOrEqual(12);
      expect(['increasing', 'decreasing', 'stable'].includes(pred.trend), `prediction[${idx}].trend should be increasing/decreasing/stable`).toBeTruthy();
      expect(pred.seasonalityFactor, `prediction[${idx}].seasonalityFactor should be > 0`).toBeGreaterThan(0);
    });
    
    if (trend === 'increasing') {
      expect(trendStrength, 'trendStrength should be > 0 for increasing trend').toBeGreaterThan(0);
    } else if (trend === 'decreasing') {
      expect(trendStrength, 'trendStrength should be > 0 for decreasing trend').toBeGreaterThan(0);
    }
    
    expect(historicalAverage, 'historicalAverage should be >= 0').toBeGreaterThanOrEqual(0);
    
    return true;
  }

  /**
   * Assert promotion ROI prediction invariants
   */
  static expectValidPromotionROI(prediction) {
    const { predictedROI, confidence, similarPromotionsCount, recommendation } = prediction;
    
    expect(confidence, 'confidence should be defined').toBeDefined();
    expect(['low', 'medium', 'high'].includes(confidence), `confidence should be low/medium/high, got ${confidence}`).toBeTruthy();
    
    if (predictedROI !== null) {
      expect(typeof predictedROI, 'predictedROI should be a number').toBe('number');
      expect(isNaN(predictedROI), 'predictedROI should not be NaN').toBeFalsy();
      
      if (confidence === 'high') {
        expect(similarPromotionsCount, 'high confidence should have >= 5 similar promotions').toBeGreaterThanOrEqual(5);
      } else if (confidence === 'medium') {
        expect(similarPromotionsCount, 'medium confidence should have >= 3 similar promotions').toBeGreaterThanOrEqual(3);
      }
      
      if (recommendation) {
        expect(['recommended', 'neutral', 'not_recommended'].includes(recommendation), `recommendation should be valid, got ${recommendation}`).toBeTruthy();
        
        if (predictedROI > 50) {
          expect(recommendation, 'ROI > 50% should be recommended').toBe('recommended');
        } else if (predictedROI < 0) {
          expect(recommendation, 'ROI < 0% should be not_recommended').toBe('not_recommended');
        }
      }
    } else {
      expect(confidence, 'null prediction should have low confidence').toBe('low');
    }
    
    return true;
  }

  /**
   * Assert budget needs prediction invariants
   */
  static expectValidBudgetNeeds(prediction) {
    const { predictions, confidence, avgUtilization, growthRate } = prediction;
    
    expect(predictions, 'predictions should be an array').toBeInstanceOf(Array);
    expect(confidence, 'confidence should be defined').toBeDefined();
    expect(['low', 'medium', 'high'].includes(confidence), `confidence should be low/medium/high, got ${confidence}`).toBeTruthy();
    
    predictions.forEach((pred, idx) => {
      expect(pred.predictedSpend, `prediction[${idx}].predictedSpend should be >= 0`).toBeGreaterThanOrEqual(0);
      expect(pred.recommendedBudget, `prediction[${idx}].recommendedBudget should be >= 0`).toBeGreaterThanOrEqual(0);
      expect(pred.expectedUtilization, `prediction[${idx}].expectedUtilization should be 0-1`).toBeGreaterThanOrEqual(0);
      expect(pred.expectedUtilization, `prediction[${idx}].expectedUtilization should be 0-1`).toBeLessThanOrEqual(1);
      
      expect(pred.recommendedBudget, `prediction[${idx}].recommendedBudget should be >= predictedSpend`).toBeGreaterThanOrEqual(pred.predictedSpend);
    });
    
    expect(avgUtilization, 'avgUtilization should be 0-1').toBeGreaterThanOrEqual(0);
    expect(avgUtilization, 'avgUtilization should be 0-1').toBeLessThanOrEqual(1);
    
    expect(typeof growthRate, 'growthRate should be a number').toBe('number');
    expect(isNaN(growthRate), 'growthRate should not be NaN').toBeFalsy();
    
    return true;
  }

  /**
   * Assert what-if scenario invariants
   */
  static expectValidWhatIfScenario(scenario, type) {
    expect(scenario.confidence, 'confidence should be defined').toBeDefined();
    expect(['low', 'medium', 'high'].includes(scenario.confidence), `confidence should be low/medium/high, got ${scenario.confidence}`).toBeTruthy();
    
    if (type === 'price_change') {
      const { currentVolume, predictedVolume, volumeChange, currentRevenue, predictedRevenue, revenueChange } = scenario;
      
      expect(currentVolume, 'currentVolume should be >= 0').toBeGreaterThanOrEqual(0);
      expect(predictedVolume, 'predictedVolume should be >= 0').toBeGreaterThanOrEqual(0);
      expect(currentRevenue, 'currentRevenue should be >= 0').toBeGreaterThanOrEqual(0);
      expect(predictedRevenue, 'predictedRevenue should be >= 0').toBeGreaterThanOrEqual(0);
      
      expect(typeof volumeChange, 'volumeChange should be a number').toBe('number');
      expect(typeof revenueChange, 'revenueChange should be a number').toBe('number');
      
    } else if (type === 'promotion_change') {
      const { currentAvgDiscount, predictedDiscount, currentAvgLift, predictedLift } = scenario;
      
      expect(currentAvgDiscount, 'currentAvgDiscount should be >= 0').toBeGreaterThanOrEqual(0);
      expect(predictedDiscount, 'predictedDiscount should be >= 0').toBeGreaterThanOrEqual(0);
      expect(currentAvgLift, 'currentAvgLift should be >= 0').toBeGreaterThanOrEqual(0);
      expect(predictedLift, 'predictedLift should be >= 0').toBeGreaterThanOrEqual(0);
      
    } else if (type === 'budget_change') {
      const { currentBudget, predictedBudget, currentUtilization, additionalCapacity } = scenario;
      
      expect(currentBudget, 'currentBudget should be >= 0').toBeGreaterThanOrEqual(0);
      expect(predictedBudget, 'predictedBudget should be >= 0').toBeGreaterThanOrEqual(0);
      expect(currentUtilization, 'currentUtilization should be >= 0').toBeGreaterThanOrEqual(0);
      expect(additionalCapacity, 'additionalCapacity should be >= 0').toBeGreaterThanOrEqual(0);
    }
    
    return true;
  }

  /**
   * Assert budget optimization recommendations
   */
  static expectValidBudgetOptimization(recommendations) {
    expect(recommendations, 'recommendations should be an array').toBeInstanceOf(Array);
    
    recommendations.forEach((rec, idx) => {
      expect(rec.type, `recommendation[${idx}].type should be defined`).toBeDefined();
      expect(rec.score, `recommendation[${idx}].score should be 0-100`).toBeGreaterThanOrEqual(0);
      expect(rec.score, `recommendation[${idx}].score should be 0-100`).toBeLessThanOrEqual(100);
      
      if (rec.uplift !== undefined) {
        expect(rec.uplift, `recommendation[${idx}].uplift should be >= 0`).toBeGreaterThanOrEqual(0);
      }
      
      if (rec.amount !== undefined) {
        expect(rec.amount, `recommendation[${idx}].amount should be a number`).toBeDefined();
      }
    });
    
    for (let i = 1; i < recommendations.length; i++) {
      expect(recommendations[i].score, `recommendations should be sorted by score`).toBeLessThanOrEqual(recommendations[i - 1].score);
    }
    
    return true;
  }

  /**
   * Assert performance analytics data
   */
  static expectValidPerformanceAnalytics(analytics) {
    expect(analytics, 'analytics should be defined').toBeDefined();
    
    if (analytics.data) {
      expect(analytics.data, 'analytics.data should be an array').toBeInstanceOf(Array);
    }
    
    if (analytics.summary) {
      expect(typeof analytics.summary, 'analytics.summary should be an object').toBe('object');
    }
    
    return true;
  }

  /**
   * Assert golden dataset prediction matches expected value with tolerance
   */
  static expectPredictionMatchesGolden(actual, expected, tolerance = 0.02, label = 'Prediction') {
    const diff = Math.abs(actual - expected);
    const percentDiff = expected !== 0 ? (diff / Math.abs(expected)) * 100 : 0;
    
    expect(percentDiff, `${label}: ${actual} should be within ${tolerance * 100}% of ${expected} (diff: ${percentDiff.toFixed(2)}%)`).toBeLessThanOrEqual(tolerance * 100);
    
    return { actual, expected, diff, percentDiff };
  }

  /**
   * Assert recommendation impact is monotonic
   * (higher score should have higher or equal uplift)
   */
  static expectMonotonicRecommendations(recommendations) {
    for (let i = 1; i < recommendations.length; i++) {
      const prev = recommendations[i - 1];
      const curr = recommendations[i];
      
      if (prev.score > curr.score && prev.uplift !== undefined && curr.uplift !== undefined) {
        expect(prev.uplift, `Higher score (${prev.score}) should have >= uplift than lower score (${curr.score})`).toBeGreaterThanOrEqual(curr.uplift);
      }
    }
    
    return true;
  }
}

module.exports = { MlAssert };
