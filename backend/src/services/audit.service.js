const AuditLog = require('../models/AuditLog');

class AuditService {
  /**
   * Log an audit event
   * @param {Object} params - Audit log parameters
   * @param {string} params.userId - User ID
   * @param {string} params.action - Action performed
   * @param {string} params.resource - Resource type
   * @param {string} params.resourceId - Resource ID
   * @param {Object} params.changes - Changes made
   * @param {Object} params.metadata - Additional metadata
   * @param {string} params.ipAddress - User's IP address
   * @param {string} params.userAgent - User's user agent
   */
  async log({
    userId,
    action,
    resource,
    resourceId,
    changes = {},
    metadata = {},
    ipAddress,
    userAgent
  }) {
    try {
      const auditLog = new AuditLog({
        userId,
        action,
        resource,
        resourceId,
        changes,
        metadata,
        ipAddress,
        userAgent,
        timestamp: new Date()
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't throw - audit logging should not break the main flow
      return null;
    }
  }

  /**
   * Get audit logs with filters
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} Audit logs
   */
  async getLogs(filters = {}) {
    const query = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.resource) query.resource = filters.resource;
    if (filters.resourceId) query.resourceId = filters.resourceId;
    
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    return await AuditLog.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ timestamp: -1 })
      .limit(filters.limit || 100);
  }

  /**
   * Get audit logs for a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User's audit logs
   */
  async getUserActivity(userId, options = {}) {
    return await this.getLogs({ userId, ...options });
  }

  /**
   * Get audit logs for a specific resource
   * @param {string} resource - Resource type
   * @param {string} resourceId - Resource ID
   * @returns {Promise<Array>} Resource's audit logs
   */
  async getResourceHistory(resource, resourceId) {
    return await this.getLogs({ resource, resourceId });
  }

  /**
   * Generate compliance report
   * @param {Object} params - Report parameters
   * @returns {Promise<Object>} Compliance report data
   */
  async generateComplianceReport({ startDate, endDate, userId, action }) {
    const logs = await this.getLogs({ startDate, endDate, userId, action });
    
    const report = {
      period: { startDate, endDate },
      totalActions: logs.length,
      actionsByType: {},
      actionsByResource: {},
      actionsByUser: {},
      logs: logs.map(log => ({
        timestamp: log.timestamp,
        user: log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'Unknown',
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        ipAddress: log.ipAddress
      }))
    };

    // Group by action type
    logs.forEach(log => {
      report.actionsByType[log.action] = (report.actionsByType[log.action] || 0) + 1;
      report.actionsByResource[log.resource] = (report.actionsByResource[log.resource] || 0) + 1;
      
      if (log.userId) {
        const userName = `${log.userId.firstName} ${log.userId.lastName}`;
        report.actionsByUser[userName] = (report.actionsByUser[userName] || 0) + 1;
      }
    });

    return report;
  }

  /**
   * Clean up old audit logs
   * @param {number} daysToKeep - Number of days to keep logs
   * @returns {Promise<number>} Number of logs deleted
   */
  async cleanup(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    return result.deletedCount;
  }
}

module.exports = new AuditService();
