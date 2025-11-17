const axios = require('axios');
const crypto = require('crypto-js');
const schedule = require('node-schedule');

class ExternalIntegrationsService {
  constructor() {
    this.integrations = new Map();
    this.syncJobs = new Map();
    this.connectionPool = new Map();
    this.retryQueue = [];
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    console.log('Initializing External Integrations Service...');

    // Initialize default integrations
    await this.initializeDefaultIntegrations();

    // Start sync scheduler
    this.startSyncScheduler();

    // Start retry processor
    this.startRetryProcessor();

    this.initialized = true;
    console.log('External Integrations Service initialized successfully');
  }

  initializeDefaultIntegrations() {
    // ERP Integration (SAP, Oracle, etc.)
    this.registerIntegration('erp', {
      name: 'Enterprise Resource Planning',
      type: 'erp',
      protocol: 'rest',
      baseUrl: process.env.ERP_BASE_URL || 'https://api.erp-system.com',
      authentication: {
        type: 'oauth2',
        clientId: process.env.ERP_CLIENT_ID,
        clientSecret: process.env.ERP_CLIENT_SECRET,
        tokenUrl: process.env.ERP_TOKEN_URL
      },
      endpoints: {
        products: '/api/v1/products',
        customers: '/api/v1/customers',
        orders: '/api/v1/orders',
        inventory: '/api/v1/inventory'
      },
      syncSchedule: '0 */6 * * *', // Every 6 hours
      enabled: true
    });

    // CRM Integration (Salesforce, HubSpot, etc.)
    this.registerIntegration('crm', {
      name: 'Customer Relationship Management',
      type: 'crm',
      protocol: 'rest',
      baseUrl: process.env.CRM_BASE_URL || 'https://api.salesforce.com',
      authentication: {
        type: 'oauth2',
        clientId: process.env.CRM_CLIENT_ID,
        clientSecret: process.env.CRM_CLIENT_SECRET,
        tokenUrl: process.env.CRM_TOKEN_URL
      },
      endpoints: {
        contacts: '/services/data/v52.0/sobjects/Contact',
        accounts: '/services/data/v52.0/sobjects/Account',
        opportunities: '/services/data/v52.0/sobjects/Opportunity',
        campaigns: '/services/data/v52.0/sobjects/Campaign'
      },
      syncSchedule: '0 */4 * * *', // Every 4 hours
      enabled: true
    });

    // POS Integration (Square, Shopify, etc.)
    this.registerIntegration('pos', {
      name: 'Point of Sale System',
      type: 'pos',
      protocol: 'rest',
      baseUrl: process.env.POS_BASE_URL || 'https://connect.squareup.com',
      authentication: {
        type: 'bearer',
        token: process.env.POS_ACCESS_TOKEN
      },
      endpoints: {
        transactions: '/v2/payments',
        items: '/v2/catalog/list',
        locations: '/v2/locations',
        customers: '/v2/customers'
      },
      syncSchedule: '*/15 * * * *', // Every 15 minutes
      enabled: true
    });

    // Email Marketing Integration (Mailchimp, SendGrid, etc.)
    this.registerIntegration('email', {
      name: 'Email Marketing Platform',
      type: 'email',
      protocol: 'rest',
      baseUrl: process.env.EMAIL_BASE_URL || 'https://api.mailchimp.com/3.0',
      authentication: {
        type: 'apikey',
        key: process.env.EMAIL_API_KEY
      },
      endpoints: {
        lists: '/lists',
        campaigns: '/campaigns',
        reports: '/reports',
        automations: '/automations'
      },
      syncSchedule: '0 */2 * * *', // Every 2 hours
      enabled: true
    });

    // Social Media Integration (Facebook, Google Ads, etc.)
    this.registerIntegration('social', {
      name: 'Social Media Advertising',
      type: 'social',
      protocol: 'rest',
      baseUrl: process.env.SOCIAL_BASE_URL || 'https://graph.facebook.com',
      authentication: {
        type: 'oauth2',
        accessToken: process.env.SOCIAL_ACCESS_TOKEN
      },
      endpoints: {
        campaigns: '/v15.0/act_{ad_account_id}/campaigns',
        adsets: '/v15.0/act_{ad_account_id}/adsets',
        ads: '/v15.0/act_{ad_account_id}/ads',
        insights: '/v15.0/act_{ad_account_id}/insights'
      },
      syncSchedule: '0 */3 * * *', // Every 3 hours
      enabled: true
    });

    // Analytics Integration (Google Analytics, Adobe Analytics, etc.)
    this.registerIntegration('analytics', {
      name: 'Web Analytics Platform',
      type: 'analytics',
      protocol: 'rest',
      baseUrl: process.env.ANALYTICS_BASE_URL || 'https://analyticsreporting.googleapis.com',
      authentication: {
        type: 'oauth2',
        serviceAccount: process.env.ANALYTICS_SERVICE_ACCOUNT
      },
      endpoints: {
        reports: '/v4/reports:batchGet',
        realtime: '/v3/data/realtime',
        goals: '/v3/management/accounts/{accountId}/webproperties/{webPropertyId}/profiles/{profileId}/goals'
      },
      syncSchedule: '0 */1 * * *', // Every hour
      enabled: true
    });
  }

