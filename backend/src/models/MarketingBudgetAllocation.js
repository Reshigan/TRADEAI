const mongoose = require('mongoose');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

const marketingBudgetAllocationSchema = new mongoose.Schema({
  // Company Association - CRITICAL for multi-tenant isolation
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Budget Reference
  parentBudget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
    required: true
  },

  // Allocation Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  allocationCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },

  // Allocation Type and Level
  allocationType: {
    type: String,
    required: true,
    enum: ['brand_based', 'customer_based', 'channel_based', 'product_based', 'region_based', 'campaign_based', 'mixed']
  },

  allocationLevel: {
    type: String,
    required: true,
    enum: ['strategic', 'tactical', 'operational']
  },

  // Allocation Targets
  targets: {
    // Brand-based allocation
    brands: [{
      brand: {
        name: String,
        code: String
      },
      allocation: {
        percentage: Number,
        fixedAmount: Number,
        priority: {
          type: String,
          enum: ['high', 'medium', 'low']
        }
      },
      rationale: String,
      kpis: [String]
    }],

    // Customer-based allocation
    customers: [{
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
      },
      customerTier: {
        type: String,
        enum: ['platinum', 'gold', 'silver', 'bronze']
      },
      allocation: {
        percentage: Number,
        fixedAmount: Number,
        priority: {
          type: String,
          enum: ['high', 'medium', 'low']
        }
      },
      rationale: String,
      expectedROI: Number
    }],

    // Channel-based allocation
    channels: [{
      channel: {
        type: String,
        enum: ['modern_trade', 'traditional_trade', 'ecommerce', 'horeca', 'b2b']
      },
      allocation: {
        percentage: Number,
        fixedAmount: Number,
        priority: {
          type: String,
          enum: ['high', 'medium', 'low']
        }
      },
      rationale: String,
      targetMetrics: mongoose.Schema.Types.Mixed
    }],

    // Product-based allocation
    products: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      productCategory: String,
      allocation: {
        percentage: Number,
        fixedAmount: Number,
        priority: {
          type: String,
          enum: ['high', 'medium', 'low']
        }
      },
      rationale: String,
      launchSupport: Boolean
    }],

    // Region-based allocation
    regions: [{
      region: String,
      allocation: {
        percentage: Number,
        fixedAmount: Number,
        priority: {
          type: String,
          enum: ['high', 'medium', 'low']
        }
      },
      rationale: String,
      marketPotential: Number
    }]
  },

  // Allocation Method
  allocationMethod: {
    primaryMethod: {
      type: String,
      required: true,
      enum: ['volume_based', 'revenue_based', 'profit_based', 'strategic_priority', 'historical_performance', 'market_potential', 'custom_formula']
    },

    // Volume-based allocation
    volumeAllocation: {
      basePeriod: {
        startDate: Date,
        endDate: Date
      },
      volumeMetric: {
        type: String,
        enum: ['units_sold', 'cases_sold', 'tonnage', 'transactions']
      },
      minimumThreshold: Number,
      weightingFactor: Number
    },

    // Revenue-based allocation
    revenueAllocation: {
      basePeriod: {
        startDate: Date,
        endDate: Date
      },
      revenueMetric: {
        type: String,
        enum: ['gross_revenue', 'net_revenue', 'contribution_margin']
      },
      minimumThreshold: Number,
      weightingFactor: Number
    },

    // Profit-based allocation
    profitAllocation: {
      basePeriod: {
        startDate: Date,
        endDate: Date
      },
      profitMetric: {
        type: String,
        enum: ['gross_profit', 'net_profit', 'contribution_margin', 'ebitda']
      },
      minimumThreshold: Number,
      weightingFactor: Number
    },

    // Custom formula
    customFormula: {
      formula: String, // Mathematical formula
      variables: [{
        name: String,
        description: String,
        dataSource: String,
        weight: Number
      }],
      calculationMethod: String
    },

    // Adjustment factors
    adjustmentFactors: [{
      factor: String,
      type: {
        type: String,
        enum: ['multiplier', 'additive', 'percentage']
      },
      value: Number,
      condition: String,
      rationale: String
    }]
  },

  // Budget Distribution
  budgetDistribution: {
    totalBudget: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'AUD'
    },

    // Calculated allocations
    calculatedAllocations: [{
      targetId: String, // Reference to brand, customer, channel, etc.
      targetType: String,
      targetName: String,

      // Allocation amounts
      baseAllocation: Number,
      adjustedAllocation: Number,
      finalAllocation: Number,
      percentage: Number,

      // Calculation details
      calculationBasis: {
        volume: Number,
        revenue: Number,
        profit: Number,
        historicalSpend: Number,
        strategicWeight: Number
      },

      // Performance expectations
      expectedOutcomes: {
        volumeTarget: Number,
        revenueTarget: Number,
        profitTarget: Number,
        roiTarget: Number,
        marketShareTarget: Number
      }
    }],

    // Reserve and contingency
    reserves: {
      contingencyReserve: {
        amount: Number,
        percentage: Number,
        purpose: String
      },
      opportunityReserve: {
        amount: Number,
        percentage: Number,
        purpose: String
      },
      adjustmentReserve: {
        amount: Number,
        percentage: Number,
        purpose: String
      }
    }
  },

  // Proportional Allocation Rules
  proportionalRules: {
    // Volume-based proportions
    volumeProportions: {
      enabled: Boolean,
      basePeriod: {
        startDate: Date,
        endDate: Date
      },
      minimumAllocation: Number,
      maximumAllocation: Number,
      smoothingFactor: Number // To avoid extreme allocations
    },

    // Revenue-based proportions
    revenueProportions: {
      enabled: Boolean,
      basePeriod: {
        startDate: Date,
        endDate: Date
      },
      minimumAllocation: Number,
      maximumAllocation: Number,
      smoothingFactor: Number
    },

    // Growth-based adjustments
    growthAdjustments: {
      enabled: Boolean,
      growthPeriod: {
        startDate: Date,
        endDate: Date
      },
      growthThreshold: Number,
      bonusAllocation: Number,
      penaltyReduction: Number
    },

    // Strategic overrides
    strategicOverrides: [{
      targetId: String,
      targetType: String,
      overrideType: {
        type: String,
        enum: ['minimum_guarantee', 'maximum_cap', 'fixed_amount', 'priority_boost']
      },
      value: Number,
      rationale: String,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },

  // Performance Tracking
  performance: {
    // Actual spend tracking
    actualSpend: [{
      targetId: String,
      targetType: String,
      targetName: String,

      spendToDate: Number,
      remainingBudget: Number,
      utilizationRate: Number,

      // Performance metrics
      actualVolume: Number,
      actualRevenue: Number,
      actualProfit: Number,
      actualROI: Number,

      // Variance analysis
      budgetVariance: Number,
      volumeVariance: Number,
      revenueVariance: Number,
      profitVariance: Number,

      lastUpdated: Date
    }],

    // Overall performance
    overallPerformance: {
      totalSpent: Number,
      totalRemaining: Number,
      averageUtilization: Number,
      averageROI: Number,

      // Variance summary
      budgetVarianceTotal: Number,
      performanceVarianceTotal: Number,

      // Efficiency metrics
      costPerUnit: Number,
      costPerRevenue: Number,
      efficiencyScore: Number,

      lastCalculated: Date
    }
  },

  // Reallocation History
  reallocationHistory: [{
    date: Date,
    reason: String,

    // Changes made
    changes: [{
      targetId: String,
      targetType: String,
      targetName: String,

      previousAllocation: Number,
      newAllocation: Number,
      changeAmount: Number,
      changePercentage: Number,

      rationale: String
    }],

    // Approval
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvalDate: Date,

    // Impact assessment
    expectedImpact: String,
    actualImpact: String
  }],

  // Validity Period
  validityPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    fiscalYear: String,
    quarter: String,
    isActive: {
      type: Boolean,
      default: true
    }
  },

  // Approval Workflow
  approvalWorkflow: {
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'revision_required'],
      default: 'draft'
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String,
    revisionNotes: String
  },

  // Integration Data
  integrationData: {
    sapBudgetId: String,
    erpReference: String,
    externalSystemId: String,
    lastSyncAt: Date
  },

  // Status and Metadata
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
marketingBudgetAllocationSchema.index({ company: 1, allocationCode: 1 }, { unique: true });
marketingBudgetAllocationSchema.index({ company: 1, parentBudget: 1 });
marketingBudgetAllocationSchema.index({ company: 1, allocationType: 1 });
marketingBudgetAllocationSchema.index({ company: 1, 'approvalWorkflow.status': 1 });
marketingBudgetAllocationSchema.index({ company: 1, 'validityPeriod.startDate': 1, 'validityPeriod.endDate': 1 });
marketingBudgetAllocationSchema.index({ company: 1, isActive: 1 });

