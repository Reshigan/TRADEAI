const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  // Budget Identification

  // Company Association - CRITICAL for multi-tenant isolation
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  year: {
    type: Number,
    required: true
  },

  // Budget Type and Version
  budgetType: {
    type: String,
    enum: ['forecast', 'budget', 'revised_budget', 'scenario'],
    required: true
  },
  budgetCategory: {
    type: String,
    enum: ['marketing', 'trade_marketing'],
    default: 'marketing'
  },
  version: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'locked', 'archived'],
    default: 'draft'
  },

  // Budget Scope
  scope: {
    level: {
      type: String,
      enum: ['company', 'vendor', 'customer', 'product', 'mixed'],
      required: true
    },
    // Optional specific assignments
    vendors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    }],
    customers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    }],
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    customerHierarchy: {
      level: Number,
      value: String
    },
    productHierarchy: {
      level: Number,
      value: String
    }
  },

  // ML Forecast Data
  mlForecast: {
    generated: {
      type: Boolean,
      default: false
    },
    generatedDate: Date,
    algorithm: String,
    accuracy: Number,
    parameters: mongoose.Schema.Types.Mixed,
    monthlyForecasts: [{
      month: Number,
      salesUnits: Number,
      salesValue: Number,
      confidence: Number,
      factors: mongoose.Schema.Types.Mixed
    }]
  },

  // Budget Lines by Month
  budgetLines: [{
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },

    // Sales Targets
    sales: {
      units: { type: Number, default: 0 },
      value: { type: Number, default: 0 },
      adjustmentReason: String
    },

    // Trade Spend Budgets
    tradeSpend: {
      marketing: {
        budget: { type: Number, default: 0 },
        allocated: { type: Number, default: 0 },
        committed: { type: Number, default: 0 },
        spent: { type: Number, default: 0 }
      },
      cashCoop: {
        budget: { type: Number, default: 0 },
        allocated: { type: Number, default: 0 },
        committed: { type: Number, default: 0 },
        spent: { type: Number, default: 0 }
      },
      tradingTerms: {
        budget: { type: Number, default: 0 },
        allocated: { type: Number, default: 0 },
        committed: { type: Number, default: 0 },
        spent: { type: Number, default: 0 }
      },
      promotions: {
        budget: { type: Number, default: 0 },
        allocated: { type: Number, default: 0 },
        committed: { type: Number, default: 0 },
        spent: { type: Number, default: 0 }
      }
    },

    // Profitability
    profitability: {
      grossMargin: { type: Number, default: 0 },
      netMargin: { type: Number, default: 0 },
      roi: { type: Number, default: 0 }
    }
  }],

  // Annual Totals (calculated)
  annualTotals: {
    sales: {
      units: { type: Number, default: 0 },
      value: { type: Number, default: 0 }
    },
    tradeSpend: {
      marketing: { type: Number, default: 0 },
      cashCoop: { type: Number, default: 0 },
      tradingTerms: { type: Number, default: 0 },
      promotions: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    profitability: {
      grossMargin: { type: Number, default: 0 },
      netMargin: { type: Number, default: 0 },
      roi: { type: Number, default: 0 }
    }
  },

  // Comparison Baselines
  comparisons: [{
    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Budget'
    },
    name: String,
    type: {
      type: String,
      enum: ['previous_year', 'previous_version', 'scenario']
    }
  }],

  // Assumptions and Notes
  assumptions: [{
    category: String,
    assumption: String,
    impact: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedDate: Date
  }],

  // Approval Workflow
  approvals: [{
    level: {
      type: String,
      enum: ['kam', 'manager', 'director', 'finance', 'board']
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

  // Lock Information
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedDate: Date,
  lockReason: String,

  // Audit Trail
  history: [{
    action: String,
    changes: mongoose.Schema.Types.Mixed,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedDate: Date,
    comment: String
  }],

  // Created/Modified By
  // Simple Budget Tracking (for frontend compatibility)
  allocated: {
    type: Number,
    default: 0
  },
  remaining: {
    type: Number,
    default: 0
  },
  spent: {
    type: Number,
    default: 0
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
budgetSchema.index({ code: 1 });
budgetSchema.index({ year: 1 });
budgetSchema.index({ budgetType: 1 });
budgetSchema.index({ status: 1 });
budgetSchema.index({ 'scope.level': 1 });
budgetSchema.index({ year: 1, budgetType: 1, status: 1 });

// Pre-save middleware to calculate annual totals
budgetSchema.pre('save', function (next) {
  // Reset annual totals
  this.annualTotals = {
    sales: { units: 0, value: 0 },
    tradeSpend: {
      marketing: 0,
      cashCoop: 0,
      tradingTerms: 0,
      promotions: 0,
      total: 0
    },
    profitability: {
      grossMargin: 0,
      netMargin: 0,
      roi: 0
    }
  };

  // Calculate totals from budget lines
  this.budgetLines.forEach((line) => {
    // Sales
    this.annualTotals.sales.units += line.sales.units || 0;
    this.annualTotals.sales.value += line.sales.value || 0;

    // Trade Spend
    this.annualTotals.tradeSpend.marketing += line.tradeSpend.marketing.budget || 0;
    this.annualTotals.tradeSpend.cashCoop += line.tradeSpend.cashCoop.budget || 0;
    this.annualTotals.tradeSpend.tradingTerms += line.tradeSpend.tradingTerms.budget || 0;
    this.annualTotals.tradeSpend.promotions += line.tradeSpend.promotions.budget || 0;

    // Profitability
    this.annualTotals.profitability.grossMargin += line.profitability.grossMargin || 0;
    this.annualTotals.profitability.netMargin += line.profitability.netMargin || 0;
  });

  // Calculate total trade spend
  this.annualTotals.tradeSpend.total =
    this.annualTotals.tradeSpend.marketing +
    this.annualTotals.tradeSpend.cashCoop +
    this.annualTotals.tradeSpend.tradingTerms +
    this.annualTotals.tradeSpend.promotions;

  // Calculate ROI if we have sales and spend
  if (this.annualTotals.tradeSpend.total > 0) {
    this.annualTotals.profitability.roi =
      ((this.annualTotals.sales.value - this.annualTotals.tradeSpend.total) /
       this.annualTotals.tradeSpend.total) * 100;
  }

  next();
});

// Methods
budgetSchema.methods.lock = async function (userId, reason) {
  this.status = 'locked';
  this.lockedBy = userId;
  this.lockedDate = new Date();
  this.lockReason = reason;

  this.history.push({
    action: 'locked',
    performedBy: userId,
    performedDate: new Date(),
    comment: reason
  });

  await this.save();
};

budgetSchema.methods.submitForApproval = async function (userId) {
  this.status = 'submitted';
  this.lastModifiedBy = userId;

  this.history.push({
    action: 'submitted_for_approval',
    performedBy: userId,
    performedDate: new Date()
  });

  await this.save();
};

budgetSchema.methods.approve = async function (level, userId, comments) {
  const approval = this.approvals.find((a) => a.level === level);
  if (approval) {
    approval.status = 'approved';
    approval.approver = userId;
    approval.comments = comments;
    approval.date = new Date();
  }

  // Check if all required approvals are complete
  const allApproved = this.approvals.every((a) => a.status === 'approved');
  if (allApproved) {
    this.status = 'approved';
  }

  this.history.push({
    action: 'approved',
    performedBy: userId,
    performedDate: new Date(),
    comment: `${level} approval: ${comments}`
  });

  await this.save();
};

budgetSchema.methods.createNewVersion = async function () {
  const newBudget = new this.constructor(this.toObject());
  newBudget._id = new mongoose.Types.ObjectId();
  newBudget.version = this.version + 1;
  newBudget.status = 'draft';
  newBudget.code = `${this.code}_v${newBudget.version}`;
  newBudget.approvals = this.approvals.map((a) => ({
    ...a.toObject(),
    status: 'pending',
    approver: null,
    comments: null,
    date: null
  }));
  newBudget.history = [{
    action: 'created_from_version',
    performedBy: this.lastModifiedBy,
    performedDate: new Date(),
    comment: `Created from version ${this.version}`
  }];

  await newBudget.save();
  return newBudget;
};

// Statics
budgetSchema.statics.findLatestApproved = function (year, scope) {
  return this.findOne({
    year,
    status: 'approved',
    'scope.level': scope.level
  }).sort({ version: -1 });
};

const Budget = mongoose.model('Budget', budgetSchema);

// Use mock in development mode if USE_MOCK_DB is enabled
if (process.env.USE_MOCK_DB === 'true') {
  const { MockBudget } = require('../services/mockDatabase');
  module.exports = MockBudget;
} else {
  module.exports = Budget;
}
