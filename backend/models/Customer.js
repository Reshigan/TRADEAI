const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: true,
    enum: ['National Retailer', 'Regional Chain', 'Independent Store', 'Wholesaler', 'Other'],
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active',
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  contact: {
    email: String,
    phone: String,
    contactPerson: String,
  },
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
    country: String,
  },
  paymentTerms: {
    terms: String,
    creditLimit: Number,
  },
  avgOrderValue: {
    type: Number,
    default: 0,
  },
  orderFrequency: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Customer', customerSchema);
