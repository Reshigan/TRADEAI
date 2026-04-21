/**
 * HEURISTIC (NOT ML) Promotion Validation Service
 * 
 * D-09: This service uses rule-of-thumb heuristics, NOT trained ML models.
 * Formula: baselineUplift = sqrt(discount%) × 3.5 × categoryFactor.
 * This is a rule-of-thumb based on industry averages.
 * 
 * For real model-based predictions, use forecastingService.predictPromotionPerformance,
 * which uses historical regression on completed promotions.
 */

class HeuristicPromotionValidationService {
  constructor() {
    this.modelVersion = 'heuristic-v1';
  }

  /**
   * Validate promotion uplift prediction using heuristics
   * @returns {Object} - Validation result with source='heuristic' and warning
   */
  validatePromotionUplift(promotionData) {
    const {
      _productId,
      currentPrice,
      proposedPrice,
      expectedUplift,
      category,
      duration = 14,
      historicalData = {}
    } = promotionData;

    // Calculate discount percentage
    const discountPercentage = ((currentPrice - proposedPrice) / currentPrice) * 100;

    // Simple validation logic (rule-of-thumb heuristic)
    const baselineUplift = this.calculateBaselineUplift(discountPercentage, category);
    const historicalAverage = historicalData.averageUplift || 15;

    // Check if expected uplift is reasonable
    const minReasonableUplift = Math.min(baselineUplift * 0.7, historicalAverage * 0.7);
    const maxReasonableUplift = Math.max(baselineUplift * 1.5, historicalAverage * 1.5);

    const isRealistic = expectedUplift >= minReasonableUplift && expectedUplift <= maxReasonableUplift;
    const confidence = this.calculateConfidence(expectedUplift, baselineUplift, historicalAverage);

    return {
      isRealistic,
      confidence,
      predictedUplift: baselineUplift,
      expectedUplift,
      discountPercentage,
      range: {
        min: minReasonableUplift,
        max: maxReasonableUplift
      },
      factors: {
        discountDepth: discountPercentage,
        category,
        duration,
        historicalPerformance: historicalAverage
      },
      // D-09: Honest labeling - this is a heuristic, not ML
      source: 'heuristic',
      warning: 'Not a trained ML prediction. Use forecastingService for model-based forecasts.'
    };
  }

  /**
   * Generate heuristic-based promotion suggestions
   * @returns {Object} - Suggestions with source='heuristic' and warning
   */
  generatePromotionSuggestions(promotionData) {
    const {
      _productId,
      currentPrice,
      proposedPrice,
      category,
      duration = 14
    } = promotionData;

    const discountPercentage = ((currentPrice - proposedPrice) / currentPrice) * 100;
    const baselineUplift = this.calculateBaselineUplift(discountPercentage, category);

    // Generate alternative promotion scenarios
    const scenarios = [
      {
        name: 'Conservative',
        discount: Math.max(5, discountPercentage * 0.7),
        expectedUplift: baselineUplift * 0.8,
        confidence: 85
      },
      {
        name: 'Moderate',
        discount: discountPercentage,
        expectedUplift: baselineUplift,
        confidence: 75
      },
      {
        name: 'Aggressive',
        discount: Math.min(50, discountPercentage * 1.3),
        expectedUplift: baselineUplift * 1.4,
        confidence: 65
      }
    ];

    return {
      scenarios: scenarios.map((scenario) => ({
        ...scenario,
        recommendedPrice: currentPrice * (1 - scenario.discount / 100),
        estimatedRevenue: this.estimateRevenue(currentPrice, scenario.discount, scenario.expectedUplift, duration)
      })),
      recommendations: this.generateRecommendations(discountPercentage, category, baselineUplift),
      // D-09: Honest labeling
      source: 'heuristic',
      warning: 'Not a trained ML prediction. Use forecastingService for model-based forecasts.'
    };
  }

  /**
     * Calculate baseline uplift based on discount and category
     */
  calculateBaselineUplift(discountPercentage, category) {
    // Category multipliers
    const categoryFactors = {
      'Food & Beverage': 1.2,
      'Personal Care': 1.0,
      'Household': 0.9,
      'Health & Beauty': 1.1,
      'default': 1.0
    };

    const categoryFactor = categoryFactors[category] || categoryFactors.default;

    // Base formula: uplift increases with discount, but with diminishing returns
    const baseUplift = Math.sqrt(discountPercentage) * 3.5 * categoryFactor;

    return Math.round(baseUplift * 10) / 10;
  }

  /**
     * Calculate confidence score
     */
  calculateConfidence(expectedUplift, predictedUplift, historicalAverage) {
    const deviation = Math.abs(expectedUplift - predictedUplift) / predictedUplift;
    const historicalDeviation = Math.abs(expectedUplift - historicalAverage) / historicalAverage;

    const confidence = Math.max(0, Math.min(100, 100 - (deviation * 100 + historicalDeviation * 50) / 2));

    return Math.round(confidence);
  }

  /**
     * Estimate revenue for a promotion scenario
     */
  estimateRevenue(currentPrice, discountPercentage, uplift, duration) {
    const promotionPrice = currentPrice * (1 - discountPercentage / 100);
    const baseVolume = 100; // Baseline units per day
    const promotionVolume = baseVolume * (1 + uplift / 100);

    return Math.round(promotionPrice * promotionVolume * duration);
  }

  /**
     * Generate recommendations based on promotion parameters
     */
  generateRecommendations(discountPercentage, category, baselineUplift) {
    const recommendations = [];

    if (discountPercentage < 10) {
      recommendations.push({
        type: 'warning',
        message: 'Low discount may not generate significant interest. Consider 10-15% for better visibility.'
      });
    }

    if (discountPercentage > 40) {
      recommendations.push({
        type: 'warning',
        message: 'High discount may impact profit margins. Consider reducing to 25-35% range.'
      });
    }

    if (baselineUplift > 30) {
      recommendations.push({
        type: 'success',
        message: 'Strong uplift potential detected. Consider extending promotion duration.'
      });
    }

    recommendations.push({
      type: 'info',
      message: `Historical data suggests ${Math.round(baselineUplift)}% uplift is achievable for ${category} products.`
    });

    return recommendations;
  }
}

module.exports = AIPromotionValidationService;
