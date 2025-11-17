const mongoose = require('mongoose');

/**
 * Hierarchy Manager for Tree Structures
 * Implements materialized path pattern for efficient hierarchical queries
 */

class HierarchyManager {
  constructor(model) {
    this.model = model;
  }

  /**
   * Generate materialized path for a node
   */
  generatePath(parentPath, nodeId) {
    if (!parentPath) {
      return `/${nodeId}/`;
    }
    return `${parentPath}${nodeId}/`;
  }

  /**
   * Parse path to get ancestor IDs
   */
  parsePathToAncestors(path) {
    if (!path) return [];
    return path.split('/').filter((id) => id && id.length > 0);
  }

  /**
   * Calculate level from path
   */
  calculateLevel(path) {
    if (!path) return 0;
    return this.parsePathToAncestors(path).length;
  }

  /**
   * Create a new node in the hierarchy
   */
  async createNode(tenantId, nodeData, parentId = null) {
    try {
      let parentPath = '';
      let level = 0;

      if (parentId) {
        const parent = await this.model.findOne({
          _id: parentId,
          tenantId
        });

        if (!parent) {
          throw new Error('Parent node not found');
        }

        parentPath = parent.path || '';
        level = parent.level + 1;
      }

      const node = new this.model({
        ...nodeData,
        tenantId,
        parentId,
        level,
        path: '', // Will be set after save to include the node's own ID
        hasChildren: false
      });

      await node.save();

      // Update path with the node's ID
      node.path = this.generatePath(parentPath, node._id);
      await node.save();

      // Update parent's hasChildren flag
      if (parentId) {
        await this.model.updateOne(
          { _id: parentId, tenantId },
          { hasChildren: true }
        );
      }

      return node;

    } catch (error) {
      throw new Error(`Failed to create hierarchy node: ${error.message}`);
    }
  }

  /**
   * Move a node to a new parent
   */
  async moveNode(tenantId, nodeId, newParentId = null) {
    try {
      const node = await this.model.findOne({ _id: nodeId, tenantId });
      if (!node) {
        throw new Error('Node not found');
      }

      const oldPath = node.path;
      const oldParentId = node.parentId;

      let newParentPath = '';
      let newLevel = 0;

      if (newParentId) {
        // Check if new parent exists and is not a descendant
        const newParent = await this.model.findOne({
          _id: newParentId,
          tenantId
        });

        if (!newParent) {
          throw new Error('New parent not found');
        }

        // Prevent moving to descendant
        if (newParent.path && newParent.path.includes(`/${nodeId}/`)) {
          throw new Error('Cannot move node to its own descendant');
        }

        newParentPath = newParent.path || '';
        newLevel = newParent.level + 1;
      }

      // Calculate new path
      const newPath = this.generatePath(newParentPath, nodeId);

      // Update the node
      await this.model.updateOne(
        { _id: nodeId, tenantId },
        {
          parentId: newParentId,
          path: newPath,
          level: newLevel
        }
      );

      // Update all descendants
      await this.updateDescendantPaths(tenantId, oldPath, newPath, newLevel);

      // Update old parent's hasChildren flag
      if (oldParentId) {
        await this.updateHasChildrenFlag(tenantId, oldParentId);
      }

      // Update new parent's hasChildren flag
      if (newParentId) {
        await this.model.updateOne(
          { _id: newParentId, tenantId },
          { hasChildren: true }
        );
      }

      return this.model.findOne({ _id: nodeId, tenantId });

    } catch (error) {
      throw new Error(`Failed to move node: ${error.message}`);
    }
  }

  /**
   * Update descendant paths after moving a node
   */
  async updateDescendantPaths(tenantId, oldPath, newPath, newLevel) {
    const descendants = await this.model.find({
      tenantId,
      path: { $regex: `^${this.escapeRegex(oldPath)}` }
    });

    for (const descendant of descendants) {
      if (descendant.path === oldPath) continue; // Skip the moved node itself

      const relativePath = descendant.path.substring(oldPath.length);
      const updatedPath = newPath + relativePath;
      const updatedLevel = newLevel + this.calculateLevel(relativePath);

      await this.model.updateOne(
        { _id: descendant._id, tenantId },
        {
          path: updatedPath,
          level: updatedLevel
        }
      );
    }
  }

