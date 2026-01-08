const mongoose = require('mongoose');
const { addTenantSupport } = require('./BaseTenantModel');

const webhookDeliverySchema = new mongoose.Schema({
  webhookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Webhook',
    required: true,
    index: true
  },
  event: {
    type: String,
    required: true,
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'retrying'],
    default: 'pending',
    index: true
  },
  attempts: [{
    attemptNumber: Number,
    attemptedAt: Date,
    responseStatus: Number,
    responseBody: String,
    responseTimeMs: Number,
    error: String
  }],
  totalAttempts: {
    type: Number,
    default: 0
  },
  nextRetryAt: Date,
  completedAt: Date,
  requestHeaders: mongoose.Schema.Types.Mixed,
  requestBody: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

webhookDeliverySchema.index({ webhookId: 1, createdAt: -1 });
webhookDeliverySchema.index({ status: 1, nextRetryAt: 1 });
webhookDeliverySchema.index({ event: 1, createdAt: -1 });

webhookDeliverySchema.methods.recordAttempt = async function (responseStatus, responseBody, responseTimeMs, error = null) {
  const attemptNumber = this.totalAttempts + 1;

  this.attempts.push({
    attemptNumber,
    attemptedAt: new Date(),
    responseStatus,
    responseBody: responseBody?.substring(0, 1000),
    responseTimeMs,
    error
  });

  this.totalAttempts = attemptNumber;

  if (responseStatus >= 200 && responseStatus < 300) {
    this.status = 'success';
    this.completedAt = new Date();
  } else if (error || responseStatus >= 400) {
    const webhook = await mongoose.model('Webhook').findById(this.webhookId);
    if (webhook && attemptNumber < webhook.retryPolicy.maxRetries) {
      this.status = 'retrying';
      const delay = webhook.retryPolicy.retryDelayMs * Math.pow(webhook.retryPolicy.backoffMultiplier, attemptNumber - 1);
      this.nextRetryAt = new Date(Date.now() + delay);
    } else {
      this.status = 'failed';
      this.completedAt = new Date();
    }
  }

  return this.save();
};

addTenantSupport(webhookDeliverySchema);

const WebhookDelivery = mongoose.models.WebhookDelivery || mongoose.model('WebhookDelivery', webhookDeliverySchema);

module.exports = WebhookDelivery;
