const EventEmitter = require('events');

/**
 * Advanced Anomaly Detection Service
 * Provides unsupervised learning, real-time anomaly detection, and automated alerting
 */

class AnomalyDetectionService extends EventEmitter {
  constructor() {
    super();
    this.detectors = new Map();
    this.models = new Map();
    this.anomalies = new Map();
    this.alerts = new Map();
    this.dataStreams = new Map();
    this.thresholds = new Map();
    this.patterns = new Map();
    this.isInitialized = false;
    
    this.initializeService();
  }

  async initializeService() {
    try {
      console.log('Initializing Anomaly Detection Service...');
      
      // Initialize detection models
      this.initializeDetectionModels();
      
      // Setup real-time monitoring
      this.setupRealTimeMonitoring();
      
      // Initialize alert system
      this.initializeAlertSystem();
      
      // Setup pattern recognition
      this.setupPatternRecognition();
      
      // Start monitoring loops
      this.startMonitoring();
      
      this.isInitialized = true;
      console.log('Anomaly Detection Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Anomaly Detection Service:', error);
    }
  }

  /**
   * Initialize detection models
   */
  initializeDetectionModels() {
    const models = [
      {
        id: 'isolation_forest',
        name: 'Isolation Forest',
        type: 'unsupervised',
        description: 'Tree-based anomaly detection using isolation',
        algorithm: 'isolation_forest',
        parameters: {
          n_estimators: 100,
          contamination: 0.1,
          max_samples: 'auto',
          max_features: 1.0
        },
        suitableFor: ['numerical_data', 'mixed_data'],
        performance: {
          precision: 0.85,
          recall: 0.78,
          f1_score: 0.81
        }
      },
      {
        id: 'one_class_svm',
        name: 'One-Class SVM',
        type: 'unsupervised',
        description: 'Support Vector Machine for novelty detection',
        algorithm: 'one_class_svm',
        parameters: {
          kernel: 'rbf',
          gamma: 'scale',
          nu: 0.05
        },
        suitableFor: ['high_dimensional_data', 'non_linear_patterns'],
        performance: {
          precision: 0.82,
          recall: 0.75,
          f1_score: 0.78
        }
      },
      {
        id: 'local_outlier_factor',
        name: 'Local Outlier Factor',
        type: 'unsupervised',
        description: 'Density-based local outlier detection',
        algorithm: 'lof',
        parameters: {
          n_neighbors: 20,
          contamination: 0.1,
          metric: 'minkowski'
        },
        suitableFor: ['density_based_detection', 'local_anomalies'],
        performance: {
          precision: 0.79,
          recall: 0.83,
          f1_score: 0.81
        }
      },
      {
        id: 'autoencoder',
        name: 'Autoencoder Neural Network',
        type: 'deep_learning',
        description: 'Neural network-based reconstruction error detection',
        algorithm: 'autoencoder',
        parameters: {
          encoding_dim: 32,
          hidden_layers: [128, 64, 32, 64, 128],
          activation: 'relu',
          loss: 'mse'
        },
        suitableFor: ['complex_patterns', 'high_dimensional_data'],
        performance: {
          precision: 0.88,
          recall: 0.82,
          f1_score: 0.85
        }
      },
      {
        id: 'statistical_outlier',
        name: 'Statistical Outlier Detection',
        type: 'statistical',
        description: 'Statistical methods for outlier detection',
        algorithm: 'z_score_modified',
        parameters: {
          threshold: 3.5,
          method: 'modified_z_score',
          window_size: 100
        },
        suitableFor: ['time_series', 'simple_numerical_data'],
        performance: {
          precision: 0.76,
          recall: 0.89,
          f1_score: 0.82
        }
      },
      {
        id: 'lstm_autoencoder',
        name: 'LSTM Autoencoder',
        type: 'time_series',
        description: 'LSTM-based sequence anomaly detection',
        algorithm: 'lstm_autoencoder',
        parameters: {
          sequence_length: 50,
          lstm_units: 64,
          dropout: 0.2,
          reconstruction_threshold: 0.1
        },
        suitableFor: ['time_series', 'sequential_data'],
        performance: {
          precision: 0.91,
          recall: 0.79,
          f1_score: 0.84
        }
      }
    ];

    models.forEach(model => {
      this.models.set(model.id, {
        ...model,
        status: 'loaded',
        lastTrained: new Date(),
        detections: 0,
        falsePositives: 0,
        lastUsed: null
      });
    });

    console.log('Anomaly detection models initialized:', models.length);
  }

