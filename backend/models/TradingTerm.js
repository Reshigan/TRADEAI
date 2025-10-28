const mongoose = require('mongoose');

const tradingTermSchema = new mongoose.Schema({
  termId: {
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
  termType: {
    type: String,
    enum: ['Volume Discount', 'Growth Incentive', 'Listing Fee', 'Annual Rebate', 'Promotional Support', 'Marketing Fund', 'Distribution Support'],
    required: true
  },
  description: String,
  paymentTerms: {
    type: String,
    enum: ['Immediate', 'Net 30', 'Net 60', 'Net 90', 'Quarterly', 'Annual'],
    default: 'Net 30'
  },
  value: {
    type: Number,
    required: true
  },
  valueType: {
    type: String,
    enum: ['Percentage', 'Fixed Amount'],
    default: 'Percentage'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Pending', 'Expired', 'Cancelled'],
    default: 'Active'
  },
  targetVolume: Number,
  actualVolume: {
    type: Number,
    default: 0
  },
  estimatedPayout: Number,
  actualPayout: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  notes: String,
  createdBy: String,
  approvedBy: String,
  approvedDate: Date
}, {
  timestamps: true
});

tradingTermSchema.index({ customer: 1, status: 1 });
tradingTermSchema.index({ startDate: 1, endDate: 1 });
tradingTermSchema.index({ termType: 1 });

module.exports = mongoose.model('TradingTerm', tradingTermSchema);
