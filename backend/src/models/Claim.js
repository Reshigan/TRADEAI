const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  claimId: {
    type: String,
    required: true,
    unique: true
  },

  claimType: {
    type: String,
    enum: ['promotion', 'rebate', 'allowance', 'markdown', 'damage', 'return', 'other'],
    required: true
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },

  promotion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion'
  },

  tradingTerm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradingTerm'
  },

  claimDate: {
    type: Date,
    required: true,
    index: true
  },

  claimPeriod: {
    start: Date,
    end: Date
  },

  claimAmount: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: 'ZAR'
  },

  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'disputed'],
    default: 'draft',
    index: true
  },

  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  submittedAt: Date,

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  reviewedAt: Date,

  approvedAmount: Number,

  variance: {
    amount: Number,
    percentage: Number,
    reason: String
  },

  lineItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productCode: String,
    productName: String,
    quantity: Number,
    unitPrice: Number,
    claimRate: Number,
    claimAmount: Number,
    invoice: {
      invoiceNumber: String,
      invoiceDate: Date,
      invoiceAmount: Number
    }
  }],

  supportingDocuments: [{
    documentType: {
      type: String,
      enum: ['invoice', 'proof_of_purchase', 'proof_of_performance', 'sales_report', 'other']
    },
    documentUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  matching: {
    invoices: [{
      invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
      },
      invoiceNumber: String,
      matchedAmount: Number,
      matchedAt: Date
    }],
    purchaseOrders: [{
      poId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PurchaseOrder'
      },
      poNumber: String,
      matchedAmount: Number,
      matchedAt: Date
    }],
    matchStatus: {
      type: String,
      enum: ['unmatched', 'partial', 'full', 'overmatch'],
      default: 'unmatched'
    }
  },

  payment: {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    paymentDate: Date,
    paymentAmount: Number,
    paymentReference: String
  },

  dispute: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    disputeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispute'
    },
    disputeReason: String,
    disputedAt: Date
  },

  notes: String,

  auditTrail: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

claimSchema.index({ company: 1, status: 1 });
claimSchema.index({ company: 1, customer: 1, claimDate: 1 });
claimSchema.index({ company: 1, 'matching.matchStatus': 1 });

claimSchema.methods.submit = async function (userId) {
  if (this.status !== 'draft') {
    throw new Error('Only draft claims can be submitted');
  }

  this.status = 'submitted';
  this.submittedBy = userId;
  this.submittedAt = new Date();

  this.auditTrail.push({
    action: 'submitted',
    performedBy: userId,
    details: { amount: this.claimAmount }
  });

  await this.save();
  return this;
};

claimSchema.methods.approve = async function (userId, approvedAmount) {
  if (this.status !== 'under_review' && this.status !== 'submitted') {
    throw new Error('Only claims under review can be approved');
  }

  this.status = 'approved';
  this.reviewedBy = userId;
  this.reviewedAt = new Date();
  this.approvedAmount = approvedAmount || this.claimAmount;

  if (this.approvedAmount !== this.claimAmount) {
    this.variance = {
      amount: this.claimAmount - this.approvedAmount,
      percentage: ((this.claimAmount - this.approvedAmount) / this.claimAmount) * 100
    };
  }

  this.auditTrail.push({
    action: 'approved',
    performedBy: userId,
    details: { approvedAmount: this.approvedAmount, variance: this.variance }
  });

  await this.save();
  return this;
};

claimSchema.methods.reject = async function (userId, reason) {
  if (this.status !== 'under_review' && this.status !== 'submitted') {
    throw new Error('Only claims under review can be rejected');
  }

  this.status = 'rejected';
  this.reviewedBy = userId;
  this.reviewedAt = new Date();
  this.variance = {
    reason
  };

  this.auditTrail.push({
    action: 'rejected',
    performedBy: userId,
    details: { reason }
  });

  await this.save();
  return this;
};

claimSchema.methods.matchToInvoice = async function (invoiceId, invoiceNumber, matchedAmount) {
  this.matching.invoices.push({
    invoiceId,
    invoiceNumber,
    matchedAmount,
    matchedAt: new Date()
  });

  const totalMatched = this.matching.invoices.reduce((sum, inv) => sum + inv.matchedAmount, 0);

  if (totalMatched === 0) {
    this.matching.matchStatus = 'unmatched';
  } else if (totalMatched < this.claimAmount) {
    this.matching.matchStatus = 'partial';
  } else if (totalMatched === this.claimAmount) {
    this.matching.matchStatus = 'full';
  } else {
    this.matching.matchStatus = 'overmatch';
  }

  await this.save();
  return this;
};

claimSchema.statics.findUnmatched = function (tenantId) {
  return this.find({
    company: tenantId,
    status: { $in: ['approved', 'submitted'] },
    'matching.matchStatus': { $in: ['unmatched', 'partial'] }
  });
};

claimSchema.statics.findPendingApproval = function (tenantId) {
  return this.find({
    company: tenantId,
    status: { $in: ['submitted', 'under_review'] }
  }).populate('customer', 'name code')
    .populate('submittedBy', 'name email');
};

module.exports = mongoose.model('Claim', claimSchema);
