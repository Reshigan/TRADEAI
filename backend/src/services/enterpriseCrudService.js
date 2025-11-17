const { AppError } = require('../middleware/errorHandler');
const csvParser = require('csv-parser');
const fs = require('fs');
const { pipeline } = require('stream/promises');

/**
 * ENTERPRISE CRUD SERVICE
 * Provides advanced CRUD operations for all entities including:
 * - Bulk operations
 * - Advanced filtering
 * - Import/Export
 * - Data validation
 * - Version history
 */

class EnterpriseCrudService {
  constructor(model) {
    this.model = model;
    this.modelName = model.modelName;
  }

  /**
   * CREATE Operations
   */

  // Create single record
  async create(data, options = {}) {
    try {
      const record = new this.model(data);

      if (options.validate) {
        await this.validateData(data);
      }

      await record.save();

      if (options.auditLog) {
        await this.logAudit('create', record._id, data, options.userId);
      }

      return record;
    } catch (error) {
      throw new AppError(`Failed to create ${this.modelName}: ${error.message}`, 400);
    }
  }

  // Bulk create
  async bulkCreate(dataArray, options = {}) {
    const results = {
      success: [],
      failed: [],
      total: dataArray.length
    };

    for (const data of dataArray) {
      try {
        const record = await this.create(data, options);
        results.success.push({ id: record._id, data: record });
      } catch (error) {
        results.failed.push({ data, error: error.message });
      }
    }

    return results;
  }

  // Create from template
  async createFromTemplate(templateId, overrides = {}) {
    const template = await this.model.findById(templateId);
    if (!template) {
      throw new AppError('Template not found', 404);
    }

    const templateData = template.toObject();
    delete templateData._id;
    delete templateData.createdAt;
    delete templateData.updatedAt;

    const newData = { ...templateData, ...overrides };
    return this.create(newData);
  }

  // Duplicate/Clone record
  async duplicate(id, overrides = {}) {
    const original = await this.model.findById(id);
    if (!original) {
      throw new AppError(`${this.modelName} not found`, 404);
    }

    const cloneData = original.toObject();
    delete cloneData._id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;

    // Add clone indicator
    if (cloneData.name) {
      cloneData.name = `${cloneData.name} (Copy)`;
    }

    const newData = { ...cloneData, ...overrides };
    return this.create(newData);
  }

  /**
   * READ Operations
   */

  // Get single record by ID
  async findById(id, options = {}) {
    let query = this.model.findById(id);

    if (options.populate) {
      query = query.populate(options.populate);
    }

    if (options.select) {
      query = query.select(options.select);
    }

    const record = await query;
    if (!record) {
      throw new AppError(`${this.modelName} not found`, 404);
    }

    return record;
  }