  /**
   * Setup real-time monitoring
   */
  setupRealTimeMonitoring() {
    const monitoringTargets = [
      {
        id: 'transaction_monitoring',
        name: 'Transaction Anomaly Monitoring',
        description: 'Monitor financial transactions for fraud',
        dataSource: 'transaction_stream',
        features: [
          'amount', 'merchant_category', 'time_of_day', 'day_of_week',
          'location', 'payment_method', 'user_behavior_score'
        ],
        models: ['isolation_forest', 'autoencoder'],
        alertThreshold: 0.8,
        updateFrequency: 'real_time'
      },
      {
        id: 'user_behavior_monitoring',
        name: 'User Behavior Anomaly Monitoring',
        description: 'Monitor user behavior patterns',
        dataSource: 'user_activity_stream',
        features: [
          'session_duration', 'pages_visited', 'click_rate', 'scroll_depth',
          'time_between_actions', 'device_fingerprint', 'location_consistency'
        ],
        models: ['lstm_autoencoder', 'one_class_svm'],
        alertThreshold: 0.75,
        updateFrequency: 'real_time'
      },
      {
        id: 'system_performance_monitoring',
        name: 'System Performance Monitoring',
        description: 'Monitor system metrics for anomalies',
        dataSource: 'system_metrics_stream',
        features: [
          'cpu_usage', 'memory_usage', 'disk_io', 'network_io',
          'response_time', 'error_rate', 'throughput'
        ],
        models: ['statistical_outlier', 'isolation_forest'],
        alertThreshold: 0.9,
        updateFrequency: 'continuous'
      },
      {
        id: 'business_metrics_monitoring',
        name: 'Business Metrics Monitoring',
        description: 'Monitor key business metrics',
        dataSource: 'business_metrics_stream',
        features: [
          'revenue', 'conversion_rate', 'customer_acquisition_cost',
          'churn_rate', 'average_order_value', 'inventory_turnover'
        ],
        models: ['lstm_autoencoder', 'statistical_outlier'],
        alertThreshold: 0.85,
        updateFrequency: 'hourly'
      },
      {
        id: 'security_monitoring',
        name: 'Security Event Monitoring',
        description: 'Monitor security events and access patterns',
        dataSource: 'security_events_stream',
        features: [
          'login_attempts', 'access_patterns', 'privilege_escalation',
          'data_access_volume', 'unusual_locations', 'failed_authentications'
        ],
        models: ['one_class_svm', 'autoencoder'],
        alertThreshold: 0.95,
        updateFrequency: 'real_time'
      }
    ];

    monitoringTargets.forEach(target => {
      this.detectors.set(target.id, {
        ...target,
        status: 'active',
        lastCheck: new Date(),
        anomaliesDetected: 0,
        falsePositiveRate: 0.05,
        currentData: [],
        baseline: null
      });
    });

    console.log('Real-time monitoring targets configured:', monitoringTargets.length);
  }

  /**
   * Initialize alert system
   */
  initializeAlertSystem() {
    const alertTypes = [
      {
        id: 'critical_anomaly',
        name: 'Critical Anomaly Alert',
        description: 'High-severity anomalies requiring immediate attention',
        severity: 'critical',
        channels: ['email', 'sms', 'slack', 'webhook'],
        escalation: {
          enabled: true,
          levels: [
            { time: 5, recipients: ['on_call_engineer'] },
            { time: 15, recipients: ['team_lead', 'manager'] },
            { time: 30, recipients: ['director', 'cto'] }
          ]
        }
      },
      {
        id: 'high_anomaly',
        name: 'High Priority Anomaly',
        description: 'High-priority anomalies requiring prompt attention',
        severity: 'high',
        channels: ['email', 'slack'],
        escalation: {
          enabled: true,
          levels: [
            { time: 15, recipients: ['team_lead'] },
            { time: 60, recipients: ['manager'] }
          ]
        }
      },
      {
        id: 'medium_anomaly',
        name: 'Medium Priority Anomaly',
        description: 'Medium-priority anomalies for investigation',
        severity: 'medium',
        channels: ['email', 'dashboard'],
        escalation: {
          enabled: false
        }
      },
      {
        id: 'low_anomaly',
        name: 'Low Priority Anomaly',
        description: 'Low-priority anomalies for monitoring',
        severity: 'low',
        channels: ['dashboard'],
        escalation: {
          enabled: false
        }
      }
    ];

    this.alertTypes = alertTypes;
    console.log('Alert system initialized with', alertTypes.length, 'alert types');
  }

