/**
 * ML Service Unit Tests
 * Tests for the ML service client that communicates with Python ML service
 */

const axios = require('axios');
const MLService = require('../../../services/mlService');

// Mock axios
jest.mock('axios');

describe('ML Service Unit Tests', () => {
  let mockAxiosInstance;
  let mlService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup axios mock
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn()
    };

    axios.create.mockReturnValue(mockAxiosInstance);

    // Create a new instance of MLService
    mlService = new MLService.constructor();
  });

  describe('healthCheck', () => {
    it('should return health status from ML service', async () => {
      const mockHealth = {
        status: 'healthy',
        models: {
          demand_forecasting: true,
          price_optimization: true
        },
        version: '1.0.0'
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockHealth });

      const result = await mlService.healthCheck();

      expect(result).toEqual(mockHealth);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
    });

    it('should return unavailable status on connection error', async () => {
      const error = new Error('ECONNREFUSED');
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await mlService.healthCheck();

      expect(result.status).toBe('unavailable');
      expect(result.error).toBe('ECONNREFUSED');
    });

    it('should handle timeout errors', async () => {
      const error = new Error('timeout of 30000ms exceeded');
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await mlService.healthCheck();

      expect(result.status).toBe('unavailable');
      expect(result.error).toContain('timeout');
    });
  });

  describe('forecastDemand', () => {
    const validParams = {
      productId: 'PROD123',
      customerId: 'CUST456',
      horizonDays: 90,
      includePromotions: true
    };

    it('should successfully forecast demand', async () => {
      const mockForecast = {
        product_id: 'PROD123',
        forecast: [
          {
            date: '2025-11-08',
            predicted_volume: 1250,
            confidence_lower: 1100,
            confidence_upper: 1400
          }
        ],
        metrics: { mape: 8.5 }
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockForecast });

      const result = await mlService.forecastDemand(validParams);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockForecast);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/forecast/demand',
        {
          product_id: 'PROD123',
          customer_id: 'CUST456',
          horizon_days: 90,
          include_promotions: true,
          confidence_level: 0.95
        }
      );
    });

    it('should use default values for optional parameters', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { forecast: [] } });

      await mlService.forecastDemand({
        productId: 'PROD123',
        customerId: 'CUST456'
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/forecast/demand',
        expect.objectContaining({
          horizon_days: 90,
          include_promotions: true,
          confidence_level: 0.95
        })
      );
    });

    it('should return fallback forecast on error', async () => {
      const error = new Error('Model not loaded');
      mockAxiosInstance.post.mockRejectedValue(error);

      const result = await mlService.forecastDemand(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Model not loaded');
      expect(result.fallback).toHaveProperty('forecast');
      expect(result.fallback.warning).toBe('ML service unavailable');
    });

    it('should generate 90-day fallback forecast by default', async () => {
      const error = new Error('Service unavailable');
      mockAxiosInstance.post.mockRejectedValue(error);

      const result = await mlService.forecastDemand(validParams);

      expect(result.fallback.forecast).toHaveLength(90);
      expect(result.fallback.forecast[0]).toHaveProperty('date');
      expect(result.fallback.forecast[0]).toHaveProperty('predicted_volume');
      expect(result.fallback.forecast[0]).toHaveProperty('confidence_lower');
      expect(result.fallback.forecast[0]).toHaveProperty('confidence_upper');
    });
  });

  describe('optimizePrice', () => {
    const validParams = {
      productId: 'PROD123',
      currentPrice: 100,
      cost: 60,
      constraints: {
        minPrice: 70,
        maxPrice: 150
      }
    };

    it('should successfully optimize price', async () => {
      const mockOptimization = {
        product_id: 'PROD123',
        optimal_price: 120,
        current_price: 100,
        price_change_pct: 20,
        expected_impact: {
          volume_change_pct: -5.2,
          revenue_change_pct: 12.8,
          profit_change_pct: 25.4
        },
        confidence: 0.87
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockOptimization });

      const result = await mlService.optimizePrice(validParams);

      expect(result.success).toBe(true);
      expect(result.data.optimal_price).toBe(120);
    });

    it('should use default constraints if not provided', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      await mlService.optimizePrice({
        productId: 'PROD123',
        currentPrice: 100,
        cost: 60
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/optimize/price',
        expect.objectContaining({
          constraints: {
            min_price: 66, // cost * 1.1
            max_price: 150 // currentPrice * 1.5
          }
        })
      );
    });

    it('should return fallback pricing on error', async () => {
      const error = new Error('Optimization failed');
      mockAxiosInstance.post.mockRejectedValue(error);

      const result = await mlService.optimizePrice(validParams);

      expect(result.success).toBe(false);
      expect(result.fallback).toHaveProperty('optimal_price');
      expect(result.fallback).toHaveProperty('expected_impact');
      expect(result.fallback.warning).toBe('ML service unavailable');
    });

    it('should calculate fallback price based on cost', async () => {
      const error = new Error('Service unavailable');
      mockAxiosInstance.post.mockRejectedValue(error);

      const result = await mlService.optimizePrice({
        productId: 'PROD123',
        currentPrice: 100,
        cost: 60
      });

      // Fallback formula: cost / 0.6
      expect(result.fallback.optimal_price).toBe(100);
    });
  });

  describe('analyzePromotionLift', () => {
    const validParams = {
      promotionId: 'PROMO123',
      preStartDate: '2025-01-01',
      preEndDate: '2025-01-14',
      postStartDate: '2025-01-15',
      postEndDate: '2025-01-28'
    };

    it('should successfully analyze promotion lift', async () => {
      const mockAnalysis = {
        promotion_id: 'PROMO123',
        lift_metrics: {
          absolute_lift: 5200,
          percentage_lift: 28.5
        }
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockAnalysis });

      const result = await mlService.analyzePromotionLift(validParams);

      expect(result.success).toBe(true);
      expect(result.data.lift_metrics.percentage_lift).toBe(28.5);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/analyze/promotion-lift',
        {
          promotion_id: 'PROMO123',
          pre_period: {
            start_date: '2025-01-01',
            end_date: '2025-01-14'
          },
          post_period: {
            start_date: '2025-01-15',
            end_date: '2025-01-28'
          }
        }
      );
    });

    it('should not provide fallback for promotion lift analysis', async () => {
      const error = new Error('Analysis failed');
      mockAxiosInstance.post.mockRejectedValue(error);

      const result = await mlService.analyzePromotionLift(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Analysis failed');
      expect(result.fallback).toBeUndefined();
    });
  });

  describe('recommendProducts', () => {
    const validParams = {
      customerId: 'CUST456',
      context: { current_category: 'beverages' },
      topN: 10
    };

    it('should successfully recommend products', async () => {
      const mockRecommendations = {
        customer_id: 'CUST456',
        recommendations: [
          {
            product_id: 'PROD789',
            score: 0.92,
            reason: 'Frequently bought together'
          }
        ]
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockRecommendations });

      const result = await mlService.recommendProducts(validParams);

      expect(result.success).toBe(true);
      expect(result.data.recommendations).toHaveLength(1);
    });

    it('should use empty context and default topN', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { recommendations: [] } });

      await mlService.recommendProducts({ customerId: 'CUST456' });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/recommend/products',
        {
          customer_id: 'CUST456',
          context: {},
          top_n: 10
        }
      );
    });

    it('should return empty array as fallback', async () => {
      const error = new Error('Recommendations unavailable');
      mockAxiosInstance.post.mockRejectedValue(error);

      const result = await mlService.recommendProducts(validParams);

      expect(result.success).toBe(false);
      expect(result.fallback).toEqual([]);
    });
  });

  describe('Error Logging', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should log errors when ML service calls fail', async () => {
      const error = new Error('Connection refused');
      mockAxiosInstance.get.mockRejectedValue(error);

      await mlService.healthCheck();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ML service health check failed:',
        'Connection refused'
      );
    });

    it('should log forecast errors', async () => {
      const error = new Error('Forecast failed');
      mockAxiosInstance.post.mockRejectedValue(error);

      await mlService.forecastDemand({
        productId: 'PROD123',
        customerId: 'CUST456'
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Demand forecasting failed:',
        'Forecast failed'
      );
    });
  });
});
