const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const erpSettingsSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    unique: true,
    index: true
  },

  // SAP Integration
  sap: {
    enabled: { type: Boolean, default: false },
    connectionType: {
      type: String,
      enum: ['direct', 'api', 'middleware', 'file'],
      default: 'api'
    },
    host: String,
    port: { type: Number, default: 443 },
    client: String,
    systemId: String,
    username: String,
    password: String, // Should be encrypted in production
    apiKey: String,
    baseUrl: String,

    // Connection Status
    connectionStatus: {
      type: String,
      enum: ['not_configured', 'configured', 'connected', 'error', 'disconnected'],
      default: 'not_configured'
    },
    lastConnectionTest: Date,
    connectionError: String,

    // Sync Settings
    syncEnabled: { type: Boolean, default: false },
    syncSchedule: {
      type: String,
      enum: ['manual', 'hourly', 'daily', 'weekly'],
      default: 'daily'
    },
    lastSyncAt: Date,
    lastSyncStatus: String,

    // Data Mapping
    masterDataMapping: {
      customers: { type: Boolean, default: true },
      products: { type: Boolean, default: true },
      pricing: { type: Boolean, default: true },
      inventory: { type: Boolean, default: false }
    }
  },

  // Generic ERP Integration (for non-SAP systems)
  erp: {
    enabled: { type: Boolean, default: false },
    systemName: String, // e.g., "Oracle", "Microsoft Dynamics", "NetSuite"
    connectionType: {
      type: String,
      enum: ['rest_api', 'soap', 'odbc', 'file_import'],
      default: 'rest_api'
    },
    baseUrl: String,
    apiKey: String,
    username: String,
    password: String,

    // Connection Status
    connectionStatus: {
      type: String,
      enum: ['not_configured', 'configured', 'connected', 'error', 'disconnected'],
      default: 'not_configured'
    },
    lastConnectionTest: Date,
    connectionError: String,

    // Sync Settings
    syncEnabled: { type: Boolean, default: false },
    syncSchedule: {
      type: String,
      enum: ['manual', 'hourly', 'daily', 'weekly'],
      default: 'daily'
    },
    lastSyncAt: Date,
    lastSyncStatus: String
  },

  // Master Data Settings
  masterData: {
    // Customer Master
    customerSource: {
      type: String,
      enum: ['manual', 'erp', 'sap', 'csv_import'],
      default: 'manual'
    },
    customerSyncEnabled: { type: Boolean, default: false },
    customerSyncSchedule: { type: String, default: 'daily' },
    lastCustomerSync: Date,

    // Product Master
    productSource: {
      type: String,
      enum: ['manual', 'erp', 'sap', 'csv_import'],
      default: 'manual'
    },
    productSyncEnabled: { type: Boolean, default: false },
    productSyncSchedule: { type: String, default: 'daily' },
    lastProductSync: Date,

    // Pricing Master
    pricingSource: {
      type: String,
      enum: ['manual', 'erp', 'sap', 'csv_import'],
      default: 'manual'
    },
    pricingSyncEnabled: { type: Boolean, default: false },
    pricingSyncSchedule: { type: String, default: 'daily' },
    lastPricingSync: Date
  },

  // Real-time Sales Data Settings
  salesData: {
    enabled: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ['manual', 'erp', 'sap', 'pos', 'api'],
      default: 'manual'
    },

    // Real-time Feed
    realtimeFeedEnabled: { type: Boolean, default: false },
    realtimeFeedUrl: String,
    realtimeFeedApiKey: String,
    realtimeFeedFormat: {
      type: String,
      enum: ['json', 'xml', 'csv'],
      default: 'json'
    },

    // Batch Import
    batchImportEnabled: { type: Boolean, default: true },
    batchImportSchedule: {
      type: String,
      enum: ['hourly', 'daily', 'weekly'],
      default: 'daily'
    },
    batchImportTime: { type: String, default: '02:00' },
    lastBatchImport: Date,
    lastBatchImportStatus: String,
    lastBatchImportRecords: Number,

    // Data Retention
    retentionPeriodMonths: { type: Number, default: 24 },

    // Connection Status
    connectionStatus: {
      type: String,
      enum: ['not_configured', 'configured', 'connected', 'error', 'disconnected'],
      default: 'not_configured'
    },
    lastConnectionTest: Date
  },

  // POS Integration
  pos: {
    enabled: { type: Boolean, default: false },
    systemName: String,
    connectionType: {
      type: String,
      enum: ['api', 'file_import', 'database'],
      default: 'api'
    },
    baseUrl: String,
    apiKey: String,

    connectionStatus: {
      type: String,
      enum: ['not_configured', 'configured', 'connected', 'error', 'disconnected'],
      default: 'not_configured'
    },
    lastConnectionTest: Date,

    syncEnabled: { type: Boolean, default: false },
    syncSchedule: { type: String, default: 'daily' },
    lastSyncAt: Date
  },

  // Sync History
  syncHistory: [{
    syncType: String, // 'sap', 'erp', 'master_data', 'sales', 'pos'
    syncedAt: Date,
    status: String,
    recordsProcessed: Number,
    recordsCreated: Number,
    recordsUpdated: Number,
    recordsFailed: Number,
    duration: Number, // seconds
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    errorDetails: String
  }],

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

// Ensure one settings document per company
erpSettingsSchema.index({ companyId: 1 }, { unique: true });

// Static method to get or create settings for a company
erpSettingsSchema.statics.getOrCreate = async function (companyId) {
  let settings = await this.findOne({ companyId });
  if (!settings) {
    settings = await this.create({ companyId });
  }
  return settings;
};

// Method to test SAP connection (simulated)
erpSettingsSchema.methods.testSAPConnection = async function () {
  if (this.sap.enabled && this.sap.host) {
    this.sap.connectionStatus = 'connected';
    this.sap.lastConnectionTest = new Date();
    this.sap.connectionError = null;
  } else {
    this.sap.connectionStatus = 'error';
    this.sap.connectionError = 'SAP not configured';
  }
  const saved = await this.save();
  return saved;
};

// Method to test ERP connection(simulated)
erpSettingsSchema.methods.testERPConnection = async function () {
  if (this.erp.enabled && this.erp.baseUrl) {
    this.erp.connectionStatus = 'connected';
    this.erp.lastConnectionTest = new Date();
    this.erp.connectionError = null;
  } else {
    this.erp.connectionStatus = 'error';
    this.erp.connectionError = 'ERP not configured';
  }
  const saved = await this.save();
  return saved;
};

// Method to record sync
erpSettingsSchema.methods.recordSync = async function (syncType, stats, triggeredBy) {
  this.syncHistory.unshift({
    syncType,
    syncedAt: new Date(),
    status: stats.status,
    recordsProcessed: stats.recordsProcessed || 0,
    recordsCreated: stats.recordsCreated || 0,
    recordsUpdated: stats.recordsUpdated || 0,
    recordsFailed: stats.recordsFailed || 0,
    duration: stats.duration || 0,
    triggeredBy,
    errorDetails: stats.errorDetails
  });

  if (this.syncHistory.length > 100) {
    this.syncHistory = this.syncHistory.slice(0, 100);
  }

  const saved = await this.save();
  return saved;
};

addTenantSupport(erpSettingsSchema);

const ERPSettings = mongoose.models.ERPSettings || mongoose.model('ERPSettings', erpSettingsSchema);

module.exports = ERPSettings;