  registerIntegration(id, config) {
    this.integrations.set(id, {
      ...config,
      id,
      status: 'inactive',
      lastSync: null,
      lastError: null,
      syncCount: 0,
      errorCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async connectIntegration(integrationId, credentials = {}) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    try {
      // Update credentials if provided
      if (Object.keys(credentials).length > 0) {
        integration.authentication = { ...integration.authentication, ...credentials };
      }

      // Test connection
      const connection = await this.createConnection(integration);
      await this.testConnection(connection, integration);

      // Store connection
      this.connectionPool.set(integrationId, connection);

      // Update integration status
      integration.status = 'active';
      integration.lastSync = new Date();
      integration.updatedAt = new Date();

      // Schedule sync job
      if (integration.syncSchedule && integration.enabled) {
        this.scheduleSyncJob(integrationId, integration.syncSchedule);
      }

      return {
        success: true,
        message: `Successfully connected to ${integration.name}`,
        integration: this.sanitizeIntegration(integration)
      };
    } catch (error) {
      integration.status = 'error';
      integration.lastError = error.message;
      integration.errorCount++;
      integration.updatedAt = new Date();

      throw new Error(`Failed to connect to ${integration.name}: ${error.message}`);
    }
  }

  async createConnection(integration) {
    const connection = axios.create({
      baseURL: integration.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TRADEAI-Integration/1.0'
      }
    });

    // Add authentication
    await this.addAuthentication(connection, integration.authentication);

    // Add request/response interceptors
    this.addInterceptors(connection, integration);

    return connection;
  }

  async addAuthentication(connection, auth) {
    switch (auth.type) {
      case 'bearer':
        connection.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
        break;

      case 'apikey':
        connection.defaults.headers.common['Authorization'] = `apikey ${auth.key}`;
        break;

      case 'basic': {
        const basicAuth = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
        connection.defaults.headers.common['Authorization'] = `Basic ${basicAuth}`;
        break;
      }

      case 'oauth2':
        if (auth.accessToken) {
          connection.defaults.headers.common['Authorization'] = `Bearer ${auth.accessToken}`;
        } else {
          // Get OAuth2 token
          const token = await this.getOAuth2Token(auth);
          connection.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        break;

      case 'custom':
        if (auth.headers) {
          Object.assign(connection.defaults.headers.common, auth.headers);
        }
        break;
    }
  }

  async getOAuth2Token(auth) {
    try {
      const response = await axios.post(auth.tokenUrl, {
        grant_type: 'client_credentials',
        client_id: auth.clientId,
        client_secret: auth.clientSecret,
        scope: auth.scope || ''
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data.access_token;
    } catch (error) {
      throw new Error(`OAuth2 token request failed: ${error.message}`);
    }
  }

  addInterceptors(connection, integration) {
    // Request interceptor
    connection.interceptors.request.use(
      (config) => {
        console.log(`[${integration.id}] Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error(`[${integration.id}] Request error:`, error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    connection.interceptors.response.use(
      (response) => {
        console.log(`[${integration.id}] Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error(`[${integration.id}] Response error:`, error.response?.status, error.message);

        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 60;
          console.log(`[${integration.id}] Rate limited, retrying after ${retryAfter}s`);

          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(connection.request(error.config));
            }, retryAfter * 1000);
          });
        }

        return Promise.reject(error);
      }
    );
  }

