const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  
  approvalId: {
    type: String,
    required: true,
    unique: true
  },
  
  entityType: {
    type: String,
    enum: ['promotion', 'trade_spend', 'budget', 'trading_term', 'claim', 'deduction'],
    required: true
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  requestedAt: {
    type: Date,
    default: Date.now
  },
  
  amount: {
    type: Number,
    required: true
  },
  
  currency: {
    type: String,
    default: 'ZAR'
  },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'expired'],
    default: 'pending',
    index: true
  },
  
  currentApprovalLevel: {
    type: Number,
    default: 1
  },
  
  approvalChain: [{
    level: Number,
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approverRole: String,
    requiredBy: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'skipped'],
      default: 'pending'
    },
    approvedAt: Date,
    comments: String,
    decision: String
  }],
  
  policyRules: [{
    ruleId: String,
    ruleName: String,
    threshold: Number,
    condition: String,
    result: String
  }],
  
  sla: {
    dueDate: Date,
    escalationDate: Date,
    isOverdue: {
      type: Boolean,
      default: false
    }
  },
  
  metadata: {
    description: String,
    justification: String,
    attachments: [String],
    tags: [String]
  },
  
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

approvalSchema.index({ company: 1, status: 1 });
approvalSchema.index({ company: 1, entityType: 1, entityId: 1 });
approvalSchema.index({ 'approvalChain.approver': 1, status: 1 });

approvalSchema.methods.approve = async function(approverId, comments) {
  const currentLevel = this.approvalChain.find(
    chain => chain.level === this.currentApprovalLevel
  );
  
  if (!currentLevel) {
    throw new Error('Invalid approval level');
  }
  
  if (currentLevel.approver.toString() !== approverId.toString()) {
    throw new Error('User not authorized to approve at this level');
  }
  
  currentLevel.status = 'approved';
  currentLevel.approvedAt = new Date();
  currentLevel.comments = comments;
  
  this.auditTrail.push({
    action: 'approved',
    performedBy: approverId,
    details: { level: this.currentApprovalLevel, comments }
  });
  
  if (this.currentApprovalLevel < this.approvalChain.length) {
    this.currentApprovalLevel += 1;
  } else {
    this.status = 'approved';
  }
  
  await this.save();
  return this;
};

approvalSchema.methods.reject = async function(approverId, reason) {
  const currentLevel = this.approvalChain.find(
    chain => chain.level === this.currentApprovalLevel
  );
  
  if (!currentLevel) {
    throw new Error('Invalid approval level');
  }
  
  if (currentLevel.approver.toString() !== approverId.toString()) {
    throw new Error('User not authorized to reject at this level');
  }
  
  currentLevel.status = 'rejected';
  currentLevel.approvedAt = new Date();
  currentLevel.comments = reason;
  currentLevel.decision = 'rejected';
  
  this.status = 'rejected';
  
  this.auditTrail.push({
    action: 'rejected',
    performedBy: approverId,
    details: { level: this.currentApprovalLevel, reason }
  });
  
  await this.save();
  return this;
};

approvalSchema.methods.cancel = async function(userId, reason) {
  if (this.requestedBy.toString() !== userId.toString()) {
    throw new Error('Only the requester can cancel the approval');
  }
  
  this.status = 'cancelled';
  
  this.auditTrail.push({
    action: 'cancelled',
    performedBy: userId,
    details: { reason }
  });
  
  await this.save();
  return this;
};

approvalSchema.methods.checkSLA = function() {
  if (this.sla.dueDate && new Date() > this.sla.dueDate) {
    this.sla.isOverdue = true;
  }
  return this.sla.isOverdue;
};

approvalSchema.statics.findPendingForApprover = function(approverId) {
  return this.find({
    status: 'pending',
    'approvalChain.approver': approverId,
    'approvalChain.status': 'pending'
  }).populate('requestedBy', 'name email')
    .populate('approvalChain.approver', 'name email role');
};

approvalSchema.statics.findOverdue = function(tenantId) {
  return this.find({
    company: tenantId,
    status: 'pending',
    'sla.dueDate': { $lt: new Date() }
  });
};

module.exports = mongoose.model('Approval', approvalSchema);
