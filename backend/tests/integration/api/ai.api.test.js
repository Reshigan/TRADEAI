/**
 * AI/ML Routes Integration Tests
 * Tests for AI endpoints that proxy to ML service
 * 
 * Test Strategy:
 * 1. Mock the ML service responses
 * 2. Test request validation and error handling
 * 3. Test authentication requirements
 * 4. Test fallback behavior when ML service is unavailable
 * 5. Test proper transformation of data between Node.js and Python services
 */

const request = require('supertest');
const express = require('express');
const aiRoutes = require('../../../src/routes/ai');
const mlService = require('../../../services/mlService');

// Mock the ML service
jest.mock('../../../services/mlService');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock authentication middleware
  app.use((req, res, next) => {
    req.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      tenantId: 'test-tenant-id',
      role: 'admin'
    };
    next();
  });
  
  app.use('/api/ai', aiRoutes);
  
  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
  });
  
  return app;
};

describe('AI Routes Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/ai/health', () => {
    it('should return ML service health status', async () => {
      const mockHealth = {
        status: 'healthy',
        models: {
          demand_forecasting: true,
          price_optimization: true,
          promotion_lift: true,
          recommendations: true
        },
        version: '1.0.0'
      };

      mlService.healthCheck.mockResolvedValue(mockHealth);

      const response = await request(app)
        .get('/api/ai/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockHealth);
      expect(mlService.healthCheck).toHaveBeenCalledTimes(1);
    });

    it('should return unavailable status when ML service is down', async () => {
      const mockHealth = {
        status: 'unavailable',
        error: 'Connection timeout'
      };

      mlService.healthCheck.mockResolvedValue(mockHealth);

      const response = await request(app)
        .get('/api/ai/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.status).toBe('unavailable');
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/ai/forecast/demand', () => {
    const validRequest = {
      productId: 'PROD123',
      customerId: 'CUST456',
      horizonDays: 90,
      includePromotions: true
    };

    it('should successfully forecast demand with valid parameters', async () => {
      const mockForecast = {
        success: true,
        data: {
          product_id: 'PROD123',
          customer_id: 'CUST456',
          forecast: [
            {
              date: '2025-11-08',
              predicted_volume: 1250,
              confidence_lower: 1100,
              confidence_upper: 1400
            }
          ],
          metrics: {
            mape: 8.5,
            rmse: 125.3
          },
          model_version: 'v1.2.0'
        }
      };

      mlService.forecastDemand.mockResolvedValue(mockForecast);

      const response = await request(app)
        .post('/api/ai/forecast/demand')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockForecast.data);
      expect(mlService.forecastDemand).toHaveBeenCalledWith({
        productId: 'PROD123',
        customerId: 'CUST456',
        horizonDays: 90,
        includePromotions: true
      });
    });

    it('should return fallback data when ML service fails', async () => {
      const mockFailure = {
        success: false,
        error: 'Model not loaded',
        fallback: {
          forecast: [
            {
              date: '2025-11-08',
              predicted_volume: 1000,
              confidence_lower: 850,
              confidence_upper: 1150
            }
          ],
          accuracy_estimate: 0.25,
          model_version: 'fallback',
          warning: 'ML service unavailable'
        }
      };

      mlService.forecastDemand.mockResolvedValue(mockFailure);

      const response = await request(app)
        .post('/api/ai/forecast/demand')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('forecast');
      expect(response.body).toHaveProperty('error');
      expect(response.body.usingFallback).toBe(true);
      expect(response.body.warning).toBe('ML service unavailable');
    });

    it('should return 400 for missing productId', async () => {
      const response = await request(app)
        .post('/api/ai/forecast/demand')
        .send({ customerId: 'CUST456' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toContain('productId and customerId required');
      expect(mlService.forecastDemand).not.toHaveBeenCalled();
    });

    it('should return 400 for missing customerId', async () => {
      const response = await request(app)
        .post('/api/ai/forecast/demand')
        .send({ productId: 'PROD123' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toContain('productId and customerId required');
      expect(mlService.forecastDemand).not.toHaveBeenCalled();
    });

    it('should use default values for optional parameters', async () => {
      const mockForecast = {
        success: true,
        data: { forecast: [] }
      };

      mlService.forecastDemand.mockResolvedValue(mockForecast);

      await request(app)
        .post('/api/ai/forecast/demand')
        .send({ productId: 'PROD123', customerId: 'CUST456' })
        .expect(200);

      expect(mlService.forecastDemand).toHaveBeenCalledWith({
        productId: 'PROD123',
        customerId: 'CUST456',
        horizonDays: undefined,
        includePromotions: undefined
      });
    });
  });

  describe('POST /api/ai/optimize/price', () => {
    const validRequest = {
      productId: 'PROD123',
      currentPrice: 100,
      cost: 60,
      constraints: {
        minPrice: 70,
        maxPrice: 150
      }
    };

    it('should successfully optimize price with valid parameters', async () => {
      const mockOptimization = {
        success: true,
        data: {
          product_id: 'PROD123',
          optimal_price: 120,
          current_price: 100,
          price_change_pct: 20,
          expected_impact: {
            volume_change_pct: -5.2,
            revenue_change_pct: 12.8,
            profit_change_pct: 25.4
          },
          confidence: 0.87,
          model_version: 'v1.2.0'
        }
      };

      mlService.optimizePrice.mockResolvedValue(mockOptimization);

      const response = await request(app)
        .post('/api/ai/optimize/price')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockOptimization.data);
      expect(response.body.optimal_price).toBe(120);
      expect(mlService.optimizePrice).toHaveBeenCalledWith(validRequest);
    });

    it('should return 400 for missing required parameters', async () => {
      const response = await request(app)
        .post('/api/ai/optimize/price')
        .send({ productId: 'PROD123' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toContain('productId, currentPrice, and cost required');
    });

    it('should handle ML service failure with fallback', async () => {
      const mockFailure = {
        success: false,
        error: 'Model error',
        fallback: {
          optimal_price: 110,
          confidence: 0.5,
          warning: 'ML service unavailable'
        }
      };

      mlService.optimizePrice.mockResolvedValue(mockFailure);

      const response = await request(app)
        .post('/api/ai/optimize/price')
        .send(validRequest)
        .expect(200);

      expect(response.body).toHaveProperty('optimal_price');
      expect(response.body.usingFallback).toBe(true);
    });
  });

  describe('POST /api/ai/analyze/promotion-lift', () => {
    const validRequest = {
      promotionId: 'PROMO123',
      preStartDate: '2025-01-01',
      preEndDate: '2025-01-14',
      postStartDate: '2025-01-15',
      postEndDate: '2025-01-28'
    };

    it('should successfully analyze promotion lift', async () => {
      const mockAnalysis = {
        success: true,
        data: {
          promotion_id: 'PROMO123',
          lift_metrics: {
            absolute_lift: 5200,
            percentage_lift: 28.5,
            incremental_revenue: 156000
          },
          pre_period: {
            avg_daily_sales: 18250,
            total_sales: 255500
          },
          post_period: {
            avg_daily_sales: 23450,
            total_sales: 328300
          },
          statistical_significance: {
            p_value: 0.003,
            is_significant: true,
            confidence_level: 0.99
          }
        }
      };

      mlService.analyzePromotionLift.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/api/ai/analyze/promotion-lift')
        .send(validRequest)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockAnalysis.data);
      expect(response.body.lift_metrics.percentage_lift).toBe(28.5);
    });

    it('should return 400 for missing date parameters', async () => {
      const response = await request(app)
        .post('/api/ai/analyze/promotion-lift')
        .send({ promotionId: 'PROMO123' })
        .expect(400);

      expect(response.body.error).toContain('All date parameters required');
    });

    it('should return 500 when ML service fails without fallback', async () => {
      const mockFailure = {
        success: false,
        error: 'Analysis failed'
      };

      mlService.analyzePromotionLift.mockResolvedValue(mockFailure);

      const response = await request(app)
        .post('/api/ai/analyze/promotion-lift')
        .send(validRequest)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/ai/recommend/products', () => {
    const validRequest = {
      customerId: 'CUST456',
      context: { current_category: 'beverages' },
      topN: 10
    };

    it('should successfully recommend products', async () => {
      const mockRecommendations = {
        success: true,
        data: {
          customer_id: 'CUST456',
          recommendations: [
            {
              product_id: 'PROD789',
              product_name: 'Premium Coffee',
              score: 0.92,
              reason: 'Frequently bought together'
            },
            {
              product_id: 'PROD101',
              product_name: 'Artisan Tea',
              score: 0.85,
              reason: 'Similar preferences'
            }
          ],
          model_version: 'v1.1.0'
        }
      };

      mlService.recommendProducts.mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .post('/api/ai/recommend/products')
        .send(validRequest)
        .expect(200);

      expect(response.body).toEqual(mockRecommendations.data);
      expect(response.body.recommendations).toHaveLength(2);
    });

    it('should return 400 for missing customerId', async () => {
      const response = await request(app)
        .post('/api/ai/recommend/products')
        .send({ topN: 5 })
        .expect(400);

      expect(response.body.error).toContain('customerId required');
    });

    it('should handle empty recommendations gracefully', async () => {
      const mockFailure = {
        success: false,
        error: 'No recommendations available',
        fallback: []
      };

      mlService.recommendProducts.mockResolvedValue(mockFailure);

      const response = await request(app)
        .post('/api/ai/recommend/products')
        .send(validRequest)
        .expect(200);

      expect(response.body.recommendations).toEqual([]);
      expect(response.body.usingFallback).toBe(true);
    });
  });

  describe('POST /api/ai/segment/customers', () => {
    const validRequest = {
      method: 'rfm',
      startDate: '2025-01-01',
      endDate: '2025-10-31'
    };

    it('should successfully segment customers', async () => {
      const mockSegmentation = {
        success: true,
        data: {
          method: 'rfm',
          totalCustomers: 1250,
          segments: [
            {
              name: 'Champions',
              count: 180,
              percentage: 14.4,
              avgRevenue: 95000,
              color: '#10b981'
            },
            {
              name: 'Loyal Customers',
              count: 275,
              percentage: 22.0,
              avgRevenue: 58000,
              color: '#3b82f6'
            }
          ],
          insights: [
            {
              type: 'info',
              message: 'Champions segment grew by 12% this quarter'
            }
          ]
        }
      };

      mlService.segmentCustomers.mockResolvedValue(mockSegmentation);

      const response = await request(app)
        .post('/api/ai/segment/customers')
        .send(validRequest)
        .expect(200);

      expect(response.body).toEqual(mockSegmentation.data);
      expect(response.body.segments).toHaveLength(2);
      expect(response.body.totalCustomers).toBe(1250);
    });

    it('should use tenantId from authenticated user', async () => {
      mlService.segmentCustomers.mockResolvedValue({
        success: true,
        data: { segments: [] }
      });

      await request(app)
        .post('/api/ai/segment/customers')
        .send({ method: 'rfm' })
        .expect(200);

      expect(mlService.segmentCustomers).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant: 'test-tenant-id'
        })
      );
    });

    it('should return 400 when tenant is missing', async () => {
      const appWithoutTenant = express();
      appWithoutTenant.use(express.json());
      appWithoutTenant.use((req, res, next) => {
        req.user = { id: 'test-user', email: 'test@example.com' };
        next();
      });
      appWithoutTenant.use('/api/ai', aiRoutes);

      const response = await request(appWithoutTenant)
        .post('/api/ai/segment/customers')
        .send({ method: 'rfm' })
        .expect(400);

      expect(response.body.error).toContain('Tenant ID required');
    });

    it('should handle segmentation failure with fallback', async () => {
      const mockFailure = {
        success: false,
        error: 'Segmentation failed',
        fallback: {
          method: 'rfm',
          totalCustomers: 0,
          segments: [],
          warning: 'ML service unavailable'
        }
      };

      mlService.segmentCustomers.mockResolvedValue(mockFailure);

      const response = await request(app)
        .post('/api/ai/segment/customers')
        .send(validRequest)
        .expect(200);

      expect(response.body.usingFallback).toBe(true);
    });
  });

  describe('GET /api/ai/segment/customers/:customerId', () => {
    it('should get customer segment successfully', async () => {
      const mockSegment = {
        success: true,
        data: {
          customer_id: 'CUST789',
          segment: 'Champions',
          rfm_score: {
            recency: 5,
            frequency: 5,
            monetary: 4
          },
          segment_characteristics: {
            avgPurchaseFrequency: 12.5,
            avgOrderValue: 8500,
            lifetimeValue: 106000
          }
        }
      };

      mlService.getCustomerSegment.mockResolvedValue(mockSegment);

      const response = await request(app)
        .get('/api/ai/segment/customers/CUST789')
        .expect(200);

      expect(response.body).toEqual(mockSegment.data);
      expect(response.body.segment).toBe('Champions');
    });

    it('should handle customer not found', async () => {
      const mockFailure = {
        success: false,
        error: 'Customer not found'
      };

      mlService.getCustomerSegment.mockResolvedValue(mockFailure);

      const response = await request(app)
        .get('/api/ai/segment/customers/INVALID')
        .expect(200);

      expect(response.body).toHaveProperty('error');
      expect(response.body.usingFallback).toBe(true);
    });
  });

  describe('POST /api/ai/detect/anomalies', () => {
    const validRequest = {
      metricType: 'sales',
      startDate: '2025-10-01',
      endDate: '2025-10-31',
      threshold: 2.5
    };

    it('should successfully detect anomalies', async () => {
      const mockAnomalies = {
        success: true,
        data: {
          metric_type: 'sales',
          anomalies: [
            {
              id: 'anom_001',
              date: '2025-10-15',
              actualValue: 45000,
              expectedValue: 78000,
              deviation: -42.3,
              severity: 'high',
              description: 'Significant drop in daily sales'
            }
          ],
          summary: {
            total_anomalies: 1,
            high_severity: 1,
            medium_severity: 0,
            low_severity: 0
          }
        }
      };

      mlService.detectAnomalies.mockResolvedValue(mockAnomalies);

      const response = await request(app)
        .post('/api/ai/detect/anomalies')
        .send(validRequest)
        .expect(200);

      expect(response.body).toEqual(mockAnomalies.data);
      expect(response.body.anomalies).toHaveLength(1);
      expect(response.body.anomalies[0].severity).toBe('high');
    });

    it('should return 400 for missing metricType', async () => {
      const response = await request(app)
        .post('/api/ai/detect/anomalies')
        .send({ startDate: '2025-10-01', endDate: '2025-10-31' })
        .expect(400);

      expect(response.body.error).toContain('Tenant ID and metric type required');
    });

    it('should use tenantId from authenticated user', async () => {
      mlService.detectAnomalies.mockResolvedValue({
        success: true,
        data: { anomalies: [] }
      });

      await request(app)
        .post('/api/ai/detect/anomalies')
        .send(validRequest)
        .expect(200);

      expect(mlService.detectAnomalies).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant: 'test-tenant-id'
        })
      );
    });

    it('should handle detection failure with fallback', async () => {
      const mockFailure = {
        success: false,
        error: 'Detection failed',
        fallback: {
          anomalies: [],
          warning: 'ML service unavailable'
        }
      };

      mlService.detectAnomalies.mockResolvedValue(mockFailure);

      const response = await request(app)
        .post('/api/ai/detect/anomalies')
        .send(validRequest)
        .expect(200);

      expect(response.body.usingFallback).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mlService.healthCheck.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .get('/api/ai/health')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/ai/forecast/demand')
        .set('Content-Type', 'application/json')
        .send('{"invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all endpoints', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.use('/api/ai', aiRoutes);

      const response = await request(appNoAuth)
        .get('/api/ai/health')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