// Compound indexes for complex queries
marketingBudgetAllocationSchema.index({
  company: 1,
  allocationType: 1,
  'approvalWorkflow.status': 1,
  'validityPeriod.startDate': 1
});

// Virtual for total allocated amount
marketingBudgetAllocationSchema.virtual('totalAllocated').get(function () {
  if (!this.budgetDistribution.calculatedAllocations) return 0;
  return this.budgetDistribution.calculatedAllocations.reduce((sum, allocation) => sum + allocation.finalAllocation, 0);
});

// Virtual for allocation utilization
marketingBudgetAllocationSchema.virtual('utilizationRate').get(function () {
  const totalBudget = this.budgetDistribution.totalBudget;
  const totalSpent = this.performance.overallPerformance?.totalSpent || 0;
  return totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
});

// Virtual for remaining budget
marketingBudgetAllocationSchema.virtual('remainingBudget').get(function () {
  const totalBudget = this.budgetDistribution.totalBudget;
  const totalSpent = this.performance.overallPerformance?.totalSpent || 0;
  return totalBudget - totalSpent;
});

// Virtual for performance status
marketingBudgetAllocationSchema.virtual('performanceStatus').get(function () {
  const utilization = this.utilizationRate;
  const roi = this.performance.overallPerformance?.averageROI || 0;

  if (utilization > 90 && roi > 150) return 'excellent';
  if (utilization > 70 && roi > 100) return 'good';
  if (utilization > 50 && roi > 50) return 'fair';
  return 'poor';
});

