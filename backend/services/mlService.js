/**
 * ML Service Integration
 * 
 * Connects Node.js backend to Python ML services
 * Provides REST API endpoints for AI features
 */

const axios = require('axios');

// ML Service Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';
const ML_SERVICE_TIMEOUT = parseInt(process.env.ML_SERVICE_TIMEOUT || '30000');

class MLService {
  constructor() {
    this.client = axios.create({
      baseURL: ML_SERVICE_URL,
      timeout: ML_SERVICE_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Check if ML service is available
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('ML service health check failed:', error.message);
      return { status: 'unavailable', error: error.message };
    }
  }

  /**
   * Demand Forecasting
   */
  async forecastDemand(params) {
    try {
      const response = await this.client.post('/api/v1/forecast/demand', {
        product_id: params.productId,
        customer_id: params.customerId,
        horizon_days: params.horizonDays || 90,
        include_promotions: params.includePromotions !== false,
        confidence_level: params.confidenceLevel || 0.95
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Demand forecasting failed:', error.message);
      return { success: false, error: error.message, fallback: this._generateFallbackForecast(params) };
    }
  }

  /**
   * Price Optimization
   */
  async optimizePrice(params) {
    try {
      const response = await this.client.post('/api/v1/optimize/price', {
        product_id: params.productId,
        current_price: params.currentPrice,
        cost: params.cost,
        constraints: {
          min_price: params.constraints?.minPrice || params.cost * 1.1,
          max_price: params.constraints?.maxPrice || params.currentPrice * 1.5
        },
        optimization_objective: params.optimizationObjective || 'profit'
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Price optimization failed:', error.message);
      return { success: false, error: error.message, fallback: this._generateFallbackPriceOptimization(params) };
    }
  }

  /**
   * Promotion Lift Analysis
   */
  async analyzePromotionLift(params) {
    try {
      const response = await this.client.post('/api/v1/analyze/promotion-lift', {
        promotion_id: params.promotionId,
        pre_period: {
          start_date: params.preStartDate,
          end_date: params.preEndDate
        },
        post_period: {
          start_date: params.postStartDate,
          end_date: params.postEndDate
        }
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Promotion lift analysis failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Product Recommendations
   */
  async recommendProducts(params) {
    try {
      const response = await this.client.post('/api/v1/recommend/products', {
        customer_id: params.customerId,
        context: params.context || {},
        top_n: params.topN || 10
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Product recommendations failed:', error.message);
      return { success: false, error: error.message, fallback: [] };
    }
  }

  _generateFallbackForecast(params) {
    const forecast = [];
    const baseValue = 1000;
    const horizonDays = params.horizonDays || 90;
    
    for (let i = 0; i < horizonDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const trend = 1 + (i / horizonDays) * 0.1;
      const seasonal = 1 + Math.sin((i / 7) * Math.PI * 2) * 0.1;
      const value = Math.round(baseValue * trend * seasonal);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        predicted_volume: value,
        confidence_lower: Math.round(value * 0.85),
        confidence_upper: Math.round(value * 1.15)
      });
    }
    
    return { forecast, accuracy_estimate: 0.25, model_version: 'fallback', warning: 'ML service unavailable' };
  }

  _generateFallbackPriceOptimization(params) {
    const optimalPrice = params.cost / 0.6;
    const priceChange = ((optimalPrice - params.currentPrice) / params.currentPrice) * 100;
    
    return {
      optimal_price: Math.round(optimalPrice * 100) / 100,
      current_price: params.currentPrice,
      price_change_pct: Math.round(priceChange * 100) / 100,
      expected_impact: { volume_change_pct: -2.0, revenue_change_pct: 1.0, profit_change_pct: 5.0 },
      confidence: 0.5,
      warning: 'ML service unavailable'
    };
  }
}

module.exports = new MLService();
