const mongoose = require('mongoose');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

const reportSchema = new mongoose.Schema({
  // Company Association - CRITICAL for multi-tenant isolation
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Report Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  reportType: {
    type: String,
    required: true,
    enum: [
      'sales_performance',
      'customer_analysis',
      'product_performance',
      'promotion_effectiveness',
      'trading_terms_analysis',
      'budget_utilization',
      'profitability_analysis',
      'market_share',
      'growth_analysis',
      'roi_analysis',
      'custom'
    ]
  },

  // Report Configuration
  configuration: {
    // Data Sources
    dataSources: [{
      type: String,
      enum: ['sales_history', 'customers', 'products', 'promotions', 'campaigns', 'budgets', 'trading_terms', 'trade_spend'],
      required: true
    }],

    // Filters
    filters: {
      dateRange: {
        startDate: Date,
        endDate: Date,
        period: {
          type: String,
          enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']
        }
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
      categories: [String],
      salesReps: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    },

    // Grouping and Aggregation
    groupBy: [{
      type: String,
      enum: ['customer', 'product', 'brand', 'category', 'channel', 'region', 'sales_rep', 'month', 'quarter', 'year']
    }],

    // Metrics to Include
    metrics: [{
      name: String,
      type: {
        type: String,
        enum: ['sum', 'average', 'count', 'min', 'max', 'percentage', 'growth_rate', 'ratio']
      },
      field: String,
      calculation: String // Custom calculation formula
    }],

    // Sorting
    sortBy: {
      field: String,
      direction: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'desc'
      }
    },

    // Visualization
    visualization: {
      chartType: {
        type: String,
        enum: ['table', 'bar', 'line', 'pie', 'scatter', 'heatmap', 'treemap']
      },
      showTrends: Boolean,
      showComparisons: Boolean,
      showPercentages: Boolean
    }
  },

  // Report Data (cached results)
  reportData: {
    data: mongoose.Schema.Types.Mixed,
    summary: {
      totalRecords: Number,
      totalValue: Number,
      averageValue: Number,
      growthRate: Number,
      topPerformers: [mongoose.Schema.Types.Mixed],
      insights: [String]
    },
    generatedAt: Date,
    executionTime: Number, // in milliseconds
    dataFreshness: Date // when underlying data was last updated
  },

  // Export Settings
  exportSettings: {
    formats: [{
      type: String,
      enum: ['pdf', 'excel', 'csv', 'json'],
      enabled: {
        type: Boolean,
        default: true
      }
    }],
    includeCharts: {
      type: Boolean,
      default: true
    },
    includeRawData: {
      type: Boolean,
      default: false
    },
    branding: {
      includeLogo: {
        type: Boolean,
        default: true
      },
      includeCompanyInfo: {
        type: Boolean,
        default: true
      },
      customHeader: String,
      customFooter: String
    }
  },

  // Scheduling
  schedule: {
    isScheduled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly'],
      required() { return this.schedule.isScheduled; }
    },
    dayOfWeek: Number, // 0-6 for weekly
    dayOfMonth: Number, // 1-31 for monthly
    time: String, // HH:MM format
    timezone: String,
    recipients: [{
      email: String,
      name: String,
      role: String
    }],
    lastRun: Date,
    nextRun: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },

  // Access Control
  accessControl: {
    visibility: {
      type: String,
      enum: ['private', 'team', 'company'],
      default: 'private'
    },
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    allowedRoles: [String],
    allowedDepartments: [String]
  },

  // Performance Tracking
  performance: {
    viewCount: {
      type: Number,
      default: 0
    },
    exportCount: {
      type: Number,
      default: 0
    },
    lastViewed: Date,
    lastExported: Date,
    averageLoadTime: Number,
    popularityScore: Number
  },

  // Template Information
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateCategory: String,
  templateTags: [String],

  // Status and Metadata
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'error'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFavorite: {
    type: Boolean,
    default: false
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
reportSchema.index({ company: 1, reportType: 1 });
reportSchema.index({ company: 1, status: 1 });
reportSchema.index({ company: 1, isActive: 1 });
reportSchema.index({ company: 1, createdBy: 1 });
reportSchema.index({ company: 1, 'schedule.isScheduled': 1, 'schedule.isActive': 1 });
reportSchema.index({ company: 1, isTemplate: 1 });
reportSchema.index({ 'reportData.generatedAt': 1 });
reportSchema.index({ 'schedule.nextRun': 1 });

// Compound indexes for complex queries
reportSchema.index({
  company: 1,
  reportType: 1,
  status: 1,
  isActive: 1
});

// Virtual for data freshness status
reportSchema.virtual('dataFreshnessStatus').get(function () {
  if (!this.reportData.dataFreshness) return 'unknown';

  const now = new Date();
  const freshness = new Date(this.reportData.dataFreshness);
  const hoursDiff = (now - freshness) / (1000 * 60 * 60);

  if (hoursDiff < 1) return 'fresh';
  if (hoursDiff < 24) return 'recent';
  if (hoursDiff < 168) return 'stale'; // 1 week
  return 'outdated';
});

// Virtual for next scheduled run
reportSchema.virtual('nextScheduledRun').get(function () {
  if (!this.schedule.isScheduled || !this.schedule.isActive) return null;
  return this.schedule.nextRun;
});

// Virtual for report size estimation
reportSchema.virtual('estimatedSize').get(function () {
  if (!this.reportData.data) return 0;
  return JSON.stringify(this.reportData.data).length;
});

// Method to check if user can access report
reportSchema.methods.canUserAccess = function (userId, userRole, userDepartment) {
  // Creator always has access
  if (this.createdBy.toString() === userId.toString()) return true;

  // Check visibility level
  if (this.accessControl.visibility === 'company') return true;
  if (this.accessControl.visibility === 'private') return false;

  // Check specific user access
  if (this.accessControl.allowedUsers.includes(userId)) return true;

  // Check role access
  if (this.accessControl.allowedRoles.includes(userRole)) return true;

  // Check department access
  if (this.accessControl.allowedDepartments.includes(userDepartment)) return true;

  return false;
};

// Method to update performance metrics
reportSchema.methods.updatePerformance = function (action, loadTime) {
  if (action === 'view') {
    this.performance.viewCount += 1;
    this.performance.lastViewed = new Date();
  } else if (action === 'export') {
    this.performance.exportCount += 1;
    this.performance.lastExported = new Date();
  }

  if (loadTime) {
    const currentAvg = this.performance.averageLoadTime || 0;
    const totalViews = this.performance.viewCount;
    this.performance.averageLoadTime = ((currentAvg * (totalViews - 1)) + loadTime) / totalViews;
  }

  // Calculate popularity score
  const views = this.performance.viewCount || 0;
  const exports = this.performance.exportCount || 0;
  const recency = this.performance.lastViewed ?
    Math.max(0, 30 - Math.floor((new Date() - this.performance.lastViewed) / (1000 * 60 * 60 * 24))) : 0;

  this.performance.popularityScore = (views * 1) + (exports * 3) + (recency * 0.5);

  return this.save();
};

// Method to calculate next run time for scheduled reports
reportSchema.methods.calculateNextRun = function () {
  if (!this.schedule.isScheduled || !this.schedule.isActive) return null;

  const now = new Date();
  const nextRun = new Date();

  switch (this.schedule.frequency) {
    case 'daily':
      nextRun.setDate(now.getDate() + 1);
      break;
    case 'weekly': {
      const daysUntilNext = (this.schedule.dayOfWeek - now.getDay() + 7) % 7;
      nextRun.setDate(now.getDate() + (daysUntilNext || 7));
      break;
    }
    case 'monthly':
      nextRun.setMonth(now.getMonth() + 1);
      nextRun.setDate(this.schedule.dayOfMonth);
      break;
    case 'quarterly':
      nextRun.setMonth(now.getMonth() + 3);
      nextRun.setDate(this.schedule.dayOfMonth);
      break;
  }

  // Set time
  if (this.schedule.time) {
    const [hours, minutes] = this.schedule.time.split(':');
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }

  this.schedule.nextRun = nextRun;
  return nextRun;
};

// Static method to find reports due for execution
reportSchema.statics.findDueReports = function () {
  const now = new Date();
  return this.find({
    'schedule.isScheduled': true,
    'schedule.isActive': true,
    'schedule.nextRun': { $lte: now },
    status: 'active'
  });
};

// Static method to get popular reports for company
reportSchema.statics.getPopularReports = function (companyId, limit = 10) {
  return this.find({
    company: companyId,
    status: 'active',
    isActive: true
  })
    .sort({ 'performance.popularityScore': -1 })
    .limit(limit)
    .populate('createdBy', 'firstName lastName email');
};

// Pre-save middleware
reportSchema.pre('save', function (next) {
  // Calculate next run if scheduled
  if (this.schedule.isScheduled && this.schedule.isActive) {
    this.calculateNextRun();
  }

  next();
});

// Add pagination plugin
reportSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model('Report', reportSchema);
