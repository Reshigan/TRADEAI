const mongoose = require('mongoose');

const salesTransactionSchema = new mongoose.Schema({
  tenant: {
    type: String,
    required: true,
    index: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  promotion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion'
  },
  discount: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'returned'],
    default: 'completed'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'sales_transactions'
});

salesTransactionSchema.index({ tenant: 1, date: -1 });
salesTransactionSchema.index({ tenant: 1, customer: 1 });
salesTransactionSchema.index({ tenant: 1, product: 1 });
salesTransactionSchema.index({ tenant: 1, promotion: 1 });

module.exports = mongoose.model('SalesTransaction', salesTransactionSchema);
