const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  currency: {
    type: String,
    required: true,
    default: 'ZAR',
    enum: ['ZAR', 'USD', 'EUR', 'GBP'],
  },
  fiscalYearStart: {
    type: Number,
    default: 1,
    min: 1,
    max: 12,
  },
  settings: {
    defaultCurrency: String,
    dateFormat: String,
    timezone: String,
    features: {
      promotions: Boolean,
      forecasting: Boolean,
      aiInsights: Boolean,
      simulation: Boolean,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Company', companySchema);
