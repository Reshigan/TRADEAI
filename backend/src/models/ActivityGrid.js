const mongoose = require('mongoose');

const activityGridSchema = new mongoose.Schema({
  // Grid Identification

  // Company Association - CRITICAL for multi-tenant isolation
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  gridId: {
    type: String,
    required: true,
    unique: true
  },

  // View Configuration
  viewType: {
    type: String,
    enum: ['week', 'month', 'quarter', 'year'],
    required: true
  },
  period: {
    year: {
      type: Number,
      required: true
    },
    quarter: Number,
    month: Number,
    week: Number,
    startDate: Date,
    endDate: Date
  },

  // Scope
  scope: {
    level: {
      type: String,
      enum: ['company', 'region', 'customer', 'vendor', 'product', 'user'],
      required: true
    },
    entityId: mongoose.Schema.Types.ObjectId,
    entityName: String,
    filters: {
      customers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
      }],
      vendors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
      }],
      products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }],
      users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      channels: [String],
      regions: [String]
    }
  },

  // Grid Data
  activities: [{
    // Activity Details
    date: {
      type: Date,
      required: true
    },
    dayOfWeek: Number,
    weekNumber: Number,

    // Activity Type
    activityType: {
      type: String,
      enum: ['promotion', 'campaign', 'trade_spend', 'event', 'training', 'other'],
      required: true
    },

    // References
    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion'
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    },
    tradeSpend: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TradeSpend'
    },

    // Activity Info
    name: String,
    description: String,
    status: {
      type: String,
      enum: ['planned', 'confirmed', 'active', 'completed', 'cancelled']
    },

    // Financial
    spend: {
      marketing: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 }
      },
      cashCoop: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 }
      },
      tradingTerms: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 }
      },
      total: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 }
      }
    },

    // Participants
    customers: [{
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
      },
      stores: Number
    }],
    products: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      quantity: Number
    }],

    // Performance
    performance: {
      targetMetric: String,
      targetValue: Number,
      actualValue: Number,
      achievement: Number
    },

    // Visual Indicators
    indicators: {
      color: String,
      icon: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      conflicts: [{
        type: String,
        description: String,
        severity: String
      }]
    }
  }],

  // Summary Statistics
  summary: {
    totalActivities: {
      type: Number,
      default: 0
    },
    byType: {
      promotions: { type: Number, default: 0 },
      campaigns: { type: Number, default: 0 },
      tradeSpends: { type: Number, default: 0 },
      events: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    byStatus: {
      planned: { type: Number, default: 0 },
      confirmed: { type: Number, default: 0 },
      active: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 }
    },
    spend: {
      marketing: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 },
        variance: { type: Number, default: 0 }
      },
      cashCoop: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 },
        variance: { type: Number, default: 0 }
      },
      tradingTerms: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 },
        variance: { type: Number, default: 0 }
      },
      total: {
        planned: { type: Number, default: 0 },
        actual: { type: Number, default: 0 },
        variance: { type: Number, default: 0 }
      }
    },
    coverage: {
      customers: { type: Number, default: 0 },
      products: { type: Number, default: 0 },
      regions: { type: Number, default: 0 }
    }
  },

  // Heatmap Data (for visual representation)
  heatmap: [{
    date: Date,
    intensity: Number, // 0-100
    spendLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high']
    },
    activityCount: Number
  }],

  // Conflicts and Overlaps
  conflicts: [{
    date: Date,
    activities: [{
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'conflicts.activityType'
    }],
    activityType: {
      type: String,
      enum: ['Promotion', 'Campaign', 'TradeSpend']
    },
    conflictType: {
      type: String,
      enum: ['customer_overlap', 'product_overlap', 'budget_exceeded', 'resource_conflict']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    description: String,
    resolution: String
  }],

  // AI Insights
  insights: [{
    type: {
      type: String,
      enum: ['opportunity', 'risk', 'optimization', 'trend', 'anomaly']
    },
    title: String,
    description: String,
    impact: String,
    recommendation: String,
    confidence: Number,
    date: Date
  }],

  // User Preferences
  preferences: {
    defaultView: String,
    colorScheme: String,
    showWeekends: Boolean,
    showHolidays: Boolean,
    groupBy: String,
    sortBy: String,
    filters: mongoose.Schema.Types.Mixed
  },

  // Cache Information
  cache: {
    generated: Date,
    expires: Date,
    version: Number
  },

  // Created By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
activityGridSchema.index({ gridId: 1 });
activityGridSchema.index({ 'period.year': 1, 'period.month': 1 });
activityGridSchema.index({ 'scope.level': 1, 'scope.entityId': 1 });
activityGridSchema.index({ viewType: 1 });
activityGridSchema.index({ 'activities.date': 1 });
activityGridSchema.index({ 'cache.expires': 1 });

// Compound indexes
activityGridSchema.index({
  'period.year': 1,
  'period.month': 1,
  'scope.level': 1,
  'scope.entityId': 1
});

// Pre-save middleware to calculate summaries
activityGridSchema.pre('save', function (next) {
  // Reset summary
  this.summary = {
    totalActivities: 0,
    byType: {
      promotions: 0,
      campaigns: 0,
      tradeSpends: 0,
      events: 0,
      other: 0
    },
    byStatus: {
      planned: 0,
      confirmed: 0,
      active: 0,
      completed: 0,
      cancelled: 0
    },
    spend: {
      marketing: { planned: 0, actual: 0, variance: 0 },
      cashCoop: { planned: 0, actual: 0, variance: 0 },
      tradingTerms: { planned: 0, actual: 0, variance: 0 },
      total: { planned: 0, actual: 0, variance: 0 }
    },
    coverage: {
      customers: new Set(),
      products: new Set(),
      regions: new Set()
    }
  };

  // Calculate summaries from activities
  this.activities.forEach((activity) => {
    this.summary.totalActivities++;

    // Count by type
    switch (activity.activityType) {
      case 'promotion':
        this.summary.byType.promotions++;
        break;
      case 'campaign':
        this.summary.byType.campaigns++;
        break;
      case 'trade_spend':
        this.summary.byType.tradeSpends++;
        break;
      case 'event':
      case 'training':
        this.summary.byType.events++;
        break;
      default:
        this.summary.byType.other++;
    }

    // Count by status
    if (activity.status && this.summary.byStatus[activity.status] !== undefined) {
      this.summary.byStatus[activity.status]++;
    }

    // Sum spend
    ['marketing', 'cashCoop', 'tradingTerms'].forEach((type) => {
      if (activity.spend[type]) {
        this.summary.spend[type].planned += activity.spend[type].planned || 0;
        this.summary.spend[type].actual += activity.spend[type].actual || 0;
      }
    });

    // Calculate total spend for activity
    activity.spend.total.planned =
      (activity.spend.marketing.planned || 0) +
      (activity.spend.cashCoop.planned || 0) +
      (activity.spend.tradingTerms.planned || 0);

    activity.spend.total.actual =
      (activity.spend.marketing.actual || 0) +
      (activity.spend.cashCoop.actual || 0) +
      (activity.spend.tradingTerms.actual || 0);

    // Add to total
    this.summary.spend.total.planned += activity.spend.total.planned;
    this.summary.spend.total.actual += activity.spend.total.actual;

    // Track coverage
    activity.customers.forEach((c) => {
      if (c.customer) this.summary.coverage.customers.add(c.customer.toString());
    });
    activity.products.forEach((p) => {
      if (p.product) this.summary.coverage.products.add(p.product.toString());
    });
  });

  // Calculate variances
  ['marketing', 'cashCoop', 'tradingTerms', 'total'].forEach((type) => {
    this.summary.spend[type].variance =
      this.summary.spend[type].actual - this.summary.spend[type].planned;
  });

  // Convert sets to counts
  this.summary.coverage.customers = this.summary.coverage.customers.size;
  this.summary.coverage.products = this.summary.coverage.products.size;

  // Generate heatmap data
  this.generateHeatmap();

  // Set cache expiry
  this.cache.generated = new Date();
  this.cache.expires = new Date(Date.now() + 3600000); // 1 hour

  next();
});

// Methods
activityGridSchema.methods.generateHeatmap = function () {
  const heatmapData = {};

  // Group activities by date
  this.activities.forEach((activity) => {
    const dateKey = activity.date.toISOString().split('T')[0];

    if (!heatmapData[dateKey]) {
      heatmapData[dateKey] = {
        date: activity.date,
        activityCount: 0,
        totalSpend: 0
      };
    }

    heatmapData[dateKey].activityCount++;
    heatmapData[dateKey].totalSpend += activity.spend.total.planned || 0;
  });

  // Convert to heatmap array
  this.heatmap = Object.values(heatmapData).map((data) => {
    // Calculate intensity (0-100)
    const intensity = Math.min(100, (data.activityCount * 20) + (data.totalSpend / 1000));

    // Determine spend level
    let spendLevel = 'low';
    if (data.totalSpend > 100000) spendLevel = 'very_high';
    else if (data.totalSpend > 50000) spendLevel = 'high';
    else if (data.totalSpend > 10000) spendLevel = 'medium';

    return {
      date: data.date,
      intensity,
      spendLevel,
      activityCount: data.activityCount
    };
  });
};

activityGridSchema.methods.detectConflicts = async function () {
  const conflicts = [];

  // Group activities by date
  const activitiesByDate = {};
  this.activities.forEach((activity) => {
    const dateKey = activity.date.toISOString().split('T')[0];
    if (!activitiesByDate[dateKey]) {
      activitiesByDate[dateKey] = [];
    }
    activitiesByDate[dateKey].push(activity);
  });

  // Check for conflicts
  Object.entries(activitiesByDate).forEach(([date, activities]) => {
    if (activities.length > 1) {
      // Check customer overlaps
      const customerMap = {};
      activities.forEach((activity) => {
        activity.customers.forEach((c) => {
          const customerId = c.customer.toString();
          if (customerMap[customerId]) {
            conflicts.push({
              date: new Date(date),
              activities: [customerMap[customerId]._id, activity._id],
              conflictType: 'customer_overlap',
              severity: 'medium',
              description: `Multiple activities for same customer on ${date}`
            });
          }
          customerMap[customerId] = activity;
        });
      });

      // Check budget limits
      const totalSpend = activities.reduce((sum, a) => sum + a.spend.total.planned, 0);
      if (totalSpend > 100000) { // Example threshold
        conflicts.push({
          date: new Date(date),
          activities: activities.map((a) => a._id),
          conflictType: 'budget_exceeded',
          severity: 'high',
          description: `Daily spend limit exceeded on ${date}`
        });
      }
    }
  });

  this.conflicts = conflicts;
  await this.save();
};

// Statics
activityGridSchema.statics.generateGrid = async function (viewType, period, scope) {
  const gridId = `${viewType}_${period.year}_${period.month || 'all'}_${scope.level}_${scope.entityId}`;

  // Check cache
  let grid = await this.findOne({
    gridId,
    'cache.expires': { $gt: new Date() }
  });

  if (!grid) {
    // Generate new grid
    grid = new this({
      gridId,
      viewType,
      period,
      scope
    });

    // Populate activities based on scope and period
    // This would fetch from Promotion, Campaign, TradeSpend models

    await grid.save();
  }

  return grid;
};

const ActivityGrid = mongoose.model('ActivityGrid', activityGridSchema);

module.exports = ActivityGrid;
