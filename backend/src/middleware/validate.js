/**
 * Validation Middleware
 * Validates request data against Joi schemas
 */

const { ValidationError } = require('../utils/errors');

/**
 * Validate request data against Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just the first
      stripUnknown: true, // Remove unknown fields
      convert: true, // Convert types (e.g., string to number)
      presence: 'optional' // Allow undefined values for optional fields
    });

    if (error) {
      // Format validation errors
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
        type: detail.type
      }));

      // Throw validation error
      return next(new ValidationError('Validation failed', errors));
    }

    // Replace request data with validated/sanitized data
    req[property] = value;

    // Attach validated flag for debugging
    req.validated = req.validated || {};
    req.validated[property] = true;

    next();
  };
};

/**
 * Validate multiple properties
 * @param {Object} schemas - Object with schema for each property
 * @returns {Function} Express middleware function
 */
const validateMultiple = (schemas) => {
  return (req, res, next) => {
    const allErrors = [];

    // Validate each property
    for (const [property, schema] of Object.entries(schemas)) {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: `${property}.${detail.path.join('.')}`,
          message: detail.message.replace(/"/g, ''),
          type: detail.type
        }));
        allErrors.push(...errors);
      } else {
        req[property] = value;
      }
    }

    if (allErrors.length > 0) {
      return next(new ValidationError('Validation failed', allErrors));
    }

    next();
  };
};

/**
 * Sanitize input to prevent XSS
 * @param {string} property - Request property to sanitize
 * @returns {Function} Express middleware function
 */
const sanitize = (property = 'body') => {
  return (req, res, next) => {
    if (!req[property]) {
      return next();
    }

    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
        // Remove HTML tags
        value = value.replace(/<[^>]*>/g, '');
        // Remove script tags specifically
        value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        // Trim whitespace
        value = value.trim();
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize objects
        for (const key in value) {
          value[key] = sanitizeValue(value[key]);
        }
      }
      return value;
    };

    req[property] = sanitizeValue(req[property]);
    next();
  };
};

/**
 * Validate file upload
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware function
 */
const validateFile = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    required = false
  } = options;

  return (req, res, next) => {
    const file = req.file || req.files;

    if (!file && required) {
      return next(new ValidationError('File is required'));
    }

    if (!file) {
      return next();
    }

    // Handle single file
    if (req.file) {
      if (req.file.size > maxSize) {
        return next(new ValidationError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`));
      }

      if (!allowedTypes.includes(req.file.mimetype)) {
        return next(new ValidationError(`File type ${req.file.mimetype} is not allowed`));
      }
    }

    // Handle multiple files
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file.size > maxSize) {
          return next(new ValidationError(`File ${file.originalname} exceeds ${maxSize / 1024 / 1024}MB limit`));
        }

        if (!allowedTypes.includes(file.mimetype)) {
          return next(new ValidationError(`File type ${file.mimetype} is not allowed`));
        }
      }
    }

    next();
  };
};

module.exports = {
  validate,
  validateMultiple,
  sanitize,
  validateFile
};
