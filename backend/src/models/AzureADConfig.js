const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const azureADConfigSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    unique: true,
    index: true
  },
  
  // Azure AD Configuration
  tenantId: {
    type: String,
    required: true,
    trim: true
  },
  clientId: {
    type: String,
    required: true,
    trim: true
  },
  clientSecret: {
    type: String,
    trim: true
    // In production, this should be encrypted
  },
  directoryId: {
    type: String,
    trim: true
  },
  
  // Connection Status
  connectionStatus: {
    type: String,
    enum: ['not_configured', 'configured', 'connected', 'error', 'disconnected'],
    default: 'not_configured'
  },
  lastConnectionTest: Date,
  connectionError: String,
  
  // Sync Configuration
  syncEnabled: { type: Boolean, default: false },
  syncSchedule: {
    type: String,
    enum: ['manual', 'hourly', 'daily', 'weekly'],
    default: 'daily'
  },
  syncTime: { type: String, default: '02:00' }, // Time for scheduled sync
  
  // Sync Filters
  syncFilters: {
    includeDepartments: [String],
    excludeDepartments: [String],
    includeGroups: [String],
    excludeGroups: [String],
    userFilter: String // OData filter expression
  },
  
  // Field Mappings
  fieldMappings: {
    firstName: { type: String, default: 'givenName' },
    lastName: { type: String, default: 'surname' },
    email: { type: String, default: 'mail' },
    employeeId: { type: String, default: 'employeeId' },
    department: { type: String, default: 'department' },
    jobTitle: { type: String, default: 'jobTitle' },
    manager: { type: String, default: 'manager' },
    phone: { type: String, default: 'mobilePhone' },
    office: { type: String, default: 'officeLocation' }
  },
  
  // Sync Statistics
  lastSyncAt: Date,
  lastSyncStatus: {
    type: String,
    enum: ['success', 'partial', 'failed', 'in_progress'],
    default: 'success'
  },
  lastSyncError: String,
  lastSyncStats: {
    employeesCreated: { type: Number, default: 0 },
    employeesUpdated: { type: Number, default: 0 },
    employeesDeactivated: { type: Number, default: 0 },
    departmentsCreated: { type: Number, default: 0 },
    departmentsUpdated: { type: Number, default: 0 },
    errors: { type: Number, default: 0 },
    duration: Number // in seconds
  },
  
  // Sync History
  syncHistory: [{
    syncedAt: Date,
    status: String,
    stats: {
      employeesCreated: Number,
      employeesUpdated: Number,
      employeesDeactivated: Number,
      departmentsCreated: Number,
      departmentsUpdated: Number,
      errors: Number,
      duration: Number
    },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    errorDetails: String
  }],
  
  // Auto-provisioning Settings
  autoProvisioning: {
    enabled: { type: Boolean, default: false },
    defaultRole: { type: String, default: 'user' },
    defaultDepartment: { type: String, default: 'sales' },
    assignToManager: { type: Boolean, default: true },
    sendWelcomeEmail: { type: Boolean, default: true }
  },
  
  // SSO Settings
  sso: {
    enabled: { type: Boolean, default: false },
    allowPasswordLogin: { type: Boolean, default: true },
    forceSSO: { type: Boolean, default: false }
  },
  
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

// Ensure one config per company
azureADConfigSchema.index({ companyId: 1 }, { unique: true });

// Method to test connection (simulated)
azureADConfigSchema.methods.testConnection = async function() {
  // In production, this would actually test the Azure AD connection
  // For simulation, we'll just validate the config exists
  if (this.tenantId && this.clientId) {
    this.connectionStatus = 'connected';
    this.lastConnectionTest = new Date();
    this.connectionError = null;
  } else {
    this.connectionStatus = 'error';
    this.connectionError = 'Missing required configuration';
  }
  return this.save();
};

// Method to record sync
azureADConfigSchema.methods.recordSync = async function(stats, status, triggeredBy, errorDetails = null) {
  this.lastSyncAt = new Date();
  this.lastSyncStatus = status;
  this.lastSyncStats = stats;
  this.lastSyncError = errorDetails;
  
  // Add to history (keep last 50)
  this.syncHistory.unshift({
    syncedAt: new Date(),
    status,
    stats,
    triggeredBy,
    errorDetails
  });
  
  if (this.syncHistory.length > 50) {
    this.syncHistory = this.syncHistory.slice(0, 50);
  }
  
  return this.save();
};

addTenantSupport(azureADConfigSchema);

const AzureADConfig = mongoose.models.AzureADConfig || mongoose.model('AzureADConfig', azureADConfigSchema);

module.exports = AzureADConfig;
