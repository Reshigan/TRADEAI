const mongoose = require('mongoose');

const tradeSpendSchema = new mongoose.Schema({
  // Spend Identification

  // Company Association - CRITICAL for multi-tenant isolation
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  spendId: {
    type: String,
    required: true,
    unique: true
  },

  // Spend Type
  spendType: {
    type: String,
    enum: ['marketing', 'cash_coop', 'trading_terms', 'rebate', 'promotion'],
    required: true
  },
  activityType: {
    type: String,
    enum: ['trade_marketing', 'key_account'],
    default: null
  },

  // Spend Category (for detailed classification)
  category: {
    type: String,
    required: true
  },

  // Cash Co-op Specific
  cashCoopDetails: {
    reason: {
      type: String,
      enum: [
        'shelf_space',
        'end_cap_display',
        'secondary_display',
        'flyer_participation',
        'digital_advertising',
        'in_store_demo',
        'new_store_opening',
        'renovation_support',
        'equipment_placement',
        'training_support',
        'other'
      ]
    },
    criteria: {
      minimumPurchase: Number,
      displayDuration: Number,
      performanceTarget: String,
      conditions: String
    },
    walletDeduction: {
      fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      amount: Number,
      date: Date
    }
  },

  // Amount and Currency
  amount: {
    requested: {
      type: Number,
      required: true
    },
    approved: Number,
    spent: Number,
    currency: {
      type: String,
      default: 'USD'
    }
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

  // Associations
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],

  // Hierarchy Scope for proportional allocation
  productScope: {
    type: {
      type: String,
      enum: ['leaf', 'hierarchy', 'all'],
      default: 'leaf'
    },
    ids: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    level: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: String
    }
  },
  customerScope: {
    type: {
      type: String,
      enum: ['leaf', 'hierarchy', 'all'],
      default: 'leaf'
    },
    ids: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    }],
    level: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: String
    }
  },
  productHierarchy: [{
    level: { type: Number, min: 1, max: 5 },
    value: { type: String }
  }],
  customerHierarchy: [{
    level: { type: Number, min: 1, max: 5 },
    value: { type: String }
  }],
  allocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Allocation'
  },
  promotion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion'
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget'
  },

  // Status and Workflow
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'active', 'completed', 'cancelled', 'rejected'],
    default: 'draft'
  },

  // Approvals
  approvals: [{
    level: {
      type: String,
      enum: ['kam', 'manager', 'finance', 'director', 'vendor']
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
    date: Date,
    amount: Number // Approved amount at this level
  }],

  // Financial Details
  financial: {
    glAccount: String,
    costCenter: String,
    profitCenter: String,
    wbsElement: String,
    internalOrder: String
  },

  // Performance Metrics
  performance: {
    targetMetric: String,
    targetValue: Number,
    actualValue: Number,
    achievement: Number,
    roi: Number,
    effectiveness: {
      type: String,
      enum: ['highly_effective', 'effective', 'moderate', 'ineffective'],
      default: 'moderate'
    }
  },

  // Documentation
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['contract', 'invoice', 'receipt', 'photo', 'report', 'other']
    },
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedDate: Date
  }],

  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['credit_note', 'check', 'wire_transfer', 'offset', 'other']
    },
    reference: String,
    date: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Accruals
  accruals: [{
    month: String,
    year: Number,
    amount: Number,
    posted: Boolean,
    postingDate: Date,
    reversalDate: Date
  }],

  // Notes and Comments
  notes: String,
  internalNotes: String,

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
tradeSpendSchema.index({ spendId: 1 });
tradeSpendSchema.index({ spendType: 1 });
tradeSpendSchema.index({ status: 1 });
tradeSpendSchema.index({ customer: 1 });
tradeSpendSchema.index({ vendor: 1 });
tradeSpendSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });
tradeSpendSchema.index({ createdBy: 1 });

// Compound indexes
tradeSpendSchema.index({ customer: 1, spendType: 1, status: 1 });
tradeSpendSchema.index({ vendor: 1, spendType: 1, status: 1 });

// Virtual for spend efficiency
tradeSpendSchema.virtual('efficiency').get(function () {
  if (this.amount.spent && this.amount.approved) {
    return (this.amount.spent / this.amount.approved) * 100;
  }
  return 0;
});

