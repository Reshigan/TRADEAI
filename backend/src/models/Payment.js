const mongoose = require('mongoose');

const paymentApplicationSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  invoiceNumber: String,
  appliedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  notes: String
});

const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  externalPaymentNumber: String,
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  valueDate: Date,
  clearedDate: Date,
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  baseAmount: Number, // Amount in base currency
  paymentMethod: {
    type: String,
    enum: ['wire_transfer', 'ach', 'check', 'credit_card', 'cash', 'deduction', 'offset'],
    required: true
  },
  paymentType: {
    type: String,
    enum: ['customer_payment', 'vendor_payment', 'refund', 'adjustment'],
    default: 'customer_payment'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'cleared', 'bounced', 'cancelled', 'reversed'],
    default: 'pending',
    index: true
  },
  // Bank details
  bankAccount: {
    accountNumber: String,
    accountName: String,
    bankName: String,
    routingNumber: String,
    swiftCode: String
  },
  checkNumber: String,
  referenceNumber: String,
  // Application to invoices
  applications: [paymentApplicationSchema],
  appliedAmount: {
    type: Number,
    default: 0
  },
  unappliedAmount: {
    type: Number,
    default: 0
  },
  // Matching
  matchStatus: {
    type: String,
    enum: ['unmatched', 'auto_matched', 'manual_matched', 'partially_matched'],
    default: 'unmatched',
    index: true
  },
  matchedAt: Date,
  matchConfidence: Number,
  matchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Settlement
  settlementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Settlement'
  },
  settlementDate: Date,
  settled: {
    type: Boolean,
    default: false
  },
  // GL posting
  glPosted: {
    type: Boolean,
    default: false
  },
  glPostingDate: Date,
  glDocument: String,
  glAccount: String,
  // Reconciliation
  reconciled: {
    type: Boolean,
    default: false
  },
  reconciledAt: Date,
  bankStatementId: String,
  // Deduction handling
  deductionAmount: {
    type: Number,
    default: 0
  },
  deductions: [{
    deductionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deduction'
    },
    amount: Number,
    reason: String
  }],
  notes: String,
  internalNotes: String,
  attachments: [{
    filename: String,
    url: String,
    type: String,
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

// Indexes for performance
paymentSchema.index({ customerId: 1, paymentDate: -1 });
paymentSchema.index({ status: 1, paymentDate: -1 });
paymentSchema.index({ matchStatus: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ settled: 1, status: 1 });

// Virtual for application percentage
paymentSchema.virtual('applicationPercent').get(function () {
  if (this.amount === 0) return 0;
  return Math.round((this.appliedAmount / this.amount) * 100);
});

// Virtual for net amount (after deductions)
paymentSchema.virtual('netAmount').get(function () {
  return this.amount - this.deductionAmount;
});

// Pre-save middleware
paymentSchema.pre('save', function (next) {
  // Calculate base amount if exchange rate provided
  if (this.exchangeRate && this.exchangeRate !== 1) {
    this.baseAmount = this.amount * this.exchangeRate;
  } else {
    this.baseAmount = this.amount;
  }

  // Calculate applied and unapplied amounts
  this.appliedAmount = this.applications.reduce((sum, app) => sum + app.appliedAmount, 0);
  this.unappliedAmount = this.amount - this.appliedAmount - this.deductionAmount;

  // Update match status
  if (this.applications.length > 0) {
    if (this.appliedAmount >= this.amount) {
      this.matchStatus = this.matchedBy ? 'manual_matched' : 'auto_matched';
    } else {
      this.matchStatus = 'partially_matched';
    }
  }

  next();
});

// Methods
paymentSchema.methods.applyToInvoice = function (invoiceId, invoiceNumber, amount) {
  if (amount > this.unappliedAmount) {
    throw new Error('Applied amount exceeds unapplied balance');
  }

  this.applications.push({
    invoiceId,
    invoiceNumber,
    appliedAmount: amount,
    appliedDate: new Date()
  });

  return this.save();
};

paymentSchema.methods.removeApplication = function (invoiceId) {
  const index = this.applications.findIndex((app) => app.invoiceId.toString() === invoiceId.toString());
  if (index === -1) {
    throw new Error('Application not found');
  }

  this.applications.splice(index, 1);
  return this.save();
};

paymentSchema.methods.addDeduction = function (deductionId, amount, reason) {
  this.deductions.push({
    deductionId,
    amount,
    reason
  });
  this.deductionAmount += amount;
  return this.save();
};

paymentSchema.methods.clear = function () {
  this.status = 'cleared';
  this.clearedDate = new Date();
  return this.save();
};

paymentSchema.methods.settle = function (settlementId) {
  this.settled = true;
  this.settlementId = settlementId;
  this.settlementDate = new Date();
  return this.save();
};

paymentSchema.methods.reconcile = function (bankStatementId) {
  this.reconciled = true;
  this.reconciledAt = new Date();
  this.bankStatementId = bankStatementId;
  return this.save();
};

paymentSchema.methods.canBePostedToGL = function () {
  return this.status === 'cleared' &&
         !this.glPosted &&
         this.applications.length > 0;
};

paymentSchema.methods.postToGL = function (glDocument, glAccount) {
  if (!this.canBePostedToGL()) {
    throw new Error('Payment cannot be posted to GL');
  }
  this.glPosted = true;
  this.glPostingDate = new Date();
  this.glDocument = glDocument;
  this.glAccount = glAccount;
  return this.save();
};

paymentSchema.methods.reverse = function (reason) {
  if (this.status === 'reversed') {
    throw new Error('Payment already reversed');
  }

  this.status = 'reversed';
  this.internalNotes = `${this.internalNotes || ''}\nReversed: ${reason}`;
  return this.save();
};

paymentSchema.methods.bounce = function (reason) {
  this.status = 'bounced';
  this.internalNotes = `${this.internalNotes || ''}\nBounced: ${reason}`;
  return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);
