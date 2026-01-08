const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const webhookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  secret: {
    type: String,
    trim: true
  },
  events: [{
    type: String,
    enum: [
      'promotion.created',
      'promotion.updated',
      'promotion.approved',
      'promotion.rejected',
      'promotion.completed',
      'budget.created',
      'budget.updated',
      'budget.approved',
      'budget.threshold_reached',
      'trade_spend.created',
      'trade_spend.approved',
      'trade_spend.rejected',
      'claim.created',
      'claim.approved',
      'claim.rejected',
      'claim.paid',
      'deduction.created',
      'deduction.matched',
      'deduction.disputed',
      'settlement.created',
      'settlement.completed',
      'user.created',
      'user.updated',
      'import.completed',
      'import.failed',
      'alert.triggered'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  headers: [{
    key: { type: String, trim: true },
    value: { type: String, trim: true }
  }],
  retryPolicy: {
    maxRetries: { type: Number, default: 3 },
    retryDelayMs: { type: Number, default: 1000 },
    backoffMultiplier: { type: Number, default: 2 }
  },
  authentication: {
    type: {
      type: String,
      enum: ['none', 'basic', 'bearer', 'api_key', 'hmac'],
      default: 'none'
    },
    username: String,
    password: String,
    token: String,
    apiKeyHeader: String,
    apiKeyValue: String
  },
  stats: {
    totalDeliveries: { type: Number, default: 0 },
    successfulDeliveries: { type: Number, default: 0 },
    failedDeliveries: { type: Number, default: 0 },
    lastDeliveryAt: Date,
    lastDeliveryStatus: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending'
    },
    lastError: String,
    averageResponseTimeMs: { type: Number, default: 0 }
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

webhookSchema.index({ companyId: 1, isActive: 1 });
webhookSchema.index({ events: 1 });

webhookSchema.methods.recordDelivery = function (success, responseTimeMs, error = null) {
  this.stats.totalDeliveries += 1;
  if (success) {
    this.stats.successfulDeliveries += 1;
    this.stats.lastDeliveryStatus = 'success';
  } else {
    this.stats.failedDeliveries += 1;
    this.stats.lastDeliveryStatus = 'failed';
    this.stats.lastError = error;
  }
  this.stats.lastDeliveryAt = new Date();

  const totalTime = (this.stats.averageResponseTimeMs * (this.stats.totalDeliveries - 1)) + responseTimeMs;
  this.stats.averageResponseTimeMs = Math.round(totalTime / this.stats.totalDeliveries);

  return this.save();
};

addTenantSupport(webhookSchema);

const Webhook = mongoose.models.Webhook || mongoose.model('Webhook', webhookSchema);

module.exports = Webhook;