  async testConnection(connection, integration) {
    try {
      // Try to make a simple request to test connectivity
      const testEndpoint = integration.endpoints.test || Object.values(integration.endpoints)[0];
      await connection.get(testEndpoint);
      return true;
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  async syncIntegration(integrationId, options = {}) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    const connection = this.connectionPool.get(integrationId);
    if (!connection) {
      throw new Error(`No active connection for integration ${integrationId}`);
    }

    try {
      console.log(`Starting sync for integration: ${integration.name}`);

      const syncResults = {};
      const { entities = Object.keys(integration.endpoints), fullSync = false } = options;

      for (const entity of entities) {
        if (integration.endpoints[entity]) {
          try {
            const result = await this.syncEntity(connection, integration, entity, fullSync);
            syncResults[entity] = result;
          } catch (error) {
            console.error(`Error syncing ${entity} for ${integrationId}:`, error);
            syncResults[entity] = { error: error.message, synced: 0 };
          }
        }
      }

      // Update integration stats
      integration.lastSync = new Date();
      integration.syncCount++;
      integration.updatedAt = new Date();

      console.log(`Sync completed for integration: ${integration.name}`);

      return {
        integrationId,
        syncResults,
        timestamp: new Date(),
        totalSynced: Object.values(syncResults).reduce((sum, result) => sum + (result.synced || 0), 0)
      };
    } catch (error) {
      integration.lastError = error.message;
      integration.errorCount++;
      integration.updatedAt = new Date();

      throw error;
    }
  }

  async syncEntity(connection, integration, entity, fullSync = false) {
    const endpoint = integration.endpoints[entity];
    let syncedCount = 0;
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        const params = {
          limit: pageSize,
          offset: (page - 1) * pageSize
        };

        // Add incremental sync parameters if not full sync
        if (!fullSync && integration.lastSync) {
          params.modified_since = integration.lastSync.toISOString();
        }

        const response = await connection.get(endpoint, { params });
        const data = this.extractDataFromResponse(response.data, entity);

        if (data && data.length > 0) {
          // Process and store data
          await this.processEntityData(integration.id, entity, data);
          syncedCount += data.length;

          // Check if there are more pages
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }

        // Add delay to respect rate limits
        await this.delay(100);
      } catch (error) {
        console.error(`Error syncing page ${page} of ${entity}:`, error);
        hasMore = false;
      }
    }

