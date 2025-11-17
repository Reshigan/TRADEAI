const ExcelJS = require('exceljs');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');

/**
 * Bulk Operations Service for Master Data Management
 * Handles Excel/CSV import/export, data validation, and bulk operations
 */

class BulkOperationsService {
  constructor() {
    this.supportedFormats = ['xlsx', 'xls', 'csv'];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.batchSize = 1000; // Process in batches of 1000 records
  }

  /**
   * Import data from Excel/CSV file
   */
  async importData(tenantId, filePath, modelType, options = {}) {
    try {
      // Validate file
      await this.validateFile(filePath);

      // Parse file based on format
      const data = await this.parseFile(filePath);

      // Validate data structure
      const validationResult = await this.validateData(data, modelType, tenantId);

      if (validationResult.errors.length > 0 && !options.ignoreErrors) {
        return {
          success: false,
          errors: validationResult.errors,
          validRecords: validationResult.validRecords.length,
          totalRecords: data.length
        };
      }

      // Process valid records in batches
      const result = await this.processImport(
        tenantId,
        validationResult.validRecords,
        modelType,
        options
      );

      return {
        success: true,
        imported: result.imported,
        updated: result.updated,
        errors: result.errors,
        totalRecords: data.length,
        validRecords: validationResult.validRecords.length,
        processingTime: result.processingTime
      };

    } catch (error) {
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Export data to Excel/CSV file
   */
  async exportData(tenantId, modelType, filters = {}, options = {}) {
    try {
      const format = options.format || 'xlsx';
      const includeHierarchy = options.includeHierarchy || false;

      // Get data based on model type
      const data = await this.getData(tenantId, modelType, filters, includeHierarchy);

      // Transform data for export
      const exportData = await this.transformForExport(data, modelType, options);

      // Generate file
      const filePath = await this.generateFile(exportData, format, modelType);

      return {
        success: true,
        filePath,
        recordCount: data.length,
        format,
        generatedAt: new Date()
      };

    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Bulk update operations
   */
  async bulkUpdate(tenantId, modelType, updates, options = {}) {
    try {
      const Model = this.getModel(modelType);
      const results = {
        updated: 0,
        errors: [],
        processingTime: 0
      };

      const startTime = Date.now();

      // Process updates in batches
      for (let i = 0; i < updates.length; i += this.batchSize) {
        const batch = updates.slice(i, i + this.batchSize);

        try {
          const bulkOps = batch.map((update) => ({
            updateOne: {
              filter: {
                _id: update._id,
                tenantId
              },
              update: { $set: update.data },
              upsert: options.upsert || false
            }
          }));

          const batchResult = await Model.bulkWrite(bulkOps, { ordered: false });
          results.updated += batchResult.modifiedCount;

        } catch (error) {
          results.errors.push({
            batch: Math.floor(i / this.batchSize) + 1,
            error: error.message
          });
        }
      }

      results.processingTime = Date.now() - startTime;
      return results;

    } catch (error) {
      throw new Error(`Bulk update failed: ${error.message}`);
    }
  }

  /**
   * Bulk delete operations
   */
  async bulkDelete(tenantId, modelType, ids, options = {}) {
    try {
      const Model = this.getModel(modelType);
      const softDelete = options.softDelete !== false; // Default to soft delete

      const results = {
        deleted: 0,
        errors: [],
        processingTime: 0
      };

      const startTime = Date.now();

      if (softDelete) {
        // Soft delete - mark as deleted
        const result = await Model.updateMany(
          {
            _id: { $in: ids },
            tenantId
          },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date()
            }
          }
        );
        results.deleted = result.modifiedCount;
      } else {
        // Hard delete - actually remove from database
        const result = await Model.deleteMany({
          _id: { $in: ids },
          tenantId
        });
        results.deleted = result.deletedCount;
      }

      results.processingTime = Date.now() - startTime;
      return results;

    } catch (error) {
      throw new Error(`Bulk delete failed: ${error.message}`);
    }
  }

  /**
   * Data synchronization between systems
   */
  async syncData(tenantId, modelType, externalData, options = {}) {
    try {
      const Model = this.getModel(modelType);
      const syncKey = options.syncKey || 'code'; // Field to match records

      const results = {
        created: 0,
        updated: 0,
        unchanged: 0,
        errors: [],
        processingTime: 0
      };

      const startTime = Date.now();

      // Process in batches
      for (let i = 0; i < externalData.length; i += this.batchSize) {
        const batch = externalData.slice(i, i + this.batchSize);

        try {
          const batchResults = await this.processSyncBatch(
            tenantId,
            Model,
            batch,
            syncKey,
            options
          );

          results.created += batchResults.created;
          results.updated += batchResults.updated;
          results.unchanged += batchResults.unchanged;
          results.errors.push(...batchResults.errors);

        } catch (error) {
          results.errors.push({
            batch: Math.floor(i / this.batchSize) + 1,
            error: error.message
          });
        }
      }

      results.processingTime = Date.now() - startTime;
      return results;

    } catch (error) {
      throw new Error(`Data sync failed: ${error.message}`);
    }
  }

  /**
   * Generate data templates for import
   */
  async generateTemplate(modelType, options = {}) {
    try {
      const format = options.format || 'xlsx';
      const includeExamples = options.includeExamples || false;

      // Get field definitions for the model
      const fields = this.getModelFields(modelType);

      // Create template data
      const templateData = this.createTemplateData(fields, includeExamples);

      // Generate file
      const filePath = await this.generateFile(templateData, format, `${modelType}_template`);

      return {
        success: true,
        filePath,
        format,
        fields: fields.length,
        generatedAt: new Date()
      };

    } catch (error) {
      throw new Error(`Template generation failed: ${error.message}`);
    }
  }

  // Helper Methods

  validateFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    const stats = fs.statSync(filePath);
    if (stats.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    const ext = path.extname(filePath).toLowerCase().substring(1);
    if (!this.supportedFormats.includes(ext)) {
      throw new Error(`Unsupported file format. Supported formats: ${this.supportedFormats.join(', ')}`);
    }
  }

  parseFile(filePath) {
    const ext = path.extname(filePath).toLowerCase().substring(1);

    if (ext === 'csv') {
      return this.parseCSV(filePath);
    } else if (ext === 'xlsx' || ext === 'xls') {
      return this.parseExcel(filePath);
    }

    throw new Error('Unsupported file format');
  }

  parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  async parseExcel(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('No worksheet found in Excel file');
    }

    const data = [];
    const headers = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // First row is headers
        row.eachCell((cell) => {
          headers.push(cell.value);
        });
      } else {
        // Data rows
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          rowData[headers[colNumber - 1]] = cell.value;
        });
        data.push(rowData);
      }
    });

    return data;
  }

  async validateData(data, modelType, tenantId) {
    const validRecords = [];
    const errors = [];

    const validator = this.getValidator(modelType);

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const validation = await validator(record, tenantId, i + 1);

      if (validation.isValid) {
        validRecords.push(validation.record);
      } else {
        errors.push(...validation.errors);
      }
    }

    return { validRecords, errors };
  }

  async processImport(tenantId, records, modelType, options) {
    const Model = this.getModel(modelType);
    const results = {
      imported: 0,
      updated: 0,
      errors: [],
      processingTime: 0
    };

    const startTime = Date.now();

    // Process in batches
    for (let i = 0; i < records.length; i += this.batchSize) {
      const batch = records.slice(i, i + this.batchSize);

      try {
        if (options.updateExisting) {
          // Upsert operation
          const bulkOps = batch.map((record) => ({
            updateOne: {
              filter: {
                code: record.code,
                tenantId
              },
              update: { $set: record },
              upsert: true
            }
          }));

          const batchResult = await Model.bulkWrite(bulkOps, { ordered: false });
          results.imported += batchResult.upsertedCount;
          results.updated += batchResult.modifiedCount;

        } else {
          // Insert only
          const batchResult = await Model.insertMany(batch, { ordered: false });
          results.imported += batchResult.length;
        }

      } catch (error) {
        results.errors.push({
          batch: Math.floor(i / this.batchSize) + 1,
          error: error.message
        });
      }
    }

    results.processingTime = Date.now() - startTime;
    return results;
  }

  getData(tenantId, modelType, filters, includeHierarchy) {
    const Model = this.getModel(modelType);
    let query = Model.find({ tenantId, ...filters });

    if (includeHierarchy && (modelType === 'customer' || modelType === 'product')) {
      query = query.populate('parentId');
    }

    return query.lean();
  }

  transformForExport(data, modelType, options) {
    const transformer = this.getTransformer(modelType);
    return data.map((record) => transformer(record, options));
  }

  async generateFile(data, format, filename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(process.cwd(), 'temp', `${filename}_${timestamp}.${format}`);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    if (format === 'csv') {
      await this.generateCSV(data, filePath);
    } else if (format === 'xlsx') {
      await this.generateExcel(data, filePath);
    }

    return filePath;
  }

  generateCSV(data, filePath) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) => headers.map((header) => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    fs.writeFileSync(filePath, csvContent);
  }

  async generateExcel(data, filePath) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TRADEAI';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Data');

    if (data && data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF366092' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 20;

      // Add data rows
      data.forEach((row) => {
        const values = headers.map((header) => row[header]);
        worksheet.addRow(values);
      });

      // Auto-size columns
      headers.forEach((header, index) => {
        const column = worksheet.getColumn(index + 1);
        column.width = Math.max(15, header.length + 5);
      });

      // Add auto-filter
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: headers.length }
      };

      // Freeze header row
      worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1 }
      ];
    }

    await workbook.xlsx.writeFile(filePath);
  }

  getModel(modelType) {
    const models = {
      customer: Customer,
      product: Product,
      promotion: Promotion
    };

    const model = models[modelType.toLowerCase()];
    if (!model) {
      throw new Error(`Unsupported model type: ${modelType}`);
    }

    return model;
  }

  getValidator(modelType) {
    const validators = {
      customer: this.validateCustomerRecord.bind(this),
      product: this.validateProductRecord.bind(this),
      promotion: this.validatePromotionRecord.bind(this)
    };

    return validators[modelType.toLowerCase()] || this.validateGenericRecord.bind(this);
  }

  getTransformer(modelType) {
    const transformers = {
      customer: this.transformCustomerRecord.bind(this),
      product: this.transformProductRecord.bind(this),
      promotion: this.transformPromotionRecord.bind(this)
    };

    return transformers[modelType.toLowerCase()] || this.transformGenericRecord.bind(this);
  }

  async validateCustomerRecord(record, tenantId, rowNumber) {
    const errors = [];
    const validRecord = { ...record, tenantId };

    // Required fields validation
    if (!record.name) {
      errors.push(`Row ${rowNumber}: Customer name is required`);
    }

    if (!record.code) {
      errors.push(`Row ${rowNumber}: Customer code is required`);
    }

    if (!record.email) {
      errors.push(`Row ${rowNumber}: Customer email is required`);
    } else if (!/\S+@\S+\.\S+/.test(record.email)) {
      errors.push(`Row ${rowNumber}: Invalid email format`);
    }

    // Check for duplicates
    if (record.code) {
      const existing = await Customer.findOne({
        code: record.code,
        tenantId
      });

      if (existing) {
        errors.push(`Row ${rowNumber}: Customer code '${record.code}' already exists`);
      }
    }

    return {
      isValid: errors.length === 0,
      record: validRecord,
      errors
    };
  }

  async validateProductRecord(record, tenantId, rowNumber) {
    const errors = [];
    const validRecord = { ...record, tenantId };

    // Required fields validation
    if (!record.name) {
      errors.push(`Row ${rowNumber}: Product name is required`);
    }

    if (!record.sku) {
      errors.push(`Row ${rowNumber}: Product SKU is required`);
    }

    // Check for duplicates
    if (record.sku) {
      const existing = await Product.findOne({
        sku: record.sku,
        tenantId
      });

      if (existing) {
        errors.push(`Row ${rowNumber}: Product SKU '${record.sku}' already exists`);
      }
    }

    return {
      isValid: errors.length === 0,
      record: validRecord,
      errors
    };
  }

  validatePromotionRecord(record, tenantId, rowNumber) {
    const errors = [];
    const validRecord = { ...record, tenantId };

    // Required fields validation
    if (!record.name) {
      errors.push(`Row ${rowNumber}: Promotion name is required`);
    }

    if (!record.startDate) {
      errors.push(`Row ${rowNumber}: Start date is required`);
    }

    if (!record.endDate) {
      errors.push(`Row ${rowNumber}: End date is required`);
    }

    // Date validation
    if (record.startDate && record.endDate) {
      const start = new Date(record.startDate);
      const end = new Date(record.endDate);

      if (start >= end) {
        errors.push(`Row ${rowNumber}: End date must be after start date`);
      }
    }

    return {
      isValid: errors.length === 0,
      record: validRecord,
      errors
    };
  }

  validateGenericRecord(record, tenantId, rowNumber) {
    return {
      isValid: true,
      record: { ...record, tenantId },
      errors: []
    };
  }

  transformCustomerRecord(record, options) {
    return {
      'Customer Code': record.code,
      'Customer Name': record.name,
      'Email': record.email,
      'Phone': record.phone,
      'Customer Type': record.customerType,
      'Channel': record.channel,
      'Tier': record.tier,
      'Status': record.status,
      'Created Date': record.createdAt,
      'Address': record.address ? `${record.address.street}, ${record.address.city}` : '',
      'Country': record.address?.country || ''
    };
  }

  transformProductRecord(record, options) {
    return {
      'Product SKU': record.sku,
      'Product Name': record.name,
      'Description': record.description,
      'Category': record.category?.primary || '',
      'Brand': record.brand?.name || '',
      'Product Type': record.productType,
      'List Price': record.pricing?.listPrice || '',
      'Status': record.status,
      'Created Date': record.createdAt
    };
  }

  transformPromotionRecord(record, options) {
    return {
      'Promotion Name': record.name,
      'Type': record.type,
      'Start Date': record.startDate,
      'End Date': record.endDate,
      'Status': record.status,
      'Budget': record.budget,
      'Description': record.description,
      'Created Date': record.createdAt
    };
  }

  transformGenericRecord(record, options) {
    return record;
  }

  getModelFields(modelType) {
    const fieldDefinitions = {
      customer: [
        { name: 'code', required: true, type: 'string' },
        { name: 'name', required: true, type: 'string' },
        { name: 'email', required: true, type: 'email' },
        { name: 'phone', required: false, type: 'string' },
        { name: 'customerType', required: true, type: 'enum' },
        { name: 'channel', required: true, type: 'enum' },
        { name: 'tier', required: false, type: 'enum' }
      ],
      product: [
        { name: 'sku', required: true, type: 'string' },
        { name: 'name', required: true, type: 'string' },
        { name: 'description', required: false, type: 'string' },
        { name: 'productType', required: true, type: 'enum' },
        { name: 'category', required: false, type: 'string' },
        { name: 'brand', required: false, type: 'string' }
      ],
      promotion: [
        { name: 'name', required: true, type: 'string' },
        { name: 'type', required: true, type: 'enum' },
        { name: 'startDate', required: true, type: 'date' },
        { name: 'endDate', required: true, type: 'date' },
        { name: 'budget', required: false, type: 'number' },
        { name: 'description', required: false, type: 'string' }
      ]
    };

    return fieldDefinitions[modelType.toLowerCase()] || [];
  }

  createTemplateData(fields, includeExamples) {
    const templateRow = {};

    fields.forEach((field) => {
      if (includeExamples) {
        templateRow[field.name] = this.getExampleValue(field);
      } else {
        templateRow[field.name] = '';
      }
    });

    return includeExamples ? [templateRow] : [];
  }

  getExampleValue(field) {
    const examples = {
      string: 'Example Text',
      email: 'example@company.com',
      number: 100,
      date: '2024-01-01',
      enum: 'Option1'
    };

    return examples[field.type] || 'Example';
  }

  async processSyncBatch(tenantId, Model, batch, syncKey, options) {
    const results = {
      created: 0,
      updated: 0,
      unchanged: 0,
      errors: []
    };

    for (const record of batch) {
      try {
        const existing = await Model.findOne({
          [syncKey]: record[syncKey],
          tenantId
        });

        if (existing) {
          // Check if update is needed
          const hasChanges = this.hasSignificantChanges(existing, record, options.ignoreFields);

          if (hasChanges) {
            await Model.updateOne(
              { _id: existing._id },
              { $set: { ...record, tenantId } }
            );
            results.updated++;
          } else {
            results.unchanged++;
          }
        } else {
          // Create new record
          await Model.create({ ...record, tenantId });
          results.created++;
        }

      } catch (error) {
        results.errors.push({
          record: record[syncKey],
          error: error.message
        });
      }
    }

    return results;
  }

  hasSignificantChanges(existing, newRecord, ignoreFields = []) {
    const fieldsToCheck = Object.keys(newRecord).filter(
      (field) => !ignoreFields.includes(field) && field !== '_id' && field !== 'tenantId'
    );

    return fieldsToCheck.some((field) => {
      const existingValue = existing[field];
      const newValue = newRecord[field];

      // Handle different data types
      if (existingValue instanceof Date && typeof newValue === 'string') {
        return existingValue.toISOString() !== new Date(newValue).toISOString();
      }

      return existingValue !== newValue;
    });
  }
}

module.exports = BulkOperationsService;
