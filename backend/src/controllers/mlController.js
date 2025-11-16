const mlPredictionService = require('../services/mlPredictionService');
const aiRecommendationEngine = require('../services/aiRecommendationEngine');
const automatedInsightsService = require('../services/automatedInsightsService');

class MLController {
  // Customer Behavior Prediction
  async predictCustomerBehavior(req, res) {
    try {
      const { customerData } = req.body;
      const tenantId = req.tenant?.id;

      if (!customerData) {
        return res.status(400).json({
          success: false,
          message: 'Customer data is required'
        });
      }

      const prediction = await mlPredictionService.predictCustomerBehavior({
        ...customerData,
        tenantId
      });

      res.json({
        success: true,
        data: prediction,
        message: 'Customer behavior predicted successfully'
      });
    } catch (error) {
      console.error('Error predicting customer behavior:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to predict customer behavior',
        error: error.message
      });
    }
  }

  // Demand Forecasting
  async forecastDemand(req, res) {
    try {
      const { productId, timeHorizon = 30, historicalData } = req.body;
      const tenantId = req.tenant?.id;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
      }

      const forecast = await mlPredictionService.forecastDemand(
        productId,
        timeHorizon,
        historicalData
      );

      res.json({
        success: true,
        data: forecast,
        message: 'Demand forecast generated successfully'
      });
    } catch (error) {
      console.error('Error forecasting demand:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to forecast demand',
        error: error.message
      });
    }
  }

  // Promotion Optimization
  async optimizePromotion(req, res) {
    try {
      const { promotionData } = req.body;
      const tenantId = req.tenant?.id;

      if (!promotionData) {
        return res.status(400).json({
          success: false,
          message: 'Promotion data is required'
        });
      }

      const optimization = await mlPredictionService.optimizePromotion({
        ...promotionData,
        tenantId
      });

      res.json({
        success: true,
        data: optimization,
        message: 'Promotion optimized successfully'
      });
    } catch (error) {
      console.error('Error optimizing promotion:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to optimize promotion',
        error: error.message
      });
    }
  }

  // Churn Prediction
  async predictChurn(req, res) {
    try {
      const { customerData } = req.body;
      const tenantId = req.tenant?.id;

      if (!customerData) {
        return res.status(400).json({
          success: false,
          message: 'Customer data is required'
        });
      }

      const churnPrediction = await mlPredictionService.predictChurn({
        ...customerData,
        tenantId
      });

      res.json({
        success: true,
        data: churnPrediction,
        message: 'Churn prediction generated successfully'
      });
    } catch (error) {
      console.error('Error predicting churn:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to predict churn',
        error: error.message
      });
    }
  }

  // Price Optimization
  async optimizePrice(req, res) {
    try {
      const { productData, marketConditions = {} } = req.body;
      const tenantId = req.tenant?.id;

      if (!productData) {
        return res.status(400).json({
          success: false,
          message: 'Product data is required'
        });
      }

      const priceOptimization = await mlPredictionService.optimizePrice(
        { ...productData, tenantId },
        marketConditions
      );

      res.json({
        success: true,
        data: priceOptimization,
        message: 'Price optimization completed successfully'
      });
    } catch (error) {
      console.error('Error optimizing price:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to optimize price',
        error: error.message
      });
    }
  }

  // Batch Predictions
  async batchPredict(req, res) {
    try {
      const { predictionType, dataArray, options = {} } = req.body;
      const tenantId = req.tenant?.id;

      if (!predictionType || !dataArray || !Array.isArray(dataArray)) {
        return res.status(400).json({
          success: false,
          message: 'Prediction type and data array are required'
        });
      }

      // Add tenant ID to each data item
      const enrichedDataArray = dataArray.map((data) => ({
        ...data,
        tenantId
      }));

      const batchResults = await mlPredictionService.batchPredict(
        predictionType,
        enrichedDataArray
      );

      const successCount = batchResults.filter((r) => r.success).length;
      const errorCount = batchResults.filter((r) => !r.success).length;

      res.json({
        success: true,
        data: {
          results: batchResults,
          summary: {
            total: batchResults.length,
            successful: successCount,
            failed: errorCount,
            successRate: (successCount / batchResults.length) * 100
          }
        },
        message: `Batch prediction completed: ${successCount}/${batchResults.length} successful`
      });
    } catch (error) {
      console.error('Error in batch prediction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform batch prediction',
        error: error.message
      });
    }
  }

  // Product Recommendations
  async getProductRecommendations(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 10, category, priceRange, includeReasons = true, diversityFactor = 0.3 } = req.query;
      const tenantId = req.tenant?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const recommendations = await aiRecommendationEngine.getProductRecommendations(
        userId,
        {
          limit: parseInt(limit),
          category,
          priceRange: priceRange ? JSON.parse(priceRange) : null,
          includeReasons: includeReasons === 'true',
          diversityFactor: parseFloat(diversityFactor)
        }
      );

      res.json({
        success: true,
        data: recommendations,
        message: 'Product recommendations generated successfully'
      });
    } catch (error) {
      console.error('Error getting product recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product recommendations',
        error: error.message
      });
    }
  }

  // Customer Segmentation
  async segmentCustomer(req, res) {
    try {
      const { customerData } = req.body;
      const tenantId = req.tenant?.id;

      if (!customerData) {
        return res.status(400).json({
          success: false,
          message: 'Customer data is required'
        });
      }

      const segmentation = await aiRecommendationEngine.segmentCustomer({
        ...customerData,
        tenantId
      });

      res.json({
        success: true,
        data: segmentation,
        message: 'Customer segmented successfully'
      });
    } catch (error) {
      console.error('Error segmenting customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to segment customer',
        error: error.message
      });
    }
  }

  // Personalized Promotions
  async getPersonalizedPromotions(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 5, budget, channel, timeframe = 30 } = req.query;
      const tenantId = req.tenant?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const promotions = await aiRecommendationEngine.getPersonalizedPromotions(
        userId,
        {
          limit: parseInt(limit),
          budget: budget ? parseFloat(budget) : null,
          channel,
          timeframe: parseInt(timeframe)
        }
      );

      res.json({
        success: true,
        data: promotions,
        message: 'Personalized promotions generated successfully'
      });
    } catch (error) {
      console.error('Error getting personalized promotions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get personalized promotions',
        error: error.message
      });
    }
  }

  // Hybrid Recommendations
  async getHybridRecommendations(req, res) {
    try {
      const { userId } = req.params;
      const {
        limit = 10,
        weights = { collaborative: 0.4, content: 0.3, popularity: 0.2, personal: 0.1 },
        diversityFactor = 0.3
      } = req.query;
      const tenantId = req.tenant?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const parsedWeights = typeof weights === 'string' ? JSON.parse(weights) : weights;

      const recommendations = await aiRecommendationEngine.getHybridRecommendations(
        userId,
        {
          limit: parseInt(limit),
          weights: parsedWeights,
          diversityFactor: parseFloat(diversityFactor)
        }
      );

      res.json({
        success: true,
        data: recommendations,
        message: 'Hybrid recommendations generated successfully'
      });
    } catch (error) {
      console.error('Error getting hybrid recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get hybrid recommendations',
        error: error.message
      });
    }
  }

  // Real-time Recommendations
  async getRealTimeRecommendations(req, res) {
    try {
      const { userId } = req.params;
      const context = req.body;
      const tenantId = req.tenant?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const recommendations = await aiRecommendationEngine.getRealTimeRecommendations(
        userId,
        { ...context, tenantId }
      );

      res.json({
        success: true,
        data: recommendations,
        message: 'Real-time recommendations generated successfully'
      });
    } catch (error) {
      console.error('Error getting real-time recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get real-time recommendations',
        error: error.message
      });
    }
  }

  // Batch Recommendations
  async generateBatchRecommendations(req, res) {
    try {
      const { userIds, options = {} } = req.body;
      const tenantId = req.tenant?.id;

      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
      }

      const batchResults = await aiRecommendationEngine.generateBatchRecommendations(
        userIds,
        { ...options, tenantId }
      );

      res.json({
        success: true,
        data: batchResults,
        message: `Batch recommendations generated for ${userIds.length} users`
      });
    } catch (error) {
      console.error('Error generating batch recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate batch recommendations',
        error: error.message
      });
    }
  }

  // Automated Insights
  async generateInsights(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const { types, timeRange = 30, includeRecommendations = true, priority } = req.query;

      const options = {
        types: types ? types.split(',') : null,
        timeRange: parseInt(timeRange),
        includeRecommendations: includeRecommendations === 'true',
        priority
      };

      const insights = await automatedInsightsService.generateInsights(tenantId, options);

      res.json({
        success: true,
        data: insights,
        message: 'Insights generated successfully'
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate insights',
        error: error.message
      });
    }
  }

  // Check Alerts
  async checkAlerts(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const { data } = req.body;

      if (!data) {
        return res.status(400).json({
          success: false,
          message: 'Data for alert checking is required'
        });
      }

      const alerts = await automatedInsightsService.checkAlerts(tenantId, data);

      res.json({
        success: true,
        data: {
          alerts,
          count: alerts.length,
          hasAlerts: alerts.length > 0
        },
        message: `${alerts.length} alerts triggered`
      });
    } catch (error) {
      console.error('Error checking alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check alerts',
        error: error.message
      });
    }
  }

  // Model Metrics
  async getModelMetrics(req, res) {
    try {
      const [mlMetrics, recommendationMetrics, insightMetrics] = await Promise.all([
        mlPredictionService.getModelMetrics(),
        aiRecommendationEngine.getRecommendationMetrics(),
        automatedInsightsService.getInsightMetrics()
      ]);

      res.json({
        success: true,
        data: {
          mlPrediction: mlMetrics,
          recommendation: recommendationMetrics,
          insights: insightMetrics,
          timestamp: new Date().toISOString()
        },
        message: 'Model metrics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting model metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get model metrics',
        error: error.message
      });
    }
  }

  // Model Training Status
  async getTrainingStatus(req, res) {
    try {
      // Mock training status - in real implementation, track actual training jobs
      const trainingStatus = {
        customerBehavior: {
          status: 'completed',
          accuracy: 0.87,
          lastTrained: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          nextTraining: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
        },
        demandForecasting: {
          status: 'training',
          progress: 0.65,
          estimatedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        },
        promotionOptimization: {
          status: 'completed',
          accuracy: 0.82,
          lastTrained: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          nextTraining: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        churnPrediction: {
          status: 'completed',
          accuracy: 0.91,
          lastTrained: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          nextTraining: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        priceOptimization: {
          status: 'scheduled',
          scheduledStart: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        }
      };

      res.json({
        success: true,
        data: trainingStatus,
        message: 'Training status retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting training status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get training status',
        error: error.message
      });
    }
  }

  // Retrain Models
  async retrainModels(req, res) {
    try {
      const { models = [], force = false } = req.body;
      const tenantId = req.tenant?.id;

      // Mock retraining process
      const retrainingJobs = [];
      const availableModels = ['customerBehavior', 'demandForecasting', 'promotionOptimization', 'churnPrediction', 'priceOptimization'];
      const modelsToRetrain = models.length > 0 ? models : availableModels;

      for (const modelName of modelsToRetrain) {
        if (availableModels.includes(modelName)) {
          retrainingJobs.push({
            modelName,
            jobId: `retrain_${modelName}_${Date.now()}`,
            status: 'queued',
            queuedAt: new Date().toISOString(),
            estimatedDuration: Math.floor(Math.random() * 120) + 30 // 30-150 minutes
          });
        }
      }

      res.json({
        success: true,
        data: {
          jobs: retrainingJobs,
          totalJobs: retrainingJobs.length,
          message: `${retrainingJobs.length} retraining jobs queued`
        },
        message: 'Model retraining initiated successfully'
      });
    } catch (error) {
      console.error('Error retraining models:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate model retraining',
        error: error.message
      });
    }
  }

  // A/B Test Recommendations
  async createABTest(req, res) {
    try {
      const { testName, variants, trafficSplit, duration, metrics } = req.body;
      const tenantId = req.tenant?.id;

      if (!testName || !variants || !Array.isArray(variants)) {
        return res.status(400).json({
          success: false,
          message: 'Test name and variants are required'
        });
      }

      // Mock A/B test creation
      const abTest = {
        id: `ab_test_${Date.now()}`,
        name: testName,
        tenantId,
        variants,
        trafficSplit: trafficSplit || variants.map(() => 100 / variants.length),
        duration: duration || 14, // days
        metrics: metrics || ['conversion_rate', 'revenue', 'engagement'],
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + (duration || 14) * 24 * 60 * 60 * 1000).toISOString(),
        participants: 0,
        results: null
      };

      res.json({
        success: true,
        data: abTest,
        message: 'A/B test created successfully'
      });
    } catch (error) {
      console.error('Error creating A/B test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create A/B test',
        error: error.message
      });
    }
  }

  // Get A/B Test Results
  async getABTestResults(req, res) {
    try {
      const { testId } = req.params;
      const tenantId = req.tenant?.id;

      if (!testId) {
        return res.status(400).json({
          success: false,
          message: 'Test ID is required'
        });
      }

      // Mock A/B test results
      const results = {
        testId,
        status: 'completed',
        participants: 1250,
        duration: 14,
        variants: [
          {
            name: 'Control',
            participants: 625,
            conversionRate: 3.2,
            revenue: 15600,
            engagement: 0.67,
            confidence: 0.95
          },
          {
            name: 'Variant A',
            participants: 625,
            conversionRate: 3.8,
            revenue: 18200,
            engagement: 0.72,
            confidence: 0.95
          }
        ],
        winner: 'Variant A',
        significance: 0.03,
        recommendation: 'Implement Variant A - shows 18.75% improvement in conversion rate',
        insights: [
          'Variant A performed significantly better across all metrics',
          'Revenue increased by 16.7% with high statistical confidence',
          'Engagement improved by 7.5% indicating better user experience'
        ]
      };

      res.json({
        success: true,
        data: results,
        message: 'A/B test results retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting A/B test results:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get A/B test results',
        error: error.message
      });
    }
  }
}

module.exports = new MLController();
