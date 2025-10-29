const mongoose = require('mongoose');

const tradeSpendSchema = new mongoose.Schema({
  spendId: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productName: String,
  spendType: {
    type: String,
    enum: ['Trade Promotion', 'Volume Discount', 'Slotting Fee', 'Display Allowance', 'Marketing Co-op', 'Rebate', 'Sample & Demo', 'Freight Allowance'],
    required: true
  },
  category: {
    type: String,
    enum: ['Promotional', 'Non-Promotional', 'Fixed', 'Variable'],
    default: 'Promotional'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  spendDate: {
    type: Date,
    required: true
  },
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['Planned', 'Approved', 'Active', 'Completed', 'Cancelled'],
    default: 'Planned'
  },
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget'
  },
  promotion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion'
  },
  expectedROI: Number,
  actualROI: Number,
  expectedVolume: Number,
  actualVolume: Number,
  description: String,
  notes: String,
  createdBy: String,
  approvedBy: String,
  approvedDate: Date
}, {
  timestamps: true
});

tradeSpendSchema.index({ customer: 1, status: 1 });
tradeSpendSchema.index({ spendDate: 1 });
tradeSpendSchema.index({ spendType: 1, category: 1 });
tradeSpendSchema.index({ promotion: 1 });

module.exports = mongoose.model('TradeSpend', tradeSpendSchema);
