const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const SalesHistory = require('../models/SalesHistory');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const sapService = require('../services/sapService');
const logger = require('../utils/logger');
const { addJob } = require('../jobs');

// Sync master data from SAP
exports.syncMasterData = asyncHandler(async (req, res, next) => {
  const { dataType, fullSync = false } = req.body;
  
  // Queue the sync job
  const job = await addJob('sapSync', 'sync-master-data', {
    dataType,
    fullSync,
    initiatedBy: req.user._id
  });
  
  res.json({
    success: true,
    message: 'Master data sync initiated',
    jobId: job.id
  });
});

// Get sync status
exports.getSyncStatus = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  
  // Get job status from queue
  const job = await getJob(jobId);
  
  if (!job) {
    throw new AppError('Job not found', 404);
  }
  
  res.json({
    success: true,
    data: {
      id: job.id,
      status: job.status,
      progress: job.progress,
      result: job.returnvalue,
      error: job.failedReason
    }
  });
});

// Manual customer sync
exports.syncCustomers = asyncHandler(async (req, res, next) => {
  const { customerCodes } = req.body;
  
  try {
    const customers = await sapService.getCustomers(customerCodes);
    
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: []
    };
    
    for (const sapCustomer of customers) {
      try {
        const existingCustomer = await Customer.findOne({ code: sapCustomer.KUNNR });
        
        const customerData = {
          code: sapCustomer.KUNNR,
          name: sapCustomer.NAME1,
          legalName: sapCustomer.NAME2 || sapCustomer.NAME1,
          taxId: sapCustomer.STCD1,
          address: {
            street: sapCustomer.STRAS,
            city: sapCustomer.ORT01,
            state: sapCustomer.REGIO,
            country: sapCustomer.LAND1,
            postalCode: sapCustomer.PSTLZ
          },
          contact: {
            phone: sapCustomer.TELF1,
            email: sapCustomer.EMAIL,
            contactPerson: sapCustomer.CONTACT
          },
          sapData: {
            salesOrg: sapCustomer.VKORG,
            distributionChannel: sapCustomer.VTWEG,
            division: sapCustomer.SPART,
            customerGroup: sapCustomer.KDGRP,
            priceGroup: sapCustomer.KONDA,
            paymentTerms: sapCustomer.ZTERM
          },
          creditLimit: {
            amount: parseFloat(sapCustomer.KLIMK) || 0,
            currency: sapCustomer.WAERS || 'USD'
          },
          status: sapCustomer.LOEVM ? 'inactive' : 'active'
        };
        
        // Map hierarchy
        if (sapCustomer.HKUNNR) {
          const parentCustomer = await Customer.findOne({ code: sapCustomer.HKUNNR });
          if (parentCustomer) {
            customerData.hierarchy = {
              level1: parentCustomer.hierarchy?.level1 || parentCustomer._id,
              level2: parentCustomer.hierarchy?.level2,
              level3: parentCustomer.hierarchy?.level3,
              level4: parentCustomer.hierarchy?.level4,
              level5: parentCustomer._id
            };
          }
        }
        
        if (existingCustomer) {
          await Customer.findByIdAndUpdate(existingCustomer._id, customerData);
          results.updated++;
        } else {
          await Customer.create(customerData);
          results.created++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          customerCode: sapCustomer.KUNNR,
          error: error.message
        });
      }
    }
    
    logger.logAudit('sap_customer_sync', req.user._id, results);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('SAP customer sync failed:', error);
    throw new AppError('Failed to sync customers from SAP', 500);
  }
});

