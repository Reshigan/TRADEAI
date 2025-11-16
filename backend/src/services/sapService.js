const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class SAPService {
  constructor() {
    this.baseURL = config.sap.baseUrl;
    this.auth = {
      username: config.sap.username,
      password: config.sap.password
    };
    this.client = config.sap.client;
    this.language = config.sap.language;
  }

  // Create axios instance with SAP configuration
  createClient() {
    return axios.create({
      baseURL: this.baseURL,
      auth: this.auth,
      timeout: config.sap.timeout,
      headers: {
        'Content-Type': 'application/json',
        'sap-client': this.client,
        'sap-language': this.language
      }
    });
  }

  // Generic SAP API call with retry logic
  async callSAP(endpoint, method = 'GET', data = null) {
    const client = this.createClient();
    let attempts = 0;

    while (attempts < config.sap.retryAttempts) {
      try {
        const response = await client({
          method,
          url: endpoint,
          data
        });

        logger.logIntegration('SAP', `${method} ${endpoint}`, 'success', {
          responseStatus: response.status
        });

        return response.data;
      } catch (error) {
        attempts++;

        logger.logIntegration('SAP', `${method} ${endpoint}`, 'error', {
          attempt: attempts,
          error: error.message,
          status: error.response?.status
        });

        if (attempts >= config.sap.retryAttempts) {
          throw error;
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, config.sap.retryDelay));
      }
    }
  }

  // Customer APIs
  async getCustomers(lastSyncDate = null) {
    const params = lastSyncDate ? `?changedSince=${lastSyncDate.toISOString()}` : '';
    return await this.callSAP(`/api/customers${params}`);
  }

  async getCustomer(customerId) {
    return await this.callSAP(`/api/customers/${customerId}`);
  }

  // Product APIs
  async getProducts(lastSyncDate = null) {
    const params = lastSyncDate ? `?changedSince=${lastSyncDate.toISOString()}` : '';
    return await this.callSAP(`/api/materials${params}`);
  }

  async getProduct(materialId) {
    return await this.callSAP(`/api/materials/${materialId}`);
  }

  // Vendor APIs
  async getVendors(lastSyncDate = null) {
    const params = lastSyncDate ? `?changedSince=${lastSyncDate.toISOString()}` : '';
    return await this.callSAP(`/api/vendors${params}`);
  }

  async getVendor(vendorId) {
    return await this.callSAP(`/api/vendors/${vendorId}`);
  }

  // Sales History APIs
  async getSalesHistory(startDate, endDate, customerId = null, productId = null) {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    if (customerId) params.append('customerId', customerId);
    if (productId) params.append('productId', productId);

    return await this.callSAP(`/api/sales?${params.toString()}`);
  }

  // Pricing APIs
  async getPricing(materialId, customerId, date = new Date()) {
    const params = new URLSearchParams({
      materialId,
      customerId,
      pricingDate: date.toISOString()
    });

    return await this.callSAP(`/api/pricing?${params.toString()}`);
  }

  // Inventory APIs
  async getInventory(materialId, plant = null) {
    const params = plant ? `?plant=${plant}` : '';
    return await this.callSAP(`/api/inventory/${materialId}${params}`);
  }

  // Master Data APIs
  async getHierarchy(type, level = null) {
    const params = level ? `?level=${level}` : '';
    return await this.callSAP(`/api/hierarchies/${type}${params}`);
  }

  async getCostCenters() {
    return await this.callSAP('/api/costcenters');
  }

  async getGLAccounts() {
    return await this.callSAP('/api/glaccounts');
  }

  // Document APIs
  async createSalesOrder(orderData) {
    return await this.callSAP('/api/salesorders', 'POST', orderData);
  }

  async createCreditNote(creditNoteData) {
    return await this.callSAP('/api/creditnotes', 'POST', creditNoteData);
  }

  async getDocument(documentType, documentNumber) {
    return await this.callSAP(`/api/documents/${documentType}/${documentNumber}`);
  }

  // Batch processing
  async batchProcess(requests) {
    const batchSize = config.sap.batchSize;
    const results = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);

      try {
        const batchResults = await Promise.all(
          batch.map((request) => this.callSAP(request.endpoint, request.method, request.data))
        );
        results.push(...batchResults);
      } catch (error) {
        logger.error('Batch processing error', {
          batchIndex: i / batchSize,
          error: error.message
        });
        // Continue with next batch
      }
    }

    return results;
  }

  // Health check
  async healthCheck() {
    try {
      await this.callSAP('/api/health');
      return { status: 'connected', timestamp: new Date() };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

module.exports = new SAPService();
