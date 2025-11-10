const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['sale', 'return', 'adjustment'],
    default: 'sale',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending',
  },
  date: {
    type: Date,
    required: true,
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productName: String,
    sku: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number,
  }],
  totals: {
    subtotal: Number,
    tax: Number,
    total: Number,
  },
  currency: {
    type: String,
    default: 'ZAR',
  },
  paymentMethod: {
    type: String,
    enum: ['invoice', 'cash', 'card', 'transfer'],
    default: 'invoice',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Transaction', transactionSchema);