// Manual product sync
exports.syncProducts = asyncHandler(async (req, res, next) => {
  const { materialNumbers } = req.body;
  
  try {
    const products = await sapService.getProducts(materialNumbers);
    
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: []
    };
    
    for (const sapProduct of products) {
      try {
        const existingProduct = await Product.findOne({ sku: sapProduct.MATNR });
        
        const productData = {
          sku: sapProduct.MATNR,
          name: sapProduct.MAKTX,
          description: sapProduct.MAKTX_LONG || sapProduct.MAKTX,
          brand: {
            code: sapProduct.BRAND,
            name: sapProduct.BRAND_NAME
          },
          category: {
            primary: sapProduct.PRDHA,
            secondary: sapProduct.MTART
          },
          uom: {
            base: sapProduct.MEINS,
            sales: sapProduct.VRKME || sapProduct.MEINS
          },
          packaging: {
            unitsPerCase: parseInt(sapProduct.UMREZ) || 1,
            casesPerPallet: parseInt(sapProduct.ANZUB) || 1
          },
          pricing: {
            listPrice: parseFloat(sapProduct.STPRS) || 0,
            currency: sapProduct.WAERS || 'USD'
          },
          weight: {
            gross: parseFloat(sapProduct.BRGEW) || 0,
            net: parseFloat(sapProduct.NTGEW) || 0,
            unit: sapProduct.GEWEI || 'KG'
          },
          status: sapProduct.LVORM ? 'discontinued' : 'active',
          sapData: {
            materialType: sapProduct.MTART,
            materialGroup: sapProduct.MATKL,
            division: sapProduct.SPART,
            salesOrg: sapProduct.VKORG
          }
        };
        
        // Map hierarchy
        if (sapProduct.PRDHA) {
          // Parse SAP product hierarchy
          const hierarchyLevels = sapProduct.PRDHA.match(/.{1,3}/g) || [];
          productData.hierarchy = {
            level1: hierarchyLevels[0],
            level2: hierarchyLevels[1],
            level3: hierarchyLevels[2],
            level4: hierarchyLevels[3],
            level5: hierarchyLevels[4]
          };
        }
        
        if (existingProduct) {
          await Product.findByIdAndUpdate(existingProduct._id, productData);
          results.updated++;
        } else {
          await Product.create(productData);
          results.created++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          materialNumber: sapProduct.MATNR,
          error: error.message
        });
      }
    }
    
    logger.logAudit('sap_product_sync', req.user._id, results);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('SAP product sync failed:', error);
    throw new AppError('Failed to sync products from SAP', 500);
  }
});

// Sync sales data
exports.syncSalesData = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, customerCode } = req.body;
  
  try {
    const salesData = await sapService.getSalesData({
      startDate,
      endDate,
      customerCode
    });
    
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: []
    };
    
    for (const sapSale of salesData) {
      try {
        // Find customer and product
        const customer = await Customer.findOne({ code: sapSale.KUNNR });
        const product = await Product.findOne({ sku: sapSale.MATNR });
        
        if (!customer || !product) {
          throw new Error('Customer or product not found');
        }
        
        const salesDate = new Date(sapSale.FKDAT);
        
        const salesHistoryData = {
          date: salesDate,
          year: salesDate.getFullYear(),
          month: salesDate.getMonth() + 1,
          week: getWeekNumber(salesDate),
          customer: customer._id,
          product: product._id,
          channel: customer.channel,
          invoiceNumber: sapSale.VBELN,
          quantity: parseFloat(sapSale.FKIMG) || 0,
          uom: sapSale.VRKME,
          pricing: {
            listPrice: parseFloat(sapSale.KBETR) || 0,
            invoicePrice: parseFloat(sapSale.NETWR) / parseFloat(sapSale.FKIMG) || 0,
            discount: parseFloat(sapSale.KWERT) || 0
          },
          revenue: {
            gross: parseFloat(sapSale.NETWR) || 0,
            net: parseFloat(sapSale.NETWR) - parseFloat(sapSale.MWSBP) || 0,
            tax: parseFloat(sapSale.MWSBP) || 0
          },
          cost: {
            cogs: parseFloat(sapSale.WAVWR) || 0,
            freight: parseFloat(sapSale.KZWI3) || 0
          },
          margins: {
            grossMargin: parseFloat(sapSale.NETWR) - parseFloat(sapSale.WAVWR) || 0,
            grossMarginPercentage: ((parseFloat(sapSale.NETWR) - parseFloat(sapSale.WAVWR)) / parseFloat(sapSale.NETWR)) * 100 || 0
          },
          sapData: {
            salesOrg: sapSale.VKORG,
            distributionChannel: sapSale.VTWEG,
            division: sapSale.SPART,
            documentType: sapSale.FKART,
            billingType: sapSale.FKTYP
          }
        };
        
        // Check if record exists
        const existingSale = await SalesHistory.findOne({
          invoiceNumber: sapSale.VBELN,
          product: product._id
        });
        
        if (existingSale) {
          await SalesHistory.findByIdAndUpdate(existingSale._id, salesHistoryData);
          results.updated++;
        } else {
          await SalesHistory.create(salesHistoryData);
          results.created++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          invoice: sapSale.VBELN,
          error: error.message
        });
      }
    }
    
    logger.logAudit('sap_sales_sync', req.user._id, results);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('SAP sales sync failed:', error);
    throw new AppError('Failed to sync sales data from SAP', 500);
  }
});

