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

  /**
   * Customer Segmentation
   */
  async segmentCustomers(params) {
    try {
      const response = await this.client.post('/api/v1/segment/customers', {
        method: params.method || 'rfm',
        tenant_id: params.tenant,
        start_date: params.startDate,
        end_date: params.endDate
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Customer segmentation failed:', error.message);
      return { success: false, error: error.message, fallback: this._generateFallbackSegmentation(params) };
    }
  }

  /**
   * Get Customer Segment
   */
  async getCustomerSegment(customerId) {
    try {
      const response = await this.client.get(`/api/v1/segment/customers/${customerId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get customer segment failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Anomaly Detection
   */
  async detectAnomalies(params) {
    try {
      const response = await this.client.post('/api/v1/detect/anomalies', {
        metric_type: params.metricType,
        tenant_id: params.tenant,
        start_date: params.startDate,
        end_date: params.endDate,
        threshold: params.threshold || 2.5
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Anomaly detection failed:', error.message);
      return { success: false, error: error.message, fallback: this._generateFallbackAnomalies(params) };
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

  _generateFallbackSegmentation(params) {
    const segments = [
      { name: 'Champions', count: 45, percentage: 15, avgRevenue: 85000, color: '#10b981' },
      { name: 'Loyal Customers', count: 62, percentage: 20.7, avgRevenue: 52000, color: '#3b82f6' },
      { name: 'Potential Loyalists', count: 38, percentage: 12.7, avgRevenue: 35000, color: '#8b5cf6' },
      { name: 'At Risk', count: 28, percentage: 9.3, avgRevenue: 42000, color: '#f59e0b' },
      { name: 'Need Attention', count: 127, percentage: 42.3, avgRevenue: 18000, color: '#6b7280' }
    ];

    return {
      method: params.method || 'rfm',
      totalCustomers: 300,
      segments,
      insights: [
        { type: 'warning', message: 'ML service unavailable, showing sample data' },
        { type: 'info', message: 'Champions segment represents 15% of customers' }
      ],
      warning: 'ML service unavailable - sample data shown'
    };
  }

  _generateFallbackAnomalies(params) {
    const today = new Date();
    const anomalies = [
      {
        id: 'anom_001',
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        metricType: params.metricType || 'sales',
        actualValue: 45000,
        expectedValue: 78000,
        deviation: -42.3,
        severity: 'high',
        description: 'Significant drop in daily sales'
      },
      {
        id: 'anom_002',
        date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        metricType: params.metricType || 'sales',
        actualValue: 125000,
        expectedValue: 80000,
        deviation: 56.3,
        severity: 'medium',
        description: 'Unusual spike in sales volume'
      }
    ];

    return {
      metricType: params.metricType || 'sales',
      detectedAnomalies: anomalies.length,
      anomalies,
      summary: {
        high: 1,
        medium: 1,
        low: 0
      },
      warning: 'ML service unavailable - sample data shown'
    };
  }
}

module.exports = new MLService();
