const mongoose = require('mongoose');
const ForecastingService = require('../../src/services/forecastingService');
const SalesHistory = require('../../src/models/SalesHistory');
const Product = require('../../src/models/Product');
const Customer = require('../../src/models/Customer');

describe('ForecastingService', () => {
  let forecastingService;
  let tenantId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/tradeai_test');
    forecastingService = new ForecastingService();
    tenantId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await SalesHistory.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
  });

  describe('generateSalesForecast', () => {
    it('should generate sales forecast with sufficient historical data', async () => {
      // Create test data
      const productId = new mongoose.Types.ObjectId();
      const customerId = new mongoose.Types.ObjectId();

      // Create 24 months of historical data
      const salesData = [];
      for (let i = 0; i < 24; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        salesData.push({
          tenantId,
          productId,
          customerId,
          date,
          units: 100 + Math.random() * 50,
          revenue: 1000 + Math.random() * 500
        });
      }

      await SalesHistory.insertMany(salesData);

      const options = {
        productId,
        customerId,
        horizon: 12,
        algorithm: 'ensemble',
        includeSeasonality: true
      };

      const result = await forecastingService.generateSalesForecast(tenantId, options);

      expect(result).toBeDefined();
      expect(result.tenantId).toBe(tenantId);
      expect(result.forecast).toHaveLength(12);
      expect(result.accuracy).toBeDefined();
      expect(result.confidenceIntervals).toHaveLength(12);
      
      // Check forecast structure
      result.forecast.forEach(point => {
        expect(point).toHaveProperty('period');
        expect(point).toHaveProperty('value');
        expect(point).toHaveProperty('method');
        expect(point.value).toBeGreaterThan(0);
      });
    });

    it('should throw error with insufficient historical data', async () => {
      const options = {
        productId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(),
        horizon: 12
      };

      await expect(
        forecastingService.generateSalesForecast(tenantId, options)
      ).rejects.toThrow('Insufficient historical data');
    });

    it('should use different algorithms correctly', async () => {
      // Create test data
      const productId = new mongoose.Types.ObjectId();
      const salesData = [];
      
      for (let i = 0; i < 24; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        salesData.push({
          tenantId,
          productId,
          date,
          units: 100 + i * 2, // Linear trend
          revenue: 1000 + i * 20
        });
      }

      await SalesHistory.insertMany(salesData);

      const algorithms = ['sma', 'exponential', 'linear', 'seasonal'];
      
      for (const algorithm of algorithms) {
        const result = await forecastingService.generateSalesForecast(tenantId, {
          productId,
          horizon: 6,
          algorithm
        });

        expect(result.forecast).toHaveLength(6);
        expect(result.forecast[0].method).toBe(algorithm);
      }
    });
  });

  describe('generateDemandForecast', () => {
    it('should generate demand forecast with multiple scenarios', async () => {
      const productIds = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
      const customerIds = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];

      // Create historical data for multiple products and customers
      const salesData = [];
      for (const productId of productIds) {
        for (const customerId of customerIds) {
          for (let i = 0; i < 12; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            salesData.push({
              tenantId,
              productId,
              customerId,
              date,
              units: 50 + Math.random() * 25,
              revenue: 500 + Math.random() * 250
            });
          }
        }
      }

      await SalesHistory.insertMany(salesData);

      const options = {
        productIds,
        customerIds,
        horizon: 6,
        scenarios: ['optimistic', 'realistic', 'pessimistic']
      };

      const result = await forecastingService.generateDemandForecast(tenantId, options);

      expect(result).toBeDefined();
      expect(result.scenarios).toHaveProperty('optimistic');
      expect(result.scenarios).toHaveProperty('realistic');
      expect(result.scenarios).toHaveProperty('pessimistic');
      expect(result.aggregateDemand).toBeDefined();
      expect(result.riskAnalysis).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('generateBudgetForecast', () => {
    it('should generate budget forecast with inflation adjustment', async () => {
      const options = {
        horizon: 12,
        includeInflation: true,
        inflationRate: 3.0
      };

      const result = await forecastingService.generateBudgetForecast(tenantId, options);

      expect(result).toBeDefined();
      expect(result.baseForecast).toBeDefined();
      expect(result.inflationAdjustedForecast).toBeDefined();
      expect(result.finalForecast).toBeDefined();
      expect(result.budgetRisk).toBeDefined();
      expect(result.assumptions.inflationRate).toBe(3.0);

      // Check inflation adjustment
      result.inflationAdjustedForecast.forEach((point, index) => {
        expect(point.inflationAdjustment).toBeGreaterThan(1);
        expect(point.value).toBeGreaterThan(result.baseForecast[index].value);
      });
    });
  });

  describe('predictPromotionPerformance', () => {
    it('should predict promotion performance based on similar promotions', async () => {
      const promotionData = {
        products: [new mongoose.Types.ObjectId()],
        customers: [new mongoose.Types.ObjectId()],
        period: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        budget: 10000,
        type: 'discount',
        mechanics: { discountPercent: 20 }
      };

      const result = await forecastingService.predictPromotionPerformance(tenantId, promotionData);

      expect(result).toBeDefined();
      expect(result.tenantId).toBe(tenantId);
      
      if (result.prediction === 'insufficient_data') {
        expect(result.confidence).toBe('low');
        expect(result.message).toContain('Not enough similar promotions');
      } else {
        expect(result.predictions).toBeDefined();
        expect(result.predictions.expectedROI).toBeDefined();
        expect(result.predictions.expectedLift).toBeDefined();
        expect(result.predictions.expectedVolume).toBeDefined();
        expect(result.confidence).toMatch(/low|medium|high/);
      }
    });
  });

  describe('Time Series Analysis', () => {
    it('should detect seasonality in data', async () => {
      // Create seasonal data
      const salesData = [];
      for (let i = 0; i < 24; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        // Create seasonal pattern (higher sales in certain months)
        const seasonalFactor = Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 20 + 100;
        
        salesData.push({
          tenantId,
          productId: new mongoose.Types.ObjectId(),
          date,
          units: seasonalFactor + Math.random() * 10,
          revenue: seasonalFactor * 10
        });
      }

      await SalesHistory.insertMany(salesData);

      const timeSeries = forecastingService.prepareTimeSeriesData(salesData);
      const seasonality = forecastingService.detectSeasonality(timeSeries);

      expect(seasonality.detected).toBe(true);
      expect(seasonality.strength).toBeGreaterThan(0.3);
      expect(seasonality.period).toBe(12);
    });

    it('should analyze trend correctly', async () => {
      // Create trending data
      const salesData = [];
      for (let i = 0; i < 24; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        salesData.push({
          tenantId,
          productId: new mongoose.Types.ObjectId(),
          date,
          units: 100 + i * 5, // Increasing trend
          revenue: 1000 + i * 50
        });
      }

      const timeSeries = forecastingService.prepareTimeSeriesData(salesData.reverse());
      const trendAnalysis = forecastingService.analyzeTrend(timeSeries);

      expect(trendAnalysis.direction).toBe('increasing');
      expect(trendAnalysis.slope).toBeGreaterThan(0);
      expect(trendAnalysis.strength).toMatch(/weak|moderate|strong/);
    });
  });

  describe('Forecast Accuracy', () => {
    it('should calculate forecast accuracy correctly', async () => {
      // Create test data with known pattern
      const salesData = [];
      for (let i = 0; i < 18; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        salesData.push({
          tenantId,
          productId: new mongoose.Types.ObjectId(),
          date,
          units: 100 + (i % 2) * 10, // Predictable pattern
          revenue: 1000 + (i % 2) * 100
        });
      }

      const timeSeries = forecastingService.prepareTimeSeriesData(salesData);
      const accuracy = forecastingService.calculateForecastAccuracy(timeSeries);

      expect(accuracy).toBeDefined();
      expect(accuracy.mape).toBeDefined();
      expect(accuracy.accuracy).toMatch(/low|medium|high/);
      expect(accuracy.testPoints).toBeGreaterThan(0);
    });
  });

  describe('Ensemble Forecasting', () => {
    it('should create ensemble forecast from multiple methods', async () => {
      const timeSeries = [
        { date: '2023-01', units: 100 },
        { date: '2023-02', units: 110 },
        { date: '2023-03', units: 105 },
        { date: '2023-04', units: 115 }
      ];

      const forecasts = {
        sma: [
          { period: 1, value: 108, method: 'sma' },
          { period: 2, value: 110, method: 'sma' }
        ],
        exponential: [
          { period: 1, value: 112, method: 'exponential' },
          { period: 2, value: 114, method: 'exponential' }
        ],
        linear: [
          { period: 1, value: 120, method: 'linear' },
          { period: 2, value: 125, method: 'linear' }
        ]
      };

      const ensemble = forecastingService.createEnsembleForecast(forecasts);

      expect(ensemble).toHaveLength(2);
      expect(ensemble[0].method).toBe('ensemble');
      expect(ensemble[0].contributingMethods).toEqual(['sma', 'exponential', 'linear']);
      
      // Ensemble value should be weighted average
      expect(ensemble[0].value).toBeGreaterThan(108);
      expect(ensemble[0].value).toBeLessThan(120);
    });
  });

  describe('Cache Management', () => {
    it('should cache and retrieve forecast results', async () => {
      const cacheKey = 'test_forecast_key';
      const testData = { forecast: [{ period: 1, value: 100 }] };

      // Set cache
      forecastingService.setCache(cacheKey, testData);

      // Get from cache
      const cached = forecastingService.getFromCache(cacheKey);
      expect(cached).toEqual(testData);

      // Clear cache
      forecastingService.clearCache();
      const clearedCache = forecastingService.getFromCache(cacheKey);
      expect(clearedCache).toBeNull();
    });

    it('should respect cache timeout', async () => {
      const cacheKey = 'test_timeout_key';
      const testData = { test: 'data' };

      // Temporarily reduce cache timeout for testing
      const originalTimeout = forecastingService.cacheTimeout;
      forecastingService.cacheTimeout = 100; // 100ms

      forecastingService.setCache(cacheKey, testData);

      // Should be available immediately
      expect(forecastingService.getFromCache(cacheKey)).toEqual(testData);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be null after timeout
      expect(forecastingService.getFromCache(cacheKey)).toBeNull();

      // Restore original timeout
      forecastingService.cacheTimeout = originalTimeout;
    });
  });
});