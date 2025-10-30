/**
 * Integration Framework
 * Provides base classes and utilities for third-party integrations
 */

const axios = require('axios');
const EventEmitter = require('events');

/**
 * Base Integration Class
 * All integrations should extend this class
 */
class BaseIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    this.name = config.name || 'BaseIntegration';
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.isConnected = false;
  }

  /**
   * Test connection to the external service
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass');
  }

  /**
   * Authenticate with the external service
   * @returns {Promise<boolean>}
   */
  async authenticate() {
    throw new Error('authenticate() must be implemented by subclass');
  }

  /**
   * Make an API request with retry logic
   * @param {Object} options - Axios request options
   * @returns {Promise<any>}
   */
  async makeRequest(options) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await axios({
          ...options,
          baseURL: this.baseURL,
          timeout: this.timeout,
          headers: {
            ...options.headers,
            'User-Agent': 'TRADEAI/2.0'
          }
        });
        
        this.emit('request_success', { attempt, options, response: response.data });
        return response.data;
      } catch (error) {
        lastError = error;
        this.emit('request_error', { attempt, options, error });
        
        if (attempt < this.retryAttempts) {
          // Exponential backoff
          await this.sleep(1000 * Math.pow(2, attempt - 1));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log integration activity
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  log(level, message, meta = {}) {
    this.emit('log', {
      level,
      message,
      integration: this.name,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }
}

/**
 * SAP Integration
 */
class SAPIntegration extends BaseIntegration {
  constructor(config) {
    super({ ...config, name: 'SAP' });
    this.client = config.client;
  }

  async testConnection() {
    try {
      const response = await this.makeRequest({
        method: 'GET',
        url: '/api/v1/ping'
      });
      
      this.isConnected = response.status === 'ok';
      return this.isConnected;
    } catch (error) {
      this.log('error', 'SAP connection test failed', { error: error.message });
      return false;
    }
  }

  async authenticate() {
    try {
      const response = await this.makeRequest({
        method: 'POST',
        url: '/api/v1/auth/token',
        data: {
          client: this.client,
          apiKey: this.apiKey
        }
      });
      
      this.accessToken = response.accessToken;
      this.tokenExpiry = new Date(Date.now() + response.expiresIn * 1000);
      return true;
    } catch (error) {
      this.log('error', 'SAP authentication failed', { error: error.message });
      return false;
    }
  }

  async syncProducts(products) {
    await this.ensureAuthenticated();
    
    const response = await this.makeRequest({
      method: 'POST',
      url: '/api/v1/products/batch',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      data: { products }
    });
    
    return response;
  }

  async syncOrders(orders) {
    await this.ensureAuthenticated();
    
    const response = await this.makeRequest({
      method: 'POST',
      url: '/api/v1/orders/batch',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      data: { orders }
    });
    
    return response;
  }

  async ensureAuthenticated() {
    if (!this.accessToken || new Date() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }
}

/**
 * Google Calendar Integration
 */
class GoogleCalendarIntegration extends BaseIntegration {
  constructor(config) {
    super({ ...config, name: 'GoogleCalendar', baseURL: 'https://www.googleapis.com/calendar/v3' });
    this.refreshToken = config.refreshToken;
  }

  async testConnection() {
    try {
      const response = await this.makeRequest({
        method: 'GET',
        url: '/users/me/calendarList',
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      
      this.isConnected = !!response.items;
      return this.isConnected;
    } catch (error) {
      this.log('error', 'Google Calendar connection test failed', { error: error.message });
      return false;
    }
  }

  async authenticate() {
    // OAuth2 refresh token flow
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.apiKey,
        client_secret: this.apiSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      });
      
      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
      return true;
    } catch (error) {
      this.log('error', 'Google Calendar authentication failed', { error: error.message });
      return false;
    }
  }

  async createCampaignEvent(campaign) {
    await this.ensureAuthenticated();
    
    const event = {
      summary: campaign.name,
      description: campaign.description,
      start: { dateTime: campaign.startDate },
      end: { dateTime: campaign.endDate },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 }
        ]
      }
    };
    
    const response = await this.makeRequest({
      method: 'POST',
      url: '/calendars/primary/events',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      data: event
    });
    
    return response;
  }

  async ensureAuthenticated() {
    if (!this.accessToken || new Date() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }
}

/**
 * Slack Integration
 */
class SlackIntegration extends BaseIntegration {
  constructor(config) {
    super({ ...config, name: 'Slack', baseURL: 'https://slack.com/api' });
    this.webhookUrl = config.webhookUrl;
  }

  async testConnection() {
    try {
      const response = await this.makeRequest({
        method: 'POST',
        url: '/auth.test',
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      
      this.isConnected = response.ok;
      return this.isConnected;
    } catch (error) {
      this.log('error', 'Slack connection test failed', { error: error.message });
      return false;
    }
  }

  async authenticate() {
    // Slack uses static tokens, so just verify
    return await this.testConnection();
  }

  async sendNotification(message) {
    const response = await axios.post(this.webhookUrl, {
      text: message.text,
      blocks: message.blocks || [],
      attachments: message.attachments || []
    });
    
    return response.data;
  }

  async notifyCampaignLaunch(campaign) {
    return await this.sendNotification({
      text: `🚀 Campaign Launched: ${campaign.name}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${campaign.name}* has been launched!\n\n*Budget:* R ${campaign.budget.toLocaleString()}\n*Duration:* ${campaign.duration} days`
          }
        }
      ]
    });
  }
}

/**
 * Integration Manager
 * Manages multiple integrations
 */
class IntegrationManager {
  constructor() {
    this.integrations = new Map();
  }

  /**
   * Register an integration
   * @param {string} name - Integration name
   * @param {BaseIntegration} integration - Integration instance
   */
  register(name, integration) {
    this.integrations.set(name, integration);
    
    // Setup logging
    integration.on('log', (log) => {
      console.log(`[${log.integration}] ${log.level.toUpperCase()}: ${log.message}`, log);
    });
  }

  /**
   * Get an integration
   * @param {string} name - Integration name
   * @returns {BaseIntegration|null}
   */
  get(name) {
    return this.integrations.get(name) || null;
  }

  /**
   * Test all integrations
   * @returns {Promise<Object>}
   */
  async testAll() {
    const results = {};
    
    for (const [name, integration] of this.integrations) {
      try {
        results[name] = await integration.testConnection();
      } catch (error) {
        results[name] = false;
      }
    }
    
    return results;
  }

  /**
   * Get integration status
   * @returns {Object}
   */
  getStatus() {
    const status = {};
    
    for (const [name, integration] of this.integrations) {
      status[name] = {
        connected: integration.isConnected,
        name: integration.name
      };
    }
    
    return status;
  }
}

module.exports = {
  BaseIntegration,
  SAPIntegration,
  GoogleCalendarIntegration,
  SlackIntegration,
  IntegrationManager
};
