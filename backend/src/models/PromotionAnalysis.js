const mongoose = require('mongoose');

const promotionAnalysisSchema = new mongoose.Schema({
  // Company Association - CRITICAL for multi-tenant isolation
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Promotion Reference
  promotion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion',
    required: true
  },

  // Analysis Type
  analysisType: {
    type: String,
    enum: ['pre_launch_prediction', 'mid_campaign_analysis', 'post_campaign_evaluation', 'optimization_recommendation'],
    required: true
  },

  // Prediction Model Results
  prediction: {
    // Success Probability
    successProbability: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },

    // Predicted Metrics
    predictedMetrics: {
      volumeLift: {
        percentage: Number,
        units: Number,
        confidence: Number
      },
      revenueLift: {
        percentage: Number,
        amount: Number,
        confidence: Number
      },
      profitabilityImpact: {
        marginChange: Number,
        totalProfit: Number,
        roi: Number,
        confidence: Number
      },
      customerEngagement: {
        participationRate: Number,
        newCustomerAcquisition: Number,
        customerRetention: Number,
        confidence: Number
      }
    },

    // Risk Assessment
    riskFactors: [{
      factor: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      impact: String,
      mitigation: String,
      probability: Number
    }],

    // Model Confidence
    modelConfidence: {
      overall: Number,
      dataQuality: Number,
      historicalAccuracy: Number,
      featureImportance: Number
    }
  },

  // Feature Analysis
  featureAnalysis: {
    // Promotion Characteristics
    promotionFeatures: {
      discountDepth: {
        value: Number,
        impact: Number,
        benchmark: Number
      },
      duration: {
        value: Number, // in days
        impact: Number,
        optimal: Number
      },
      timing: {
        seasonality: String,
        dayOfWeek: String,
        monthOfYear: Number,
        impact: Number
      },
      mechanicType: {
        type: String,
        effectiveness: Number,
        historicalPerformance: Number
      }
    },

    // Product Characteristics
    productFeatures: {
      category: String,
      brand: String,
      pricePoint: {
        type: String,
        enum: ['premium', 'mid-tier', 'value', 'economy']
      },
      lifecycle: {
        type: String,
        enum: ['introduction', 'growth', 'maturity', 'decline']
      },
      seasonality: Number,
      elasticity: Number,
      competitivePosition: Number
    },

    // Customer Characteristics
    customerFeatures: {
      tier: String,
      channel: String,
      region: String,
      loyaltyLevel: Number,
      pricesensitivity: Number,
      promotionResponsiveness: Number,
      historicalPerformance: Number
    },

    // Market Characteristics
    marketFeatures: {
      competitiveActivity: Number,
      marketTrend: String,
      economicIndicators: Number,
      seasonalIndex: Number,
      categoryGrowth: Number
    }
  },

  // Historical Comparison
  historicalComparison: {
    // Similar Promotions
    similarPromotions: [{
      promotionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Promotion'
      },
      similarity: Number,
      performance: {
        volumeLift: Number,
        revenueLift: Number,
        roi: Number,
        successRating: Number
      },
      keyDifferences: [String],
      lessons: [String]
    }],

    // Benchmark Performance
    benchmarks: {
      categoryAverage: {
        volumeLift: Number,
        revenueLift: Number,
        roi: Number
      },
      companyAverage: {
        volumeLift: Number,
        revenueLift: Number,
        roi: Number
      },
      bestInClass: {
        volumeLift: Number,
        revenueLift: Number,
        roi: Number
      }
    },

    // Trend Analysis
    trends: {
      promotionFrequency: Number,
      discountTrend: String,
      effectivenessTrend: String,
      customerResponseTrend: String
    }
  },

  // Optimization Recommendations
  recommendations: [{
    category: {
      type: String,
      enum: ['discount_optimization', 'timing_optimization', 'targeting_optimization', 'mechanic_optimization', 'duration_optimization']
    },
    title: String,
    description: String,

    // Current vs Recommended
    current: mongoose.Schema.Types.Mixed,
    recommended: mongoose.Schema.Types.Mixed,

    // Impact Estimation
    expectedImpact: {
      volumeLift: Number,
      revenueLift: Number,
      profitImprovement: Number,
      riskReduction: Number
    },

    // Implementation
    implementation: {
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'complex']
      },
      timeframe: String,
      resources: [String],
      dependencies: [String]
    },

    // Priority and Confidence
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    confidence: Number,

    // Supporting Evidence
    evidence: [{
      type: String,
      description: String,
      data: mongoose.Schema.Types.Mixed
    }]
  }],

  // Alternative Promotion Suggestions
  alternatives: [{
    name: String,
    description: String,

    // Promotion Structure
    structure: {
      discountType: String,
      discountValue: Number,
      duration: Number,
      timing: String,
      targeting: mongoose.Schema.Types.Mixed
    },

    // Predicted Performance
    predictedPerformance: {
      successProbability: Number,
      volumeLift: Number,
      revenueLift: Number,
      roi: Number,
      profitability: Number
    },

    // Advantages and Disadvantages
    advantages: [String],
    disadvantages: [String],

    // Risk Assessment
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high']
    },

    // Implementation Complexity
    complexity: {
      type: String,
      enum: ['simple', 'moderate', 'complex']
    }
  }],

  // Real-time Monitoring (for active promotions)
  realTimeMetrics: {
    currentPerformance: {
      volumeToDate: Number,
      revenueToDate: Number,
      participationRate: Number,
      customerResponse: Number,
      lastUpdated: Date
    },

    // Performance vs Prediction
    predictionAccuracy: {
      volumeAccuracy: Number,
      revenueAccuracy: Number,
      participationAccuracy: Number,
      overallAccuracy: Number
    },

    // Alerts and Flags
    alerts: [{
      type: {
        type: String,
        enum: ['underperforming', 'overperforming', 'budget_exceeded', 'low_participation', 'quality_issue']
      },
      severity: {
        type: String,
        enum: ['info', 'warning', 'critical']
      },
      message: String,
      timestamp: Date,
      acknowledged: Boolean
    }],

    // Adjustment Recommendations
    adjustmentRecommendations: [{
      type: String,
      description: String,
      urgency: String,
      expectedImpact: String,
      implementationTime: String
    }]
  },

  // Model Information
  modelInfo: {
    modelVersion: String,
    algorithmUsed: String,
    trainingDataSize: Number,
    trainingDataPeriod: {
      startDate: Date,
      endDate: Date
    },
    featureCount: Number,
    crossValidationScore: Number,
    lastTrainingDate: Date,
    modelAccuracy: Number
  },

  // Analysis Metadata
  analysisMetadata: {
    analysisDate: {
      type: Date,
      default: Date.now
    },
    analysisVersion: String,
    dataSourcesUsed: [String],
    processingTime: Number, // in milliseconds
    analystId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'reviewed', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewNotes: String
  },

  // Quality Metrics
  quality: {
    dataCompleteness: Number,
    dataAccuracy: Number,
    modelReliability: Number,
    predictionStability: Number,
    overallQuality: Number
  },

  // Status and Flags
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  notes: String,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and multi-tenant isolation
promotionAnalysisSchema.index({ company: 1, promotion: 1 });
promotionAnalysisSchema.index({ company: 1, analysisType: 1 });
promotionAnalysisSchema.index({ company: 1, status: 1 });
promotionAnalysisSchema.index({ company: 1, 'prediction.successProbability': -1 });
promotionAnalysisSchema.index({ company: 1, 'analysisMetadata.analysisDate': -1 });
promotionAnalysisSchema.index({ 'modelInfo.modelVersion': 1 });

