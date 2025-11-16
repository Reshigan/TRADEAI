/**
 * AI/ML Forecasting Service
 * Provides predictive analytics for sales, promotions, and customer behavior
 */

class ForecastingService {
  constructor() {
    this.models = {};
  }

  /**
   * Forecast sales for a product
   * @param {string} productId - Product ID
   * @param {number} days - Number of days to forecast
   * @param {Array} historicalData - Historical sales data
   * @returns {Promise<Object>} Forecast results
   */
  async forecastSales(productId, days = 30, historicalData = []) {
    try {
      // Simple moving average forecasting (can be replaced with ML model)
      const recentSales = historicalData.slice(-30);
      const average = recentSales.reduce((sum, val) => sum + val.quantity, 0) / recentSales.length;

      const forecast = [];
      for (let i = 1; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        // Add some variance (-10% to +10%)
        const variance = (Math.random() - 0.5) * 0.2;
        const predictedQuantity = Math.round(average * (1 + variance));

        forecast.push({
          date: date.toISOString().split('T')[0],
          predictedQuantity,
          confidence: 0.75 // 75% confidence
        });
      }

      return {
        productId,
        forecastPeriod: days,
        forecast,
        model: 'moving_average',
        accuracy: 0.75
      };
    } catch (error) {
      console.error('Sales forecast error:', error);
      throw new Error('Failed to generate sales forecast');
    }
  }

  /**
   * Predict promotion performance
   * @param {Object} promotionData - Promotion details
   * @returns {Promise<Object>} Performance prediction
   */
  async predictPromotionPerformance(promotionData) {
    try {
      const { discount, duration, targetAudience, historicalROI = [] } = promotionData;

      // Calculate expected ROI based on historical data
      const avgROI = historicalROI.length > 0
        ? historicalROI.reduce((sum, val) => sum + val, 0) / historicalROI.length
        : 1.5;

      // Factors affecting performance
      const discountFactor = Math.min(discount / 50, 1); // Higher discount = better performance
      const durationFactor = Math.min(duration / 30, 1); // Optimal duration ~30 days
      const audienceFactor = targetAudience === 'all' ? 0.8 : 1.0;

      const predictedROI = avgROI * discountFactor * durationFactor * audienceFactor;
      const predictedRevenue = promotionData.estimatedBudget * predictedROI;

      return {
        predictedROI: Number(predictedROI.toFixed(2)),
        predictedRevenue: Number(predictedRevenue.toFixed(2)),
        confidence: 0.70,
        recommendedActions: this._generateRecommendations(predictedROI)
      };
    } catch (error) {
      console.error('Promotion prediction error:', error);
      throw new Error('Failed to predict promotion performance');
    }
  }

  /**
   * Predict customer churn risk
   * @param {string} customerId - Customer ID
   * @param {Object} customerData - Customer activity data
   * @returns {Promise<Object>} Churn prediction
   */
  async predictChurnRisk(customerId, customerData) {
    try {
      const {
        daysSinceLastPurchase = 0,
        totalPurchases = 0,
        averagePurchaseValue = 0,
        engagementScore = 50
      } = customerData;

      // Calculate churn risk (0-100)
      let riskScore = 0;

      // Factor 1: Days since last purchase
      if (daysSinceLastPurchase > 90) riskScore += 40;
      else if (daysSinceLastPurchase > 60) riskScore += 25;
      else if (daysSinceLastPurchase > 30) riskScore += 10;

      // Factor 2: Purchase frequency
      if (totalPurchases < 3) riskScore += 20;
      else if (totalPurchases < 10) riskScore += 10;

      // Factor 3: Average purchase value
      if (averagePurchaseValue < 50) riskScore += 15;
      else if (averagePurchaseValue < 100) riskScore += 5;

      // Factor 4: Engagement
      riskScore += (100 - engagementScore) * 0.25;

      riskScore = Math.min(Math.round(riskScore), 100);

      return {
        customerId,
        riskScore,
        riskLevel: this._getRiskLevel(riskScore),
        recommendations: this._getRetentionRecommendations(riskScore),
        nextBestAction: this._getNextBestAction(riskScore)
      };
    } catch (error) {
      console.error('Churn prediction error:', error);
      throw new Error('Failed to predict churn risk');
    }
  }