// Post trade spend to SAP
exports.postTradeSpend = asyncHandler(async (req, res, next) => {
  const { tradeSpendId } = req.body;
  
  const tradeSpend = await TradeSpend.findById(tradeSpendId)
    .populate('customer')
    .populate('vendor');
  
  if (!tradeSpend) {
    throw new AppError('Trade spend not found', 404);
  }
  
  if (tradeSpend.status !== 'approved') {
    throw new AppError('Only approved trade spends can be posted to SAP', 400);
  }
  
  try {
    // Prepare SAP document
    const sapDocument = {
      BUKRS: '1000', // Company code
      BLDAT: new Date().toISOString().split('T')[0],
      BUDAT: new Date().toISOString().split('T')[0],
      BLART: 'KR', // Document type
      WAERS: 'USD',
      XBLNR: tradeSpend.spendId,
      BKTXT: `Trade Spend - ${tradeSpend.category}`,
      items: [
        {
          BSCHL: '31', // Posting key
          HKONT: getGLAccount(tradeSpend.spendType),
          WRBTR: tradeSpend.amount.approved,
          KOSTL: tradeSpend.costCenter || '1000',
          SGTXT: tradeSpend.description
        },
        {
          BSCHL: '21', // Vendor posting
          LIFNR: tradeSpend.vendor?.sapCode || tradeSpend.customer.sapCode,
          WRBTR: tradeSpend.amount.approved,
          ZTERM: 'NT30'
        }
      ]
    };
    
    const result = await sapService.postDocument(sapDocument);
    
    // Update trade spend with SAP document number
    tradeSpend.sapIntegration = {
      posted: true,
      documentNumber: result.documentNumber,
      postingDate: new Date(),
      fiscalYear: result.fiscalYear
    };
    
    await tradeSpend.save();
    
    logger.logAudit('sap_trade_spend_posted', req.user._id, {
      tradeSpendId: tradeSpend._id,
      sapDocument: result.documentNumber
    });
    
    res.json({
      success: true,
      data: {
        documentNumber: result.documentNumber,
        message: 'Trade spend posted to SAP successfully'
      }
    });
  } catch (error) {
    logger.error('SAP posting failed:', error);
    throw new AppError('Failed to post trade spend to SAP', 500);
  }
});

// Get SAP connection status
exports.getConnectionStatus = asyncHandler(async (req, res, next) => {
  try {
    const status = await sapService.testConnection();
    
    res.json({
      success: true,
      data: {
        connected: status.connected,
        system: status.system,
        client: status.client,
        user: status.user,
        language: status.language,
        responseTime: status.responseTime
      }
    });
  } catch (error) {
    res.json({
      success: false,
      data: {
        connected: false,
        error: error.message
      }
    });
  }
});

// Helper functions
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getGLAccount(spendType) {
  const glMapping = {
    marketing: '5100000',
    cash_coop: '5200000',
    trading_terms: '5300000',
    rebate: '5400000',
    promotion: '5500000'
  };
  
  return glMapping[spendType] || '5000000';
}