const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  // Campaign Identification

  // Company Association - CRITICAL for multi-tenant isolation
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  campaignId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  objective: String,

  // Campaign Type
  campaignType: {
    type: String,
    enum: ['brand_awareness', 'product_launch', 'seasonal', 'clearance', 'loyalty', 'competitive', 'tactical'],
    required: true
  },

  // Period
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },

  // Target Audience
  targetAudience: {
    demographics: {
      ageGroups: [String],
      gender: [String],
      incomeLevel: [String],
      lifestyle: [String]
    },
    psychographics: {
      interests: [String],
      values: [String],
      behaviors: [String]
    },
    geographics: {
      regions: [String],
      urbanity: [String]
    }
  },

  // Scope
  scope: {
    national: Boolean,
    regions: [String],
    customers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    }],
    customerGroups: [String],
    channels: [String],
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    productCategories: [String],
    brands: [String]
  },

  // Marketing Mix
  marketingMix: {
    // Advertising
    advertising: {
      tv: {
        enabled: Boolean,
        budget: Number,
        spots: Number,
        channels: [String]
      },
      radio: {
        enabled: Boolean,
        budget: Number,
        spots: Number,
        stations: [String]
      },
      digital: {
        enabled: Boolean,
        budget: Number,
        platforms: [String],
        impressions: Number
      },
      print: {
        enabled: Boolean,
        budget: Number,
        publications: [String]
      },
      outdoor: {
        enabled: Boolean,
        budget: Number,
        locations: Number
      }
    },

    // In-store
    inStore: {
      displays: {
        enabled: Boolean,
        budget: Number,
        stores: Number,
        type: [String]
      },
      sampling: {
        enabled: Boolean,
        budget: Number,
        events: Number,
        samples: Number
      },
      demonstrations: {
        enabled: Boolean,
        budget: Number,
        events: Number
      }
    },

    // Digital Marketing
    digital: {
      socialMedia: {
        enabled: Boolean,
        budget: Number,
        platforms: [String],
        posts: Number
      },
      email: {
        enabled: Boolean,
        budget: Number,
        campaigns: Number,
        recipients: Number
      },
      seo: {
        enabled: Boolean,
        budget: Number,
        keywords: [String]
      },
      influencer: {
        enabled: Boolean,
        budget: Number,
        influencers: Number
      }
    },

    // Trade Marketing
    trade: {
      tradeshows: {
        enabled: Boolean,
        budget: Number,
        events: [String]
      },
      training: {
        enabled: Boolean,
        budget: Number,
        sessions: Number
      },
      incentives: {
        enabled: Boolean,
        budget: Number,
        programs: [String]
      }
    }
  },

  // Budget
  budget: {
    total: {
      type: Number,
      required: true
    },
    allocated: {
      type: Number,
      default: 0
    },
    spent: {
      type: Number,
      default: 0
    },
    breakdown: {
      advertising: Number,
      inStore: Number,
      digital: Number,
      trade: Number,
      production: Number,
      other: Number
    },
    source: {
      marketing: Number,
      cashCoop: Number,
      vendor: Number,
      other: Number
    }
  },

  // Associated Promotions
  promotions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion'
  }],

  // KPIs and Targets
  kpis: [{
    metric: String,
    target: Number,
    actual: Number,
    unit: String,
    status: {
      type: String,
      enum: ['on_track', 'at_risk', 'off_track', 'completed']
    }
  }],

  // AI-Generated Content and Suggestions
  aiContent: {
    suggestedCaptions: [{
      platform: String,
      caption: String,
      score: Number,
      reasoning: String
    }],
    suggestedHashtags: [String],
    suggestedTimings: [{
      platform: String,
      dayOfWeek: String,
      time: String,
      reasoning: String
    }],
    contentCalendar: [{
      date: Date,
      platform: String,
      content: String,
      status: String
    }],
    effectiveness: {
      predictedReach: Number,
      predictedEngagement: Number,
      predictedConversion: Number,
      confidence: Number
    }
  },

  // Performance Tracking
  performance: {
    reach: {
      target: Number,
      actual: Number
    },
    impressions: {
      target: Number,
      actual: Number
    },
    engagement: {
      target: Number,
      actual: Number,
      rate: Number
    },
    conversions: {
      target: Number,
      actual: Number,
      rate: Number
    },
    sales: {
      baseline: Number,
      incremental: Number,
      total: Number
    },
    roi: Number,
    effectiveness: Number
  },

  // Creative Assets
  creativeAssets: [{
    name: String,
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'html']
    },
    url: String,
    thumbnail: String,
    platform: [String],
    dimensions: String,
    fileSize: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedDate: Date,
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],

  // Status and Workflow
  status: {
    type: String,
    enum: ['planning', 'pending_approval', 'approved', 'active', 'completed', 'cancelled'],
    default: 'planning'
  },

  // Approvals
  approvals: [{
    level: {
      type: String,
      enum: ['marketing_manager', 'brand_manager', 'finance', 'legal', 'director']
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'conditional'],
      default: 'pending'
    },
    comments: String,
    date: Date
  }],

  // Execution Timeline
  timeline: [{
    milestone: String,
    plannedDate: Date,
    actualDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'delayed']
    },
    responsible: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],

  // Analytics and Insights
  analytics: {
    competitorActivity: [{
      competitor: String,
      activity: String,
      impact: String,
      date: Date
    }],
    marketConditions: [{
      factor: String,
      impact: String,
      mitigation: String
    }],
    lessons: [{
      lesson: String,
      category: String,
      recommendation: String
    }]
  },

  // Created/Modified By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // History
  history: [{
    action: String,
    changes: mongoose.Schema.Types.Mixed,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedDate: Date,
    comment: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
campaignSchema.index({ campaignId: 1 });
campaignSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ campaignType: 1 });
campaignSchema.index({ 'scope.customers': 1 });
campaignSchema.index({ 'scope.products': 1 });

