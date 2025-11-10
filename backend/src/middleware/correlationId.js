const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Correlation ID Middleware
 * Adds a unique correlation ID to each request for tracking across services
 */
const correlationIdMiddleware = (req, res, next) => {
  // Check if correlation ID already exists in headers (from upstream services)
  const correlationId = req.headers['x-correlation-id'] || 
                       req.headers['x-request-id'] || 
                       uuidv4();
  
  // Attach to request object
  req.correlationId = correlationId;
  
  // Add to response headers
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Track request start time
  req.startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming Request', {
    correlationId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  // Intercept response to log duration
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - req.startTime;
    
    logger.info('Outgoing Response', {
      correlationId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?._id,
      companyId: req.user?.companyId
    });
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = correlationIdMiddleware;
