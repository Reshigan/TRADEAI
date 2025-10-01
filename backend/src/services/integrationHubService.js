const EventEmitter = require('events');
const axios = require('axios');
const crypto = require('crypto');
const express = require('express');

/**
 * Integration Hub Service
 * Provides connectors, webhooks, data sync, API management, and third-party integrations
 */

class IntegrationHubService extends EventEmitter {
  constructor() {
    super();
    this.connectors = new Map();
    this.webhooks = new Map();
    this.syncJobs = new Map();
    this.apiConfigurations = new Map();
    this.integrationMetrics = new Map();
    this.webhookApp = express();
    this.isInitialized = false;
    
    this.initializeService();
  }

  async initializeService() {
    try {
      console.log('Initializing Integration Hub Service...');
      
      // Initialize connectors
      await this.initializeConnectors();
      
      // Setup webhook server
      this.setupWebhookServer();
      
      // Load API configurations
      await this.loadAPIConfigurations();
      
      // Start sync job monitoring
      this.startSyncJobMonitoring();
      
      this.isInitialized = true;
      console.log('Integration Hub Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Integration Hub Service:', error);
    }
  }

  /**
   * Initialize available connectors
   */
  async initializeConnectors() {
    // Salesforce Connector
    this.connectors.set('salesforce', {
      id: 'salesforce',
      name: 'Salesforce CRM',
      type: 'crm',
      version: '1.0',
      description: 'Sync customers and opportunities with Salesforce',
      authType: 'oauth2',
      endpoints: {
        auth: 'https://login.salesforce.com/services/oauth2/token',
        api: 'https://your-instance.salesforce.com/services/data/v52.0/',
        webhook: '/webhooks/salesforce'
      },
      capabilities: ['customers', 'opportunities', 'accounts', 'contacts'],
      rateLimits: {
        requests: 100000,
        window: 86400000 // 24 hours
      },
      fieldMappings: {
        customer: {
          'Name': 'name',
          'Email': 'email',
          'Phone': 'phone',
          'BillingStreet': 'address.street',
          'BillingCity': 'address.city',
          'BillingState': 'address.state',
          'BillingPostalCode': 'address.zipCode'
        }
      }
    });

    // SAP Connector
    this.connectors.set('sap', {
      id: 'sap',
      name: 'SAP ERP',
      type: 'erp',
      version: '1.0',
      description: 'Sync products and financial data with SAP',
      authType: 'basic',
      endpoints: {
        api: 'https://your-sap-server:8000/sap/opu/odata/sap/',
        webhook: '/webhooks/sap'
      },
      capabilities: ['products', 'pricing', 'inventory', 'financials'],
      rateLimits: {
        requests: 10000,
        window: 3600000 // 1 hour
      },
      fieldMappings: {
        product: {
          'Material': 'code',
          'MaterialDescription': 'name',
          'MaterialGroup': 'category.primary',
          'BaseUnitOfMeasure': 'unitOfMeasure',
          'NetWeight': 'specifications.weight'
        }
      }
    });

    // Shopify Connector
    this.connectors.set('shopify', {
      id: 'shopify',
      name: 'Shopify',
      type: 'ecommerce',
      version: '1.0',
      description: 'Sync products and orders with Shopify',
      authType: 'api_key',
      endpoints: {
        api: 'https://your-shop.myshopify.com/admin/api/2023-01/',
        webhook: '/webhooks/shopify'
      },
      capabilities: ['products', 'orders', 'customers', 'inventory'],
      rateLimits: {
        requests: 2000,
        window: 3600000 // 1 hour
      },
      fieldMappings: {
        product: {
          'title': 'name',
          'handle': 'code',
          'product_type': 'category.primary',
          'vendor': 'brand',
          'tags': 'tags'
        }
      }
    });

    // Google Analytics Connector
    this.connectors.set('google_analytics', {
      id: 'google_analytics',
      name: 'Google Analytics',
      type: 'analytics',
      version: '1.0',
      description: 'Import analytics data from Google Analytics',
      authType: 'oauth2',
      endpoints: {
        auth: 'https://accounts.google.com/o/oauth2/token',
        api: 'https://analyticsreporting.googleapis.com/v4/',
        webhook: '/webhooks/google_analytics'
      },
      capabilities: ['traffic', 'conversions', 'events', 'demographics'],
      rateLimits: {
        requests: 100000,
        window: 86400000 // 24 hours
      }
    });

    // Microsoft Dynamics Connector
    this.connectors.set('dynamics', {
      id: 'dynamics',
      name: 'Microsoft Dynamics 365',
      type: 'crm',
      version: '1.0',
      description: 'Sync CRM data with Microsoft Dynamics 365',
      authType: 'oauth2',
      endpoints: {
        auth: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        api: 'https://your-org.crm.dynamics.com/api/data/v9.2/',
        webhook: '/webhooks/dynamics'
      },
      capabilities: ['accounts', 'contacts', 'opportunities', 'leads'],
      rateLimits: {
        requests: 60000,
        window: 300000 // 5 minutes
      }
    });

    // Slack Connector
    this.connectors.set('slack', {
      id: 'slack',
      name: 'Slack',
      type: 'communication',
      version: '1.0',
      description: 'Send notifications and alerts to Slack',
      authType: 'oauth2',
      endpoints: {
        auth: 'https://slack.com/api/oauth.v2.access',
        api: 'https://slack.com/api/',
        webhook: '/webhooks/slack'
      },
      capabilities: ['notifications', 'alerts', 'reports'],
      rateLimits: {
        requests: 1000,
        window: 60000 // 1 minute
      }
    });

    console.log('Connectors initialized:', Array.from(this.connectors.keys()));
  }