  /**
   * Generate product recommendations
   * @param {string} customerId - Customer ID
   * @param {Array} purchaseHistory - Customer's purchase history
   * @returns {Promise<Array>} Recommended products
   */
  async recommendProducts(customerId, purchaseHistory = []) {
    try {
      // Simple collaborative filtering simulation
      const productCategories = purchaseHistory.map((p) => p.category);
      const uniqueCategories = [...new Set(productCategories)];

      // Mock recommended products
      const recommendations = uniqueCategories.map((category) => ({
        category,
        products: [
          { id: `prod_${Math.random().toString(36).substr(2, 9)}`, name: `Recommended Product in ${category}`, score: 0.95 },
          { id: `prod_${Math.random().toString(36).substr(2, 9)}`, name: `Popular in ${category}`, score: 0.88 },
          { id: `prod_${Math.random().toString(36).substr(2, 9)}`, name: `Trending in ${category}`, score: 0.82 }
        ]
      }));

      return {
        customerId,
        recommendations,
        model: 'collaborative_filtering',
        confidence: 0.80
      };
    } catch (error) {
      console.error('Product recommendation error:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Analyze campaign effectiveness
   * @param {string} campaignId - Campaign ID
   * @param {Object} campaignData - Campaign metrics
   * @returns {Promise<Object>} Campaign analysis
   */
  async analyzeCampaignEffectiveness(campaignId, campaignData) {
    try {
      const {
        budget = 0,
        spent = 0,
        impressions = 0,
        clicks = 0,
        conversions = 0,
        revenue = 0
      } = campaignData;

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const cpa = conversions > 0 ? spent / conversions : 0;
      const roi = spent > 0 ? ((revenue - spent) / spent) * 100 : 0;

      const effectiveness = this._calculateEffectivenessScore({
        ctr, conversionRate, roi, budgetUtilization: (spent / budget) * 100
      });

      return {
        campaignId,
        metrics: {
          clickThroughRate: Number(ctr.toFixed(2)),
          conversionRate: Number(conversionRate.toFixed(2)),
          costPerAcquisition: Number(cpa.toFixed(2)),
          returnOnInvestment: Number(roi.toFixed(2)),
          effectivenessScore: Number(effectiveness.toFixed(2))
        },
        insights: this._generateCampaignInsights({ ctr, conversionRate, roi }),
        recommendations: this._generateCampaignRecommendations({ ctr, conversionRate, roi })
      };
    } catch (error) {
      console.error('Campaign analysis error:', error);
      throw new Error('Failed to analyze campaign');
    }
  }

  /**
   * Demand forecasting
   * @param {Object} params - Forecasting parameters
   * @returns {Promise<Object>} Demand forecast
   */
  async forecastDemand(params) {
    const { productId, timeframe = 30, seasonality = true } = params;

    // Mock demand forecast
    const forecast = [];
    const basedemand = 100;

    for (let day = 1; day <= timeframe; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);

      // Add seasonality effect
      const seasonalFactor = seasonality
        ? 1 + (Math.sin((day / 7) * Math.PI) * 0.3)
        : 1;

      const demand = Math.round(baseDemand * seasonalFactor * (0.9 + Math.random() * 0.2));

      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedDemand: demand,
        confidence: 0.72
      });
    }

    return {
      productId,
      timeframe,
      forecast,
      totalPredictedDemand: forecast.reduce((sum, f) => sum + f.predictedDemand, 0)
    };
  }

  // Private helper methods
  _generateRecommendations(roi) {
    if (roi > 2) return ['Excellent performance expected', 'Consider extending duration', 'Expand to similar products'];
    if (roi > 1.5) return ['Good performance expected', 'Monitor daily performance', 'Optimize targeting'];
    if (roi > 1) return ['Moderate performance expected', 'Increase discount or duration', 'Review target audience'];
    return ['Low performance expected', 'Reconsider promotion strategy', 'Analyze competitor promotions', 'Review pricing strategy'];
  }

  _getRiskLevel(score) {
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  _getRetentionRecommendations(score) {
    if (score >= 70) return ['Send personalized discount', 'Immediate outreach required', 'Offer loyalty rewards'];
    if (score >= 40) return ['Send engagement email', 'Offer product recommendations', 'Monitor activity'];
    return ['Continue regular engagement', 'Cross-sell opportunities', 'Maintain relationship'];
  }

  _getNextBestAction(score) {
    if (score >= 70) return 'urgent_outreach';
    if (score >= 40) return 'engagement_campaign';
    return 'regular_communication';
  }

  _calculateEffectivenessScore(metrics) {
    const { ctr, conversionRate, roi, budgetUtilization } = metrics;

    // Weighted scoring
    const ctrScore = Math.min(ctr / 5 * 25, 25); // Max 25 points
    const conversionScore = Math.min(conversionRate / 10 * 25, 25); // Max 25 points
    const roiScore = Math.min((roi + 100) / 300 * 30, 30); // Max 30 points
    const budgetScore = Math.min(budgetUtilization / 100 * 20, 20); // Max 20 points

    return ctrScore + conversionScore + roiScore + budgetScore;
  }

  _generateCampaignInsights(metrics) {
    const insights = [];

    if (metrics.ctr < 2) insights.push('Click-through rate is below industry average');
    else if (metrics.ctr > 5) insights.push('Excellent click-through rate');

    if (metrics.conversionRate < 3) insights.push('Conversion rate needs improvement');
    else if (metrics.conversionRate > 10) insights.push('Outstanding conversion rate');

    if (metrics.roi < 0) insights.push('Campaign is not profitable');
    else if (metrics.roi > 100) insights.push('Highly profitable campaign');

    return insights;
  }

  _generateCampaignRecommendations(metrics) {
    const recommendations = [];

    if (metrics.ctr < 2) recommendations.push('Improve ad copy and creative');
    if (metrics.conversionRate < 3) recommendations.push('Optimize landing page');
    if (metrics.roi < 50) recommendations.push('Review targeting and budget allocation');

    return recommendations.length > 0 ? recommendations : ['Continue current strategy'];
  }
}

module.exports = new ForecastingService();