    return { synced: syncedCount, entity };
  }

  extractDataFromResponse(responseData, entity) {
    // Handle different response formats
    if (Array.isArray(responseData)) {
      return responseData;
    }

    // Common patterns for paginated responses
    const possibleKeys = [
      'data', 'items', 'results', 'records', entity, `${entity}s`,
      'value', 'content', 'list', 'entries'
    ];

    for (const key of possibleKeys) {
      if (responseData[key] && Array.isArray(responseData[key])) {
        return responseData[key];
      }
    }

    // If single object, wrap in array
    if (typeof responseData === 'object' && responseData !== null) {
      return [responseData];
    }

    return [];
  }

  async processEntityData(integrationId, entity, data) {
    // Transform and store data based on entity type
    const transformedData = data.map((item) => this.transformEntityData(integrationId, entity, item));

    // Store in database (mock implementation)
    console.log(`Storing ${transformedData.length} ${entity} records from ${integrationId}`);

    // Here you would typically save to your database
    // await this.database.saveIntegrationData(integrationId, entity, transformedData);

    return transformedData;
  }

  transformEntityData(integrationId, entity, data) {
    // Apply entity-specific transformations
    const transformed = {
      integrationId,
      entity,
      externalId: data.id || data.external_id,
      data,
      syncedAt: new Date(),
      checksum: this.calculateChecksum(data)
    };

    // Entity-specific transformations
    switch (entity) {
      case 'customers':
      case 'contacts':
        transformed.standardized = {
          name: data.name || `${data.first_name} ${data.last_name}`.trim(),
          email: data.email,
          phone: data.phone,
          company: data.company || data.account_name,
          address: this.standardizeAddress(data.address || data.billing_address)
        };
        break;

      case 'products':
      case 'items':
        transformed.standardized = {
          name: data.name || data.title,
          sku: data.sku || data.item_code,
          price: parseFloat(data.price || data.unit_price || 0),
          category: data.category || data.product_category,
          description: data.description
        };
        break;

      case 'orders':
      case 'transactions':
        transformed.standardized = {
          orderNumber: data.order_number || data.transaction_id,
          customerId: data.customer_id,
          total: parseFloat(data.total || data.amount || 0),
          currency: data.currency || 'ZAR',
          status: data.status,
          orderDate: new Date(data.created_at || data.order_date)
        };
        break;
    }

    return transformed;
  }

  standardizeAddress(address) {
    if (!address) return null;

    return {
      street: address.street || address.address_line_1,
      city: address.city,
      state: address.state || address.province,
      postalCode: address.postal_code || address.zip_code,
      country: address.country
    };
  }

  calculateChecksum(data) {
    return crypto.MD5(JSON.stringify(data)).toString();
  }

  scheduleSyncJob(integrationId, schedule) {
    // Cancel existing job if any
    if (this.syncJobs.has(integrationId)) {
      this.syncJobs.get(integrationId).cancel();
    }

    // Schedule new job
    const job = schedule.scheduleJob(schedule, async () => {
      try {
        await this.syncIntegration(integrationId);
      } catch (error) {
        console.error(`Scheduled sync failed for ${integrationId}:`, error);
      }
    });

    this.syncJobs.set(integrationId, job);
  }

  startSyncScheduler() {
    // Start all enabled integrations
    for (const [id, integration] of this.integrations) {
      if (integration.enabled && integration.syncSchedule) {
        this.scheduleSyncJob(id, integration.syncSchedule);
      }
    }
  }

  startRetryProcessor() {
    // Process retry queue every minute
    setInterval(() => {
      this.processRetryQueue();
    }, 60000);
  }

  async processRetryQueue() {
    if (this.retryQueue.length === 0) return;

    const now = Date.now();
    const itemsToRetry = this.retryQueue.filter((item) => item.retryAt <= now);

    for (const item of itemsToRetry) {
      try {
        await this.syncIntegration(item.integrationId, item.options);

        // Remove from retry queue on success
        const index = this.retryQueue.indexOf(item);
        if (index > -1) {
          this.retryQueue.splice(index, 1);
        }
      } catch (error) {
        // Increment retry count and reschedule if under limit
        item.retryCount++;
        if (item.retryCount < 3) {
          item.retryAt = now + (item.retryCount * 300000); // Exponential backoff
        } else {
          // Remove from queue after max retries
          const index = this.retryQueue.indexOf(item);
          if (index > -1) {
            this.retryQueue.splice(index, 1);
          }
        }
      }
    }
  }

  disconnectIntegration(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    // Cancel sync job
    if (this.syncJobs.has(integrationId)) {
      this.syncJobs.get(integrationId).cancel();
      this.syncJobs.delete(integrationId);
    }

    // Remove connection
    this.connectionPool.delete(integrationId);

    // Update status
    integration.status = 'inactive';
    integration.updatedAt = new Date();

    return {
      success: true,
      message: `Disconnected from ${integration.name}`
    };
  }

  getIntegrationStatus(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    return this.sanitizeIntegration(integration);
  }

  getAllIntegrations() {
    const integrations = [];
    for (const integration of this.integrations.values()) {
      integrations.push(this.sanitizeIntegration(integration));
    }
    return integrations;
  }

  sanitizeIntegration(integration) {
    const sanitized = { ...integration };

    // Remove sensitive information
    if (sanitized.authentication) {
      sanitized.authentication = {
        type: sanitized.authentication.type,
        configured: !!(sanitized.authentication.token ||
                      sanitized.authentication.key ||
                      sanitized.authentication.clientId)
      };
    }

    return sanitized;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Webhook support methods
  async registerWebhook(integrationId, webhookConfig) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    const connection = this.connectionPool.get(integrationId);
    if (!connection) {
      throw new Error(`No active connection for integration ${integrationId}`);
    }

    try {
      // Register webhook with external system
      const response = await connection.post('/webhooks', {
        url: webhookConfig.url,
        events: webhookConfig.events,
        secret: webhookConfig.secret
      });

      // Store webhook configuration
      if (!integration.webhooks) {
        integration.webhooks = [];
      }

      integration.webhooks.push({
        id: response.data.id,
        url: webhookConfig.url,
        events: webhookConfig.events,
        secret: webhookConfig.secret,
        createdAt: new Date()
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to register webhook: ${error.message}`);
    }
  }

  async handleWebhook(integrationId, webhookData, signature) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    // Verify webhook signature
    const isValid = this.verifyWebhookSignature(webhookData, signature, integration.webhooks);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    // Process webhook data
    await this.processWebhookData(integrationId, webhookData);

    return { success: true, processed: true };
  }

  verifyWebhookSignature(data, signature, webhooks) {
    // Implement signature verification based on integration type
    // This is a simplified version
    for (const webhook of webhooks || []) {
      if (webhook.secret) {
        const expectedSignature = crypto.HmacSHA256(JSON.stringify(data), webhook.secret).toString();
        if (signature === expectedSignature) {
          return true;
        }
      }
    }
    return false;
  }

  async processWebhookData(integrationId, data) {
    console.log(`Processing webhook data for ${integrationId}:`, data);

    // Extract event type and data
    const eventType = data.event || data.type;
    const eventData = data.data || data.payload;

    // Process based on event type
    switch (eventType) {
      case 'customer.created':
      case 'customer.updated':
        await this.processEntityData(integrationId, 'customers', [eventData]);
        break;

      case 'order.created':
      case 'order.updated':
        await this.processEntityData(integrationId, 'orders', [eventData]);
        break;

      case 'product.created':
      case 'product.updated':
        await this.processEntityData(integrationId, 'products', [eventData]);
        break;

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }
  }

  getIntegrationMetrics() {
    const metrics = {
      totalIntegrations: this.integrations.size,
      activeIntegrations: 0,
      errorIntegrations: 0,
      totalSyncs: 0,
      totalErrors: 0,
      lastSyncTimes: {},
      connectionStatus: {}
    };

    for (const [id, integration] of this.integrations) {
      if (integration.status === 'active') {
        metrics.activeIntegrations++;
      } else if (integration.status === 'error') {
        metrics.errorIntegrations++;
      }

      metrics.totalSyncs += integration.syncCount || 0;
      metrics.totalErrors += integration.errorCount || 0;
      metrics.lastSyncTimes[id] = integration.lastSync;
      metrics.connectionStatus[id] = integration.status;
    }

    return metrics;
  }
}

module.exports = new ExternalIntegrationsService();