// Pre-save middleware
tradeSpendSchema.pre('save', function (next) {
  // Calculate achievement if we have target and actual
  if (this.performance.targetValue && this.performance.actualValue) {
    this.performance.achievement =
      (this.performance.actualValue / this.performance.targetValue) * 100;

    // Determine effectiveness
    if (this.performance.achievement >= 120) {
      this.performance.effectiveness = 'highly_effective';
    } else if (this.performance.achievement >= 90) {
      this.performance.effectiveness = 'effective';
    } else if (this.performance.achievement >= 70) {
      this.performance.effectiveness = 'moderate';
    } else {
      this.performance.effectiveness = 'ineffective';
    }
  }

  // Calculate ROI if possible
  if (this.performance.actualValue && this.amount.spent) {
    const incrementalValue = this.performance.actualValue - (this.performance.targetValue || 0);
    this.performance.roi = (incrementalValue / this.amount.spent) * 100;
  }

  next();
});

// Methods
tradeSpendSchema.methods.submitForApproval = async function (userId) {
  this.status = 'submitted';
  this.lastModifiedBy = userId;

  this.history.push({
    action: 'submitted_for_approval',
    performedBy: userId,
    performedDate: new Date()
  });

  await this.save();
};

tradeSpendSchema.methods.approve = async function (level, userId, approvedAmount, comments) {
  const approval = this.approvals.find((a) => a.level === level);
  if (approval) {
    approval.status = 'approved';
    approval.approver = userId;
    approval.amount = approvedAmount;
    approval.comments = comments;
    approval.date = new Date();
  }

  // Update approved amount if this is the final approval
  const allApproved = this.approvals.every((a) => a.status === 'approved');
  if (allApproved) {
    this.status = 'approved';
    this.amount.approved = approvedAmount;
  }

  this.history.push({
    action: 'approved',
    performedBy: userId,
    performedDate: new Date(),
    comment: `${level} approval: ${comments}`,
    changes: { approvedAmount }
  });

  await this.save();
};

tradeSpendSchema.methods.reject = async function (level, userId, reason) {
  const approval = this.approvals.find((a) => a.level === level);
  if (approval) {
    approval.status = 'rejected';
    approval.approver = userId;
    approval.comments = reason;
    approval.date = new Date();
  }

  this.status = 'rejected';

  this.history.push({
    action: 'rejected',
    performedBy: userId,
    performedDate: new Date(),
    comment: `${level} rejection: ${reason}`
  });

  await this.save();
};

tradeSpendSchema.methods.recordSpend = async function (amount, documents) {
  this.amount.spent = (this.amount.spent || 0) + amount;

  if (documents && documents.length > 0) {
    this.documents.push(...documents);
  }

  this.history.push({
    action: 'spend_recorded',
    changes: { amount },
    performedDate: new Date()
  });

  await this.save();
};

tradeSpendSchema.methods.createAccrual = async function (month, year, amount) {
  this.accruals.push({
    month,
    year,
    amount,
    posted: false
  });

  await this.save();
};

// Statics
tradeSpendSchema.statics.findByCustomerAndPeriod = function (customerId, startDate, endDate) {
  return this.find({
    customer: customerId,
    'period.startDate': { $lte: endDate },
    'period.endDate': { $gte: startDate }
  });
};

tradeSpendSchema.statics.calculateTotalSpend = async function (filters) {
  const match = {};

  if (filters.customer) match.customer = filters.customer;
  if (filters.vendor) match.vendor = filters.vendor;
  if (filters.spendType) match.spendType = filters.spendType;
  if (filters.status) match.status = filters.status;

  if (filters.startDate && filters.endDate) {
    match['period.startDate'] = { $lte: new Date(filters.endDate) };
    match['period.endDate'] = { $gte: new Date(filters.startDate) };
  }

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRequested: { $sum: '$amount.requested' },
        totalApproved: { $sum: '$amount.approved' },
        totalSpent: { $sum: '$amount.spent' }
      }
    }
  ]);

  return result[0] || { totalRequested: 0, totalApproved: 0, totalSpent: 0 };
};

const TradeSpend = mongoose.model('TradeSpend', tradeSpendSchema);

module.exports = TradeSpend;
