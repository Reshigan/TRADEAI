const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Custom format for console
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Create transports
const transports = [];

// Console transport
if (config.logging.transports.includes('console')) {
  transports.push(
    new winston.transports.Console({
      format: config.env === 'development' ? consoleFormat : logFormat,
      level: config.logging.level
    })
  );
}

// File transport
if (config.logging.transports.includes('file')) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: config.logging.file.maxsize,
      maxFiles: config.logging.file.maxFiles
    })
  );

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: logFormat,
      maxsize: config.logging.file.maxsize,
      maxFiles: config.logging.file.maxFiles
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false
});

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Helper functions for structured logging
logger.logRequest = (req, additionalInfo = {}) => {
  logger.info('API Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?._id,
    ...additionalInfo
  });
};

logger.logResponse = (req, res, additionalInfo = {}) => {
  logger.info('API Response', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: res.responseTime,
    userId: req.user?._id,
    ...additionalInfo
  });
};

logger.logError = (error, req = null, additionalInfo = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    code: error.code,
    ...additionalInfo
  };

  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.user?._id
    };
  }

  logger.error('Application Error', errorInfo);
};

logger.logAudit = (action, userId, details = {}) => {
  logger.info('Audit Log', {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

logger.logPerformance = (operation, duration, details = {}) => {
  logger.info('Performance Log', {
    operation,
    duration,
    ...details
  });
};

logger.logIntegration = (system, action, status, details = {}) => {
  logger.info('Integration Log', {
    system,
    action,
    status,
    timestamp: new Date().toISOString(),
    ...details
  });
};

module.exports = logger;
