const EventEmitter = require('events');
const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Monitoring and Observability Service
 * Provides APM, performance tracking, alerting, logging, and metrics collection
 */

class MonitoringObservabilityService extends EventEmitter {
  constructor() {
    super();
    this.metrics = new Map();
    this.logs = [];
    this.alerts = new Map();
    this.traces = new Map();
    this.healthChecks = new Map();
    this.dashboards = new Map();
    this.alertRules = new Map();
    this.logRetentionDays = 30;
    this.metricsRetentionDays = 90;
    this.isInitialized = false;
    
    this.initializeService();
  }

  async initializeService() {
    try {
      console.log('Initializing Monitoring and Observability Service...');
      
      // Setup system monitoring
      this.setupSystemMonitoring();
      
      // Initialize alert rules
      this.initializeAlertRules();
      
      // Setup health checks
      this.setupHealthChecks();
      
      // Create default dashboards
      this.createDefaultDashboards();
      
      // Start background tasks
      this.startBackgroundTasks();
      
      this.isInitialized = true;
      console.log('Monitoring and Observability Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Monitoring and Observability Service:', error);
    }
  }

  /**
   * Setup system monitoring
   */
  setupSystemMonitoring() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Collect application metrics every 10 seconds
    setInterval(() => {
      this.collectApplicationMetrics();
    }, 10000);

    // Monitor memory usage
    setInterval(() => {
      this.monitorMemoryUsage();
    }, 60000);

