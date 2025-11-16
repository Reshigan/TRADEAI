const mongoose = require('mongoose');

const salesTransactionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  netAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'ZAR',
    enum: ['ZAR', 'USD', 'EUR', 'GBP']
  },
  promotion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion',
    default: null
  },
  salesRep: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    required: true,
    enum: ['Direct', 'Distributor', 'Online', 'Retail', 'Wholesale']
  },
  region: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'completed',
    enum: ['pending', 'completed', 'cancelled', 'refunded']
  },
  metadata: {
    orderNumber: String,
    invoiceNumber: String,
    paymentTerms: String,
    deliveryDate: Date,
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
salesTransactionSchema.index({ company: 1, date: -1 });
salesTransactionSchema.index({ company: 1, customer: 1, date: -1 });
salesTransactionSchema.index({ company: 1, product: 1, date: -1 });
salesTransactionSchema.index({ company: 1, promotion: 1 });

// Virtual for profit margin
salesTransactionSchema.virtual('profitMargin').get(function () {
  if (this.totalAmount > 0) {
    return ((this.netAmount - (this.unitPrice * this.quantity * 0.7)) / this.netAmount) * 100;
  }
  return 0;
});

// Static methods for analytics
salesTransactionSchema.statics.getRevenueByPeriod = function (companyId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        date: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalRevenue: { $sum: '$netAmount' },
        totalQuantity: { $sum: '$quantity' },
        transactionCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

salesTransactionSchema.statics.getTopCustomers = function (companyId, limit = 10) {
  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$customer',
        totalRevenue: { $sum: '$netAmount' },
        totalQuantity: { $sum: '$quantity' },
        transactionCount: { $sum: 1 },
        avgTransactionValue: { $avg: '$netAmount' }
      }
    },
    {
      $sort: { totalRevenue: -1 }
    },
    {
      $limit: limit
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
    }
  ]);
};

salesTransactionSchema.statics.getTopProducts = function (companyId, limit = 10) {
  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$product',
        totalRevenue: { $sum: '$netAmount' },
        totalQuantity: { $sum: '$quantity' },
        transactionCount: { $sum: 1 },
        avgPrice: { $avg: '$unitPrice' }
      }
    },
    {
      $sort: { totalRevenue: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $unwind: '$product'
    }
  ]);
};

module.exports = mongoose.model('SalesTransaction', salesTransactionSchema);
