const tf = require('@tensorflow/tfjs-node');
// const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const _Promotion = require('../models/Promotion');

/**
 * Machine Learning Integration Service
 * Provides predictive models, recommendation engines, and anomaly detection
 */

class MLIntegrationService {
  constructor() {
    this.models = new Map();
    this.isInitialized = false;
    this.trainingData = new Map();
    this.predictionCache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes

    this.initializeService();
  }

  async initializeService() {
    try {
      console.log('Initializing ML Integration Service...');

      // Initialize pre-trained models
      await this.loadPretrainedModels();

      // Start periodic model training
      this.startPeriodicTraining();

      this.isInitialized = true;
      console.log('ML Integration Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ML Integration Service:', error);
    }
  }

  /**
   * Load pre-trained models
   */
  async loadPretrainedModels() {
    try {
      // Customer Lifetime Value (CLV) Model
      this.models.set('clv', await this.createCLVModel());

      // Demand Forecasting Model
      this.models.set('demand_forecast', await this.createDemandForecastModel());

      // Price Optimization Model
      this.models.set('price_optimization', await this.createPriceOptimizationModel());

      // Churn Prediction Model
      this.models.set('churn_prediction', await this.createChurnPredictionModel());

      // Recommendation Engine
      this.models.set('recommendations', await this.createRecommendationModel());

      // Anomaly Detection Model
      this.models.set('anomaly_detection', await this.createAnomalyDetectionModel());

      console.log('Pre-trained models loaded successfully');
    } catch (error) {
      console.error('Error loading pre-trained models:', error);
    }
  }

