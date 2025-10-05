/**
 * Local AI/ML Configuration
 * This configuration ensures all AI/ML processing is done locally
 * NO external AI services (OpenAI, Azure AI, AWS AI, Google AI) are used
 */

const path = require('path');

const aiConfig = {
  // AI Provider Configuration - LOCAL ONLY
  provider: process.env.AI_PROVIDER || 'local',
  
  // TensorFlow.js Configuration
  tensorflow: {
    backend: process.env.TFJS_BACKEND || 'cpu', // cpu, webgl, or tensorflow (for GPU)
    platform: process.env.TFJS_PLATFORM || 'node',
    enableGPU: process.env.AI_ENABLE_GPU === 'true' || false,
    maxMemory: parseInt(process.env.AI_MAX_MEMORY) || 2048, // MB
  },

  // Local Model Paths
  models: {
    basePath: process.env.AI_MODELS_PATH || path.join(__dirname, '../../models'),
    demandForecasting: process.env.ML_DEMAND_FORECASTING_MODEL || 'demand_forecasting.json',
    priceOptimization: process.env.ML_PRICE_OPTIMIZATION_MODEL || 'price_optimization.json',
    customerSegmentation: process.env.ML_CUSTOMER_SEGMENTATION_MODEL || 'customer_segmentation.json',
    promotionEffectiveness: process.env.ML_PROMOTION_EFFECTIVENESS_MODEL || 'promotion_effectiveness.json',
    anomalyDetection: 'anomaly_detection.json',
    recommendationEngine: 'recommendation_engine.json',
    sentimentAnalysis: 'sentiment_analysis.json',
    churnPrediction: 'churn_prediction.json'
  },

  // Local ML Algorithms Configuration
  algorithms: {
    // Regression algorithms
    regression: {
      linear: { enabled: true },
      polynomial: { enabled: true, degree: 3 },
      ridge: { enabled: true, alpha: 1.0 },
      lasso: { enabled: true, alpha: 1.0 }
    },
    
    // Classification algorithms
    classification: {
      logistic: { enabled: true },
      svm: { enabled: true },
      randomForest: { enabled: true, trees: 100 },
      neuralNetwork: { enabled: true, layers: [64, 32, 16] }
    },
    
    // Clustering algorithms
    clustering: {
      kmeans: { enabled: true, maxClusters: 10 },
      hierarchical: { enabled: true },
      dbscan: { enabled: true }
    },
    
    // Time series algorithms
    timeSeries: {
      arima: { enabled: true },
      exponentialSmoothing: { enabled: true },
      lstm: { enabled: true, units: 50, epochs: 100 }
    }
  },

  // Feature Engineering Configuration
  featureEngineering: {
    scaling: {
      method: 'standardization', // standardization, normalization, robust
      enabled: true
    },
    encoding: {
      categorical: 'oneHot', // oneHot, label, target
      enabled: true
    },
    selection: {
      method: 'correlation', // correlation, mutual_info, chi2
      threshold: 0.8,
      enabled: true
    }
  },

  // Model Training Configuration
  training: {
    validation: {
      method: 'cross_validation', // cross_validation, holdout, bootstrap
      folds: 5,
      testSize: 0.2
    },
    optimization: {
      hyperparameterTuning: true,
      gridSearch: true,
      randomSearch: true,
      maxIterations: 100
    },
    earlyStoppingPatience: 10,
    batchSize: 32,
    epochs: 100,
    learningRate: 0.001
  },

  // Prediction Configuration
  prediction: {
    confidence: {
      threshold: 0.7,
      includeUncertainty: true
    },
    caching: {
      enabled: true,
      ttl: 3600 // seconds
    },
    batch: {
      enabled: true,
      maxSize: 1000
    }
  },

  // Natural Language Processing (Local)
  nlp: {
    enabled: true,
    language: 'en',
    models: {
      tokenizer: 'local_tokenizer',
      stemmer: 'porter_stemmer',
      sentiment: 'local_sentiment_model'
    },
    preprocessing: {
      lowercase: true,
      removeStopwords: true,
      removePunctuation: true,
      stemming: true
    }
  },

  // Computer Vision (Local)
  computerVision: {
    enabled: false, // Enable if needed for image processing
    models: {
      objectDetection: 'local_object_detection_model',
      imageClassification: 'local_image_classification_model'
    }
  },

  // Recommendation System Configuration
  recommendations: {
    collaborative: {
      enabled: true,
      algorithm: 'matrix_factorization',
      factors: 50,
      regularization: 0.01
    },
    contentBased: {
      enabled: true,
      similarity: 'cosine', // cosine, euclidean, pearson
      features: ['category', 'price', 'brand', 'attributes']
    },
    hybrid: {
      enabled: true,
      weights: {
        collaborative: 0.6,
        contentBased: 0.4
      }
    }
  },

  // Anomaly Detection Configuration
  anomalyDetection: {
    enabled: true,
    algorithms: {
      isolationForest: { enabled: true, contamination: 0.1 },
      oneClassSVM: { enabled: true, nu: 0.05 },
      localOutlierFactor: { enabled: true, neighbors: 20 }
    },
    threshold: 0.05,
    realTime: true
  },

  // Performance Monitoring
  monitoring: {
    enabled: true,
    metrics: {
      accuracy: true,
      precision: true,
      recall: true,
      f1Score: true,
      auc: true,
      mse: true,
      mae: true
    },
    logging: {
      level: 'info',
      includeTimings: true,
      includeMemoryUsage: true
    }
  },

  // External AI Services - ALL DISABLED
  external: {
    openai: {
      enabled: false,
      apiKey: null,
      model: null
    },
    azure: {
      enabled: false,
      endpoint: null,
      apiKey: null
    },
    aws: {
      enabled: false,
      region: null,
      accessKey: null,
      secretKey: null
    },
    google: {
      enabled: false,
      projectId: null,
      keyFile: null
    }
  },

  // Security Configuration
  security: {
    dataEncryption: {
      enabled: true,
      algorithm: 'aes-256-gcm'
    },
    modelProtection: {
      enabled: true,
      checksums: true,
      signing: true
    },
    auditLogging: {
      enabled: true,
      includeInputs: false, // Don't log sensitive data
      includeOutputs: true
    }
  }
};

