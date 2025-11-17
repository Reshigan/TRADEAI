/**
 * POS Data Import Service
 * Handles CSV/Excel import of point-of-sale transaction data
 */

const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const { Readable } = require('stream');
const Transaction = require('../models/Transaction');
const SalesHistory = require('../models/SalesHistory');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

class POSImportService {
  constructor() {
    this.BATCH_SIZE = 1000;
    this.validationErrors = [];
    this.processedRows = 0;
    this.successCount = 0;
    this.errorCount = 0;
  }

  /**
   * Parse CSV file
   */
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Parse Excel file
   */
  parseExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }

  /**
   * Parse file based on extension
   */
  async parseFile(filePath, fileType) {
    try {
      if (fileType === 'csv') {
        return this.parseCSV(filePath);
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        return this.parseExcel(filePath);
      } else {
        throw new Error('Unsupported file type');
      }
    } catch (error) {
      throw new Error(`File parsing failed: ${error.message}`);
    }
  }

  /**
   * Validate single row
   */
  async validateRow(row, rowIndex, tenantId) {
    const errors = [];

    // Required fields validation
    const requiredFields = ['date', 'sku', 'customer', 'quantity', 'amount'];

    for (const field of requiredFields) {
      if (!row[field] || row[field] === '') {
        errors.push({
          row: rowIndex + 1,
          field,
          error: 'Required field is missing',
          value: row[field]
        });
      }
    }

    // Date format validation
    if (row.date) {
      const date = new Date(row.date);
      if (isNaN(date.getTime())) {
        errors.push({
          row: rowIndex + 1,
          field: 'date',
          error: 'Invalid date format',
          value: row.date
        });
      }
    }

    // Numeric validation
    if (row.quantity && isNaN(parseFloat(row.quantity))) {
      errors.push({
        row: rowIndex + 1,
        field: 'quantity',
        error: 'Quantity must be numeric',
        value: row.quantity
      });
    }

    if (row.amount && isNaN(parseFloat(row.amount))) {
      errors.push({
        row: rowIndex + 1,
        field: 'amount',
        error: 'Amount must be numeric',
        value: row.amount
      });
    }

    // Product validation (check if SKU exists)
    if (row.sku) {
      const product = await Product.findOne({
        $or: [
          { sku: row.sku },
          { productCode: row.sku }
        ],
        tenantId,
        isDeleted: false
      });

      if (!product) {
        errors.push({
          row: rowIndex + 1,
          field: 'sku',
          error: 'Product not found in database',
          value: row.sku
        });
      }
    }

    // Customer validation
    if (row.customer) {
      const customer = await Customer.findOne({
        $or: [
          { customerCode: row.customer },
          { name: row.customer }
        ],
        tenantId,
        isDeleted: false
      });

      if (!customer) {
        errors.push({
          row: rowIndex + 1,
          field: 'customer',
          error: 'Customer not found in database',
          value: row.customer
        });
      }
    }

    return errors;
  }

  /**
   * Validate all rows
   */
  async validateData(data, tenantId) {
    const allErrors = [];
    const validRows = [];

    for (let i = 0; i < data.length; i++) {
      const errors = await this.validateRow(data[i], i, tenantId);

      if (errors.length > 0) {
        allErrors.push(...errors);
      } else {
        validRows.push({ ...data[i], rowIndex: i + 1 });
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      validRows,
      totalRows: data.length,
      validCount: validRows.length,
      errorCount: allErrors.length
    };
  }

  /**
   * Transform row to Transaction format
   */
  async transformRow(row, tenantId, userId) {
    // Find product
    const product = await Product.findOne({
      $or: [
        { sku: row.sku },
        { productCode: row.sku }
      ],
      tenantId
    });

    // Find customer
    const customer = await Customer.findOne({
      $or: [
        { customerCode: row.customer },
        { name: row.customer }
      ],
      tenantId
    });

    const grossAmount = parseFloat(row.amount);
    const quantity = parseFloat(row.quantity);
    const unitPrice = grossAmount / quantity;

    return {
      transactionType: 'credit',
      transactionDate: new Date(row.date),
      transactionNumber: row.transactionNumber || `POS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerId: customer ? customer._id : null,
      productId: product ? product._id : null,
      sku: row.sku,
      quantity,
      unitPrice,
      amount: {
        gross: grossAmount,
        tax: row.tax ? parseFloat(row.tax) : 0,
        discount: row.discount ? parseFloat(row.discount) : 0,
        net: grossAmount - (row.discount ? parseFloat(row.discount) : 0)
      },
      store: row.store || null,
      region: row.region || null,
      source: 'pos_import',
      status: 'completed',
      tenantId,
      createdBy: userId,
      metadata: {
        importDate: new Date(),
        originalRow: row
      }
    };
  }

  /**
   * Import data in batches
   */
  async importData(validRows, tenantId, userId, onProgress) {
    this.successCount = 0;
    this.errorCount = 0;
    this.processedRows = 0;

    const totalRows = validRows.length;
    const batches = Math.ceil(totalRows / this.BATCH_SIZE);

    for (let i = 0; i < batches; i++) {
      const start = i * this.BATCH_SIZE;
      const end = Math.min(start + this.BATCH_SIZE, totalRows);
      const batch = validRows.slice(start, end);

      try {
        const transformedData = [];

        for (const row of batch) {
          try {
            const transformed = await this.transformRow(row, tenantId, userId);
            transformedData.push(transformed);
          } catch (error) {
            this.errorCount++;
            this.validationErrors.push({
              row: row.rowIndex,
              error: `Transformation error: ${error.message}`
            });
          }
        }

        // Bulk insert
        if (transformedData.length > 0) {
          await Transaction.insertMany(transformedData, { ordered: false });
          this.successCount += transformedData.length;
        }

        this.processedRows = end;

        // Report progress
        if (onProgress) {
          onProgress({
            processed: this.processedRows,
            total: totalRows,
            success: this.successCount,
            errors: this.errorCount,
            percentage: Math.round((this.processedRows / totalRows) * 100)
          });
        }

      } catch (error) {
        // Handle bulk insert errors
        if (error.writeErrors) {
          this.errorCount += error.writeErrors.length;
          this.successCount += transformedData.length - error.writeErrors.length;
        } else {
          this.errorCount += batch.length;
        }
      }
    }

    return {
      success: true,
      imported: this.successCount,
      failed: this.errorCount,
      total: totalRows,
      errors: this.validationErrors
    };
  }

  /**
   * Aggregate transactions to SalesHistory
   */
  async aggregateToSalesHistory(startDate, endDate, tenantId) {
    const transactions = await Transaction.aggregate([
      {
        $match: {
          tenantId,
          transactionDate: {
            $gte: startDate,
            $lte: endDate
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            productId: '$productId',
            customerId: '$customerId',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$transactionDate'
              }
            }
          },
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$amount.net' },
          transactionCount: { $sum: 1 },
          avgUnitPrice: { $avg: '$unitPrice' }
        }
      }
    ]);

    // Upsert to SalesHistory
    const operations = transactions.map((item) => ({
      updateOne: {
        filter: {
          productId: item._id.productId,
          customerId: item._id.customerId,
          date: new Date(item._id.date),
          tenantId
        },
        update: {
          $set: {
            quantity: item.totalQuantity,
            revenue: item.totalRevenue,
            transactionCount: item.transactionCount,
            avgUnitPrice: item.avgUnitPrice,
            lastUpdated: new Date()
          }
        },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await SalesHistory.bulkWrite(operations);
    }

    return {
      aggregated: transactions.length,
      period: { start: startDate, end: endDate }
    };
  }

  /**
   * Generate import template
   */
  generateTemplate() {
    return {
      filename: 'pos_import_template.csv',
      headers: [
        'date',
        'sku',
        'customer',
        'quantity',
        'amount',
        'discount',
        'tax',
        'store',
        'region',
        'transactionNumber'
      ],
      sampleData: [
        {
          date: '2025-10-01',
          sku: 'SKU001',
          customer: 'CUST001',
          quantity: '10',
          amount: '100.00',
          discount: '5.00',
          tax: '7.50',
          store: 'Store A',
          region: 'North',
          transactionNumber: 'TXN-001'
        },
        {
          date: '2025-10-02',
          sku: 'SKU002',
          customer: 'CUST002',
          quantity: '5',
          amount: '50.00',
          discount: '0.00',
          tax: '3.75',
          store: 'Store B',
          region: 'South',
          transactionNumber: 'TXN-002'
        }
      ]
    };
  }

  /**
   * Get import statistics
   */
  getImportStats() {
    return {
      processed: this.processedRows,
      success: this.successCount,
      errors: this.errorCount,
      validationErrors: this.validationErrors
    };
  }
}

module.exports = new POSImportService();
