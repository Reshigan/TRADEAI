const mongoose = require('mongoose');

const reportDefinitionSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    required: true,
    enum: ['financial', 'operational', 'performance', 'compliance', 'custom'],
    index: true
  },

  module: {
    type: String,
    required: true,
    enum: ['budget', 'promotion', 'tradeSpend', 'tradingTerm', 'activityGrid', 'claim', 'deduction', 'kamWallet', 'campaign', 'customer', 'product', 'all'],
    index: true
  },
  dataSource: {
    collection: String,
    query: mongoose.Schema.Types.Mixed,
    aggregation: [mongoose.Schema.Types.Mixed]
  },

  columns: [{
    field: String,
    header: String,
    type: {
      type: String,
      enum: ['string', 'number', 'currency', 'percentage', 'date', 'boolean']
    },
    format: String,
    width: Number
  }],

  // Filters
  filters: [{
    field: String,
    label: String,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'select', 'multiselect']
    },
    options: [mongoose.Schema.Types.Mixed],
    required: Boolean
  }],

  defaultSort: {
    field: String,
    order: {
      type: String,
      enum: ['asc', 'desc']
    }
  },
  groupBy: [String],

  outputFormats: [{
    type: String,
    enum: ['csv', 'xlsx', 'pdf', 'json']
  }],

  // Scheduling
  schedule: {
    enabled: Boolean,
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly']
    },
    dayOfWeek: Number,
    dayOfMonth: Number,
    time: String
  },

  isPublic: {
    type: Boolean,
    default: false
  },
  allowedRoles: [{
    type: String,
    enum: ['super_admin', 'admin', 'manager', 'kam', 'analyst', 'user']
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Metadata
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
reportDefinitionSchema.index({ module: 1, category: 1 });
reportDefinitionSchema.index({ createdBy: 1 });
reportDefinitionSchema.index({ isActive: 1 });

const ReportDefinition = mongoose.model('ReportDefinition', reportDefinitionSchema);

module.exports = ReportDefinition;
