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
  getCustomers(lastSyncDate = null) {
    const params = lastSyncDate ? `?changedSince=${lastSyncDate.toISOString()}` : '';
    return this.callSAP(`/api/customers${params}`);
  }

  getCustomer(customerId) {
    return this.callSAP(`/api/customers/${customerId}`);
  }

  // Product APIs
  getProducts(lastSyncDate = null) {
    const params = lastSyncDate ? `?changedSince=${lastSyncDate.toISOString()}` : '';
    return this.callSAP(`/api/materials${params}`);
  }

  getProduct(materialId) {
    return this.callSAP(`/api/materials/${materialId}`);
  }

  // Vendor APIs
  getVendors(lastSyncDate = null) {
    const params = lastSyncDate ? `?changedSince=${lastSyncDate.toISOString()}` : '';
    return this.callSAP(`/api/vendors${params}`);
  }

  getVendor(vendorId) {
    return this.callSAP(`/api/vendors/${vendorId}`);
  }

  // Sales History APIs
  getSalesHistory(startDate, endDate, customerId = null, productId = null) {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    if (customerId) params.append('customerId', customerId);
    if (productId) params.append('productId', productId);

    return this.callSAP(`/api/sales?${params.toString()}`);
  }

  // Pricing APIs
  getPricing(materialId, customerId, date = new Date()) {
    const params = new URLSearchParams({
      materialId,
      customerId,
      pricingDate: date.toISOString()
    });

    return this.callSAP(`/api/pricing?${params.toString()}`);
  }

  // Inventory APIs
  getInventory(materialId, plant = null) {
    const params = plant ? `?plant=${plant}` : '';
    return this.callSAP(`/api/inventory/${materialId}${params}`);
  }

  // Master Data APIs
  getHierarchy(type, level = null) {
    const params = level ? `?level=${level}` : '';
    return this.callSAP(`/api/hierarchies/${type}${params}`);
  }

  getCostCenters() {
    return this.callSAP('/api/costcenters');
  }

  getGLAccounts() {
    return this.callSAP('/api/glaccounts');
  }

  // Document APIs
  createSalesOrder(orderData) {
    return this.callSAP('/api/salesorders', 'POST', orderData);
  }

  createCreditNote(creditNoteData) {
    return this.callSAP('/api/creditnotes', 'POST', creditNoteData);
  }

  getDocument(documentType, documentNumber) {
    return this.callSAP(`/api/documents/${documentType}/${documentNumber}`);
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
