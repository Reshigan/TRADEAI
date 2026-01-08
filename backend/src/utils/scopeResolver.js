const mongoose = require('mongoose');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

/**
 * Scope Resolver Utility
 * Resolves hierarchy selectors to leaf entity IDs for proportional allocation
 * Supports both Product and Customer hierarchies
 */

class ScopeResolver {
  /**
   * Resolve a scope selector to leaf entity IDs
   * @param {string} companyId - Company ID for tenant isolation
   * @param {string} entityType - 'product' or 'customer'
   * @param {Object} selector - Scope selector object
   * @param {string} selector.type - 'leaf' (specific IDs), 'hierarchy' (level-based), 'all'
   * @param {Array} selector.ids - For type='leaf', array of entity IDs
   * @param {number} selector.level - For type='hierarchy', hierarchy level (1-5)
   * @param {string} selector.value - For type='hierarchy', value at that level
   * @returns {Promise<Array>} Array of leaf entity IDs
   */
  async resolveToLeaves(companyId, entityType, selector) {
    if (!selector || !selector.type) {
      throw new Error('Invalid selector: type is required');
    }

    const Model = entityType === 'product' ? Product : Customer;

    switch (selector.type) {
      case 'leaf':
        return this.resolveLeafSelector(companyId, Model, selector.ids);

      case 'hierarchy':
        return this.resolveHierarchySelector(companyId, Model, selector.level, selector.value);

      case 'all':
        return this.resolveAllLeaves(companyId, Model);

      default:
        throw new Error(`Unknown selector type: ${selector.type}`);
    }
  }

  /**
   * Resolve specific leaf IDs (validate they exist and belong to company)
   */
  async resolveLeafSelector(companyId, Model, ids) {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

    const entities = await Model.find({
      _id: { $in: objectIds },
      company: companyId,
      status: 'active'
    }).select('_id');

    return entities.map((e) => e._id);
  }

  /**
   * Resolve hierarchy selector to leaf IDs
   * Uses the 5-level hierarchy structure (hierarchy.level1, hierarchy.level2, etc.)
   */
  async resolveHierarchySelector(companyId, Model, level, value) {
    if (!level || !value) {
      throw new Error('Hierarchy selector requires level and value');
    }

    const levelField = `hierarchy.level${level}.id`;

    const entities = await Model.find({
      company: companyId,
      [levelField]: value,
      status: 'active',
      hasChildren: false
    }).select('_id');

    if (entities.length === 0) {
      const entitiesWithChildren = await Model.find({
        company: companyId,
        [levelField]: value,
        status: 'active'
      }).select('_id');

      return entitiesWithChildren.map((e) => e._id);
    }

    return entities.map((e) => e._id);
  }

  /**
   * Resolve all active leaf entities for a company
   */
  async resolveAllLeaves(companyId, Model) {
    const entities = await Model.find({
      company: companyId,
      status: 'active'
    }).select('_id');

    return entities.map((e) => e._id);
  }

  /**
   * Build MongoDB $match query from scope selector
   * Useful for aggregation pipelines
   */
  buildMatchQuery(companyId, entityType, selector) {
    const fieldName = entityType === 'product' ? 'product' : 'customer';
    const baseQuery = { company: companyId };

    if (!selector || selector.type === 'all') {
      return baseQuery;
    }

    if (selector.type === 'leaf' && selector.ids && selector.ids.length > 0) {
      return {
        ...baseQuery,
        [fieldName]: { $in: selector.ids.map((id) => new mongoose.Types.ObjectId(id)) }
      };
    }

    if (selector.type === 'hierarchy' && selector.level && selector.value) {
      const hierarchyField = entityType === 'product'
        ? `productHierarchy.level${selector.level}.id`
        : `customerHierarchy.level${selector.level}.id`;

      return {
        ...baseQuery,
        [hierarchyField]: selector.value
      };
    }

    return baseQuery;
  }

  /**
   * Get hierarchy tree for UI selection
   * Returns tree structure for product or customer hierarchy
   */
  async getHierarchyTree(companyId, entityType, rootLevel = 1, maxDepth = 5) {
    const Model = entityType === 'product' ? Product : Customer;

    const pipeline = [
      { $match: { company: new mongoose.Types.ObjectId(companyId), status: 'active' } }
    ];

    const groupFields = {};
    for (let level = rootLevel; level <= maxDepth; level++) {
      groupFields[`level${level}`] = `$hierarchy.level${level}`;
    }

    pipeline.push({
      $group: {
        _id: groupFields,
        count: { $sum: 1 }
      }
    });

    pipeline.push({ $sort: { '_id.level1.name': 1, '_id.level2.name': 1, '_id.level3.name': 1 } });

    const results = await Model.aggregate(pipeline);

    return this.buildTreeFromAggregation(results, rootLevel, maxDepth);
  }

  /**
   * Build tree structure from aggregation results
   */
  buildTreeFromAggregation(results, rootLevel, maxDepth) {
    const tree = {};

    for (const result of results) {
      let currentNode = tree;

      for (let level = rootLevel; level <= maxDepth; level++) {
        const levelData = result._id[`level${level}`];
        if (!levelData || !levelData.id) break;

        const nodeKey = levelData.id;
        if (!currentNode[nodeKey]) {
          currentNode[nodeKey] = {
            id: levelData.id,
            name: levelData.name || levelData.id,
            code: levelData.code,
            level,
            children: {},
            count: 0
          };
        }

        currentNode[nodeKey].count += result.count;
        currentNode = currentNode[nodeKey].children;
      }
    }

    return this.convertTreeToArray(tree);
  }

  /**
   * Convert tree object to array format for UI
   */
  convertTreeToArray(tree) {
    return Object.values(tree).map((node) => ({
      id: node.id,
      name: node.name,
      code: node.code,
      level: node.level,
      count: node.count,
      children: this.convertTreeToArray(node.children)
    }));
  }

  /**
   * Validate scope selector structure
   */
  validateSelector(selector) {
    if (!selector) {
      return { valid: false, error: 'Selector is required' };
    }

    if (!selector.type) {
      return { valid: false, error: 'Selector type is required' };
    }

    if (!['leaf', 'hierarchy', 'all'].includes(selector.type)) {
      return { valid: false, error: `Invalid selector type: ${selector.type}` };
    }

    if (selector.type === 'leaf') {
      if (!selector.ids || !Array.isArray(selector.ids)) {
        return { valid: false, error: 'Leaf selector requires ids array' };
      }
    }

    if (selector.type === 'hierarchy') {
      if (!selector.level || !selector.value) {
        return { valid: false, error: 'Hierarchy selector requires level and value' };
      }
      if (selector.level < 1 || selector.level > 5) {
        return { valid: false, error: 'Hierarchy level must be between 1 and 5' };
      }
    }

    return { valid: true };
  }
}

module.exports = new ScopeResolver();
