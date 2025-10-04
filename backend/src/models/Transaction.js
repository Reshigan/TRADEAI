const mongoose = require('mongoose');

/**
 * Transaction Model
 * Represents a business transaction (order, trade deal, settlement, etc.)
 */

const transactionSchema = new mongoose.Schema({
  // Basic Information
  transactionNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['order', 'trade_deal', 'settlement', 'payment', 'accrual', 'deduction']
  },
  status: {
    type: String,
    required: true,
    enum: [
      'draft',
      'pending_approval',
      'approved',
      'rejected',
      'processing',
      'completed',
      'cancelled',
      'failed',
      'on_hold'
    ],
    default: 'draft'
  },

  // Parties Involved
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
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

  // Financial Information
  currency: {
    type: String,
    default: 'USD'
  },
  amount: {
    gross: {
      type: Number,
      required: true
    },
    net: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    }
  },

  // Line Items
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    sku: String,
    description: String,
    quantity: {
      type: Number,
      required: true
    },
    unitPrice: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  }],

  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['credit', 'debit', 'wire_transfer', 'check', 'cash', 'credit_memo']
    },
    terms: {
      type: String,
      enum: ['net_30', 'net_60', 'net_90', 'cod', 'prepaid', 'custom']
    },
    dueDate: Date,
    paidDate: Date,
    paidAmount: Number,
    referenceNumber: String
  },

  // Fulfillment Information
  fulfillment: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    trackingNumber: String,
    shippedDate: Date,
    deliveredDate: Date,
    carrier: String
  },

  // Associated Records
  promotionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion'
  },
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget'
  },
  contractId: String,

  // Workflow Information
  workflow: {
    currentStep: Number,
    totalSteps: Number,
    approvers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: String,
      action: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'delegated']
      },
      actionDate: Date,
      comments: String,
      level: Number
    }],
    completedDate: Date
  },

  // Settlement Information (for trade deals)
  settlement: {
    scheduledDate: Date,
    completedDate: Date,
    method: String,
    referenceNumber: String,
    reconciledDate: Date,
    reconciledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Documents
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date
  }],

  // Notes and Comments
  notes: [{
    text: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  }],

  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,

  // Dates
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  effectiveDate: Date,
  expiryDate: Date,

  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
transactionSchema.index({ tenantId: 1, customerId: 1, transactionDate: -1 });
transactionSchema.index({ status: 1, transactionType: 1 });
transactionSchema.index({ 'workflow.approvers.userId': 1, 'workflow.approvers.action': 1 });

// Virtual for customer details
transactionSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to generate transaction number
transactionSchema.pre('save', async function(next) {
  if (this.isNew && !this.transactionNumber) {
    const prefix = this.transactionType.toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.transactionNumber = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

// Instance method to calculate totals
transactionSchema.methods.calculateTotals = function() {
  let gross = 0;
  let discount = 0;
  let tax = 0;

  this.items.forEach(item => {
    gross += item.quantity * item.unitPrice;
    discount += item.discount || 0;
    tax += item.tax || 0;
  });

  this.amount.gross = gross;
  this.amount.discount = discount;
  this.amount.tax = tax;
  this.amount.net = gross - discount + tax;
};

// Instance method to approve transaction
transactionSchema.methods.approve = async function(userId, comments) {
  const approver = this.workflow.approvers.find(a => 
    a.userId.toString() === userId.toString() && a.action === 'pending'
  );

  if (!approver) {
    throw new Error('User is not an approver or already acted');
  }

  approver.action = 'approved';
  approver.actionDate = new Date();
  approver.comments = comments;

  // Check if all approvers have approved
  const allApproved = this.workflow.approvers.every(a => a.action === 'approved');

  if (allApproved) {
    this.status = 'approved';
    this.approvedBy = userId;
    this.approvedAt = new Date();
    this.workflow.completedDate = new Date();
  }

  await this.save();
};

// Instance method to reject transaction
transactionSchema.methods.reject = async function(userId, comments) {
  const approver = this.workflow.approvers.find(a => 
    a.userId.toString() === userId.toString() && a.action === 'pending'
  );

  if (!approver) {
    throw new Error('User is not an approver or already acted');
  }

  approver.action = 'rejected';
  approver.actionDate = new Date();
  approver.comments = comments;

  this.status = 'rejected';
  this.workflow.completedDate = new Date();

  await this.save();
};

// Static method to get pending approvals for a user
transactionSchema.statics.getPendingApprovals = function(userId) {
  return this.find({
    'workflow.approvers': {
      $elemMatch: {
        userId: userId,
        action: 'pending'
      }
    },
    status: 'pending_approval'
  });
};

module.exports = mongoose.model('Transaction', transactionSchema);
