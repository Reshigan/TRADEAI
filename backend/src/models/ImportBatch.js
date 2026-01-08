const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const importBatchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  entityType: {
    type: String,
    required: true,
    enum: ['customers', 'products', 'sales_actuals', 'deductions', 'trading_terms', 'promotions', 'budgets', 'trade_spends'],
    index: true
  },

  source: {
    type: String,
    required: true,
    enum: ['csv_upload', 'api', 'erp_sync', 'manual', 'migration'],
    default: 'csv_upload'
  },

  sourceDetails: {
    fileName: String,
    fileSize: Number,
    fileHash: String,
    apiEndpoint: String,
    erpSystem: String,
    erpDocumentId: String
  },

  templateVersion: {
    type: String,
    default: '1.0'
  },

  status: {
    type: String,
    enum: ['pending', 'validating', 'processing', 'completed', 'failed', 'partial'],
    default: 'pending',
    index: true
  },

  rowCounts: {
    total: { type: Number, default: 0 },
    valid: { type: Number, default: 0 },
    created: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },

  validationErrors: [{
    row: Number,
    field: String,
    value: mongoose.Schema.Types.Mixed,
    error: String,
    severity: {
      type: String,
      enum: ['error', 'warning', 'info'],
      default: 'error'
    }
  }],

  processingErrors: [{
    row: Number,
    entityId: mongoose.Schema.Types.ObjectId,
    error: String,
    stack: String
  }],

  fieldMapping: {
    type: Map,
    of: String
  },

  transformations: [{
    field: String,
    type: {
      type: String,
      enum: ['trim', 'uppercase', 'lowercase', 'date_format', 'number_format', 'lookup', 'default']
    },
    config: mongoose.Schema.Types.Mixed
  }],

  createdEntities: [{
    entityId: mongoose.Schema.Types.ObjectId,
    entityType: String,
    rowNumber: Number,
    externalId: String
  }],

  startedAt: Date,
  completedAt: Date,

  duration: {
    type: Number,
    min: 0
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  approvedAt: Date,

  notes: String,

  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

addTenantSupport(importBatchSchema);

importBatchSchema.index({ tenantId: 1, createdAt: -1 });
importBatchSchema.index({ tenantId: 1, entityType: 1, status: 1 });
importBatchSchema.index({ tenantId: 1, uploadedBy: 1 });

importBatchSchema.virtual('successRate').get(function () {
  if (this.rowCounts.total === 0) return 0;
  return Math.round(((this.rowCounts.created + this.rowCounts.updated) / this.rowCounts.total) * 100);
});

importBatchSchema.virtual('hasErrors').get(function () {
  return this.validationErrors.length > 0 || this.processingErrors.length > 0;
});

importBatchSchema.methods.startProcessing = function () {
  this.status = 'processing';
  this.startedAt = new Date();
  return this.save();
};

importBatchSchema.methods.complete = function (counts) {
  this.status = counts.failed > 0 ? 'partial' : 'completed';
  this.completedAt = new Date();
  this.duration = this.completedAt - this.startedAt;
  Object.assign(this.rowCounts, counts);
  return this.save();
};

importBatchSchema.methods.fail = function (error) {
  this.status = 'failed';
  this.completedAt = new Date();
  this.duration = this.completedAt - (this.startedAt || this.createdAt);
  this.processingErrors.push({
    row: 0,
    error: error.message,
    stack: error.stack
  });
  return this.save();
};

importBatchSchema.methods.addValidationError = function (row, field, value, error, severity = 'error') {
  this.validationErrors.push({ row, field, value, error, severity });
};

importBatchSchema.methods.recordCreatedEntity = function (entityId, entityType, rowNumber, externalId) {
  this.createdEntities.push({ entityId, entityType, rowNumber, externalId });
};

importBatchSchema.statics.findByEntity = function (tenantId, entityType, options = {}) {
  const query = { tenantId, entityType };
  if (options.status) query.status = options.status;

  return this.find(query)
    .populate('uploadedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

importBatchSchema.statics.getRecentBatches = function (tenantId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    tenantId,
    createdAt: { $gte: startDate }
  })
    .populate('uploadedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('ImportBatch', importBatchSchema);
