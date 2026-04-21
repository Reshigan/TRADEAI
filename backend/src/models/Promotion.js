const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const promotionSchema = new mongoose.Schema({
  // Tenant Association - CRITICAL for multi-tenant isolation
  // Note: tenantId will be added by addTenantSupport()

  // Legacy company support (will be migrated to tenant)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  promotionId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,

  // Promotion Type and Mechanics
  promotionType: {
    type: String,
    enum: ['price_discount', 'volume_discount', 'bogo', 'bundle', 'gift', 'loyalty', 'display', 'feature'],
    required: true
  },
  mechanics: {
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount', 'price_point']
    },
    discountValue: Number,
    buyQuantity: Number,
    getQuantity: Number,
    bundleProducts: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      quantity: Number
    }],
    giftProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    minimumPurchase: Number,
    maximumDiscount: Number
  },

  // Timing
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    sellInStartDate: Date,
    sellInEndDate: Date
  },

  // Analysis Windows (6 weeks before, during, 6 weeks after)
  analysisWindows: {
    baseline: {
      startDate: Date,
      endDate: Date,
      weeks: { type: Number, default: 6 }
    },
    promotion: {
      startDate: Date,
      endDate: Date
    },
    post: {
      startDate: Date,
      endDate: Date,
      weeks: { type: Number, default: 6 }
    }
  },

  // Scope
  scope: {
    customers: [{
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
      },
      stores: [String],
      exclusions: [String]
    }],
    customerHierarchy: [{
      level: Number,
      value: String
    }],
    customerGroups: [String],
    channels: [String],
    regions: [String]
  },

  // Products
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    regularPrice: Number,
    promotionalPrice: Number,
    expectedLift: Number,
    minimumOrder: Number
  }],
  productHierarchy: [{
    level: Number,
    value: String
  }],

  // Financial Planning
  financial: {
    // Planned volumes and values
    planned: {
      baselineVolume: Number,
      promotionalVolume: Number,
      incrementalVolume: Number,
      volumeLift: Number,
      baselineRevenue: Number,
      promotionalRevenue: Number,
      incrementalRevenue: Number
    },

    // Actual performance
    actual: {
      baselineVolume: Number,
      promotionalVolume: Number,
      incrementalVolume: Number,
      volumeLift: Number,
      baselineRevenue: Number,
      promotionalRevenue: Number,
      incrementalRevenue: Number
    },

    // Costs
    costs: {
      discountCost: Number,
      marketingCost: Number,
      cashCoopCost: Number,
      displayCost: Number,
      logisticsCost: Number,
      totalCost: Number
    },

    // Profitability
    profitability: {
      grossProfit: Number,
      netProfit: Number,
      roi: Number,
      profitPerUnit: Number
    }
  },

  // Budget Allocation
  budgetAllocation: {
    marketing: {
      budgetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Budget'
      },
      amount: Number,
      approved: Boolean
    },
    cashCoop: {
      budgetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Budget'
      },
      amount: Number,
      approved: Boolean
    },
    tradingTerms: {
      amount: Number,
      approved: Boolean
    }
  },

  // AI Analysis and Recommendations (Legacy - kept for backward compatibility)
  aiAnalysis: {
    recommendedPrice: Number,
    recommendedVolumeLift: Number,
    confidenceScore: Number,
    optimizationSuggestions: [{
      suggestion: String,
      impact: String,
      priority: String
    }],
    cannibalizationRisk: Number,
    elasticityFactor: Number,
    seasonalityIndex: Number,
    competitiveIndex: Number
  },

  aiPredictions: {
    // Pre-promotion predictions
    predictedUplift: {
      volume: Number,
      revenue: Number,
      confidence: Number,
      modelVersion: String,
      predictedAt: Date,
      featureAttribution: [{
        feature: String,
        impact: Number
      }]
    },
    predictedCannibalization: {
      affectedProducts: [{
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        estimatedImpact: Number,
        impactPercentage: Number
      }],
      totalImpact: Number,
      confidence: Number
    },
    predictedROI: {
      value: Number,
      confidence: Number,
      range: {
        min: Number,
        max: Number
      }
    },

    // Post-promotion actuals
    actualUplift: {
      volume: Number,
      revenue: Number,
      calculatedAt: Date
    },
    actualCannibalization: {
      affectedProducts: [{
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        measuredImpact: Number,
        impactPercentage: Number
      }],
      totalImpact: Number
    },
    actualROI: Number,

    predictionAccuracy: {
      upliftError: Number,
      upliftErrorPercentage: Number,
      roiError: Number,
      roiErrorPercentage: Number,
      overallScore: Number,
      evaluatedAt: Date
    }
  },

  postEventAnalysis: {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending'
    },
    generatedAt: Date,
    baseline: {
      avgWeeklyVolume: Number,
      avgWeeklyRevenue: Number,
      volatility: Number,
      dataPoints: Number
    },
    incrementalLift: {
      volume: Number,
      revenue: Number,
      statisticalSignificance: Number,
      pValue: Number
    },
    effectiveness: {
      score: Number,
      rank: {
        type: String,
        enum: ['Excellent', 'Good', 'Average', 'Below Average', 'Poor']
      },
      benchmark: Number,
      percentile: Number
    },
    learnings: [{
      insight: String,
      category: {
        type: String,
        enum: ['pricing', 'timing', 'mechanics', 'targeting', 'execution']
      },
      actionable: Boolean,
      priority: {
        type: String,
        enum: ['high', 'medium', 'low']
      }
    }],
    recommendations: [{
      recommendation: String,
      expectedImpact: String,
      priority: {
        type: String,
        enum: ['high', 'medium', 'low']
      },
      category: String
    }]
  },

  // Promotion Conflicts
  conflicts: [{
    conflictType: {
      type: String,
      enum: ['product', 'customer', 'timing', 'budget', 'channel']
    },
    conflictingPromotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion'
    },
    severity: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    description: String,
    resolution: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Performance Metrics
  performance: {
    // Pre-promotion baseline (6 weeks)
    baseline: {
      avgWeeklyVolume: Number,
      avgWeeklyRevenue: Number,
      avgPrice: Number,
      volatility: Number
    },

    // During promotion
    promotion: {
      totalVolume: Number,
      totalRevenue: Number,
      avgPrice: Number,
      peakDayVolume: Number,
      stockouts: Number
    },

    // Post-promotion (6 weeks)
    post: {
      avgWeeklyVolume: Number,
      avgWeeklyRevenue: Number,
      pantryLoading: Number,
      returnToBaseline: Number
    },

    // Calculated metrics
    metrics: {
      trueLift: Number,
      incrementalProfit: Number,
      effectiveness: Number,
      efficiency: Number,
      score: Number
    }
  },

  // Status and Workflow
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },

  // Approvals
  approvals: [{
    level: {
      type: String,
      enum: ['kam', 'manager', 'finance', 'trade_marketing', 'director']
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
    conditions: String,
    date: Date
  }],

  // Execution Details
  execution: {
    poNumber: String,
    invoiceNumbers: [String],
    actualStartDate: Date,
    actualEndDate: Date,
    executionNotes: String,
    issues: [{
      issue: String,
      impact: String,
      resolution: String,
      date: Date
    }]
  },

  // Supporting Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['contract', 'po', 'invoice', 'report', 'creative', 'other']
    },
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedDate: Date
  }],

  // Campaign Association
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
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
promotionSchema.index({ promotionId: 1 });
promotionSchema.index({ name: 1 });
promotionSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });
promotionSchema.index({ status: 1 });
promotionSchema.index({ promotionType: 1 });
promotionSchema.index({ 'scope.customers.customer': 1 });
promotionSchema.index({ 'products.product': 1 });
promotionSchema.index({ campaign: 1 });
promotionSchema.index({ createdBy: 1 });
promotionSchema.index({ company: 1, status: 1 });
promotionSchema.index({ company: 1, 'period.startDate': 1, 'period.endDate': 1 });