// Compound indexes for complex queries
promotionAnalysisSchema.index({
  company: 1,
  analysisType: 1,
  status: 1,
  'analysisMetadata.analysisDate': -1
});

// Virtual for success category
promotionAnalysisSchema.virtual('successCategory').get(function () {
  const probability = this.prediction.successProbability;
  if (probability >= 80) return 'highly_likely';
  if (probability >= 60) return 'likely';
  if (probability >= 40) return 'moderate';
  if (probability >= 20) return 'unlikely';
  return 'highly_unlikely';
});

// Virtual for risk level
promotionAnalysisSchema.virtual('overallRiskLevel').get(function () {
  if (!this.prediction.riskFactors || this.prediction.riskFactors.length === 0) return 'low';

  const criticalRisks = this.prediction.riskFactors.filter((r) => r.severity === 'critical').length;
  const highRisks = this.prediction.riskFactors.filter((r) => r.severity === 'high').length;

  if (criticalRisks > 0) return 'critical';
  if (highRisks > 2) return 'high';
  if (highRisks > 0) return 'medium';
  return 'low';
});

// Virtual for recommendation priority
promotionAnalysisSchema.virtual('topRecommendation').get(function () {
  if (!this.recommendations || this.recommendations.length === 0) return null;

  return this.recommendations
    .filter((r) => r.priority === 'critical' || r.priority === 'high')
    .sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || b.confidence - a.confidence;
    })[0];
});

