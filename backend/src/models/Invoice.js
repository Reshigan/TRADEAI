const mongoose = require('mongoose');

const invoiceLineSchema = new mongoose.Schema({
  lineNumber: {
    type: Number,
    required: true
  },
  poLineNumber: Number,
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  description: String,
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  glAccount: String,
  costCenter: String,
  matched: {
    type: Boolean,
    default: false
  },
  matchedAmount: {
    type: Number,
    default: 0
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  externalInvoiceNumber: String,
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    index: true
  },
  poNumber: String,
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: Date,
  receivedDate: Date,
  currency: {
    type: String,
    default: 'USD'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  lines: [invoiceLineSchema],
  subtotal: {
    type: Number,
    required: true
  },
  taxTotal: {
    type: Number,
    default: 0
  },
  discountTotal: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'pending_payment', 'partially_paid', 'paid', 'overdue', 'disputed', 'cancelled'],
    default: 'draft',
    index: true
  },
  matchStatus: {
    type: String,
    enum: ['unmatched', 'partially_matched', 'matched', '3way_matched'],
    default: 'unmatched',
    index: true
  },
  matchedAt: Date,
  matchConfidence: Number,
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  paymentTerms: {
    type: String,
    enum: ['immediate', 'net15', 'net30', 'net45', 'net60', 'net90'],
    default: 'net30'
  },
  paymentMethod: {
    type: String,
    enum: ['wire_transfer', 'ach', 'check', 'credit_card', 'deduction'],
    default: 'wire_transfer'
  },
  bankAccount: String,
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
  // Matching metadata
  matchingDetails: {
    poMatched: Boolean,
    receiptMatched: Boolean,
    amountVariance: Number,
    quantityVariance: Number,
    priceVariance: Number,
    toleranceExceeded: Boolean,
    exceptions: [String]
  },
  // GL posting
  glPosted: {
    type: Boolean,
    default: false
  },
  glPostingDate: Date,
  glDocument: String,
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
invoiceSchema.index({ customerId: 1, invoiceDate: -1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ purchaseOrderId: 1, status: 1 });
invoiceSchema.index({ createdAt: -1 });

// Virtual for outstanding amount
invoiceSchema.virtual('outstandingAmount').get(function () {
  return this.total - this.amountPaid;
});

// Virtual for days overdue
invoiceSchema.virtual('daysOverdue').get(function () {
  if (!this.dueDate || this.status === 'paid') return 0;
  const today = new Date();
  const due = new Date(this.dueDate);
  if (today <= due) return 0;
  return Math.floor((today - due) / (1000 * 60 * 60 * 24));
});

// Virtual for payment completion percentage
invoiceSchema.virtual('paymentPercent').get(function () {
  if (this.total === 0) return 0;
  return Math.round((this.amountPaid / this.total) * 100);
});

// Pre-save middleware
invoiceSchema.pre('save', function (next) {
  // Calculate line amounts
  this.lines.forEach((line) => {
    line.amount = line.quantity * line.unitPrice;
    line.netAmount = line.amount - line.discountAmount + line.taxAmount;
  });

  // Calculate totals
  this.subtotal = this.lines.reduce((sum, line) => sum + line.amount, 0);
  this.taxTotal = this.lines.reduce((sum, line) => sum + line.taxAmount, 0);
  this.discountTotal = this.lines.reduce((sum, line) => sum + line.discountAmount, 0);
  this.total = this.subtotal - this.discountTotal + this.taxTotal;

  // Update payment status
  if (this.amountPaid >= this.total) {
    this.status = 'paid';
  } else if (this.amountPaid > 0) {
    this.status = 'partially_paid';
  } else if (this.status === 'approved') {
    this.status = 'pending_payment';
  }

  // Check overdue
  if (this.dueDate && new Date() > this.dueDate && this.status !== 'paid') {
    this.status = 'overdue';
  }

  // Update match status
  const allMatched = this.lines.every((line) => line.matched);
  const someMatched = this.lines.some((line) => line.matched);

  if (allMatched && this.purchaseOrderId) {
    this.matchStatus = '3way_matched';
  } else if (allMatched) {
    this.matchStatus = 'matched';
  } else if (someMatched) {
    this.matchStatus = 'partially_matched';
  }

  next();
});

// Methods
invoiceSchema.methods.recordPayment = function (amount, paymentId) {
  this.amountPaid += amount;
  if (this.amountPaid >= this.total) {
    this.status = 'paid';
  } else {
    this.status = 'partially_paid';
  }
  return this.save();
};

invoiceSchema.methods.matchToPO = function (purchaseOrder) {
  this.purchaseOrderId = purchaseOrder._id;
  this.poNumber = purchaseOrder.poNumber;
  this.matchStatus = 'matched';
  this.matchedAt = new Date();

  // Initialize matching details
  this.matchingDetails = {
    poMatched: true,
    receiptMatched: false,
    amountVariance: 0,
    quantityVariance: 0,
    priceVariance: 0,
    toleranceExceeded: false,
    exceptions: []
  };

  return this.save();
};

invoiceSchema.methods.approve = function (userId) {
  this.approvalStatus = 'approved';
  this.status = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  return this.save();
};

invoiceSchema.methods.reject = function (userId, reason) {
  this.approvalStatus = 'rejected';
  this.status = 'cancelled';
  this.internalNotes = `${this.internalNotes || ''}\nRejected by ${userId}: ${reason}`;
  return this.save();
};

invoiceSchema.methods.dispute = function (reason) {
  this.status = 'disputed';
  this.internalNotes = `${this.internalNotes || ''}\nDisputed: ${reason}`;
  return this.save();
};

invoiceSchema.methods.canBePostedToGL = function () {
  return this.status === 'approved' &&
         this.matchStatus === '3way_matched' &&
         !this.glPosted;
};

invoiceSchema.methods.postToGL = function (glDocument) {
  if (!this.canBePostedToGL()) {
    throw new Error('Invoice cannot be posted to GL');
  }
  this.glPosted = true;
  this.glPostingDate = new Date();
  this.glDocument = glDocument;
  return this.save();
};

module.exports = mongoose.model('Invoice', invoiceSchema);