  /**
   * Setup pattern recognition
   */
  setupPatternRecognition() {
    const patternTypes = [
      {
        id: 'seasonal_patterns',
        name: 'Seasonal Patterns',
        description: 'Detect seasonal anomalies in time series data',
        algorithm: 'seasonal_decomposition',
        parameters: {
          period: 24, // hours
          trend_window: 168, // week
          seasonal_window: 7 // days
        }
      },
      {
        id: 'trend_anomalies',
        name: 'Trend Anomalies',
        description: 'Detect sudden changes in trends',
        algorithm: 'change_point_detection',
        parameters: {
          window_size: 50,
          threshold: 2.0,
          min_change: 0.1
        }
      },
      {
        id: 'correlation_breaks',
        name: 'Correlation Breaks',
        description: 'Detect breaks in expected correlations',
        algorithm: 'correlation_monitoring',
        parameters: {
          correlation_threshold: 0.7,
          window_size: 100,
          significance_level: 0.05
        }
      },
      {
        id: 'frequency_anomalies',
        name: 'Frequency Anomalies',
        description: 'Detect unusual frequency patterns',
        algorithm: 'frequency_analysis',
        parameters: {
          baseline_window: 1000,
          anomaly_threshold: 3.0,
          min_frequency: 0.01
        }
      }
    ];

    patternTypes.forEach(pattern => {
      this.patterns.set(pattern.id, {
        ...pattern,
        detections: [],
        lastAnalysis: null,
        baseline: null
      });
    });

    console.log('Pattern recognition configured:', patternTypes.length);
  }

  /**
   * Start monitoring loops
   */
  startMonitoring() {
    // Real-time monitoring loop
    setInterval(() => {
      this.runRealTimeDetection();
    }, 5000); // Every 5 seconds

    // Batch processing loop
    setInterval(() => {
      this.runBatchDetection();
    }, 60000); // Every minute

    // Pattern analysis loop
    setInterval(() => {
      this.runPatternAnalysis();
    }, 300000); // Every 5 minutes

    // Model retraining loop
    setInterval(() => {
      this.checkModelRetraining();
    }, 3600000); // Every hour

    console.log('Monitoring loops started');
  }

  /**
   * Run real-time detection
   */
  async runRealTimeDetection() {
    for (const [detectorId, detector] of this.detectors) {
      if (detector.status !== 'active') continue;

      try {
        // Simulate real-time data ingestion
        const newData = await this.ingestRealTimeData(detectorId);
        
        if (newData.length > 0) {
          // Run anomaly detection
          const anomalies = await this.detectAnomalies(detectorId, newData);
          
          // Process detected anomalies
          if (anomalies.length > 0) {
            await this.processAnomalies(detectorId, anomalies);
          }
          
          // Update detector status
          detector.lastCheck = new Date();
          detector.anomaliesDetected += anomalies.length;
        }
      } catch (error) {
        console.error(`Real-time detection failed for ${detectorId}:`, error);
      }
    }
  }

  /**
   * Ingest real-time data
   */
  async ingestRealTimeData(detectorId) {
    const detector = this.detectors.get(detectorId);
    if (!detector) return [];

    // Simulate data ingestion based on detector type
    const dataPoints = [];
    const numPoints = Math.floor(Math.random() * 10) + 1;

    for (let i = 0; i < numPoints; i++) {
      const dataPoint = this.generateDataPoint(detector);
      dataPoints.push(dataPoint);
    }

    // Add to current data buffer
    detector.currentData.push(...dataPoints);
    
    // Keep only recent data (sliding window)
    const maxBufferSize = 1000;
    if (detector.currentData.length > maxBufferSize) {
      detector.currentData = detector.currentData.slice(-maxBufferSize);
    }

    return dataPoints;
  }

  /**
   * Generate data point based on detector type
   */
  generateDataPoint(detector) {
    const timestamp = new Date();
    const dataPoint = { timestamp };

    detector.features.forEach(feature => {
      switch (feature) {
        case 'amount':
          dataPoint[feature] = this.generateTransactionAmount();
          break;
        case 'cpu_usage':
          dataPoint[feature] = this.generateCPUUsage();
          break;
        case 'memory_usage':
          dataPoint[feature] = this.generateMemoryUsage();
          break;
        case 'response_time':
          dataPoint[feature] = this.generateResponseTime();
          break;
        case 'session_duration':
          dataPoint[feature] = this.generateSessionDuration();
          break;
        case 'revenue':
          dataPoint[feature] = this.generateRevenue();
          break;
        case 'login_attempts':
          dataPoint[feature] = this.generateLoginAttempts();
          break;
        default:
          dataPoint[feature] = Math.random();
      }
    });

    // Occasionally inject anomalies for testing
    if (Math.random() < 0.05) { // 5% chance
      dataPoint._isAnomalous = true;
      this.injectAnomaly(dataPoint, detector);
    }

    return dataPoint;
  }

  /**
   * Detect anomalies in data
   */
  async detectAnomalies(detectorId, data) {
    const detector = this.detectors.get(detectorId);
    if (!detector) return [];

    const anomalies = [];

    // Run detection with each configured model
    for (const modelId of detector.models) {
      const model = this.models.get(modelId);
      if (!model || model.status !== 'loaded') continue;

      try {
        const modelAnomalies = await this.runModelDetection(model, data, detector);
        anomalies.push(...modelAnomalies);
        
        // Update model usage
        model.lastUsed = new Date();
        model.detections += modelAnomalies.length;
      } catch (error) {
        console.error(`Model ${modelId} detection failed:`, error);
      }
    }

    // Ensemble voting - combine results from multiple models
    const consensusAnomalies = this.ensembleVoting(anomalies, detector.models.length);
    
    return consensusAnomalies;
  }

