const mongoose = require('mongoose');

const settlementItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['invoice', 'payment', 'deduction', 'credit_memo', 'debit_memo', 'adjustment'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'items.referenceModel'
  },
  referenceModel: {
    type: String,
    required: true,
    enum: ['Invoice', 'Payment', 'Deduction']
  },
  referenceNumber: String,
  amount: {
    type: Number,
    required: true
  },
  settled: {
    type: Boolean,
    default: false
  },
  settledDate: Date
});

const settlementSchema = new mongoose.Schema({
  settlementNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  settlementDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  periodStart: Date,
  periodEnd: Date,
  items: [settlementItemSchema],
  totalInvoices: {
    type: Number,
    default: 0
  },
  totalPayments: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  totalAdjustments: {
    type: Number,
    default: 0
  },
  netSettlement: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'draft',
    index: true
  },
  settlementType: {
    type: String,
    enum: ['periodic', 'ad_hoc', 'customer_requested', 'system_generated'],
    default: 'periodic'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  // Approval
  approvalRequired: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  // GL Posting
  glPosted: {
    type: Boolean,
    default: false
  },
  glPostingDate: Date,
  glDocument: String,
  // Bank details
  bankTransactionId: String,
  bankReferenceNumber: String,
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
  bankStatementId: String,
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
settlementSchema.index({ customerId: 1, settlementDate: -1 });
settlementSchema.index({ status: 1, settlementDate: -1 });
settlementSchema.index({ createdAt: -1 });

// Virtuals
settlementSchema.virtual('itemCount').get(function () {
  return this.items.length;
});

settlementSchema.virtual('settledItemCount').get(function () {
  return this.items.filter((item) => item.settled).length;
});

settlementSchema.virtual('completionPercent').get(function () {
  if (this.items.length === 0) return 0;
  return Math.round((this.settledItemCount / this.items.length) * 100);
});

// Pre-save middleware
settlementSchema.pre('save', function (next) {
  // Calculate totals
  this.totalInvoices = 0;
  this.totalPayments = 0;
  this.totalDeductions = 0;
  this.totalAdjustments = 0;

  this.items.forEach((item) => {
    switch (item.itemType) {
      case 'invoice':
        this.totalInvoices += item.amount;
        break;
      case 'payment':
        this.totalPayments += item.amount;
        break;
      case 'deduction':
        this.totalDeductions += item.amount;
        break;
      case 'credit_memo':
      case 'debit_memo':
      case 'adjustment':
        this.totalAdjustments += item.amount;
        break;
    }
  });

  // Net settlement = Invoices - Payments - Deductions + Adjustments
  this.netSettlement = this.totalInvoices - this.totalPayments - this.totalDeductions + this.totalAdjustments;

  next();
});

// Methods
settlementSchema.methods.addItem = function (itemData) {
  this.items.push(itemData);
  return this.save();
};

settlementSchema.methods.removeItem = function (itemId) {
  const index = this.items.findIndex((item) => item._id.toString() === itemId.toString());
  if (index === -1) {
    throw new Error('Item not found');
  }
  this.items.splice(index, 1);
  return this.save();
};

settlementSchema.methods.approve = function (userId) {
  if (this.status !== 'pending_approval' && this.status !== 'draft') {
    throw new Error('Only pending or draft settlements can be approved');
  }

  this.status = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  return this.save();
};

settlementSchema.methods.process = function () {
  if (this.status !== 'approved') {
    throw new Error('Only approved settlements can be processed');
  }

  this.status = 'processing';
  return this.save();
};

settlementSchema.methods.complete = function () {
  if (this.status !== 'processing') {
    throw new Error('Only processing settlements can be completed');
  }

  // Mark all items as settled
  this.items.forEach((item) => {
    item.settled = true;
    item.settledDate = new Date();
  });

  this.status = 'completed';
  return this.save();
};

settlementSchema.methods.fail = function (reason) {
  this.status = 'failed';
  this.internalNotes = `${this.internalNotes || ''}\nFailed: ${reason}`;
  return this.save();
};

settlementSchema.methods.cancel = function (reason) {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel completed settlement');
  }

  this.status = 'cancelled';
  this.internalNotes = `${this.internalNotes || ''}\nCancelled: ${reason}`;
  return this.save();
};

settlementSchema.methods.postToGL = function (glDocument) {
  if (this.status !== 'completed') {
    throw new Error('Only completed settlements can be posted to GL');
  }

  if (this.glPosted) {
    throw new Error('Settlement already posted to GL');
  }

  this.glPosted = true;
  this.glPostingDate = new Date();
  this.glDocument = glDocument;
  return this.save();
};

settlementSchema.methods.reconcile = function (userId, bankStatementId) {
  if (this.status !== 'completed') {
    throw new Error('Only completed settlements can be reconciled');
  }

  this.reconciled = true;
  this.reconciledAt = new Date();
  this.reconciledBy = userId;
  this.bankStatementId = bankStatementId;
  return this.save();
};

// Statics
settlementSchema.statics.getUnreconciledSettlements = function (customerId) {
  const query = {
    status: 'completed',
    reconciled: false
  };

  if (customerId) {
    query.customerId = customerId;
  }

  return this.find(query).populate('customerId');
};

settlementSchema.statics.getPendingSettlements = function (customerId) {
  const query = {
    status: { $in: ['draft', 'pending_approval', 'approved', 'processing'] }
  };

  if (customerId) {
    query.customerId = customerId;
  }

  return this.find(query).populate('customerId');
};

module.exports = mongoose.model('Settlement', settlementSchema);
