const mongoose = require('mongoose');

const aiChatSchema = new mongoose.Schema({
  // Company Association - CRITICAL for multi-tenant isolation
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Chat Session Information
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Chat Configuration
  chatType: {
    type: String,
    enum: ['general_insights', 'sales_analysis', 'customer_insights', 'product_performance', 'promotion_analysis', 'profitability_analysis'],
    default: 'general_insights'
  },

  // Context for AI Analysis
  context: {
    // Data scope for analysis
    dataScope: {
      dateRange: {
        startDate: Date,
        endDate: Date
      },
      customers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
      }],
      products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }],
      channels: [String],
      regions: [String],
      brands: [String],
      categories: [String]
    },

    // Available data sources for this company
    availableDataSources: [{
      source: String, // 'sales_history', 'customers', 'products', etc.
      recordCount: Number,
      lastUpdated: Date,
      dataQuality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      }
    }],

    // Company-specific business rules and KPIs
    businessContext: {
      primaryKPIs: [String],
      businessGoals: [String],
      seasonalPatterns: [String],
      competitiveFactors: [String],
      marketConditions: [String]
    }
  },

  // Chat Messages
  messages: [{
    messageId: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },

    // AI Analysis Details
    analysis: {
      // Data queries executed
      queriesExecuted: [{
        collection: String,
        query: mongoose.Schema.Types.Mixed,
        resultCount: Number,
        executionTime: Number
      }],

      // Insights generated
      insights: [{
        type: {
          type: String,
          enum: ['trend', 'anomaly', 'opportunity', 'risk', 'recommendation', 'correlation']
        },
        title: String,
        description: String,
        confidence: {
          type: Number,
          min: 0,
          max: 100
        },
        supportingData: mongoose.Schema.Types.Mixed,
        actionable: Boolean
      }],

      // Data sources used
      dataSourcesUsed: [String],

      // Processing metadata
      processingTime: Number,
      modelVersion: String,
      confidenceScore: Number
    },

    // Visualizations and attachments
    attachments: [{
      type: {
        type: String,
        enum: ['chart', 'table', 'report', 'recommendation']
      },
      title: String,
      data: mongoose.Schema.Types.Mixed,
      chartConfig: {
        chartType: String,
        xAxis: String,
        yAxis: String,
        series: [mongoose.Schema.Types.Mixed]
      }
    }],

    // User feedback
    feedback: {
      helpful: Boolean,
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      timestamp: Date
    }
  }],

  // Session Analytics
  analytics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    userMessages: {
      type: Number,
      default: 0
    },
    assistantMessages: {
      type: Number,
      default: 0
    },
    averageResponseTime: Number,
    totalProcessingTime: Number,
    insightsGenerated: {
      type: Number,
      default: 0
    },
    actionableInsights: {
      type: Number,
      default: 0
    },
    dataPointsAnalyzed: {
      type: Number,
      default: 0
    },
    averageConfidenceScore: Number
  },

  // Session Status
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'archived'],
    default: 'active'
  },

  // Session Metadata
  sessionMetadata: {
    startedAt: {
      type: Date,
      default: Date.now
    },
    lastActivityAt: {
      type: Date,
      default: Date.now
    },
    endedAt: Date,
    duration: Number, // in seconds
    userAgent: String,
    ipAddress: String,
    deviceType: String
  },

  // Privacy and Security
  privacy: {
    dataRetentionDays: {
      type: Number,
      default: 90
    },
    anonymizeAfterDays: {
      type: Number,
      default: 365
    },
    isAnonymized: {
      type: Boolean,
      default: false
    },
    encryptionLevel: {
      type: String,
      enum: ['standard', 'high', 'maximum'],
      default: 'standard'
    }
  },

  // Quality Metrics
  quality: {
    overallRating: Number,
    responseAccuracy: Number,
    insightRelevance: Number,
    userSatisfaction: Number,
    dataCompleteness: Number,
    responseSpeed: Number
  },

  // Tags and Categories
  tags: [String],
  category: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Integration Data
  integrationData: {
    externalSessionId: String,
    sourceSystem: String,
    syncStatus: String,
    lastSyncAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and multi-tenant isolation
aiChatSchema.index({ company: 1, sessionId: 1 }, { unique: true });
aiChatSchema.index({ company: 1, user: 1 });
aiChatSchema.index({ company: 1, status: 1 });
aiChatSchema.index({ company: 1, chatType: 1 });
aiChatSchema.index({ company: 1, 'sessionMetadata.startedAt': -1 });
aiChatSchema.index({ company: 1, 'sessionMetadata.lastActivityAt': -1 });
aiChatSchema.index({ 'privacy.dataRetentionDays': 1, createdAt: 1 }); // For cleanup

// Compound indexes for complex queries
aiChatSchema.index({
  company: 1,
  user: 1,
  status: 1,
  'sessionMetadata.lastActivityAt': -1
});

// Virtual for session duration
aiChatSchema.virtual('sessionDuration').get(function () {
  if (this.sessionMetadata.endedAt) {
    return Math.floor((this.sessionMetadata.endedAt - this.sessionMetadata.startedAt) / 1000);
  }
  return Math.floor((new Date() - this.sessionMetadata.startedAt) / 1000);
});

// Virtual for message count
aiChatSchema.virtual('messageCount').get(function () {
  return this.messages.length;
});

// Virtual for latest message
aiChatSchema.virtual('latestMessage').get(function () {
  return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
});

// Virtual for insights summary
aiChatSchema.virtual('insightsSummary').get(function () {
  const allInsights = this.messages.reduce((acc, msg) => {
    if (msg.analysis && msg.analysis.insights) {
      acc.push(...msg.analysis.insights);
    }
    return acc;
  }, []);

  const summary = {
    total: allInsights.length,
    byType: {},
    actionable: allInsights.filter((i) => i.actionable).length,
    averageConfidence: 0
  };

  allInsights.forEach((insight) => {
    summary.byType[insight.type] = (summary.byType[insight.type] || 0) + 1;
    summary.averageConfidence += insight.confidence || 0;
  });

  if (allInsights.length > 0) {
    summary.averageConfidence = summary.averageConfidence / allInsights.length;
  }

  return summary;
});

// Method to add message to chat
aiChatSchema.methods.addMessage = function (role, content, analysis = null, attachments = []) {
  const messageId = new mongoose.Types.ObjectId().toString();

  const message = {
    messageId,
    role,
    content,
    timestamp: new Date(),
    analysis,
    attachments
  };

  this.messages.push(message);

  // Update analytics
  this.analytics.totalMessages += 1;
  if (role === 'user') {
    this.analytics.userMessages += 1;
  } else if (role === 'assistant') {
    this.analytics.assistantMessages += 1;

    if (analysis) {
      this.analytics.insightsGenerated += (analysis.insights || []).length;
      this.analytics.actionableInsights += (analysis.insights || []).filter((i) => i.actionable).length;
      this.analytics.totalProcessingTime += analysis.processingTime || 0;

      if (analysis.queriesExecuted) {
        this.analytics.dataPointsAnalyzed += analysis.queriesExecuted.reduce((sum, q) => sum + (q.resultCount || 0), 0);
      }
    }
  }

  // Update session metadata
  this.sessionMetadata.lastActivityAt = new Date();

  return message;
};

// Method to end session
aiChatSchema.methods.endSession = function () {
  this.status = 'completed';
  this.sessionMetadata.endedAt = new Date();
  this.sessionMetadata.duration = this.sessionDuration;

  // Calculate quality metrics
  this.calculateQualityMetrics();

  return this.save();
};

// Method to calculate quality metrics
aiChatSchema.methods.calculateQualityMetrics = function () {
  const messages = this.messages.filter((m) => m.role === 'assistant');

  if (messages.length === 0) return;

  // Calculate average response time
  let totalResponseTime = 0;
  let responseCount = 0;

  for (let i = 1; i < this.messages.length; i++) {
    if (this.messages[i].role === 'assistant' && this.messages[i - 1].role === 'user') {
      const responseTime = this.messages[i].timestamp - this.messages[i - 1].timestamp;
      totalResponseTime += responseTime;
      responseCount++;
    }
  }

  if (responseCount > 0) {
    this.analytics.averageResponseTime = totalResponseTime / responseCount;
  }

  // Calculate average confidence score
  const confidenceScores = messages
    .map((m) => m.analysis?.confidenceScore)
    .filter((score) => score !== undefined);

  if (confidenceScores.length > 0) {
    this.analytics.averageConfidenceScore = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  }

  // Calculate overall quality metrics
  const feedbacks = this.messages
    .map((m) => m.feedback)
    .filter((f) => f && f.rating);

  if (feedbacks.length > 0) {
    this.quality.userSatisfaction = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
  }

  this.quality.responseSpeed = this.analytics.averageResponseTime < 5000 ? 5 :
    this.analytics.averageResponseTime < 10000 ? 4 :
      this.analytics.averageResponseTime < 20000 ? 3 : 2;

  this.quality.insightRelevance = this.analytics.averageConfidenceScore / 20; // Convert to 1-5 scale

  this.quality.overallRating = (
    (this.quality.userSatisfaction || 3) +
    (this.quality.responseSpeed || 3) +
    (this.quality.insightRelevance || 3)
  ) / 3;
};

// Static method to find active sessions for user
aiChatSchema.statics.findActiveSessionsForUser = function (companyId, userId) {
  return this.find({
    company: companyId,
    user: userId,
    status: 'active'
  }).sort({ 'sessionMetadata.lastActivityAt': -1 });
};

// Static method to get chat analytics for company
aiChatSchema.statics.getCompanyAnalytics = function (companyId, dateRange = {}) {
  const matchStage = { company: companyId };

  if (dateRange.startDate || dateRange.endDate) {
    matchStage.createdAt = {};
    if (dateRange.startDate) matchStage.createdAt.$gte = dateRange.startDate;
    if (dateRange.endDate) matchStage.createdAt.$lte = dateRange.endDate;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalMessages: { $sum: '$analytics.totalMessages' },
        totalInsights: { $sum: '$analytics.insightsGenerated' },
        totalActionableInsights: { $sum: '$analytics.actionableInsights' },
        averageSessionDuration: { $avg: '$sessionMetadata.duration' },
        averageQuality: { $avg: '$quality.overallRating' },
        averageConfidence: { $avg: '$analytics.averageConfidenceScore' }
      }
    }
  ]);
};

// Pre-save middleware
aiChatSchema.pre('save', function (next) {
  // Update last activity timestamp
  this.sessionMetadata.lastActivityAt = new Date();
  next();
});

// TTL index for automatic cleanup based on retention policy
aiChatSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: {
      'privacy.dataRetentionDays': { $exists: true }
    }
  }
);

module.exports = mongoose.model('AIChat', aiChatSchema);
