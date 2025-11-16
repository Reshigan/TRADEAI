const mongoose = require('mongoose');

const purchaseOrderLineSchema = new mongoose.Schema({
  lineNumber: {
    type: Number,
    required: true
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
  quantityReceived: {
    type: Number,
    default: 0
  },
  quantityInvoiced: {
    type: Number,
    default: 0
  },
  amountInvoiced: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['open', 'partially_received', 'received', 'closed', 'cancelled'],
    default: 'open'
  }
});

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  externalPoNumber: String,
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
  poDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  deliveryDate: Date,
  expiryDate: Date,
  currency: {
    type: String,
    default: 'USD'
  },
  lines: [purchaseOrderLineSchema],
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
  status: {
    type: String,
    enum: ['draft', 'approved', 'sent', 'acknowledged', 'partially_received', 'received', 'closed', 'cancelled'],
    default: 'draft',
    index: true
  },
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
  shippingAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  billingAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
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

// Indexes for performance
purchaseOrderSchema.index({ customerId: 1, poDate: -1 });
purchaseOrderSchema.index({ status: 1, poDate: -1 });
purchaseOrderSchema.index({ createdAt: -1 });

// Virtual for outstanding amount
purchaseOrderSchema.virtual('outstandingAmount').get(function () {
  const totalInvoiced = this.lines.reduce((sum, line) => sum + line.amountInvoiced, 0);
  return this.total - totalInvoiced;
});

// Virtual for completion percentage
purchaseOrderSchema.virtual('completionPercent').get(function () {
  if (this.total === 0) return 0;
  const totalInvoiced = this.lines.reduce((sum, line) => sum + line.amountInvoiced, 0);
  return Math.round((totalInvoiced / this.total) * 100);
});

// Pre-save middleware to calculate totals
purchaseOrderSchema.pre('save', function (next) {
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

  // Update status based on line statuses
  const allReceived = this.lines.every((line) => line.status === 'received' || line.status === 'closed');
  const someReceived = this.lines.some((line) => line.quantityReceived > 0);

  if (allReceived && this.status !== 'closed' && this.status !== 'cancelled') {
    this.status = 'received';
  } else if (someReceived && this.status === 'sent') {
    this.status = 'partially_received';
  }

  next();
});

// Methods
purchaseOrderSchema.methods.updateLineReceived = function (lineNumber, quantityReceived) {
  const line = this.lines.find((l) => l.lineNumber === lineNumber);
  if (!line) throw new Error('Line not found');

  line.quantityReceived += quantityReceived;

  if (line.quantityReceived >= line.quantity) {
    line.status = 'received';
  } else if (line.quantityReceived > 0) {
    line.status = 'partially_received';
  }

  return this.save();
};

purchaseOrderSchema.methods.updateLineInvoiced = function (lineNumber, quantityInvoiced, amountInvoiced) {
  const line = this.lines.find((l) => l.lineNumber === lineNumber);
  if (!line) throw new Error('Line not found');

  line.quantityInvoiced += quantityInvoiced;
  line.amountInvoiced += amountInvoiced;

  return this.save();
};

purchaseOrderSchema.methods.canBeClosed = function () {
  return this.lines.every((line) =>
    line.status === 'received' || line.status === 'closed' || line.status === 'cancelled'
  );
};

purchaseOrderSchema.methods.close = function () {
  if (!this.canBeClosed()) {
    throw new Error('Cannot close PO with open lines');
  }
  this.status = 'closed';
  return this.save();
};

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
