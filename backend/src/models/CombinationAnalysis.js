const mongoose = require('mongoose');

const combinationAnalysisSchema = new mongoose.Schema({
  // Company Association - CRITICAL for multi-tenant isolation
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Analysis Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  analysisCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },

  // Analysis Type and Scope
  analysisType: {
    type: String,
    required: true,
    enum: ['promotional_combinations', 'marketing_mix', 'channel_combinations', 'timing_combinations', 'customer_combinations', 'comprehensive']
  },

  analysisScope: {
    type: String,
    required: true,
    enum: ['brand_level', 'category_level', 'customer_level', 'channel_level', 'company_wide']
  },

  // Analysis Period
  analysisPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    baselinePeriod: {
      startDate: Date,
      endDate: Date
    },
    comparisonPeriods: [{
      name: String,
      startDate: Date,
      endDate: Date,
      purpose: String
    }]
  },

  // Combination Elements
  combinationElements: {
    // Promotional elements
    promotionalElements: [{
      elementType: {
        type: String,
        enum: ['discount_depth', 'promotion_duration', 'promotion_frequency', 'promotion_timing', 'promotion_mechanic']
      },
      values: [mongoose.Schema.Types.Mixed],
      weight: Number,
      importance: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low']
      }
    }],

    // Marketing elements
    marketingElements: [{
      elementType: {
        type: String,
        enum: ['advertising_spend', 'media_mix', 'campaign_theme', 'creative_approach', 'channel_support']
      },
      values: [mongoose.Schema.Types.Mixed],
      weight: Number,
      importance: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low']
      }
    }],

    // Trading terms elements
    tradingTermElements: [{
      elementType: {
        type: String,
        enum: ['volume_discount', 'payment_terms', 'listing_support', 'promotional_support', 'rebate_structure']
      },
      values: [mongoose.Schema.Types.Mixed],
      weight: Number,
      importance: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low']
      }
    }],

    // Channel elements
    channelElements: [{
      elementType: {
        type: String,
        enum: ['channel_type', 'distribution_intensity', 'shelf_placement', 'inventory_levels', 'pos_support']
      },
      values: [mongoose.Schema.Types.Mixed],
      weight: Number,
      importance: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low']
      }
    }],

    // External factors
    externalFactors: [{
      factorType: {
        type: String,
        enum: ['seasonality', 'competitive_activity', 'economic_conditions', 'weather', 'events']
      },
      values: [mongoose.Schema.Types.Mixed],
      weight: Number,
      controllable: Boolean
    }]
  },

  // Combination Analysis Results
  combinationResults: [{
    // Combination identifier
    combinationId: String,
    combinationName: String,

    // Elements in this combination
    elements: [{
      elementType: String,
      elementValue: mongoose.Schema.Types.Mixed,
      elementWeight: Number
    }],

    // Performance Metrics
    performance: {
      // Volume metrics
      volumeMetrics: {
        totalVolume: Number,
        volumeLift: Number,
        volumeLiftPercentage: Number,
        sustainedVolume: Number, // Volume maintained after promotion
        incrementalVolume: Number,
        baselineVolume: Number
      },

      // Revenue metrics
      revenueMetrics: {
        totalRevenue: Number,
        revenueLift: Number,
        revenueLiftPercentage: Number,
        incrementalRevenue: Number,
        revenuePerUnit: Number,
        priceRealization: Number
      },

      // Profitability metrics
      profitabilityMetrics: {
        grossProfit: Number,
        netProfit: Number,
        marginImpact: Number,
        roi: Number,
        paybackPeriod: Number,
        profitPerUnit: Number
      },

      // Long-term impact
      longTermImpact: {
        // Volume sustainability (months after promotion)
        volumeSustainability: [{
          monthsAfter: Number,
          volumeRetention: Number,
          baselineComparison: Number
        }],

        // Customer behavior changes
        customerBehaviorImpact: {
          newCustomerAcquisition: Number,
          customerRetentionRate: Number,
          purchaseFrequencyChange: Number,
          basketSizeChange: Number,
          brandLoyaltyImpact: Number
        },

        // Market share impact
        marketShareImpact: {
          immediateGain: Number,
          sustainedGain: Number,
          competitiveResponse: String,
          categoryGrowthContribution: Number
        }
      },

      // Efficiency metrics
      efficiencyMetrics: {
        costPerIncrementalUnit: Number,
        costPerIncrementalRevenue: Number,
        marketingEfficiency: Number,
        promotionalEfficiency: Number,
        overallEfficiency: Number
      }
    },

    // Statistical Analysis
    statisticalAnalysis: {
      sampleSize: Number,
      confidenceLevel: Number,
      pValue: Number,
      correlationCoefficient: Number,
      rSquared: Number,
      standardError: Number,
      significanceLevel: {
        type: String,
        enum: ['highly_significant', 'significant', 'marginally_significant', 'not_significant']
      }
    },

    // Success Classification
    successClassification: {
      overallSuccess: {
        type: String,
        enum: ['highly_successful', 'successful', 'moderately_successful', 'unsuccessful', 'counterproductive']
      },
      volumeSuccess: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      },
      profitabilitySuccess: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      },
      sustainabilitySuccess: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      },
      successScore: Number // 0-100
    },

    // Risk Assessment
    riskAssessment: {
      overallRisk: {
        type: String,
        enum: ['low', 'medium', 'high', 'very_high']
      },
      riskFactors: [{
        factor: String,
        severity: String,
        probability: Number,
        impact: String
      }],
      mitigationStrategies: [String]
    }
  }],

  // Pattern Analysis
  patternAnalysis: {
    // Successful patterns
    successfulPatterns: [{
      patternName: String,
      patternDescription: String,

      // Pattern characteristics
      characteristics: [{
        element: String,
        value: mongoose.Schema.Types.Mixed,
        importance: Number
      }],

      // Pattern performance
      averagePerformance: {
        volumeLift: Number,
        revenueLift: Number,
        roi: Number,
        sustainability: Number
      },

      // Frequency and consistency
      frequency: Number, // How often this pattern appears
      consistency: Number, // How consistent the results are
      reliability: Number, // How reliable this pattern is

      // Conditions for success
      successConditions: [String],
      optimalTiming: String,
      targetAudience: String
    }],

    // Unsuccessful patterns
    unsuccessfulPatterns: [{
      patternName: String,
      patternDescription: String,

      // Pattern characteristics
      characteristics: [{
        element: String,
        value: mongoose.Schema.Types.Mixed,
        importance: Number
      }],

      // Why it fails
      failureReasons: [String],
      averageNegativeImpact: Number,
      frequency: Number,

      // Warning indicators
      warningIndicators: [String],
      avoidanceStrategies: [String]
    }],

    // Optimal combinations
    optimalCombinations: [{
      combinationName: String,
      description: String,

      // Optimal element values
      optimalElements: [{
        element: String,
        optimalValue: mongoose.Schema.Types.Mixed,
        tolerance: mongoose.Schema.Types.Mixed,
        criticality: String
      }],

      // Expected performance
      expectedPerformance: {
        volumeLift: {
          min: Number,
          max: Number,
          expected: Number
        },
        roi: {
          min: Number,
          max: Number,
          expected: Number
        },
        sustainability: {
          min: Number,
          max: Number,
          expected: Number
        }
      },

      // Implementation guidance
      implementationGuidance: {
        prerequisites: [String],
        timeline: String,
        resources: [String],
        keySuccessFactors: [String]
      }
    }]
  },

  // Recommendations
  recommendations: [{
    category: {
      type: String,
      enum: ['immediate_action', 'strategic_change', 'tactical_adjustment', 'avoid_combination', 'test_opportunity']
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low']
    },

    title: String,
    description: String,

    // Specific recommendations
    specificRecommendations: [{
      element: String,
      currentApproach: String,
      recommendedApproach: String,
      rationale: String,
      expectedImpact: String
    }],

    // Implementation details
    implementation: {
      timeframe: String,
      resources: [String],
      dependencies: [String],
      risks: [String],
      successMetrics: [String]
    },

    // Expected outcomes
    expectedOutcomes: {
      volumeImpact: String,
      revenueImpact: String,
      profitImpact: String,
      riskMitigation: String,
      strategicBenefit: String
    }
  }],

  // Model Information
  modelInfo: {
    analysisMethod: {
      type: String,
      enum: ['regression_analysis', 'decision_tree', 'random_forest', 'neural_network', 'ensemble_method']
    },
    modelVersion: String,
    trainingDataSize: Number,
    validationScore: Number,
    featureImportance: [{
      feature: String,
      importance: Number,
      rank: Number
    }],
    lastTrainingDate: Date,
    modelAccuracy: Number,
    crossValidationScore: Number
  },

  // Analysis Quality
  analysisQuality: {
    dataQuality: {
      completeness: Number,
      accuracy: Number,
      consistency: Number,
      timeliness: Number
    },

    statisticalRigor: {
      sampleSize: Number,
      powerAnalysis: Number,
      biasAssessment: Number,
      validityChecks: Number
    },

    businessRelevance: {
      actionability: Number,
      strategicAlignment: Number,
      practicalApplicability: Number,
      stakeholderRelevance: Number
    },

    overallQuality: Number
  },

  // Status and Metadata
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'completed', 'reviewed', 'approved', 'archived'],
    default: 'draft'
  },

  analysisMetadata: {
    analysisStartDate: Date,
    analysisCompletionDate: Date,
    processingTime: Number, // in minutes
    dataPointsAnalyzed: Number,
    combinationsTested: Number,

    // Review information
    reviewStatus: {
      type: String,
      enum: ['pending', 'in_review', 'approved', 'rejected', 'revision_required']
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewNotes: String,
    reviewDate: Date
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
combinationAnalysisSchema.index({ company: 1, analysisCode: 1 }, { unique: true });
combinationAnalysisSchema.index({ company: 1, analysisType: 1 });
combinationAnalysisSchema.index({ company: 1, analysisScope: 1 });
combinationAnalysisSchema.index({ company: 1, status: 1 });
combinationAnalysisSchema.index({ company: 1, 'analysisPeriod.startDate': 1, 'analysisPeriod.endDate': 1 });
combinationAnalysisSchema.index({ company: 1, 'analysisQuality.overallQuality': -1 });

// Compound indexes for complex queries
combinationAnalysisSchema.index({
  company: 1,
  analysisType: 1,
  status: 1,
  'analysisPeriod.endDate': -1
});

// Virtual for analysis duration
combinationAnalysisSchema.virtual('analysisDuration').get(function () {
  if (this.analysisMetadata.analysisStartDate && this.analysisMetadata.analysisCompletionDate) {
    return Math.floor((this.analysisMetadata.analysisCompletionDate - this.analysisMetadata.analysisStartDate) / (1000 * 60)); // in minutes
  }
  return null;
});

// Virtual for top performing combination
combinationAnalysisSchema.virtual('topPerformingCombination').get(function () {
  if (!this.combinationResults || this.combinationResults.length === 0) return null;

  return this.combinationResults.reduce((best, current) => {
    const currentScore = current.successClassification.successScore || 0;
    const bestScore = best.successClassification.successScore || 0;
    return currentScore > bestScore ? current : best;
  });
});

// Virtual for success rate
combinationAnalysisSchema.virtual('successRate').get(function () {
  if (!this.combinationResults || this.combinationResults.length === 0) return 0;

  const successfulCombinations = this.combinationResults.filter((c) =>
    c.successClassification.overallSuccess === 'highly_successful' ||
    c.successClassification.overallSuccess === 'successful'
  ).length;

  return (successfulCombinations / this.combinationResults.length) * 100;
});

// Virtual for average ROI
combinationAnalysisSchema.virtual('averageROI').get(function () {
  if (!this.combinationResults || this.combinationResults.length === 0) return 0;

  const rois = this.combinationResults
    .map((c) => c.performance.profitabilityMetrics.roi)
    .filter((roi) => roi !== undefined && roi !== null);

  return rois.length > 0 ? rois.reduce((sum, roi) => sum + roi, 0) / rois.length : 0;
});

// Method to add combination result
combinationAnalysisSchema.methods.addCombinationResult = function (combinationData) {
  // Generate combination ID
  const combinationId = new mongoose.Types.ObjectId().toString();

  // Calculate success score
  const successScore = this.calculateSuccessScore(combinationData.performance);

  // Classify success
  const successClassification = this.classifySuccess(successScore, combinationData.performance);

  const combinationResult = {
    combinationId,
    ...combinationData,
    successClassification: {
      ...successClassification,
      successScore
    }
  };

  this.combinationResults.push(combinationResult);
  return combinationResult;
};

// Method to calculate success score
combinationAnalysisSchema.methods.calculateSuccessScore = function (performance) {
  const weights = {
    volumeLift: 0.25,
    roi: 0.30,
    sustainability: 0.25,
    efficiency: 0.20
  };

  // Normalize metrics to 0-100 scale
  const volumeScore = Math.min(100, Math.max(0, (performance.volumeMetrics.volumeLiftPercentage || 0) * 2));
  const roiScore = Math.min(100, Math.max(0, (performance.profitabilityMetrics.roi || 0) / 2));
  const sustainabilityScore = this.calculateSustainabilityScore(performance.longTermImpact);
  const efficiencyScore = Math.min(100, Math.max(0, (performance.efficiencyMetrics.overallEfficiency || 0)));

  return (
    volumeScore * weights.volumeLift +
    roiScore * weights.roi +
    sustainabilityScore * weights.sustainability +
    efficiencyScore * weights.efficiency
  );
};

// Method to calculate sustainability score
combinationAnalysisSchema.methods.calculateSustainabilityScore = function (longTermImpact) {
  if (!longTermImpact || !longTermImpact.volumeSustainability) return 0;

  // Calculate average volume retention over time
  const retentions = longTermImpact.volumeSustainability.map((v) => v.volumeRetention || 0);
  const avgRetention = retentions.length > 0 ? retentions.reduce((sum, r) => sum + r, 0) / retentions.length : 0;

  // Factor in customer behavior improvements
  const behaviorScore = longTermImpact.customerBehaviorImpact ?
    (longTermImpact.customerBehaviorImpact.customerRetentionRate || 0) +
    (longTermImpact.customerBehaviorImpact.brandLoyaltyImpact || 0) : 0;

  return Math.min(100, avgRetention + (behaviorScore / 2));
};

// Method to classify success
combinationAnalysisSchema.methods.classifySuccess = function (successScore, performance) {
  let overallSuccess, volumeSuccess, profitabilitySuccess, sustainabilitySuccess;

  // Overall success classification
  if (successScore >= 80) overallSuccess = 'highly_successful';
  else if (successScore >= 60) overallSuccess = 'successful';
  else if (successScore >= 40) overallSuccess = 'moderately_successful';
  else if (successScore >= 20) overallSuccess = 'unsuccessful';
  else overallSuccess = 'counterproductive';

  // Volume success
  const volumeLift = performance.volumeMetrics.volumeLiftPercentage || 0;
  if (volumeLift >= 20) volumeSuccess = 'excellent';
  else if (volumeLift >= 10) volumeSuccess = 'good';
  else if (volumeLift >= 5) volumeSuccess = 'fair';
  else volumeSuccess = 'poor';

  // Profitability success
  const roi = performance.profitabilityMetrics.roi || 0;
  if (roi >= 200) profitabilitySuccess = 'excellent';
  else if (roi >= 150) profitabilitySuccess = 'good';
  else if (roi >= 100) profitabilitySuccess = 'fair';
  else profitabilitySuccess = 'poor';

  // Sustainability success
  const sustainabilityScore = this.calculateSustainabilityScore(performance.longTermImpact);
  if (sustainabilityScore >= 80) sustainabilitySuccess = 'excellent';
  else if (sustainabilityScore >= 60) sustainabilitySuccess = 'good';
  else if (sustainabilityScore >= 40) sustainabilitySuccess = 'fair';
  else sustainabilitySuccess = 'poor';

  return {
    overallSuccess,
    volumeSuccess,
    profitabilitySuccess,
    sustainabilitySuccess
  };
};

// Method to identify patterns
combinationAnalysisSchema.methods.identifyPatterns = function () {
  if (!this.combinationResults || this.combinationResults.length < 5) return;

  // Group combinations by success level
  const successful = this.combinationResults.filter((c) =>
    c.successClassification.overallSuccess === 'highly_successful' ||
    c.successClassification.overallSuccess === 'successful'
  );

  const unsuccessful = this.combinationResults.filter((c) =>
    c.successClassification.overallSuccess === 'unsuccessful' ||
    c.successClassification.overallSuccess === 'counterproductive'
  );

  // Analyze successful patterns
  this.patternAnalysis.successfulPatterns = this.analyzeSuccessfulPatterns(successful);

  // Analyze unsuccessful patterns
  this.patternAnalysis.unsuccessfulPatterns = this.analyzeUnsuccessfulPatterns(unsuccessful);

  // Generate optimal combinations
  this.patternAnalysis.optimalCombinations = this.generateOptimalCombinations(successful);

  return this.save();
};

// Method to analyze successful patterns
combinationAnalysisSchema.methods.analyzeSuccessfulPatterns = function (successfulCombinations) {
  // Implementation would use clustering or pattern recognition algorithms
  // This is a simplified version
  const patterns = [];

  // Group by similar characteristics
  const groupedByElements = {};

  successfulCombinations.forEach((combination) => {
    combination.elements.forEach((element) => {
      const key = `${element.elementType}_${element.elementValue}`;
      if (!groupedByElements[key]) {
        groupedByElements[key] = [];
      }
      groupedByElements[key].push(combination);
    });
  });

  // Identify frequent patterns
  Object.entries(groupedByElements).forEach(([key, combinations]) => {
    if (combinations.length >= 3) { // Minimum frequency threshold
      const [elementType, elementValue] = key.split('_');

      const avgPerformance = {
        volumeLift: combinations.reduce((sum, c) => sum + (c.performance.volumeMetrics.volumeLiftPercentage || 0), 0) / combinations.length,
        revenueLift: combinations.reduce((sum, c) => sum + (c.performance.revenueMetrics.revenueLiftPercentage || 0), 0) / combinations.length,
        roi: combinations.reduce((sum, c) => sum + (c.performance.profitabilityMetrics.roi || 0), 0) / combinations.length,
        sustainability: combinations.reduce((sum, c) => sum + this.calculateSustainabilityScore(c.performance.longTermImpact), 0) / combinations.length
      };

      patterns.push({
        patternName: `${elementType}_${elementValue}_pattern`,
        patternDescription: `Successful pattern involving ${elementType} with value ${elementValue}`,
        characteristics: [{
          element: elementType,
          value: elementValue,
          importance: combinations.length / successfulCombinations.length
        }],
        averagePerformance: avgPerformance,
        frequency: combinations.length,
        consistency: this.calculateConsistency(combinations),
        reliability: this.calculateReliability(combinations)
      });
    }
  });

  return patterns;
};

// Method to analyze unsuccessful patterns
combinationAnalysisSchema.methods.analyzeUnsuccessfulPatterns = function (unsuccessfulCombinations) {
  // Similar to successful patterns but focusing on failure indicators
  const patterns = [];

  // Implementation would identify common failure patterns
  // This is a simplified version

  return patterns;
};

// Method to generate optimal combinations
combinationAnalysisSchema.methods.generateOptimalCombinations = function (successfulCombinations) {
  // Implementation would use optimization algorithms
  // This is a simplified version
  const optimalCombinations = [];

  if (successfulCombinations.length > 0) {
    // Find the best performing combination as a starting point
    const best = successfulCombinations.reduce((best, current) =>
      current.successClassification.successScore > best.successClassification.successScore ? current : best
    );

    optimalCombinations.push({
      combinationName: 'Optimal_High_Performance',
      description: 'Combination optimized for maximum performance',
      optimalElements: best.elements.map((e) => ({
        element: e.elementType,
        optimalValue: e.elementValue,
        tolerance: '±10%',
        criticality: 'high'
      })),
      expectedPerformance: {
        volumeLift: {
          min: best.performance.volumeMetrics.volumeLiftPercentage * 0.8,
          max: best.performance.volumeMetrics.volumeLiftPercentage * 1.2,
          expected: best.performance.volumeMetrics.volumeLiftPercentage
        },
        roi: {
          min: best.performance.profitabilityMetrics.roi * 0.8,
          max: best.performance.profitabilityMetrics.roi * 1.2,
          expected: best.performance.profitabilityMetrics.roi
        }
      }
    });
  }

  return optimalCombinations;
};

// Helper methods
combinationAnalysisSchema.methods.calculateConsistency = function (combinations) {
  // Calculate coefficient of variation for success scores
  const scores = combinations.map((c) => c.successClassification.successScore);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  return mean > 0 ? Math.max(0, 100 - (stdDev / mean * 100)) : 0;
};

combinationAnalysisSchema.methods.calculateReliability = function (combinations) {
  // Calculate reliability based on statistical significance and sample size
  const avgPValue = combinations.reduce((sum, c) => sum + (c.statisticalAnalysis.pValue || 1), 0) / combinations.length;
  const avgSampleSize = combinations.reduce((sum, c) => sum + (c.statisticalAnalysis.sampleSize || 0), 0) / combinations.length;

  const significanceScore = avgPValue < 0.05 ? 100 : avgPValue < 0.1 ? 75 : avgPValue < 0.2 ? 50 : 25;
  const sampleSizeScore = Math.min(100, avgSampleSize / 10); // Assuming 1000 is ideal sample size

  return (significanceScore + sampleSizeScore) / 2;
};

// Static method to get company analysis summary
combinationAnalysisSchema.statics.getCompanyAnalysisSummary = function (companyId, dateRange = {}) {
  const matchStage = { company: companyId, status: 'completed' };

  if (dateRange.startDate || dateRange.endDate) {
    matchStage['analysisPeriod.endDate'] = {};
    if (dateRange.startDate) matchStage['analysisPeriod.endDate'].$gte = dateRange.startDate;
    if (dateRange.endDate) matchStage['analysisPeriod.endDate'].$lte = dateRange.endDate;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAnalyses: { $sum: 1 },
        averageSuccessRate: { $avg: '$successRate' },
        averageROI: { $avg: '$averageROI' },
        totalCombinationsTested: { $sum: '$analysisMetadata.combinationsTested' },
        averageQuality: { $avg: '$analysisQuality.overallQuality' },
        successfulPatterns: { $sum: { $size: '$patternAnalysis.successfulPatterns' } },
        optimalCombinations: { $sum: { $size: '$patternAnalysis.optimalCombinations' } }
      }
    }
  ]);
};

module.exports = mongoose.model('CombinationAnalysis', combinationAnalysisSchema);
