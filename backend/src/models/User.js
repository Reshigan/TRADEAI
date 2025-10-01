const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { addTenantSupport } = require('./BaseTenantModel');

const userSchema = new mongoose.Schema({
  // Tenant Association - CRITICAL for multi-tenant isolation
  // Note: tenantId will be added by addTenantSupport()
  
  // Legacy company support (will be migrated to tenant)
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  employeeId: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'manager', 'kam', 'analyst', 'user'],
    required: true,
    default: 'user'
  },
  department: {
    type: String,
    enum: ['sales', 'marketing', 'finance', 'operations', 'admin'],
    required: true
  },
  permissions: [{
    module: String,
    actions: [String]
  }],
  // TEMPORARILY COMMENTED OUT FOR DEBUGGING
  // assignedCustomers: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Customer'
  // }],
  // assignedProducts: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Product'
  // }],
  // assignedVendors: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Vendor'
  // }],
  cashCoopWallet: {
    allocated: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  approvalLimits: {
    marketing: { type: Number, default: 0 },
    cashCoop: { type: Number, default: 0 },
    tradingTerms: { type: Number, default: 0 },
    promotions: { type: Number, default: 0 }
  },
  // TEMPORARILY COMMENTED OUT FOR DEBUGGING
  // manager: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User'
  // },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Africa/Johannesburg' },
    currency: { type: String, default: 'ZAR' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    notifications: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  sapUserId: String,
  integrationTokens: [{
    system: String,
    token: String,
    expiresAt: Date
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: false },
  toObject: { virtuals: false }
});

// Indexes - Company-specific indexes for multi-tenant isolation
userSchema.index({ companyId: 1, email: 1 }, { unique: true, sparse: true });
userSchema.index({ companyId: 1, employeeId: 1 }, { unique: true, sparse: true });
userSchema.index({ companyId: 1, role: 1 });
userSchema.index({ companyId: 1, department: 1 });
userSchema.index({ companyId: 1, isActive: 1 });
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = Date.now() - 1000;
    next();
  } catch (error) {
    next(error);
  }
});

// Update available wallet balance
userSchema.pre('save', function(next) {
  if (this.isModified('cashCoopWallet.allocated') || this.isModified('cashCoopWallet.spent')) {
    this.cashCoopWallet.available = this.cashCoopWallet.allocated - this.cashCoopWallet.spent;
  }
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign(
    { 
      _id: this._id, 
      email: this.email, 
      role: this.role,
      department: this.department,
      tenantId: this.tenantId,
      companyId: this.companyId // Legacy support
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
  return token;
};

userSchema.methods.hasPermission = function(module, action) {
  // Super admin and admin have all permissions
  if (this.role === 'super_admin' || this.role === 'admin') return true;
  
  // Check specific permissions
  const permission = this.permissions.find(p => p.module === module);
  return permission && permission.actions.includes(action);
};

userSchema.methods.canApprove = function(type, amount) {
  const limit = this.approvalLimits[type] || 0;
  return limit >= amount || this.role === 'super_admin' || this.role === 'admin';
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Static methods
userSchema.statics.findByCredentials = async function(email, password, companyId = null) {
  const query = { email, isActive: true };
  // TEMPORARILY COMMENTED OUT FOR DEBUGGING
  // if (companyId) {
  //   query.company = companyId;
  // }
  
  const user = await this.findOne(query);
  if (!user) {
    throw new Error('Invalid login credentials');
  }
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid login credentials');
  }
  
  return user;
};

// Add tenant support to the schema
addTenantSupport(userSchema);

const User = mongoose.model('User', userSchema);

// Check if we should use mock database
const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'mock';

if (USE_MOCK_DB) {
  const { MockUser } = require('../services/mockDatabase');
  module.exports = MockUser;
} else {
  module.exports = User;
}