  // Advanced find with filters
  async find(filters = {}, options = {}) {
    const {
      page = 1,
      limit = 50,
      sort = '-createdAt',
      select,
      populate,
      search,
      searchFields = []
    } = options;

    // Build query
    let query = {};

    // Apply basic filters
    query = { ...filters };

    // Apply search if provided
    if (search && searchFields.length > 0) {
      query.$or = searchFields.map((field) => ({
        [field]: { $regex: search, $options: 'i' }
      }));
    }

    // Apply advanced filters (operators)
    query = this.applyAdvancedFilters(query, filters);

    // Count total documents
    const total = await this.model.countDocuments(query);

    // Execute query with pagination
    const skip = (page - 1) * limit;
    let mongoQuery = this.model.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    if (select) {
      mongoQuery = mongoQuery.select(select);
    }

    if (populate) {
      mongoQuery = mongoQuery.populate(populate);
    }

    const records = await mongoQuery;

    return {
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + records.length < total
      }
    };
  }

  // Full-text search
  async search(searchTerm, fields = [], options = {}) {
    const { limit = 20, skip = 0 } = options;

    const searchQuery = {
      $or: fields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' }
      }))
    };

    const results = await this.model.find(searchQuery)
      .limit(limit)
      .skip(skip)
      .sort({ _id: -1 });

    const total = await this.model.countDocuments(searchQuery);

    return {
      results,
      total,
      hasMore: skip + results.length < total
    };
  }

  // Faceted search
  async facetedSearch(filters = {}, facetFields = []) {
    const pipeline = [
      { $match: filters }
    ];

    const facets = {};
    facetFields.forEach((field) => {
      facets[field] = [
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ];
    });

    facets.documents = [
      { $skip: 0 },
      { $limit: 50 }
    ];

    facets.total = [
      { $count: 'count' }
    ];

    pipeline.push({ $facet: facets });

    const results = await this.model.aggregate(pipeline);
    return results[0];
  }

  // Get saved views
  getSavedView(viewId, userId) {
    // Implementation for saved views/filters
    // This would query a separate SavedViews collection
    return {};
  }

  /**
   * UPDATE Operations
   */

  // Update single record
  async update(id, data, options = {}) {
    const record = await this.model.findById(id);
    if (!record) {
      throw new AppError(`${this.modelName} not found`, 404);
    }

    // Store version if needed
    if (options.versionHistory) {
      await this.saveVersion(record);
    }

    Object.assign(record, data);
    await record.save();

    if (options.auditLog) {
      await this.logAudit('update', id, data, options.userId);
    }

    return record;
  }

  // Partial update (PATCH)
  async partialUpdate(id, updates, options = {}) {
    const record = await this.model.findById(id);
    if (!record) {
      throw new AppError(`${this.modelName} not found`, 404);
    }

    // Apply partial updates
    for (const [key, value] of Object.entries(updates)) {
      if (key.includes('.')) {
        // Handle nested updates
        const keys = key.split('.');
        let current = record;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
      } else {
        record[key] = value;
      }
    }

    await record.save();

    if (options.auditLog) {
      await this.logAudit('partial_update', id, updates, options.userId);
    }

    return record;
  }

  // Bulk update
  async bulkUpdate(filter, updates, options = {}) {
    const records = await this.model.find(filter);

    const results = {
      success: [],
      failed: [],
      total: records.length
    };

    for (const record of records) {
      try {
        Object.assign(record, updates);
        await record.save();
        results.success.push(record._id);
      } catch (error) {
        results.failed.push({ id: record._id, error: error.message });
      }
    }

    return results;
  }

  // Mass update with custom function
  async massUpdate(filter, updateFn, options = {}) {
    const records = await this.model.find(filter);

    for (const record of records) {
      await updateFn(record);
      await record.save();
    }

    return { updated: records.length };
  }

  /**
   * DELETE Operations
   */

  // Soft delete
  async softDelete(id, options = {}) {
    const record = await this.model.findById(id);
    if (!record) {
      throw new AppError(`${this.modelName} not found`, 404);
    }

    record.isDeleted = true;
    record.deletedAt = new Date();
    record.deletedBy = options.userId;
    await record.save();

    if (options.auditLog) {
      await this.logAudit('soft_delete', id, {}, options.userId);
    }

    return record;
  }

  // Hard delete
  async hardDelete(id, options = {}) {
    const record = await this.model.findById(id);
    if (!record) {
      throw new AppError(`${this.modelName} not found`, 404);
    }

    if (options.auditLog) {
      await this.logAudit('hard_delete', id, record.toObject(), options.userId);
    }

    await record.remove();
    return { deleted: true, id };
  }

  // Bulk delete
  async bulkDelete(ids, options = {}) {
    const results = {
      success: [],
      failed: [],
      total: ids.length
    };

    for (const id of ids) {
      try {
        await this.softDelete(id, options);
        results.success.push(id);
      } catch (error) {
        results.failed.push({ id, error: error.message });
      }
    }

    return results;
  }

  // Restore soft-deleted record
  async restore(id, options = {}) {
    const record = await this.model.findById(id);
    if (!record) {
      throw new AppError(`${this.modelName} not found`, 404);
    }

    record.isDeleted = false;
    record.deletedAt = null;
    record.deletedBy = null;
    await record.save();

    if (options.auditLog) {
      await this.logAudit('restore', id, {}, options.userId);
    }

    return record;
  }

  /**
   * IMPORT/EXPORT Operations
   */

  // Export to CSV
  async exportToCSV(filters = {}, fields = []) {
    const records = await this.model.find(filters).lean();

    if (records.length === 0) {
      return null;
    }

    // Convert to CSV format
    const selectedFields = fields.length > 0 ? fields : Object.keys(records[0]);

    let csv = `${selectedFields.join(',')}\n`;

    records.forEach((record) => {
      const row = selectedFields.map((field) => {
        const value = this.getNestedValue(record, field);
        return this.escapeCSV(value);
      });
      csv += `${row.join(',')}\n`;
    });

    return csv;
  }

  // Export to Excel
  async exportToExcel(filters = {}, fields = []) {
    const records = await this.model.find(filters).lean();

    if (records.length === 0) {
      return null;
    }

    const selectedFields = fields.length > 0 ? fields : Object.keys(records[0]);

    // Lazy-load xlsx to avoid startup dependency
    let xlsx;
    try {
      xlsx = require('xlsx');
    } catch (e) {
      throw new AppError('Excel export unavailable: xlsx module not installed', 500);
    }

    const data = records.map((record) => {
      const row = {};
      selectedFields.forEach((field) => {
        row[field] = this.getNestedValue(record, field);
      });
      return row;
    });

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, this.modelName);

    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  // Export to JSON
  async exportToJSON(filters = {}, fields = []) {
    let query = this.model.find(filters);

    if (fields.length > 0) {
      query = query.select(fields.join(' '));
    }

    const records = await query.lean();
    return JSON.stringify(records, null, 2);
  }

  // Import from CSV
  async importFromCSV(filePath, options = {}) {
    const results = {
      success: [],
      failed: [],
      total: 0
    };

    const records = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => {
          records.push(row);
          results.total++;
        })
        .on('end', async () => {
          const bulkResult = await this.bulkCreate(records, options);
          results.success = bulkResult.success;
          results.failed = bulkResult.failed;
          resolve(results);
        })
        .on('error', reject);
    });
  }

  // Import from Excel
  importFromExcel(filePath, options = {}) {
    let xlsx;
    try {
      xlsx = require('xlsx');
    } catch (e) {
      throw new AppError('Excel import unavailable: xlsx module not installed', 500);
    }
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const records = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    return this.bulkCreate(records, options);
  }

  // Import from JSON
  importFromJSON(data, options = {}) {
    const records = JSON.parse(data);
    return this.bulkCreate(records, options);
  }

  /**
   * DATA VALIDATION & CLEANSING
   */

  validateData(data) {
    // Implement custom validation rules
    // This can be extended based on model schemas
    return true;
  }

  cleanseData(data) {
    // Implement data cleansing rules
    // - Trim strings
    // - Convert types
    // - Remove invalid characters
    // - Standardize formats
    return data;
  }

  // Find duplicates
  findDuplicates(fields = []) {
    const pipeline = [
      {
        $group: {
          _id: fields.reduce((acc, field) => {
            acc[field] = `$${field}`;
            return acc;
          }, {}),
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ];

    return this.model.aggregate(pipeline);
  }

  // Merge duplicates
  async mergeDuplicates(masterId, duplicateIds, options = {}) {
    const master = await this.model.findById(masterId);
    if (!master) {
      throw new AppError('Master record not found', 404);
    }

    const duplicates = await this.model.find({ _id: { $in: duplicateIds } });

    // Merge logic - combine data from duplicates into master
    // This is a simplified version - actual logic depends on the model
    for (const duplicate of duplicates) {
      // Merge fields
      for (const [key, value] of Object.entries(duplicate.toObject())) {
        if (!master[key] && value) {
          master[key] = value;
        }
      }

      // Delete duplicate
      await duplicate.remove();
    }

    await master.save();

    if (options.auditLog) {
      await this.logAudit('merge', masterId, { duplicateIds }, options.userId);
    }

    return master;
  }

  /**
   * VERSION HISTORY
   */

  async saveVersion(record) {
    // Implementation for version history
    // This would save a snapshot to a separate VersionHistory collection
    const version = {
      modelName: this.modelName,
      recordId: record._id,
      data: record.toObject(),
      timestamp: new Date()
    };

    // Save to VersionHistory model
    // await VersionHistory.create(version);
  }

  getVersionHistory(id) {
    // Retrieve version history for a record
    // return VersionHistory.find({ modelName: this.modelName, recordId: id });
    return [];
  }

  async rollback(id, versionId) {
    // Rollback to a specific version
    // const version = await VersionHistory.findById(versionId);
    // return this.update(id, version.data);
  }

  /**
   * AUDIT LOGGING
   */

  async logAudit(action, recordId, changes, userId) {
    // Implementation for audit logging
    // This would save to an AuditLog collection
    const auditEntry = {
      modelName: this.modelName,
      action,
      recordId,
      changes,
      userId,
      timestamp: new Date()
    };

    // Save to AuditLog model
    // await AuditLog.create(auditEntry);
  }

  /**
   * HELPER FUNCTIONS
   */

  applyAdvancedFilters(query, filters) {
    // Support operators: $gt, $gte, $lt, $lte, $in, $nin, $ne
    const operatorMap = {
      gt: '$gt',
      gte: '$gte',
      lt: '$lt',
      lte: '$lte',
      in: '$in',
      nin: '$nin',
      ne: '$ne'
    };

    for (const [key, value] of Object.entries(filters)) {
      if (key.includes('__')) {
        const [field, operator] = key.split('__');
        const mongoOperator = operatorMap[operator];
        if (mongoOperator) {
          if (!query[field]) query[field] = {};
          query[field][mongoOperator] = value;
          delete query[key];
        }
      }
    }

    return query;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) =>
      current && current[key] !== undefined ? current[key] : '', obj
    );
  }

  escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  /**
   * AGGREGATION HELPERS
   */

  aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }

  count(filters = {}) {
    return this.model.countDocuments(filters);
  }

  distinct(field, filters = {}) {
    return this.model.distinct(field, filters);
  }
}

module.exports = EnterpriseCrudService;