// Virtual for days remaining
campaignSchema.virtual('daysRemaining').get(function () {
  if (this.period.endDate) {
    const today = new Date();
    const endDate = new Date(this.period.endDate);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }
  return 0;
});

// Virtual for budget utilization
campaignSchema.virtual('budgetUtilization').get(function () {
  if (this.budget.total > 0) {
    return (this.budget.spent / this.budget.total) * 100;
  }
  return 0;
});

// Pre-save middleware
campaignSchema.pre('save', function (next) {
  // Calculate allocated budget
  if (this.isModified('budget.breakdown')) {
    this.budget.allocated =
      (this.budget.breakdown.advertising || 0) +
      (this.budget.breakdown.inStore || 0) +
      (this.budget.breakdown.digital || 0) +
      (this.budget.breakdown.trade || 0) +
      (this.budget.breakdown.production || 0) +
      (this.budget.breakdown.other || 0);
  }

  // Calculate ROI if we have performance data
  if (this.performance.sales.incremental && this.budget.spent > 0) {
    this.performance.roi =
      ((this.performance.sales.incremental - this.budget.spent) / this.budget.spent) * 100;
  }

  // Update KPI statuses
  this.kpis.forEach((kpi) => {
    if (kpi.target && kpi.actual !== undefined) {
      const achievement = (kpi.actual / kpi.target) * 100;
      if (achievement >= 90) {
        kpi.status = 'on_track';
      } else if (achievement >= 70) {
        kpi.status = 'at_risk';
      } else {
        kpi.status = 'off_track';
      }
    }
  });

  next();
});

// Methods
campaignSchema.methods.allocateBudget = async function (category, amount) {
  if (!this.budget.breakdown[category]) {
    this.budget.breakdown[category] = 0;
  }

  this.budget.breakdown[category] += amount;
  await this.save();
};

campaignSchema.methods.recordSpend = async function (amount, category) {
  this.budget.spent += amount;

  this.history.push({
    action: 'spend_recorded',
    changes: { amount, category },
    performedDate: new Date()
  });

  await this.save();
};

campaignSchema.methods.updateKPI = async function (metric, actualValue) {
  const kpi = this.kpis.find((k) => k.metric === metric);
  if (kpi) {
    kpi.actual = actualValue;
    await this.save();
  }
};

campaignSchema.methods.generateAISuggestions = async function () {
  // This would integrate with AI service to generate content suggestions
  // Placeholder for AI integration
  return {
    captions: [],
    hashtags: [],
    timings: []
  };
};

// Statics
campaignSchema.statics.findActive = function () {
  const today = new Date();
  return this.find({
    'period.startDate': { $lte: today },
    'period.endDate': { $gte: today },
    status: 'active'
  });
};

campaignSchema.statics.findByProduct = function (productId) {
  return this.find({
    'scope.products': productId
  });
};

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
