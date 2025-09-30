const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'Volume Discount',
      'BOGOF',
      'Price Reduction',
      'Bundle Deal',
      'Loyalty Bonus',
      'New Product Launch',
      'Seasonal Special',
      'Clearance Sale',
      'Trade Allowance',
      'Display Allowance',
      'Advertising Allowance'
    ]
  },
  status: {
    type: String,
    required: true,
    default: 'draft',
    enum: ['draft', 'pending', 'active', 'paused', 'completed', 'cancelled']
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
  customers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  budget: {
    allocated: {
      type: Number,
      required: true,
      min: 0
    },
    spent: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'ZAR',
      enum: ['ZAR', 'USD', 'EUR', 'GBP']
    }
  },
  terms: {
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    discountAmount: {
      type: Number,
      min: 0
    },
    minimumQuantity: {
      type: Number,
      min: 0
    },
    maximumQuantity: {
      type: Number,
      min: 0
    },
    conditions: [String]
  },
  metrics: {
    impressions: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    roi: {
      type: Number,
      default: 0
    },
    incrementalSales: {
      type: Number,
      default: 0
    },
    baselineSales: {
      type: Number,
      default: 0
    }
  },
  approvals: [{
    approver: {
      type: String,
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
  createdBy: {
    type: String,
    required: true
  },
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
promotionSchema.index({ company: 1, status: 1 });
promotionSchema.index({ company: 1, startDate: 1, endDate: 1 });
promotionSchema.index({ company: 1, type: 1 });

// Virtual for duration in days
promotionSchema.virtual('duration').get(function() {
  if (this.startDate && this.endDate) {
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for budget utilization percentage
promotionSchema.virtual('budgetUtilization').get(function() {
  if (this.budget.allocated > 0) {
    return (this.budget.spent / this.budget.allocated) * 100;
  }
  return 0;
});

// Virtual for ROI calculation
promotionSchema.virtual('calculatedROI').get(function() {
  if (this.budget.spent > 0 && this.metrics.revenue > 0) {
    return (this.metrics.revenue - this.budget.spent) / this.budget.spent;
  }
  return 0;
});

// Static methods for analytics
promotionSchema.statics.getActivePromotions = function(companyId, date = new Date()) {
  return this.find({
    company: companyId,
    status: 'active',
    startDate: { $lte: date },
    endDate: { $gte: date }
  }).populate('customers products');
};

promotionSchema.statics.getPromotionPerformance = function(companyId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
        status: { $in: ['active', 'completed'] }
      }
    },
    {
      $group: {
        _id: '$type',
        totalBudget: { $sum: '$budget.allocated' },
        totalSpent: { $sum: '$budget.spent' },
        totalRevenue: { $sum: '$metrics.revenue' },
        avgROI: { $avg: '$metrics.roi' },
        promotionCount: { $sum: 1 }
      }
    },
    {
      $sort: { totalRevenue: -1 }
    }
  ]);
};

promotionSchema.statics.getROIByCustomer = function(companyId) {
  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        status: { $in: ['active', 'completed'] }
      }
    },
    {
      $unwind: '$customers'
    },
    {
      $group: {
        _id: '$customers',
        totalBudget: { $sum: '$budget.allocated' },
        totalSpent: { $sum: '$budget.spent' },
        totalRevenue: { $sum: '$metrics.revenue' },
        avgROI: { $avg: '$metrics.roi' },
        promotionCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer'
      }
    },
    {
      $unwind: '$customer'
    },
    {
      $sort: { avgROI: -1 }
    }
  ]);
};

// Pre-save middleware to update status based on dates
promotionSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.status === 'active') {
    if (now < this.startDate) {
      this.status = 'pending';
    } else if (now > this.endDate) {
      this.status = 'completed';
    }
  }
  
  next();
});

module.exports = mongoose.model('Promotion', promotionSchema);