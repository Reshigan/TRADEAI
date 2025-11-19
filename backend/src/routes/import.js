const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'text/xml',
      'application/xml'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, Excel, JSON, and XML files are allowed.'));
    }
  }
});

/**
 * POST /api/import/:module
 * Import data for a specific module
 */
router.post('/:module', protect, upload.single('file'), async (req, res) => {
  try {
    const { module } = req.params;
    const { format, mapping, options } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const validModules = [
      'budget',
      'promotion',
      'tradeSpend',
      'claim',
      'deduction',
      'customer',
      'product',
      'vendor',
      'tradingTerm',
      'activityGrid',
      'kamWallet',
      'campaign'
    ];

    if (!validModules.includes(module)) {
      return res.status(400).json({
        success: false,
        message: `Invalid module: ${module}`
      });
    }

    let data;
    try {
      if (format === 'csv' || file.mimetype === 'text/csv') {
        data = parseCSV(file.buffer);
      } else if (format === 'json' || file.mimetype === 'application/json') {
        data = JSON.parse(file.buffer.toString());
      } else if (format === 'xml' || file.mimetype.includes('xml')) {
        data = parseXML(file.buffer);
      } else if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
        data = parseExcel(file.buffer);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported file format'
        });
      }
    } catch (parseError) {
      logger.error('Error parsing file:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Error parsing file',
        error: parseError.message
      });
    }

    if (mapping) {
      data = applyMapping(data, JSON.parse(mapping));
    }

    const result = await processImport(module, data, req.user, options ? JSON.parse(options) : {});

    res.json({
      success: true,
      data: result,
      message: `Successfully imported ${result.successCount} records`
    });
  } catch (error) {
    logger.error('Error importing data:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing data',
      error: error.message
    });
  }
});

/**
 * GET /api/import/templates/:module
 * Get import template for a specific module
 */
router.get('/templates/:module', protect, (req, res) => {
  try {
    const { module } = req.params;
    const { format = 'csv' } = req.query;

    const templates = {
      budget: {
        fields: ['name', 'code', 'year', 'budgetType', 'budgetCategory', 'allocated', 'spent', 'remaining', 'status'],
        sample: {
          name: 'Marketing Budget 2025',
          code: 'BUD-2025-001',
          year: 2025,
          budgetType: 'budget',
          budgetCategory: 'marketing',
          allocated: 100000,
          spent: 0,
          remaining: 100000,
          status: 'draft'
        }
      },
      promotion: {
        fields: ['name', 'code', 'promotionType', 'status', 'startDate', 'endDate', 'mechanics', 'targetVolume'],
        sample: {
          name: 'Summer Promotion 2025',
          code: 'PROMO-2025-001',
          promotionType: 'discount',
          status: 'draft',
          startDate: '2025-06-01',
          endDate: '2025-08-31',
          mechanics: 'Buy 2 Get 1 Free',
          targetVolume: 10000
        }
      },
      customer: {
        fields: ['name', 'code', 'customerType', 'status', 'email', 'phone', 'address'],
        sample: {
          name: 'ABC Retail Store',
          code: 'CUST-001',
          customerType: 'retailer',
          status: 'active',
          email: 'contact@abcretail.com',
          phone: '+27123456789',
          address: 'Johannesburg, South Africa'
        }
      },
      product: {
        fields: ['name', 'code', 'sku', 'category', 'brand', 'unitPrice', 'status'],
        sample: {
          name: 'Chocolate Bar 100g',
          code: 'PROD-001',
          sku: 'CHOC-100',
          category: 'Confectionery',
          brand: 'Premium',
          unitPrice: 15.99,
          status: 'active'
        }
      }
    };

    const template = templates[module];
    if (!template) {
      return res.status(404).json({
        success: false,
        message: `No template found for module: ${module}`
      });
    }

    if (format === 'json') {
      res.json({
        success: true,
        data: template
      });
    } else {
      const csv = [
        template.fields.join(','),
        Object.values(template.sample).join(',')
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${module}-template.csv"`);
      res.send(csv);
    }
  } catch (error) {
    logger.error('Error getting template:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting template',
      error: error.message
    });
  }
});

// Helper functions
function parseCSV(buffer) {
  const csv = require('csv-parse/sync');
  const records = csv.parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  return records;
}

function parseXML(buffer) {
  const xml = buffer.toString();
  logger.warn('XML parsing not fully implemented', { xmlLength: xml.length });
  return [];
}

function parseExcel(buffer) {
  const XLSX = require('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  return data;
}

function applyMapping(data, mapping) {
  return data.map(row => {
    const mappedRow = {};
    for (const [targetField, sourceField] of Object.entries(mapping)) {
      mappedRow[targetField] = row[sourceField];
    }
    return mappedRow;
  });
}

async function processImport(module, data, user, options) {
  const modelMap = {
    budget: require('../models/Budget'),
    promotion: require('../models/Promotion'),
    tradeSpend: require('../models/TradeSpend'),
    claim: require('../models/Claim'),
    deduction: require('../models/Deduction'),
    customer: require('../models/Customer'),
    product: require('../models/Product'),
    vendor: require('../models/Vendor'),
    tradingTerm: require('../models/TradingTerm'),
    activityGrid: require('../models/ActivityGrid'),
    kamWallet: require('../models/KAMWallet'),
    campaign: require('../models/Campaign')
  };

  const Model = modelMap[module];
  if (!Model) {
    throw new Error(`Invalid module: ${module}`);
  }

  const results = {
    successCount: 0,
    errorCount: 0,
    errors: [],
    created: []
  };

  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i];

      row.company = user.company;
      row.createdBy = user._id;

      const record = await Model.create(row);
      results.successCount++;
      results.created.push(record._id);
    } catch (error) {
      results.errorCount++;
      results.errors.push({
        row: i + 1,
        error: error.message
      });

      if (options.strict) {
        break;
      }
    }
  }

  return results;
}

module.exports = router;
