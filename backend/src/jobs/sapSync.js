const logger = require('../utils/logger');
const _sapService = require('../services/sapService');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const SalesHistory = require('../models/SalesHistory');

const process = async (job) => {
  logger.info('Starting SAP sync job', { jobId: job.id });

  const results = {
    customers: { created: 0, updated: 0, errors: 0 },
    products: { created: 0, updated: 0, errors: 0 },
    vendors: { created: 0, updated: 0, errors: 0 },
    sales: { created: 0, updated: 0, errors: 0 },
    startTime: new Date(),
    endTime: null,
    duration: null
  };

  try {
    // Sync Customers
    logger.info('Syncing customers from SAP...');
    const customerResult = await syncCustomers();
    results.customers = customerResult;

    // Sync Products
    logger.info('Syncing products from SAP...');
    const productResult = await syncProducts();
    results.products = productResult;

    // Sync Vendors
    logger.info('Syncing vendors from SAP...');
    const vendorResult = await syncVendors();
    results.vendors = vendorResult;

    // Sync Sales History
    logger.info('Syncing sales history from SAP...');
    const salesResult = await syncSalesHistory();
    results.sales = salesResult;

    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;

    logger.info('SAP sync completed successfully', results);

    return results;
  } catch (error) {
    logger.error('SAP sync job failed', { error: error.message, stack: error.stack });
    throw error;
  }
};

const syncCustomers = async () => {
  const result = { created: 0, updated: 0, errors: 0 };

  try {
    // This would call actual SAP API
    // const customers = await sapService.getCustomers();

    // Mock implementation
    const customers = []; // Would come from SAP

    for (const sapCustomer of customers) {
      try {
        const existingCustomer = await Customer.findOne({
          sapCustomerId: sapCustomer.customerId
        });

        const customerData = {
          sapCustomerId: sapCustomer.customerId,
          name: sapCustomer.name,
          code: sapCustomer.code,
          customerType: mapCustomerType(sapCustomer.type),
          channel: mapChannel(sapCustomer.channel),
          hierarchy: mapHierarchy(sapCustomer.hierarchy),
          // ... map other fields
          lastSyncDate: new Date(),
          syncStatus: 'synced'
        };

        if (existingCustomer) {
          await Customer.findByIdAndUpdate(existingCustomer._id, customerData);
          result.updated++;
        } else {
          await Customer.create(customerData);
          result.created++;
        }
      } catch (error) {
        logger.error('Error syncing customer', {
          customerId: sapCustomer.customerId,
          error: error.message
        });
        result.errors++;
      }
    }
  } catch (error) {
    logger.error('Error fetching customers from SAP', { error: error.message });
    throw error;
  }

  return result;
};

const syncProducts = async () => {
  const result = { created: 0, updated: 0, errors: 0 };

  try {
    // This would call actual SAP API
    // const products = await sapService.getProducts();

    // Mock implementation
    const products = []; // Would come from SAP

    for (const sapProduct of products) {
      try {
        const existingProduct = await Product.findOne({
          sapMaterialId: sapProduct.materialId
        });

        const productData = {
          sapMaterialId: sapProduct.materialId,
          name: sapProduct.name,
          sku: sapProduct.sku,
          productType: mapProductType(sapProduct.type),
          hierarchy: mapProductHierarchy(sapProduct.hierarchy),
          pricing: {
            listPrice: sapProduct.price,
            currency: sapProduct.currency
          },
          // ... map other fields
          lastSyncDate: new Date(),
          syncStatus: 'synced'
        };

        if (existingProduct) {
          await Product.findByIdAndUpdate(existingProduct._id, productData);
          result.updated++;
        } else {
          await Product.create(productData);
          result.created++;
        }
      } catch (error) {
        logger.error('Error syncing product', {
          materialId: sapProduct.materialId,
          error: error.message
        });
        result.errors++;
      }
    }
  } catch (error) {
    logger.error('Error fetching products from SAP', { error: error.message });
    throw error;
  }

  return result;
};

const syncVendors = async () => {
  const result = { created: 0, updated: 0, errors: 0 };

  try {
    // This would call actual SAP API
    // const vendors = await sapService.getVendors();

    // Mock implementation
    const vendors = []; // Would come from SAP

    for (const sapVendor of vendors) {
      try {
        const existingVendor = await Vendor.findOne({
          sapVendorId: sapVendor.vendorId
        });

        const vendorData = {
          sapVendorId: sapVendor.vendorId,
          name: sapVendor.name,
          code: sapVendor.code,
          vendorType: mapVendorType(sapVendor.type),
          // ... map other fields
          lastSyncDate: new Date(),
          syncStatus: 'synced'
        };

        if (existingVendor) {
          await Vendor.findByIdAndUpdate(existingVendor._id, vendorData);
          result.updated++;
        } else {
          await Vendor.create(vendorData);
          result.created++;
        }
      } catch (error) {
        logger.error('Error syncing vendor', {
          vendorId: sapVendor.vendorId,
          error: error.message
        });
        result.errors++;
      }
    }
  } catch (error) {
    logger.error('Error fetching vendors from SAP', { error: error.message });
    throw error;
  }

  return result;
};

