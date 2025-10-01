const Joi = require('joi');

// Common validation schemas
const commonSchemas = {
  // MongoDB ObjectId validation
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format'),
  
  // Email validation
  email: Joi.string().email().lowercase().trim(),
  
  // Password validation
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .message('Password must contain at least 8 characters with uppercase, lowercase, number and special character'),
  
  // Date validation
  date: Joi.date().iso(),
  
  // Pagination
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  },
  
  // Common filters
  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  }),
};

// Authentication schemas
const authSchemas = {
  login: Joi.object({
    email: commonSchemas.email.required(),
    password: Joi.string().required(),
  }),
  
  register: Joi.object({
    email: commonSchemas.email.required(),
    password: commonSchemas.password.required(),
    firstName: Joi.string().trim().min(1).max(50).required(),
    lastName: Joi.string().trim().min(1).max(50).required(),
    companyId: commonSchemas.objectId.required(),
    role: Joi.string().valid('admin', 'manager', 'user').default('user'),
  }),
  
  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

// Promotion schemas
const promotionSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    description: Joi.string().trim().max(500).allow(''),
    type: Joi.string().valid('discount', 'rebate', 'volume_incentive', 'display_allowance').required(),
    period: Joi.object({
      startDate: commonSchemas.date.required(),
      endDate: commonSchemas.date.min(Joi.ref('startDate')).required(),
    }).required(),
    budget: Joi.number().positive().precision(2).required(),
    products: Joi.array().items(commonSchemas.objectId).min(1).required(),
    customer: commonSchemas.objectId.required(),
    terms: Joi.object({
      discountPercentage: Joi.number().min(0).max(100),
      minimumQuantity: Joi.number().integer().min(1),
      maximumQuantity: Joi.number().integer().min(Joi.ref('minimumQuantity')),
      rebateAmount: Joi.number().positive(),
    }),
  }),
  
  update: Joi.object({
    name: Joi.string().trim().min(1).max(100),
    description: Joi.string().trim().max(500).allow(''),
    status: Joi.string().valid('draft', 'active', 'completed', 'cancelled'),
    budget: Joi.number().positive().precision(2),
    actualSpend: Joi.number().min(0).precision(2),
    terms: Joi.object({
      discountPercentage: Joi.number().min(0).max(100),
      minimumQuantity: Joi.number().integer().min(1),
      maximumQuantity: Joi.number().integer().min(Joi.ref('minimumQuantity')),
      rebateAmount: Joi.number().positive(),
    }),
  }),
  
  list: Joi.object({
    ...commonSchemas.pagination,
    status: Joi.string().valid('draft', 'active', 'completed', 'cancelled'),
    type: Joi.string().valid('discount', 'rebate', 'volume_incentive', 'display_allowance'),
    startDate: commonSchemas.date,
    endDate: commonSchemas.date,
    customer: commonSchemas.objectId,
    product: commonSchemas.objectId,
  }),
};

// Budget schemas
const budgetSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    description: Joi.string().trim().max(500).allow(''),
    year: Joi.number().integer().min(2020).max(2030).required(),
    totalAmount: Joi.number().positive().precision(2).required(),
    categories: Joi.array().items(Joi.object({
      name: Joi.string().trim().min(1).max(50).required(),
      amount: Joi.number().positive().precision(2).required(),
      percentage: Joi.number().min(0).max(100),
    })).min(1).required(),
  }),
  
  update: Joi.object({
    name: Joi.string().trim().min(1).max(100),
    description: Joi.string().trim().max(500).allow(''),
    totalAmount: Joi.number().positive().precision(2),
    allocatedAmount: Joi.number().min(0).precision(2),
    categories: Joi.array().items(Joi.object({
      name: Joi.string().trim().min(1).max(50).required(),
      amount: Joi.number().positive().precision(2).required(),
      percentage: Joi.number().min(0).max(100),
    })),
  }),
};

// Analytics schemas
const analyticsSchemas = {
  dashboard: Joi.object({
    period: Joi.string().valid('7days', '30days', '90days', '1year').default('30days'),
  }),
  
  advanced: Joi.object({
    metrics: Joi.array().items(Joi.string().valid('roi', 'lift', 'efficiency')).default(['roi', 'lift', 'efficiency']),
    dimensions: Joi.array().items(Joi.string().valid('product', 'channel', 'region')).default(['product', 'channel', 'region']),
    dateRange: commonSchemas.dateRange.required(),
    filters: Joi.object({
      productCategory: Joi.array().items(Joi.string()),
      channel: Joi.array().items(Joi.string()),
      region: Joi.array().items(Joi.string()),
    }).default({}),
  }),
  
  predictions: Joi.object({
    type: Joi.string().valid('sales', 'budget', 'promotion_performance').required(),
    targetId: commonSchemas.objectId.required(),
    horizon: Joi.number().integer().min(1).max(365).required(),
    features: Joi.object().default({}),
  }),
};