  /**
   * Delete a node and handle children
   */
  async deleteNode(tenantId, nodeId, deleteStrategy = 'move_to_parent') {
    try {
      const node = await this.model.findOne({ _id: nodeId, tenantId });
      if (!node) {
        throw new Error('Node not found');
      }

      const children = await this.getDirectChildren(tenantId, nodeId);

      if (deleteStrategy === 'cascade') {
        // Delete all descendants
        await this.model.deleteMany({
          tenantId,
          path: { $regex: `^${this.escapeRegex(node.path)}` }
        });
      } else if (deleteStrategy === 'move_to_parent') {
        // Move children to the deleted node's parent
        for (const child of children) {
          await this.moveNode(tenantId, child._id, node.parentId);
        }
      } else if (deleteStrategy === 'prevent_if_children' && children.length > 0) {
        throw new Error('Cannot delete node with children');
      }

      // Delete the node
      await this.model.deleteOne({ _id: nodeId, tenantId });

      // Update parent's hasChildren flag
      if (node.parentId) {
        await this.updateHasChildrenFlag(tenantId, node.parentId);
      }

      return true;

    } catch (error) {
      throw new Error(`Failed to delete node: ${error.message}`);
    }
  }

  /**
   * Get all ancestors of a node
   */
  async getAncestors(tenantId, nodeId) {
    const node = await this.model.findOne({ _id: nodeId, tenantId });
    if (!node || !node.path) return [];

    const ancestorIds = this.parsePathToAncestors(node.path).slice(0, -1); // Exclude self

    if (ancestorIds.length === 0) return [];

    return this.model.find({
      _id: { $in: ancestorIds.map((id) => new mongoose.Types.ObjectId(id)) },
      tenantId
    }).sort({ level: 1 });
  }

  /**
   * Get all descendants of a node
   */
  async getDescendants(tenantId, nodeId, maxDepth = null) {
    const node = await this.model.findOne({ _id: nodeId, tenantId });
    if (!node) return [];

    const query = {
      tenantId,
      path: { $regex: `^${this.escapeRegex(node.path)}` },
      _id: { $ne: nodeId } // Exclude self
    };

    if (maxDepth !== null) {
      query.level = { $lte: node.level + maxDepth };
    }

    return this.model.find(query).sort({ level: 1, path: 1 });
  }

  /**
   * Get direct children of a node
   */
  getDirectChildren(tenantId, nodeId) {
    return this.model.find({
      tenantId,
      parentId: nodeId
    }).sort({ name: 1 });
  }

  /**
   * Get siblings of a node
   */
  async getSiblings(tenantId, nodeId, includeSelf = false) {
    const node = await this.model.findOne({ _id: nodeId, tenantId });
    if (!node) return [];

    const query = {
      tenantId,
      parentId: node.parentId
    };

    if (!includeSelf) {
      query._id = { $ne: nodeId };
    }

    return this.model.find(query).sort({ name: 1 });
  }

  /**
   * Get tree structure starting from a node
   */
  async getTree(tenantId, rootId = null, maxDepth = null) {
    const rootQuery = { tenantId };

    if (rootId) {
      rootQuery._id = rootId;
    } else {
      rootQuery.parentId = null; // Get root nodes
    }

    const roots = await this.model.find(rootQuery).sort({ name: 1 });

    const buildTree = async (nodes) => {
      const result = [];

      for (const node of nodes) {
        const nodeObj = node.toObject();

        if (maxDepth === null || node.level < maxDepth) {
          const children = await this.getDirectChildren(tenantId, node._id);
          if (children.length > 0) {
            nodeObj.children = await buildTree(children);
          }
        }

        result.push(nodeObj);
      }

      return result;
    };

    return buildTree(roots);
  }

  /**
   * Get path from root to node
   */
  async getPathToRoot(tenantId, nodeId) {
    const ancestors = await this.getAncestors(tenantId, nodeId);
    const node = await this.model.findOne({ _id: nodeId, tenantId });

    if (!node) return [];

    return [...ancestors, node];
  }

