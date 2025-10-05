let tf;
try {
  tf = require('@tensorflow/tfjs-node');
  console.log('[AIRecommendationEngine] Using @tensorflow/tfjs-node backend');
} catch (err) {
  console.warn('[AIRecommendationEngine] Failed to load @tensorflow/tfjs-node, falling back to @tensorflow/tfjs (CPU). Error:', err.message);
  tf = require('@tensorflow/tfjs');
}
const ss = require('simple-statistics');
const math = require('mathjs');

class AIRecommendationEngine {
  constructor() {
    this.models = new Map();
    this.userProfiles = new Map();
    this.itemFeatures = new Map();
    this.collaborativeFilters = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('Initializing AI Recommendation Engine...');
    
    // Initialize recommendation models
    await this.initializeRecommendationModels();
    
    // Load user profiles and item features
    await this.loadUserProfiles();
    await this.loadItemFeatures();
    
    this.initialized = true;
    console.log('AI Recommendation Engine initialized successfully');
  }

  async initializeRecommendationModels() {
    // Product recommendation model
    await this.initializeProductRecommendationModel();
    
    // Customer segmentation model
    await this.initializeCustomerSegmentationModel();
    
    // Personalized promotion model
    await this.initializePersonalizedPromotionModel();
    
    // Content-based filtering model
    await this.initializeContentBasedModel();
    
    // Collaborative filtering model
    await this.initializeCollaborativeFilteringModel();
  }

  async initializeProductRecommendationModel() {
    try {
      // Neural collaborative filtering model
      const userInput = tf.input({ shape: [1], name: 'user_input' });
      const itemInput = tf.input({ shape: [1], name: 'item_input' });
      
      // User embedding
      const userEmbedding = tf.layers.embedding({
        inputDim: 10000, // max users
        outputDim: 50,
        name: 'user_embedding'
      }).apply(userInput);
      
      // Item embedding
      const itemEmbedding = tf.layers.embedding({
        inputDim: 5000, // max items
        outputDim: 50,
        name: 'item_embedding'
      }).apply(itemInput);
      
      // Flatten embeddings
      const userFlat = tf.layers.flatten().apply(userEmbedding);
      const itemFlat = tf.layers.flatten().apply(itemEmbedding);
      
      // Concatenate embeddings
      const concat = tf.layers.concatenate().apply([userFlat, itemFlat]);
      
      // Dense layers
      const dense1 = tf.layers.dense({ units: 128, activation: 'relu' }).apply(concat);
      const dropout1 = tf.layers.dropout({ rate: 0.2 }).apply(dense1);
      const dense2 = tf.layers.dense({ units: 64, activation: 'relu' }).apply(dropout1);
      const dropout2 = tf.layers.dropout({ rate: 0.2 }).apply(dense2);
      const output = tf.layers.dense({ units: 1, activation: 'sigmoid' }).apply(dropout2);
      
      const model = tf.model({ inputs: [userInput, itemInput], outputs: output });
      
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
      
      this.models.set('productRecommendation', model);
      
      // Train with synthetic data
      await this.trainProductRecommendationModel(model);
      
    } catch (error) {
      console.error('Error initializing product recommendation model:', error);
    }
  }

