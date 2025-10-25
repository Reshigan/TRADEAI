const mongoose = require('mongoose');

const disputeActivitySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  action: {
    type: String,
    required: true,
    enum: ['created', 'assigned', 'commented', 'escalated', 'resolved', 'closed', 'reopened', 'approved', 'rejected']
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: String,
  oldValue: String,
  newValue: String
});

const disputeSchema = new mongoose.Schema({
  disputeNumber: {
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
  disputeType: {
    type: String,
    enum: ['deduction', 'invoice', 'payment', 'pricing', 'quantity', 'quality', 'damaged_goods', 'late_delivery', 'missing_items', 'other'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['pricing', 'promotion', 'allowance', 'shortage', 'quality', 'administrative', 'other'],
    required: true
  },
  // Related documents
  deductionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deduction'
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  disputedAmount: Number,
  approvedAmount: {
    type: Number,
    default: 0
  },
  rejectedAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['open', 'in_review', 'pending_approval', 'pending_vendor', 'pending_customer', 'escalated', 'resolved', 'closed', 'rejected'],
    default: 'open',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDate: Date,
  team: String,
  // SLA tracking
  sla: {
    responseTime: {
      type: Number, // hours
      default: 24
    },
    resolutionTime: {
      type: Number, // hours
      default: 72
    },
    responseDeadline: Date,
    resolutionDeadline: Date,
    responseOverdue: {
      type: Boolean,
      default: false
    },
    resolutionOverdue: {
      type: Boolean,
      default: false
    }
  },
  // Resolution
  resolution: {
    type: String,
    enum: ['approved', 'partially_approved', 'rejected', 'withdrawn', 'escalated_to_legal'],
    default: null
  },
  resolutionDate: Date,
  resolutionNotes: String,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Root cause
  rootCause: {
    type: String,
    enum: ['pricing_error', 'system_error', 'processing_error', 'communication_error', 'documentation_missing', 'contractual_dispute', 'quality_issue', 'other']
  },
  rootCauseNotes: String,
  // Chargeback
  chargebackInitiated: {
    type: Boolean,
    default: false
  },
  chargebackDate: Date,
  chargebackReference: String,
  // Documents
  attachments: [{
    filename: String,
    url: String,
    type: String,
    description: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Activity log
  activities: [disputeActivitySchema],
  // Comments
  comments: [{
    date: {
      type: Date,
      default: Date.now
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true
    },
    internal: {
      type: Boolean,
      default: false
    }
  }],
  // Escalation
  escalated: {
    type: Boolean,
    default: false
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalatedAt: Date,
  escalationReason: String,
  // Notifications
  notifications: [{
    date: Date,
    type: String,
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sent: Boolean
  }],
  tags: [String],
  internalNotes: String,
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
disputeSchema.index({ customerId: 1, status: 1 });
disputeSchema.index({ assignedTo: 1, status: 1 });
disputeSchema.index({ status: 1, priority: 1 });
disputeSchema.index({ createdAt: -1 });
disputeSchema.index({ 'sla.responseOverdue': 1 });
disputeSchema.index({ 'sla.resolutionOverdue': 1 });

// Virtuals
disputeSchema.virtual('age').get(function() {
  const now = new Date();
  const created = this.createdAt || now;
  return Math.floor((now - created) / (1000 * 60 * 60)); // hours
});

disputeSchema.virtual('daysOpen').get(function() {
  return Math.floor(this.age / 24);
});

disputeSchema.virtual('responseTimeRemaining').get(function() {
  if (!this.sla.responseDeadline) return null;
  const now = new Date();
  const hours = (this.sla.responseDeadline - now) / (1000 * 60 * 60);
  return Math.max(0, Math.floor(hours));
});

disputeSchema.virtual('resolutionTimeRemaining').get(function() {
  if (!this.sla.resolutionDeadline) return null;
  const now = new Date();
  const hours = (this.sla.resolutionDeadline - now) / (1000 * 60 * 60);
  return Math.max(0, Math.floor(hours));
});

// Pre-save middleware
disputeSchema.pre('save', function(next) {
  // Calculate SLA deadlines if not set
  if (!this.sla.responseDeadline && this.createdAt) {
    this.sla.responseDeadline = new Date(this.createdAt.getTime() + (this.sla.responseTime * 60 * 60 * 1000));
  }

  if (!this.sla.resolutionDeadline && this.createdAt) {
    this.sla.resolutionDeadline = new Date(this.createdAt.getTime() + (this.sla.resolutionTime * 60 * 60 * 1000));
  }

  // Check SLA overdue
  const now = new Date();
  if (this.sla.responseDeadline && now > this.sla.responseDeadline && this.status === 'open') {
    this.sla.responseOverdue = true;
  }

  if (this.sla.resolutionDeadline && now > this.sla.resolutionDeadline && 
      !['resolved', 'closed', 'rejected'].includes(this.status)) {
    this.sla.resolutionOverdue = true;
  }

  next();
});

// Methods
disputeSchema.methods.assign = function(userId) {
  this.assignedTo = userId;
  this.assignedDate = new Date();
  this.status = 'in_review';
  
  this.activities.push({
    date: new Date(),
    action: 'assigned',
    performedBy: userId,
    newValue: userId.toString()
  });

  return this.save();
};

disputeSchema.methods.addComment = function(userId, comment, internal = false) {
  this.comments.push({
    date: new Date(),
    userId: userId,
    comment: comment,
    internal: internal
  });

  this.activities.push({
    date: new Date(),
    action: 'commented',
    performedBy: userId,
    comment: comment
  });

  return this.save();
};

disputeSchema.methods.escalate = function(userId, toUserId, reason) {
  this.escalated = true;
  this.escalatedTo = toUserId;
  this.escalatedAt = new Date();
  this.escalationReason = reason;
  this.status = 'escalated';
  this.priority = 'high';

  this.activities.push({
    date: new Date(),
    action: 'escalated',
    performedBy: userId,
    comment: reason,
    newValue: toUserId.toString()
  });

  return this.save();
};

disputeSchema.methods.resolve = function(userId, resolution, approvedAmount, notes) {
  this.status = 'resolved';
  this.resolution = resolution;
  this.resolutionDate = new Date();
  this.resolutionNotes = notes;
  this.resolvedBy = userId;
  this.approvedAmount = approvedAmount || 0;
  this.rejectedAmount = this.amount - this.approvedAmount;

  this.activities.push({
    date: new Date(),
    action: 'resolved',
    performedBy: userId,
    comment: notes,
    newValue: resolution
  });

  return this.save();
};

disputeSchema.methods.close = function(userId) {
  if (this.status !== 'resolved') {
    throw new Error('Only resolved disputes can be closed');
  }

  this.status = 'closed';

  this.activities.push({
    date: new Date(),
    action: 'closed',
    performedBy: userId
  });

  return this.save();
};

disputeSchema.methods.reopen = function(userId, reason) {
  if (this.status !== 'closed') {
    throw new Error('Only closed disputes can be reopened');
  }

  this.status = 'open';
  this.resolution = null;
  this.resolutionDate = null;

  this.activities.push({
    date: new Date(),
    action: 'reopened',
    performedBy: userId,
    comment: reason
  });

  return this.save();
};

disputeSchema.methods.initiateChargeback = function(reference) {
  this.chargebackInitiated = true;
  this.chargebackDate = new Date();
  this.chargebackReference = reference;
  return this.save();
};

// Statics
disputeSchema.statics.getOverdueDisputes = function() {
  return this.find({
    $or: [
      { 'sla.responseOverdue': true },
      { 'sla.resolutionOverdue': true }
    ],
    status: { $nin: ['resolved', 'closed'] }
  }).populate('customerId assignedTo');
};

disputeSchema.statics.getDisputesByStatus = function(status) {
  return this.find({ status }).populate('customerId assignedTo');
};

disputeSchema.statics.getAssignedDisputes = function(userId) {
  return this.find({
    assignedTo: userId,
    status: { $nin: ['resolved', 'closed'] }
  }).populate('customerId');
};

module.exports = mongoose.model('Dispute', disputeSchema);
