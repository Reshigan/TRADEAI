const Sentry = require('@sentry/node');
const logger = require('../utils/logger');

let sentryInitialized = false;

function initSentry(app) {
  // Check if Sentry is enabled
  const sentryEnabled = process.env.SENTRY_ENABLED === 'true';
  const sentryDSN = process.env.SENTRY_DSN;

  if (!sentryEnabled) {
    logger.info('⚠️  Sentry error tracking disabled (SENTRY_ENABLED=false)');
    return false;
  }

  if (!sentryDSN || sentryDSN.includes('[REPLACE')) {
    logger.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    logger.info('💡 To enable Sentry: Set SENTRY_DSN in your .env file');
    return false;
  }

  try {
    Sentry.init({
      dsn: sentryDSN,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      release: process.env.SENTRY_RELEASE || process.env.npm_package_version || '1.0.0',

      // Performance monitoring
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,

      // Enhanced integrations
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        new Sentry.Integrations.OnUncaughtException(),
        new Sentry.Integrations.OnUnhandledRejection(),
        new Sentry.Integrations.LinkedErrors(),
        new Sentry.Integrations.ContextLines(),
      ],

      // Filter sensitive data
      beforeSend(event, hint) {
        // Don't send errors from health checks
        if (event.request && event.request.url) {
          if (event.request.url.includes('/health') || 
              event.request.url.includes('/api/health')) {
            return null;
          }
        }

        // Sanitize sensitive headers
        if (event.request && event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
          delete event.request.headers['x-api-key'];
        }

        // Sanitize request body
        if (event.request && event.request.data) {
          // Don't send passwords or tokens
          const sanitized = JSON.parse(JSON.stringify(event.request.data));
          if (sanitized.password) sanitized.password = '[REDACTED]';
          if (sanitized.token) sanitized.token = '[REDACTED]';
          if (sanitized.apiKey) sanitized.apiKey = '[REDACTED]';
          if (sanitized.secret) sanitized.secret = '[REDACTED]';
          event.request.data = sanitized;
        }

        return event;
      },

      // Don't capture specific errors
      ignoreErrors: [
        // Validation errors (expected user errors)
        'ValidationError',
        'CastError',
        // Network timeouts
        /timeout/i,
        /timed out/i,
        // Client disconnects
        /ECONNRESET/,
        /ECONNREFUSED/,
        // JWT errors (handled separately)
        'JsonWebTokenError',
        'TokenExpiredError',
        // Rate limiting (not errors)
        'Too many requests',
      ],

      // Configure which errors to send
      ignoreTransactions: [
        '/health',
        '/api/health',
        '/favicon.ico'
      ],

      // Add context to all events
      initialScope: {
        tags: {
          service: 'tradeai-backend',
          version: process.env.npm_package_version || '1.0.0',
          node_version: process.version
        }
      }
    });

    sentryInitialized = true;
    logger.info('✅ Sentry error tracking initialized');
    logger.info(`📊 Sentry environment: ${process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV}`);
    return true;

  } catch (error) {
    logger.error('❌ Failed to initialize Sentry:', error.message);
    return false;
  }
}

// Capture exception manually
function captureException(error, context = {}) {
  if (!sentryInitialized) {
    logger.error('Sentry not initialized, logging error instead:', error);
    return;
  }

  Sentry.withScope((scope) => {
    // Add extra context
    if (context.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email,
        username: context.user.username,
        tenantId: context.user.tenantId
      });
    }

    if (context.tenant) {
      scope.setTag('tenant', context.tenant);
    }

    if (context.extra) {
      Object.keys(context.extra).forEach(key => {
        scope.setExtra(key, context.extra[key]);
      });
    }

    Sentry.captureException(error);
  });
}

// Capture message manually
function captureMessage(message, level = 'info', context = {}) {
  if (!sentryInitialized) {
    logger.log(level, message);
    return;
  }

  Sentry.withScope((scope) => {
    if (context.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email,
        tenantId: context.user.tenantId
      });
    }

    if (context.extra) {
      Object.keys(context.extra).forEach(key => {
        scope.setExtra(key, context.extra[key]);
      });
    }

    Sentry.captureMessage(message, level);
  });
}

// Add breadcrumb
function addBreadcrumb(breadcrumb) {
  if (sentryInitialized) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}

// Set user context
function setUser(user) {
  if (sentryInitialized && user) {
    Sentry.setUser({
      id: user.id || user._id,
      email: user.email,
      username: user.username,
      tenantId: user.tenantId
    });
  }
}

// Clear user context
function clearUser() {
  if (sentryInitialized) {
    Sentry.setUser(null);
  }
}

// Get Sentry handlers for Express
function getHandlers() {
  if (!sentryInitialized) {
    // Return no-op middleware if Sentry is not initialized
    return {
      requestHandler: (req, res, next) => next(),
      tracingHandler: (req, res, next) => next(),
      errorHandler: (err, req, res, next) => next(err)
    };
  }

  return {
    requestHandler: Sentry.Handlers.requestHandler(),
    tracingHandler: Sentry.Handlers.tracingHandler(),
    errorHandler: Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Only capture 5xx errors, not 4xx validation errors
        const statusCode = error.status || error.statusCode || 500;
        return statusCode >= 500;
      }
    })
  };
}

module.exports = {
  initSentry,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  clearUser,
  getHandlers,
  Sentry
};
