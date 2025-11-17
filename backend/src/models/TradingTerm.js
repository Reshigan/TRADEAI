const mongoose = require('mongoose');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');

const tradingTermSchema = new mongoose.Schema({
  // Company Association - CRITICAL for multi-tenant isolation
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  description: String,

  // Term Type
  termType: {
    type: String,
    required: true,
    enum: [
      'volume_discount',      // Volume-based discounts
      'early_payment',        // Early payment discounts
      'prompt_payment',       // Prompt payment terms
      'rebate',              // Volume rebates
      'listing_fee',         // Listing fees
      'promotional_support', // Promotional support terms
      'marketing_contribution', // Marketing fund contributions
      'settlement_discount', // Settlement discounts
      'cash_discount',       // Cash discounts
      'quantity_discount',   // Quantity-based discounts
      'loyalty_bonus',       // Loyalty bonuses
      'growth_incentive'     // Growth incentives
    ]
  },

  // Applicability
  applicability: {
    customers: [{
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
      },
      customerTier: {
        type: String,
        enum: ['platinum', 'gold', 'silver', 'bronze', 'all']
      },
      customerType: {
        type: String,
        enum: ['chain', 'independent', 'wholesaler', 'distributor', 'online', 'all']
      }
    }],
    products: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      productCategory: String,
      brand: String,
      hierarchy: {
        level1: String,
        level2: String,
        level3: String
      }
    }],
    channels: [{
      type: String,
      enum: ['modern_trade', 'traditional_trade', 'ecommerce', 'horeca', 'b2b', 'all']
    }],
    regions: [String],
    minimumOrderValue: Number,
    minimumVolume: Number
  },

  // Term Structure
  termStructure: {
    // Volume-based tiers
    volumeTiers: [{
      minVolume: Number,
      maxVolume: Number,
      discountType: {
        type: String,
        enum: ['percentage', 'fixed_amount', 'unit_discount']
      },
      discountValue: Number,
      rebatePercentage: Number
    }],

    // Payment terms
    paymentTerms: {
      standardDays: Number,
      earlyPaymentDays: Number,
      earlyPaymentDiscount: Number,
      latePaymentPenalty: Number
    },

    // Promotional terms
    promotionalTerms: {
      supportPercentage: Number,
      maxSupportAmount: Number,
      coopAdvertisingRate: Number,
      listingFeeAmount: Number,
      slottingFeeAmount: Number
    },

    // Growth incentives
    growthIncentives: {
      baselineVolume: Number,
      growthThreshold: Number,
      incentiveRate: Number,
      maxIncentiveAmount: Number,
      measurementPeriod: {
        type: String,
        enum: ['monthly', 'quarterly', 'annually']
      }
    }
  },

  // Financial Impact
  financialImpact: {
    estimatedAnnualValue: Number,
    costToCompany: Number,
    expectedROI: Number,
    breakEvenVolume: Number,
    marginImpact: Number
  },

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
    autoRenewal: {
      type: Boolean,
      default: false
    },
    renewalPeriod: {
      type: String,
      enum: ['monthly', 'quarterly', 'annually']
    }
  },

  // Approval Workflow
  approvalWorkflow: {
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'expired', 'suspended'],
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
    approvalNotes: String
  },

  // Performance Tracking
  performance: {
    actualVolume: Number,
    actualRevenue: Number,
    actualCost: Number,
    actualROI: Number,
    utilizationRate: Number,
    customerAdoption: Number,
    lastCalculatedAt: Date
  },

  // Conditions and Restrictions
  conditions: {
    minimumCommitment: {
      volume: Number,
      value: Number,
      period: String
    },
    exclusivityRequired: Boolean,
    competitorRestrictions: [String],
    geographicRestrictions: [String],
    seasonalRestrictions: [{
      startMonth: Number,
      endMonth: Number,
      restriction: String
    }]
  },

  // Audit Trail
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'approved', 'rejected', 'activated', 'suspended', 'expired']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    changes: mongoose.Schema.Types.Mixed,
    notes: String
  }],

  // Integration Data
  integrationData: {
    sapTermId: String,
    erpReference: String,
    externalSystemId: String,
    lastSyncAt: Date
  },

  // Status and Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
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
tradingTermSchema.index({ company: 1, code: 1 }, { unique: true });
tradingTermSchema.index({ company: 1, termType: 1 });
tradingTermSchema.index({ company: 1, 'approvalWorkflow.status': 1 });
tradingTermSchema.index({ company: 1, 'validityPeriod.startDate': 1, 'validityPeriod.endDate': 1 });
tradingTermSchema.index({ company: 1, isActive: 1 });
tradingTermSchema.index({ company: 1, priority: 1 });
tradingTermSchema.index({ 'applicability.customers.customer': 1 });
tradingTermSchema.index({ 'applicability.products.product': 1 });

