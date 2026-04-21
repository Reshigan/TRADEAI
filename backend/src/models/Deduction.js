const mongoose = require('mongoose');

const deductionSchema = new mongoose.Schema({
  deductionNumber: {
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
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  disputeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispute'
  },
  deductionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  reason: String,
  category: {
    type: String,
    enum: ['pricing', 'promotion', 'allowance', 'shortage', 'quality', 'administrative', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'disputed', 'approved', 'rejected', 'partially_approved'],
    default: 'pending',
    index: true
  },
  approvedAmount: {
    type: Number,
    default: 0
  },
  settled: {
    type: Boolean,
    default: false
  },
  settlementDate: Date,
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
  timestamps: true
});

deductionSchema.index({ customerId: 1, deductionDate: -1 });
deductionSchema.index({ status: 1 });

// Deduction State Machine - D-07: Add state-transition guards
// ALLOWED status transitions — single source of truth
const DEDUCTION_TRANSITIONS = {
  pending:           ['matched', 'disputed', 'approved', 'rejected'],
  matched:           ['disputed', 'approved', 'partially_approved'],
  disputed:          ['matched', 'approved', 'rejected', 'partially_approved'],
  approved:          [],           // terminal
  rejected:          [],           // terminal
  partially_approved: ['approved', 'rejected'],  // can finalize
};

deductionSchema.statics.canTransition = function (from, to) {
  return (DEDUCTION_TRANSITIONS[from] || []).includes(to);
};

deductionSchema.methods.transitionTo = function (newStatus, userId, comment) {
  if (!deductionSchema.statics.canTransition(this.status, newStatus)) {
    const err = new Error(
      `Invalid deduction status transition: ${this.status} → ${newStatus}`
    );
    err.code = 'INVALID_TRANSITION';
    throw err;
  }
  const previous = this.status;
  this.status = newStatus;
  this.history = this.history || [];
  this.history.push({
    action: `status_changed:${previous}→${newStatus}`,
    performedBy: userId,
    performedDate: new Date(),
    comment,
  });
};

// D-07: Add state transition methods
deductionSchema.methods.match = function (txnId, uid) {
  this.matchedTransaction = txnId;
  this.transitionTo('matched', uid);
  return this.save();
};

deductionSchema.methods.dispute = function (reason, uid) {
  this.disputeReason = reason;
  this.transitionTo('disputed', uid, reason);
  return this.save();
};

deductionSchema.methods.approve = function (amount, uid) {
  if (amount > this.amount) throw new Error('Approved amount exceeds claimed');
  this.approvedAmount = amount;
  this.transitionTo(amount < this.amount ? 'partially_approved' : 'approved', uid);
  return this.save();
};

deductionSchema.methods.reject = function (reason, uid) {
  this.rejectionReason = reason;
  this.transitionTo('rejected', uid, reason);
  return this.save();
};

// History tracking
deductionSchema.add({
  history: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedDate: Date,
    comment: String
  }]
});

module.exports = mongoose.model('Deduction', deductionSchema);
