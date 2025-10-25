const AuditLog = require('../models/AuditLog');

/**
 * AUDIT TRAIL SERVICE
 * Complete transaction history tracking with versioning and compliance
 */
class AuditTrailService {
  /**
   * Log any entity action
   */
  async logAction(actionData, req = null) {
    try {
      const logData = {
        entityType: actionData.entityType,
        entityId: actionData.entityId,
        entityNumber: actionData.entityNumber,
        action: actionData.action,
        actionDescription: actionData.actionDescription || `${actionData.action} ${actionData.entityType}`,
        userId: actionData.userId,
        userName: actionData.userName,
        userEmail: actionData.userEmail,
        userRole: actionData.userRole,
        changes: actionData.changes || [],
        beforeSnapshot: actionData.beforeSnapshot,
        afterSnapshot: actionData.afterSnapshot,
        customerId: actionData.customerId,
        transactionAmount: actionData.transactionAmount,
        transactionCurrency: actionData.transactionCurrency,
        category: actionData.category || 'transaction',
        severity: actionData.severity || 'info',
        complianceRelevant: actionData.complianceRelevant !== false,
        complianceFlags: actionData.complianceFlags || ['SOX'],
        status: actionData.status || 'success',
        errorMessage: actionData.errorMessage,
        tags: actionData.tags || [],
        notes: actionData.notes
      };

      // Add request context if available
      if (req) {
        logData.context = {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          sessionId: req.sessionID,
          apiEndpoint: req.path,
          httpMethod: req.method,
          requestId: req.id || req.headers['x-request-id']
        };
      }

      const log = await AuditLog.logAction(logData);
      return log;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break main operations
      return null;
    }
  }

  /**
   * Log entity creation
   */
  async logCreate(entityType, entity, userId, userInfo = {}, req = null) {
    return this.logAction({
      entityType,
      entityId: entity._id,
      entityNumber: entity[this._getEntityNumberField(entityType)],
      action: 'create',
      userId,
      userName: userInfo.name,
      userEmail: userInfo.email,
      userRole: userInfo.role,
      afterSnapshot: entity.toObject ? entity.toObject() : entity,
      customerId: entity.customerId,
      transactionAmount: entity.amount || entity.total,
      transactionCurrency: entity.currency,
      category: 'transaction',
      severity: 'info'
    }, req);
  }

  /**
   * Log entity update with field-level changes
   */
  async logUpdate(entityType, oldEntity, newEntity, userId, userInfo = {}, req = null) {
    const changes = this._detectChanges(oldEntity, newEntity);

    return this.logAction({
      entityType,
      entityId: newEntity._id,
      entityNumber: newEntity[this._getEntityNumberField(entityType)],
      action: 'update',
      userId,
      userName: userInfo.name,
      userEmail: userInfo.email,
      userRole: userInfo.role,
      changes,
      beforeSnapshot: oldEntity.toObject ? oldEntity.toObject() : oldEntity,
      afterSnapshot: newEntity.toObject ? newEntity.toObject() : newEntity,
      customerId: newEntity.customerId,
      transactionAmount: newEntity.amount || newEntity.total,
      transactionCurrency: newEntity.currency,
      category: 'transaction',
      severity: changes.length > 10 ? 'warning' : 'info'
    }, req);
  }

  /**
   * Log entity deletion
   */
  async logDelete(entityType, entity, userId, userInfo = {}, req = null) {
    return this.logAction({
      entityType,
      entityId: entity._id,
      entityNumber: entity[this._getEntityNumberField(entityType)],
      action: 'delete',
      userId,
      userName: userInfo.name,
      userEmail: userInfo.email,
      userRole: userInfo.role,
      beforeSnapshot: entity.toObject ? entity.toObject() : entity,
      customerId: entity.customerId,
      transactionAmount: entity.amount || entity.total,
      transactionCurrency: entity.currency,
      category: 'transaction',
      severity: 'warning'
    }, req);
  }

  /**
   * Log approval action
   */
  async logApproval(entityType, entity, userId, userInfo = {}, approved = true, req = null) {
    return this.logAction({
      entityType,
      entityId: entity._id,
      entityNumber: entity[this._getEntityNumberField(entityType)],
      action: approved ? 'approve' : 'reject',
      userId,
      userName: userInfo.name,
      userEmail: userInfo.email,
      userRole: userInfo.role,
      afterSnapshot: entity.toObject ? entity.toObject() : entity,
      customerId: entity.customerId,
      transactionAmount: entity.amount || entity.total,
      transactionCurrency: entity.currency,
      category: 'transaction',
      severity: 'info',
      complianceFlags: ['SOX', 'Internal_Controls']
    }, req);
  }

  /**
   * Log GL posting
   */
  async logGLPosting(entityType, entity, glDocument, userId, userInfo = {}, req = null) {
    return this.logAction({
      entityType,
      entityId: entity._id,
      entityNumber: entity[this._getEntityNumberField(entityType)],
      action: 'post_to_gl',
      actionDescription: `Posted to GL: ${glDocument}`,
      userId,
      userName: userInfo.name,
      userEmail: userInfo.email,
      userRole: userInfo.role,
      afterSnapshot: entity.toObject ? entity.toObject() : entity,
      customerId: entity.customerId,
      transactionAmount: entity.amount || entity.total,
      transactionCurrency: entity.currency,
      category: 'transaction',
      severity: 'info',
      complianceFlags: ['SOX', 'GL_Posting'],
      tags: ['gl_posting', glDocument]
    }, req);
  }

