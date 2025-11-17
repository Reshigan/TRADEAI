const mongoose = require('mongoose');
const EventEmitter = require('events');
const Promotion = require('../models/Promotion');
const Budget = require('../models/Budget');
const TradeSpend = require('../models/TradeSpend');
const SalesHistory = require('../models/SalesHistory');
const { _sendEmail } = require('../services/emailService');

// Real-time event emitter for monitoring
const monitoringEvents = new EventEmitter();

const monitoringController = {
  // Real-time dashboard metrics
  async getRealTimeDashboard(req, res) {
    try {
      const { userId, companyId } = req.user;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get real-time metrics
      const [
        activePromotions,
        todaySpend,
        weeklyBudgetUtilization,
        monthlyPerformance,
        alerts,
        systemHealth
      ] = await Promise.all([
        this._getActivePromotions(companyId),
        this._getTodaySpend(companyId, today),
        this._getWeeklyBudgetUtilization(companyId, thisWeek),
        this._getMonthlyPerformance(companyId, thisMonth),
        this._getActiveAlerts(companyId),
        this._getSystemHealth()
      ]);

      const dashboard = {
        timestamp: now,
        metrics: {
          activePromotions,
          todaySpend,
          weeklyBudgetUtilization,
          monthlyPerformance
        },
        alerts,
        systemHealth,
        lastUpdated: now
      };

      res.json(dashboard);

    } catch (error) {
      console.error('Error getting real-time dashboard:', error);
      res.status(500).json({ error: 'Failed to get real-time dashboard' });
    }
  },

  // Set up real-time monitoring alerts
  async setupAlerts(req, res) {
    try {
      const { userId, companyId } = req.user;
      const { alertConfigs } = req.body;

      const processedAlerts = [];

      for (const config of alertConfigs) {
        const alert = await this._createAlert({
          ...config,
          userId,
          companyId,
          createdAt: new Date(),
          isActive: true
        });
        processedAlerts.push(alert);
      }

      res.json({
        message: 'Alerts configured successfully',
        alerts: processedAlerts,
        totalAlerts: processedAlerts.length
      });

    } catch (error) {
      console.error('Error setting up alerts:', error);
      res.status(500).json({ error: 'Failed to setup alerts' });
    }
  },

  // Get monitoring alerts
  async getAlerts(req, res) {
    try {
      const { companyId } = req.user;
      const { status, type, priority } = req.query;

      const filter = { companyId };

      if (status) filter.status = status;
      if (type) filter.type = type;
      if (priority) filter.priority = priority;

      const alerts = await this._getAlerts(filter);

      res.json({
        alerts,
        totalCount: alerts.length,
        summary: {
          critical: alerts.filter((a) => a.priority === 'critical').length,
          warning: alerts.filter((a) => a.priority === 'warning').length,
          info: alerts.filter((a) => a.priority === 'info').length,
          active: alerts.filter((a) => a.status === 'active').length,
          resolved: alerts.filter((a) => a.status === 'resolved').length
        }
      });

    } catch (error) {
      console.error('Error getting alerts:', error);
      res.status(500).json({ error: 'Failed to get alerts' });
    }
  },

  // Performance monitoring
  async getPerformanceMetrics(req, res) {
    try {
      const { companyId } = req.user;
      const { timeframe = '24h' } = req.query;

      const metrics = await this._getPerformanceMetrics(companyId, timeframe);

      res.json({
        metrics,
        timeframe,
        generatedAt: new Date()
      });

    } catch (error) {
      console.error('Error getting performance metrics:', error);
      res.status(500).json({ error: 'Failed to get performance metrics' });
    }
  },

  // System health monitoring
  async getSystemHealth(req, res) {
    try {
      const health = await this._getSystemHealth();

      res.json({
        health,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error getting system health:', error);
      res.status(500).json({ error: 'Failed to get system health' });
    }
  },

  // Real-time event streaming
  streamEvents(req, res) {
    try {
      const { companyId } = req.user;

      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial connection event
      res.write(`data: ${JSON.stringify({
        type: 'connection',
        message: 'Connected to monitoring stream',
        timestamp: new Date()
      })}\n\n`);

      // Set up event listeners for this company
      const eventHandler = (eventData) => {
        if (eventData.companyId === companyId) {
          res.write(`data: ${JSON.stringify(eventData)}\n\n`);
        }
      };

      monitoringEvents.on('alert', eventHandler);
      monitoringEvents.on('metric_update', eventHandler);
      monitoringEvents.on('system_event', eventHandler);

      // Clean up on client disconnect
      req.on('close', () => {
        monitoringEvents.removeListener('alert', eventHandler);
        monitoringEvents.removeListener('metric_update', eventHandler);
        monitoringEvents.removeListener('system_event', eventHandler);
      });

      // Keep connection alive
      const keepAlive = setInterval(() => {
        res.write(`data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date()
        })}\n\n`);
      }, 30000);

      req.on('close', () => {
        clearInterval(keepAlive);
      });

    } catch (error) {
      console.error('Error setting up event stream:', error);
      res.status(500).json({ error: 'Failed to setup event stream' });
    }
  },

  // Trigger manual alert check
  async triggerAlertCheck(req, res) {
    try {
      const { companyId } = req.user;
      const { alertType } = req.body;

      const results = await this._runAlertChecks(companyId, alertType);

      res.json({
        message: 'Alert check completed',
        results,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error triggering alert check:', error);
      res.status(500).json({ error: 'Failed to trigger alert check' });
    }
  },

  // Helper methods
  async _getActivePromotions(companyId) {
    const now = new Date();
    const activePromotions = await Promotion.countDocuments({
      companyId,
      'period.startDate': { $lte: now },
      'period.endDate': { $gte: now },
      status: 'active'
    });

    const totalPromotions = await Promotion.countDocuments({ companyId });

    return {
      active: activePromotions,
      total: totalPromotions,
      percentage: totalPromotions > 0 ? (activePromotions / totalPromotions) * 100 : 0
    };
  },

  async _getTodaySpend(companyId, today) {
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const todaySpend = await TradeSpend.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          totalActual: { $sum: '$actualSpend' },
          totalPlanned: { $sum: '$plannedSpend' },
          count: { $sum: 1 }
        }
      }
    ]);

    const data = todaySpend[0] || { totalActual: 0, totalPlanned: 0, count: 0 };

    return {
      actual: data.totalActual,
      planned: data.totalPlanned,
      variance: data.totalPlanned > 0 ? ((data.totalActual - data.totalPlanned) / data.totalPlanned) * 100 : 0,
      count: data.count
    };
  },

  async _getWeeklyBudgetUtilization(companyId, _weekStart) {
    const budgets = await Budget.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          year: new Date().getFullYear()
        }
      },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: '$totalAmount' },
          allocatedBudget: { $sum: '$allocatedAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const data = budgets[0] || { totalBudget: 0, allocatedBudget: 0, count: 0 };

    return {
      total: data.totalBudget,
      allocated: data.allocatedBudget,
      remaining: data.totalBudget - data.allocatedBudget,
      utilizationRate: data.totalBudget > 0 ? (data.allocatedBudget / data.totalBudget) * 100 : 0
    };
  },

  async _getMonthlyPerformance(companyId, monthStart) {
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    const performance = await SalesHistory.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          date: { $gte: monthStart, $lte: monthEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$value' },
          totalUnits: { $sum: '$units' },
          avgValue: { $avg: '$value' },
          count: { $sum: 1 }
        }
      }
    ]);

    const data = performance[0] || { totalValue: 0, totalUnits: 0, avgValue: 0, count: 0 };

    return {
      revenue: data.totalValue,
      units: data.totalUnits,
      avgOrderValue: data.avgValue,
      transactionCount: data.count,
      trend: Math.random() > 0.5 ? 'up' : 'down' // Placeholder
    };
  },

  _getActiveAlerts(_companyId) {
    // Mock alert data - in production, this would query an Alerts collection
    const mockAlerts = [
      {
        id: '1',
        type: 'budget_threshold',
        priority: 'warning',
        message: 'Budget utilization exceeded 80% for Q1 campaigns',
        timestamp: new Date(Date.now() - 3600000),
        status: 'active'
      },
      {
        id: '2',
        type: 'promotion_performance',
        priority: 'info',
        message: 'Summer promotion showing 15% above expected performance',
        timestamp: new Date(Date.now() - 7200000),
        status: 'active'
      }
    ];

    return mockAlerts;
  },

  _getSystemHealth() {
    // Mock system health data
    return {
      status: 'healthy',
      uptime: '99.9%',
      responseTime: '120ms',
      activeConnections: 1247,
      memoryUsage: '68%',
      cpuUsage: '45%',
      diskUsage: '32%',
      services: {
        database: 'healthy',
        api: 'healthy',
        analytics: 'healthy',
        reporting: 'healthy'
      },
      lastCheck: new Date()
    };
  },

  _createAlert(alertConfig) {
    // In production, this would save to an Alerts collection
    return {
      id: new mongoose.Types.ObjectId(),
      ...alertConfig,
      status: 'active'
    };
  },

  _getAlerts(filter) {
    // Mock alerts data - in production, query from database
    const mockAlerts = [
      {
        id: '1',
        type: 'budget_threshold',
        priority: 'critical',
        message: 'Budget exceeded for Marketing Campaign Q1',
        status: 'active',
        createdAt: new Date(Date.now() - 86400000),
        companyId: filter.companyId
      },
      {
        id: '2',
        type: 'promotion_performance',
        priority: 'warning',
        message: 'Promotion performance below target by 20%',
        status: 'active',
        createdAt: new Date(Date.now() - 172800000),
        companyId: filter.companyId
      },
      {
        id: '3',
        type: 'system_health',
        priority: 'info',
        message: 'System maintenance scheduled for tonight',
        status: 'resolved',
        createdAt: new Date(Date.now() - 259200000),
        companyId: filter.companyId
      }
    ];

    return mockAlerts.filter((alert) => {
      if (filter.status && alert.status !== filter.status) return false;
      if (filter.type && alert.type !== filter.type) return false;
      if (filter.priority && alert.priority !== filter.priority) return false;
      return true;
    });
  },

  _getPerformanceMetrics(companyId, _timeframe) {
    // Mock performance metrics
    const metrics = {
      responseTime: {
        current: 125,
        average: 118,
        trend: 'stable',
        history: [120, 115, 130, 125, 118, 125]
      },
      throughput: {
        current: 1250,
        average: 1180,
        trend: 'up',
        history: [1100, 1150, 1200, 1250, 1300, 1250]
      },
      errorRate: {
        current: 0.02,
        average: 0.015,
        trend: 'up',
        history: [0.01, 0.015, 0.02, 0.018, 0.02, 0.02]
      },
      userSessions: {
        current: 847,
        average: 792,
        trend: 'up',
        history: [750, 780, 820, 847, 890, 847]
      }
    };

    return metrics;
  },

  async _runAlertChecks(companyId, alertType) {
    const results = [];

    // Budget threshold checks
    if (!alertType || alertType === 'budget') {
      const budgetAlerts = await this._checkBudgetThresholds(companyId);
      results.push(...budgetAlerts);
    }

    // Performance checks
    if (!alertType || alertType === 'performance') {
      const performanceAlerts = await this._checkPerformanceThresholds(companyId);
      results.push(...performanceAlerts);
    }

    // System health checks
    if (!alertType || alertType === 'system') {
      const systemAlerts = await this._checkSystemHealth();
      results.push(...systemAlerts);
    }

    // Emit alerts to real-time stream
    results.forEach((alert) => {
      monitoringEvents.emit('alert', {
        type: 'alert',
        companyId,
        alert,
        timestamp: new Date()
      });
    });

    return results;
  },

  async _checkBudgetThresholds(companyId) {
    const alerts = [];

    // Check budget utilization
    const budgets = await Budget.find({ companyId });

    for (const budget of budgets) {
      const utilizationRate = budget.totalAmount > 0 ?
        (budget.allocatedAmount / budget.totalAmount) * 100 : 0;

      if (utilizationRate > 90) {
        alerts.push({
          type: 'budget_threshold',
          priority: 'critical',
          message: `Budget ${budget.name} utilization at ${utilizationRate.toFixed(1)}%`,
          threshold: 90,
          currentValue: utilizationRate
        });
      } else if (utilizationRate > 80) {
        alerts.push({
          type: 'budget_threshold',
          priority: 'warning',
          message: `Budget ${budget.name} utilization at ${utilizationRate.toFixed(1)}%`,
          threshold: 80,
          currentValue: utilizationRate
        });
      }
    }

    return alerts;
  },

  _checkPerformanceThresholds(_companyId) {
    const alerts = [];

    // Mock performance threshold checks
    const responseTime = 125; // ms
    const errorRate = 0.02; // 2%

    if (responseTime > 200) {
      alerts.push({
        type: 'performance',
        priority: 'warning',
        message: `High response time: ${responseTime}ms`,
        threshold: 200,
        currentValue: responseTime
      });
    }

    if (errorRate > 0.05) {
      alerts.push({
        type: 'performance',
        priority: 'critical',
        message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
        threshold: 5,
        currentValue: errorRate * 100
      });
    }

    return alerts;
  },

  _checkSystemHealth() {
    const alerts = [];

    // Mock system health checks
    const memoryUsage = 68; // %
    const cpuUsage = 45; // %
    const _diskUsage = 32; // %

    if (memoryUsage > 85) {
      alerts.push({
        type: 'system_health',
        priority: 'critical',
        message: `High memory usage: ${memoryUsage}%`,
        threshold: 85,
        currentValue: memoryUsage
      });
    }

    if (cpuUsage > 80) {
      alerts.push({
        type: 'system_health',
        priority: 'warning',
        message: `High CPU usage: ${cpuUsage}%`,
        threshold: 80,
        currentValue: cpuUsage
      });
    }

    return alerts;
  }
};

// Export both controller and event emitter for external use
module.exports = { monitoringController, monitoringEvents };