// Method to calculate allocations based on method
marketingBudgetAllocationSchema.methods.calculateAllocations = async function () {
  const method = this.allocationMethod.primaryMethod;
  const totalBudget = this.budgetDistribution.totalBudget;

  // Get base data for calculations
  let baseData = [];

  switch (method) {
    case 'volume_based':
      baseData = await this.getVolumeData();
      break;
    case 'revenue_based':
      baseData = await this.getRevenueData();
      break;
    case 'profit_based':
      baseData = await this.getProfitData();
      break;
    default:
      baseData = await this.getHistoricalData();
  }

  // Calculate proportional allocations
  const totalBase = baseData.reduce((sum, item) => sum + item.value, 0);
  const allocations = [];

  for (const item of baseData) {
    const basePercentage = totalBase > 0 ? (item.value / totalBase) * 100 : 0;
    const baseAllocation = (basePercentage / 100) * totalBudget;

    // Apply adjustment factors
    let adjustedAllocation = baseAllocation;
    for (const factor of this.allocationMethod.adjustmentFactors || []) {
      if (this.shouldApplyFactor(factor, item)) {
        adjustedAllocation = this.applyAdjustmentFactor(adjustedAllocation, factor);
      }
    }

    // Apply proportional rules
    const finalAllocation = this.applyProportionalRules(adjustedAllocation, item);

    allocations.push({
      targetId: item.id,
      targetType: item.type,
      targetName: item.name,
      baseAllocation,
      adjustedAllocation,
      finalAllocation,
      percentage: (finalAllocation / totalBudget) * 100,
      calculationBasis: item.basis
    });
  }

  this.budgetDistribution.calculatedAllocations = allocations;
  return this.save();
};