// Validation function to ensure local-only configuration
function validateLocalOnlyConfig() {
  const externalServices = aiConfig.external;
  const enabledServices = Object.keys(externalServices).filter(
    service => externalServices[service].enabled
  );

  if (enabledServices.length > 0) {
    throw new Error(
      `External AI services are not allowed. Found enabled services: ${enabledServices.join(', ')}`
    );
  }

  if (aiConfig.provider !== 'local') {
    throw new Error(`AI provider must be 'local', found: ${aiConfig.provider}`);
  }

  console.log('✅ AI Configuration validated: All processing is local-only');
}

// Initialize TensorFlow.js backend
async function initializeTensorFlow() {
  try {
    let tf;
    
    // Try to load TensorFlow.js Node backend first
    try {
      tf = require('@tensorflow/tfjs-node');
      console.log('✅ TensorFlow.js Node backend loaded successfully');
    } catch (error) {
      console.warn('⚠️ TensorFlow.js Node backend not available, using CPU backend');
      tf = require('@tensorflow/tfjs');
    }

    // Set backend configuration
    if (aiConfig.tensorflow.backend === 'cpu') {
      await tf.setBackend('cpu');
    }

    console.log(`✅ TensorFlow.js backend set to: ${tf.getBackend()}`);
    console.log(`✅ TensorFlow.js version: ${tf.version.tfjs}`);
    
    return tf;
  } catch (error) {
    console.error('❌ Failed to initialize TensorFlow.js:', error);
    throw error;
  }
}

// Export configuration and utilities
module.exports = {
  aiConfig,
  validateLocalOnlyConfig,
  initializeTensorFlow,
  
  // Helper functions
  getModelPath: (modelName) => {
    return path.join(aiConfig.models.basePath, aiConfig.models[modelName]);
  },
  
  isLocalOnly: () => {
    return aiConfig.provider === 'local' && 
           Object.values(aiConfig.external).every(service => !service.enabled);
  },
  
  getEnabledAlgorithms: (category) => {
    const algorithms = aiConfig.algorithms[category];
    if (!algorithms) return [];
    
    return Object.keys(algorithms).filter(alg => algorithms[alg].enabled);
  }
};

// Validate configuration on module load
validateLocalOnlyConfig();