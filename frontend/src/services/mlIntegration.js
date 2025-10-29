/**
 * ML Integration Service - Connect to Backend ML/AI Services
 * Provides real predictions from ML models
 */

import axios from 'axios';

const ML_BASE_URL = process.env.REACT_APP_ML_URL || 'http://localhost:8001';
const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class MLIntegrationService {
  constructor() {
    this.mlClient = axios.create({
      baseURL: ML_BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.apiClient = axios.create({
      baseURL: BACKEND_URL,
      timeout: 10000
    });

    // Add auth token
    this.apiClient.interceptors.request.use(config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Customer Lifetime Value Prediction
   */
  async predictCustomerLTV(customerId, customerData = null) {
    try {
      const payload = customerData || { customer_id: customerId };
      const response = await this.mlClient.post('/predict/customer-ltv', payload);
      
      return {
        success: true,
        prediction: response.data.predicted_ltv || response.data.prediction,
        confidence: response.data.confidence || 0.85,
        factors: response.data.factors || {},
        recommendations: response.data.recommendations || []
      };
    } catch (error) {
      console.error('LTV prediction error:', error);
      return this.getFallbackLTVPrediction(customerData);
    }
  }

  /**
   * Product Demand Forecasting
   */
  async forecastProductDemand(productId, horizon = 30) {
    try {
      const response = await this.mlClient.post('/predict/demand-forecast', {
        product_id: productId,
        horizon_days: horizon
      });
      
      return {
        success: true,
        forecast: response.data.forecast || [],
        trend: response.data.trend || 'stable',
        confidence: response.data.confidence || 0.80,
        recommendations: response.data.recommendations || []
      };
    } catch (error) {
      console.error('Demand forecast error:', error);
      return this.getFallbackDemandForecast();
    }
  }

  /**
   * Promotion ROI Prediction
   */
  async predictPromotionROI(promotionData) {
    try {
      const response = await this.mlClient.post('/predict/promotion-roi', promotionData);
      
      return {
        success: true,
        predicted_roi: response.data.predicted_roi || response.data.roi,
        expected_revenue: response.data.expected_revenue,
        confidence: response.data.confidence || 0.82,
        optimization_tips: response.data.optimization_tips || []
      };
    } catch (error) {
      console.error('ROI prediction error:', error);
      return this.getFallbackROIPrediction(promotionData);
    }
  }

  /**
   * Budget Optimization
   */
  async optimizeBudgetAllocation(budgets, constraints = {}) {
    try {
      const response = await this.mlClient.post('/optimize/budget-allocation', {
        budgets,
        constraints
      });
      
      return {
        success: true,
        optimized_allocation: response.data.allocation || [],
        expected_roi_improvement: response.data.improvement || 0,
        recommendations: response.data.recommendations || []
      };
    } catch (error) {
      console.error('Budget optimization error:', error);
      return this.getFallbackBudgetOptimization(budgets);
    }
  }

  /**
   * Customer Churn Prediction
   */
  async predictChurn(customerId, customerData = null) {
    try {
      const payload = customerData || { customer_id: customerId };
      const response = await this.mlClient.post('/predict/customer-churn', payload);
      
      return {
        success: true,
        churn_probability: response.data.churn_probability || response.data.probability,
        risk_level: response.data.risk_level || 'low',
        factors: response.data.factors || [],
        retention_actions: response.data.retention_actions || []
      };
    } catch (error) {
      console.error('Churn prediction error:', error);
      return this.getFallbackChurnPrediction(customerData);
    }
  }

  /**
   * Price Optimization
   */
  async optimizePrice(productId, productData = null) {
    try {
      const payload = productData || { product_id: productId };
      const response = await this.mlClient.post('/optimize/price', payload);
      
      return {
        success: true,
        optimal_price: response.data.optimal_price || response.data.price,
        current_price: response.data.current_price,
        expected_impact: response.data.impact || {},
        confidence: response.data.confidence || 0.78
      };
    } catch (error) {
      console.error('Price optimization error:', error);
      return this.getFallbackPriceOptimization(productData);
    }
  }

  /**
   * Trade Spend Effectiveness Analysis
   */
  async analyzeTradeSpendEffectiveness(tradeSpendData) {
    try {
      const response = await this.mlClient.post('/analyze/tradespend-effectiveness', tradeSpendData);
      
      return {
        success: true,
        effectiveness_score: response.data.score || 0,
        roi_prediction: response.data.roi || 0,
        optimization_suggestions: response.data.suggestions || []
      };
    } catch (error) {
      console.error('Trade spend analysis error:', error);
      return this.getFallbackTradeSpendAnalysis(tradeSpendData);
    }
  }

  /**
   * Get ML Model Status
   */
  async getMLStatus() {
    try {
      const response = await this.mlClient.get('/health');
      return {
        available: true,
        models: response.data.models || [],
        version: response.data.version || '1.0'
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  // ============ FALLBACK PREDICTIONS (Rule-based) ============

  getFallbackLTVPrediction(customerData) {
    const baseRevenue = customerData?.totalRevenue || 50000;
    const growth = customerData?.salesGrowth || 10;
    const predicted_ltv = baseRevenue * (1 + growth / 100) * 3; // 3-year projection

    return {
      success: false,
      usingFallback: true,
      prediction: predicted_ltv,
      confidence: 0.60,
      factors: { base_revenue: baseRevenue, growth_rate: growth },
      recommendations: [
        'Increase engagement to boost LTV',
        'Offer loyalty programs for retention'
      ]
    };
  }

  getFallbackDemandForecast() {
    const forecast = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      demand: Math.floor(100 + Math.random() * 50)
    }));

    return {
      success: false,
      usingFallback: true,
      forecast,
      trend: 'stable',
      confidence: 0.55,
      recommendations: ['Monitor inventory levels', 'Adjust orders based on trends']
    };
  }

  getFallbackROIPrediction(promotionData) {
    const discount = promotionData?.discount || 10;
    const baseROI = 150 - (discount * 2); // Simple heuristic

    return {
      success: false,
      usingFallback: true,
      predicted_roi: baseROI,
      expected_revenue: promotionData?.budget * (baseROI / 100) || 0,
      confidence: 0.50,
      optimization_tips: [
        'Test different discount levels',
        'Target high-value customer segments'
      ]
    };
  }

  getFallbackBudgetOptimization(budgets) {
    return {
      success: false,
      usingFallback: true,
      optimized_allocation: budgets,
      expected_roi_improvement: 15,
      recommendations: [
        'Redirect funds from low-performing to high-performing categories',
        'Monitor utilization rates closely'
      ]
    };
  }

  getFallbackChurnPrediction(customerData) {
    const salesGrowth = customerData?.salesGrowth || 0;
    const probability = salesGrowth < -15 ? 0.75 : salesGrowth < 0 ? 0.45 : 0.15;

    return {
      success: false,
      usingFallback: true,
      churn_probability: probability,
      risk_level: probability > 0.6 ? 'high' : probability > 0.3 ? 'medium' : 'low',
      factors: ['Revenue trend', 'Engagement level'],
      retention_actions: [
        'Schedule customer review meeting',
        'Offer exclusive promotion',
        'Improve service quality'
      ]
    };
  }

  getFallbackPriceOptimization(productData) {
    const currentPrice = productData?.price || 100;
    const margin = productData?.margin || 30;
    const optimal = margin < 20 ? currentPrice * 1.10 : currentPrice;

    return {
      success: false,
      usingFallback: true,
      optimal_price: optimal,
      current_price: currentPrice,
      expected_impact: {
        revenue_change: '+8%',
        volume_change: '-2%'
      },
      confidence: 0.55
    };
  }

  getFallbackTradeSpendAnalysis(tradeSpendData) {
    const roi = tradeSpendData?.roi || 100;
    const score = Math.min(100, roi);

    return {
      success: false,
      usingFallback: true,
      effectiveness_score: score,
      roi_prediction: roi,
      optimization_suggestions: [
        'Focus on high-ROI channels',
        'Reduce spend in underperforming areas',
        'Test alternative strategies'
      ]
    };
  }
}

// Export singleton
export const mlIntegration = new MLIntegrationService();
export default mlIntegration;
