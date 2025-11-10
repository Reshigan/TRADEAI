const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  pricing: {
    cost: Number,
    price: Number,
    currency: String,
  },
  inventory: {
    unit: String,
    stockLevel: Number,
    reorderPoint: Number,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  categoryData: {
    seasonalPeak: [Number],
    growthRate: Number,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
