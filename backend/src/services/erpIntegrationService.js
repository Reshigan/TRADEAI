/**
 * ERP INTEGRATION SERVICE
 * Connects TRADEAI with external ERP systems (SAP, Oracle, etc.)
 *
 * Features:
 * - Bi-directional data sync
 * - Transaction import/export
 * - Master data synchronization
 * - Real-time updates
 * - Error handling & retry logic
 * - Audit trail integration
 */

const axios = require('axios');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const auditTrailService = require('./auditTrailService');

class ERPIntegrationService {
  constructor() {
    this.connections = new Map();
    this.syncQueue = [];
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Register an ERP connection
   */
  registerConnection(erpType, config) {
    const connection = {
      type: erpType, // 'SAP', 'ORACLE', 'NETSUITE', etc.
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      username: config.username,
      password: config.password,
      tenant: config.tenant,
      environment: config.environment, // 'production', 'sandbox'
      enabled: config.enabled !== false,
      lastSync: null,
      syncInterval: config.syncInterval || 300000, // 5 minutes default
      mappings: config.mappings || this.getDefaultMappings(erpType)
    };

    this.connections.set(erpType, connection);

    // Start auto-sync if enabled
    if (connection.enabled && connection.syncInterval) {
      this.startAutoSync(erpType);
    }

    return connection;
  }

  /**
   * Get default field mappings for ERP type
   */
  getDefaultMappings(erpType) {
    const mappings = {
      SAP: {
        purchaseOrder: {
          poNumber: 'EBELN',
          poDate: 'BEDAT',
          vendor: 'LIFNR',
          totalAmount: 'NETWR',
          currency: 'WAERS',
          status: 'BSTYP',
          lines: {
            lineNumber: 'EBELP',
            materialNumber: 'MATNR',
            quantity: 'MENGE',
            unitPrice: 'NETPR',
            unit: 'MEINS'
          }
        },
        invoice: {
          invoiceNumber: 'BELNR',
          invoiceDate: 'BLDAT',
          vendor: 'LIFNR',
          amount: 'WRBTR',
          currency: 'WAERS',
          referenceDoc: 'XBLNR'
        },
        payment: {
          paymentNumber: 'BELNR',
          paymentDate: 'BUDAT',
          amount: 'WRBTR',
          currency: 'WAERS',
          paymentMethod: 'ZLSCH',
          bankAccount: 'HBKID'
        }
      },
      ORACLE: {
        purchaseOrder: {
          poNumber: 'PO_HEADER_ID',
          poDate: 'CREATION_DATE',
          vendor: 'VENDOR_ID',
          totalAmount: 'TOTAL_AMOUNT',
          currency: 'CURRENCY_CODE',
          status: 'AUTHORIZATION_STATUS',
          lines: {
            lineNumber: 'LINE_NUM',
            itemId: 'ITEM_ID',
            quantity: 'QUANTITY',
            unitPrice: 'UNIT_PRICE',
            unit: 'UNIT_MEAS_LOOKUP_CODE'
          }
        },
        invoice: {
          invoiceNumber: 'INVOICE_NUM',
          invoiceDate: 'INVOICE_DATE',
          vendor: 'VENDOR_ID',
          amount: 'INVOICE_AMOUNT',
          currency: 'INVOICE_CURRENCY_CODE',
          referenceDoc: 'PO_NUMBER'
        },
        payment: {
          paymentNumber: 'CHECK_ID',
          paymentDate: 'CHECK_DATE',
          amount: 'AMOUNT',
          currency: 'CURRENCY_CODE',
          paymentMethod: 'PAYMENT_METHOD_CODE',
          bankAccount: 'BANK_ACCOUNT_ID'
        }
      }
    };

    return mappings[erpType] || {};
  }

  /**
   * Import Purchase Order from ERP
   */
  async importPurchaseOrder(erpType, erpPoId, customerId, userId) {
    try {
      const connection = this.connections.get(erpType);
      if (!connection) {
        throw new Error(`ERP connection ${erpType} not configured`);
      }

      // Fetch PO data from ERP
      const erpData = await this.fetchFromERP(
        connection,
        'purchaseOrder',
        erpPoId
      );

      // Map ERP data to TRADEAI format
      const mappedData = this.mapFromERP(
        erpData,
        connection.mappings.purchaseOrder,
        customerId
      );

      // Check if PO already exists
      let po = await PurchaseOrder.findOne({
        erpReference: { type: erpType, id: erpPoId }
      });

      if (po) {
        // Update existing PO
        Object.assign(po, mappedData);
        po.lastSyncedAt = new Date();
      } else {
        // Create new PO
        po = new PurchaseOrder({
          ...mappedData,
          erpReference: {
            type: erpType,
            id: erpPoId,
            syncedAt: new Date()
          }
        });
      }

      await po.save();

      // Create audit log
      await auditTrailService.logChange({
        entityType: 'PurchaseOrder',
        entityId: po._id,
        action: 'import',
        userId,
        changes: {
          source: erpType,
          erpId: erpPoId
        },
        metadata: { integration: true }
      });

      return {
        success: true,
        purchaseOrder: po,
        source: erpType
      };
    } catch (error) {
      console.error(`Failed to import PO from ${erpType}:`, error);
      throw error;
    }
  }

  /**
   * Export Purchase Order to ERP
   */
  async exportPurchaseOrder(poId, erpType, userId) {
    try {
      const po = await PurchaseOrder.findById(poId).populate('customerId');
      if (!po) {
        throw new Error('Purchase Order not found');
      }

      const connection = this.connections.get(erpType);
      if (!connection) {
        throw new Error(`ERP connection ${erpType} not configured`);
      }

      // Map TRADEAI data to ERP format
      const erpData = this.mapToERP(
        po.toObject(),
        connection.mappings.purchaseOrder
      );

      // Send to ERP
      const erpResponse = await this.sendToERP(
        connection,
        'purchaseOrder',
        erpData,
        po.erpReference?.id
      );

      // Update ERP reference
      po.erpReference = {
        type: erpType,
        id: erpResponse.id,
        syncedAt: new Date()
      };
      await po.save();

      // Create audit log
      await auditTrailService.logChange({
        entityType: 'PurchaseOrder',
        entityId: po._id,
        action: 'export',
        userId,
        changes: {
          destination: erpType,
          erpId: erpResponse.id
        },
        metadata: { integration: true }
      });

      return {
        success: true,
        erpReference: po.erpReference
      };
    } catch (error) {
      console.error(`Failed to export PO to ${erpType}:`, error);
      throw error;
    }
  }

  /**
   * Import Invoice from ERP
   */
  async importInvoice(erpType, erpInvoiceId, customerId, userId) {
    try {
      const connection = this.connections.get(erpType);
      if (!connection) {
        throw new Error(`ERP connection ${erpType} not configured`);
      }

      // Fetch invoice data from ERP
      const erpData = await this.fetchFromERP(
        connection,
        'invoice',
        erpInvoiceId
      );

      // Map ERP data to TRADEAI format
      const mappedData = this.mapFromERP(
        erpData,
        connection.mappings.invoice,
        customerId
      );

      // Try to match with existing PO
      if (mappedData.referenceDoc) {
        const po = await PurchaseOrder.findOne({
          $or: [
            { poNumber: mappedData.referenceDoc },
            { 'erpReference.id': mappedData.referenceDoc }
          ]
        });
        if (po) {
          mappedData.purchaseOrderId = po._id;
        }
      }

      // Check if invoice already exists
      let invoice = await Invoice.findOne({
        erpReference: { type: erpType, id: erpInvoiceId }
      });

      if (invoice) {
        Object.assign(invoice, mappedData);
        invoice.lastSyncedAt = new Date();
      } else {
        invoice = new Invoice({
          ...mappedData,
          erpReference: {
            type: erpType,
            id: erpInvoiceId,
            syncedAt: new Date()
          }
        });
      }

      await invoice.save();

      // Create audit log
      await auditTrailService.logChange({
        entityType: 'Invoice',
        entityId: invoice._id,
        action: 'import',
        userId,
        changes: {
          source: erpType,
          erpId: erpInvoiceId
        },
        metadata: { integration: true }
      });

      return {
        success: true,
        invoice,
        source: erpType
      };
    } catch (error) {
      console.error(`Failed to import invoice from ${erpType}:`, error);
      throw error;
    }
  }

  /**
   * Export Invoice to ERP
   */
  async exportInvoice(invoiceId, erpType, userId) {
    try {
      const invoice = await Invoice.findById(invoiceId).populate('customerId');
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const connection = this.connections.get(erpType);
      if (!connection) {
        throw new Error(`ERP connection ${erpType} not configured`);
      }

      const erpData = this.mapToERP(
        invoice.toObject(),
        connection.mappings.invoice
      );

      const erpResponse = await this.sendToERP(
        connection,
        'invoice',
        erpData,
        invoice.erpReference?.id
      );

      invoice.erpReference = {
        type: erpType,
        id: erpResponse.id,
        syncedAt: new Date()
      };
      await invoice.save();

      await auditTrailService.logChange({
        entityType: 'Invoice',
        entityId: invoice._id,
        action: 'export',
        userId,
        changes: {
          destination: erpType,
          erpId: erpResponse.id
        },
        metadata: { integration: true }
      });

      return {
        success: true,
        erpReference: invoice.erpReference
      };
    } catch (error) {
      console.error(`Failed to export invoice to ${erpType}:`, error);
      throw error;
    }
  }

  /**
   * Import Payment from ERP
   */
  async importPayment(erpType, erpPaymentId, customerId, userId) {
    try {
      const connection = this.connections.get(erpType);
      const erpData = await this.fetchFromERP(connection, 'payment', erpPaymentId);

      const mappedData = this.mapFromERP(
        erpData,
        connection.mappings.payment,
        customerId
      );

      let payment = await Payment.findOne({
        erpReference: { type: erpType, id: erpPaymentId }
      });

      if (payment) {
        Object.assign(payment, mappedData);
        payment.lastSyncedAt = new Date();
      } else {
        payment = new Payment({
          ...mappedData,
          erpReference: {
            type: erpType,
            id: erpPaymentId,
            syncedAt: new Date()
          }
        });
      }

      await payment.save();

      await auditTrailService.logChange({
        entityType: 'Payment',
        entityId: payment._id,
        action: 'import',
        userId,
        changes: {
          source: erpType,
          erpId: erpPaymentId
        },
        metadata: { integration: true }
      });

      return {
        success: true,
        payment,
        source: erpType
      };
    } catch (error) {
      console.error(`Failed to import payment from ${erpType}:`, error);
      throw error;
    }
  }

  /**
   * Sync all transactions for a customer
   */
  async syncCustomerTransactions(customerId, erpType, userId, options = {}) {
    const results = {
      purchaseOrders: { imported: 0, failed: 0 },
      invoices: { imported: 0, failed: 0 },
      payments: { imported: 0, failed: 0 }
    };

    try {
      const connection = this.connections.get(erpType);

      // Sync Purchase Orders
      if (options.syncPOs !== false) {
        const erpPOs = await this.fetchAllFromERP(
          connection,
          'purchaseOrder',
          { customerId, since: options.since }
        );

        for (const erpPO of erpPOs) {
          try {
            await this.importPurchaseOrder(erpType, erpPO.id, customerId, userId);
            results.purchaseOrders.imported++;
          } catch (error) {
            console.error(`Failed to import PO ${erpPO.id}:`, error);
            results.purchaseOrders.failed++;
          }
        }
      }

      // Sync Invoices
      if (options.syncInvoices !== false) {
        const erpInvoices = await this.fetchAllFromERP(
          connection,
          'invoice',
          { customerId, since: options.since }
        );

        for (const erpInvoice of erpInvoices) {
          try {
            await this.importInvoice(erpType, erpInvoice.id, customerId, userId);
            results.invoices.imported++;
          } catch (error) {
            console.error(`Failed to import invoice ${erpInvoice.id}:`, error);
            results.invoices.failed++;
          }
        }
      }

      // Sync Payments
      if (options.syncPayments !== false) {
        const erpPayments = await this.fetchAllFromERP(
          connection,
          'payment',
          { customerId, since: options.since }
        );

        for (const erpPayment of erpPayments) {
          try {
            await this.importPayment(erpType, erpPayment.id, customerId, userId);
            results.payments.imported++;
          } catch (error) {
            console.error(`Failed to import payment ${erpPayment.id}:`, error);
            results.payments.failed++;
          }
        }
      }

      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  /**
   * Start automatic sync for an ERP connection
   */
  startAutoSync(erpType) {
    const connection = this.connections.get(erpType);
    if (!connection) return;

    // Clear existing interval if any
    if (connection.syncIntervalId) {
      clearInterval(connection.syncIntervalId);
    }

    // Set up new interval
    connection.syncIntervalId = setInterval(async () => {
      try {
        console.log(`Running auto-sync for ${erpType}...`);

        // Get all customers with this ERP connection
        const customers = await this.getCustomersWithERP(erpType);

        for (const customer of customers) {
          await this.syncCustomerTransactions(
            customer._id,
            erpType,
            'system',
            { since: connection.lastSync }
          );
        }

        connection.lastSync = new Date();
      } catch (error) {
        console.error(`Auto-sync failed for ${erpType}:`, error);
      }
    }, connection.syncInterval);
  }

  /**
   * Fetch data from ERP system
   */
  async fetchFromERP(connection, entityType, entityId) {
    const endpoints = {
      SAP: {
        purchaseOrder: `/sap/opu/odata/sap/MM_PUR_PO_MAINT_V2/C_PurchaseOrderTP('${entityId}')`,
        invoice: `/sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV/A_SupplierInvoice('${entityId}')`,
        payment: `/sap/opu/odata/sap/API_OUTGOING_PAYMENT_SRV/A_OutgoingPayment('${entityId}')`
      },
      ORACLE: {
        purchaseOrder: `/fscmRestApi/resources/11.13.18.05/purchaseOrders/${entityId}`,
        invoice: `/fscmRestApi/resources/11.13.18.05/invoices/${entityId}`,
        payment: `/fscmRestApi/resources/11.13.18.05/payments/${entityId}`
      }
    };

    const endpoint = endpoints[connection.type]?.[entityType];
    if (!endpoint) {
      throw new Error(`Endpoint not configured for ${connection.type} ${entityType}`);
    }

    try {
      const response = await axios.get(`${connection.baseUrl}${endpoint}`, {
        headers: this.getERPHeaders(connection),
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      throw new Error(`ERP fetch failed: ${error.message}`);
    }
  }

  /**
   * Fetch multiple entities from ERP
   */
  fetchAllFromERP(connection, entityType, _filters = {}) {
    // Implementation would vary by ERP system
    // This is a simplified version
    return [];
  }

  /**
   * Send data to ERP system
   */
  async sendToERP(connection, entityType, data, existingId = null) {
    const method = existingId ? 'PUT' : 'POST';
    const url = existingId
      ? `${connection.baseUrl}/api/${entityType}/${existingId}`
      : `${connection.baseUrl}/api/${entityType}`;

    try {
      const response = await axios({
        method,
        url,
        data,
        headers: this.getERPHeaders(connection),
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      throw new Error(`ERP send failed: ${error.message}`);
    }
  }

  /**
   * Get ERP authentication headers
   */
  getERPHeaders(connection) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (connection.apiKey) {
      headers['Authorization'] = `Bearer ${connection.apiKey}`;
    } else if (connection.username && connection.password) {
      const auth = Buffer.from(`${connection.username}:${connection.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    if (connection.tenant) {
      headers['X-Tenant'] = connection.tenant;
    }

    return headers;
  }

  /**
   * Map ERP data to TRADEAI format
   */
  mapFromERP(erpData, mapping, customerId) {
    const mapped = { customerId };

    for (const [tradeaiField, erpField] of Object.entries(mapping)) {
      if (typeof erpField === 'object' && !Array.isArray(erpField)) {
        // Handle nested objects (like lines)
        continue;
      }
      mapped[tradeaiField] = erpData[erpField];
    }

    return mapped;
  }

  /**
   * Map TRADEAI data to ERP format
   */
  mapToERP(tradeaiData, mapping) {
    const mapped = {};

    for (const [tradeaiField, erpField] of Object.entries(mapping)) {
      if (typeof erpField === 'object' && !Array.isArray(erpField)) {
        continue;
      }
      mapped[erpField] = tradeaiData[tradeaiField];
    }

    return mapped;
  }

  /**
   * Get customers with specific ERP connection
   */
  getCustomersWithERP(_erpType) {
    // This would query your Customer model
    // Simplified for this example
    return [];
  }
}

module.exports = new ERPIntegrationService();