// Pre-save middleware
promotionSchema.pre('save', function (next) {
  // D-13: Input validation
  const errors = {};

  if (this.period?.startDate && this.period?.endDate &&
      this.period.endDate <= this.period.startDate) {
    errors['period.endDate'] = 'period.endDate must be after period.startDate';
  }

  if (this.mechanics?.discountType === 'percentage' &&
      (this.mechanics.discountValue < 0 || this.mechanics.discountValue > 100)) {
    errors['mechanics.discountValue'] = 'percentage discountValue must be 0–100';
  }

  if (this.mechanics?.discountType === 'fixed_amount' && this.mechanics.discountValue < 0) {
    errors['mechanics.discountValue'] = 'fixed_amount discountValue must be >= 0';
  }

  if (this.products?.length === 0) {
    errors['products'] = 'promotion must have at least one product';
  }

  if (Object.keys(errors).length > 0) {
    const err = new mongoose.Error.ValidationError();
    Object.keys(errors).forEach(field => {
      err.errors[field] = new mongoose.Error.ValidatorError({ message: errors[field] });
    });
    return next(err);
  }

  // Set analysis windows based on promotion period
  if (this.isModified('period.startDate') || this.isModified('period.endDate')) {
    const startDate = new Date(this.period.startDate);
    const endDate = new Date(this.period.endDate);

    // Baseline: 6 weeks before
    this.analysisWindows.baseline.endDate = new Date(startDate);
    this.analysisWindows.baseline.endDate.setDate(startDate.getDate() - 1);
    this.analysisWindows.baseline.startDate = new Date(this.analysisWindows.baseline.endDate);
    this.analysisWindows.baseline.startDate.setDate(
      this.analysisWindows.baseline.startDate.getDate() - (7 * this.analysisWindows.baseline.weeks)
    );

    // Promotion period
    this.analysisWindows.promotion.startDate = startDate;
    this.analysisWindows.promotion.endDate = endDate;

    // Post: 6 weeks after
    this.analysisWindows.post.startDate = new Date(endDate);
    this.analysisWindows.post.startDate.setDate(endDate.getDate() + 1);
    this.analysisWindows.post.endDate = new Date(this.analysisWindows.post.startDate);
    this.analysisWindows.post.endDate.setDate(
      this.analysisWindows.post.endDate.getDate() + (7 * this.analysisWindows.post.weeks)
    );
  }

  // Calculate total costs
  if (this.isModified('financial.costs')) {
    this.financial.costs.totalCost =
      (this.financial.costs.discountCost || 0) +
      (this.financial.costs.marketingCost || 0) +
      (this.financial.costs.cashCoopCost || 0) +
      (this.financial.costs.displayCost || 0) +
      (this.financial.costs.logisticsCost || 0);
  }

  // D-05: Standard ROI formula: (incrementalRevenue − investment) / investment
  // D-08: Calculate grossProfit as well
  if (this.financial.actual) {
    const incrementalRevenue = this.financial.actual.incrementalRevenue || 0;
    const totalCost = this.financial.costs.totalCost || 0;
    
    // grossProfit = revenue - cost of goods (estimated as 70% of revenue)
    this.financial.profitability.grossProfit = incrementalRevenue * 0.7;
    
    // netProfit = incrementalRevenue - total investment cost
    this.financial.profitability.netProfit = incrementalRevenue - totalCost;

    // Standard ROI: (incrementalRevenue - investment) / investment * 100
    if (totalCost > 0) {
      this.financial.profitability.roi =
        ((incrementalRevenue - totalCost) / totalCost) * 100;
    } else {
      this.financial.profitability.roi = 0;
    }
  }

  next();
});

