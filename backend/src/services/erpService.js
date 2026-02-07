/**
 * ERP Integration Service
 * Provides real connection to SAP and generic ERP systems for master data and sales sync
 */

const axios = require('axios');
const logger = require('../utils/logger');

class ERPService {
  constructor(settings) {
    this.settings = settings;
  }

  // ==================== SAP INTEGRATION ====================

  /**
   * Test SAP connection
   */
  async testSAPConnection() {
    const { sap } = this.settings;

    if (!sap || !sap.host) {
      return { success: false, status: 'not_configured', error: 'SAP not configured' };
    }

    try {
      let response;

      if (sap.connectionType === 'api' || sap.connectionType === 'middleware') {
        // REST API connection (SAP Gateway, SAP API Hub, or middleware like MuleSoft)
        const baseUrl = sap.host.startsWith('http') ? sap.host : `https://${sap.host}`;

        response = await axios.get(`${baseUrl}/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner?$top=1`, {
          auth: {
            username: sap.username,
            password: sap.password
          },
          headers: {
            'Accept': 'application/json',
            'x-csrf-token': 'fetch'
          },
          timeout: 30000,
          validateStatus: (status) => status < 500
        });

        if (response.status === 200 || response.status === 401) {
          // 401 means auth failed but connection works
          return {
            success: response.status === 200,
            status: response.status === 200 ? 'connected' : 'auth_failed',
            message: response.status === 200 ? 'SAP connection successful' : 'Authentication failed - check credentials'
          };
        }
      } else if (sap.connectionType === 'direct') {
        // Direct RFC connection would use node-rfc library
        // For now, we'll use HTTP ping to the SAP system
        const baseUrl = sap.host.startsWith('http') ? sap.host : `https://${sap.host}:${sap.port || 443}`;

        response = await axios.get(`${baseUrl}/sap/bc/ping`, {
          timeout: 15000,
          validateStatus: () => true
        });

        return {
          success: response.status < 500,
          status: response.status < 500 ? 'connected' : 'error',
          message: response.status < 500 ? 'SAP system reachable' : 'SAP system unreachable'
        };
      }

      return { success: false, status: 'error', error: 'Unknown connection type' };
    } catch (error) {
      logger.error('SAP connection test failed', {
        error: error.message,
        host: this.settings.sap?.host
      });

      // Check if it's a network error vs auth error
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return { success: false, status: 'unreachable', error: 'SAP system unreachable - check host/port' };
      }
      if (error.code === 'ETIMEDOUT') {
        return { success: false, status: 'timeout', error: 'Connection timed out' };
      }

      return { success: false, status: 'error', error: error.message };
    }
  }

  /**
   * Fetch customers from SAP
   */
  async fetchSAPCustomers(options = {}) {
    const { sap } = this.settings;
    const { pageSize = 100, skip = 0 } = options;

    if (!sap || !sap.host) {
      throw new Error('SAP not configured');
    }

    try {
      const baseUrl = sap.host.startsWith('http') ? sap.host : `https://${sap.host}`;

      // SAP Business Partner API (S/4HANA)
      const response = await axios.get(
        `${baseUrl}/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner`,
        {
          params: {
            '$top': pageSize,
            '$skip': skip,
            '$filter': "BusinessPartnerCategory eq '1'", // Customers only
            '$select': 'BusinessPartner,BusinessPartnerName,BusinessPartnerFullName,Industry,SearchTerm1,CreatedByUser',
            '$expand': 'to_BusinessPartnerAddress'
          },
          auth: {
            username: sap.username,
            password: sap.password
          },
          headers: {
            'Accept': 'application/json'
          },
          timeout: 60000
        }
      );

      const customers = response.data.d?.results || response.data.value || [];

      return {
        success: true,
        customers: customers.map((c) => this.transformSAPCustomer(c)),
        count: customers.length,
        hasMore: customers.length === pageSize
      };
    } catch (error) {
      logger.error('SAP customer fetch failed', { error: error.message });
      throw new Error(`Failed to fetch SAP customers: ${error.message}`);
    }
  }

  /**
   * Fetch products from SAP
   */
  async fetchSAPProducts(options = {}) {
    const { sap } = this.settings;
    const { pageSize = 100, skip = 0 } = options;

    if (!sap || !sap.host) {
      throw new Error('SAP not configured');
    }

    try {
      const baseUrl = sap.host.startsWith('http') ? sap.host : `https://${sap.host}`;

      // SAP Product Master API
      const response = await axios.get(
        `${baseUrl}/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product`,
        {
          params: {
            '$top': pageSize,
            '$skip': skip,
            '$select': 'Product,ProductType,ProductGroup,BaseUnit,GrossWeight,WeightUnit'
          },
          auth: {
            username: sap.username,
            password: sap.password
          },
          headers: {
            'Accept': 'application/json'
          },
          timeout: 60000
        }
      );

      const products = response.data.d?.results || response.data.value || [];

      return {
        success: true,
        products: products.map((p) => this.transformSAPProduct(p)),
        count: products.length,
        hasMore: products.length === pageSize
      };
    } catch (error) {
      logger.error('SAP product fetch failed', { error: error.message });
      throw new Error(`Failed to fetch SAP products: ${error.message}`);
    }
  }

  /**
   * Fetch pricing conditions from SAP
   */
  async fetchSAPPricing(options = {}) {
    const { sap } = this.settings;
    const { pageSize = 100, skip = 0 } = options;

    if (!sap || !sap.host) {
      throw new Error('SAP not configured');
    }

    try {
      const baseUrl = sap.host.startsWith('http') ? sap.host : `https://${sap.host}`;

      // SAP Pricing Conditions API
      const response = await axios.get(
        `${baseUrl}/sap/opu/odata/sap/API_SLSPRICINGCONDITIONRECORD_SRV/A_SlsPrcgConditionRecord`,
        {
          params: {
            '$top': pageSize,
            '$skip': skip,
            '$select': 'ConditionRecord,ConditionType,ConditionRateValue,ConditionCurrency,ConditionValidityStartDate,ConditionValidityEndDate'
          },
          auth: {
            username: sap.username,
            password: sap.password
          },
          headers: {
            'Accept': 'application/json'
          },
          timeout: 60000
        }
      );

      const pricing = response.data.d?.results || response.data.value || [];

      return {
        success: true,
        pricing: pricing.map((p) => this.transformSAPPricing(p)),
        count: pricing.length,
        hasMore: pricing.length === pageSize
      };
    } catch (error) {
      logger.error('SAP pricing fetch failed', { error: error.message });
      throw new Error(`Failed to fetch SAP pricing: ${error.message}`);
    }
  }

  /**
   * Fetch sales orders from SAP (for real-time sales data)
   */
  async fetchSAPSalesOrders(options = {}) {
    const { sap } = this.settings;
    const { pageSize = 100, skip = 0, fromDate = null } = options;

    if (!sap || !sap.host) {
      throw new Error('SAP not configured');
    }

    try {
      const baseUrl = sap.host.startsWith('http') ? sap.host : `https://${sap.host}`;

      let filter = '';
      if (fromDate) {
        filter = `CreationDate ge datetime'${fromDate.toISOString()}'`;
      }

      const response = await axios.get(
        `${baseUrl}/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder`,
        {
          params: {
            '$top': pageSize,
            '$skip': skip,
            '$filter': filter || undefined,
            '$select': 'SalesOrder,SalesOrderType,SoldToParty,TotalNetAmount,TransactionCurrency,CreationDate',
            '$expand': 'to_Item'
          },
          auth: {
            username: sap.username,
            password: sap.password
          },
          headers: {
            'Accept': 'application/json'
          },
          timeout: 60000
        }
      );

      const orders = response.data.d?.results || response.data.value || [];

      return {
        success: true,
        orders: orders.map((o) => this.transformSAPSalesOrder(o)),
        count: orders.length,
        hasMore: orders.length === pageSize
      };
    } catch (error) {
      logger.error('SAP sales order fetch failed', { error: error.message });
      throw new Error(`Failed to fetch SAP sales orders: ${error.message}`);
    }
  }

  // ==================== GENERIC ERP INTEGRATION ====================

  /**
   * Test generic ERP connection
   */
  async testERPConnection() {
    const { erp } = this.settings;

    if (!erp || !erp.baseUrl) {
      return { success: false, status: 'not_configured', error: 'ERP not configured' };
    }

    try {
      let response;
      const baseUrl = erp.baseUrl.startsWith('http') ? erp.baseUrl : `https://${erp.baseUrl}`;

      const headers = {
        'Accept': 'application/json'
      };

      // Add authentication based on type
      if (erp.apiKey) {
        headers['X-API-Key'] = erp.apiKey;
        headers['Authorization'] = `Bearer ${erp.apiKey}`;
      } else if (erp.username && erp.password) {
        headers['Authorization'] = `Basic ${Buffer.from(`${erp.username}:${erp.password}`).toString('base64')}`;
      }

      if (erp.connectionType === 'rest_api') {
        // REST API health check
        response = await axios.get(`${baseUrl}/health`, {
          headers,
          timeout: 30000,
          validateStatus: () => true
        });

        // If /health doesn't exist, try root
        if (response.status === 404) {
          response = await axios.get(baseUrl, {
            headers,
            timeout: 30000,
            validateStatus: () => true
          });
        }
      } else if (erp.connectionType === 'soap') {
        // SOAP endpoint check
        response = await axios.get(`${baseUrl}?wsdl`, {
          headers,
          timeout: 30000,
          validateStatus: () => true
        });
      } else if (erp.connectionType === 'odbc') {
        // For ODBC, we'd need a different approach - return configured status
        return { success: true, status: 'configured', message: 'ODBC connection configured - test via sync' };
      }

      return {
        success: response.status < 400,
        status: response.status < 400 ? 'connected' : 'error',
        message: response.status < 400 ? 'ERP connection successful' : `HTTP ${response.status}`
      };
    } catch (error) {
      logger.error('ERP connection test failed', {
        error: error.message,
        baseUrl: this.settings.erp?.baseUrl
      });

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return { success: false, status: 'unreachable', error: 'ERP system unreachable' };
      }

      return { success: false, status: 'error', error: error.message };
    }
  }

  /**
   * Fetch data from generic ERP REST API
   */
  async fetchERPData(endpoint, options = {}) {
    const { erp } = this.settings;
    const { pageSize = 100, page = 1, params = {} } = options;

    if (!erp || !erp.baseUrl) {
      throw new Error('ERP not configured');
    }

    try {
      const baseUrl = erp.baseUrl.startsWith('http') ? erp.baseUrl : `https://${erp.baseUrl}`;

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      if (erp.apiKey) {
        headers['X-API-Key'] = erp.apiKey;
        headers['Authorization'] = `Bearer ${erp.apiKey}`;
      } else if (erp.username && erp.password) {
        headers['Authorization'] = `Basic ${Buffer.from(`${erp.username}:${erp.password}`).toString('base64')}`;
      }

      const response = await axios.get(`${baseUrl}${endpoint}`, {
        headers,
        params: {
          ...params,
          limit: pageSize,
          page,
          offset: (page - 1) * pageSize
        },
        timeout: 60000
      });

      return {
        success: true,
        data: response.data.data || response.data.results || response.data,
        count: response.data.total || response.data.count || (Array.isArray(response.data) ? response.data.length : 0),
        hasMore: response.data.hasMore || response.data.nextPage != null
      };
    } catch (error) {
      logger.error('ERP data fetch failed', { error: error.message, endpoint });
      throw new Error(`Failed to fetch ERP data: ${error.message}`);
    }
  }

  /**
   * Fetch customers from generic ERP
   */
  async fetchERPCustomers(options = {}) {
    const result = await this.fetchERPData('/api/customers', options);
    return {
      ...result,
      customers: (result.data || []).map((c) => this.transformERPCustomer(c))
    };
  }

  /**
   * Fetch products from generic ERP
   */
  async fetchERPProducts(options = {}) {
    const result = await this.fetchERPData('/api/products', options);
    return {
      ...result,
      products: (result.data || []).map((p) => this.transformERPProduct(p))
    };
  }

  /**
   * Fetch pricing from generic ERP
   */
  async fetchERPPricing(options = {}) {
    const result = await this.fetchERPData('/api/pricing', options);
    return {
      ...result,
      pricing: result.data || []
    };
  }

  /**
   * Fetch sales data from generic ERP
   */
  async fetchERPSalesData(options = {}) {
    const result = await this.fetchERPData('/api/sales', options);
    return {
      ...result,
      sales: (result.data || []).map((s) => this.transformERPSalesRecord(s))
    };
  }

  // ==================== REAL-TIME SALES DATA FEED ====================

  /**
   * Connect to real-time sales data feed
   */
  async fetchRealTimeSalesData(options = {}) {
    const { salesData } = this.settings;

    if (!salesData || !salesData.feedUrl) {
      throw new Error('Sales data feed not configured');
    }

    try {
      const headers = {
        'Accept': 'application/json'
      };

      if (salesData.feedApiKey) {
        headers['X-API-Key'] = salesData.feedApiKey;
        headers['Authorization'] = `Bearer ${salesData.feedApiKey}`;
      }

      const response = await axios.get(salesData.feedUrl, {
        headers,
        params: {
          format: salesData.feedFormat || 'json',
          ...options.params
        },
        timeout: 60000
      });

      let data = response.data;

      // Handle different response formats
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          // Might be CSV or other format
          data = this.parseCSVSalesData(data);
        }
      }

      return {
        success: true,
        records: Array.isArray(data) ? data : data.records || data.data || [],
        count: Array.isArray(data) ? data.length : data.count || 0
      };
    } catch (error) {
      logger.error('Real-time sales data fetch failed', { error: error.message });
      throw new Error(`Failed to fetch sales data: ${error.message}`);
    }
  }

  // ==================== DATA TRANSFORMERS ====================

  transformSAPCustomer(sapCustomer) {
    return {
      externalId: sapCustomer.BusinessPartner,
      name: sapCustomer.BusinessPartnerName || sapCustomer.BusinessPartnerFullName,
      code: sapCustomer.BusinessPartner,
      industry: sapCustomer.Industry,
      searchTerm: sapCustomer.SearchTerm1,
      source: 'sap',
      addresses: (sapCustomer.to_BusinessPartnerAddress?.results || []).map((addr) => ({
        street: addr.StreetName,
        city: addr.CityName,
        region: addr.Region,
        country: addr.Country,
        postalCode: addr.PostalCode
      }))
    };
  }

  transformSAPProduct(sapProduct) {
    return {
      externalId: sapProduct.Product,
      sku: sapProduct.Product,
      name: sapProduct.ProductDescription || sapProduct.Product,
      category: sapProduct.ProductGroup,
      type: sapProduct.ProductType,
      baseUnit: sapProduct.BaseUnit,
      weight: sapProduct.GrossWeight,
      weightUnit: sapProduct.WeightUnit,
      source: 'sap'
    };
  }

  transformSAPPricing(sapPricing) {
    return {
      externalId: sapPricing.ConditionRecord,
      conditionType: sapPricing.ConditionType,
      value: parseFloat(sapPricing.ConditionRateValue) || 0,
      currency: sapPricing.ConditionCurrency,
      validFrom: sapPricing.ConditionValidityStartDate,
      validTo: sapPricing.ConditionValidityEndDate,
      source: 'sap'
    };
  }

  transformSAPSalesOrder(sapOrder) {
    return {
      externalId: sapOrder.SalesOrder,
      orderType: sapOrder.SalesOrderType,
      customerId: sapOrder.SoldToParty,
      totalAmount: parseFloat(sapOrder.TotalNetAmount) || 0,
      currency: sapOrder.TransactionCurrency,
      orderDate: sapOrder.CreationDate,
      items: (sapOrder.to_Item?.results || []).map((item) => ({
        product: item.Material,
        quantity: parseFloat(item.RequestedQuantity) || 0,
        unit: item.RequestedQuantityUnit,
        netAmount: parseFloat(item.NetAmount) || 0
      })),
      source: 'sap'
    };
  }

  transformERPCustomer(erpCustomer) {
    return {
      externalId: erpCustomer.id || erpCustomer.customer_id || erpCustomer.code,
      name: erpCustomer.name || erpCustomer.customer_name,
      code: erpCustomer.code || erpCustomer.customer_code,
      email: erpCustomer.email,
      phone: erpCustomer.phone,
      industry: erpCustomer.industry,
      source: 'erp'
    };
  }

  transformERPProduct(erpProduct) {
    return {
      externalId: erpProduct.id || erpProduct.product_id || erpProduct.sku,
      sku: erpProduct.sku || erpProduct.code,
      name: erpProduct.name || erpProduct.product_name,
      category: erpProduct.category,
      price: parseFloat(erpProduct.price) || 0,
      source: 'erp'
    };
  }

  transformERPSalesRecord(erpSale) {
    return {
      externalId: erpSale.id || erpSale.transaction_id,
      customerId: erpSale.customer_id,
      productId: erpSale.product_id,
      quantity: parseFloat(erpSale.quantity) || 0,
      amount: parseFloat(erpSale.amount) || parseFloat(erpSale.total) || 0,
      currency: erpSale.currency || 'ZAR',
      transactionDate: erpSale.date || erpSale.transaction_date,
      source: 'erp'
    };
  }

  parseCSVSalesData(csvString) {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index]?.trim();
      });
      records.push(record);
    }

    return records;
  }
}

module.exports = ERPService;