  /**
   * Log matching action
   */
  async logMatching(entityType, entity, matchedToType, matchedToId, confidence, userId, userInfo = {}, req = null) {
    return this.logAction({
      entityType,
      entityId: entity._id,
      entityNumber: entity[this._getEntityNumberField(entityType)],
      action: 'match',
      actionDescription: `Matched to ${matchedToType} with ${confidence}% confidence`,
      userId,
      userName: userInfo.name,
      userEmail: userInfo.email,
      userRole: userInfo.role,
      afterSnapshot: entity.toObject ? entity.toObject() : entity,
      customerId: entity.customerId,
      transactionAmount: entity.amount || entity.total,
      transactionCurrency: entity.currency,
      category: 'transaction',
      severity: 'info',
      tags: ['matching', matchedToType]
    }, req);
  }

  /**
   * Get entity history
   */
  async getEntityHistory(entityType, entityId, options = {}) {
    return await AuditLog.getEntityHistory(entityType, entityId, options);
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId, options = {}) {
    return await AuditLog.getUserActivity(userId, options);
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(startDate, endDate, flags = ['SOX']) {
    return await AuditLog.getComplianceReport(startDate, endDate, flags);
  }

  /**
   * Search audit logs
   */
  async searchLogs(criteria) {
    return await AuditLog.searchLogs(criteria);
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(options = {}) {
    const query = {};

    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) query.createdAt.$gte = options.startDate;
      if (options.endDate) query.createdAt.$lte = options.endDate;
    }

    if (options.userId) {
      query.userId = options.userId;
    }

    if (options.entityType) {
      query.entityType = options.entityType;
    }

    const logs = await AuditLog.find(query);

    const stats = {
      total: logs.length,
      byAction: {},
      byEntityType: {},
      byCategory: {},
      bySeverity: {},
      byUser: {},
      byStatus: {},
      successRate: 0,
      complianceRelevant: 0,
      recentActivity: []
    };

    let successCount = 0;

    for (const log of logs) {
      // By action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      // By entity type
      stats.byEntityType[log.entityType] = (stats.byEntityType[log.entityType] || 0) + 1;

      // By category
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;

      // By severity
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;

      // By status
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;

      // Success rate
      if (log.status === 'success') {
        successCount++;
      }

      // Compliance relevant
      if (log.complianceRelevant) {
        stats.complianceRelevant++;
      }

      // By user
      if (log.userId) {
        const userId = log.userId.toString();
        if (!stats.byUser[userId]) {
          stats.byUser[userId] = {
            userName: log.userName,
            count: 0,
            actions: []
          };
        }
        stats.byUser[userId].count++;
        if (!stats.byUser[userId].actions.includes(log.action)) {
          stats.byUser[userId].actions.push(log.action);
        }
      }
    }

    if (stats.total > 0) {
      stats.successRate = Math.round((successCount / stats.total) * 100);
    }

    // Get recent activity
    const recentLogs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email');

    stats.recentActivity = recentLogs.map(log => ({
      date: log.createdAt,
      action: log.action,
      entityType: log.entityType,
      entityNumber: log.entityNumber,
      user: log.userName || log.userId?.name,
      status: log.status
    }));

    return stats;
  }

  /**
   * Verify audit trail integrity
   */
  async verifyIntegrity(entityType, entityId) {
    const logs = await AuditLog.find({ entityType, entityId })
      .sort({ createdAt: 1 });

    const results = {
      total: logs.length,
      verified: 0,
      failed: 0,
      chainValid: true,
      issues: []
    };

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      // Verify checksum
      if (!log.verifyIntegrity()) {
        results.failed++;
        results.issues.push({
          logId: log._id,
          issue: 'Checksum verification failed',
          date: log.createdAt
        });
      } else {
        results.verified++;
      }

      // Verify chain
      if (i > 0) {
        const expectedPreviousId = logs[i - 1]._id.toString();
        const actualPreviousId = log.previousLogId?.toString();

        if (expectedPreviousId !== actualPreviousId) {
          results.chainValid = false;
          results.issues.push({
            logId: log._id,
            issue: 'Chain of custody broken',
            date: log.createdAt
          });
        }
      }
    }

    return results;
  }

  /**
   * Detect changes between two objects
   */
  _detectChanges(oldObj, newObj) {
    const changes = [];
    const oldData = oldObj.toObject ? oldObj.toObject() : oldObj;
    const newData = newObj.toObject ? newObj.toObject() : newObj;

    // Skip internal MongoDB fields
    const skipFields = ['_id', '__v', 'createdAt', 'updatedAt', 'updatedBy'];

    for (const key of Object.keys(newData)) {
      if (skipFields.includes(key)) continue;

      const oldValue = oldData[key];
      const newValue = newData[key];

      // Skip if values are equal
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue;

      changes.push({
        field: key,
        oldValue: oldValue,
        newValue: newValue,
        dataType: this._getDataType(newValue)
      });
    }

    return changes;
  }

  /**
   * Get data type
   */
  _getDataType(value) {
    if (value === null || value === undefined) return 'string';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (typeof value === 'object') return 'object';
    return typeof value;
  }

  /**
   * Get entity number field name
   */
  _getEntityNumberField(entityType) {
    const fieldMap = {
      'Invoice': 'invoiceNumber',
      'Payment': 'paymentNumber',
      'PurchaseOrder': 'poNumber',
      'Deduction': 'deductionNumber',
      'TradeSpend': 'name',
      'Promotion': 'name',
      'Customer': 'name',
      'Product': 'name',
      'Accrual': 'accrualNumber',
      'Settlement': 'settlementNumber',
      'Dispute': 'disputeNumber',
      'Budget': 'name',
      'User': 'email'
    };

    return fieldMap[entityType] || 'name';
  }
}

module.exports = new AuditTrailService();