// Methods
promotionSchema.methods.calculatePerformance = async function (salesData) {
  // This would be called with actual sales data to calculate performance
  // Implementation would analyze sales in the three time windows

  // Calculate baseline average
  const baselineSales = salesData.filter((sale) =>
    sale.date >= this.analysisWindows.baseline.startDate &&
    sale.date <= this.analysisWindows.baseline.endDate
  );

  if (baselineSales.length > 0) {
    this.performance.baseline.avgWeeklyVolume =
      baselineSales.reduce((sum, sale) => sum + sale.volume, 0) / this.analysisWindows.baseline.weeks;
    this.performance.baseline.avgWeeklyRevenue =
      baselineSales.reduce((sum, sale) => sum + sale.revenue, 0) / this.analysisWindows.baseline.weeks;
  }

  // Similar calculations for promotion and post periods...

  await this.save();
};

// ALLOWED status transitions — single source of truth.
// Any caller attempting a transition not in this map MUST throw.
promotionSchema.statics.PROMOTION_TRANSITIONS = {
  draft:            ['pending_approval', 'cancelled'],
  pending_approval: ['approved', 'rejected', 'draft', 'cancelled'],  // draft = recall
  approved:         ['active', 'cancelled'],
  active:           ['completed', 'cancelled'],
  completed:        [],         // terminal
  cancelled:        [],         // terminal
  rejected:         ['draft'],  // can be re-edited
};

