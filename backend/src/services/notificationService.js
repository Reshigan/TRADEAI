/**
 * Real-time Notification Service
 * Phase 3 - Advanced Features
 *
 * Features:
 * - Real-time notifications via WebSocket/SSE
 * - Budget alert notifications
 * - Accrual reminder notifications
 * - Approval workflow notifications
 * - Email notifications
 * - In-app notifications
 * - Notification preferences
 */

const EventEmitter = require('events');
const logger = require('../../utils/logger');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // userId -> response objects for SSE
    this.notifications = new Map(); // userId -> notification array
  }

  /**
   * Register SSE client for real-time updates
   */
  registerClient(userId, res) {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });

    // Store client connection
    this.clients.set(userId.toString(), res);

    logger.info('SSE client registered', { userId });

    // Send initial connection message
    this.sendNotification(userId, {
      type: 'connection',
      message: 'Connected to notification service',
      timestamp: new Date()
    });

    // Keep-alive ping every 30 seconds
    const keepAlive = setInterval(() => {
      if (this.clients.has(userId.toString())) {
        res.write(': ping\n\n');
      } else {
        clearInterval(keepAlive);
      }
    }, 30000);

    // Clean up on client disconnect
    res.on('close', () => {
      this.clients.delete(userId.toString());
      clearInterval(keepAlive);
      logger.info('SSE client disconnected', { userId });
    });
  }

  /**
   * Send notification to user
   */
  sendNotification(userId, notification) {
    const userIdStr = userId.toString();

    // Add to notification history
    if (!this.notifications.has(userIdStr)) {
      this.notifications.set(userIdStr, []);
    }
    const userNotifications = this.notifications.get(userIdStr);
    userNotifications.push({
      ...notification,
      id: Date.now(),
      read: false,
      createdAt: new Date()
    });

    // Keep only last 100 notifications per user
    if (userNotifications.length > 100) {
      userNotifications.shift();
    }

    // Send via SSE if client connected
    const client = this.clients.get(userIdStr);
    if (client) {
      try {
        const data = JSON.stringify(notification);
        client.write(`data: ${data}\n\n`);
        logger.debug('Notification sent via SSE', { userId, type: notification.type });
      } catch (error) {
        logger.error('Error sending SSE notification', { userId, error: error.message });
        this.clients.delete(userIdStr);
      }
    }

    // Emit event for other handlers
    this.emit('notification', userId, notification);

    return notification;
  }

  /**
   * Send budget alert notification
   */
  async sendBudgetAlert(userId, budgetData) {
    const { budgetName, utilizationPercent, remainingAmount, severity } = budgetData;

    let message, icon;

    if (severity === 'critical') {
      message = `Budget "${budgetName}" has exceeded limit!`;
      icon = '🚨';
    } else if (severity === 'warning') {
      message = `Budget "${budgetName}" is at ${utilizationPercent.toFixed(1)}% utilization. Only ZAR ${remainingAmount.toLocaleString()} remaining.`;
      icon = '⚠️';
    } else {
      message = `Budget "${budgetName}" update: ${utilizationPercent.toFixed(1)}% utilized`;
      icon = 'ℹ️';
    }

    const notification = {
      type: 'budget_alert',
      severity,
      title: `${icon} Budget Alert`,
      message,
      data: budgetData,
      actionUrl: `/budgets/${budgetData.budgetId}`,
      actionText: 'View Budget'
    };

    this.sendNotification(userId, notification);

    logger.info('Budget alert sent', { userId, budgetName, severity });

    return notification;
  }

  /**
   * Send accrual reminder notification
   */
  async sendAccrualReminder(userId, accrualData) {
    const { period, accrualCount, totalAmount, dueDate } = accrualData;

    const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));

    let message, severity;

    if (daysUntilDue <= 1) {
      message = `⏰ URGENT: ${accrualCount} accruals (ZAR ${totalAmount.toLocaleString()}) due tomorrow!`;
      severity = 'critical';
    } else if (daysUntilDue <= 3) {
      message = `⚠️ ${accrualCount} accruals (ZAR ${totalAmount.toLocaleString()}) due in ${daysUntilDue} days`;
      severity = 'warning';
    } else {
      message = `ℹ️ ${accrualCount} accruals (ZAR ${totalAmount.toLocaleString()}) due in ${daysUntilDue} days`;
      severity = 'info';
    }

    const notification = {
      type: 'accrual_reminder',
      severity,
      title: 'Accrual Reminder',
      message,
      data: accrualData,
      actionUrl: '/accruals',
      actionText: 'Review Accruals'
    };

    this.sendNotification(userId, notification);

    logger.info('Accrual reminder sent', { userId, accrualCount, daysUntilDue });

    return notification;
  }

  /**
   * Send promotion performance notification
   */
  async sendPromotionAlert(userId, promotionData) {
    const { promotionName, roi, effectivenessScore, status } = promotionData;

    let message, severity, icon;

    if (effectivenessScore >= 80) {
      message = `🎉 Promotion "${promotionName}" performing excellently! ROI: ${roi.toFixed(1)}%, Score: ${effectivenessScore}`;
      severity = 'success';
      icon = '🎉';
    } else if (roi < 0) {
      message = `🚨 Promotion "${promotionName}" has negative ROI (${roi.toFixed(1)}%). Consider discontinuing.`;
      severity = 'critical';
      icon = '🚨';
    } else if (roi < 50) {
      message = `⚠️ Promotion "${promotionName}" underperforming. ROI: ${roi.toFixed(1)}%`;
      severity = 'warning';
      icon = '⚠️';
    } else {
      message = `ℹ️ Promotion "${promotionName}" update: ROI ${roi.toFixed(1)}%`;
      severity = 'info';
      icon = 'ℹ️';
    }

    const notification = {
      type: 'promotion_alert',
      severity,
      title: `${icon} Promotion Performance`,
      message,
      data: promotionData,
      actionUrl: `/promotions/${promotionData.promotionId}/roi`,
      actionText: 'View Details'
    };

    this.sendNotification(userId, notification);

    logger.info('Promotion alert sent', { userId, promotionName, roi, effectivenessScore });

    return notification;
  }

  /**
   * Send customer churn alert
   */
  async sendChurnAlert(userId, customerData) {
    const { customerName, churnProbability, daysSinceLastPurchase, ltv } = customerData;

    let message, severity;

    if (churnProbability >= 90) {
      message = `🚨 HIGH RISK: Customer "${customerName}" likely to churn (${churnProbability}% probability). LTV: ZAR ${ltv.toLocaleString()}`;
      severity = 'critical';
    } else if (churnProbability >= 60) {
      message = `⚠️ Customer "${customerName}" at risk of churn (${churnProbability}% probability). ${daysSinceLastPurchase} days since last purchase.`;
      severity = 'warning';
    } else {
      message = `ℹ️ Customer "${customerName}" engagement opportunity (${churnProbability}% churn risk)`;
      severity = 'info';
    }

    const notification = {
      type: 'churn_alert',
      severity,
      title: 'Customer Retention Alert',
      message,
      data: customerData,
      actionUrl: `/customers/${customerData.customerId}`,
      actionText: 'View Customer'
    };

    this.sendNotification(userId, notification);

    logger.info('Churn alert sent', { userId, customerName, churnProbability });

    return notification;
  }

  /**
   * Send workflow approval request
   */
  async sendApprovalRequest(userId, approvalData) {
    const { type, itemName, amount, requester } = approvalData;

    const notification = {
      type: 'approval_request',
      severity: 'info',
      title: '📋 Approval Required',
      message: `${requester} requests approval for ${type}: "${itemName}" (ZAR ${amount.toLocaleString()})`,
      data: approvalData,
      actionUrl: `/approvals/${approvalData.approvalId}`,
      actionText: 'Review & Approve'
    };

    this.sendNotification(userId, notification);

    logger.info('Approval request sent', { userId, type, itemName });

    return notification;
  }

  /**
   * Send system notification
   */
  async sendSystemNotification(userId, message, severity = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      critical: '🚨'
    };

    const notification = {
      type: 'system',
      severity,
      title: `${icons[severity]} System Notification`,
      message,
      timestamp: new Date()
    };

    this.sendNotification(userId, notification);

    return notification;
  }

  /**
   * Get user's notification history
   */
  getNotifications(userId, options = {}) {
    const { unreadOnly = false, limit = 50 } = options;

    const userIdStr = userId.toString();
    const userNotifications = this.notifications.get(userIdStr) || [];

    let notifications = [...userNotifications];

    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    // Sort by newest first
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    // Limit results
    if (limit > 0) {
      notifications = notifications.slice(0, limit);
    }

    return notifications;
  }

  /**
   * Mark notification as read
   */
  markAsRead(userId, notificationId) {
    const userIdStr = userId.toString();
    const userNotifications = this.notifications.get(userIdStr) || [];

    const notification = userNotifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      logger.debug('Notification marked as read', { userId, notificationId });
    }

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId) {
    const userIdStr = userId.toString();
    const userNotifications = this.notifications.get(userIdStr) || [];

    userNotifications.forEach((n) => n.read = true);

    logger.info('All notifications marked as read', { userId, count: userNotifications.length });

    return { marked: userNotifications.length };
  }

  /**
   * Clear notification history
   */
  clearNotifications(userId) {
    const userIdStr = userId.toString();
    this.notifications.delete(userIdStr);

    logger.info('Notifications cleared', { userId });

    return { cleared: true };
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcast(notification) {
    let sentCount = 0;

    for (const [userId, client] of this.clients) {
      try {
        const data = JSON.stringify(notification);
        client.write(`data: ${data}\n\n`);
        sentCount++;
      } catch (error) {
        logger.error('Error broadcasting notification', { userId, error: error.message });
        this.clients.delete(userId);
      }
    }

    logger.info('Notification broadcast', { sentCount, type: notification.type });

    return { sentCount };
  }

  /**
   * Get notification statistics
   */
  getStatistics() {
    const stats = {
      connectedClients: this.clients.size,
      totalUsers: this.notifications.size,
      totalNotifications: 0,
      unreadNotifications: 0,
      byType: {},
      bySeverity: {}
    };

    for (const [userId, notifications] of this.notifications) {
      stats.totalNotifications += notifications.length;
      stats.unreadNotifications += notifications.filter((n) => !n.read).length;

      notifications.forEach((n) => {
        // By type
        if (!stats.byType[n.type]) stats.byType[n.type] = 0;
        stats.byType[n.type]++;

        // By severity
        if (n.severity) {
          if (!stats.bySeverity[n.severity]) stats.bySeverity[n.severity] = 0;
          stats.bySeverity[n.severity]++;
        }
      });
    }

    return stats;
  }
}

// Export singleton instance
module.exports = new NotificationService();