    console.log('System monitoring setup complete');
  }

  /**
   * Initialize alert rules
   */
  initializeAlertRules() {
    // System alerts
    this.alertRules.set('high_cpu_usage', {
      id: 'high_cpu_usage',
      name: 'High CPU Usage',
      description: 'CPU usage exceeds 80%',
      condition: 'cpu_usage > 80',
      severity: 'warning',
      threshold: 80,
      duration: 300000, // 5 minutes
      enabled: true,
      actions: ['email', 'slack']
    });

    this.alertRules.set('high_memory_usage', {
      id: 'high_memory_usage',
      name: 'High Memory Usage',
      description: 'Memory usage exceeds 85%',
      condition: 'memory_usage > 85',
      severity: 'warning',
      threshold: 85,
      duration: 300000,
      enabled: true,
      actions: ['email', 'slack']
    });

    this.alertRules.set('disk_space_low', {
      id: 'disk_space_low',
      name: 'Low Disk Space',
      description: 'Disk space usage exceeds 90%',
      condition: 'disk_usage > 90',
      severity: 'critical',
      threshold: 90,
      duration: 60000, // 1 minute
      enabled: true,
      actions: ['email', 'slack', 'pagerduty']
    });

    // Application alerts
    this.alertRules.set('high_error_rate', {
      id: 'high_error_rate',
      name: 'High Error Rate',
      description: 'Error rate exceeds 5%',
      condition: 'error_rate > 5',
      severity: 'critical',
      threshold: 5,
      duration: 180000, // 3 minutes
      enabled: true,
      actions: ['email', 'slack']
    });

    this.alertRules.set('slow_response_time', {
      id: 'slow_response_time',
      name: 'Slow Response Time',
      description: 'Average response time exceeds 2 seconds',
      condition: 'avg_response_time > 2000',
      severity: 'warning',
      threshold: 2000,
      duration: 300000,
      enabled: true,
      actions: ['slack']
    });

    this.alertRules.set('database_connection_failure', {
      id: 'database_connection_failure',
      name: 'Database Connection Failure',
      description: 'Database connection health check failed',
      condition: 'database_health == false',
      severity: 'critical',
      threshold: 1,
      duration: 60000,
      enabled: true,
      actions: ['email', 'slack', 'pagerduty']
    });

    console.log('Alert rules initialized:', this.alertRules.size);
  }

  /**
   * Setup health checks
   */
  setupHealthChecks() {
    // Database health check
    this.healthChecks.set('database', {
      name: 'Database Connection',
      check: this.checkDatabaseHealth.bind(this),
      interval: 30000,
      timeout: 5000,
      retries: 3
    });

    // Redis health check
    this.healthChecks.set('redis', {
      name: 'Redis Connection',
      check: this.checkRedisHealth.bind(this),
      interval: 30000,
      timeout: 5000,
      retries: 3
    });

    // External API health checks
    this.healthChecks.set('external_apis', {
      name: 'External APIs',
      check: this.checkExternalAPIsHealth.bind(this),
      interval: 60000,
      timeout: 10000,
      retries: 2
    });

    // File system health check
    this.healthChecks.set('filesystem', {
      name: 'File System',
      check: this.checkFileSystemHealth.bind(this),
      interval: 300000, // 5 minutes
      timeout: 5000,
      retries: 1
    });

    // Start health check monitoring
    this.startHealthCheckMonitoring();

    console.log('Health checks setup complete');
  }

  /**
   * Create default dashboards
   */
  createDefaultDashboards() {
    // System Overview Dashboard
    this.dashboards.set('system_overview', {
      id: 'system_overview',
      name: 'System Overview',
      description: 'Overall system health and performance metrics',
      widgets: [
        {
          id: 'cpu_usage',
          type: 'gauge',
          title: 'CPU Usage',
          metric: 'system.cpu.usage',
          unit: '%',
          thresholds: { warning: 70, critical: 85 }
        },
        {
          id: 'memory_usage',
          type: 'gauge',
          title: 'Memory Usage',
          metric: 'system.memory.usage',
          unit: '%',
          thresholds: { warning: 75, critical: 90 }
        },
        {
          id: 'disk_usage',
          type: 'gauge',
          title: 'Disk Usage',
          metric: 'system.disk.usage',
          unit: '%',
          thresholds: { warning: 80, critical: 95 }
        },
        {
          id: 'network_io',
          type: 'line_chart',
          title: 'Network I/O',
          metrics: ['system.network.bytes_in', 'system.network.bytes_out'],
          unit: 'bytes/sec'
        }
      ]
    });

    // Application Performance Dashboard
    this.dashboards.set('application_performance', {
      id: 'application_performance',
      name: 'Application Performance',
      description: 'Application-specific performance metrics',
      widgets: [
        {
          id: 'request_rate',
          type: 'line_chart',
          title: 'Request Rate',
          metric: 'app.requests.rate',
          unit: 'req/sec'
        },
        {
          id: 'response_time',
          type: 'line_chart',
          title: 'Response Time',
          metrics: ['app.response_time.avg', 'app.response_time.p95', 'app.response_time.p99'],
          unit: 'ms'
        },
        {
          id: 'error_rate',
          type: 'line_chart',
          title: 'Error Rate',
          metric: 'app.errors.rate',
          unit: '%'
        },
        {
          id: 'active_connections',
          type: 'gauge',
          title: 'Active Connections',
          metric: 'app.connections.active',
          unit: 'connections'
        }
      ]
    });

    // Business Metrics Dashboard
    this.dashboards.set('business_metrics', {
      id: 'business_metrics',
      name: 'Business Metrics',
      description: 'Key business performance indicators',
      widgets: [
        {
          id: 'active_users',
          type: 'counter',
          title: 'Active Users',
          metric: 'business.users.active',
          unit: 'users'
        },
        {
          id: 'promotions_created',
          type: 'line_chart',
          title: 'Promotions Created',
          metric: 'business.promotions.created',
          unit: 'count'
        },
        {
          id: 'reports_generated',
          type: 'line_chart',
          title: 'Reports Generated',
          metric: 'business.reports.generated',
          unit: 'count'
        },
        {
          id: 'data_processed',
          type: 'line_chart',
          title: 'Data Processed',
          metric: 'business.data.processed',
          unit: 'MB'
        }
      ]
    });

    console.log('Default dashboards created:', this.dashboards.size);
  }

  /**
   * Record metric
   */
  recordMetric(name, value, tags = {}, timestamp = null) {
    const metricKey = this.generateMetricKey(name, tags);
    const metricTimestamp = timestamp || Date.now();
    
    if (!this.metrics.has(metricKey)) {
      this.metrics.set(metricKey, {
        name,
        tags,
        values: [],
        lastValue: null,
        lastTimestamp: null
      });
    }
    
    const metric = this.metrics.get(metricKey);
    metric.values.push({ value, timestamp: metricTimestamp });
    metric.lastValue = value;
    metric.lastTimestamp = metricTimestamp;
    
    // Keep only recent values (last 24 hours for high-frequency metrics)
    const cutoff = metricTimestamp - (24 * 60 * 60 * 1000);
    metric.values = metric.values.filter(v => v.timestamp > cutoff);
    
    // Check alert rules
    this.checkAlertRules(name, value, tags);
    
    // Emit metric recorded event
    this.emit('metric_recorded', {
      name,
      value,
      tags,
      timestamp: metricTimestamp
    });
  }

  /**
   * Record log entry
   */
  recordLog(level, message, metadata = {}, timestamp = null) {
    const logEntry = {
      id: this.generateLogId(),
      timestamp: timestamp || new Date(),
      level: level.toUpperCase(),
      message,
      metadata,
      service: metadata.service || 'tradeai',
      tenantId: metadata.tenantId,
      userId: metadata.userId,
      requestId: metadata.requestId,
      traceId: metadata.traceId
    };
    
    this.logs.push(logEntry);
    
    // Emit log recorded event
    this.emit('log_recorded', logEntry);
    
    // Check for error patterns
    if (level === 'error' || level === 'critical') {
      this.analyzeErrorPatterns(logEntry);
    }
    
    return logEntry.id;
  }

  /**
   * Start distributed trace
   */
  startTrace(operationName, parentTraceId = null) {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    
    const trace = {
      traceId,
      spanId,
      parentTraceId,
      operationName,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      tags: {},
      logs: [],
      status: 'active'
    };
    
    this.traces.set(traceId, trace);
    
    return {
      traceId,
      spanId,
      addTag: (key, value) => {
        trace.tags[key] = value;
      },
      addLog: (message, metadata = {}) => {
        trace.logs.push({
          timestamp: Date.now(),
          message,
          metadata
        });
      },
      finish: () => {
        trace.endTime = Date.now();
        trace.duration = trace.endTime - trace.startTime;
        trace.status = 'completed';
        
        // Record trace duration as metric
        this.recordMetric('trace.duration', trace.duration, {
          operation: operationName,
          service: trace.tags.service || 'tradeai'
        });
        
        this.emit('trace_completed', trace);
      }
    };
  }

  /**
   * Create alert
   */
  createAlert(ruleId, value, metadata = {}) {
    const rule = this.alertRules.get(ruleId);
    if (!rule || !rule.enabled) {
      return null;
    }
    
    const alertId = this.generateAlertId();
    const alert = {
      id: alertId,
      ruleId,
      ruleName: rule.name,
      severity: rule.severity,
      description: rule.description,
      value,
      threshold: rule.threshold,
      status: 'active',
      createdAt: new Date(),
      acknowledgedAt: null,
      resolvedAt: null,
      metadata,
      actions: rule.actions
    };
    
    this.alerts.set(alertId, alert);
    
    // Execute alert actions
    this.executeAlertActions(alert);
    
    // Emit alert created event
    this.emit('alert_created', alert);
    
    console.log(`Alert created: ${alert.ruleName} (${alert.severity})`);
    
    return alertId;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId, acknowledgedBy, notes = '') {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedNotes = notes;
    alert.status = 'acknowledged';
    
    this.emit('alert_acknowledged', alert);
    
    return alert;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId, resolvedBy, notes = '') {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    alert.resolvedNotes = notes;
    alert.status = 'resolved';
    
    this.emit('alert_resolved', alert);
    
    return alert;
  }

  /**
   * Get metrics
   */
  getMetrics(filters = {}) {
    const { name, tags, startTime, endTime, aggregation = 'raw' } = filters;
    let results = [];
    
    this.metrics.forEach((metric, key) => {
      // Apply name filter
      if (name && !metric.name.includes(name)) {
        return;
      }
      
      // Apply tag filters
      if (tags && !this.matchesTags(metric.tags, tags)) {
        return;
      }
      
      // Apply time range filter
      let values = metric.values;
      if (startTime || endTime) {
        values = values.filter(v => {
          if (startTime && v.timestamp < startTime) return false;
          if (endTime && v.timestamp > endTime) return false;
          return true;
        });
      }
      
      // Apply aggregation
      const aggregatedValues = this.aggregateValues(values, aggregation);
      
      results.push({
        name: metric.name,
        tags: metric.tags,
        values: aggregatedValues,
        lastValue: metric.lastValue,
        lastTimestamp: metric.lastTimestamp
      });
    });
    
    return results;
  }

  /**
   * Get logs
   */
  getLogs(filters = {}) {
    const { level, service, tenantId, startTime, endTime, search, limit = 1000 } = filters;
    
    let filteredLogs = [...this.logs];
    
    // Apply filters
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level.toUpperCase());
    }
    
    if (service) {
      filteredLogs = filteredLogs.filter(log => log.service === service);
    }
    
    if (tenantId) {
      filteredLogs = filteredLogs.filter(log => log.tenantId === tenantId);
    }
    
    if (startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= new Date(startTime));
    }
    
    if (endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= new Date(endTime));
    }
    
    if (search) {
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit
    return filteredLogs.slice(0, limit);
  }

  /**
   * Get traces
   */
  getTraces(filters = {}) {
    const { operationName, service, startTime, endTime, minDuration, maxDuration } = filters;
    let results = [];
    
    this.traces.forEach(trace => {
      // Apply operation name filter
      if (operationName && !trace.operationName.includes(operationName)) {
        return;
      }
      
      // Apply service filter
      if (service && trace.tags.service !== service) {
        return;
      }
      
      // Apply time range filter
      if (startTime && trace.startTime < startTime) return;
      if (endTime && trace.startTime > endTime) return;
      
      // Apply duration filters
      if (minDuration && trace.duration < minDuration) return;
      if (maxDuration && trace.duration > maxDuration) return;
      
      results.push(trace);
    });
    
    // Sort by start time (newest first)
    results.sort((a, b) => b.startTime - a.startTime);
    
    return results;
  }

  /**
   * Get alerts
   */
  getAlerts(filters = {}) {
    const { status, severity, ruleId, startTime, endTime } = filters;
    let results = [];
    
    this.alerts.forEach(alert => {
      // Apply status filter
      if (status && alert.status !== status) {
        return;
      }
      
      // Apply severity filter
      if (severity && alert.severity !== severity) {
        return;
      }
      
      // Apply rule filter
      if (ruleId && alert.ruleId !== ruleId) {
        return;
      }
      
      // Apply time range filter
      if (startTime && alert.createdAt < new Date(startTime)) return;
      if (endTime && alert.createdAt > new Date(endTime)) return;
      
      results.push(alert);
    });
    
    // Sort by creation time (newest first)
    results.sort((a, b) => b.createdAt - a.createdAt);
    
    return results;
  }

  /**
   * Get dashboard data
   */
  getDashboardData(dashboardId) {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }
    
    const dashboardData = {
      ...dashboard,
      widgets: dashboard.widgets.map(widget => ({
        ...widget,
        data: this.getWidgetData(widget)
      }))
    };
    
    return dashboardData;
  }

  /**
   * Get system health status
   */
  getSystemHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      checks: {},
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };
    
    // Get health check results
    this.healthChecks.forEach((check, name) => {
      health.checks[name] = {
        name: check.name,
        status: check.lastResult?.status || 'unknown',
        lastCheck: check.lastCheck,
        message: check.lastResult?.message,
        duration: check.lastResult?.duration
      };
      
      if (check.lastResult?.status === 'unhealthy') {
        health.status = 'unhealthy';
      }
    });
    
    return health;
  }

  // System monitoring methods
  collectSystemMetrics() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // CPU usage (simplified calculation)
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;
    
    // Memory usage
    const memoryUsage = (usedMem / totalMem) * 100;
    
    // Disk usage (simplified)
    const diskUsage = this.getDiskUsage();
    
    // Network I/O (mock data)
    const networkStats = this.getNetworkStats();
    
    // Record metrics
    this.recordMetric('system.cpu.usage', cpuUsage);
    this.recordMetric('system.memory.usage', memoryUsage);
    this.recordMetric('system.memory.total', totalMem);
    this.recordMetric('system.memory.used', usedMem);
    this.recordMetric('system.memory.free', freeMem);
    this.recordMetric('system.disk.usage', diskUsage);
    this.recordMetric('system.network.bytes_in', networkStats.bytesIn);
    this.recordMetric('system.network.bytes_out', networkStats.bytesOut);
    this.recordMetric('system.load.1m', os.loadavg()[0]);
    this.recordMetric('system.load.5m', os.loadavg()[1]);
    this.recordMetric('system.load.15m', os.loadavg()[2]);
  }

  collectApplicationMetrics() {
    // Application-specific metrics
    const memUsage = process.memoryUsage();
    
    this.recordMetric('app.memory.heap_used', memUsage.heapUsed);
    this.recordMetric('app.memory.heap_total', memUsage.heapTotal);
    this.recordMetric('app.memory.external', memUsage.external);
    this.recordMetric('app.memory.rss', memUsage.rss);
    this.recordMetric('app.uptime', process.uptime());
    
    // Event loop lag (simplified)
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
      this.recordMetric('app.event_loop.lag', lag);
    });
  }

  monitorMemoryUsage() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const heapUsagePercent = (heapUsedMB / heapTotalMB) * 100;
    
    if (heapUsagePercent > 85) {
      console.warn(`High memory usage detected: ${heapUsagePercent.toFixed(2)}%`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('Garbage collection triggered');
      }
    }
  }

  // Health check methods
  async checkDatabaseHealth() {
    try {
      // Mock database health check
      const start = Date.now();
      // await mongoose.connection.db.admin().ping();
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        message: 'Database connection successful',
        duration
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${error.message}`,
        duration: null
      };
    }
  }

  async checkRedisHealth() {
    try {
      // Mock Redis health check
      const start = Date.now();
      // await redisClient.ping();
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        message: 'Redis connection successful',
        duration
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Redis connection failed: ${error.message}`,
        duration: null
      };
    }
  }

  async checkExternalAPIsHealth() {
    const results = [];
    const apis = [
      { name: 'Salesforce', url: 'https://api.salesforce.com/health' },
      { name: 'Google Analytics', url: 'https://analytics.googleapis.com/health' }
    ];
    
    for (const api of apis) {
      try {
        const start = Date.now();
        // Mock API health check
        const duration = Date.now() - start;
        
        results.push({
          name: api.name,
          status: 'healthy',
          duration
        });
      } catch (error) {
        results.push({
          name: api.name,
          status: 'unhealthy',
          error: error.message
        });
      }
    }
    
    const unhealthyAPIs = results.filter(r => r.status === 'unhealthy');
    
    return {
      status: unhealthyAPIs.length === 0 ? 'healthy' : 'unhealthy',
      message: unhealthyAPIs.length === 0 ? 
        'All external APIs are healthy' : 
        `${unhealthyAPIs.length} external APIs are unhealthy`,
      details: results
    };
  }

  async checkFileSystemHealth() {
    try {
      const testFile = path.join(os.tmpdir(), 'health_check_test.txt');
      const start = Date.now();
      
      // Test write
      fs.writeFileSync(testFile, 'health check test');
      
      // Test read
      const content = fs.readFileSync(testFile, 'utf8');
      
      // Clean up
      fs.unlinkSync(testFile);
      
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        message: 'File system read/write successful',
        duration
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `File system check failed: ${error.message}`,
        duration: null
      };
    }
  }

  startHealthCheckMonitoring() {
    this.healthChecks.forEach((check, name) => {
      const runHealthCheck = async () => {
        try {
          check.lastCheck = new Date();
          check.lastResult = await check.check();
          
          // Record health check metric
          this.recordMetric(`health.${name}`, check.lastResult.status === 'healthy' ? 1 : 0);
          
          if (check.lastResult.duration) {
            this.recordMetric(`health.${name}.duration`, check.lastResult.duration);
          }
          
        } catch (error) {
          check.lastResult = {
            status: 'unhealthy',
            message: `Health check error: ${error.message}`,
            duration: null
          };
        }
      };
      
      // Run initial check
      runHealthCheck();
      
      // Schedule periodic checks
      setInterval(runHealthCheck, check.interval);
    });
  }

  // Alert methods
  checkAlertRules(metricName, value, tags) {
    this.alertRules.forEach((rule, ruleId) => {
      if (!rule.enabled) return;
      
      // Simple rule evaluation (would be more sophisticated in production)
      const shouldAlert = this.evaluateAlertCondition(rule, metricName, value, tags);
      
      if (shouldAlert) {
        // Check if alert already exists and is active
        const existingAlert = Array.from(this.alerts.values()).find(
          alert => alert.ruleId === ruleId && alert.status === 'active'
        );
        
        if (!existingAlert) {
          this.createAlert(ruleId, value, { metricName, tags });
        }
      }
    });
  }

  evaluateAlertCondition(rule, metricName, value, tags) {
    // Simplified condition evaluation
    switch (rule.id) {
      case 'high_cpu_usage':
        return metricName === 'system.cpu.usage' && value > rule.threshold;
      case 'high_memory_usage':
        return metricName === 'system.memory.usage' && value > rule.threshold;
      case 'disk_space_low':
        return metricName === 'system.disk.usage' && value > rule.threshold;
      case 'high_error_rate':
        return metricName === 'app.errors.rate' && value > rule.threshold;
      case 'slow_response_time':
        return metricName === 'app.response_time.avg' && value > rule.threshold;
      default:
        return false;
    }
  }

  executeAlertActions(alert) {
    alert.actions.forEach(action => {
      switch (action) {
        case 'email':
          this.sendEmailAlert(alert);
          break;
        case 'slack':
          this.sendSlackAlert(alert);
          break;
        case 'pagerduty':
          this.sendPagerDutyAlert(alert);
          break;
        default:
          console.log(`Unknown alert action: ${action}`);
      }
    });
  }

  sendEmailAlert(alert) {
    console.log(`Email alert sent: ${alert.ruleName} - ${alert.description}`);
    // Mock email sending
  }

  sendSlackAlert(alert) {
    console.log(`Slack alert sent: ${alert.ruleName} - ${alert.description}`);
    // Mock Slack notification
  }

  sendPagerDutyAlert(alert) {
    console.log(`PagerDuty alert sent: ${alert.ruleName} - ${alert.description}`);
    // Mock PagerDuty notification
  }

  analyzeErrorPatterns(logEntry) {
    // Simple error pattern analysis
    const recentErrors = this.logs
      .filter(log => 
        log.level === 'ERROR' && 
        log.timestamp > new Date(Date.now() - 300000) // Last 5 minutes
      )
      .length;
    
    if (recentErrors > 10) {
      this.createAlert('high_error_rate', recentErrors, {
        pattern: 'high_frequency_errors',
        timeWindow: '5_minutes'
      });
    }
  }

  // Utility methods
  generateMetricKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
    
    return tagString ? `${name}|${tagString}` : name;
  }

  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSpanId() {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  matchesTags(metricTags, filterTags) {
    return Object.entries(filterTags).every(([key, value]) => 
      metricTags[key] === value
    );
  }

  aggregateValues(values, aggregation) {
    if (aggregation === 'raw' || values.length === 0) {
      return values;
    }
    
    const nums = values.map(v => v.value);
    
    switch (aggregation) {
      case 'avg':
        return [{ 
          value: nums.reduce((a, b) => a + b, 0) / nums.length,
          timestamp: values[values.length - 1].timestamp
        }];
      case 'sum':
        return [{ 
          value: nums.reduce((a, b) => a + b, 0),
          timestamp: values[values.length - 1].timestamp
        }];
      case 'min':
        return [{ 
          value: Math.min(...nums),
          timestamp: values[values.length - 1].timestamp
        }];
      case 'max':
        return [{ 
          value: Math.max(...nums),
          timestamp: values[values.length - 1].timestamp
        }];
      default:
        return values;
    }
  }

  getWidgetData(widget) {
    switch (widget.type) {
      case 'gauge':
        const gaugeMetrics = this.getMetrics({ name: widget.metric });
        return gaugeMetrics.length > 0 ? gaugeMetrics[0].lastValue : 0;
      
      case 'line_chart':
        const metrics = Array.isArray(widget.metrics) ? widget.metrics : [widget.metric];
        return metrics.map(metric => {
          const metricData = this.getMetrics({ name: metric });
          return {
            name: metric,
            data: metricData.length > 0 ? metricData[0].values : []
          };
        });
      
      case 'counter':
        const counterMetrics = this.getMetrics({ name: widget.metric });
        return counterMetrics.length > 0 ? counterMetrics[0].lastValue : 0;
      
      default:
        return null;
    }
  }

  getDiskUsage() {
    // Mock disk usage calculation
    return Math.random() * 100;
  }

  getNetworkStats() {
    // Mock network statistics
    return {
      bytesIn: Math.floor(Math.random() * 1000000),
      bytesOut: Math.floor(Math.random() * 1000000)
    };
  }

  startBackgroundTasks() {
    // Clean up old logs
    setInterval(() => {
      this.cleanupOldLogs();
    }, 60 * 60 * 1000); // Every hour
    
    // Clean up old metrics
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000); // Every hour
    
    // Clean up old traces
    setInterval(() => {
      this.cleanupOldTraces();
    }, 60 * 60 * 1000); // Every hour
    
    console.log('Background cleanup tasks started');
  }

  cleanupOldLogs() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.logRetentionDays);
    
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > cutoff);
    
    const removedCount = initialCount - this.logs.length;
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} old log entries`);
    }
  }

  cleanupOldMetrics() {
    const cutoff = Date.now() - (this.metricsRetentionDays * 24 * 60 * 60 * 1000);
    
    let totalRemoved = 0;
    this.metrics.forEach((metric, key) => {
      const initialCount = metric.values.length;
      metric.values = metric.values.filter(v => v.timestamp > cutoff);
      totalRemoved += initialCount - metric.values.length;
    });
    
    if (totalRemoved > 0) {
      console.log(`Cleaned up ${totalRemoved} old metric values`);
    }
  }

  cleanupOldTraces() {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    
    let removedCount = 0;
    this.traces.forEach((trace, traceId) => {
      if (trace.startTime < cutoff) {
        this.traces.delete(traceId);
        removedCount++;
      }
    });
    
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} old traces`);
    }
  }
}

module.exports = MonitoringObservabilityService;