  /**
   * Run model detection
   */
  async runModelDetection(model, data, detector) {
    // Simulate model inference
    await new Promise(resolve => setTimeout(resolve, 50));

    const anomalies = [];

    data.forEach(dataPoint => {
      const anomalyScore = this.calculateAnomalyScore(model, dataPoint, detector);
      
      if (anomalyScore > detector.alertThreshold) {
        anomalies.push({
          id: this.generateAnomalyId(),
          detectorId: detector.id,
          modelId: model.id,
          dataPoint,
          score: anomalyScore,
          timestamp: dataPoint.timestamp,
          features: this.extractAnomalousFeatures(dataPoint, detector.features),
          confidence: this.calculateConfidence(anomalyScore, model),
          severity: this.calculateSeverity(anomalyScore)
        });
      }
    });

    return anomalies;
  }

  /**
   * Calculate anomaly score
   */
  calculateAnomalyScore(model, dataPoint, detector) {
    let score = 0;

    switch (model.algorithm) {
      case 'isolation_forest':
        score = this.isolationForestScore(dataPoint, detector);
        break;
      case 'one_class_svm':
        score = this.oneClassSVMScore(dataPoint, detector);
        break;
      case 'lof':
        score = this.localOutlierFactorScore(dataPoint, detector);
        break;
      case 'autoencoder':
        score = this.autoencoderScore(dataPoint, detector);
        break;
      case 'z_score_modified':
        score = this.statisticalScore(dataPoint, detector);
        break;
      case 'lstm_autoencoder':
        score = this.lstmAutoencoderScore(dataPoint, detector);
        break;
      default:
        score = Math.random();
    }

    // Add some noise and ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score + (Math.random() - 0.5) * 0.1));

    // Boost score if data point was artificially marked as anomalous
    if (dataPoint._isAnomalous) {
      score = Math.max(score, 0.8 + Math.random() * 0.2);
    }

    return score;
  }

  /**
   * Isolation Forest scoring
   */
  isolationForestScore(dataPoint, detector) {
    // Simplified isolation forest scoring
    const features = detector.features.map(f => dataPoint[f] || 0);
    const avgFeature = features.reduce((sum, val) => sum + val, 0) / features.length;
    
    // Higher scores for values far from average
    const deviation = Math.abs(avgFeature - 0.5);
    return Math.min(1, deviation * 2);
  }

  /**
   * One-Class SVM scoring
   */
  oneClassSVMScore(dataPoint, detector) {
    // Simplified SVM scoring based on distance from decision boundary
    const features = detector.features.map(f => dataPoint[f] || 0);
    const distance = Math.sqrt(features.reduce((sum, val) => sum + Math.pow(val - 0.5, 2), 0));
    
    return Math.min(1, distance);
  }

  /**
   * Local Outlier Factor scoring
   */
  localOutlierFactorScore(dataPoint, detector) {
    // Simplified LOF scoring based on local density
    const features = detector.features.map(f => dataPoint[f] || 0);
    const localDensity = 1 / (1 + Math.sqrt(features.reduce((sum, val) => sum + val * val, 0)));
    
    return 1 - localDensity;
  }

  /**
   * Autoencoder scoring
   */
  autoencoderScore(dataPoint, detector) {
    // Simplified autoencoder reconstruction error
    const features = detector.features.map(f => dataPoint[f] || 0);
    const reconstructionError = features.reduce((sum, val) => sum + Math.pow(val - 0.5, 2), 0) / features.length;
    
    return Math.min(1, reconstructionError * 4);
  }

  /**
   * Statistical scoring
   */
  statisticalScore(dataPoint, detector) {
    // Modified Z-score approach
    const features = detector.features.map(f => dataPoint[f] || 0);
    const mean = 0.5; // Assumed mean
    const std = 0.2; // Assumed standard deviation
    
    const maxZScore = Math.max(...features.map(val => Math.abs(val - mean) / std));
    return Math.min(1, maxZScore / 3.5); // Normalize by threshold
  }

  /**
   * LSTM Autoencoder scoring
   */
  lstmAutoencoderScore(dataPoint, detector) {
    // Simplified LSTM autoencoder scoring for sequence data
    const features = detector.features.map(f => dataPoint[f] || 0);
    const sequenceError = features.reduce((sum, val, idx) => {
      const expected = Math.sin(idx * 0.1) * 0.5 + 0.5; // Simple pattern
      return sum + Math.pow(val - expected, 2);
    }, 0) / features.length;
    
    return Math.min(1, sequenceError * 2);
  }

