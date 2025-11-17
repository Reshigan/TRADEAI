const EventEmitter = require('events');
const WebSocket = require('ws');
const Redis = require('redis');
const mongoose = require('mongoose');
const AnalyticsEngine = require('./analyticsEngine');

/**
 * Real-time Analytics Service
 * Provides streaming analytics, live dashboards, and real-time notifications
 */

class RealtimeAnalyticsService extends EventEmitter {
  constructor() {
    super();
    this.analyticsEngine = new AnalyticsEngine();
    this.connections = new Map(); // tenantId -> Set of WebSocket connections
    this.subscriptions = new Map(); // connectionId -> Set of subscriptions
    this.metrics = new Map(); // Real-time metrics cache
    this.redisClient = null;
    this.isInitialized = false;

    this.initializeService();
  }

  async initializeService() {
    try {
      // Initialize Redis for pub/sub (optional, fallback to in-memory)
      try {
        this.redisClient = Redis.createClient({
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379
        });
        await this.redisClient.connect();
        console.log('Redis connected for real-time analytics');
      } catch (error) {
        console.warn('Redis not available, using in-memory pub/sub:', error.message);
      }

      // Start metrics collection
      this.startMetricsCollection();

      // Start change stream monitoring
      this.startChangeStreamMonitoring();

      this.isInitialized = true;
      console.log('Real-time Analytics Service initialized');
    } catch (error) {
      console.error('Failed to initialize Real-time Analytics Service:', error);
    }
  }

  /**
   * Create WebSocket server
   */
  createWebSocketServer(server) {
    const wss = new WebSocket.Server({
      server,
      path: '/ws/analytics'
    });

    wss.on('connection', (ws, req) => {
      this.handleWebSocketConnection(ws, req);
    });

    return wss;
  }

  /**
   * Handle new WebSocket connection
   */
  handleWebSocketConnection(ws, req) {
    const connectionId = this.generateConnectionId();
    const tenantId = this.extractTenantFromRequest(req);

    if (!tenantId) {
      ws.close(1008, 'Tenant ID required');
      return;
    }

    // Store connection
    if (!this.connections.has(tenantId)) {
      this.connections.set(tenantId, new Set());
    }
    this.connections.get(tenantId).add(ws);

    // Initialize connection metadata
    ws.connectionId = connectionId;
    ws.tenantId = tenantId;
    ws.subscriptions = new Set();
    ws.isAlive = true;

    // Set up ping/pong for connection health
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle messages
    ws.on('message', (data) => {
      this.handleWebSocketMessage(ws, data);
    });

    // Handle connection close
    ws.on('close', () => {
      this.handleWebSocketClose(ws);
    });

    // Send initial connection confirmation
    this.sendToConnection(ws, {
      type: 'connection_established',
      connectionId,
      timestamp: new Date().toISOString()
    });

    console.log(`WebSocket connection established: ${connectionId} for tenant: ${tenantId}`);
  }