  async initializeCustomerSegmentationModel() {
    try {
      // K-means clustering model for customer segmentation
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [15], units: 64, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'softmax' }) // 8 customer segments
        ]
      });

      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.models.set('customerSegmentation', model);
      
      // Train with synthetic data
      await this.trainCustomerSegmentationModel(model);
      
    } catch (error) {
      console.error('Error initializing customer segmentation model:', error);
    }
  }

  async initializePersonalizedPromotionModel() {
    try {
      // Personalized promotion recommendation model
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [20], units: 128, activation: 'relu' }),
          tf.layers.batchNormalization(),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({ units: 64, activation: 'relu' }),
          tf.layers.batchNormalization(),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 10, activation: 'softmax' }) // 10 promotion types
        ]
      });

      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.models.set('personalizedPromotion', model);
      
      // Train with synthetic data
      await this.trainPersonalizedPromotionModel(model);
      
    } catch (error) {
      console.error('Error initializing personalized promotion model:', error);
    }
  }

  async initializeContentBasedModel() {
    try {
      // Content-based filtering using item features
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [25], units: 128, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 64, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });

      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      this.models.set('contentBased', model);
      
      // Train with synthetic data
      await this.trainContentBasedModel(model);
      
    } catch (error) {
      console.error('Error initializing content-based model:', error);
    }
  }

  async initializeCollaborativeFilteringModel() {
    try {
      // Matrix factorization for collaborative filtering
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [100], units: 64, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 5, activation: 'linear' }) // Rating prediction
        ]
      });

      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

      this.models.set('collaborativeFiltering', model);
      
      // Train with synthetic data
      await this.trainCollaborativeFilteringModel(model);
      
    } catch (error) {
      console.error('Error initializing collaborative filtering model:', error);
    }
  }

  // Product Recommendations
  async getProductRecommendations(userId, options = {}) {
    await this.initialize();
    
    const {
      limit = 10,
      category = null,
      priceRange = null,
      includeReasons = true,
      diversityFactor = 0.3
    } = options;

    try {
      // Get user profile
      const userProfile = await this.getUserProfile(userId);
      
      // Get candidate products
      const candidates = await this.getCandidateProducts(userProfile, category, priceRange);
      
      // Score products using multiple approaches
      const scoredProducts = await this.scoreProducts(userId, candidates, userProfile);
      
      // Apply diversity and ranking
      const rankedProducts = this.applyDiversityRanking(scoredProducts, diversityFactor);
      
      // Get top recommendations
      const recommendations = rankedProducts.slice(0, limit);
      
      // Add explanations if requested
      if (includeReasons) {
        for (const rec of recommendations) {
          rec.reasons = await this.generateRecommendationReasons(userId, rec, userProfile);
        }
      }
      
      return {
        userId,
        recommendations,
        metadata: {
          totalCandidates: candidates.length,
          scoringMethods: ['collaborative', 'content', 'popularity', 'personal'],
          diversityApplied: diversityFactor > 0,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generating product recommendations:', error);
      throw error;
    }
  }

  // Customer Segmentation
  async segmentCustomer(customerData) {
    await this.initialize();
    
    const model = this.models.get('customerSegmentation');
    if (!model) throw new Error('Customer segmentation model not available');

    try {
      // Normalize customer features
      const features = this.normalizeCustomerSegmentationFeatures(customerData);
      const prediction = model.predict(tf.tensor2d([features]));
      const probabilities = await prediction.data();
      
      const segments = [
        'Champions', 'Loyal Customers', 'Potential Loyalists', 'New Customers',
        'Promising', 'Need Attention', 'About to Sleep', 'At Risk'
      ];
      
      const segmentScores = segments.map((segment, index) => ({
        segment,
        probability: probabilities[index],
        confidence: this.calculateConfidence(probabilities[index])
      }));
      
      // Sort by probability
      segmentScores.sort((a, b) => b.probability - a.probability);
      
      const primarySegment = segmentScores[0];
      
      return {
        customerId: customerData.customerId,
        primarySegment: primarySegment.segment,
        confidence: primarySegment.confidence,
        allSegments: segmentScores,
        characteristics: this.getSegmentCharacteristics(primarySegment.segment),
        recommendations: this.getSegmentRecommendations(primarySegment.segment, customerData)
      };
    } catch (error) {
      console.error('Error segmenting customer:', error);
      throw error;
    }
  }

  // Personalized Promotions
  async getPersonalizedPromotions(userId, options = {}) {
    await this.initialize();
    
    const {
      limit = 5,
      budget = null,
      channel = null,
      timeframe = 30
    } = options;

    try {
      // Get user profile and segment
      const userProfile = await this.getUserProfile(userId);
      const segmentation = await this.segmentCustomer(userProfile);
      
      // Get promotion candidates
      const promotionCandidates = await this.getPromotionCandidates(budget, channel, timeframe);
      
      // Score promotions for this user
      const scoredPromotions = await this.scorePromotions(userId, promotionCandidates, userProfile, segmentation);
      
      // Rank and select top promotions
      const rankedPromotions = scoredPromotions
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      // Add personalization details
      for (const promotion of rankedPromotions) {
        promotion.personalization = await this.personalizePromotion(promotion, userProfile);
      }
      
      return {
        userId,
        segment: segmentation.primarySegment,
        promotions: rankedPromotions,
        metadata: {
          totalCandidates: promotionCandidates.length,
          personalizationApplied: true,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generating personalized promotions:', error);
      throw error;
    }
  }

  // Content-Based Recommendations
  async getContentBasedRecommendations(userId, itemId, options = {}) {
    await this.initialize();
    
    const { limit = 10, similarityThreshold = 0.7 } = options;

    try {
      // Get item features
      const itemFeatures = await this.getItemFeatures(itemId);
      
      // Find similar items
      const similarItems = await this.findSimilarItems(itemFeatures, similarityThreshold);
      
      // Get user preferences
      const userProfile = await this.getUserProfile(userId);
      
      // Score similar items based on user preferences
      const scoredItems = await this.scoreItemsForUser(similarItems, userProfile);
      
      // Rank and return top recommendations
      const recommendations = scoredItems
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      return {
        userId,
        baseItem: itemId,
        recommendations,
        method: 'content-based',
        similarityThreshold,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating content-based recommendations:', error);
      throw error;
    }
  }

  // Collaborative Filtering Recommendations
  async getCollaborativeRecommendations(userId, options = {}) {
    await this.initialize();
    
    const { limit = 10, method = 'user-based' } = options;

    try {
      let recommendations;
      
      if (method === 'user-based') {
        recommendations = await this.getUserBasedRecommendations(userId, limit);
      } else if (method === 'item-based') {
        recommendations = await this.getItemBasedRecommendations(userId, limit);
      } else {
        // Hybrid approach
        const userBased = await this.getUserBasedRecommendations(userId, Math.ceil(limit / 2));
        const itemBased = await this.getItemBasedRecommendations(userId, Math.floor(limit / 2));
        recommendations = [...userBased, ...itemBased];
      }
      
      return {
        userId,
        recommendations,
        method: `collaborative-${method}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating collaborative recommendations:', error);
      throw error;
    }
  }

  // Hybrid Recommendations
  async getHybridRecommendations(userId, options = {}) {
    await this.initialize();
    
    const {
      limit = 10,
      weights = { collaborative: 0.4, content: 0.3, popularity: 0.2, personal: 0.1 },
      diversityFactor = 0.3
    } = options;

    try {
      // Get recommendations from different approaches
      const [collaborative, content, popularity, personal] = await Promise.all([
        this.getCollaborativeRecommendations(userId, { limit: limit * 2 }),
        this.getContentBasedRecommendations(userId, null, { limit: limit * 2 }),
        this.getPopularityRecommendations(userId, { limit: limit * 2 }),
        this.getPersonalizedRecommendations(userId, { limit: limit * 2 })
      ]);
      
      // Combine and weight recommendations
      const combinedScores = this.combineRecommendationScores([
        { recommendations: collaborative.recommendations, weight: weights.collaborative },
        { recommendations: content.recommendations, weight: weights.content },
        { recommendations: popularity.recommendations, weight: weights.popularity },
        { recommendations: personal.recommendations, weight: weights.personal }
      ]);
      
      // Apply diversity and ranking
      const diversifiedRecommendations = this.applyDiversityRanking(combinedScores, diversityFactor);
      
      // Get top recommendations
      const finalRecommendations = diversifiedRecommendations.slice(0, limit);
      
      return {
        userId,
        recommendations: finalRecommendations,
        method: 'hybrid',
        weights,
        diversityFactor,
        sources: {
          collaborative: collaborative.recommendations.length,
          content: content.recommendations.length,
          popularity: popularity.recommendations.length,
          personal: personal.recommendations.length
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating hybrid recommendations:', error);
      throw error;
    }
  }

  // Real-time Recommendations
  async getRealTimeRecommendations(userId, context = {}) {
    await this.initialize();
    
    const {
      currentPage = null,
      currentProduct = null,
      cartItems = [],
      sessionData = {},
      limit = 5
    } = context;

    try {
      let recommendations = [];
      
      // Context-aware recommendations based on current activity
      if (currentProduct) {
        // Product detail page - show related products
        const related = await this.getContentBasedRecommendations(userId, currentProduct, { limit });
        recommendations = related.recommendations;
      } else if (cartItems.length > 0) {
        // Cart page - show complementary products
        const complementary = await this.getComplementaryProducts(cartItems, { limit });
        recommendations = complementary;
      } else if (currentPage === 'homepage') {
        // Homepage - show personalized trending
        const trending = await this.getPersonalizedTrending(userId, { limit });
        recommendations = trending;
      } else {
        // Default - hybrid recommendations
        const hybrid = await this.getHybridRecommendations(userId, { limit });
        recommendations = hybrid.recommendations;
      }
      
      // Add real-time context
      for (const rec of recommendations) {
        rec.context = {
          reason: this.getContextualReason(currentPage, currentProduct, cartItems),
          urgency: this.calculateUrgency(rec, sessionData),
          personalization: await this.getPersonalizationLevel(userId, rec)
        };
      }
      
      return {
        userId,
        context: {
          currentPage,
          currentProduct,
          cartItems: cartItems.length,
          sessionDuration: sessionData.duration || 0
        },
        recommendations,
        realTime: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating real-time recommendations:', error);
      throw error;
    }
  }

  // Batch Recommendations
  async generateBatchRecommendations(userIds, options = {}) {
    const {
      method = 'hybrid',
      limit = 10,
      parallel = true,
      batchSize = 100
    } = options;

    const results = [];
    const batches = this.createBatches(userIds, batchSize);
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (userId) => {
        try {
          let recommendations;
          
          switch (method) {
            case 'collaborative':
              recommendations = await this.getCollaborativeRecommendations(userId, { limit });
              break;
            case 'content':
              recommendations = await this.getContentBasedRecommendations(userId, null, { limit });
              break;
            case 'personalized':
              recommendations = await this.getPersonalizedPromotions(userId, { limit });
              break;
            default:
              recommendations = await this.getHybridRecommendations(userId, { limit });
          }
          
          return { userId, success: true, recommendations };
        } catch (error) {
          return { userId, success: false, error: error.message };
        }
      });
      
      const batchResults = parallel 
        ? await Promise.all(batchPromises)
        : await this.sequentialProcess(batchPromises);
      
      results.push(...batchResults);
    }
    
    return {
      totalUsers: userIds.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length,
      results,
      method,
      timestamp: new Date().toISOString()
    };
  }

  // Training Methods
  async trainProductRecommendationModel(model) {
    // Generate synthetic training data for product recommendations
    const trainingData = this.generateProductRecommendationTrainingData();
    const { userIds, itemIds, ratings } = trainingData;
    
    const userTensor = tf.tensor2d(userIds.map(id => [id]));
    const itemTensor = tf.tensor2d(itemIds.map(id => [id]));
    const ratingTensor = tf.tensor2d(ratings.map(r => [r]));
    
    await model.fit([userTensor, itemTensor], ratingTensor, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    });
    
    userTensor.dispose();
    itemTensor.dispose();
    ratingTensor.dispose();
  }

  async trainCustomerSegmentationModel(model) {
    const trainingData = this.generateCustomerSegmentationTrainingData();
    const { inputs, outputs } = trainingData;
    
    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(outputs);
    
    await model.fit(xs, ys, {
      epochs: 75,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    });
    
    xs.dispose();
    ys.dispose();
  }

  async trainPersonalizedPromotionModel(model) {
    const trainingData = this.generatePersonalizedPromotionTrainingData();
    const { inputs, outputs } = trainingData;
    
    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(outputs);
    
    await model.fit(xs, ys, {
      epochs: 60,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    });
    
    xs.dispose();
    ys.dispose();
  }

  async trainContentBasedModel(model) {
    const trainingData = this.generateContentBasedTrainingData();
    const { inputs, outputs } = trainingData;
    
    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(outputs);
    
    await model.fit(xs, ys, {
      epochs: 40,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    });
    
    xs.dispose();
    ys.dispose();
  }

  async trainCollaborativeFilteringModel(model) {
    const trainingData = this.generateCollaborativeFilteringTrainingData();
    const { inputs, outputs } = trainingData;
    
    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(outputs);
    
    await model.fit(xs, ys, {
      epochs: 80,
      batchSize: 16,
      validationSplit: 0.2,
      verbose: 0
    });
    
    xs.dispose();
    ys.dispose();
  }

  // Data Generation Methods (for training)
  generateProductRecommendationTrainingData() {
    const userIds = [];
    const itemIds = [];
    const ratings = [];
    
    for (let i = 0; i < 10000; i++) {
      userIds.push(Math.floor(Math.random() * 1000));
      itemIds.push(Math.floor(Math.random() * 500));
      ratings.push(Math.random()); // 0-1 rating
    }
    
    return { userIds, itemIds, ratings };
  }

  generateCustomerSegmentationTrainingData() {
    const inputs = [];
    const outputs = [];
    
    for (let i = 0; i < 2000; i++) {
      // Generate customer features (15 features)
      const features = [
        Math.random() * 100, // age
        Math.random() * 100000, // income
        Math.random() * 1000, // total_purchases
        Math.random() * 5000, // avg_order_value
        Math.random() * 365, // days_since_last_purchase
        Math.random() * 50, // purchase_frequency
        Math.random() * 10, // categories_purchased
        Math.random(), // email_engagement
        Math.random(), // mobile_usage
        Math.random() * 12, // tenure_months
        Math.random() * 10, // support_interactions
        Math.random(), // satisfaction_score
        Math.random() * 5, // referrals_made
        Math.random(), // social_engagement
        Math.random() * 100 // loyalty_points
      ];
      
      // Generate segment (one-hot encoded)
      const segmentIndex = Math.floor(Math.random() * 8);
      const segment = new Array(8).fill(0);
      segment[segmentIndex] = 1;
      
      inputs.push(features);
      outputs.push(segment);
    }
    
    return { inputs, outputs };
  }

  generatePersonalizedPromotionTrainingData() {
    const inputs = [];
    const outputs = [];
    
    for (let i = 0; i < 1500; i++) {
      // Generate user and promotion features (20 features)
      const features = [
        Math.random() * 100, // user_age
        Math.random() * 100000, // user_income
        Math.random() * 1000, // user_purchases
        Math.random() * 5000, // user_avg_order
        Math.random() * 8, // user_segment
        Math.random() * 50, // promotion_discount
        Math.random() * 30, // promotion_duration
        Math.random() * 5, // promotion_type
        Math.random() * 10, // product_category
        Math.random() * 1000, // product_price
        Math.random() * 12, // season
        Math.random() * 7, // day_of_week
        Math.random(), // is_holiday
        Math.random() * 100, // competition_intensity
        Math.random(), // user_price_sensitivity
        Math.random(), // user_brand_loyalty
        Math.random() * 10, // user_channel_preference
        Math.random(), // promotion_urgency
        Math.random() * 100, // inventory_level
        Math.random() // market_trend
      ];
      
      // Generate promotion type preference (one-hot encoded)
      const promotionIndex = Math.floor(Math.random() * 10);
      const promotion = new Array(10).fill(0);
      promotion[promotionIndex] = 1;
      
      inputs.push(features);
      outputs.push(promotion);
    }
    
    return { inputs, outputs };
  }

  generateContentBasedTrainingData() {
    const inputs = [];
    const outputs = [];
    
    for (let i = 0; i < 1200; i++) {
      // Generate item features (25 features)
      const features = Array.from({ length: 25 }, () => Math.random());
      
      // Generate preference score (0 or 1)
      const preference = Math.random() > 0.5 ? 1 : 0;
      
      inputs.push(features);
      outputs.push([preference]);
    }
    
    return { inputs, outputs };
  }

  generateCollaborativeFilteringTrainingData() {
    const inputs = [];
    const outputs = [];
    
    for (let i = 0; i < 800; i++) {
      // Generate user-item interaction matrix features (100 features)
      const features = Array.from({ length: 100 }, () => Math.random());
      
      // Generate rating (1-5)
      const rating = Math.floor(Math.random() * 5) + 1;
      
      inputs.push(features);
      outputs.push([rating]);
    }
    
    return { inputs, outputs };
  }

  // Utility Methods
  async getUserProfile(userId) {
    // Mock user profile - in real implementation, fetch from database
    return {
      userId,
      age: 25 + Math.random() * 50,
      income: 30000 + Math.random() * 70000,
      totalPurchases: Math.floor(Math.random() * 100),
      avgOrderValue: 50 + Math.random() * 200,
      categories: ['electronics', 'clothing', 'home'],
      preferences: {
        priceRange: 'medium',
        brands: ['brand1', 'brand2'],
        channels: ['online', 'mobile']
      }
    };
  }

  async getItemFeatures(itemId) {
    // Mock item features - in real implementation, fetch from database
    return {
      itemId,
      category: 'electronics',
      price: 50 + Math.random() * 500,
      brand: 'brand' + Math.floor(Math.random() * 10),
      rating: 3 + Math.random() * 2,
      features: Array.from({ length: 25 }, () => Math.random())
    };
  }

  calculateConfidence(probability) {
    return Math.abs(probability - 0.5) * 2;
  }

  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  async sequentialProcess(promises) {
    const results = [];
    for (const promise of promises) {
      results.push(await promise);
    }
    return results;
  }

  // Additional utility methods would continue here...
  // (truncated for brevity)

  async getRecommendationMetrics() {
    return {
      models: Array.from(this.models.keys()),
      userProfiles: this.userProfiles.size,
      itemFeatures: this.itemFeatures.size,
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = new AIRecommendationEngine();