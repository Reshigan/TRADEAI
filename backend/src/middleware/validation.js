const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    // Log validation errors for debugging
    console.error('Validation Errors:', JSON.stringify(errorMessages, null, 2));
    console.error('Request Body:', JSON.stringify(req.body, null, 2));

    throw new AppError(
      `Validation failed: ${errorMessages.map((e) => `${e.field}: ${e.message}`).join(', ')}`,
      400,
      'VALIDATION_ERROR',
      errorMessages
    );
  }

  next();
};

// Custom validators
const customValidators = {
  // Check if value is a valid MongoDB ObjectId
  isObjectId: (value) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(value);
  },

  // Check if date is in the future
  isFutureDate: (value) => {
    return new Date(value) > new Date();
  },

  // Check if date is in the past
  isPastDate: (value) => {
    return new Date(value) < new Date();
  },

  // Check if value is within range
  isInRange: (value, { min, max }) => {
    return value >= min && value <= max;
  },

  // Check if array has unique values
  hasUniqueValues: (array) => {
    return new Set(array).size === array.length;
  },

  // Check if percentage is valid (0-100)
  isValidPercentage: (value) => {
    return value >= 0 && value <= 100;
  },

  // Check if currency code is valid
  isValidCurrency: (value) => {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR'];
    return validCurrencies.includes(value);
  },

  // Check if email domain is allowed
  isAllowedEmailDomain: (email, allowedDomains) => {
    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
  },

  // Check if phone number is valid
  isValidPhone: (value) => {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(value);
  },

  // Check if hierarchy level is valid
  isValidHierarchyLevel: (value) => {
    return value >= 1 && value <= 5;
  },

  // Check if date range is valid
  isValidDateRange: (startDate, endDate) => {
    return new Date(startDate) < new Date(endDate);
  },

  // Check if promotion discount is valid
  isValidDiscount: (value, maxDiscount) => {
    return value > 0 && value <= maxDiscount;
  }
};

// Sanitizers
const sanitizers = {
  // Trim and normalize whitespace
  normalizeString: (value) => {
    return value ? value.trim().replace(/\s+/g, ' ') : value;
  },

  // Convert to uppercase
  toUpperCase: (value) => {
    return value ? value.toUpperCase() : value;
  },

  // Remove special characters
  removeSpecialChars: (value) => {
    return value ? value.replace(/[^a-zA-Z0-9\s]/g, '') : value;
  },

  // Sanitize file name
  sanitizeFileName: (value) => {
    return value ? value.replace(/[^a-zA-Z0-9.-]/g, '_') : value;
  },

  // Round to decimal places
  roundToDecimal: (value, places = 2) => {
    return Math.round(value * Math.pow(10, places)) / Math.pow(10, places);
  }
};

// Common validation chains
const commonValidations = {
  // Pagination
  pagination: {
    page: {
      in: ['query'],
      optional: true,
      isInt: { options: { min: 1 } },
      toInt: true,
      errorMessage: 'Page must be a positive integer'
    },
    limit: {
      in: ['query'],
      optional: true,
      isInt: { options: { min: 1, max: 100 } },
      toInt: true,
      errorMessage: 'Limit must be between 1 and 100'
    },
    sort: {
      in: ['query'],
      optional: true,
      isString: true,
      matches: {
        options: [/^-?[a-zA-Z_]+$/],
        errorMessage: 'Invalid sort format'
      }
    }
  },

  // Date range
  dateRange: {
    startDate: {
      in: ['query', 'body'],
      optional: true,
      isISO8601: true,
      toDate: true,
      errorMessage: 'Invalid start date format'
    },
    endDate: {
      in: ['query', 'body'],
      optional: true,
      isISO8601: true,
      toDate: true,
      errorMessage: 'Invalid end date format',
      custom: {
        options: (value, { req }) => {
          if (req.query.startDate || req.body.startDate) {
            const startDate = req.query.startDate || req.body.startDate;
            return new Date(value) > new Date(startDate);
          }
          return true;
        },
        errorMessage: 'End date must be after start date'
      }
    }
  },

  // MongoDB ObjectId
  objectId: (field) => ({
    [field]: {
      in: ['params', 'body', 'query'],
      custom: {
        options: customValidators.isObjectId,
        errorMessage: `Invalid ${field} format`
      }
    }
  })
};

// Request sanitizer middleware
const sanitizeRequest = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizers.normalizeString(req.body[key]);
      }
    });
  }

  // Sanitize query
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizers.normalizeString(req.query[key]);
      }
    });
  }

  next();
};

module.exports = {
  validate,
  customValidators,
  sanitizers,
  commonValidations,
  sanitizeRequest
};