  /**
   * Handle WebSocket messages
   */
  handleWebSocketMessage(ws, data) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(ws, message);
          break;
        case 'unsubscribe':
          this.handleUnsubscription(ws, message);
          break;
        case 'get_metrics':
          this.handleMetricsRequest(ws, message);
          break;
        case 'ping':
          this.sendToConnection(ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;
        default:
          this.sendToConnection(ws, {
            type: 'error',
            message: `Unknown message type: ${message.type}`
          });
      }
    } catch (error) {
      this.sendToConnection(ws, {
        type: 'error',
        message: 'Invalid message format'
      });
    }
  }

  /**
   * Handle subscription requests
   */
  handleSubscription(ws, message) {
    const { channel, filters = {} } = message;

    if (!channel) {
      this.sendToConnection(ws, {
        type: 'error',
        message: 'Channel is required for subscription'
      });
      return;
    }

    const subscription = {
      channel,
      filters,
      subscribedAt: new Date()
    };

    ws.subscriptions.add(JSON.stringify(subscription));

    this.sendToConnection(ws, {
      type: 'subscription_confirmed',
      channel,
      filters,
      timestamp: new Date().toISOString()
    });

    // Send initial data for the subscription
    this.sendInitialData(ws, subscription);
  }

  /**
   * Handle unsubscription requests
   */
  handleUnsubscription(ws, message) {
    const { channel, filters = {} } = message;

    const subscription = JSON.stringify({ channel, filters });
    ws.subscriptions.delete(subscription);

    this.sendToConnection(ws, {
      type: 'unsubscription_confirmed',
      channel,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle metrics requests
   */
  async handleMetricsRequest(ws, message) {
    const { metricsType, timeRange, filters = {} } = message;

    try {
      let metrics;

      switch (metricsType) {
        case 'dashboard':
          metrics = await this.getDashboardMetrics(ws.tenantId, timeRange, filters);
          break;
        case 'roi_trends':
          metrics = await this.getROITrends(ws.tenantId, timeRange, filters);
          break;
        case 'performance':
          metrics = await this.getPerformanceMetrics(ws.tenantId, timeRange, filters);
          break;
        case 'alerts':
          metrics = await this.getActiveAlerts(ws.tenantId, filters);
          break;
        default:
          throw new Error(`Unknown metrics type: ${metricsType}`);
      }

      this.sendToConnection(ws, {
        type: 'metrics_response',
        metricsType,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.sendToConnection(ws, {
        type: 'error',
        message: `Failed to get metrics: ${error.message}`
      });
    }
  }

  /**
   * Handle WebSocket connection close
   */
  handleWebSocketClose(ws) {
    if (ws.tenantId && this.connections.has(ws.tenantId)) {
      this.connections.get(ws.tenantId).delete(ws);

      if (this.connections.get(ws.tenantId).size === 0) {
        this.connections.delete(ws.tenantId);
      }
    }

    console.log(`WebSocket connection closed: ${ws.connectionId}`);
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    // Collect metrics every 30 seconds
    setInterval(async () => {
      try {
        await this.collectAndBroadcastMetrics();
      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }, 30000);

    // Collect high-frequency metrics every 5 seconds
    setInterval(async () => {
      try {
        await this.collectHighFrequencyMetrics();
      } catch (error) {
        console.error('Error collecting high-frequency metrics:', error);
      }
    }, 5000);
  }

  /**
   * Start MongoDB change stream monitoring
   */
  startChangeStreamMonitoring() {
    const collections = ['promotions', 'customers', 'products', 'tradespends'];

    collections.forEach((collectionName) => {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const changeStream = collection.watch([], { fullDocument: 'updateLookup' });

        changeStream.on('change', (change) => {
          this.handleDatabaseChange(collectionName, change);
        });

        changeStream.on('error', (error) => {
          console.error(`Change stream error for ${collectionName}:`, error);
        });

        console.log(`Change stream started for ${collectionName}`);
      } catch (error) {
        console.warn(`Could not start change stream for ${collectionName}:`, error.message);
      }
    });
  }

  /**
   * Handle database changes
   */
  handleDatabaseChange(collectionName, change) {
    const { operationType, fullDocument, documentKey } = change;

    if (!fullDocument || !fullDocument.tenantId) return;

    const tenantId = fullDocument.tenantId.toString();

    // Broadcast change to relevant connections
    this.broadcastToTenant(tenantId, {
      type: 'data_change',
      collection: collectionName,
      operation: operationType,
      documentId: documentKey._id,
      document: this.sanitizeDocument(fullDocument),
      timestamp: new Date().toISOString()
    });

    // Trigger metrics recalculation if needed
    if (this.shouldRecalculateMetrics(collectionName, operationType)) {
      this.scheduleMetricsRecalculation(tenantId);
    }
  }

  /**
   * Collect and broadcast metrics
   */
  async collectAndBroadcastMetrics() {
    for (const [tenantId, connections] of this.connections) {
      if (connections.size === 0) continue;

      try {
        // Collect various metrics
        const [dashboardMetrics, performanceMetrics, alerts] = await Promise.all([
          this.getDashboardMetrics(tenantId),
          this.getPerformanceMetrics(tenantId),
          this.getActiveAlerts(tenantId)
        ]);

        // Broadcast to subscribed connections
        connections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            if (this.isSubscribedTo(ws, 'dashboard')) {
              this.sendToConnection(ws, {
                type: 'metrics_update',
                channel: 'dashboard',
                data: dashboardMetrics,
                timestamp: new Date().toISOString()
              });
            }

            if (this.isSubscribedTo(ws, 'performance')) {
              this.sendToConnection(ws, {
                type: 'metrics_update',
                channel: 'performance',
                data: performanceMetrics,
                timestamp: new Date().toISOString()
              });
            }

            if (this.isSubscribedTo(ws, 'alerts') && alerts.length > 0) {
              this.sendToConnection(ws, {
                type: 'alerts_update',
                data: alerts,
                timestamp: new Date().toISOString()
              });
            }
          }
        });
      } catch (error) {
        console.error(`Error collecting metrics for tenant ${tenantId}:`, error);
      }
    }
  }

  /**
   * Collect high-frequency metrics
   */
  collectHighFrequencyMetrics() {
    const systemMetrics = {
      activeConnections: Array.from(this.connections.values())
        .reduce((sum, connections) => sum + connections.size, 0),
      activeTenants: this.connections.size,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    // Broadcast system metrics to admin connections
    this.broadcastSystemMetrics(systemMetrics);
  }

  /**
   * Get dashboard metrics
   */
  getDashboardMetrics(tenantId, timeRange = '24h', filters = {}) {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    return this.analyticsEngine.generatePerformanceDashboard(
      tenantId,
      { start: startDate, end: endDate },
      filters
    );
  }

  /**
   * Get ROI trends
   */
  getROITrends(tenantId, timeRange = '30d', filters = {}) {
    // Mock implementation - would integrate with actual analytics
    return {
      trends: [
        { date: '2024-01-01', roi: 15.2 },
        { date: '2024-01-02', roi: 16.8 },
        { date: '2024-01-03', roi: 14.5 }
      ],
      average: 15.5,
      change: '+2.3%'
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(tenantId, timeRange = '24h', filters = {}) {
    return {
      activePromotions: 12,
      totalROI: 18.5,
      customerEngagement: 85.2,
      revenueGrowth: 12.8,
      topPerformers: [
        { name: 'Summer Sale', roi: 25.5 },
        { name: 'Back to School', roi: 22.1 }
      ]
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(tenantId, filters = {}) {
    // Mock implementation - would check actual alert conditions
    return [
      {
        id: 'alert_001',
        type: 'warning',
        title: 'ROI Below Target',
        message: 'Promotion XYZ ROI is 8% below target',
        severity: 'medium',
        timestamp: new Date().toISOString()
      }
    ];
  }

  /**
   * Send initial data for subscription
   */
  async sendInitialData(ws, subscription) {
    const { channel, filters } = subscription;

    try {
      let data;

      switch (channel) {
        case 'dashboard':
          data = await this.getDashboardMetrics(ws.tenantId, '24h', filters);
          break;
        case 'performance':
          data = await this.getPerformanceMetrics(ws.tenantId, '24h', filters);
          break;
        case 'alerts':
          data = await this.getActiveAlerts(ws.tenantId, filters);
          break;
        default:
          return;
      }

      this.sendToConnection(ws, {
        type: 'initial_data',
        channel,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.sendToConnection(ws, {
        type: 'error',
        message: `Failed to get initial data for ${channel}: ${error.message}`
      });
    }
  }

  /**
   * Broadcast message to all connections for a tenant
   */
  broadcastToTenant(tenantId, message) {
    const connections = this.connections.get(tenantId);
    if (!connections) return;

    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendToConnection(ws, message);
      }
    });
  }

  /**
   * Broadcast system metrics to admin connections
   */
  broadcastSystemMetrics(metrics) {
    // This would broadcast to admin/monitoring connections
    // For now, just log the metrics
    console.log('System Metrics:', {
      activeConnections: metrics.activeConnections,
      activeTenants: metrics.activeTenants,
      memoryUsage: `${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`
    });
  }

  /**
   * Send message to specific connection
   */
  sendToConnection(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Check if connection is subscribed to channel
   */
  isSubscribedTo(ws, channel) {
    for (const subscription of ws.subscriptions) {
      const sub = JSON.parse(subscription);
      if (sub.channel === channel) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if metrics should be recalculated
   */
  shouldRecalculateMetrics(collectionName, operationType) {
    const triggerCollections = ['promotions', 'tradespends'];
    const triggerOperations = ['insert', 'update', 'delete'];

    return triggerCollections.includes(collectionName) &&
           triggerOperations.includes(operationType);
  }

  /**
   * Schedule metrics recalculation
   */
  scheduleMetricsRecalculation(tenantId) {
    // Debounce recalculation to avoid excessive processing
    const key = `recalc_${tenantId}`;

    if (this.recalculationTimers && this.recalculationTimers[key]) {
      clearTimeout(this.recalculationTimers[key]);
    }

    if (!this.recalculationTimers) {
      this.recalculationTimers = {};
    }

    this.recalculationTimers[key] = setTimeout(async () => {
      try {
        await this.recalculateMetricsForTenant(tenantId);
        delete this.recalculationTimers[key];
      } catch (error) {
        console.error(`Error recalculating metrics for tenant ${tenantId}:`, error);
      }
    }, 5000); // 5 second delay
  }

  /**
   * Recalculate metrics for tenant
   */
  async recalculateMetricsForTenant(tenantId) {
    console.log(`Recalculating metrics for tenant: ${tenantId}`);

    // Clear cache for this tenant
    this.analyticsEngine.cache.forEach((value, key) => {
      if (key.includes(tenantId)) {
        this.analyticsEngine.cache.delete(key);
      }
    });

    // Trigger fresh metrics collection
    const connections = this.connections.get(tenantId);
    if (connections && connections.size > 0) {
      await this.collectAndBroadcastMetrics();
    }
  }

  /**
   * Sanitize document for broadcasting
   */
  sanitizeDocument(document) {
    // Remove sensitive fields
    const sanitized = { ...document };
    delete sanitized.password;
    delete sanitized.apiKey;
    delete sanitized.secret;

    return sanitized;
  }

  /**
   * Extract tenant ID from request
   */
  extractTenantFromRequest(req) {
    // Extract from query parameter, header, or JWT token
    return req.url.includes('tenantId=') ?
      new URL(req.url, 'http://localhost').searchParams.get('tenantId') :
      req.headers['x-tenant-id'];
  }

  /**
   * Generate unique connection ID
   */
  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check for connections
   */
  startHealthCheck() {
    setInterval(() => {
      this.connections.forEach((connections, tenantId) => {
        connections.forEach((ws) => {
          if (!ws.isAlive) {
            ws.terminate();
            connections.delete(ws);
            return;
          }

          ws.isAlive = false;
          ws.ping();
        });

        if (connections.size === 0) {
          this.connections.delete(tenantId);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    const stats = {
      totalConnections: 0,
      tenantConnections: {},
      subscriptions: {}
    };

    this.connections.forEach((connections, tenantId) => {
      stats.totalConnections += connections.size;
      stats.tenantConnections[tenantId] = connections.size;

      connections.forEach((ws) => {
        ws.subscriptions.forEach((sub) => {
          const subscription = JSON.parse(sub);
          stats.subscriptions[subscription.channel] =
            (stats.subscriptions[subscription.channel] || 0) + 1;
        });
      });
    });

    return stats;
  }

  /**
   * Shutdown service gracefully
   */
  async shutdown() {
    console.log('Shutting down Real-time Analytics Service...');

    // Close all WebSocket connections
    this.connections.forEach((connections) => {
      connections.forEach((ws) => {
        ws.close(1001, 'Server shutting down');
      });
    });

    // Close Redis connection
    if (this.redisClient) {
      await this.redisClient.quit();
    }

    console.log('Real-time Analytics Service shutdown complete');
  }
}

module.exports = RealtimeAnalyticsService;