const syncSalesHistory = async () => {
  const result = { created: 0, updated: 0, errors: 0 };

  try {
    // Get date range for sync (last 7 days)
    const _endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // This would call actual SAP API
    // const sales = await sapService.getSalesHistory(startDate, endDate);

    // Mock implementation
    const sales = []; // Would come from SAP

    for (const sapSale of sales) {
      try {
        // Find related customer and product
        const customer = await Customer.findOne({
          sapCustomerId: sapSale.customerId
        });
        const product = await Product.findOne({
          sapMaterialId: sapSale.materialId
        });

        if (!customer || !product) {
          logger.warn('Skipping sale - customer or product not found', {
            customerId: sapSale.customerId,
            materialId: sapSale.materialId
          });
          result.errors++;
          continue;
        }

        const salesData = {
          transactionId: sapSale.documentNumber,
          sapDocumentNumber: sapSale.documentNumber,
          date: new Date(sapSale.date),
          customer: customer._id,
          product: product._id,
          quantity: sapSale.quantity,
          revenue: {
            gross: sapSale.grossAmount,
            net: sapSale.netAmount,
            currency: sapSale.currency
          },
          // ... map other fields
          importBatch: `SAP_SYNC_${new Date().toISOString()}`,
          importDate: new Date(),
          source: 'sap'
        };

        const existingSale = await SalesHistory.findOne({
          transactionId: sapSale.documentNumber
        });

        if (existingSale) {
          await SalesHistory.findByIdAndUpdate(existingSale._id, salesData);
          result.updated++;
        } else {
          await SalesHistory.create(salesData);
          result.created++;
        }
      } catch (error) {
        logger.error('Error syncing sale', {
          documentNumber: sapSale.documentNumber,
          error: error.message
        });
        result.errors++;
      }
    }
  } catch (error) {
    logger.error('Error fetching sales from SAP', { error: error.message });
    throw error;
  }

  return result;
};

// Mapping functions
const mapCustomerType = (sapType) => {
  const typeMap = {
    'RT': 'retailer',
    'WS': 'wholesaler',
    'DS': 'distributor',
    'CH': 'chain',
    'IN': 'independent',
    'ON': 'online'
  };
  return typeMap[sapType] || 'retailer';
};

const mapChannel = (sapChannel) => {
  const channelMap = {
    'MT': 'modern_trade',
    'TT': 'traditional_trade',
    'HR': 'horeca',
    'EC': 'ecommerce',
    'B2B': 'b2b',
    'EX': 'export'
  };
  return channelMap[sapChannel] || 'traditional_trade';
};

const mapHierarchy = (sapHierarchy) => {
  return {
    level1: {
      id: sapHierarchy.level1Code,
      name: sapHierarchy.level1Name,
      code: sapHierarchy.level1Code
    },
    level2: {
      id: sapHierarchy.level2Code,
      name: sapHierarchy.level2Name,
      code: sapHierarchy.level2Code
    },
    level3: {
      id: sapHierarchy.level3Code,
      name: sapHierarchy.level3Name,
      code: sapHierarchy.level3Code
    },
    level4: {
      id: sapHierarchy.level4Code,
      name: sapHierarchy.level4Name,
      code: sapHierarchy.level4Code
    },
    level5: {
      id: sapHierarchy.level5Code,
      name: sapHierarchy.level5Name,
      code: sapHierarchy.level5Code
    }
  };
};

const mapProductType = (sapType) => {
  const typeMap = {
    'OB': 'own_brand',
    'DS': 'distributed',
    'PL': 'private_label',
    'CS': 'consignment'
  };
  return typeMap[sapType] || 'distributed';
};

const mapProductHierarchy = (sapHierarchy) => {
  return mapHierarchy(sapHierarchy); // Same structure
};

const mapVendorType = (sapType) => {
  const typeMap = {
    'PR': 'principal',
    'MF': 'manufacturer',
    'DS': 'distributor',
    'IM': 'importer',
    'AG': 'agent'
  };
  return typeMap[sapType] || 'distributor';
};

module.exports = {
  process
};
