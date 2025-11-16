/**
 * ML Service - Frontend integration with trained ML models
 * 
 * This service connects to the FastAPI ML serving layer (port 8001)
 * which hosts our 4 production-trained models:
 * - Demand Forecasting (10.54% MAPE accuracy)
 * - Price Optimization (-1.499 elasticity)
 * - Promotion Lift Analysis (21.6% avg lift)
 * - Product Recommendations (34 interactions)
 */

import axios from 'axios';

// ML API base URL (can be configured via environment variable)
const ML_API_BASE_URL = process.env.REACT_APP_ML_API_URL || 'http://localhost:8001';
const ML_API_VERSION = '/api/v1';

// Create axios instance for ML API
const mlApi = axios.create({
  baseURL: `${ML_API_BASE_URL}${ML_API_VERSION}`,
  timeout: 30000, // 30 seconds for ML predictions
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for logging
mlApi.interceptors.request.use(
  (config) => {
    console.log(`[ML API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('[ML API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
mlApi.interceptors.response.use(
  (response) => {
    console.log(`[ML API] Response from ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    console.error('[ML API] Response error:', error.response?.data || error.message);
    
    // Return a fallback response for better UX
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      return {
        data: {
          error: 'ML service unavailable',
          message: 'The ML API is not responding. Please ensure it is running on port 8001.',
          fallback: true
        }
      };
    }
    
    return Promise.reject(error);
  }
);

/**
 * Health Check - Verify ML API is running
 */
export const checkMLHealth = async () => {
  try {
    const response = await axios.get(`${ML_API_BASE_URL}/health`);
    return {
      success: true,
      data: response.data,
      message: 'ML API is healthy'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'ML API is not accessible'
    };
  }
};

/**
 * Demand Forecasting - Predict future demand for a product
 * 
 * @param {Object} params - Forecast parameters
 * @param {string} params.productId - Product identifier
 * @param {string} params.customerId - Customer identifier
 * @param {number} params.horizonDays - Forecast horizon in days (default: 90)
 * @param {boolean} params.includeConfidence - Include confidence intervals (default: true)
 * @param {Object} params.features - Additional features (optional)
 * @returns {Promise<Object>} Forecast results
 */
export const forecastDemand = async (params) => {
  try {
    const payload = {
      product_id: params.productId || 'prod-001',
      customer_id: params.customerId || 'cust-001',
      horizon_days: params.horizonDays || 90,
      include_confidence: params.includeConfidence !== false,
      features: params.features || {}
    };

    const response = await mlApi.post('/forecast/demand', payload);
    
    if (response.data.fallback) {
      // Return mock data if ML API is unavailable
      return generateMockForecast(params);
    }
    
    return {
      success: true,
      data: response.data,
      model: 'demand_forecasting_v1',
      accuracy: '10.54% MAPE'
    };
  } catch (error) {
    console.error('Demand forecasting error:', error);
    return generateMockForecast(params);
  }
};

/**
 * Price Optimization - Find optimal price point
 * 
 * @param {Object} params - Pricing parameters
 * @param {string} params.productId - Product identifier
 * @param {number} params.currentPrice - Current price
 * @param {number} params.cost - Product cost
 * @param {Object} params.constraints - Price constraints (min, max)
 * @param {string} params.objective - Optimization objective ('revenue' or 'profit')
 * @returns {Promise<Object>} Optimal price recommendation
 */
export const optimizePrice = async (params) => {
  try {
    const payload = {
      product_id: params.productId || 'prod-001',
      current_price: params.currentPrice || 15.99,
      cost: params.cost || 10.00,
      constraints: params.constraints || {
        min_price: params.currentPrice * 0.8,
        max_price: params.currentPrice * 1.2
      },
      objective: params.objective || 'profit'
    };

    const response = await mlApi.post('/optimize/price', payload);
    
    if (response.data.fallback) {
      return generateMockPriceOptimization(params);
    }
    
    return {
      success: true,
      data: response.data,
      model: 'price_optimization_v1',
      elasticity: '-1.499'
    };
  } catch (error) {
    console.error('Price optimization error:', error);
    return generateMockPriceOptimization(params);
  }
};

/**
 * Promotion Lift Analysis - Analyze promotion effectiveness
 * 
 * @param {Object} params - Promotion parameters
 * @param {string} params.promotionId - Promotion identifier
 * @param {Object} params.prePeriod - Pre-promotion period (start_date, end_date)
 * @param {Object} params.postPeriod - Post-promotion period (start_date, end_date)
 * @param {Array} params.products - Products in promotion (optional)
 * @returns {Promise<Object>} Promotion lift analysis
 */
export const analyzePromotionLift = async (params) => {
  try {
    const payload = {
      promotion_id: params.promotionId || 'promo-2024-q4',
      pre_period: params.prePeriod || {
        start_date: '2024-10-01',
        end_date: '2024-11-14'
      },
      post_period: params.postPeriod || {
        start_date: '2024-11-15',
        end_date: '2024-12-31'
      },
      products: params.products || []
    };

    const response = await mlApi.post('/analyze/promotion-lift', payload);
    
    if (response.data.fallback) {
      return generateMockPromotionAnalysis(params);
    }
    
    return {
      success: true,
      data: response.data,
      model: 'promotion_lift_v1',
      avgLift: '21.6%'
    };
  } catch (error) {
    console.error('Promotion lift analysis error:', error);
    return generateMockPromotionAnalysis(params);
  }
};

/**
 * Product Recommendations - Get personalized product recommendations
 * 
 * @param {Object} params - Recommendation parameters
 * @param {string} params.customerId - Customer identifier
 * @param {Object} params.context - Contextual information (season, promotions, etc.)
 * @param {number} params.topN - Number of recommendations (default: 5)
 * @returns {Promise<Object>} Product recommendations
 */
export const getProductRecommendations = async (params) => {
  try {
    const payload = {
      customer_id: params.customerId || 'cust-001',
      context: params.context || {
        season: 'summer',
        current_promotions: []
      },
      topN: params.topN || 5
    };

    const response = await mlApi.post('/recommend/products', payload);
    
    if (response.data.fallback) {
      return generateMockRecommendations(params);
    }
    
    return {
      success: true,
      data: response.data,
      model: 'recommendations_v1',
      interactions: '34'
    };
  } catch (error) {
    console.error('Product recommendations error:', error);
    return generateMockRecommendations(params);
  }
};

/**
 * Batch Predictions - Get multiple predictions in one call
 * 
 * @param {Array} requests - Array of prediction requests
 * @returns {Promise<Object>} Batch prediction results
 */
export const batchPredict = async (requests) => {
  try {
    const predictions = await Promise.all(
      requests.map(async (req) => {
        switch (req.type) {
          case 'forecast':
            return await forecastDemand(req.params);
          case 'price':
            return await optimizePrice(req.params);
          case 'promotion':
            return await analyzePromotionLift(req.params);
          case 'recommendations':
            return await getProductRecommendations(req.params);
          default:
            throw new Error(`Unknown prediction type: ${req.type}`);
        }
      })
    );

    return {
      success: true,
      data: predictions,
      count: predictions.length
    };
  } catch (error) {
    console.error('Batch prediction error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================================================
// MOCK DATA GENERATORS (Fallback when ML API is unavailable)
// ============================================================================

function generateMockForecast(params) {
  const days = params.horizonDays || 90;
  const baseValue = 1000;
  
  const predictions = Array.from({ length: days }, (_, i) => {
    const trend = i * 2;
    const seasonality = Math.sin((i / 7) * Math.PI) * 100;
    const noise = (Math.random() - 0.5) * 50;
    const value = baseValue + trend + seasonality + noise;
    
    return {
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      predicted_demand: Math.max(0, Math.round(value)),
      lower_bound: Math.max(0, Math.round(value * 0.9)),
      upper_bound: Math.round(value * 1.1)
    };
  });

  return {
    success: true,
    data: {
      predictions,
      metadata: {
        product_id: params.productId,
        customer_id: params.customerId,
        horizon_days: days,
        model_version: 'mock',
        accuracy_estimate: 0.1054,
        generated_at: new Date().toISOString()
      }
    },
    model: 'mock_forecast',
    isMock: true
  };
}

function generateMockPriceOptimization(params) {
  const currentPrice = params.currentPrice || 15.99;
  const cost = params.cost || 10.00;
  const optimalPrice = currentPrice * 1.08; // 8% increase
  
  return {
    success: true,
    data: {
      optimal_price: parseFloat(optimalPrice.toFixed(2)),
      current_price: currentPrice,
      price_change: parseFloat((optimalPrice - currentPrice).toFixed(2)),
      price_change_pct: parseFloat(((optimalPrice - currentPrice) / currentPrice * 100).toFixed(2)),
      expected_demand_change: -8.0, // -8% demand at +8% price (elasticity ~1)
      expected_revenue_change: 5.2, // +5.2% revenue
      expected_profit_change: 12.5, // +12.5% profit
      confidence_score: 0.85,
      elasticity: -1.499,
      metadata: {
        product_id: params.productId,
        cost,
        current_margin: ((currentPrice - cost) / currentPrice * 100).toFixed(1),
        optimal_margin: ((optimalPrice - cost) / optimalPrice * 100).toFixed(1),
        model_version: 'mock',
        generated_at: new Date().toISOString()
      }
    },
    model: 'mock_pricing',
    isMock: true
  };
}

function generateMockPromotionAnalysis(params) {
  return {
    success: true,
    data: {
      promotion_id: params.promotionId,
      lift_pct: 21.6,
      incremental_sales: 45600,
      incremental_revenue: 729600,
      roi: 3.73,
      baseline_sales: 211000,
      promoted_sales: 256600,
      cost_of_promotion: 195600,
      net_profit: 534000,
      confidence_interval: {
        lower: 18.2,
        upper: 25.0
      },
      by_product: [
        { product: 'Cadbury Dairy Milk 80g', lift_pct: 28.5, incremental_units: 12000 },
        { product: 'Oreo Original 120g', lift_pct: 19.3, incremental_units: 8500 },
        { product: 'Halls Menthol 33.5g', lift_pct: 16.8, incremental_units: 6200 }
      ],
      metadata: {
        pre_period: params.prePeriod,
        post_period: params.postPeriod,
        model_version: 'mock',
        generated_at: new Date().toISOString()
      }
    },
    model: 'mock_promotion',
    isMock: true
  };
}

function generateMockRecommendations(params) {
  const recommendations = [
    { product_id: 'prod-001', product_name: 'Cadbury Dairy Milk 80g', score: 0.92, reason: 'High historical purchase rate' },
    { product_id: 'prod-003', product_name: 'Oreo Original 120g', score: 0.87, reason: 'Frequently bought together' },
    { product_id: 'prod-005', product_name: 'Halls Menthol 33.5g', score: 0.81, reason: 'Seasonal preference match' },
    { product_id: 'prod-007', product_name: 'Cadbury Lunch Bar 48g', score: 0.76, reason: 'Similar category affinity' },
    { product_id: 'prod-009', product_name: 'Stimorol Ice 14g', score: 0.71, reason: 'Trending in similar customers' }
  ].slice(0, params.topN || 5);

  return {
    success: true,
    data: {
      recommendations,
      customer_id: params.customerId,
      context: params.context,
      metadata: {
        model_version: 'mock',
        algorithm: 'collaborative_filtering',
        total_interactions: 34,
        generated_at: new Date().toISOString()
      }
    },
    model: 'mock_recommendations',
    isMock: true
  };
}

// Export all functions
const mlService = {
  checkMLHealth,
  forecastDemand,
  optimizePrice,
  analyzePromotionLift,
  getProductRecommendations,
  batchPredict
};
export default mlService;