// Compound indexes for complex queries
tradingTermSchema.index({
  company: 1,
  termType: 1,
  'approvalWorkflow.status': 1,
  'validityPeriod.startDate': 1
});

// Virtual for active status
tradingTermSchema.virtual('isCurrentlyActive').get(function () {
  const now = new Date();
  return this.isActive &&
         this.approvalWorkflow.status === 'approved' &&
         this.validityPeriod.startDate <= now &&
         this.validityPeriod.endDate >= now;
});

// Virtual for days until expiry
tradingTermSchema.virtual('daysUntilExpiry').get(function () {
  const now = new Date();
  const expiry = new Date(this.validityPeriod.endDate);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for performance summary
tradingTermSchema.virtual('performanceSummary').get(function () {
  return {
    roi: this.performance.actualROI || 0,
    utilization: this.performance.utilizationRate || 0,
    volume: this.performance.actualVolume || 0,
    revenue: this.performance.actualRevenue || 0,
    cost: this.performance.actualCost || 0
  };
});

// Method to check if term applies to specific customer/product combination
tradingTermSchema.methods.appliesTo = function (customerId, productId, orderValue, volume) {
  // Check customer applicability
  const customerApplies = this.applicability.customers.some((c) =>
    c.customer?.toString() === customerId?.toString() ||
    c.customerTier === 'all' ||
    c.customerType === 'all'
  );

  // Check product applicability
  const productApplies = this.applicability.products.length === 0 ||
    this.applicability.products.some((p) =>
      p.product?.toString() === productId?.toString()
    );

  // Check minimum order value
  const orderValueMet = !this.applicability.minimumOrderValue ||
    orderValue >= this.applicability.minimumOrderValue;

  // Check minimum volume
  const volumeMet = !this.applicability.minimumVolume ||
    volume >= this.applicability.minimumVolume;

  return customerApplies && productApplies && orderValueMet && volumeMet;
};

// Method to calculate discount for given volume/value
tradingTermSchema.methods.calculateDiscount = function (volume, value) {
  if (!this.termStructure.volumeTiers || this.termStructure.volumeTiers.length === 0) {
    return { discount: 0, rebate: 0, tier: null };
  }

  // Find applicable tier
  const applicableTier = this.termStructure.volumeTiers.find((tier) =>
    volume >= (tier.minVolume || 0) &&
    (!tier.maxVolume || volume <= tier.maxVolume)
  );

  if (!applicableTier) {
    return { discount: 0, rebate: 0, tier: null };
  }

  let discount = 0;
  if (applicableTier.discountType === 'percentage') {
    discount = value * (applicableTier.discountValue / 100);
  } else if (applicableTier.discountType === 'fixed_amount') {
    discount = applicableTier.discountValue;
  } else if (applicableTier.discountType === 'unit_discount') {
    discount = volume * applicableTier.discountValue;
  }

  const rebate = value * (applicableTier.rebatePercentage / 100 || 0);

  return { discount, rebate, tier: applicableTier };
};

// Method to update performance metrics
tradingTermSchema.methods.updatePerformance = async function (volume, revenue, cost) {
  this.performance.actualVolume = (this.performance.actualVolume || 0) + volume;
  this.performance.actualRevenue = (this.performance.actualRevenue || 0) + revenue;
  this.performance.actualCost = (this.performance.actualCost || 0) + cost;

  if (this.performance.actualCost > 0) {
    this.performance.actualROI = ((this.performance.actualRevenue - this.performance.actualCost) / this.performance.actualCost) * 100;
  }

  this.performance.lastCalculatedAt = new Date();
  return this.save();
};

// Static method to find applicable terms for customer/product
tradingTermSchema.statics.findApplicableTerms = function (companyId, customerId, _productId, orderValue, volume) {
  const now = new Date();

  return this.find({
    company: companyId,
    isActive: true,
    'approvalWorkflow.status': 'approved',
    'validityPeriod.startDate': { $lte: now },
    'validityPeriod.endDate': { $gte: now },
    $or: [
      { 'applicability.customers.customer': customerId },
      { 'applicability.customers.customerTier': 'all' },
      { 'applicability.customers.customerType': 'all' },
      { 'applicability.customers': { $size: 0 } }
    ]
  }).populate('applicability.customers.customer applicability.products.product');
};

// Pre-save middleware
tradingTermSchema.pre('save', function (next) {
  if (this.isNew) {
    this.auditTrail.push({
      action: 'created',
      performedBy: this.createdBy,
      performedAt: new Date(),
      notes: 'Trading term created'
    });
  }
  next();
});

// Add pagination plugin
tradingTermSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model('TradingTerm', tradingTermSchema);
