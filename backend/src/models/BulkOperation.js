const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const bulkOperationSchema = new mongoose.Schema({
  operationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  operation: {
    type: String,
    required: true,
    enum: ['import', 'export', 'update', 'delete', 'sync'],
    index: true
  },

  modelType: {
    type: String,
    required: true,
    enum: ['customer', 'product', 'promotion', 'budget', 'tradeSpend', 'rebate', 'vendor'],
    index: true
  },

  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },

  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  results: {
    processed: {
      type: Number,
      default: 0
    },
    successful: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    skipped: {
      type: Number,
      default: 0
    }
  },

  errors: [{
    row: Number,
    field: String,
    message: String,
    data: mongoose.Schema.Types.Mixed
  }],

  warnings: [{
    row: Number,
    field: String,
    message: String
  }],

  inputFile: {
    filename: String,
    originalName: String,
    size: Number,
    mimetype: String,
    path: String
  },

  outputFile: {
    filename: String,
    path: String,
    size: Number,
    downloadUrl: String,
    expiresAt: Date
  },

  options: {
    skipDuplicates: {
      type: Boolean,
      default: false
    },
    updateExisting: {
      type: Boolean,
      default: false
    },
    validateOnly: {
      type: Boolean,
      default: false
    },
    batchSize: {
      type: Number,
      default: 100
    },
    customOptions: mongoose.Schema.Types.Mixed
  },

  startTime: Date,
  endTime: Date,
  duration: Number,

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  cancelledAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

addTenantSupport(bulkOperationSchema);

bulkOperationSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
bulkOperationSchema.index({ companyId: 1, status: 1, createdAt: -1 });
bulkOperationSchema.index({ companyId: 1, operation: 1, modelType: 1 });
bulkOperationSchema.index({ userId: 1, createdAt: -1 });

bulkOperationSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'completed' && !this.endTime) {
    this.endTime = new Date();
    if (this.startTime) {
      this.duration = this.endTime.getTime() - this.startTime.getTime();
    }
  }
  next();
});

bulkOperationSchema.statics.getOperationHistory = function (companyId, options = {}) {
  const { operation, modelType, status, page = 1, limit = 20 } = options;

  const query = { companyId };
  if (operation) query.operation = operation;
  if (modelType) query.modelType = modelType;
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

bulkOperationSchema.methods.updateProgress = function (processed, successful, failed) {
  this.results.processed = processed;
  this.results.successful = successful;
  this.results.failed = failed;

  const total = this.results.processed + this.results.failed;
  if (total > 0) {
    this.progress = Math.min(100, Math.round((processed / total) * 100));
  }

  return this.save();
};

bulkOperationSchema.methods.complete = function (results) {
  this.status = 'completed';
  this.progress = 100;
  this.endTime = new Date();
  if (this.startTime) {
    this.duration = this.endTime.getTime() - this.startTime.getTime();
  }
  if (results) {
    this.results = { ...this.results, ...results };
  }
  return this.save();
};

bulkOperationSchema.methods.fail = function (error) {
  this.status = 'failed';
  this.endTime = new Date();
  if (this.startTime) {
    this.duration = this.endTime.getTime() - this.startTime.getTime();
  }
  if (error) {
    this.errors.push({
      message: error.message || error,
      data: error.stack
    });
  }
  return this.save();
};

bulkOperationSchema.methods.cancel = function (userId) {
  this.status = 'cancelled';
  this.cancelledBy = userId;
  this.cancelledAt = new Date();
  this.endTime = new Date();
  if (this.startTime) {
    this.duration = this.endTime.getTime() - this.startTime.getTime();
  }
  return this.save();
};

const BulkOperation = mongoose.model('BulkOperation', bulkOperationSchema);

module.exports = BulkOperation;