// Report schemas
const reportSchemas = {
  generate: Joi.object({
    reportType: Joi.string().valid('comprehensive', 'promotion', 'budget', 'sales').required(),
    dateRange: commonSchemas.dateRange.required(),
    filters: Joi.object().default({}),
  }),
  
  custom: Joi.object({
    reportName: Joi.string().trim().min(1).max(100).required(),
    metrics: Joi.array().items(Joi.string()).min(1).required(),
    dimensions: Joi.array().items(Joi.string()).min(1).required(),
    filters: Joi.object().default({}),
    dateRange: commonSchemas.dateRange,
    visualizations: Joi.array().items(Joi.string()).default([]),
    format: Joi.string().valid('excel', 'pdf', 'json').default('excel'),
  }),
  
  schedule: Joi.object({
    reportType: Joi.string().valid('comprehensive', 'promotion', 'budget', 'sales').required(),
    schedule: Joi.string().pattern(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/)
      .message('Invalid cron expression').required(),
    recipients: Joi.array().items(commonSchemas.email).min(1).required(),
    filters: Joi.object().default({}),
    format: Joi.string().valid('excel', 'pdf').default('excel'),
  }),
};

// Monitoring schemas
const monitoringSchemas = {
  alerts: Joi.object({
    status: Joi.string().valid('active', 'resolved'),
    type: Joi.string(),
    priority: Joi.string().valid('critical', 'warning', 'info'),
  }),
  
  setupAlerts: Joi.object({
    alertConfigs: Joi.array().items(Joi.object({
      name: Joi.string().trim().min(1).max(100).required(),
      type: Joi.string().required(),
      condition: Joi.object({
        metric: Joi.string().required(),
        operator: Joi.string().valid('greater_than', 'less_than', 'equals', 'greater_than_or_equal', 'less_than_or_equal').required(),
        threshold: Joi.number().required(),
      }).required(),
      priority: Joi.string().valid('critical', 'warning', 'info').required(),
      actions: Joi.array().items(Joi.string().valid('email', 'websocket', 'sms', 'slack')).min(1).required(),
      cooldown: Joi.number().integer().min(60000).default(3600000), // Default 1 hour
      enabled: Joi.boolean().default(true),
    })).min(1).required(),
  }),
  
  triggerCheck: Joi.object({
    alertType: Joi.string(),
  }),
};

// Validation middleware factory
const createValidationMiddleware = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : 
                  source === 'params' ? req.params : req.body;
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    
    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Replace the original data with validated and sanitized data
    if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }
    
    next();
  };
};

// Validation helpers
const validationHelpers = {
  // Validate ObjectId
  isValidObjectId: (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },
  
  // Validate email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validate date range
  isValidDateRange: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  },
  
  // Sanitize string
  sanitizeString: (str) => {
    return str.trim().replace(/[<>]/g, '');
  },
  
  // Validate pagination parameters
  validatePagination: (page, limit) => {
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    return { page: validPage, limit: validLimit };
  },
};

// Export all schemas and utilities
module.exports = {
  schemas: {
    common: commonSchemas,
    auth: authSchemas,
    promotion: promotionSchemas,
    budget: budgetSchemas,
    analytics: analyticsSchemas,
    report: reportSchemas,
    monitoring: monitoringSchemas,
  },
  createValidationMiddleware,
  validationHelpers,
  
  // Convenience middleware functions
  validateAuth: {
    login: createValidationMiddleware(authSchemas.login),
    register: createValidationMiddleware(authSchemas.register),
    refreshToken: createValidationMiddleware(authSchemas.refreshToken),
  },
  
  validatePromotion: {
    create: createValidationMiddleware(promotionSchemas.create),
    update: createValidationMiddleware(promotionSchemas.update),
    list: createValidationMiddleware(promotionSchemas.list, 'query'),
  },
  
  validateBudget: {
    create: createValidationMiddleware(budgetSchemas.create),
    update: createValidationMiddleware(budgetSchemas.update),
  },
  
  validateAnalytics: {
    dashboard: createValidationMiddleware(analyticsSchemas.dashboard, 'query'),
    advanced: createValidationMiddleware(analyticsSchemas.advanced, 'query'),
    predictions: createValidationMiddleware(analyticsSchemas.predictions),
  },
  
  validateReport: {
    generate: createValidationMiddleware(reportSchemas.generate),
    custom: createValidationMiddleware(reportSchemas.custom),
    schedule: createValidationMiddleware(reportSchemas.schedule),
  },
  
  validateMonitoring: {
    alerts: createValidationMiddleware(monitoringSchemas.alerts, 'query'),
    setupAlerts: createValidationMiddleware(monitoringSchemas.setupAlerts),
    triggerCheck: createValidationMiddleware(monitoringSchemas.triggerCheck),
  },
};