  /**
   * Setup webhook server
   */
  setupWebhookServer() {
    this.webhookApp.use(express.json({ limit: '10mb' }));
    this.webhookApp.use(express.urlencoded({ extended: true }));

    // Webhook verification middleware
    this.webhookApp.use('/webhooks/*', (req, res, next) => {
      this.verifyWebhookSignature(req, res, next);
    });

    // Setup webhook endpoints for each connector
    this.connectors.forEach((connector, connectorId) => {
      if (connector.endpoints.webhook) {
        this.webhookApp.post(connector.endpoints.webhook, (req, res) => {
          this.handleWebhook(connectorId, req, res);
        });
      }
    });

    // Generic webhook endpoint
    this.webhookApp.post('/webhooks/:connectorId', (req, res) => {
      this.handleWebhook(req.params.connectorId, req, res);
    });

    console.log('Webhook server setup complete');
  }

  /**
   * Load API configurations
   */
  async loadAPIConfigurations() {
    // Load tenant-specific API configurations
    // In production, this would load from database
    this.apiConfigurations.set('tenant_1', {
      salesforce: {
        clientId: process.env.SALESFORCE_CLIENT_ID,
        clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
        refreshToken: process.env.SALESFORCE_REFRESH_TOKEN,
        instanceUrl: process.env.SALESFORCE_INSTANCE_URL
      },
      sap: {
        username: process.env.SAP_USERNAME,
        password: process.env.SAP_PASSWORD,
        baseUrl: process.env.SAP_BASE_URL
      },
      shopify: {
        apiKey: process.env.SHOPIFY_API_KEY,
        apiSecret: process.env.SHOPIFY_API_SECRET,
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
        shopDomain: process.env.SHOPIFY_SHOP_DOMAIN
      }
    });

    console.log('API configurations loaded');
  }