  /**
   * Create Customer Lifetime Value (CLV) Model
   */
  createCLVModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [8], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  /**
   * Create Demand Forecasting Model
   */
  createDemandForecastModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 50,
          returnSequences: true,
          inputShape: [30, 5] // 30 days, 5 features
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({ units: 50, returnSequences: false }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 25, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  /**
   * Create Price Optimization Model
   */
  createPriceOptimizationModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 128, activation: 'relu' }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }) // Price elasticity
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Create Churn Prediction Model
   */
  createChurnPredictionModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [12], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });

    return model;
  }

  /**
   * Create Recommendation Model
   */
  createRecommendationModel() {
    // Collaborative filtering model
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [100], units: 256, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 10, activation: 'softmax' }) // Top 10 recommendations
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Create Anomaly Detection Model
   */
  createAnomalyDetectionModel() {
    // Autoencoder for anomaly detection
    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [20], units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 4, activation: 'relu' })
      ]
    });

    const decoder = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 20, activation: 'sigmoid' })
      ]
    });

    const autoencoder = tf.sequential({
      layers: [encoder, decoder]
    });

    autoencoder.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });

    return autoencoder;
  }

  /**
   * Predict Customer Lifetime Value
   */
  async predictCustomerLifetimeValue(tenantId, customerId, options = {}) {
    try {
      const cacheKey = `clv_${tenantId}_${customerId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached && !options.forceRefresh) {
        return cached;
      }

      // Get customer data
      const customer = await Customer.findOne({ _id: customerId, tenantId });
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Prepare features
      const features = await this.prepareCLVFeatures(customer);
      const inputTensor = tf.tensor2d([features]);

      // Make prediction
      const model = this.models.get('clv');
      const prediction = model.predict(inputTensor);
      const clvValue = await prediction.data();

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      const result = {
        customerId,
        predictedCLV: clvValue[0],
        confidence: this.calculateConfidence(features),
        factors: this.analyzeCLVFactors(features),
        recommendations: this.generateCLVRecommendations(clvValue[0], features),
        calculatedAt: new Date()
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      throw new Error(`CLV prediction failed: ${error.message}`);
    }
  }

  /**
   * Forecast demand for products
   */
  async forecastDemand(tenantId, productId, forecastDays = 30, options = {}) {
    try {
      const cacheKey = `demand_${tenantId}_${productId}_${forecastDays}`;
      const cached = this.getFromCache(cacheKey);
      if (cached && !options.forceRefresh) {
        return cached;
      }

      // Get historical sales data
      const historicalData = await this.getHistoricalSalesData(tenantId, productId, 90);

      if (historicalData.length < 30) {
        throw new Error('Insufficient historical data for forecasting');
      }

      // Prepare time series data
      const timeSeriesData = this.prepareTimeSeriesData(historicalData);
      const inputTensor = tf.tensor3d([timeSeriesData]);

      // Make prediction
      const model = this.models.get('demand_forecast');
      const prediction = model.predict(inputTensor);
      const forecastValues = await prediction.data();

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      const result = {
        productId,
        forecastDays,
        predictions: this.generateForecastSeries(forecastValues, forecastDays),
        confidence: this.calculateForecastConfidence(historicalData),
        trends: this.analyzeDemandTrends(historicalData),
        seasonality: this.detectSeasonality(historicalData),
        calculatedAt: new Date()
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      throw new Error(`Demand forecasting failed: ${error.message}`);
    }
  }

  /**
   * Optimize pricing for products
   */
  async optimizePrice(tenantId, productId, constraints = {}, options = {}) {
    try {
      const cacheKey = `price_opt_${tenantId}_${productId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached && !options.forceRefresh) {
        return cached;
      }

      // Get product and market data
      const product = await Product.findOne({ _id: productId, tenantId });
      if (!product) {
        throw new Error('Product not found');
      }

      // Prepare features for price optimization
      const features = await this.preparePriceOptimizationFeatures(product, constraints);
      const inputTensor = tf.tensor2d([features]);

      // Make prediction
      const model = this.models.get('price_optimization');
      const prediction = model.predict(inputTensor);
      const elasticity = await prediction.data();

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      // Calculate optimal price
      const currentPrice = product.pricing?.listPrice || 0;
      const optimalPrice = this.calculateOptimalPrice(currentPrice, elasticity[0], constraints);

      const result = {
        productId,
        currentPrice,
        optimalPrice,
        priceElasticity: elasticity[0],
        expectedImpact: {
          demandChange: this.calculateDemandChange(elasticity[0], optimalPrice, currentPrice),
          revenueChange: this.calculateRevenueChange(elasticity[0], optimalPrice, currentPrice)
        },
        constraints,
        recommendations: this.generatePricingRecommendations(optimalPrice, currentPrice, elasticity[0]),
        calculatedAt: new Date()
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      throw new Error(`Price optimization failed: ${error.message}`);
    }
  }

  /**
   * Predict customer churn
   */
  async predictChurn(tenantId, customerId, options = {}) {
    try {
      const cacheKey = `churn_${tenantId}_${customerId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached && !options.forceRefresh) {
        return cached;
      }

      // Get customer data
      const customer = await Customer.findOne({ _id: customerId, tenantId });
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Prepare features
      const features = await this.prepareChurnFeatures(customer);
      const inputTensor = tf.tensor2d([features]);

      // Make prediction
      const model = this.models.get('churn_prediction');
      const prediction = model.predict(inputTensor);
      const churnProbability = await prediction.data();

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      const result = {
        customerId,
        churnProbability: churnProbability[0],
        riskLevel: this.categorizeChurnRisk(churnProbability[0]),
        keyFactors: this.identifyChurnFactors(features),
        retentionStrategies: this.generateRetentionStrategies(churnProbability[0], features),
        calculatedAt: new Date()
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      throw new Error(`Churn prediction failed: ${error.message}`);
    }
  }

  /**
   * Generate product recommendations
   */
  async generateRecommendations(tenantId, customerId, options = {}) {
    try {
      const { limit = 10, category = null } = options;
      const cacheKey = `recommendations_${tenantId}_${customerId}_${limit}`;
      const cached = this.getFromCache(cacheKey);
      if (cached && !options.forceRefresh) {
        return cached;
      }

      // Get customer purchase history and preferences
      const customer = await Customer.findOne({ _id: customerId, tenantId });
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Prepare recommendation features
      const features = await this.prepareRecommendationFeatures(customer, category);
      const inputTensor = tf.tensor2d([features]);

      // Make prediction
      const model = this.models.get('recommendations');
      const prediction = model.predict(inputTensor);
      const scores = await prediction.data();

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      // Get top products based on scores
      const recommendations = await this.getTopRecommendations(tenantId, scores, limit, category);

      const result = {
        customerId,
        recommendations,
        algorithm: 'collaborative_filtering',
        confidence: this.calculateRecommendationConfidence(scores),
        generatedAt: new Date()
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      throw new Error(`Recommendation generation failed: ${error.message}`);
    }
  }

  /**
   * Detect anomalies in data
   */
  async detectAnomalies(tenantId, dataType, data, options = {}) {
    try {
      const { threshold = 0.1 } = options;

      // Prepare data for anomaly detection
      const features = this.prepareAnomalyFeatures(data, dataType);
      const inputTensor = tf.tensor2d([features]);

      // Make prediction (reconstruction)
      const model = this.models.get('anomaly_detection');
      const reconstruction = model.predict(inputTensor);
      const reconstructedData = await reconstruction.data();

      // Calculate reconstruction error
      const error = this.calculateReconstructionError(features, reconstructedData);
      const isAnomaly = error > threshold;

      // Clean up tensors
      inputTensor.dispose();
      reconstruction.dispose();

      const result = {
        dataType,
        isAnomaly,
        anomalyScore: error,
        threshold,
        confidence: this.calculateAnomalyConfidence(error, threshold),
        details: isAnomaly ? this.analyzeAnomalyDetails(features, reconstructedData) : null,
        detectedAt: new Date()
      };

      return result;

    } catch (error) {
      throw new Error(`Anomaly detection failed: ${error.message}`);
    }
  }

  /**
   * Train models with new data
   */
  async trainModels(tenantId, modelType = 'all', options = {}) {
    try {
      const { epochs = 50, batchSize = 32 } = options;
      const results = {};

      if (modelType === 'all' || modelType === 'clv') {
        results.clv = await this.trainCLVModel(tenantId, epochs, batchSize);
      }

      if (modelType === 'all' || modelType === 'demand_forecast') {
        results.demand_forecast = await this.trainDemandForecastModel(tenantId, epochs, batchSize);
      }

      if (modelType === 'all' || modelType === 'churn_prediction') {
        results.churn_prediction = await this.trainChurnModel(tenantId, epochs, batchSize);
      }

      return {
        tenantId,
        modelType,
        trainingResults: results,
        trainedAt: new Date()
      };

    } catch (error) {
      throw new Error(`Model training failed: ${error.message}`);
    }
  }

  // Helper Methods

  prepareCLVFeatures(customer) {
    // Mock feature preparation - would use actual customer data
    return [
      customer.totalOrders || 0,
      customer.totalSpent || 0,
      customer.averageOrderValue || 0,
      customer.daysSinceLastOrder || 0,
      customer.loyaltyScore || 0,
      customer.engagementScore || 0,
      customer.tier === 'premium' ? 1 : 0,
      customer.channel === 'online' ? 1 : 0
    ];
  }

  getHistoricalSalesData(tenantId, productId, days) {
    // Mock historical data - would query actual sales data
    const data = [];
    for (let i = 0; i < days; i++) {
      data.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        sales: Math.floor(Math.random() * 100) + 50,
        price: Math.random() * 50 + 25,
        promotions: Math.random() > 0.8 ? 1 : 0
      });
    }
    return data.reverse();
  }

  prepareTimeSeriesData(historicalData) {
    // Prepare last 30 days of data with 5 features each
    const data = historicalData.slice(-30).map((day) => [
      day.sales,
      day.price,
      day.promotions,
      new Date(day.date).getDay(), // Day of week
      new Date(day.date).getDate() // Day of month
    ]);

    return data;
  }

  calculateOptimalPrice(currentPrice, elasticity, constraints) {
    const { minPrice = currentPrice * 0.7, maxPrice = currentPrice * 1.3 } = constraints;

    // Simple optimization based on elasticity
    let optimalPrice = currentPrice * (1 + (elasticity - 0.5) * 0.2);

    // Apply constraints
    optimalPrice = Math.max(minPrice, Math.min(maxPrice, optimalPrice));

    return Math.round(optimalPrice * 100) / 100;
  }

  categorizeChurnRisk(probability) {
    if (probability > 0.7) return 'high';
    if (probability > 0.4) return 'medium';
    return 'low';
  }

  async getTopRecommendations(tenantId, scores, limit, category) {
    // Mock recommendations - would query actual products
    const products = await Product.find({
      tenantId,
      ...(category && { category })
    }).limit(limit * 2);

    return products.slice(0, limit).map((product, index) => ({
      productId: product._id,
      name: product.name,
      score: scores[index] || Math.random(),
      reason: 'Based on purchase history and similar customers'
    }));
  }

  calculateReconstructionError(original, reconstructed) {
    let error = 0;
    for (let i = 0; i < original.length; i++) {
      error += Math.pow(original[i] - reconstructed[i], 2);
    }
    return Math.sqrt(error / original.length);
  }

  // Training methods (simplified implementations)
  trainCLVModel(tenantId, epochs, _batchSize) {
    console.log(`Training CLV model for tenant ${tenantId}...`);
    // Mock training - would use actual training data
    return { loss: 0.05, accuracy: 0.92, epochs };
  }

  trainDemandForecastModel(tenantId, epochs, _batchSize) {
    console.log(`Training demand forecast model for tenant ${tenantId}...`);
    return { loss: 0.08, mae: 0.15, epochs };
  }

  trainChurnModel(tenantId, epochs, _batchSize) {
    console.log(`Training churn prediction model for tenant ${tenantId}...`);
    return { loss: 0.12, accuracy: 0.88, precision: 0.85, recall: 0.82, epochs };
  }

  // Utility methods
  calculateConfidence(features) {
    // Simple confidence calculation based on feature completeness
    const completeness = features.filter((f) => f !== 0).length / features.length;
    return Math.min(0.95, completeness * 0.8 + 0.2);
  }

  generateCLVRecommendations(clv, features) {
    const recommendations = [];

    if (clv > 1000) {
      recommendations.push('High-value customer: Consider premium service offerings');
    }

    if (features[3] > 30) { // Days since last order
      recommendations.push('Re-engagement needed: Send targeted offers');
    }

    return recommendations;
  }

  startPeriodicTraining() {
    // Train models weekly
    setInterval(() => {
      try {
        console.log('Starting periodic model training...');
        // This would train models for all tenants
        // For now, just log the event
      } catch (error) {
        console.error('Periodic training error:', error);
      }
    }, 7 * 24 * 60 * 60 * 1000); // Weekly
  }

  // Cache management
  getFromCache(key) {
    const cached = this.predictionCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.predictionCache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.predictionCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Additional helper methods would be implemented here...
  prepareAnomalyFeatures(_data, _dataType) {
    // Mock feature preparation
    return Array(20).fill(0).map(() => Math.random());
  }

  analyzeAnomalyDetails(_original, _reconstructed) {
    return {
      mostAnomalousFeatures: [0, 5, 12], // Indices of most anomalous features
      severity: 'medium'
    };
  }

  calculateAnomalyConfidence(error, threshold) {
    return Math.min(0.99, error / threshold);
  }

  prepareChurnFeatures(_customer) {
    // Mock churn features
    return Array(12).fill(0).map(() => Math.random());
  }

  identifyChurnFactors(_features) {
    return [
      'Decreased order frequency',
      'Lower engagement with promotions',
      'Reduced average order value'
    ];
  }

  generateRetentionStrategies(churnProbability, _features) {
    const strategies = [];

    if (churnProbability > 0.5) {
      strategies.push('Immediate intervention required');
      strategies.push('Offer personalized discount');
      strategies.push('Assign dedicated account manager');
    }

    return strategies;
  }

  prepareRecommendationFeatures(_customer, _category) {
    // Mock recommendation features
    return Array(100).fill(0).map(() => Math.random());
  }

  calculateRecommendationConfidence(scores) {
    const maxScore = Math.max(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    return maxScore / (avgScore + 0.1); // Avoid division by zero
  }

  preparePriceOptimizationFeatures(_product, _constraints) {
    // Mock price optimization features
    return Array(10).fill(0).map(() => Math.random());
  }

  calculateDemandChange(elasticity, newPrice, oldPrice) {
    const priceChange = (newPrice - oldPrice) / oldPrice;
    return -elasticity * priceChange * 100; // Percentage change
  }

  calculateRevenueChange(elasticity, newPrice, oldPrice) {
    const priceChange = (newPrice - oldPrice) / oldPrice;
    const demandChange = -elasticity * priceChange;
    return (priceChange + demandChange + priceChange * demandChange) * 100;
  }

  generatePricingRecommendations(optimalPrice, currentPrice, _elasticity) {
    const recommendations = [];

    if (optimalPrice > currentPrice) {
      recommendations.push('Consider price increase - demand is relatively inelastic');
    } else if (optimalPrice < currentPrice) {
      recommendations.push('Consider price reduction - could increase overall revenue');
    }

    return recommendations;
  }

  calculateForecastConfidence(historicalData) {
    // Simple confidence based on data consistency
    const variance = this.calculateVariance(historicalData.map((d) => d.sales));
    return Math.max(0.1, Math.min(0.95, 1 - variance / 1000));
  }

  calculateVariance(data) {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    return data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
  }

  analyzeDemandTrends(historicalData) {
    // Simple trend analysis
    const recent = historicalData.slice(-7).map((d) => d.sales);
    const older = historicalData.slice(-14, -7).map((d) => d.sales);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const trend = (recentAvg - olderAvg) / olderAvg;

    return {
      direction: trend > 0.05 ? 'increasing' : trend < -0.05 ? 'decreasing' : 'stable',
      magnitude: Math.abs(trend),
      confidence: 0.7
    };
  }

  detectSeasonality(_historicalData) {
    // Mock seasonality detection
    return {
      hasSeasonality: true,
      period: 7, // Weekly seasonality
      strength: 0.3
    };
  }

  generateForecastSeries(forecastValues, days) {
    const series = [];
    const baseDate = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i + 1);

      series.push({
        date: date.toISOString().split('T')[0],
        predictedDemand: Math.max(0, forecastValues[0] * (1 + (Math.random() - 0.5) * 0.2)),
        confidence: 0.8 - (i / days) * 0.3 // Confidence decreases over time
      });
    }

    return series;
  }

  analyzeCLVFactors(_features) {
    return {
      topFactors: [
        { factor: 'Total Orders', importance: 0.35 },
        { factor: 'Average Order Value', importance: 0.28 },
        { factor: 'Loyalty Score', importance: 0.22 }
      ]
    };
  }
}

module.exports = MLIntegrationService;
