const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Marketing',
      'Trade Spend',
      'Promotions',
      'Digital',
      'Events',
      'Advertising',
      'Public Relations',
      'Sponsorship',
      'Research',
      'Other'
    ]
  },
  fiscalYear: {
    type: Number,
    required: true,
    index: true
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  totalBudget: {
    type: Number,
    required: true,
    min: 0
  },
  allocated: {
    type: Number,
    default: 0,
    min: 0
  },
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  remaining: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'ZAR',
    enum: ['ZAR', 'USD', 'EUR', 'GBP']
  },
  status: {
    type: String,
    required: true,
    default: 'draft',
    enum: ['draft', 'pending', 'approved', 'active', 'completed', 'cancelled']
  },
  departments: [{
    name: String,
    allocation: Number,
    spent: {
      type: Number,
      default: 0
    }
  }],
  approvals: [{
    approver: {
      type: String,
      required: true
    },
    approvedAmount: {
      type: Number,
      required: true
    },
    approvedDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected']
    },
    comments: String
  }],
  allocations: [{
    description: String,
    amount: Number,
    date: Date,
    category: String,
    approvedBy: String
  }],
  expenses: [{
    description: String,
    amount: Number,
    date: Date,
    category: String,
    vendor: String,
    invoiceNumber: String,
    approvedBy: String
  }],
  forecasts: [{
    month: Number,
    year: Number,
    predictedSpend: Number,
    actualSpend: {
      type: Number,
      default: 0
    },
    variance: {
      type: Number,
      default: 0
    }
  }],
  kpis: {
    utilizationRate: {
      type: Number,
      default: 0
    },
    burnRate: {
      type: Number,
      default: 0
    },
    projectedOverrun: {
      type: Number,
      default: 0
    },
    roi: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: String,
    required: true
  },
  tags: [String],
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
budgetSchema.index({ company: 1, fiscalYear: 1 });
budgetSchema.index({ company: 1, category: 1 });
budgetSchema.index({ company: 1, status: 1 });

// Virtual for utilization percentage
budgetSchema.virtual('utilizationPercentage').get(function() {
  if (this.totalBudget > 0) {
    return (this.spent / this.totalBudget) * 100;
  }
  return 0;
});

// Virtual for allocation percentage
budgetSchema.virtual('allocationPercentage').get(function() {
  if (this.totalBudget > 0) {
    return (this.allocated / this.totalBudget) * 100;
  }
  return 0;
});

// Virtual for remaining percentage
budgetSchema.virtual('remainingPercentage').get(function() {
  if (this.totalBudget > 0) {
    return ((this.totalBudget - this.spent) / this.totalBudget) * 100;
  }
  return 0;
});

// Virtual for burn rate (monthly)
budgetSchema.virtual('monthlyBurnRate').get(function() {
  const now = new Date();
  const monthsElapsed = Math.max(1, (now - this.startDate) / (1000 * 60 * 60 * 24 * 30));
  return this.spent / monthsElapsed;
});

// Static methods for analytics
budgetSchema.statics.getBudgetSummary = function(companyId, fiscalYear) {
  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        fiscalYear: fiscalYear
      }
    },
    {
      $group: {
        _id: '$category',
        totalBudget: { $sum: '$totalBudget' },
        totalAllocated: { $sum: '$allocated' },
        totalSpent: { $sum: '$spent' },
        budgetCount: { $sum: 1 },
        avgUtilization: { $avg: { $divide: ['$spent', '$totalBudget'] } }
      }
    },
    {
      $sort: { totalBudget: -1 }
    }
  ]);
};

budgetSchema.statics.getUtilizationTrend = function(companyId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        startDate: { $gte: startDate },
        endDate: { $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$startDate' },
          month: { $month: '$startDate' }
        },
        totalBudget: { $sum: '$totalBudget' },
        totalSpent: { $sum: '$spent' },
        utilizationRate: { $avg: { $divide: ['$spent', '$totalBudget'] } }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

budgetSchema.statics.getTopSpendingCategories = function(companyId, limit = 5) {
  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId)
      }
    },
    {
      $group: {
        _id: '$category',
        totalSpent: { $sum: '$spent' },
        totalBudget: { $sum: '$totalBudget' },
        utilizationRate: { $avg: { $divide: ['$spent', '$totalBudget'] } },
        budgetCount: { $sum: 1 }
      }
    },
    {
      $sort: { totalSpent: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Pre-save middleware to calculate remaining amount
budgetSchema.pre('save', function(next) {
  this.remaining = Math.max(0, this.totalBudget - this.spent);
  
  // Update KPIs
  this.kpis.utilizationRate = this.utilizationPercentage;
  
  // Calculate burn rate
  const now = new Date();
  const daysElapsed = Math.max(1, (now - this.startDate) / (1000 * 60 * 60 * 24));
  this.kpis.burnRate = this.spent / daysElapsed;
  
  // Project overrun
  const totalDays = (this.endDate - this.startDate) / (1000 * 60 * 60 * 24);
  const projectedSpend = this.kpis.burnRate * totalDays;
  this.kpis.projectedOverrun = Math.max(0, projectedSpend - this.totalBudget);
  
  next();
});

module.exports = mongoose.model('Budget', budgetSchema);