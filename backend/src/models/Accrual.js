const mongoose = require('mongoose');

const accrualLineSchema = new mongoose.Schema({
  lineNumber: {
    type: Number,
    required: true
  },
  description: String,
  glAccount: {
    type: String,
    required: true
  },
  costCenter: String,
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  accrualAmount: {
    type: Number,
    required: true
  },
  actualAmount: {
    type: Number,
    default: 0
  },
  variance: {
    type: Number,
    default: 0
  },
  variancePercent: {
    type: Number,
    default: 0
  }
});

const accrualSchema = new mongoose.Schema({
  accrualNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  period: {
    year: {
      type: Number,
      required: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    quarter: {
      type: Number,
      min: 1,
      max: 4
    }
  },
  accrualType: {
    type: String,
    enum: ['trade_spend', 'promotion', 'rebate', 'discount', 'allowance', 'coop', 'markdown', 'other'],
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  tradeSpendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeSpend'
  },
  promotionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion'
  },
  accrualDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  startDate: Date,
  endDate: Date,
  lines: [accrualLineSchema],
  totalAccrual: {
    type: Number,
    required: true
  },
  totalActual: {
    type: Number,
    default: 0
  },
  totalVariance: {
    type: Number,
    default: 0
  },
  variancePercent: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'posted', 'reconciled', 'adjusted', 'reversed', 'closed'],
    default: 'draft',
    index: true
  },
  calculationMethod: {
    type: String,
    enum: ['manual', 'percentage', 'fixed_amount', 'per_unit', 'tiered', 'actuals'],
    default: 'manual'
  },
  calculationBasis: {
    type: String,
    enum: ['sales', 'volume', 'margin', 'invoice', 'contract']
  },
  // GL posting
  glPosted: {
    type: Boolean,
    default: false
  },
  glPostingDate: Date,
  glDocument: String,
  // Reconciliation
  reconciled: {
    type: Boolean,
    default: false
  },
  reconciledAt: Date,
  reconciledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Adjustments
  adjustments: [{
    date: Date,
    amount: Number,
    reason: String,
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  totalAdjustments: {
    type: Number,
    default: 0
  },
  // Reversal
  reversed: {
    type: Boolean,
    default: false
  },
  reversedAt: Date,
  reversedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reversalReason: String,
  reversalDocument: String,
  currency: {
    type: String,
    default: 'USD'
  },
  notes: String,
  internalNotes: String,
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
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

// Indexes
accrualSchema.index({ 'period.year': 1, 'period.month': 1 });
accrualSchema.index({ customerId: 1, accrualDate: -1 });
accrualSchema.index({ status: 1, accrualDate: -1 });
accrualSchema.index({ accrualType: 1, status: 1 });
accrualSchema.index({ createdAt: -1 });

// Virtuals
accrualSchema.virtual('accuracyPercent').get(function () {
  if (this.totalAccrual === 0) return 100;
  return Math.round((1 - Math.abs(this.totalVariance) / this.totalAccrual) * 100);
});

accrualSchema.virtual('needsAdjustment').get(function () {
  return Math.abs(this.variancePercent) > 10; // 10% threshold
});

// Pre-save middleware
accrualSchema.pre('save', function (next) {
  // Calculate quarter
  if (this.period && this.period.month) {
    this.period.quarter = Math.ceil(this.period.month / 3);
  }

  // Calculate line variances
  this.lines.forEach((line) => {
    line.variance = line.actualAmount - line.accrualAmount;
    if (line.accrualAmount !== 0) {
      line.variancePercent = (line.variance / line.accrualAmount) * 100;
    }
  });

  // Calculate totals
  this.totalAccrual = this.lines.reduce((sum, line) => sum + line.accrualAmount, 0);
  this.totalActual = this.lines.reduce((sum, line) => sum + line.actualAmount, 0);
  this.totalVariance = this.totalActual - this.totalAccrual;

  if (this.totalAccrual !== 0) {
    this.variancePercent = (this.totalVariance / this.totalAccrual) * 100;
  }

  // Add adjustments to total
  this.totalAdjustments = this.adjustments.reduce((sum, adj) => sum + adj.amount, 0);

  // Auto-reconcile if variance is within tolerance
  if (this.status === 'posted' && Math.abs(this.variancePercent) < 5) {
    this.status = 'reconciled';
    this.reconciled = true;
    this.reconciledAt = new Date();
  }

  next();
});

// Methods
accrualSchema.methods.post = function () {
  if (this.status !== 'draft') {
    throw new Error('Only draft accruals can be posted');
  }
  this.status = 'posted';
  return this.save();
};

accrualSchema.methods.reconcile = function (userId) {
  if (this.status !== 'posted' && this.status !== 'adjusted') {
    throw new Error('Only posted or adjusted accruals can be reconciled');
  }
  this.status = 'reconciled';
  this.reconciled = true;
  this.reconciledAt = new Date();
  this.reconciledBy = userId;
  return this.save();
};

accrualSchema.methods.adjust = function (amount, reason, userId) {
  this.adjustments.push({
    date: new Date(),
    amount,
    reason,
    adjustedBy: userId
  });
  this.status = 'adjusted';
  return this.save();
};

accrualSchema.methods.reverse = function (reason, userId) {
  if (this.reversed) {
    throw new Error('Accrual already reversed');
  }
  if (this.status === 'closed') {
    throw new Error('Cannot reverse closed accrual');
  }

  this.reversed = true;
  this.reversedAt = new Date();
  this.reversedBy = userId;
  this.reversalReason = reason;
  this.status = 'reversed';
  return this.save();
};

accrualSchema.methods.close = function () {
  if (!this.reconciled) {
    throw new Error('Cannot close unreconciled accrual');
  }
  this.status = 'closed';
  return this.save();
};

accrualSchema.methods.updateActuals = function (lineNumber, actualAmount) {
  const line = this.lines.find((l) => l.lineNumber === lineNumber);
  if (!line) throw new Error('Line not found');

  line.actualAmount = actualAmount;
  return this.save();
};

accrualSchema.methods.postToGL = function (glDocument) {
  if (this.status !== 'posted') {
    throw new Error('Accrual must be posted first');
  }
  if (this.glPosted) {
    throw new Error('Already posted to GL');
  }

  this.glPosted = true;
  this.glPostingDate = new Date();
  this.glDocument = glDocument;
  return this.save();
};

// Statics
accrualSchema.statics.getPeriodAccruals = function (year, month) {
  return this.find({
    'period.year': year,
    'period.month': month,
    status: { $nin: ['reversed'] }
  });
};

accrualSchema.statics.getUnreconciledAccruals = function (options = {}) {
  const query = {
    status: { $in: ['posted', 'adjusted'] },
    reconciled: false
  };

  if (options.customerId) {
    query.customerId = options.customerId;
  }

  if (options.accrualType) {
    query.accrualType = options.accrualType;
  }

  return this.find(query).sort({ accrualDate: 1 });
};

module.exports = mongoose.model('Accrual', accrualSchema);