// Method to update real-time metrics
promotionAnalysisSchema.methods.updateRealTimeMetrics = function (metrics) {
  this.realTimeMetrics.currentPerformance = {
    ...this.realTimeMetrics.currentPerformance,
    ...metrics,
    lastUpdated: new Date()
  };

  // Calculate prediction accuracy
  const predicted = this.prediction.predictedMetrics;
  const actual = this.realTimeMetrics.currentPerformance;

  if (predicted.volumeLift && actual.volumeToDate) {
    this.realTimeMetrics.predictionAccuracy.volumeAccuracy =
      Math.max(0, 100 - Math.abs((actual.volumeToDate - predicted.volumeLift.units) / predicted.volumeLift.units * 100));
  }

  if (predicted.revenueLift && actual.revenueToDate) {
    this.realTimeMetrics.predictionAccuracy.revenueAccuracy =
      Math.max(0, 100 - Math.abs((actual.revenueToDate - predicted.revenueLift.amount) / predicted.revenueLift.amount * 100));
  }

  // Calculate overall accuracy
  const accuracies = Object.values(this.realTimeMetrics.predictionAccuracy).filter((a) => a > 0);
  if (accuracies.length > 0) {
    this.realTimeMetrics.predictionAccuracy.overallAccuracy =
      accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
  }

  return this.save();
};

// Method to add alert
promotionAnalysisSchema.methods.addAlert = function (type, severity, message) {
  this.realTimeMetrics.alerts.push({
    type,
    severity,
    message,
    timestamp: new Date(),
    acknowledged: false
  });

  return this.save();
};

// Method to calculate quality score
promotionAnalysisSchema.methods.calculateQualityScore = function () {
  const weights = {
    dataCompleteness: 0.25,
    dataAccuracy: 0.25,
    modelReliability: 0.25,
    predictionStability: 0.25
  };

  this.quality.overallQuality =
    (this.quality.dataCompleteness || 0) * weights.dataCompleteness +
    (this.quality.dataAccuracy || 0) * weights.dataAccuracy +
    (this.quality.modelReliability || 0) * weights.modelReliability +
    (this.quality.predictionStability || 0) * weights.predictionStability;

  return this.quality.overallQuality;
};

// Static method to get analysis summary for company
promotionAnalysisSchema.statics.getCompanyAnalyticsSummary = function (companyId, dateRange = {}) {
  const matchStage = { company: companyId };

  if (dateRange.startDate || dateRange.endDate) {
    matchStage['analysisMetadata.analysisDate'] = {};
    if (dateRange.startDate) matchStage['analysisMetadata.analysisDate'].$gte = dateRange.startDate;
    if (dateRange.endDate) matchStage['analysisMetadata.analysisDate'].$lte = dateRange.endDate;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAnalyses: { $sum: 1 },
        averageSuccessProbability: { $avg: '$prediction.successProbability' },
        averageModelConfidence: { $avg: '$prediction.modelConfidence.overall' },
        averageQuality: { $avg: '$quality.overallQuality' },
        highSuccessCount: {
          $sum: { $cond: [{ $gte: ['$prediction.successProbability', 70] }, 1, 0] }
        },
        totalRecommendations: { $sum: { $size: '$recommendations' } },
        criticalRecommendations: {
          $sum: {
            $size: {
              $filter: {
                input: '$recommendations',
                cond: { $eq: ['$$this.priority', 'critical'] }
              }
            }
          }
        }
      }
    }
  ]);
};

// Static method to find promotions needing analysis
promotionAnalysisSchema.statics.findPromotionsNeedingAnalysis = function (companyId) {
  return this.aggregate([
    {
      $lookup: {
        from: 'promotions',
        localField: 'promotion',
        foreignField: '_id',
        as: 'promotionData'
      }
    },
    {
      $match: {
        company: companyId,
        'promotionData.status': { $in: ['active', 'planned'] }
      }
    },
    {
      $group: {
        _id: '$promotion',
        latestAnalysis: { $max: '$analysisMetadata.analysisDate' },
        analysisCount: { $sum: 1 }
      }
    },
    {
      $match: {
        $or: [
          { latestAnalysis: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Older than 7 days
          { analysisCount: 0 }
        ]
      }
    }
  ]);
};

// Pre-save middleware
promotionAnalysisSchema.pre('save', function (next) {
  // Calculate quality score if not set
  if (!this.quality.overallQuality) {
    this.calculateQualityScore();
  }

  next();
});

module.exports = mongoose.model('PromotionAnalysis', promotionAnalysisSchema);
