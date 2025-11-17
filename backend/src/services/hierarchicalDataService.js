const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const logger = require('../utils/logger');

/**
 * Hierarchical Data Management Service
 * Handles tree structures, materialized paths, and hierarchical operations
 */
class HierarchicalDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Build customer hierarchy tree
   */
  async buildCustomerHierarchy(tenantId, options = {}) {
    try {
      const cacheKey = `customer_hierarchy_${tenantId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached && !options.forceRefresh) return cached;

      // Get all customers for tenant
      const customers = await Customer.find({
        tenantId,
        isActive: true,
        isDeleted: false
      }).sort({ 'hierarchy.level1.name': 1, 'hierarchy.level2.name': 1 });

      // Build hierarchical structure
      const hierarchy = this.buildHierarchyTree(customers, 'customer');

      // Calculate statistics
      const stats = this.calculateHierarchyStats(hierarchy);

      const result = {
        hierarchy,
        stats,
        totalCustomers: customers.length,
        generatedAt: new Date()
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('Customer hierarchy build error:', error);
      throw error;
    }
  }

  /**
   * Build product hierarchy tree
   */
  async buildProductHierarchy(tenantId, options = {}) {
    try {
      const cacheKey = `product_hierarchy_${tenantId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached && !options.forceRefresh) return cached;

      // Get all products for tenant
      const products = await Product.find({
        tenantId,
        isActive: true,
        isDeleted: false
      }).sort({ 'hierarchy.level1.name': 1, 'hierarchy.level2.name': 1 });

      // Build hierarchical structure
      const hierarchy = this.buildHierarchyTree(products, 'product');

      // Calculate statistics
      const stats = this.calculateHierarchyStats(hierarchy);

      const result = {
        hierarchy,
        stats,
        totalProducts: products.length,
        generatedAt: new Date()
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('Product hierarchy build error:', error);
      throw error;
    }
  }

  /**
   * Create materialized path for hierarchical data
   */
  generateMaterializedPath(hierarchyData) {
    const pathParts = [];

    for (let i = 1; i <= 5; i++) {
      const level = hierarchyData[`level${i}`];
      if (level && level.id) {
        pathParts.push(level.id);
      } else {
        break;
      }
    }

    return {
      path: pathParts.join('/'),
      depth: pathParts.length,
      ancestors: pathParts.slice(0, -1),
      parent: pathParts.length > 1 ? pathParts[pathParts.length - 2] : null
    };
  }

  /**
   * Find all descendants of a node
   */
  async findDescendants(tenantId, nodeId, entityType = 'customer') {
    try {
      const Model = entityType === 'customer' ? Customer : Product;

      // Find the parent node first
      const parentNode = await Model.findOne({
        _id: nodeId,
        tenantId
      });

      if (!parentNode) {
        throw new Error(`${entityType} not found`);
      }

      // Build query to find descendants based on materialized path
      const pathQuery = this.buildDescendantQuery(parentNode);

      const descendants = await Model.find({
        tenantId,
        ...pathQuery,
        isActive: true,
        isDeleted: false
      }).sort({ 'materializedPath.depth': 1 });

      return {
        parent: parentNode,
        descendants,
        count: descendants.length,
        levels: this.groupByLevel(descendants)
      };

    } catch (error) {
      logger.error('Find descendants error:', error);
      throw error;
    }
  }

  /**
   * Find all ancestors of a node
   */
  async findAncestors(tenantId, nodeId, entityType = 'customer') {
    try {
      const Model = entityType === 'customer' ? Customer : Product;

      // Find the child node first
      const childNode = await Model.findOne({
        _id: nodeId,
        tenantId
      });

      if (!childNode) {
        throw new Error(`${entityType} not found`);
      }

      // Get ancestor IDs from materialized path
      const ancestorIds = childNode.materializedPath?.ancestors || [];

      if (ancestorIds.length === 0) {
        return {
          child: childNode,
          ancestors: [],
          count: 0,
          path: []
        };
      }

      const ancestors = await Model.find({
        _id: { $in: ancestorIds.map((id) => new mongoose.Types.ObjectId(id)) },
        tenantId,
        isActive: true,
        isDeleted: false
      }).sort({ 'materializedPath.depth': 1 });

      return {
        child: childNode,
        ancestors,
        count: ancestors.length,
        path: this.buildAncestorPath(ancestors, childNode)
      };

    } catch (error) {
      logger.error('Find ancestors error:', error);
      throw error;
    }
  }

  /**
   * Move node to new parent (reorganize hierarchy)
   */
  async moveNode(tenantId, nodeId, newParentId, entityType = 'customer') {
    try {
      const Model = entityType === 'customer' ? Customer : Product;

      // Find the node to move
      const node = await Model.findOne({ _id: nodeId, tenantId });
      if (!node) {
        throw new Error(`${entityType} not found`);
      }

      // Find new parent (if provided)
      let newParent = null;
      if (newParentId) {
        newParent = await Model.findOne({ _id: newParentId, tenantId });
        if (!newParent) {
          throw new Error('New parent not found');
        }
      }

      // Get all descendants before moving
      const descendants = await this.findDescendants(tenantId, nodeId, entityType);

      // Update the node's hierarchy
      const oldPath = node.materializedPath?.path || '';
      const newPath = this.calculateNewPath(node, newParent);

      // Update the node
      await Model.updateOne(
        { _id: nodeId, tenantId },
        {
          $set: {
            materializedPath: newPath,
            updatedAt: new Date()
          }
        }
      );

      // Update all descendants
      if (descendants.descendants.length > 0) {
        await this.updateDescendantPaths(
          tenantId,
          descendants.descendants,
          oldPath,
          newPath.path,
          entityType
        );
      }

      // Clear cache
      this.clearHierarchyCache(tenantId);

      return {
        success: true,
        movedNode: nodeId,
        newParent: newParentId,
        affectedDescendants: descendants.descendants.length,
        newPath: newPath.path
      };

    } catch (error) {
      logger.error('Move node error:', error);
      throw error;
    }
  }

  /**
   * Bulk import hierarchical data
   */
  async bulkImportHierarchy(tenantId, data, entityType = 'customer', options = {}) {
    try {
      const { validateOnly = false, updateExisting = false } = options;
      const Model = entityType === 'customer' ? Customer : Product;

      // Validate data structure
      const validationResults = this.validateHierarchicalData(data, entityType);

      if (validationResults.errors.length > 0 && !options.ignoreErrors) {
        return {
          success: false,
          errors: validationResults.errors,
          validRecords: validationResults.valid.length,
          invalidRecords: validationResults.errors.length
        };
      }

      if (validateOnly) {
        return {
          success: true,
          message: 'Validation completed',
          validRecords: validationResults.valid.length,
          invalidRecords: validationResults.errors.length,
          errors: validationResults.errors
        };
      }

      // Process valid records
      const results = {
        created: [],
        updated: [],
        errors: [],
        skipped: []
      };

      for (const record of validationResults.valid) {
        try {
          // Generate materialized path
          const materializedPath = this.generateMaterializedPath(record.hierarchy);

          // Check if record exists
          const existingRecord = await Model.findOne({
            tenantId,
            $or: [
              { code: record.code },
              { sapCustomerId: record.sapCustomerId },
              { sapProductId: record.sapProductId }
            ]
          });

          if (existingRecord && !updateExisting) {
            results.skipped.push({
              record: record.code || record.name,
              reason: 'Record already exists'
            });
            continue;
          }

          const recordData = {
            ...record,
            tenantId,
            materializedPath,
            isActive: true,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          if (existingRecord && updateExisting) {
            await Model.updateOne(
              { _id: existingRecord._id },
              { $set: recordData }
            );
            results.updated.push(existingRecord._id);
          } else {
            const newRecord = await Model.create(recordData);
            results.created.push(newRecord._id);
          }

        } catch (error) {
          results.errors.push({
            record: record.code || record.name,
            error: error.message
          });
        }
      }

      // Clear cache after bulk import
      this.clearHierarchyCache(tenantId);

      return {
        success: true,
        results,
        summary: {
          total: data.length,
          created: results.created.length,
          updated: results.updated.length,
          errors: results.errors.length,
          skipped: results.skipped.length
        }
      };

    } catch (error) {
      logger.error('Bulk import hierarchy error:', error);
      throw error;
    }
  }

  /**
   * Export hierarchical data
   */
  async exportHierarchy(tenantId, entityType = 'customer', options = {}) {
    try {
      const { format = 'json', includeInactive = false } = options;
      const Model = entityType === 'customer' ? Customer : Product;

      const query = {
        tenantId,
        isDeleted: false
      };

      if (!includeInactive) {
        query.isActive = true;
      }

      const records = await Model.find(query)
        .sort({ 'materializedPath.path': 1 })
        .lean();

      // Transform data based on format
      let exportData;
      switch (format) {
        case 'csv':
          exportData = this.transformToCSV(records, entityType);
          break;
        case 'excel':
          exportData = this.transformToExcel(records, entityType);
          break;
        case 'tree':
          exportData = this.transformToTree(records, entityType);
          break;
        default:
          exportData = records;
      }

      return {
        data: exportData,
        format,
        recordCount: records.length,
        exportedAt: new Date(),
        entityType
      };

    } catch (error) {
      logger.error('Export hierarchy error:', error);
      throw error;
    }
  }

  // Helper methods

  buildHierarchyTree(items, _entityType) {
    const tree = {};

    items.forEach((item) => {
      let currentLevel = tree;

      // Navigate through hierarchy levels
      for (let i = 1; i <= 5; i++) {
        const level = item.hierarchy[`level${i}`];
        if (!level || !level.id) break;

        if (!currentLevel[level.id]) {
          currentLevel[level.id] = {
            id: level.id,
            name: level.name,
            code: level.code,
            level: i,
            children: {},
            items: []
          };
        }

        if (i === item.materializedPath?.depth) {
          currentLevel[level.id].items.push(item);
        }

        currentLevel = currentLevel[level.id].children;
      }
    });

    return tree;
  }

  calculateHierarchyStats(hierarchy) {
    const stats = {
      totalNodes: 0,
      levelCounts: {},
      maxDepth: 0,
      avgDepth: 0
    };

    const traverse = (node, depth = 0) => {
      stats.totalNodes++;
      stats.levelCounts[depth] = (stats.levelCounts[depth] || 0) + 1;
      stats.maxDepth = Math.max(stats.maxDepth, depth);

      Object.values(node.children || {}).forEach((child) => {
        traverse(child, depth + 1);
      });
    };

    Object.values(hierarchy).forEach((rootNode) => {
      traverse(rootNode, 1);
    });

    stats.avgDepth = stats.totalNodes > 0 ?
      Object.entries(stats.levelCounts)
        .reduce((sum, [level, count]) => sum + (parseInt(level) * count), 0) / stats.totalNodes : 0;

    return stats;
  }

  buildDescendantQuery(parentNode) {
    const parentPath = parentNode.materializedPath?.path || '';
    return {
      'materializedPath.path': new RegExp(`^${parentPath}/`)
    };
  }

  groupByLevel(items) {
    const levels = {};
    items.forEach((item) => {
      const depth = item.materializedPath?.depth || 0;
      if (!levels[depth]) levels[depth] = [];
      levels[depth].push(item);
    });
    return levels;
  }

  buildAncestorPath(ancestors, child) {
    return [...ancestors, child].map((node) => ({
      id: node._id,
      name: node.name,
      code: node.code,
      level: node.materializedPath?.depth || 0
    }));
  }

  calculateNewPath(node, newParent) {
    if (!newParent) {
      // Moving to root level
      return {
        path: node._id.toString(),
        depth: 1,
        ancestors: [],
        parent: null
      };
    }

    const parentPath = newParent.materializedPath?.path || newParent._id.toString();
    const parentAncestors = newParent.materializedPath?.ancestors || [];

    return {
      path: `${parentPath}/${node._id}`,
      depth: (newParent.materializedPath?.depth || 1) + 1,
      ancestors: [...parentAncestors, newParent._id.toString()],
      parent: newParent._id.toString()
    };
  }

  async updateDescendantPaths(tenantId, descendants, oldPath, newPath, entityType) {
    const Model = entityType === 'customer' ? Customer : Product;

    const bulkOps = descendants.map((descendant) => {
      const currentPath = descendant.materializedPath?.path || '';
      const updatedPath = currentPath.replace(oldPath, newPath);

      return {
        updateOne: {
          filter: { _id: descendant._id, tenantId },
          update: {
            $set: {
              'materializedPath.path': updatedPath,
              'materializedPath.depth': updatedPath.split('/').length,
              updatedAt: new Date()
            }
          }
        }
      };
    });

    if (bulkOps.length > 0) {
      await Model.bulkWrite(bulkOps);
    }
  }

  validateHierarchicalData(data, entityType) {
    const valid = [];
    const errors = [];

    data.forEach((record, index) => {
      const validation = this.validateSingleRecord(record, entityType, index);
      if (validation.isValid) {
        valid.push(record);
      } else {
        errors.push(validation.error);
      }
    });

    return { valid, errors };
  }

  validateSingleRecord(record, entityType, index) {
    const errors = [];

    // Required fields validation
    if (!record.name) errors.push('Name is required');
    if (!record.code) errors.push('Code is required');

    // Entity-specific validation
    if (entityType === 'customer' && !record.sapCustomerId) {
      errors.push('SAP Customer ID is required');
    }
    if (entityType === 'product' && !record.sapProductId) {
      errors.push('SAP Product ID is required');
    }

    // Hierarchy validation
    if (record.hierarchy) {
      if (record.hierarchy.level1 && !record.hierarchy.level1.name) {
        errors.push('Level 1 name is required when level 1 is specified');
      }
    }

    return {
      isValid: errors.length === 0,
      error: errors.length > 0 ? {
        index,
        record: record.name || record.code,
        errors
      } : null
    };
  }

  transformToCSV(records, entityType) {
    // Implementation for CSV transformation
    return records.map((record) => ({
      id: record._id,
      name: record.name,
      code: record.code,
      level1: record.hierarchy?.level1?.name || '',
      level2: record.hierarchy?.level2?.name || '',
      level3: record.hierarchy?.level3?.name || '',
      path: record.materializedPath?.path || '',
      depth: record.materializedPath?.depth || 0
    }));
  }

  transformToExcel(records, entityType) {
    // Implementation for Excel transformation
    return this.transformToCSV(records, entityType);
  }

  transformToTree(records, entityType) {
    return this.buildHierarchyTree(records, entityType);
  }

  // Cache management
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearHierarchyCache(tenantId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(tenantId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new HierarchicalDataService();
