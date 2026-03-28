/**
 * Production Monitoring & Alerting Setup
 * Cloudflare Workers Analytics and Monitoring Configuration
 */

export const monitoringConfig = {
  // ============================================================================
  // Error Tracking
  // ============================================================================
  errors: {
    enabled: true,
    trackTypes: [
      'TypeError',
      'ReferenceError',
      'SyntaxError',
      'RangeError',
      'NetworkError',
      'DatabaseError',
      'AuthenticationError',
      'AuthorizationError',
    ],
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
    sampleRate: 1.0,
    attachUserContext: true,
    attachRequestContext: true,
  },

  // ============================================================================
  // Performance Monitoring
  // ============================================================================
  performance: {
    enabled: true,
    metrics: {
      responseTime: {
        enabled: true,
        thresholds: { good: 100, needsImprovement: 300, poor: 1000 },
      },
      dbQueryTime: {
        enabled: true,
        thresholds: { good: 50, needsImprovement: 200, poor: 500 },
      },
    },
    sampleRate: 0.1,
  },

  // ============================================================================
  // Alerting Rules
  // ============================================================================
  alerts: {
    errorRate: {
      enabled: true,
      rules: [
        {
          name: 'High Error Rate',
          condition: 'error_rate > 0.05',
          severity: 'critical',
          channels: ['slack', 'pagerduty', 'email'],
        },
        {
          name: 'Elevated Error Rate',
          condition: 'error_rate > 0.01',
          severity: 'warning',
          channels: ['slack'],
        },
      ],
    },
    performance: {
      enabled: true,
      rules: [
        {
          name: 'Slow Response Time',
          condition: 'p95_response_time > 1000',
          severity: 'warning',
          channels: ['slack'],
        },
        {
          name: 'Very Slow Response Time',
          condition: 'p95_response_time > 3000',
          severity: 'critical',
          channels: ['slack', 'pagerduty'],
        },
      ],
    },
    availability: {
      enabled: true,
      rules: [
        {
          name: 'Service Down',
          condition: 'availability < 0.99',
          severity: 'critical',
          channels: ['slack', 'pagerduty', 'email'],
          window: '5m',
        },
      ],
    },
  },

  // ============================================================================
  // Notification Channels
  // ============================================================================
  notifications: {
    slack: {
      enabled: true,
      webhook: process.env.SLACK_WEBHOOK_URL,
      channel: '#tradeai-alerts',
      mentionOnCritical: '@channel',
    },
    pagerduty: {
      enabled: false,
      routingKey: process.env.PAGERDUTY_ROUTING_KEY,
    },
    email: {
      enabled: false,
      recipients: ['ops@vantax.co.za'],
    },
  },
};

export default monitoringConfig;
