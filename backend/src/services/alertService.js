const cron = require('node-cron');
const { monitoringEvents } = require('../controllers/monitoringController');
const { sendEmail } = require('./emailService');
const websocketService = require('./websocketService');

class AlertService {
  constructor() {
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.scheduledJobs = new Map();
  }

  initialize() {
    this.setupDefaultAlertRules();
    this.startPeriodicChecks();
    console.log('Alert service initialized');
  }

  setupDefaultAlertRules() {
    // Budget threshold alerts
    this.addAlertRule({
      id: 'budget_threshold_80',
      name: 'Budget Threshold 80%',
      type: 'budget_threshold',
      condition: {
        metric: 'budget_utilization',
        operator: 'greater_than',
        threshold: 80
      },
      priority: 'warning',
      enabled: true,
      cooldown: 3600000, // 1 hour
      actions: ['email', 'websocket']
    });

    this.addAlertRule({
      id: 'budget_threshold_90',
      name: 'Budget Threshold 90%',
      type: 'budget_threshold',
      condition: {
        metric: 'budget_utilization',
        operator: 'greater_than',
        threshold: 90
      },
      priority: 'critical',
      enabled: true,
      cooldown: 1800000, // 30 minutes
      actions: ['email', 'websocket', 'sms']
    });

    // Performance alerts
    this.addAlertRule({
      id: 'high_response_time',
      name: 'High Response Time',
      type: 'performance',
      condition: {
        metric: 'response_time',
        operator: 'greater_than',
        threshold: 200
      },
      priority: 'warning',
      enabled: true,
      cooldown: 600000, // 10 minutes
      actions: ['websocket']
    });

    this.addAlertRule({
      id: 'promotion_underperforming',
      name: 'Promotion Underperforming',
      type: 'promotion_performance',
      condition: {
        metric: 'roi',
        operator: 'less_than',
        threshold: 10
      },
      priority: 'warning',
      enabled: true,
      cooldown: 7200000, // 2 hours
      actions: ['email', 'websocket']
    });

    // System health alerts
    this.addAlertRule({
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      type: 'system_health',
      condition: {
        metric: 'memory_usage',
        operator: 'greater_than',
        threshold: 85
      },
      priority: 'critical',
      enabled: true,
      cooldown: 900000, // 15 minutes
      actions: ['email', 'websocket']
    });
  }

  addAlertRule(rule) {
    this.alertRules.set(rule.id, {
      ...rule,
      createdAt: new Date(),
      lastTriggered: null
    });
  }

  removeAlertRule(ruleId) {
    this.alertRules.delete(ruleId);
    
    // Cancel any scheduled jobs for this rule
    if (this.scheduledJobs.has(ruleId)) {
      this.scheduledJobs.get(ruleId).destroy();
      this.scheduledJobs.delete(ruleId);
    }
  }

  updateAlertRule(ruleId, updates) {
    if (this.alertRules.has(ruleId)) {
      const existingRule = this.alertRules.get(ruleId);
      this.alertRules.set(ruleId, {
        ...existingRule,
        ...updates,
        updatedAt: new Date()
      });
    }
  }

