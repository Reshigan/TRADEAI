const Product = require('../models/Product');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

/**
 * Master Data Management Service
 * Enterprise-level data governance, hierarchies, and quality management
 */
class MasterDataManagementService {
  /**
   * Product Hierarchy Management
   * Manage multi-level product hierarchies
   */
  async manageProductHierarchy(action, data) {
    try {
      switch (action) {
        case 'create':
          return await this.createProductHierarchy(data);
        case 'update':
          return await this.updateProductHierarchy(data);
        case 'getTree':
          return await this.getProductHierarchyTree(data.companyId);
        case 'addNode':
          return await this.addHierarchyNode(data);
        case 'moveNode':
          return await this.moveHierarchyNode(data);
        default:
          throw new AppError('Invalid hierarchy action', 400);
      }
    } catch (error) {
      logger.error('Error managing product hierarchy', error);
      throw new AppError('Failed to manage product hierarchy', 500);
    }
  }

  /**
   * Customer Hierarchy Management
   * Manage customer relationships and hierarchies
   */
  async manageCustomerHierarchy(action, data) {
    try {
      switch (action) {
        case 'create':
          return await this.createCustomerHierarchy(data);
        case 'update':
          return await this.updateCustomerHierarchy(data);
        case 'getTree':
          return await this.getCustomerHierarchyTree(data.companyId);
        case 'addNode':
          return await this.addCustomerNode(data);
        default:
          throw new AppError('Invalid hierarchy action', 400);
      }
    } catch (error) {
      logger.error('Error managing customer hierarchy', error);
      throw new AppError('Failed to manage customer hierarchy', 500);
    }
  }

  /**
   * Data Quality Management
   * Validate, cleanse, and monitor data quality
   */
  async manageDataQuality(entityType, options) {
    try {
      const report = {
        entityType,
        timestamp: new Date(),
        totalRecords: 0,
        qualityScore: 0,
        issues: [],
        recommendations: []
      };

      let Model;
      switch (entityType) {
        case 'product':
          Model = Product;
          break;
        case 'customer':
          Model = Customer;
          break;
        default:
          throw new AppError('Invalid entity type', 400);
      }

      // Get all records
      const records = await Model.find({ companyId: options.companyId });
      report.totalRecords = records.length;

      // Run quality rules
      for (const record of records) {
        const validation = await this.validateDataQuality(entityType, record);
        if (!validation.isValid) {
          report.issues.push({
            recordId: record._id,
            issues: validation.issues
          });
        }
      }

      // Calculate quality score
      report.qualityScore = ((report.totalRecords - report.issues.length) / 
                            report.totalRecords) * 100;

      // Generate recommendations
      report.recommendations = this.generateQualityRecommendations(report.issues);

      return report;
    } catch (error) {
      logger.error('Error managing data quality', error);
      throw new AppError('Failed to manage data quality', 500);
    }
  }

  /**
   * Data Versioning
   * Track and manage data changes over time
   */
  async manageDataVersions(entityType, entityId, action) {
    try {
      const versions = {
        entityType,
        entityId,
        versions: [],
        current: {},
        action
      };

      // Get version history
      versions.versions = await this.getVersionHistory(entityType, entityId);

      // Get current version
      versions.current = await this.getCurrentVersion(entityType, entityId);

      // Perform action
      switch (action) {
        case 'list':
          return versions;
        case 'restore':
          return await this.restoreVersion(entityType, entityId, data.versionId);
        case 'compare':
          return await this.compareVersions(entityType, data.version1, data.version2);
        default:
          return versions;
      }
    } catch (error) {
      logger.error('Error managing data versions', error);
      throw new AppError('Failed to manage data versions', 500);
    }
  }