// Method to update performance metrics
marketingBudgetAllocationSchema.methods.updatePerformance = function (targetId, metrics) {
  let targetPerformance = this.performance.actualSpend.find((p) => p.targetId === targetId);

  if (!targetPerformance) {
    targetPerformance = {
      targetId,
      targetType: metrics.targetType,
      targetName: metrics.targetName,
      spendToDate: 0,
      remainingBudget: 0,
      utilizationRate: 0
    };
    this.performance.actualSpend.push(targetPerformance);
  }

  // Update metrics
  Object.assign(targetPerformance, metrics, { lastUpdated: new Date() });

  // Calculate derived metrics
  const allocation = this.budgetDistribution.calculatedAllocations.find((a) => a.targetId === targetId);
  if (allocation) {
    targetPerformance.remainingBudget = allocation.finalAllocation - targetPerformance.spendToDate;
    targetPerformance.utilizationRate = (targetPerformance.spendToDate / allocation.finalAllocation) * 100;

    // Calculate variances
    targetPerformance.budgetVariance = targetPerformance.spendToDate - allocation.finalAllocation;
    if (allocation.expectedOutcomes) {
      targetPerformance.volumeVariance = (targetPerformance.actualVolume || 0) - (allocation.expectedOutcomes.volumeTarget || 0);
      targetPerformance.revenueVariance = (targetPerformance.actualRevenue || 0) - (allocation.expectedOutcomes.revenueTarget || 0);
      targetPerformance.profitVariance = (targetPerformance.actualProfit || 0) - (allocation.expectedOutcomes.profitTarget || 0);
    }
  }

  // Update overall performance
  this.calculateOverallPerformance();

  return this.save();
};

// Method to calculate overall performance
marketingBudgetAllocationSchema.methods.calculateOverallPerformance = function () {
  const actualSpend = this.performance.actualSpend || [];

  if (actualSpend.length === 0) return;

  const totalSpent = actualSpend.reduce((sum, spend) => sum + spend.spendToDate, 0);
  const totalRemaining = this.budgetDistribution.totalBudget - totalSpent;
  const averageUtilization = actualSpend.reduce((sum, spend) => sum + spend.utilizationRate, 0) / actualSpend.length;

  // Calculate average ROI
  const rois = actualSpend.filter((spend) => spend.actualROI > 0).map((spend) => spend.actualROI);
  const averageROI = rois.length > 0 ? rois.reduce((sum, roi) => sum + roi, 0) / rois.length : 0;

  // Calculate variances
  const budgetVarianceTotal = actualSpend.reduce((sum, spend) => sum + (spend.budgetVariance || 0), 0);
  const performanceVarianceTotal = actualSpend.reduce((sum, spend) => sum + (spend.revenueVariance || 0), 0);

  // Calculate efficiency metrics
  const totalVolume = actualSpend.reduce((sum, spend) => sum + (spend.actualVolume || 0), 0);
  const totalRevenue = actualSpend.reduce((sum, spend) => sum + (spend.actualRevenue || 0), 0);

  const costPerUnit = totalVolume > 0 ? totalSpent / totalVolume : 0;
  const costPerRevenue = totalRevenue > 0 ? (totalSpent / totalRevenue) * 100 : 0;

  // Calculate efficiency score (0-100)
  const efficiencyScore = Math.min(100, Math.max(0,
    (averageROI / 2) + // ROI component (max 50 points)
    (Math.max(0, 100 - costPerRevenue) / 2) // Cost efficiency component (max 50 points)
  ));

  this.performance.overallPerformance = {
    totalSpent,
    totalRemaining,
    averageUtilization,
    averageROI,
    budgetVarianceTotal,
    performanceVarianceTotal,
    costPerUnit,
    costPerRevenue,
    efficiencyScore,
    lastCalculated: new Date()
  };
};