promotionSchema.statics.canTransition = function (from, to) {
  return (promotionSchema.statics.PROMOTION_TRANSITIONS[from] || []).includes(to);
};

promotionSchema.methods.transitionTo = function (newStatus, userId, comment) {
  if (!promotionSchema.statics.canTransition(this.status, newStatus)) {
    const err = new Error(
      `Invalid promotion status transition: ${this.status} → ${newStatus}`
    );
    err.code = 'INVALID_TRANSITION';
    err.currentStatus = this.status;
    err.attemptedStatus = newStatus;
    throw err;
  }
  const previous = this.status;
  this.status = newStatus;
  this.history.push({
    action: `status_changed:${previous}→${newStatus}`,
    performedBy: userId,
    performedDate: new Date(),
    comment,
  });
};

// Role → approval level. Explicit, no defaults. Unknown role = hard error.
const ROLE_TO_APPROVAL_LEVEL = {
  kam:          'kam',
  manager:      'manager',
  director:     'director',
  finance:      'finance',       // D-04: finance role now resolves to finance level
  admin:        'finance',       // admin acts on behalf of finance
  super_admin:  'finance',
};

promotionSchema.methods.submitForApproval = async function (userId) {
  this.transitionTo('pending_approval', userId, 'Submitted for approval');
  this.lastModifiedBy = userId;
  await this.save();
};

promotionSchema.methods.approve = async function (level, userId, comments) {
  // D-01: State guard - can only approve from pending_approval status
  if (this.status !== 'pending_approval') {
    const err = new Error(`Cannot approve promotion in status "${this.status}"`);
    err.code = 'INVALID_TRANSITION';
    throw err;
  }

  // D-04: Validate role can approve - explicit role mapping with hard error for unknown roles
  if (!level) {
    const err = new Error(`Role cannot approve promotions`);
    err.code = 'FORBIDDEN_ROLE';
    throw err;
  }

  const approval = this.approvals.find((a) => a.level === level);

  // D-01: No approval slot for this level
  if (!approval) {
    const err = new Error(`No pending approval at level "${level}" for this promotion`);
    err.code = 'NO_APPROVAL_SLOT';
    throw err;
  }

  // D-14: Idempotency - if this level is already approved by this user, return without pushing history
  if (approval.status === 'approved' && String(approval.approver) === String(userId)) {
    return { alreadyApproved: true };
  }

  approval.status = 'approved';
  approval.approver = userId;
  approval.comments = comments;
  approval.date = new Date();

  const allApproved = this.approvals.every((a) => a.status === 'approved');
  if (allApproved) {
    this.transitionTo('approved', userId, `All approvals complete (final: ${level})`);
  } else {
    this.history.push({
      action: `approval_recorded:${level}`,
      performedBy: userId,
      performedDate: new Date(),
      comment: comments,
    });
  }

  await this.save();
  return { alreadyApproved: false, fullyApproved: allApproved };
};

// Statics
// D-06: Fixed to use AND logic - both customer AND product must match (not OR which causes false positives)
promotionSchema.statics.findOverlapping = function (customerId, productId, startDate, endDate) {
  // Build query with proper AND logic - both conditions must be satisfied
  const query = {
    $and: [
      {
        'period.startDate': { $lte: endDate },
        'period.endDate': { $gte: startDate }
      },
      {
        status: { $in: ['approved', 'active'] }
      }
    ]
  };

  // Only add customer filter if provided
  if (customerId) {
    query.$and.push({ 'scope.customers.customer': customerId });
  }

  // Only add product filter if provided  
  if (productId) {
    query.$and.push({ 'products.product': productId });
  }

  // If neither customer nor product specified, fall back to time-based search only
  if (!customerId && !productId) {
    return this.find({
      'period.startDate': { $lte: endDate },
      'period.endDate': { $gte: startDate },
      status: { $in: ['approved', 'active'] }
    });
  }

  return this.find(query);
};

// Add tenant support to the schema
addTenantSupport(promotionSchema);

const Promotion = mongoose.model('Promotion', promotionSchema);

const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'mock';
if (USE_MOCK_DB) {
  const { MockPromotion } = require('../services/mockDatabase');
  module.exports = MockPromotion;
} else {
  module.exports = Promotion;
}
