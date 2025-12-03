const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const employeeSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  
  // Azure AD Reference
  azureAdId: {
    type: String,
    index: true
  },
  
  // Basic Information
  employeeId: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
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
  displayName: String,
  
  // Job Information
  jobTitle: String,
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  departmentName: String, // Denormalized for quick access
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  managerEmail: String,
  
  // Contact Information
  phone: String,
  mobilePhone: String,
  officeLocation: String,
  
  // Employment Details
  employmentType: {
    type: String,
    enum: ['full_time', 'part_time', 'contractor', 'intern', 'temporary'],
    default: 'full_time'
  },
  startDate: Date,
  endDate: Date,
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'terminated'],
    default: 'active'
  },
  
  // Linked User Account
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userProvisioned: { type: Boolean, default: false },
  userProvisionedAt: Date,
  
  // Sync Information
  source: {
    type: String,
    enum: ['azure_ad', 'manual', 'csv_import', 'api'],
    default: 'manual'
  },
  lastSyncedAt: Date,
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'error', 'not_synced'],
    default: 'not_synced'
  },
  
  // Additional Azure AD Data
  azureAdData: mongoose.Schema.Types.Mixed,
  
  // Custom Fields
  customFields: mongoose.Schema.Types.Mixed,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
employeeSchema.index({ companyId: 1, email: 1 }, { unique: true });
employeeSchema.index({ companyId: 1, employeeId: 1 }, { unique: true });
employeeSchema.index({ companyId: 1, azureAdId: 1 });
employeeSchema.index({ companyId: 1, department: 1 });
employeeSchema.index({ companyId: 1, status: 1 });

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for direct reports
employeeSchema.virtual('directReports', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'manager'
});

// Method to provision user account
employeeSchema.methods.provisionUser = async function(role = 'user', department = 'sales') {
  const User = mongoose.model('User');
  
  // Check if user already exists
  let user = await User.findOne({ email: this.email });
  
  if (!user) {
    // Create new user
    user = await User.create({
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      employeeId: this.employeeId,
      role,
      department,
      companyId: this.companyId,
      password: Math.random().toString(36).slice(-12) + 'A1!', // Temporary password
      isActive: true
    });
  }
  
  this.userId = user._id;
  this.userProvisioned = true;
  this.userProvisionedAt = new Date();
  
  return this.save();
};

addTenantSupport(employeeSchema);

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

module.exports = Employee;
