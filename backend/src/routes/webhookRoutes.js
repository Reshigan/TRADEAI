const express = require('express');
const router = express.Router();
const Webhook = require('../models/Webhook');
const WebhookDelivery = require('../models/WebhookDelivery');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const webhooks = await Webhook.find({ tenantId: req.user.tenantId })
      .select('-secret -authentication.password -authentication.token -authentication.apiKeyValue')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: webhooks
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    }).select('-authentication.password -authentication.token -authentication.apiKeyValue');

    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    res.json({ success: true, data: webhook });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, url, events, headers, retryPolicy, authentication } = req.body;

    if (!name || !url || !events || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name, URL, and at least one event are required'
      });
    }

    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = new Webhook({
      tenantId: req.user.tenantId,
      name,
      description,
      url,
      secret,
      events,
      headers: headers || [],
      retryPolicy: retryPolicy || { maxRetries: 3, retryDelayMs: 1000, backoffMultiplier: 2 },
      authentication: authentication || { type: 'none' },
      isActive: true,
      createdBy: req.user._id
    });

    await webhook.save();

    res.status(201).json({
      success: true,
      data: {
        ...webhook.toObject(),
        secret
      },
      message: 'Webhook created successfully. Save the secret - it will not be shown again.'
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, url, events, headers, retryPolicy, authentication, isActive } = req.body;

    const webhook = await Webhook.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    if (name) webhook.name = name;
    if (description !== undefined) webhook.description = description;
    if (url) webhook.url = url;
    if (events) webhook.events = events;
    if (headers) webhook.headers = headers;
    if (retryPolicy) webhook.retryPolicy = retryPolicy;
    if (authentication) webhook.authentication = authentication;
    if (isActive !== undefined) webhook.isActive = isActive;
    webhook.updatedBy = req.user._id;

    await webhook.save();

    res.json({
      success: true,
      data: webhook,
      message: 'Webhook updated successfully'
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const webhook = await Webhook.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    await WebhookDelivery.deleteMany({ webhookId: webhook._id });

    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/test', async (req, res) => {
  try {
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    const testPayload = {
      event: 'test.ping',
      timestamp: new Date().toISOString(),
      webhookId: webhook._id.toString(),
      data: {
        test: true,
        message: 'This is a test webhook delivery from TRADEAI'
      }
    };

    const requestBody = JSON.stringify(testPayload);
    const headers = buildHeaders(webhook, requestBody);

    const delivery = new WebhookDelivery({
      tenantId: req.user.tenantId,
      webhookId: webhook._id,
      event: 'test.ping',
      payload: testPayload,
      status: 'pending',
      requestHeaders: headers,
      requestBody
    });

    await delivery.save();

    const startTime = Date.now();
    let responseStatus = 0;
    let responseBody = '';
    let error = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: requestBody,
        signal: controller.signal
      });

      clearTimeout(timeout);
      responseStatus = response.status;
      responseBody = await response.text();
    } catch (err) {
      error = err.message;
      if (err.name === 'AbortError') {
        error = 'Request timeout (30s)';
      }
    }

    const responseTimeMs = Date.now() - startTime;
    await delivery.recordAttempt(responseStatus, responseBody, responseTimeMs, error);

    const success = responseStatus >= 200 && responseStatus < 300;
    await webhook.recordDelivery(success, responseTimeMs, error);

    res.json({
      success,
      data: {
        deliveryId: delivery._id,
        responseStatus,
        responseTimeMs,
        error
      },
      message: success ? 'Test webhook delivered successfully' : 'Test webhook delivery failed'
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/deliveries', async (req, res) => {
  try {
    const { limit = 50, status, event } = req.query;

    const query = {
      webhookId: req.params.id,
      tenantId: req.user.tenantId
    };

    if (status) query.status = status;
    if (event) query.event = event;

    const deliveries = await WebhookDelivery.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-requestBody -payload');

    res.json({
      success: true,
      data: deliveries
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/stats', async (req, res) => {
  try {
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [deliveries24h, success24h, deliveries7d, success7d] = await Promise.all([
      WebhookDelivery.countDocuments({ webhookId: webhook._id, createdAt: { $gte: last24h } }),
      WebhookDelivery.countDocuments({ webhookId: webhook._id, createdAt: { $gte: last24h }, status: 'success' }),
      WebhookDelivery.countDocuments({ webhookId: webhook._id, createdAt: { $gte: last7d } }),
      WebhookDelivery.countDocuments({ webhookId: webhook._id, createdAt: { $gte: last7d }, status: 'success' })
    ]);

    res.json({
      success: true,
      data: {
        webhook: {
          id: webhook._id,
          name: webhook.name,
          url: webhook.url,
          events: webhook.events,
          isActive: webhook.isActive
        },
        allTime: webhook.stats,
        last24h: {
          total: deliveries24h,
          successful: success24h,
          successRate: deliveries24h > 0 ? Math.round((success24h / deliveries24h) * 100) : 0
        },
        last7d: {
          total: deliveries7d,
          successful: success7d,
          successRate: deliveries7d > 0 ? Math.round((success7d / deliveries7d) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching webhook stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/regenerate-secret', async (req, res) => {
  try {
    const webhook = await Webhook.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    const newSecret = crypto.randomBytes(32).toString('hex');
    webhook.secret = newSecret;
    webhook.updatedBy = req.user._id;
    await webhook.save();

    res.json({
      success: true,
      data: { secret: newSecret },
      message: 'Secret regenerated successfully. Save the new secret - it will not be shown again.'
    });
  } catch (error) {
    console.error('Error regenerating secret:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/events/available', (req, res) => {
  const availableEvents = [
    { event: 'promotion.created', description: 'Triggered when a new promotion is created' },
    { event: 'promotion.updated', description: 'Triggered when a promotion is updated' },
    { event: 'promotion.approved', description: 'Triggered when a promotion is approved' },
    { event: 'promotion.rejected', description: 'Triggered when a promotion is rejected' },
    { event: 'promotion.completed', description: 'Triggered when a promotion is completed' },
    { event: 'budget.created', description: 'Triggered when a new budget is created' },
    { event: 'budget.updated', description: 'Triggered when a budget is updated' },
    { event: 'budget.approved', description: 'Triggered when a budget is approved' },
    { event: 'budget.threshold_reached', description: 'Triggered when budget utilization reaches threshold' },
    { event: 'trade_spend.created', description: 'Triggered when a new trade spend is created' },
    { event: 'trade_spend.approved', description: 'Triggered when a trade spend is approved' },
    { event: 'trade_spend.rejected', description: 'Triggered when a trade spend is rejected' },
    { event: 'claim.created', description: 'Triggered when a new claim is created' },
    { event: 'claim.approved', description: 'Triggered when a claim is approved' },
    { event: 'claim.rejected', description: 'Triggered when a claim is rejected' },
    { event: 'claim.paid', description: 'Triggered when a claim is paid' },
    { event: 'deduction.created', description: 'Triggered when a new deduction is created' },
    { event: 'deduction.matched', description: 'Triggered when a deduction is matched to a claim' },
    { event: 'deduction.disputed', description: 'Triggered when a deduction is disputed' },
    { event: 'settlement.created', description: 'Triggered when a new settlement is created' },
    { event: 'settlement.completed', description: 'Triggered when a settlement is completed' },
    { event: 'user.created', description: 'Triggered when a new user is created' },
    { event: 'user.updated', description: 'Triggered when a user is updated' },
    { event: 'import.completed', description: 'Triggered when a data import completes successfully' },
    { event: 'import.failed', description: 'Triggered when a data import fails' },
    { event: 'alert.triggered', description: 'Triggered when a system alert is triggered' }
  ];

  res.json({
    success: true,
    data: availableEvents
  });
});

function buildHeaders(webhook, body) {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'TRADEAI-Webhook/1.0',
    'X-Webhook-Delivery': Date.now().toString()
  };

  if (webhook.secret) {
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex');
    headers['X-Webhook-Signature'] = `sha256=${signature}`;
  }

  if (webhook.headers && webhook.headers.length > 0) {
    for (const header of webhook.headers) {
      if (header.key && header.value) {
        headers[header.key] = header.value;
      }
    }
  }

  if (webhook.authentication) {
    switch (webhook.authentication.type) {
      case 'basic':
        if (webhook.authentication.username && webhook.authentication.password) {
          const credentials = Buffer.from(
            `${webhook.authentication.username}:${webhook.authentication.password}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
      case 'bearer':
        if (webhook.authentication.token) {
          headers['Authorization'] = `Bearer ${webhook.authentication.token}`;
        }
        break;
      case 'api_key':
        if (webhook.authentication.apiKeyHeader && webhook.authentication.apiKeyValue) {
          headers[webhook.authentication.apiKeyHeader] = webhook.authentication.apiKeyValue;
        }
        break;
    }
  }

  return headers;
}

module.exports = router;
