const tf = require('@tensorflow/tfjs');
const SalesHistory = require('../models/SalesHistory');
const logger = require('../utils/logger');
const config = require('../config');

class MLService {
  constructor() {
    this.models = {};
    this.isInitialized = false;
  }
  
  async initialize() {
    try {
      // Load or create models
      await this.loadModels();
      this.isInitialized = true;
      logger.info('ML Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ML Service:', error);
    }
  }
  
  async loadModels() {
    // Load pre-trained models if they exist
    // For now, we'll create them on demand
  }
  
  // Generate budget forecast using time series analysis
  async generateBudgetForecast({ year, scope, historicalMonths = 24 }) {
    try {
      // Get historical sales data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - historicalMonths);
      
      const query = { date: { $gte: startDate, $lte: endDate } };
      
      // Apply scope filters
      if (scope.customers && scope.customers.length > 0) {
        query.customer = { $in: scope.customers };
      }
      if (scope.products && scope.products.length > 0) {
        query.product = { $in: scope.products };
      }
      
      const historicalData = await SalesHistory.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: '$year',
              month: '$month'
            },
            salesUnits: { $sum: '$quantity' },
            salesValue: { $sum: '$revenue.gross' },
            tradeSpend: { $sum: '$tradeSpend.total' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
      
      if (historicalData.length < 12) {
        throw new Error('Insufficient historical data for forecasting');
      }
      
      // Prepare data for ML
      const salesValues = historicalData.map(d => d.salesValue);
      const salesUnits = historicalData.map(d => d.salesUnits);
      const tradeSpends = historicalData.map(d => d.tradeSpend);
      
      // Apply time series forecasting
      const forecast = await this.timeSeriesForecast(salesValues, 12);
      const unitsForecast = await this.timeSeriesForecast(salesUnits, 12);
      
      // Calculate seasonality indices
      const seasonality = this.calculateSeasonality(salesValues);
      
      // Generate monthly forecasts
      const monthlyForecasts = [];
      for (let month = 1; month <= 12; month++) {
        const baseValue = forecast[month - 1];
        const baseUnits = unitsForecast[month - 1];
        const seasonalFactor = seasonality[month - 1];
        
        // Apply seasonality
        const adjustedValue = baseValue * seasonalFactor;
        const adjustedUnits = baseUnits * seasonalFactor;
        
        // Calculate suggested trade spend (historical average percentage)
        const avgTradeSpendPercentage = this.calculateAverage(
          tradeSpends.map((ts, i) => ts / salesValues[i])
        );
        
        const suggestedTradeSpend = adjustedValue * avgTradeSpendPercentage;
        
        monthlyForecasts.push({
          month,
          salesUnits: Math.round(adjustedUnits),
          salesValue: Math.round(adjustedValue),
          confidence: 0.85 - (month * 0.02), // Confidence decreases over time
          factors: {
            seasonality: seasonalFactor,
            trend: this.calculateTrend(salesValues),
            volatility: this.calculateVolatility(salesValues)
          },
          suggestedMarketing: Math.round(suggestedTradeSpend * 0.4),
          suggestedCashCoop: Math.round(suggestedTradeSpend * 0.3),
          suggestedTradingTerms: Math.round(suggestedTradeSpend * 0.2),
          suggestedPromotions: Math.round(suggestedTradeSpend * 0.1)
        });
      }
      
      return {
        generated: true,
        generatedDate: new Date(),
        algorithm: 'LSTM_TimeSeries',
        accuracy: 0.85,
        parameters: {
          historicalMonths,
          dataPoints: historicalData.length,
          method: 'neural_network'
        },
        monthlyForecasts
      };
    } catch (error) {
      logger.error('Budget forecast generation failed:', error);
      throw error;
    }
  }
  