  /**
   * Search within hierarchy
   */
  async searchInHierarchy(tenantId, searchTerm, rootId = null) {
    const query = {
      tenantId,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    if (rootId) {
      const rootNode = await this.model.findOne({ _id: rootId, tenantId });
      if (rootNode) {
        query.path = { $regex: `^${this.escapeRegex(rootNode.path)}` };
      }
    }

    return this.model.find(query).sort({ level: 1, name: 1 });
  }

  /**
   * Update hasChildren flag for a parent node
   */
  async updateHasChildrenFlag(tenantId, parentId) {
    const childCount = await this.model.countDocuments({
      tenantId,
      parentId
    });

    await this.model.updateOne(
      { _id: parentId, tenantId },
      { hasChildren: childCount > 0 }
    );
  }

  /**
   * Validate hierarchy integrity
   */
  async validateHierarchy(tenantId) {
    const issues = [];

    // Check for orphaned nodes (parent doesn't exist)
    const orphanedNodes = await this.model.aggregate([
      { $match: { tenantId, parentId: { $ne: null } } },
      {
        $lookup: {
          from: this.model.collection.name,
          localField: 'parentId',
          foreignField: '_id',
          as: 'parent'
        }
      },
      { $match: { parent: { $size: 0 } } }
    ]);

    if (orphanedNodes.length > 0) {
      issues.push({
        type: 'orphaned_nodes',
        count: orphanedNodes.length,
        nodes: orphanedNodes.map((n) => n._id)
      });
    }

    // Check for incorrect paths
    const nodes = await this.model.find({ tenantId });
    for (const node of nodes) {
      const expectedPath = await this.calculateExpectedPath(tenantId, node._id);
      if (node.path !== expectedPath) {
        issues.push({
          type: 'incorrect_path',
          nodeId: node._id,
          currentPath: node.path,
          expectedPath
        });
      }
    }

    return issues;
  }

  /**
   * Calculate expected path for a node
   */
  async calculateExpectedPath(tenantId, nodeId) {
    const node = await this.model.findOne({ _id: nodeId, tenantId });
    if (!node) return null;

    if (!node.parentId) {
      return `/${nodeId}/`;
    }

    const parent = await this.model.findOne({ _id: node.parentId, tenantId });
    if (!parent) return null;

    return this.generatePath(parent.path, nodeId);
  }

  /**
   * Repair hierarchy issues
   */
  async repairHierarchy(tenantId) {
    const issues = await this.validateHierarchy(tenantId);
    const repairs = [];

    for (const issue of issues) {
      if (issue.type === 'incorrect_path') {
        await this.model.updateOne(
          { _id: issue.nodeId, tenantId },
          { path: issue.expectedPath }
        );
        repairs.push(`Fixed path for node ${issue.nodeId}`);
      }
    }

    // Recalculate levels and hasChildren flags
    const nodes = await this.model.find({ tenantId }).sort({ level: 1 });
    for (const node of nodes) {
      const correctLevel = this.calculateLevel(node.path);
      if (node.level !== correctLevel) {
        await this.model.updateOne(
          { _id: node._id, tenantId },
          { level: correctLevel }
        );
        repairs.push(`Fixed level for node ${node._id}`);
      }

      await this.updateHasChildrenFlag(tenantId, node._id);
    }

    return repairs;
  }

  /**
   * Escape regex special characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get hierarchy statistics
   */
  async getHierarchyStats(tenantId) {
    const stats = await this.model.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: null,
          totalNodes: { $sum: 1 },
          maxLevel: { $max: '$level' },
          avgLevel: { $avg: '$level' },
          rootNodes: {
            $sum: { $cond: [{ $eq: ['$parentId', null] }, 1, 0] }
          },
          leafNodes: {
            $sum: { $cond: [{ $eq: ['$hasChildren', false] }, 1, 0] }
          }
        }
      }
    ]);

    return stats[0] || {
      totalNodes: 0,
      maxLevel: 0,
      avgLevel: 0,
      rootNodes: 0,
      leafNodes: 0
    };
  }
}

module.exports = HierarchyManager;