  /**
   * Create integration for tenant
   */
  async createIntegration(tenantId, connectorId, configuration) {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`);
    }

    const integrationId = this.generateIntegrationId();
    const integration = {
      id: integrationId,
      tenantId,
      connectorId,
      connectorName: connector.name,
      configuration: this.encryptConfiguration(configuration),
      status: 'active',
      createdAt: new Date(),
      lastSync: null,
      syncFrequency: configuration.syncFrequency || 'hourly',
      fieldMappings: configuration.fieldMappings || connector.fieldMappings,
      filters: configuration.filters || {},
      webhookUrl: configuration.webhookUrl,
      webhookSecret: configuration.webhookSecret || this.generateWebhookSecret()
    };

    // Store integration configuration
    const tenantIntegrations = this.apiConfigurations.get(tenantId) || {};
    tenantIntegrations[connectorId] = integration;
    this.apiConfigurations.set(tenantId, tenantIntegrations);

    // Test connection
    try {
      await this.testConnection(tenantId, connectorId);
      integration.connectionStatus = 'connected';
    } catch (error) {
      integration.connectionStatus = 'failed';
      integration.connectionError = error.message;
    }

    // Emit integration created event
    this.emit('integration_created', {
      tenantId,
      integrationId,
      connectorId
    });

    return integration;
  }

  /**
   * Test connection to external system
   */
  async testConnection(tenantId, connectorId) {
    const connector = this.connectors.get(connectorId);
    const config = this.getIntegrationConfig(tenantId, connectorId);

    if (!connector || !config) {
      throw new Error('Connector or configuration not found');
    }

    try {
      switch (connector.authType) {
        case 'oauth2':
          await this.testOAuth2Connection(connector, config);
          break;
        case 'api_key':
          await this.testAPIKeyConnection(connector, config);
          break;
        case 'basic':
          await this.testBasicAuthConnection(connector, config);
          break;
        default:
          throw new Error(`Unsupported auth type: ${connector.authType}`);
      }

      return { status: 'success', message: 'Connection successful' };
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  /**
   * Sync data from external system
   */
  async syncData(tenantId, connectorId, syncType = 'full', options = {}) {
    const connector = this.connectors.get(connectorId);
    const config = this.getIntegrationConfig(tenantId, connectorId);

    if (!connector || !config) {
      throw new Error('Connector or configuration not found');
    }

    const syncJobId = this.generateSyncJobId();
    const syncJob = {
      id: syncJobId,
      tenantId,
      connectorId,
      syncType,
      status: 'running',
      startTime: new Date(),
      progress: 0,
      recordsProcessed: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      errors: [],
      options
    };

    this.syncJobs.set(syncJobId, syncJob);

    try {
      // Emit sync started event
      this.emit('sync_started', {
        tenantId,
        connectorId,
        syncJobId,
        syncType
      });

      // Perform sync based on connector capabilities
      for (const capability of connector.capabilities) {
        if (options.capabilities && !options.capabilities.includes(capability)) {
          continue;
        }

        await this.syncCapability(syncJob, connector, config, capability);
      }

      // Mark sync as completed
      syncJob.status = 'completed';
      syncJob.endTime = new Date();
      syncJob.duration = syncJob.endTime - syncJob.startTime;

      // Update last sync time
      config.lastSync = new Date();

      // Emit sync completed event
      this.emit('sync_completed', {
        tenantId,
        connectorId,
        syncJobId,
        duration: syncJob.duration,
        recordsProcessed: syncJob.recordsProcessed
      });

      return syncJob;

    } catch (error) {
      syncJob.status = 'failed';
      syncJob.endTime = new Date();
      syncJob.error = error.message;

      // Emit sync failed event
      this.emit('sync_failed', {
        tenantId,
        connectorId,
        syncJobId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Sync specific capability
   */
  async syncCapability(syncJob, connector, config, capability) {
    console.log(`Syncing ${capability} for ${connector.name}...`);

    try {
      // Get data from external system
      const externalData = await this.fetchExternalData(connector, config, capability);
      
      // Transform data using field mappings
      const transformedData = this.transformData(externalData, connector.fieldMappings[capability]);
      
      // Apply filters
      const filteredData = this.applyFilters(transformedData, config.filters[capability]);
      
      // Sync to internal system
      const syncResults = await this.syncToInternalSystem(syncJob.tenantId, capability, filteredData);
      
      // Update sync job metrics
      syncJob.recordsProcessed += filteredData.length;
      syncJob.recordsSuccessful += syncResults.successful;
      syncJob.recordsFailed += syncResults.failed;
      
      if (syncResults.errors.length > 0) {
        syncJob.errors.push(...syncResults.errors);
      }

    } catch (error) {
      console.error(`Error syncing ${capability}:`, error);
      syncJob.errors.push({
        capability,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle incoming webhook
   */
  handleWebhook(connectorId, req, res) {
    try {
      const connector = this.connectors.get(connectorId);
      if (!connector) {
        return res.status(404).json({ error: 'Connector not found' });
      }

      // Extract tenant ID from webhook payload or headers
      const tenantId = this.extractTenantFromWebhook(req);
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID not found' });
      }

      // Process webhook payload
      this.processWebhookPayload(tenantId, connectorId, req.body);

      // Emit webhook received event
      this.emit('webhook_received', {
        tenantId,
        connectorId,
        payload: req.body,
        timestamp: new Date()
      });

      res.status(200).json({ status: 'success', message: 'Webhook processed' });

    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Process webhook payload
   */
  processWebhookPayload(tenantId, connectorId, payload) {
    const connector = this.connectors.get(connectorId);
    
    switch (connectorId) {
      case 'salesforce':
        this.processSalesforceWebhook(tenantId, payload);
        break;
      case 'shopify':
        this.processShopifyWebhook(tenantId, payload);
        break;
      case 'slack':
        this.processSlackWebhook(tenantId, payload);
        break;
      default:
        this.processGenericWebhook(tenantId, connectorId, payload);
    }
  }

  /**
   * Send data to external system
   */
  async sendToExternalSystem(tenantId, connectorId, data, operation = 'create') {
    const connector = this.connectors.get(connectorId);
    const config = this.getIntegrationConfig(tenantId, connectorId);

    if (!connector || !config) {
      throw new Error('Connector or configuration not found');
    }

    try {
      // Get access token
      const accessToken = await this.getAccessToken(connector, config);
      
      // Transform data for external system
      const transformedData = this.transformDataForExternal(data, connector.fieldMappings);
      
      // Send to external system
      const response = await this.makeAPIRequest(connector, config, {
        method: operation === 'create' ? 'POST' : 'PUT',
        endpoint: this.getEndpointForOperation(connector, operation),
        data: transformedData,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        externalId: response.data.id,
        response: response.data
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get integration metrics
   */
  getIntegrationMetrics(tenantId, connectorId = null) {
    const metrics = {
      totalIntegrations: 0,
      activeIntegrations: 0,
      syncJobs: {
        total: 0,
        successful: 0,
        failed: 0,
        running: 0
      },
      webhooks: {
        total: 0,
        successful: 0,
        failed: 0
      },
      dataVolume: {
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0
      }
    };

    // Calculate metrics from sync jobs
    this.syncJobs.forEach(job => {
      if (job.tenantId === tenantId && (!connectorId || job.connectorId === connectorId)) {
        metrics.syncJobs.total++;
        
        switch (job.status) {
          case 'completed':
            metrics.syncJobs.successful++;
            break;
          case 'failed':
            metrics.syncJobs.failed++;
            break;
          case 'running':
            metrics.syncJobs.running++;
            break;
        }
        
        metrics.dataVolume.recordsProcessed += job.recordsProcessed;
        metrics.dataVolume.recordsSuccessful += job.recordsSuccessful;
        metrics.dataVolume.recordsFailed += job.recordsFailed;
      }
    });

    return metrics;
  }

  /**
   * Get available connectors
   */
  getAvailableConnectors() {
    return Array.from(this.connectors.values()).map(connector => ({
      id: connector.id,
      name: connector.name,
      type: connector.type,
      description: connector.description,
      capabilities: connector.capabilities,
      authType: connector.authType
    }));
  }

  /**
   * Get integration status
   */
  getIntegrationStatus(tenantId, connectorId) {
    const config = this.getIntegrationConfig(tenantId, connectorId);
    if (!config) {
      return { status: 'not_configured' };
    }

    return {
      status: config.status,
      connectionStatus: config.connectionStatus,
      lastSync: config.lastSync,
      syncFrequency: config.syncFrequency,
      recordsProcessed: config.recordsProcessed || 0,
      lastError: config.connectionError
    };
  }

  // Helper methods
  generateIntegrationId() {
    return `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSyncJobId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateWebhookSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  encryptConfiguration(config) {
    // In production, encrypt sensitive configuration data
    return config;
  }

  getIntegrationConfig(tenantId, connectorId) {
    const tenantConfigs = this.apiConfigurations.get(tenantId);
    return tenantConfigs ? tenantConfigs[connectorId] : null;
  }

  verifyWebhookSignature(req, res, next) {
    // Implement webhook signature verification
    // This would verify HMAC signatures from external systems
    next();
  }

  extractTenantFromWebhook(req) {
    // Extract tenant ID from webhook headers or payload
    return req.headers['x-tenant-id'] || req.body.tenantId || 'tenant_1';
  }

  async testOAuth2Connection(connector, config) {
    // Test OAuth2 connection
    const response = await axios.post(connector.endpoints.auth, {
      grant_type: 'refresh_token',
      refresh_token: config.refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret
    });

    if (!response.data.access_token) {
      throw new Error('Failed to obtain access token');
    }
  }

  async testAPIKeyConnection(connector, config) {
    // Test API key connection
    const response = await axios.get(connector.endpoints.api, {
      headers: {
        'X-Shopify-Access-Token': config.accessToken
      }
    });

    if (response.status !== 200) {
      throw new Error('API key authentication failed');
    }
  }

  async testBasicAuthConnection(connector, config) {
    // Test basic auth connection
    const response = await axios.get(connector.endpoints.api, {
      auth: {
        username: config.username,
        password: config.password
      }
    });

    if (response.status !== 200) {
      throw new Error('Basic authentication failed');
    }
  }

  async fetchExternalData(connector, config, capability) {
    // Mock implementation - would fetch actual data from external systems
    return [
      { id: '1', name: 'Sample Record 1' },
      { id: '2', name: 'Sample Record 2' }
    ];
  }

  transformData(data, fieldMappings) {
    if (!fieldMappings) return data;

    return data.map(record => {
      const transformed = {};
      Object.entries(fieldMappings).forEach(([externalField, internalField]) => {
        if (record[externalField] !== undefined) {
          this.setNestedValue(transformed, internalField, record[externalField]);
        }
      });
      return transformed;
    });
  }

  transformDataForExternal(data, fieldMappings) {
    if (!fieldMappings) return data;

    const transformed = {};
    Object.entries(fieldMappings).forEach(([externalField, internalField]) => {
      const value = this.getNestedValue(data, internalField);
      if (value !== undefined) {
        transformed[externalField] = value;
      }
    });
    return transformed;
  }

  applyFilters(data, filters) {
    if (!filters) return data;

    return data.filter(record => {
      return Object.entries(filters).every(([field, condition]) => {
        const value = this.getNestedValue(record, field);
        return this.evaluateFilterCondition(value, condition);
      });
    });
  }

  async syncToInternalSystem(tenantId, capability, data) {
    // Mock implementation - would sync to actual internal system
    console.log(`Syncing ${data.length} ${capability} records for tenant ${tenantId}`);
    
    return {
      successful: data.length,
      failed: 0,
      errors: []
    };
  }

  async getAccessToken(connector, config) {
    // Mock implementation - would get actual access tokens
    return 'mock_access_token';
  }

  async makeAPIRequest(connector, config, options) {
    // Mock implementation - would make actual API requests
    return {
      data: { id: 'mock_id', status: 'success' }
    };
  }

  getEndpointForOperation(connector, operation) {
    // Return appropriate endpoint for operation
    return connector.endpoints.api + 'records';
  }

  processSalesforceWebhook(tenantId, payload) {
    console.log('Processing Salesforce webhook for tenant:', tenantId);
    // Process Salesforce-specific webhook payload
  }

  processShopifyWebhook(tenantId, payload) {
    console.log('Processing Shopify webhook for tenant:', tenantId);
    // Process Shopify-specific webhook payload
  }

  processSlackWebhook(tenantId, payload) {
    console.log('Processing Slack webhook for tenant:', tenantId);
    // Process Slack-specific webhook payload
  }

  processGenericWebhook(tenantId, connectorId, payload) {
    console.log(`Processing generic webhook for ${connectorId}, tenant:`, tenantId);
    // Process generic webhook payload
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  evaluateFilterCondition(value, condition) {
    // Simple filter condition evaluation
    if (typeof condition === 'string' || typeof condition === 'number') {
      return value === condition;
    }
    
    if (condition.operator) {
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).includes(condition.value);
        case 'greater_than':
          return value > condition.value;
        case 'less_than':
          return value < condition.value;
        default:
          return true;
      }
    }
    
    return true;
  }

  startSyncJobMonitoring() {
    // Monitor sync jobs every minute
    setInterval(() => {
      this.cleanupCompletedSyncJobs();
    }, 60000);

    console.log('Sync job monitoring started');
  }

  cleanupCompletedSyncJobs() {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24); // Keep jobs for 24 hours

    let cleanedCount = 0;
    this.syncJobs.forEach((job, jobId) => {
      if (job.endTime && job.endTime < cutoff) {
        this.syncJobs.delete(jobId);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old sync jobs`);
    }
  }

  // Public methods for webhook server
  startWebhookServer(port = 3100) {
    return new Promise((resolve, reject) => {
      const server = this.webhookApp.listen(port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`Integration Hub webhook server listening on port ${port}`);
          resolve(server);
        }
      });
    });
  }
}

module.exports = IntegrationHubService;