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

module.exports = mongoose.model('Deduction', deductionSchema);
