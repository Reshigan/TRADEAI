const mongoose = require('mongoose');

const rebateTierSchema = new mongoose.Schema({
  threshold: { type: Number, required: true },
  rate: { type: Number, required: true },
  cap: Number
});

const rebateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['volume', 'growth', 'early-payment', 'slotting', 'coop', 'off-invoice', 'billback', 'display']
  },
  description: String,
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'expired'],
    default: 'draft'
  },

  // Eligibility
  eligibleCustomers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],
  eligibleProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  customerTypes: [String],
  territories: [String],

  // Calculation settings
  calculationType: {
    type: String,
    enum: ['percentage', 'fixed-amount', 'tiered'],
    default: 'percentage'
  },
  rate: Number,  // For simple percentage
  amount: Number,  // For fixed amount
  tiers: [rebateTierSchema],  // For tiered rebates

  // Time period
  startDate: Date,
  endDate: Date,
  accrualPeriod: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually'],
    default: 'monthly'
  },
  settlementTerms: {
    type: String,
    default: 'Net 30'
  },

  // Type-specific settings
  growthSettings: {
    baselineYear: Number,
    minGrowthRate: Number
  },
  earlyPaymentSettings: {
    terms: String,  // e.g., "2/10 Net 30"
    discountDays: Number,
    netDays: Number
  },
  coopSettings: {
    requireProofOfPerformance: Boolean,
    accrualRate: Number
  },

  // Caps and limits
  maxAccrual: Number,
  maxSettlement: Number,

  // Tracking
  totalAccrued: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  totalRemaining: {
    type: Number,
    default: 0
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,

  notes: String
}, {
  timestamps: true
});

// Calculate rebate amount for a transaction
rebateSchema.methods.calculateRebate = function (transaction) {
  if (this.status !== 'active') return 0;

  const baseAmount = transaction.amount || transaction.totalAmount || 0;

  switch (this.calculationType) {
    case 'percentage':
      return baseAmount * (this.rate / 100);

    case 'fixed-amount':
      return this.amount || 0;

    case 'tiered': {
      if (!this.tiers || this.tiers.length === 0) return 0;

      // Find applicable tier
      const sortedTiers = this.tiers.sort((a, b) => b.threshold - a.threshold);
      const applicableTier = sortedTiers.find((tier) => baseAmount >= tier.threshold);

      if (!applicableTier) return 0;

      let rebateAmount = baseAmount * (applicableTier.rate / 100);

      // Apply cap if exists
      if (applicableTier.cap && rebateAmount > applicableTier.cap) {
        rebateAmount = applicableTier.cap;
      }

      return rebateAmount;
    }

    default:
      return 0;
  }
};

// Check if customer is eligible
rebateSchema.methods.isCustomerEligible = function (customerId, customerType, territory) {
  // Check specific customers
  if (this.eligibleCustomers && this.eligibleCustomers.length > 0) {
    const isEligible = this.eligibleCustomers.some((id) => id.toString() === customerId.toString());
    if (!isEligible) return false;
  }

  // Check customer types
  if (this.customerTypes && this.customerTypes.length > 0) {
    if (!this.customerTypes.includes(customerType)) return false;
  }

  // Check territories
  if (this.territories && this.territories.length > 0) {
    if (!this.territories.includes(territory)) return false;
  }

  return true;
};

module.exports = mongoose.model('Rebate', rebateSchema);