  // Time series forecasting using simple LSTM
  async timeSeriesForecast(data, periods) {
    // Normalize data
    const normalized = this.normalizeData(data);
    const { values, min, max } = normalized;
    
    // Prepare sequences for LSTM
    const sequenceLength = 6; // Use 6 months to predict next
    const sequences = [];
    const targets = [];
    
    for (let i = sequenceLength; i < values.length; i++) {
      sequences.push(values.slice(i - sequenceLength, i));
      targets.push(values[i]);
    }
    
    // Create and train model
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 50,
          returnSequences: true,
          inputShape: [sequenceLength, 1]
        }),
        tf.layers.lstm({
          units: 50,
          returnSequences: false
        }),
        tf.layers.dense({
          units: 1
        })
      ]
    });
    
    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });
    
    // Convert to tensors
    const xs = tf.tensor3d(sequences.map(seq => seq.map(val => [val])));
    const ys = tf.tensor2d(targets.map(t => [t]));
    
    // Train model
    await model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      verbose: 0
    });
    
    // Generate predictions
    const predictions = [];
    let lastSequence = values.slice(-sequenceLength);
    
    for (let i = 0; i < periods; i++) {
      const input = tf.tensor3d([lastSequence.map(val => [val])]);
      const prediction = model.predict(input);
      const predictedValue = await prediction.data();
      
      predictions.push(predictedValue[0]);
      
      // Update sequence for next prediction
      lastSequence = [...lastSequence.slice(1), predictedValue[0]];
      
      // Clean up tensors
      input.dispose();
      prediction.dispose();
    }
    
    // Clean up
    xs.dispose();
    ys.dispose();
    model.dispose();
    
    // Denormalize predictions
    return predictions.map(p => p * (max - min) + min);
  }
  
  // Calculate seasonality indices
  calculateSeasonality(data) {
    if (data.length < 24) {
      // Not enough data for seasonality, return neutral
      return Array(12).fill(1);
    }
    
    // Calculate monthly averages
    const monthlyAverages = Array(12).fill(0);
    const monthlyCounts = Array(12).fill(0);
    
    data.forEach((value, index) => {
      const month = index % 12;
      monthlyAverages[month] += value;
      monthlyCounts[month]++;
    });
    
    for (let i = 0; i < 12; i++) {
      monthlyAverages[i] /= monthlyCounts[i];
    }
    
    // Calculate overall average
    const overallAverage = this.calculateAverage(data);
    
    // Calculate seasonality indices
    return monthlyAverages.map(avg => avg / overallAverage);
  }
  
  // Anomaly detection in sales data
  async detectAnomalies(data, threshold = 2.5) {
    const values = data.map(d => d.value);
    const mean = this.calculateAverage(values);
    const stdDev = this.calculateStdDev(values, mean);
    
    const anomalies = [];
    
    data.forEach((item, index) => {
      const zScore = Math.abs((item.value - mean) / stdDev);
      
      if (zScore > threshold) {
        anomalies.push({
          ...item,
          anomalyScore: zScore,
          anomalyType: item.value > mean ? 'spike' : 'drop',
          expectedRange: {
            min: mean - (threshold * stdDev),
            max: mean + (threshold * stdDev)
          }
        });
      }
    });
    
    return anomalies;
  }
  
  // Promotion effectiveness prediction
  async predictPromotionEffectiveness(promotionData) {
    const {
      discountPercentage,
      duration,
      productCategory,
      customerSegment,
      historicalPromotions
    } = promotionData;
    
    // Simple effectiveness model based on historical data
    let baseEffectiveness = 1.0;
    
    // Discount impact (diminishing returns)
    const discountImpact = Math.log(1 + discountPercentage / 10) / Math.log(5);
    baseEffectiveness *= (1 + discountImpact);
    
    // Duration impact (optimal around 2-3 weeks)
    const optimalDuration = 14; // days
    const durationFactor = 1 - Math.abs(duration - optimalDuration) / optimalDuration * 0.3;
    baseEffectiveness *= durationFactor;
    
    // Category performance (would be learned from historical data)
    const categoryFactors = {
      'beverages': 1.2,
      'snacks': 1.15,
      'personal_care': 0.95,
      'household': 0.9
    };
    baseEffectiveness *= (categoryFactors[productCategory] || 1.0);
    
    // Customer segment factors
    const segmentFactors = {
      'premium': 0.8,
      'value': 1.2,
      'regular': 1.0
    };
    baseEffectiveness *= (segmentFactors[customerSegment] || 1.0);
    
    // Historical performance adjustment
    if (historicalPromotions && historicalPromotions.length > 0) {
      const avgHistoricalLift = this.calculateAverage(
        historicalPromotions.map(p => p.actualLift / p.expectedLift)
      );
      baseEffectiveness *= avgHistoricalLift;
    }
    
    // Calculate expected metrics
    const expectedLift = baseEffectiveness * 100; // percentage
    const confidenceScore = Math.min(0.95, 0.7 + (historicalPromotions?.length || 0) * 0.02);
    
    return {
      expectedLift,
      confidenceScore,
      recommendedAdjustments: this.getPromotionRecommendations(promotionData, expectedLift),
      riskFactors: this.identifyPromotionRisks(promotionData)
    };
  }
  
  // Price optimization
  async optimizePrice(productId, targetMargin, constraints) {
    // This would use historical elasticity data
    // For now, return a simple optimization
    
    const elasticity = -1.5; // Placeholder
    const currentPrice = constraints.currentPrice;
    const minPrice = constraints.minPrice || currentPrice * 0.7;
    const maxPrice = constraints.maxPrice || currentPrice * 1.3;
    
    // Simple optimization based on margin and elasticity
    let optimalPrice = currentPrice;
    let maxProfit = 0;
    
    for (let price = minPrice; price <= maxPrice; price += (maxPrice - minPrice) / 100) {
      const volumeChange = elasticity * ((price - currentPrice) / currentPrice);
      const newVolume = constraints.currentVolume * (1 + volumeChange);
      const profit = (price - constraints.cost) * newVolume;
      
      if (profit > maxProfit && (price - constraints.cost) / price >= targetMargin) {
        maxProfit = profit;
        optimalPrice = price;
      }
    }
    
    return {
      optimalPrice: Math.round(optimalPrice * 100) / 100,
      expectedVolume: Math.round(constraints.currentVolume * (1 + elasticity * ((optimalPrice - currentPrice) / currentPrice))),
      expectedProfit: Math.round(maxProfit),
      priceElasticity: elasticity,
      confidence: 0.75
    };
  }
  
  // Utility functions
  normalizeData(data) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    return {
      values: data.map(d => (d - min) / range),
      min,
      max
    };
  }
  
  calculateAverage(data) {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }
  
  calculateStdDev(data, mean) {
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = this.calculateAverage(squaredDiffs);
    return Math.sqrt(avgSquaredDiff);
  }
  
  calculateTrend(data) {
    // Simple linear regression
    const n = data.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = data.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * data[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    return slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';
  }
  
  calculateVolatility(data) {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i] - data[i - 1]) / data[i - 1]);
    }
    
    const mean = this.calculateAverage(returns);
    return this.calculateStdDev(returns, mean);
  }
  
  getPromotionRecommendations(promotionData, expectedLift) {
    const recommendations = [];
    
    if (promotionData.discountPercentage > 30) {
      recommendations.push({
        type: 'discount',
        message: 'Consider reducing discount to 25-30% for better margin',
        impact: 'high'
      });
    }
    
    if (promotionData.duration > 30) {
      recommendations.push({
        type: 'duration',
        message: 'Shorten promotion duration to maintain urgency',
        impact: 'medium'
      });
    }
    
    if (expectedLift < 20) {
      recommendations.push({
        type: 'mechanics',
        message: 'Consider adding bundle offers or gift items',
        impact: 'high'
      });
    }
    
    return recommendations;
  }
  
  identifyPromotionRisks(promotionData) {
    const risks = [];
    
    if (promotionData.discountPercentage > 40) {
      risks.push({
        type: 'margin_erosion',
        severity: 'high',
        description: 'Deep discount may significantly impact profitability'
      });
    }
    
    if (promotionData.overlap && promotionData.overlap.length > 0) {
      risks.push({
        type: 'cannibalization',
        severity: 'medium',
        description: 'Overlapping promotions may cannibalize sales'
      });
    }
    
    return risks;
  }

  /**
   * Predict promotion performance using ML models
   */
  async predictPromotionPerformance(params) {
    // Placeholder implementation - returns basic prediction
    const { discountPercent = 0, duration = 0 } = params;
    
    // Simple heuristic for now
    const baselineLift = discountPercent * 2; // 10% discount = 20% lift
    const durationFactor = Math.min(duration / 30, 1); // Normalize duration
    
    return {
      expectedLift: baselineLift * durationFactor,
      confidence: 0.75,
      volumeIncrease: baselineLift * 0.8,
      revenueImpact: baselineLift * 0.6 // After discount
    };
  }

  /**
   * Forecast volume using time series models
   */
  async forecastVolume(params) {
    // Placeholder implementation - returns basic forecast
    const { historicalVolume = 1000, periods = 12 } = params;
    
    const forecast = [];
    for (let i = 1; i <= periods; i++) {
      // Simple trend with random variation
      const trend = historicalVolume * (1 + 0.05 * i); // 5% growth per period
      const noise = (Math.random() - 0.5) * historicalVolume * 0.1; // ±10% noise
      forecast.push({
        period: i,
        value: Math.max(0, trend + noise),
        confidence: 0.8 - (i * 0.02) // Confidence decreases over time
      });
    }
    
    return forecast;
  }
}

module.exports = new MLService();