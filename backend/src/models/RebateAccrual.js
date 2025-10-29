const mongoose = require('mongoose');

const rebateAccrualSchema = new mongoose.Schema({
  rebate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rebate',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  
  // Period
  period: {
    type: String,
    required: true  // e.g., "2025-Q1", "2025-01"
  },
  periodStart: Date,
  periodEnd: Date,
  
  // Amounts
  baseAmount: {
    type: Number,
    required: true,
    default: 0
  },
  rebateAmount: {
    type: Number,
    required: true,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'cancelled'],
    default: 'pending'
  },
  
  // Related transactions
  transactions: [{
    transactionId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    rebateAmount: Number,
    date: Date
  }],
  
  // Settlement
  settlementDate: Date,
  settlementReference: String,
  paymentMethod: String,
  
  // Approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  notes: String
}, {
  timestamps: true
});

// Pre-save hook to calculate remaining amount
rebateAccrualSchema.pre('save', function(next) {
  this.remainingAmount = this.rebateAmount - this.paidAmount;
  next();
});

module.exports = mongoose.model('RebateAccrual', rebateAccrualSchema);
