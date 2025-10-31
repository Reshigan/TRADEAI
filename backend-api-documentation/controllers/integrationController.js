const externalIntegrationsService = require('../services/externalIntegrationsService');
const webhookService = require('../services/webhookService');
const apiManagementService = require('../services/apiManagementService');

class IntegrationController {
  // External Integrations
  async getIntegrations(req, res) {
    try {
      const integrations = await externalIntegrationsService.getAllIntegrations();
      
      res.json({
        success: true,
        data: integrations,
        message: 'Integrations retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting integrations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve integrations',
        error: error.message
      });
    }
  }

  async getIntegration(req, res) {
    try {
      const { integrationId } = req.params;
      const integration = await externalIntegrationsService.getIntegrationStatus(integrationId);
      
      res.json({
        success: true,
        data: integration,
        message: 'Integration retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting integration:', error);
      res.status(404).json({
        success: false,
        message: 'Integration not found',
        error: error.message
      });
    }
  }

  async connectIntegration(req, res) {
    try {
      const { integrationId } = req.params;
      const { credentials } = req.body;
      
      const result = await externalIntegrationsService.connectIntegration(integrationId, credentials);
      
      res.json({
        success: true,
        data: result,
        message: 'Integration connected successfully'
      });
    } catch (error) {
      console.error('Error connecting integration:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to connect integration',
        error: error.message
      });
    }
  }