  /**
   * Ensemble voting
   */
  ensembleVoting(anomalies, numModels) {
    const anomalyMap = new Map();

    // Group anomalies by data point
    anomalies.forEach(anomaly => {
      const key = `${anomaly.timestamp.getTime()}_${JSON.stringify(anomaly.dataPoint)}`;
      if (!anomalyMap.has(key)) {
        anomalyMap.set(key, []);
      }
      anomalyMap.get(key).push(anomaly);
    });

    const consensusAnomalies = [];

    // Apply voting logic
    anomalyMap.forEach((groupedAnomalies, key) => {
      const voteCount = groupedAnomalies.length;
      const avgScore = groupedAnomalies.reduce((sum, a) => sum + a.score, 0) / voteCount;
      
      // Require majority vote or high confidence from single model
      if (voteCount >= Math.ceil(numModels / 2) || avgScore > 0.9) {
        const consensusAnomaly = {
          ...groupedAnomalies[0], // Use first anomaly as base
          score: avgScore,
          voteCount,
          models: groupedAnomalies.map(a => a.modelId),
          confidence: Math.min(1, avgScore * (voteCount / numModels))
        };
        
        consensusAnomalies.push(consensusAnomaly);
      }
    });

    return consensusAnomalies;
  }

  /**
   * Process detected anomalies
   */
  async processAnomalies(detectorId, anomalies) {
    for (const anomaly of anomalies) {
      // Store anomaly
      this.anomalies.set(anomaly.id, anomaly);

      // Determine alert level
      const alertLevel = this.determineAlertLevel(anomaly);
      
      // Create alert if necessary
      if (alertLevel) {
        await this.createAlert(anomaly, alertLevel);
      }

      // Emit anomaly detected event
      this.emit('anomaly_detected', {
        anomalyId: anomaly.id,
        detectorId,
        severity: anomaly.severity,
        score: anomaly.score,
        confidence: anomaly.confidence
      });
    }
  }

  /**
   * Determine alert level
   */
  determineAlertLevel(anomaly) {
    if (anomaly.score >= 0.95 && anomaly.confidence >= 0.9) {
      return 'critical_anomaly';
    } else if (anomaly.score >= 0.85 && anomaly.confidence >= 0.8) {
      return 'high_anomaly';
    } else if (anomaly.score >= 0.75 && anomaly.confidence >= 0.7) {
      return 'medium_anomaly';
    } else if (anomaly.score >= 0.65) {
      return 'low_anomaly';
    }
    
    return null; // No alert needed
  }

  /**
   * Create alert
   */
  async createAlert(anomaly, alertLevel) {
    const alertId = this.generateAlertId();
    const alertType = this.alertTypes.find(type => type.id === alertLevel);
    
    const alert = {
      id: alertId,
      anomalyId: anomaly.id,
      type: alertLevel,
      severity: alertType.severity,
      title: `${alertType.name} Detected`,
      description: this.generateAlertDescription(anomaly),
      timestamp: new Date(),
      status: 'active',
      channels: alertType.channels,
      escalation: alertType.escalation,
      metadata: {
        detectorId: anomaly.detectorId,
        modelIds: anomaly.models || [anomaly.modelId],
        score: anomaly.score,
        confidence: anomaly.confidence,
        features: anomaly.features
      }
    };

    this.alerts.set(alertId, alert);

    // Send alert through configured channels
    await this.sendAlert(alert);

    // Start escalation if configured
    if (alert.escalation.enabled) {
      this.startEscalation(alert);
    }

    // Emit alert created event
    this.emit('alert_created', {
      alertId,
      severity: alert.severity,
      anomalyId: anomaly.id
    });

    return alertId;
  }

  /**
   * Generate alert description
   */
  generateAlertDescription(anomaly) {
    const detector = this.detectors.get(anomaly.detectorId);
    const topFeatures = Object.entries(anomaly.features || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([feature, value]) => `${feature}: ${value.toFixed(3)}`)
      .join(', ');

    return `Anomaly detected in ${detector?.name || 'Unknown Detector'} with score ${anomaly.score.toFixed(3)}. ` +
           `Top contributing features: ${topFeatures}. ` +
           `Confidence: ${(anomaly.confidence * 100).toFixed(1)}%.`;
  }

  /**
   * Send alert
   */
  async sendAlert(alert) {
    // Simulate sending alert through various channels
    for (const channel of alert.channels) {
      try {
        await this.sendAlertToChannel(alert, channel);
      } catch (error) {
        console.error(`Failed to send alert ${alert.id} to ${channel}:`, error);
      }
    }
  }

