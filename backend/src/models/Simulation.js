const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const simulationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  type: {
    type: String,
    required: true,
    enum: [
      'promotion_impact',
      'budget_allocation',
      'pricing_strategy',
      'volume_projection',
      'market_share',
      'roi_optimization',
      'what_if',
      'comparison'
    ],
    index: true
  },

  scenario: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  results: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  parameters: {
    dateRange: {
      start: Date,
      end: Date
    },
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    customers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    }],
    promotions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion'
    }],
    budgets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Budget'
    }],
    customParameters: mongoose.Schema.Types.Mixed
  },

  metrics: {
    roi: Number,
    revenue: Number,
    cost: Number,
    profit: Number,
    volume: Number,
    marketShare: Number,
    uplift: Number,
    confidence: Number
  },

  status: {
    type: String,
    enum: ['draft', 'completed', 'archived'],
    default: 'completed',
    index: true
  },

  isFavorite: {
    type: Boolean,
    default: false
  },

  tags: [String],

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],

  executionTime: Number,

  version: {
    type: Number,
    default: 1
  },

  parentSimulation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Simulation'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

addTenantSupport(simulationSchema);

simulationSchema.index({ tenantId: 1, type: 1, createdAt: -1 });
simulationSchema.index({ tenantId: 1, createdBy: 1, createdAt: -1 });
simulationSchema.index({ companyId: 1, status: 1, createdAt: -1 });
simulationSchema.index({ companyId: 1, type: 1, status: 1 });

simulationSchema.statics.getSavedSimulations = function(companyId, userId, options = {}) {
  const { type, status, limit = 50, page = 1 } = options;
  
  const query = {
    companyId,
    $or: [
      { createdBy: userId },
      { 'sharedWith.user': userId }
    ]
  };
  
  if (type) query.type = type;
  if (status) query.status = status;
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('createdBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

simulationSchema.methods.canUserAccess = function(userId) {
  if (this.createdBy.toString() === userId.toString()) return true;
  return this.sharedWith.some(share => share.user.toString() === userId.toString());
};

simulationSchema.methods.canUserEdit = function(userId) {
  if (this.createdBy.toString() === userId.toString()) return true;
  const share = this.sharedWith.find(s => s.user.toString() === userId.toString());
  return share && share.permission === 'edit';
};

const Simulation = mongoose.model('Simulation', simulationSchema);

module.exports = Simulation;
