const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const apiManagementService = require('../services/apiManagementService');

// Apply API management middleware
router.use(apiManagementService.trackAPIUsage.bind(apiManagementService));

// External Integrations Routes
router.get('/external',
  authenticateToken,
  requirePermission('integrations:view'),
  integrationController.getIntegrations
);

router.get('/external/:integrationId',
  authenticateToken,
  requirePermission('integrations:view'),
  integrationController.getIntegration
);

router.post('/external/:integrationId/connect',
  authenticateToken,
  requirePermission('integrations:manage'),
  integrationController.connectIntegration
);

router.post('/external/:integrationId/disconnect',
  authenticateToken,
  requirePermission('integrations:manage'),
  integrationController.disconnectIntegration
);

router.post('/external/:integrationId/sync',
  authenticateToken,
  requirePermission('integrations:sync'),
  apiManagementService.getRateLimiter('integrations'),
  integrationController.syncIntegration
);

router.get('/external/metrics/overview',
  authenticateToken,
  requirePermission('integrations:view'),
  integrationController.getIntegrationMetrics
);

router.post('/external/bulk/sync',
  authenticateToken,
  requirePermission('integrations:sync'),
  apiManagementService.getRateLimiter('integrations'),
  integrationController.bulkSyncIntegrations
);

// Webhook Management Routes
router.post('/webhooks',
  authenticateToken,
  requirePermission('webhooks:create'),
  integrationController.createWebhook
);

router.get('/webhooks',
  authenticateToken,
  requirePermission('webhooks:view'),
  integrationController.getWebhooks
);

router.get('/webhooks/:webhookId',
  authenticateToken,
  requirePermission('webhooks:view'),
  integrationController.getWebhook
);

router.put('/webhooks/:webhookId',
  authenticateToken,
  requirePermission('webhooks:manage'),
  integrationController.updateWebhook
);

router.delete('/webhooks/:webhookId',
  authenticateToken,
  requirePermission('webhooks:manage'),
  integrationController.deleteWebhook
);

router.post('/webhooks/:webhookId/test',
  authenticateToken,
  requirePermission('webhooks:manage'),
  apiManagementService.getRateLimiter('webhooks'),
  integrationController.testWebhook
);

router.get('/webhooks/:webhookId/stats',
  authenticateToken,
  requirePermission('webhooks:view'),
  integrationController.getWebhookStats
);

router.get('/webhooks/system/stats',
  authenticateToken,
  requirePermission('webhooks:view'),
  integrationController.getWebhookSystemStats
);

router.post('/webhooks/events/publish',
  authenticateToken,
  requirePermission('webhooks:publish'),
  apiManagementService.getRateLimiter('webhooks'),
  integrationController.publishEvent
);

router.post('/webhooks/bulk/update',
  authenticateToken,
  requirePermission('webhooks:manage'),
  integrationController.bulkUpdateWebhooks
);

// Webhook Receiver Routes (for external systems)
router.post('/webhooks/receive/:integrationId',
  apiManagementService.getRateLimiter('webhooks'),
  integrationController.receiveWebhook
);

// API Management Routes
router.post('/api/keys/generate',
  authenticateToken,
  requirePermission('api:manage'),
  integrationController.generateAPIKey
);

router.delete('/api/keys/:apiKey',
  authenticateToken,
  requirePermission('api:manage'),
  integrationController.revokeAPIKey
);

router.get('/api/analytics',
  authenticateToken,
  requirePermission('api:view'),
  integrationController.getAPIAnalytics
);

router.get('/api/usage',
  authenticateToken,
  requirePermission('api:view'),
  integrationController.getTenantUsage
);

router.get('/api/health',
  authenticateToken,
  requirePermission('api:view'),
  integrationController.getAPIHealth
);

// Dashboard Routes
router.get('/dashboard',
  authenticateToken,
  requirePermission('integrations:view'),
  integrationController.getDashboardData
);

// Rate Limited Routes (more restrictive)
router.use('/external/*/sync', apiManagementService.getRateLimiter('integrations'));
router.use('/webhooks/*/test', apiManagementService.getRateLimiter('webhooks'));
router.use('/api/keys/*', apiManagementService.createCustomRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 API key operations per hour
  message: {
    error: 'API key management rate limit exceeded',
    code: 'API_KEY_RATE_LIMIT_EXCEEDED'
  }
}));

module.exports = router;
