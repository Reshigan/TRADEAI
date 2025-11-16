const axios = require('axios');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class WebhookService extends EventEmitter {
  constructor() {
    super();
    this.webhooks = new Map();
    this.subscriptions = new Map();
    this.deliveryQueue = [];
    this.retryQueue = [];
    this.deliveryAttempts = new Map();
    this.initialized = false;
    this.maxRetries = 3;
    this.retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s
  }

  async initialize() {
    if (this.initialized) return;

    console.log('Initializing Webhook Service...');

    // Start delivery processor
    this.startDeliveryProcessor();

    // Start retry processor
    this.startRetryProcessor();

    // Initialize event listeners
    this.initializeEventListeners();

    this.initialized = true;
    console.log('Webhook Service initialized successfully');
  }

  // Webhook Registration and Management
  async registerWebhook(tenantId, webhookConfig) {
    const webhookId = this.generateWebhookId();

    const webhook = {
      id: webhookId,
      tenantId,
      url: webhookConfig.url,
      events: webhookConfig.events || ['*'],
      secret: webhookConfig.secret || this.generateSecret(),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deliveryCount: 0,
      failureCount: 0,
      lastDelivery: null,
      lastFailure: null,
      headers: webhookConfig.headers || {},
      timeout: webhookConfig.timeout || 30000,
      retryPolicy: webhookConfig.retryPolicy || 'exponential'
    };

    this.webhooks.set(webhookId, webhook);

    // Test webhook if requested
    if (webhookConfig.testOnCreate) {
      await this.testWebhook(webhookId);
    }

    return {
      id: webhookId,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret,
      active: webhook.active,
      createdAt: webhook.createdAt
    };
  }

  async updateWebhook(webhookId, updates) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    // Update allowed fields
    const allowedUpdates = ['url', 'events', 'active', 'headers', 'timeout', 'retryPolicy'];
    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        webhook[field] = updates[field];
      }
    }

    webhook.updatedAt = new Date();

    return this.sanitizeWebhook(webhook);
  }

  async deleteWebhook(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    this.webhooks.delete(webhookId);

    // Remove from subscriptions
    for (const [event, webhookIds] of this.subscriptions) {
      const index = webhookIds.indexOf(webhookId);
      if (index > -1) {
        webhookIds.splice(index, 1);
        if (webhookIds.length === 0) {
          this.subscriptions.delete(event);
        }
      }
    }

    return { success: true, message: 'Webhook deleted successfully' };
  }

  async getWebhook(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    return this.sanitizeWebhook(webhook);
  }

  async getWebhooksByTenant(tenantId) {
    const webhooks = [];
    for (const webhook of this.webhooks.values()) {
      if (webhook.tenantId === tenantId) {
        webhooks.push(this.sanitizeWebhook(webhook));
      }
    }
    return webhooks;
  }

  async testWebhook(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const testPayload = {
      event: 'webhook.test',
      data: {
        message: 'This is a test webhook delivery',
        timestamp: new Date().toISOString(),
        webhookId
      },
      timestamp: new Date().toISOString()
    };

    try {
      const result = await this.deliverWebhook(webhook, testPayload);
      return {
        success: true,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        message: 'Test webhook delivered successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Test webhook delivery failed'
      };
    }
  }

  // Event Subscription and Publishing
  subscribeToEvent(webhookId, events) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const eventList = Array.isArray(events) ? events : [events];

    for (const event of eventList) {
      if (!this.subscriptions.has(event)) {
        this.subscriptions.set(event, []);
      }

      const subscribers = this.subscriptions.get(event);
      if (!subscribers.includes(webhookId)) {
        subscribers.push(webhookId);
      }
    }

    // Update webhook events
    webhook.events = [...new Set([...webhook.events, ...eventList])];
    webhook.updatedAt = new Date();
  }

  unsubscribeFromEvent(webhookId, events) {
    const eventList = Array.isArray(events) ? events : [events];

    for (const event of eventList) {
      if (this.subscriptions.has(event)) {
        const subscribers = this.subscriptions.get(event);
        const index = subscribers.indexOf(webhookId);
        if (index > -1) {
          subscribers.splice(index, 1);
          if (subscribers.length === 0) {
            this.subscriptions.delete(event);
          }
        }
      }
    }

    // Update webhook events
    const webhook = this.webhooks.get(webhookId);
    if (webhook) {
      webhook.events = webhook.events.filter((e) => !eventList.includes(e));
      webhook.updatedAt = new Date();
    }
  }

  async publishEvent(tenantId, eventType, eventData, options = {}) {
    const event = {
      id: this.generateEventId(),
      tenantId,
      type: eventType,
      data: eventData,
      timestamp: new Date().toISOString(),
      source: options.source || 'tradeai',
      version: options.version || '1.0'
    };

    // Find subscribers
    const subscribers = this.getEventSubscribers(eventType, tenantId);

    if (subscribers.length === 0) {
      console.log(`No subscribers for event ${eventType} in tenant ${tenantId}`);
      return { delivered: 0, queued: 0 };
    }

    const delivered = 0;
    let queued = 0;

    // Queue deliveries
    for (const webhookId of subscribers) {
      const webhook = this.webhooks.get(webhookId);
      if (webhook && webhook.active) {
        this.queueDelivery(webhook, event);
        queued++;
      }
    }

    // Emit internal event
    this.emit('event.published', { event, subscribers: subscribers.length });

    return { delivered, queued };
  }

  getEventSubscribers(eventType, tenantId) {
    const subscribers = [];

    // Check exact event match
    if (this.subscriptions.has(eventType)) {
      subscribers.push(...this.subscriptions.get(eventType));
    }

    // Check wildcard subscriptions
    if (this.subscriptions.has('*')) {
      subscribers.push(...this.subscriptions.get('*'));
    }

    // Check pattern matches (e.g., 'user.*' matches 'user.created')
    for (const [pattern, webhookIds] of this.subscriptions) {
      if (pattern.includes('*') && this.matchesPattern(eventType, pattern)) {
        subscribers.push(...webhookIds);
      }
    }

    // Filter by tenant and remove duplicates
    const uniqueSubscribers = [...new Set(subscribers)];
    return uniqueSubscribers.filter((webhookId) => {
      const webhook = this.webhooks.get(webhookId);
      return webhook && webhook.tenantId === tenantId;
    });
  }

  matchesPattern(eventType, pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(eventType);
  }

  // Delivery Management
  queueDelivery(webhook, event) {
    const delivery = {
      id: this.generateDeliveryId(),
      webhookId: webhook.id,
      webhook,
      event,
      attempts: 0,
      queuedAt: new Date(),
      nextAttempt: new Date()
    };

    this.deliveryQueue.push(delivery);
  }

  startDeliveryProcessor() {
    setInterval(async () => {
      await this.processDeliveryQueue();
    }, 1000); // Process every second
  }

  async processDeliveryQueue() {
    if (this.deliveryQueue.length === 0) return;

    const now = new Date();
    const readyDeliveries = this.deliveryQueue.filter((d) => d.nextAttempt <= now);

    // Process up to 10 deliveries at once
    const deliveriesToProcess = readyDeliveries.slice(0, 10);

    for (const delivery of deliveriesToProcess) {
      try {
        await this.attemptDelivery(delivery);

        // Remove from queue on success
        const index = this.deliveryQueue.indexOf(delivery);
        if (index > -1) {
          this.deliveryQueue.splice(index, 1);
        }
      } catch (error) {
        // Handle delivery failure
        await this.handleDeliveryFailure(delivery, error);
      }
    }
  }

  async attemptDelivery(delivery) {
    const { webhook, event } = delivery;

    delivery.attempts++;
    delivery.lastAttempt = new Date();

    console.log(`Attempting webhook delivery ${delivery.id} (attempt ${delivery.attempts})`);

    try {
      const result = await this.deliverWebhook(webhook, event);

      // Update webhook stats
      webhook.deliveryCount++;
      webhook.lastDelivery = new Date();

      // Store delivery attempt
      this.recordDeliveryAttempt(delivery.id, {
        success: true,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        attempt: delivery.attempts,
        timestamp: new Date()
      });

      this.emit('webhook.delivered', { delivery, result });

      return result;
    } catch (error) {
      // Update webhook stats
      webhook.failureCount++;
      webhook.lastFailure = new Date();

      // Store delivery attempt
      this.recordDeliveryAttempt(delivery.id, {
        success: false,
        error: error.message,
        statusCode: error.response?.status,
        attempt: delivery.attempts,
        timestamp: new Date()
      });

      this.emit('webhook.failed', { delivery, error });

      throw error;
    }
  }

  async deliverWebhook(webhook, event) {
    const payload = {
      id: event.id,
      event: event.type,
      data: event.data,
      timestamp: event.timestamp,
      tenant_id: event.tenantId
    };

    const signature = this.generateSignature(payload, webhook.secret);

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'TRADEAI-Webhook/1.0',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': event.type,
      'X-Webhook-Delivery': this.generateDeliveryId(),
      'X-Webhook-Timestamp': event.timestamp,
      ...webhook.headers
    };

    const startTime = Date.now();

    try {
      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: webhook.timeout,
        validateStatus: (status) => status >= 200 && status < 300
      });

      const responseTime = Date.now() - startTime;

      return {
        statusCode: response.status,
        responseTime,
        headers: response.headers
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error.response) {
        // HTTP error response
        throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.code === 'ECONNABORTED') {
        // Timeout
        throw new Error(`Request timeout after ${responseTime}ms`);
      } else {
        // Network or other error
        throw new Error(`Network error: ${error.message}`);
      }
    }
  }

  async handleDeliveryFailure(delivery, error) {
    const { webhook } = delivery;

    if (delivery.attempts >= this.maxRetries) {
      // Max retries reached, move to failed deliveries
      console.error(`Webhook delivery ${delivery.id} failed after ${delivery.attempts} attempts`);

      // Remove from queue
      const index = this.deliveryQueue.indexOf(delivery);
      if (index > -1) {
        this.deliveryQueue.splice(index, 1);
      }

      this.emit('webhook.exhausted', { delivery, error });
      return;
    }

    // Schedule retry
    const retryDelay = this.calculateRetryDelay(delivery.attempts, webhook.retryPolicy);
    delivery.nextAttempt = new Date(Date.now() + retryDelay);

    console.log(`Webhook delivery ${delivery.id} will retry in ${retryDelay}ms`);
  }

  calculateRetryDelay(attempt, retryPolicy) {
    switch (retryPolicy) {
      case 'linear':
        return attempt * 5000; // 5s, 10s, 15s

      case 'exponential':
        return Math.min(Math.pow(2, attempt - 1) * 1000, 60000); // 1s, 2s, 4s, max 60s

      case 'fixed':
        return 10000; // Always 10s

      default:
        return this.retryDelays[attempt - 1] || 15000;
    }
  }

  startRetryProcessor() {
    setInterval(() => {
      this.processRetryQueue();
    }, 5000); // Process every 5 seconds
  }

  processRetryQueue() {
    // Retry queue is handled by the main delivery processor
    // This method can be used for additional retry logic if needed
  }

  // Signature and Security
  generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  verifySignature(payload, signature, secret) {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Event Listeners
  initializeEventListeners() {
    // Listen for application events and convert to webhook events
    this.on('user.created', (data) => {
      this.publishEvent(data.tenantId, 'user.created', data);
    });

    this.on('order.created', (data) => {
      this.publishEvent(data.tenantId, 'order.created', data);
    });

    this.on('promotion.started', (data) => {
      this.publishEvent(data.tenantId, 'promotion.started', data);
    });

    this.on('promotion.ended', (data) => {
      this.publishEvent(data.tenantId, 'promotion.ended', data);
    });

    this.on('alert.triggered', (data) => {
      this.publishEvent(data.tenantId, 'alert.triggered', data);
    });
  }

  // Utility Methods
  generateWebhookId() {
    return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateDeliveryId() {
    return `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  recordDeliveryAttempt(deliveryId, attempt) {
    if (!this.deliveryAttempts.has(deliveryId)) {
      this.deliveryAttempts.set(deliveryId, []);
    }

    const attempts = this.deliveryAttempts.get(deliveryId);
    attempts.push(attempt);

    // Keep only last 10 attempts
    if (attempts.length > 10) {
      attempts.splice(0, attempts.length - 10);
    }
  }

  getDeliveryAttempts(deliveryId) {
    return this.deliveryAttempts.get(deliveryId) || [];
  }

  sanitizeWebhook(webhook) {
    const sanitized = { ...webhook };

    // Remove sensitive information
    if (sanitized.secret) {
      sanitized.secret = `${sanitized.secret.substr(0, 8)}...`;
    }

    return sanitized;
  }

  // Analytics and Monitoring
  async getWebhookStats(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    return {
      id: webhook.id,
      deliveryCount: webhook.deliveryCount,
      failureCount: webhook.failureCount,
      successRate: webhook.deliveryCount > 0 ?
        ((webhook.deliveryCount - webhook.failureCount) / webhook.deliveryCount * 100).toFixed(2) : 0,
      lastDelivery: webhook.lastDelivery,
      lastFailure: webhook.lastFailure,
      active: webhook.active
    };
  }

  async getSystemStats() {
    const stats = {
      totalWebhooks: this.webhooks.size,
      activeWebhooks: 0,
      totalDeliveries: 0,
      totalFailures: 0,
      queuedDeliveries: this.deliveryQueue.length,
      eventSubscriptions: this.subscriptions.size
    };

    for (const webhook of this.webhooks.values()) {
      if (webhook.active) {
        stats.activeWebhooks++;
      }
      stats.totalDeliveries += webhook.deliveryCount;
      stats.totalFailures += webhook.failureCount;
    }

    stats.successRate = stats.totalDeliveries > 0 ?
      ((stats.totalDeliveries - stats.totalFailures) / stats.totalDeliveries * 100).toFixed(2) : 0;

    return stats;
  }
}

module.exports = new WebhookService();