  async checkAlert(ruleId, companyId, currentValue) {
    const rule = this.alertRules.get(ruleId);
    if (!rule || !rule.enabled) return;

    const shouldTrigger = this.evaluateCondition(rule.condition, currentValue);
    
    if (shouldTrigger) {
      const alertKey = `${ruleId}_${companyId}`;
      const existingAlert = this.activeAlerts.get(alertKey);
      
      // Check cooldown period
      if (existingAlert && rule.lastTriggered) {
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
        if (timeSinceLastTrigger < rule.cooldown) {
          return; // Still in cooldown period
        }
      }

      // Create alert
      const alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ruleId,
        companyId,
        type: rule.type,
        priority: rule.priority,
        message: this.generateAlertMessage(rule, currentValue),
        currentValue,
        threshold: rule.condition.threshold,
        createdAt: new Date(),
        status: 'active'
      };

      // Store active alert
      this.activeAlerts.set(alertKey, alert);
      this.alertHistory.push(alert);

      // Update rule last triggered time
      rule.lastTriggered = new Date();

      // Execute alert actions
      await this.executeAlertActions(alert, rule.actions);

      // Emit monitoring event
      monitoringEvents.emit('alert', {
        type: 'alert',
        companyId,
        alert,
        timestamp: new Date()
      });

      return alert;
    }
  }

  evaluateCondition(condition, currentValue) {
    const { operator, threshold } = condition;

    switch (operator) {
      case 'greater_than':
        return currentValue > threshold;
      case 'less_than':
        return currentValue < threshold;
      case 'equals':
        return currentValue === threshold;
      case 'greater_than_or_equal':
        return currentValue >= threshold;
      case 'less_than_or_equal':
        return currentValue <= threshold;
      default:
        return false;
    }
  }

  generateAlertMessage(rule, currentValue) {
    const { condition } = rule;
    
    switch (rule.type) {
      case 'budget_threshold':
        return `Budget utilization has reached ${currentValue.toFixed(1)}%, exceeding the ${condition.threshold}% threshold`;
      case 'performance':
        return `${condition.metric.replace('_', ' ')} is ${currentValue}ms, above the ${condition.threshold}ms threshold`;
      case 'promotion_performance':
        return `Promotion ROI is ${currentValue.toFixed(2)}%, below the expected ${condition.threshold}% threshold`;
      case 'system_health':
        return `${condition.metric.replace('_', ' ')} is at ${currentValue}%, exceeding the ${condition.threshold}% threshold`;
      default:
        return `Alert triggered: ${rule.name}`;
    }
  }

  async executeAlertActions(alert, actions) {
    for (const action of actions) {
      try {
        switch (action) {
          case 'email':
            await this.sendEmailAlert(alert);
            break;
          case 'websocket':
            this.sendWebSocketAlert(alert);
            break;
          case 'sms':
            await this.sendSMSAlert(alert);
            break;
          case 'slack':
            await this.sendSlackAlert(alert);
            break;
        }
      } catch (error) {
        console.error(`Error executing alert action ${action}:`, error);
      }
    }
  }

  async sendEmailAlert(alert) {
    // Get company admin emails (mock implementation)
    const adminEmails = ['admin@company.com', 'manager@company.com'];
    
    const subject = `Trade AI Alert: ${alert.priority.toUpperCase()} - ${alert.type}`;
    const body = `
      <h2>Trade AI Monitoring Alert</h2>
      <p><strong>Priority:</strong> ${alert.priority.toUpperCase()}</p>
      <p><strong>Type:</strong> ${alert.type}</p>
      <p><strong>Message:</strong> ${alert.message}</p>
      <p><strong>Current Value:</strong> ${alert.currentValue}</p>
      <p><strong>Threshold:</strong> ${alert.threshold}</p>
      <p><strong>Time:</strong> ${alert.createdAt.toISOString()}</p>
      
      <p>Please log into the Trade AI platform to investigate and resolve this alert.</p>
    `;

    for (const email of adminEmails) {
      await sendEmail(email, subject, body);
    }
  }

  sendWebSocketAlert(alert) {
    websocketService.broadcastToCompany(alert.companyId, {
      type: 'alert',
      data: alert,
      timestamp: new Date()
    });
  }

  async sendSMSAlert(alert) {
    // Mock SMS implementation
    console.log(`SMS Alert sent: ${alert.message}`);
  }

  async sendSlackAlert(alert) {
    // Mock Slack implementation
    console.log(`Slack Alert sent: ${alert.message}`);
  }

  resolveAlert(alertId, resolvedBy, resolution) {
    // Find and resolve alert
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      alert.resolvedBy = resolvedBy;
      alert.resolution = resolution;

      // Remove from active alerts
      const alertKey = `${alert.ruleId}_${alert.companyId}`;
      this.activeAlerts.delete(alertKey);

      // Emit resolution event
      monitoringEvents.emit('alert_resolved', {
        type: 'alert_resolved',
        companyId: alert.companyId,
        alert,
        timestamp: new Date()
      });
    }
  }

  startPeriodicChecks() {
    // Run alert checks every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.runPeriodicAlertChecks();
    });

    // Cleanup old alerts daily
    cron.schedule('0 0 * * *', () => {
      this.cleanupOldAlerts();
    });
  }

  async runPeriodicAlertChecks() {
    try {
      // Mock data - in production, this would fetch real metrics
      const companies = ['company1', 'company2', 'company3'];
      
      for (const companyId of companies) {
        // Check budget utilization
        const budgetUtilization = Math.random() * 100;
        await this.checkAlert('budget_threshold_80', companyId, budgetUtilization);
        await this.checkAlert('budget_threshold_90', companyId, budgetUtilization);

        // Check response time
        const responseTime = Math.random() * 300 + 50;
        await this.checkAlert('high_response_time', companyId, responseTime);

        // Check memory usage
        const memoryUsage = Math.random() * 100;
        await this.checkAlert('high_memory_usage', companyId, memoryUsage);
      }
    } catch (error) {
      console.error('Error running periodic alert checks:', error);
    }
  }

  cleanupOldAlerts() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    this.alertHistory = this.alertHistory.filter(alert => 
      alert.createdAt > thirtyDaysAgo
    );

    console.log('Old alerts cleaned up');
  }

  getAlertStats() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentAlerts = this.alertHistory.filter(alert => alert.createdAt > last24Hours);
    const weeklyAlerts = this.alertHistory.filter(alert => alert.createdAt > last7Days);

    return {
      totalRules: this.alertRules.size,
      activeAlerts: this.activeAlerts.size,
      totalAlerts: this.alertHistory.length,
      alertsLast24Hours: recentAlerts.length,
      alertsLast7Days: weeklyAlerts.length,
      alertsByPriority: {
        critical: this.alertHistory.filter(a => a.priority === 'critical').length,
        warning: this.alertHistory.filter(a => a.priority === 'warning').length,
        info: this.alertHistory.filter(a => a.priority === 'info').length
      },
      alertsByType: this.getAlertsByType(),
      resolutionRate: this.calculateResolutionRate()
    };
  }

  getAlertsByType() {
    const typeCount = {};
    this.alertHistory.forEach(alert => {
      typeCount[alert.type] = (typeCount[alert.type] || 0) + 1;
    });
    return typeCount;
  }

  calculateResolutionRate() {
    const resolvedAlerts = this.alertHistory.filter(a => a.status === 'resolved').length;
    return this.alertHistory.length > 0 ? 
      (resolvedAlerts / this.alertHistory.length) * 100 : 0;
  }

  getAlertRules() {
    return Array.from(this.alertRules.values());
  }

  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(limit = 100) {
    return this.alertHistory
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }
}

// Create singleton instance
const alertService = new AlertService();

module.exports = alertService;