  /**
   * Send alert to specific channel
   */
  async sendAlertToChannel(alert, channel) {
    // Simulate channel-specific alert sending
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log(`Alert ${alert.id} sent to ${channel}: ${alert.title}`);
    
    // In a real implementation, this would integrate with:
    // - Email services (SendGrid, AWS SES)
    // - SMS services (Twilio, AWS SNS)
    // - Slack API
    // - Webhook endpoints
    // - Dashboard notifications
  }

  /**
   * Start escalation
   */
  startEscalation(alert) {
    alert.escalation.levels.forEach((level, index) => {
      setTimeout(() => {
        if (alert.status === 'active') { // Only escalate if still active
          this.escalateAlert(alert, level, index);
        }
      }, level.time * 60 * 1000); // Convert minutes to milliseconds
    });
  }

  /**
   * Escalate alert
   */
  async escalateAlert(alert, level, levelIndex) {
    console.log(`Escalating alert ${alert.id} to level ${levelIndex + 1}`);
    
    // Send escalation notification
    const escalationAlert = {
      ...alert,
      title: `ESCALATED: ${alert.title}`,
      description: `${alert.description}\n\nThis alert has been escalated to level ${levelIndex + 1}.`,
      recipients: level.recipients
    };

    await this.sendAlert(escalationAlert);

    // Emit escalation event
    this.emit('alert_escalated', {
      alertId: alert.id,
      level: levelIndex + 1,
      recipients: level.recipients
    });
  }

  /**
   * Run batch detection
   */
  async runBatchDetection() {
    // Process accumulated data in batches for more comprehensive analysis
    for (const [detectorId, detector] of this.detectors) {
      if (detector.currentData.length < 10) continue; // Need minimum data

      try {
        // Run batch analysis
        const batchAnomalies = await this.runBatchAnalysis(detectorId);
        
        if (batchAnomalies.length > 0) {
          await this.processAnomalies(detectorId, batchAnomalies);
        }
      } catch (error) {
        console.error(`Batch detection failed for ${detectorId}:`, error);
      }
    }
  }

  /**
   * Run batch analysis
   */
  async runBatchAnalysis(detectorId) {
    const detector = this.detectors.get(detectorId);
    const data = detector.currentData.slice(-100); // Analyze last 100 points
    
    // Look for patterns that might not be visible in real-time
    const patternAnomalies = this.detectPatternAnomalies(data, detector);
    const correlationAnomalies = this.detectCorrelationAnomalies(data, detector);
    const trendAnomalies = this.detectTrendAnomalies(data, detector);
    
    return [...patternAnomalies, ...correlationAnomalies, ...trendAnomalies];
  }

  /**
   * Run pattern analysis
   */
  async runPatternAnalysis() {
    for (const [patternId, pattern] of this.patterns) {
      try {
        const analysis = await this.analyzePattern(patternId);
        pattern.lastAnalysis = new Date();
        
        if (analysis.anomalies.length > 0) {
          pattern.detections.push(...analysis.anomalies);
        }
      } catch (error) {
        console.error(`Pattern analysis failed for ${patternId}:`, error);
      }
    }
  }

  /**
   * Analyze pattern
   */
  async analyzePattern(patternId) {
    const pattern = this.patterns.get(patternId);
    
    // Simulate pattern analysis
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const anomalies = [];
    
    // Generate pattern-specific anomalies
    if (Math.random() < 0.1) { // 10% chance of pattern anomaly
      anomalies.push({
        id: this.generateAnomalyId(),
        patternId,
        type: 'pattern_anomaly',
        description: `Unusual pattern detected in ${pattern.name}`,
        timestamp: new Date(),
        score: 0.7 + Math.random() * 0.3,
        confidence: 0.8 + Math.random() * 0.2
      });
    }
    
    return { anomalies };
  }

  /**
   * Check model retraining
   */
  async checkModelRetraining() {
    for (const [modelId, model] of this.models) {
      // Check if model needs retraining based on performance degradation
      const falsePositiveRate = model.falsePositives / Math.max(1, model.detections);
      
      if (falsePositiveRate > 0.2 || // High false positive rate
          Date.now() - model.lastTrained.getTime() > 7 * 24 * 60 * 60 * 1000) { // Week old
        
        console.log(`Scheduling retraining for model ${modelId}`);
        await this.retrainModel(modelId);
      }
    }
  }

  /**
   * Retrain model
   */
  async retrainModel(modelId) {
    const model = this.models.get(modelId);
    if (!model) return;

    model.status = 'retraining';
    
    try {
      // Simulate model retraining
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Update model performance
      model.performance.precision = Math.min(0.95, model.performance.precision + 0.02);
      model.performance.recall = Math.min(0.95, model.performance.recall + 0.02);
      model.performance.f1_score = 2 * (model.performance.precision * model.performance.recall) / 
                                   (model.performance.precision + model.performance.recall);
      
      model.status = 'loaded';
      model.lastTrained = new Date();
      model.detections = 0;
      model.falsePositives = 0;

      // Emit model retrained event
      this.emit('model_retrained', {
        modelId,
        performance: model.performance
      });

      console.log(`Model ${modelId} retrained successfully`);
    } catch (error) {
      model.status = 'error';
      console.error(`Model retraining failed for ${modelId}:`, error);
    }
  }