// Method to reallocate budget
marketingBudgetAllocationSchema.methods.reallocateBudget = function (changes, reason, requestedBy) {
  const reallocation = {
    date: new Date(),
    reason,
    changes: [],
    requestedBy
  };

  for (const change of changes) {
    const allocation = this.budgetDistribution.calculatedAllocations.find((a) => a.targetId === change.targetId);
    if (allocation) {
      reallocation.changes.push({
        targetId: change.targetId,
        targetType: allocation.targetType,
        targetName: allocation.targetName,
        previousAllocation: allocation.finalAllocation,
        newAllocation: change.newAllocation,
        changeAmount: change.newAllocation - allocation.finalAllocation,
        changePercentage: ((change.newAllocation - allocation.finalAllocation) / allocation.finalAllocation) * 100,
        rationale: change.rationale
      });

      // Update allocation
      allocation.finalAllocation = change.newAllocation;
      allocation.percentage = (change.newAllocation / this.budgetDistribution.totalBudget) * 100;
    }
  }

  this.reallocationHistory.push(reallocation);
  return this.save();
};

// Static method to get allocation summary for company
marketingBudgetAllocationSchema.statics.getAllocationSummary = function (companyId, fiscalYear) {
  const matchStage = { company: companyId };
  if (fiscalYear) matchStage['validityPeriod.fiscalYear'] = fiscalYear;

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$allocationType',
        totalBudget: { $sum: '$budgetDistribution.totalBudget' },
        totalSpent: { $sum: '$performance.overallPerformance.totalSpent' },
        averageROI: { $avg: '$performance.overallPerformance.averageROI' },
        allocationCount: { $sum: 1 }
      }
    }
  ]);
};

// Helper methods for data retrieval (to be implemented based on specific requirements)
marketingBudgetAllocationSchema.methods.getVolumeData = function () {
  // Implementation would query SalesHistory collection
  return [];
};

marketingBudgetAllocationSchema.methods.getRevenueData = function () {
  // Implementation would query SalesHistory collection
  return [];
};

marketingBudgetAllocationSchema.methods.getProfitData = function () {
  // Implementation would query SalesHistory and calculate profits
  return [];
};

marketingBudgetAllocationSchema.methods.getHistoricalData = function () {
  // Implementation would query historical spend data
  return [];
};

marketingBudgetAllocationSchema.methods.shouldApplyFactor = function (factor, item) {
  // Implementation would evaluate factor conditions
  return true;
};

marketingBudgetAllocationSchema.methods.applyAdjustmentFactor = function (allocation, factor) {
  switch (factor.type) {
    case 'multiplier':
      return allocation * factor.value;
    case 'additive':
      return allocation + factor.value;
    case 'percentage':
      return allocation * (1 + factor.value / 100);
    default:
      return allocation;
  }
};

marketingBudgetAllocationSchema.methods.applyProportionalRules = function (allocation, _item) {
  // Apply minimum and maximum constraints
  const rules = this.proportionalRules;

  if (rules.volumeProportions?.enabled) {
    if (rules.volumeProportions.minimumAllocation) {
      allocation = Math.max(allocation, rules.volumeProportions.minimumAllocation);
    }
    if (rules.volumeProportions.maximumAllocation) {
      allocation = Math.min(allocation, rules.volumeProportions.maximumAllocation);
    }
  }

  return allocation;
};

// Add pagination plugin
marketingBudgetAllocationSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model('MarketingBudgetAllocation', marketingBudgetAllocationSchema);