  async disconnectIntegration(req, res) {
    try {
      const { integrationId } = req.params;
      
      const result = await externalIntegrationsService.disconnectIntegration(integrationId);
      
      res.json({
        success: true,
        data: result,
        message: 'Integration disconnected successfully'
      });
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to disconnect integration',
        error: error.message
      });
    }
  }

  async syncIntegration(req, res) {
    try {
      const { integrationId } = req.params;
      const { entities, fullSync = false } = req.body;
      
      const result = await externalIntegrationsService.syncIntegration(integrationId, {
        entities,
        fullSync
      });
      
      res.json({
        success: true,
        data: result,
        message: 'Integration sync completed successfully'
      });
    } catch (error) {
      console.error('Error syncing integration:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to sync integration',
        error: error.message
      });
    }
  }

  async getIntegrationMetrics(req, res) {
    try {
      const metrics = await externalIntegrationsService.getIntegrationMetrics();
      
      res.json({
        success: true,
        data: metrics,
        message: 'Integration metrics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting integration metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve integration metrics',
        error: error.message
      });
    }
  }

  // Webhook Management
  async createWebhook(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const webhookConfig = req.body;
      
      const webhook = await webhookService.registerWebhook(tenantId, webhookConfig);
      
      res.status(201).json({
        success: true,
        data: webhook,
        message: 'Webhook created successfully'
      });
    } catch (error) {
      console.error('Error creating webhook:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create webhook',
        error: error.message
      });
    }
  }

  async getWebhooks(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const webhooks = await webhookService.getWebhooksByTenant(tenantId);
      
      res.json({
        success: true,
        data: webhooks,
        message: 'Webhooks retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting webhooks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve webhooks',
        error: error.message
      });
    }
  }

  async getWebhook(req, res) {
    try {
      const { webhookId } = req.params;
      const webhook = await webhookService.getWebhook(webhookId);
      
      res.json({
        success: true,
        data: webhook,
        message: 'Webhook retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting webhook:', error);
      res.status(404).json({
        success: false,
        message: 'Webhook not found',
        error: error.message
      });
    }
  }

  async updateWebhook(req, res) {
    try {
      const { webhookId } = req.params;
      const updates = req.body;
      
      const webhook = await webhookService.updateWebhook(webhookId, updates);
      
      res.json({
        success: true,
        data: webhook,
        message: 'Webhook updated successfully'
      });
    } catch (error) {
      console.error('Error updating webhook:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to update webhook',
        error: error.message
      });
    }
  }

  async deleteWebhook(req, res) {
    try {
      const { webhookId } = req.params;
      
      const result = await webhookService.deleteWebhook(webhookId);
      
      res.json({
        success: true,
        data: result,
        message: 'Webhook deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting webhook:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to delete webhook',
        error: error.message
      });
    }
  }

  async testWebhook(req, res) {
    try {
      const { webhookId } = req.params;
      
      const result = await webhookService.testWebhook(webhookId);
      
      res.json({
        success: true,
        data: result,
        message: 'Webhook test completed'
      });
    } catch (error) {
      console.error('Error testing webhook:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to test webhook',
        error: error.message
      });
    }
  }

  async publishEvent(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const { eventType, eventData, options } = req.body;
      
      if (!eventType || !eventData) {
        return res.status(400).json({
          success: false,
          message: 'Event type and data are required'
        });
      }
      
      const result = await webhookService.publishEvent(tenantId, eventType, eventData, options);
      
      res.json({
        success: true,
        data: result,
        message: 'Event published successfully'
      });
    } catch (error) {
      console.error('Error publishing event:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to publish event',
        error: error.message
      });
    }
  }

  async getWebhookStats(req, res) {
    try {
      const { webhookId } = req.params;
      
      const stats = await webhookService.getWebhookStats(webhookId);
      
      res.json({
        success: true,
        data: stats,
        message: 'Webhook stats retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting webhook stats:', error);
      res.status(404).json({
        success: false,
        message: 'Failed to retrieve webhook stats',
        error: error.message
      });
    }
  }

  async getWebhookSystemStats(req, res) {
    try {
      const stats = await webhookService.getSystemStats();
      
      res.json({
        success: true,
        data: stats,
        message: 'Webhook system stats retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting webhook system stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve webhook system stats',
        error: error.message
      });
    }
  }

  // Webhook Receiver (for external systems)
  async receiveWebhook(req, res) {
    try {
      const { integrationId } = req.params;
      const signature = req.get('X-Webhook-Signature') || req.get('X-Hub-Signature-256');
      const webhookData = req.body;
      
      const result = await externalIntegrationsService.handleWebhook(integrationId, webhookData, signature);
      
      res.json({
        success: true,
        data: result,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to process webhook',
        error: error.message
      });
    }
  }

  // API Management
  async generateAPIKey(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const { tier = 'free' } = req.body;
      
      const result = await apiManagementService.generateAPIKeyForTenant(tenantId, tier);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'API key generated successfully'
      });
    } catch (error) {
      console.error('Error generating API key:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to generate API key',
        error: error.message
      });
    }
  }

  async revokeAPIKey(req, res) {
    try {
      const { apiKey } = req.params;
      
      const result = await apiManagementService.revokeAPIKey(apiKey);
      
      res.json({
        success: true,
        data: result,
        message: 'API key revoked successfully'
      });
    } catch (error) {
      console.error('Error revoking API key:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to revoke API key',
        error: error.message
      });
    }
  }

  async getAPIAnalytics(req, res) {
    try {
      const { timeRange = '24h' } = req.query;
      
      const analytics = await apiManagementService.getAPIAnalytics(timeRange);
      
      res.json({
        success: true,
        data: analytics,
        message: 'API analytics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting API analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve API analytics',
        error: error.message
      });
    }
  }

  async getTenantUsage(req, res) {
    try {
      const tenantId = req.tenant?.id;
      const { days = 7 } = req.query;
      
      const usage = await apiManagementService.getTenantUsage(tenantId, parseInt(days));
      
      res.json({
        success: true,
        data: usage,
        message: 'Tenant usage retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting tenant usage:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve tenant usage',
        error: error.message
      });
    }
  }

  async getAPIHealth(req, res) {
    try {
      const health = await apiManagementService.healthCheck();
      
      res.json({
        success: true,
        data: health,
        message: 'API health check completed'
      });
    } catch (error) {
      console.error('Error checking API health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check API health',
        error: error.message
      });
    }
  }

  // Integration Dashboard Data
  async getDashboardData(req, res) {
    try {
      const tenantId = req.tenant?.id;
      
      // Get data from all services
      const [
        integrations,
        integrationMetrics,
        webhooks,
        webhookStats,
        apiAnalytics,
        tenantUsage
      ] = await Promise.all([
        externalIntegrationsService.getAllIntegrations(),
        externalIntegrationsService.getIntegrationMetrics(),
        webhookService.getWebhooksByTenant(tenantId),
        webhookService.getSystemStats(),
        apiManagementService.getAPIAnalytics('24h'),
        apiManagementService.getTenantUsage(tenantId, 7)
      ]);
      
      const dashboardData = {
        integrations: {
          total: integrations.length,
          active: integrations.filter(i => i.status === 'active').length,
          error: integrations.filter(i => i.status === 'error').length,
          list: integrations
        },
        webhooks: {
          total: webhooks.length,
          active: webhooks.filter(w => w.active).length,
          stats: webhookStats,
          list: webhooks.slice(0, 5) // Latest 5
        },
        api: {
          analytics: apiAnalytics,
          usage: tenantUsage
        },
        metrics: integrationMetrics,
        summary: {
          totalIntegrations: integrations.length,
          activeWebhooks: webhooks.filter(w => w.active).length,
          dailyAPIRequests: tenantUsage[tenantUsage.length - 1]?.requests || 0,
          systemHealth: 'healthy'
        }
      };
      
      res.json({
        success: true,
        data: dashboardData,
        message: 'Dashboard data retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard data',
        error: error.message
      });
    }
  }

  // Bulk Operations
  async bulkSyncIntegrations(req, res) {
    try {
      const { integrationIds, options = {} } = req.body;
      
      if (!integrationIds || !Array.isArray(integrationIds)) {
        return res.status(400).json({
          success: false,
          message: 'Integration IDs array is required'
        });
      }
      
      const results = [];
      
      for (const integrationId of integrationIds) {
        try {
          const result = await externalIntegrationsService.syncIntegration(integrationId, options);
          results.push({ integrationId, success: true, result });
        } catch (error) {
          results.push({ integrationId, success: false, error: error.message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: errorCount,
            successRate: (successCount / results.length) * 100
          }
        },
        message: `Bulk sync completed: ${successCount}/${results.length} successful`
      });
    } catch (error) {
      console.error('Error in bulk sync:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk sync',
        error: error.message
      });
    }
  }

  async bulkUpdateWebhooks(req, res) {
    try {
      const { webhookIds, updates } = req.body;
      
      if (!webhookIds || !Array.isArray(webhookIds)) {
        return res.status(400).json({
          success: false,
          message: 'Webhook IDs array is required'
        });
      }
      
      const results = [];
      
      for (const webhookId of webhookIds) {
        try {
          const result = await webhookService.updateWebhook(webhookId, updates);
          results.push({ webhookId, success: true, result });
        } catch (error) {
          results.push({ webhookId, success: false, error: error.message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: results.length - successCount
          }
        },
        message: `Bulk update completed: ${successCount}/${results.length} successful`
      });
    } catch (error) {
      console.error('Error in bulk webhook update:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk webhook update',
        error: error.message
      });
    }
  }
}

module.exports = new IntegrationController();