  // Utility methods for data generation
  generateTransactionAmount() {
    // Normal: $10-$500, Anomalous: >$2000 or <$1
    const normal = Math.random() * 490 + 10;
    if (Math.random() < 0.05) {
      return Math.random() < 0.5 ? Math.random() : Math.random() * 5000 + 2000;
    }
    return normal;
  }

  generateCPUUsage() {
    // Normal: 10-70%, Anomalous: >90%
    const normal = Math.random() * 60 + 10;
    if (Math.random() < 0.05) {
      return Math.random() * 10 + 90;
    }
    return normal;
  }

  generateMemoryUsage() {
    // Normal: 20-80%, Anomalous: >95%
    const normal = Math.random() * 60 + 20;
    if (Math.random() < 0.05) {
      return Math.random() * 5 + 95;
    }
    return normal;
  }

  generateResponseTime() {
    // Normal: 50-200ms, Anomalous: >1000ms
    const normal = Math.random() * 150 + 50;
    if (Math.random() < 0.05) {
      return Math.random() * 2000 + 1000;
    }
    return normal;
  }

  generateSessionDuration() {
    // Normal: 1-30 minutes, Anomalous: >120 minutes or <10 seconds
    const normal = Math.random() * 29 + 1;
    if (Math.random() < 0.05) {
      return Math.random() < 0.5 ? Math.random() * 0.17 : Math.random() * 240 + 120;
    }
    return normal;
  }

  generateRevenue() {
    // Normal: $1000-$10000, Anomalous: >$50000 or <$100
    const normal = Math.random() * 9000 + 1000;
    if (Math.random() < 0.05) {
      return Math.random() < 0.5 ? Math.random() * 100 : Math.random() * 100000 + 50000;
    }
    return normal;
  }

  generateLoginAttempts() {
    // Normal: 1-3 attempts, Anomalous: >10 attempts
    const normal = Math.floor(Math.random() * 3) + 1;
    if (Math.random() < 0.05) {
      return Math.floor(Math.random() * 20) + 10;
    }
    return normal;
  }

  injectAnomaly(dataPoint, detector) {
    // Randomly modify features to create anomalies
    const feature = detector.features[Math.floor(Math.random() * detector.features.length)];
    
    switch (feature) {
      case 'amount':
        dataPoint[feature] = Math.random() * 10000 + 5000;
        break;
      case 'cpu_usage':
        dataPoint[feature] = Math.random() * 10 + 95;
        break;
      case 'memory_usage':
        dataPoint[feature] = Math.random() * 5 + 95;
        break;
      default:
        dataPoint[feature] = Math.random() > 0.5 ? Math.random() * 0.1 : Math.random() * 0.1 + 0.9;
    }
  }

  extractAnomalousFeatures(dataPoint, features) {
    const anomalousFeatures = {};
    
    features.forEach(feature => {
      if (dataPoint[feature] !== undefined) {
        // Calculate feature contribution to anomaly (simplified)
        const normalizedValue = Math.abs(dataPoint[feature] - 0.5) * 2;
        anomalousFeatures[feature] = normalizedValue;
      }
    });
    
    return anomalousFeatures;
  }

  calculateConfidence(score, model) {
    // Confidence based on score and model performance
    const modelReliability = (model.performance.precision + model.performance.recall) / 2;
    return Math.min(1, score * modelReliability);
  }

  calculateSeverity(score) {
    if (score >= 0.9) return 'critical';
    if (score >= 0.8) return 'high';
    if (score >= 0.7) return 'medium';
    return 'low';
  }

  detectPatternAnomalies(data, detector) {
    // Simplified pattern anomaly detection
    const anomalies = [];
    
    if (data.length < 20) return anomalies;
    
    // Check for sudden spikes
    const recent = data.slice(-10);
    const previous = data.slice(-20, -10);
    
    detector.features.forEach(feature => {
      const recentAvg = recent.reduce((sum, d) => sum + (d[feature] || 0), 0) / recent.length;
      const previousAvg = previous.reduce((sum, d) => sum + (d[feature] || 0), 0) / previous.length;
      
      if (Math.abs(recentAvg - previousAvg) > 0.5) {
        anomalies.push({
          id: this.generateAnomalyId(),
          detectorId: detector.id,
          type: 'pattern_anomaly',
          feature,
          score: Math.min(1, Math.abs(recentAvg - previousAvg)),
          timestamp: new Date(),
          description: `Sudden change in ${feature} pattern`
        });
      }
    });
    
    return anomalies;
  }