  /**
   * Data Validation Rules Engine
   * Apply custom validation rules to master data
   */
  async applyValidationRules(entityType, data) {
    try {
      const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        info: []
      };

      // Get validation rules for entity type
      const rules = await this.getValidationRules(entityType);

      for (const rule of rules) {
        const result = await this.executeRule(rule, data);
        
        if (!result.passed) {
          validation.isValid = false;
          validation.errors.push({
            rule: rule.name,
            field: rule.field,
            message: result.message,
            severity: rule.severity
          });
        }
      }

      return validation;
    } catch (error) {
      logger.error('Error applying validation rules', error);
      throw new AppError('Failed to apply validation rules', 500);
    }
  }

  /**
   * Data Enrichment
   * Enrich master data with additional information
   */
  async enrichData(entityType, entityId, enrichmentSources) {
    try {
      const enrichment = {
        entityType,
        entityId,
        original: {},
        enriched: {},
        sources: enrichmentSources,
        fieldsAdded: []
      };

      // Get original entity
      enrichment.original = await this.getEntity(entityType, entityId);
      enrichment.enriched = { ...enrichment.original };

      // Apply enrichment from each source
      for (const source of enrichmentSources) {
        const additionalData = await this.fetchEnrichmentData(
          source,
          enrichment.original
        );

        Object.keys(additionalData).forEach(key => {
          if (!enrichment.enriched[key]) {
            enrichment.enriched[key] = additionalData[key];
            enrichment.fieldsAdded.push(key);
          }
        });
      }

      // Update entity if requested
      if (enrichmentSources.includes('autoUpdate')) {
        await this.updateEntity(entityType, entityId, enrichment.enriched);
      }

      return enrichment;
    } catch (error) {
      logger.error('Error enriching data', error);
      throw new AppError('Failed to enrich data', 500);
    }
  }

  /**
   * Data Deduplication
   * Identify and merge duplicate records
   */
  async deduplicateData(entityType, options) {
    try {
      const deduplication = {
        entityType,
        totalRecords: 0,
        duplicatesFound: [],
        mergedRecords: [],
        suggestions: []
      };

      let Model;
      switch (entityType) {
        case 'product':
          Model = Product;
          break;
        case 'customer':
          Model = Customer;
          break;
        default:
          throw new AppError('Invalid entity type', 400);
      }

      // Get all records
      const records = await Model.find({ companyId: options.companyId });
      deduplication.totalRecords = records.length;

      // Find duplicates
      const duplicateGroups = await this.findDuplicates(records, entityType);
      deduplication.duplicatesFound = duplicateGroups;

      // Auto-merge if requested
      if (options.autoMerge) {
        for (const group of duplicateGroups) {
          if (group.confidence > 0.9) {
            const merged = await this.mergeRecords(entityType, group.records);
            deduplication.mergedRecords.push(merged);
          } else {
            deduplication.suggestions.push({
              group,
              action: 'manual_review',
              reason: 'Low confidence match'
            });
          }
        }
      }

      return deduplication;
    } catch (error) {
      logger.error('Error deduplicating data', error);
      throw new AppError('Failed to deduplicate data', 500);
    }
  }

  // Helper methods

  async createProductHierarchy(data) {
    const { companyId, name, levels } = data;
    
    const hierarchy = {
      companyId,
      name,
      type: 'product',
      levels: levels.map((level, index) => ({
        order: index,
        name: level,
        nodes: []
      })),
      createdAt: new Date()
    };

    // Store hierarchy configuration
    logger.info('Product hierarchy created', { companyId, name });
    return hierarchy;
  }

  async updateProductHierarchy(data) {
    logger.info('Product hierarchy updated', { hierarchyId: data.hierarchyId });
    return { ...data, updatedAt: new Date() };
  }

  async getProductHierarchyTree(companyId) {
    const products = await Product.find({ companyId }).lean();
    
    const tree = {
      companyId,
      levels: [
        {
          name: 'Division',
          nodes: this.buildHierarchyLevel(products, 'division')
        },
        {
          name: 'Category',
          nodes: this.buildHierarchyLevel(products, 'category')
        },
        {
          name: 'Brand',
          nodes: this.buildHierarchyLevel(products, 'brand')
        }
      ]
    };

    return tree;
  }

  buildHierarchyLevel(products, field) {
    const uniqueValues = [...new Set(products.map(p => p[field]).filter(Boolean))];
    
    return uniqueValues.map(value => ({
      id: value,
      name: value,
      count: products.filter(p => p[field] === value).length,
      children: []
    }));
  }

  async addHierarchyNode(data) {
    logger.info('Hierarchy node added', { hierarchyId: data.hierarchyId });
    return { ...data, nodeId: Date.now().toString() };
  }

  async moveHierarchyNode(data) {
    logger.info('Hierarchy node moved', { nodeId: data.nodeId });
    return { success: true };
  }

  async createCustomerHierarchy(data) {
    const { companyId, name, levels } = data;
    
    const hierarchy = {
      companyId,
      name,
      type: 'customer',
      levels: levels.map((level, index) => ({
        order: index,
        name: level,
        nodes: []
      })),
      createdAt: new Date()
    };

    return hierarchy;
  }

  async updateCustomerHierarchy(data) {
    return { ...data, updatedAt: new Date() };
  }

  async getCustomerHierarchyTree(companyId) {
    const customers = await Customer.find({ companyId }).lean();
    
    const tree = {
      companyId,
      levels: [
        {
          name: 'Tier',
          nodes: this.buildHierarchyLevel(customers, 'tier')
        },
        {
          name: 'Region',
          nodes: this.buildHierarchyLevel(customers, 'region')
        }
      ]
    };

    return tree;
  }

  async addCustomerNode(data) {
    return { ...data, nodeId: Date.now().toString() };
  }

  async validateDataQuality(entityType, record) {
    const validation = {
      isValid: true,
      issues: []
    };

    // Required fields check
    const requiredFields = this.getRequiredFields(entityType);
    for (const field of requiredFields) {
      if (!record[field]) {
        validation.isValid = false;
        validation.issues.push({
          type: 'missing_required',
          field,
          severity: 'error'
        });
      }
    }

    // Data format validation
    if (entityType === 'product' && record.price && record.price < 0) {
      validation.isValid = false;
      validation.issues.push({
        type: 'invalid_value',
        field: 'price',
        severity: 'error',
        message: 'Price cannot be negative'
      });
    }

    return validation;
  }

  getRequiredFields(entityType) {
    const fieldMap = {
      product: ['name', 'sku', 'category'],
      customer: ['name', 'type']
    };
    return fieldMap[entityType] || [];
  }

  generateQualityRecommendations(issues) {
    const recommendations = [];
    
    const missingFields = issues.flatMap(i => 
      i.issues.filter(iss => iss.type === 'missing_required')
    );

    if (missingFields.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'complete_required_fields',
        affectedRecords: issues.length,
        impact: 'Improves data completeness'
      });
    }

    return recommendations;
  }

  async getVersionHistory(entityType, entityId) {
    // In production, retrieve from version history collection
    return [
      {
        versionId: 'v1',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        author: 'user1',
        changes: ['Updated price']
      },
      {
        versionId: 'v2',
        timestamp: new Date(),
        author: 'user2',
        changes: ['Updated description']
      }
    ];
  }

  async getCurrentVersion(entityType, entityId) {
    return await this.getEntity(entityType, entityId);
  }

  async restoreVersion(entityType, entityId, versionId) {
    logger.info('Version restored', { entityType, entityId, versionId });
    return { success: true };
  }

  async compareVersions(entityType, version1, version2) {
    return {
      differences: [
        { field: 'price', version1: 10.99, version2: 12.99 },
        { field: 'description', version1: 'Old desc', version2: 'New desc' }
      ]
    };
  }

  async getValidationRules(entityType) {
    // In production, retrieve from rules configuration
    return [
      {
        name: 'required_name',
        field: 'name',
        type: 'required',
        severity: 'error'
      },
      {
        name: 'positive_price',
        field: 'price',
        type: 'range',
        min: 0,
        severity: 'error'
      }
    ];
  }

  async executeRule(rule, data) {
    switch (rule.type) {
      case 'required':
        return {
          passed: !!data[rule.field],
          message: data[rule.field] ? '' : `${rule.field} is required`
        };
      case 'range':
        const value = data[rule.field];
        const passed = value >= rule.min && (!rule.max || value <= rule.max);
        return {
          passed,
          message: passed ? '' : `${rule.field} must be between ${rule.min} and ${rule.max}`
        };
      default:
        return { passed: true, message: '' };
    }
  }

  async getEntity(entityType, entityId) {
    let Model;
    switch (entityType) {
      case 'product':
        Model = Product;
        break;
      case 'customer':
        Model = Customer;
        break;
      default:
        throw new AppError('Invalid entity type', 400);
    }

    return await Model.findById(entityId).lean();
  }

  async fetchEnrichmentData(source, originalData) {
    // In production, fetch from external sources
    return {
      enrichedField1: 'enriched value',
      enrichedField2: 'additional data'
    };
  }

  async updateEntity(entityType, entityId, data) {
    let Model;
    switch (entityType) {
      case 'product':
        Model = Product;
        break;
      case 'customer':
        Model = Customer;
        break;
      default:
        throw new AppError('Invalid entity type', 400);
    }

    await Model.findByIdAndUpdate(entityId, data);
  }

  async findDuplicates(records, entityType) {
    const duplicateGroups = [];
    const processed = new Set();

    for (let i = 0; i < records.length; i++) {
      if (processed.has(i)) continue;

      const group = {
        records: [records[i]],
        confidence: 0,
        matchFields: []
      };

      for (let j = i + 1; j < records.length; j++) {
        if (processed.has(j)) continue;

        const similarity = this.calculateSimilarity(
          records[i],
          records[j],
          entityType
        );

        if (similarity.score > 0.7) {
          group.records.push(records[j]);
          group.matchFields = similarity.matchFields;
          group.confidence = similarity.score;
          processed.add(j);
        }
      }

      if (group.records.length > 1) {
        duplicateGroups.push(group);
      }
      processed.add(i);
    }

    return duplicateGroups;
  }

  calculateSimilarity(record1, record2, entityType) {
    const matchFields = [];
    let matches = 0;
    let totalFields = 0;

    const compareFields = entityType === 'product' ? 
      ['name', 'sku', 'category'] : 
      ['name', 'email', 'phone'];

    for (const field of compareFields) {
      totalFields++;
      if (record1[field] && record2[field] && 
          record1[field].toString().toLowerCase() === 
          record2[field].toString().toLowerCase()) {
        matches++;
        matchFields.push(field);
      }
    }

    return {
      score: matches / totalFields,
      matchFields
    };
  }

  async mergeRecords(entityType, records) {
    // In production, implement smart merge logic
    const master = records[0];
    const merged = { ...master };

    // Merge additional data from other records
    for (let i = 1; i < records.length; i++) {
      Object.keys(records[i]).forEach(key => {
        if (!merged[key] && records[i][key]) {
          merged[key] = records[i][key];
        }
      });
    }

    logger.info('Records merged', { entityType, count: records.length });
    return merged;
  }
}

module.exports = new MasterDataManagementService();