  detectCorrelationAnomalies(data, detector) {
    // Simplified correlation anomaly detection
    const anomalies = [];
    
    if (data.length < 30 || detector.features.length < 2) return anomalies;
    
    // Check correlation between first two features
    const feature1 = detector.features[0];
    const feature2 = detector.features[1];
    
    const values1 = data.map(d => d[feature1] || 0);
    const values2 = data.map(d => d[feature2] || 0);
    
    const correlation = this.calculateCorrelation(values1, values2);
    
    // If correlation breaks significantly from expected
    if (Math.abs(correlation) < 0.3 && Math.random() < 0.1) {
      anomalies.push({
        id: this.generateAnomalyId(),
        detectorId: detector.id,
        type: 'correlation_anomaly',
        score: 1 - Math.abs(correlation),
        timestamp: new Date(),
        description: `Correlation break between ${feature1} and ${feature2}`
      });
    }
    
    return anomalies;
  }

  detectTrendAnomalies(data, detector) {
    // Simplified trend anomaly detection
    const anomalies = [];
    
    if (data.length < 50) return anomalies;
    
    detector.features.forEach(feature => {
      const values = data.map(d => d[feature] || 0);
      const trend = this.calculateTrend(values);
      
      // Detect sudden trend changes
      if (Math.abs(trend) > 0.02) { // Significant trend
        anomalies.push({
          id: this.generateAnomalyId(),
          detectorId: detector.id,
          type: 'trend_anomaly',
          feature,
          score: Math.min(1, Math.abs(trend) * 10),
          timestamp: new Date(),
          description: `Unusual trend in ${feature}: ${trend > 0 ? 'increasing' : 'decreasing'}`
        });
      }
    });
    
    return anomalies;
  }

  calculateCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  calculateTrend(values) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  generateAnomalyId() {
    return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getDetectors() {
    return Array.from(this.detectors.values());
  }

  getDetector(detectorId) {
    return this.detectors.get(detectorId);
  }

  getModels() {
    return Array.from(this.models.values());
  }

  getModel(modelId) {
    return this.models.get(modelId);
  }

  getAnomalies(filters = {}) {
    let anomalies = Array.from(this.anomalies.values());

    if (filters.detectorId) {
      anomalies = anomalies.filter(a => a.detectorId === filters.detectorId);
    }

    if (filters.severity) {
      anomalies = anomalies.filter(a => a.severity === filters.severity);
    }

    if (filters.startDate) {
      anomalies = anomalies.filter(a => a.timestamp >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      anomalies = anomalies.filter(a => a.timestamp <= new Date(filters.endDate));
    }

    return anomalies.sort((a, b) => b.timestamp - a.timestamp);
  }

  getAlerts(filters = {}) {
    let alerts = Array.from(this.alerts.values());

    if (filters.status) {
      alerts = alerts.filter(a => a.status === filters.status);
    }

    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  async acknowledgeAlert(alertId, userId) {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    this.emit('alert_acknowledged', {
      alertId,
      userId,
      timestamp: alert.acknowledgedAt
    });

    return alert;
  }

  async resolveAlert(alertId, userId, resolution) {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.status = 'resolved';
    alert.resolvedBy = userId;
    alert.resolvedAt = new Date();
    alert.resolution = resolution;

    this.emit('alert_resolved', {
      alertId,
      userId,
      resolution,
      timestamp: alert.resolvedAt
    });

    return alert;
  }

  getStats() {
    const activeDetectors = Array.from(this.detectors.values()).filter(d => d.status === 'active').length;
    const totalAnomalies = this.anomalies.size;
    const activeAlerts = Array.from(this.alerts.values()).filter(a => a.status === 'active').length;
    const modelAccuracy = Array.from(this.models.values())
      .reduce((sum, m) => sum + m.performance.f1_score, 0) / this.models.size;

    return {
      activeDetectors,
      totalModels: this.models.size,
      totalAnomalies,
      activeAlerts,
      averageModelAccuracy: modelAccuracy,
      detectionRate: totalAnomalies / Math.max(1, Date.now() - (24 * 60 * 60 * 1000)), // per day
      falsePositiveRate: this.calculateOverallFalsePositiveRate()
    };
  }

  calculateOverallFalsePositiveRate() {
    const totalDetections = Array.from(this.models.values())
      .reduce((sum, m) => sum + m.detections, 0);
    const totalFalsePositives = Array.from(this.models.values())
      .reduce((sum, m) => sum + m.falsePositives, 0);
    
    return totalDetections > 0 ? totalFalsePositives / totalDetections : 0;
  }
}

module.exports = AnomalyDetectionService;