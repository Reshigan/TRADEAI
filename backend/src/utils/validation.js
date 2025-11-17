/**
 * Data validation utilities for Trade AI platform
 * Provides comprehensive validation functions for various data types
 */

const validator = require('validator');

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return validator.isEmail(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with status and message
 */
const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      message: 'Password is required'
    };
  }

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const strength = passed / Object.keys(checks).length;

  let message = '';
  let valid = true;

  if (!checks.length) {
    message = 'Password must be at least 8 characters long';
    valid = false;
  } else if (!checks.uppercase) {
    message = 'Password must contain at least one uppercase letter';
    valid = false;
  } else if (!checks.lowercase) {
    message = 'Password must contain at least one lowercase letter';
    valid = false;
  } else if (!checks.number) {
    message = 'Password must contain at least one number';
    valid = false;
  } else if (!checks.special) {
    message = 'Password must contain at least one special character';
    valid = false;
  }

  return {
    valid,
    message,
    strength: strength * 100, // percentage
    checks
  };
};

/**
 * Validate date format and range
 * @param {string} date - Date to validate
 * @param {Object} options - Validation options
 * @returns {boolean} - Whether date is valid
 */
const isValidDate = (date, options = {}) => {
  if (!date) return false;

  try {
    // Check if date is in valid format
    if (!validator.isISO8601(date)) return false;

    const dateObj = new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) return false;

    // Check min date
    if (options.min && dateObj < new Date(options.min)) return false;

    // Check max date
    if (options.max && dateObj > new Date(options.max)) return false;

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate numeric value
 * @param {number|string} value - Value to validate
 * @param {Object} options - Validation options
 * @returns {boolean} - Whether value is valid
 */
const isValidNumber = (value, options = {}) => {
  if (value === undefined || value === null) return false;

  // Convert to string if it's a number
  const strValue = typeof value === 'number' ? String(value) : value;

  // Check if it's a valid number
  if (!validator.isNumeric(strValue)) return false;

  const numValue = parseFloat(strValue);

  // Check min value
  if (options.min !== undefined && numValue < options.min) return false;

  // Check max value
  if (options.max !== undefined && numValue > options.max) return false;

  // Check if integer is required
  if (options.integer && !Number.isInteger(numValue)) return false;

  return true;
};

/**
 * Validate string length and content
 * @param {string} value - String to validate
 * @param {Object} options - Validation options
 * @returns {boolean} - Whether string is valid
 */
const isValidString = (value, options = {}) => {
  if (!value || typeof value !== 'string') return false;

  // Check min length
  if (options.minLength !== undefined && value.length < options.minLength) return false;

  // Check max length
  if (options.maxLength !== undefined && value.length > options.maxLength) return false;

  // Check if alphanumeric only
  if (options.alphanumeric && !validator.isAlphanumeric(value)) return false;

  // Check if alphabetic only
  if (options.alpha && !validator.isAlpha(value)) return false;

  // Check against regex pattern
  if (options.pattern && !options.pattern.test(value)) return false;

  return true;
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @returns {boolean} - Whether URL is valid
 */
const isValidUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string') return false;

  const urlOptions = {
    protocols: options.protocols || ['http', 'https'],
    require_protocol: options.requireProtocol !== false,
    require_valid_protocol: true,
    require_host: true,
    require_tld: options.requireTld !== false,
    allow_underscores: options.allowUnderscores || false,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: options.allowProtocolRelativeUrls || false
  };

  return validator.isURL(url, urlOptions);
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @param {string} locale - Locale for validation
 * @returns {boolean} - Whether phone number is valid
 */
const isValidPhone = (phone, locale = 'any') => {
  if (!phone || typeof phone !== 'string') return false;
  return validator.isMobilePhone(phone, locale);
};

/**
 * Validate postal code
 * @param {string} postalCode - Postal code to validate
 * @param {string} countryCode - Country code for validation
 * @returns {boolean} - Whether postal code is valid
 */
const isValidPostalCode = (postalCode, countryCode = 'any') => {
  if (!postalCode || typeof postalCode !== 'string') return false;
  return validator.isPostalCode(postalCode, countryCode);
};

/**
 * Validate credit card number
 * @param {string} cardNumber - Credit card number to validate
 * @returns {boolean} - Whether credit card number is valid
 */
const isValidCreditCard = (cardNumber) => {
  if (!cardNumber || typeof cardNumber !== 'string') return false;
  return validator.isCreditCard(cardNumber);
};

/**
 * Validate object against schema
 * @param {Object} data - Object to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} - Validation result with errors
 */
const validateObject = (data, schema) => {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }

    // Skip validation for undefined optional fields
    if (value === undefined || value === null) {
      continue;
    }

    // Validate by type
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors[field] = `${field} must be a string`;
        } else if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors[field] = `${field} must be at least ${rules.minLength} characters`;
        } else if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors[field] = `${field} must be at most ${rules.maxLength} characters`;
        } else if (rules.pattern && !rules.pattern.test(value)) {
          errors[field] = rules.patternMessage || `${field} has an invalid format`;
        }
        break;

      case 'number':
        if (typeof value !== 'number' && (typeof value !== 'string' || !validator.isNumeric(value))) {
          errors[field] = `${field} must be a number`;
        } else {
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          if (rules.min !== undefined && numValue < rules.min) {
            errors[field] = `${field} must be at least ${rules.min}`;
          } else if (rules.max !== undefined && numValue > rules.max) {
            errors[field] = `${field} must be at most ${rules.max}`;
          } else if (rules.integer && !Number.isInteger(numValue)) {
            errors[field] = `${field} must be an integer`;
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors[field] = `${field} must be a boolean`;
        }
        break;

      case 'date':
        if (!isValidDate(value, rules)) {
          errors[field] = `${field} must be a valid date`;
          if (rules.min) {
            errors[field] += ` after ${rules.min}`;
          }
          if (rules.max) {
            errors[field] += ` before ${rules.max}`;
          }
        }
        break;

      case 'email':
        if (!isValidEmail(value)) {
          errors[field] = `${field} must be a valid email address`;
        }
        break;

      case 'url':
        if (!isValidUrl(value, rules)) {
          errors[field] = `${field} must be a valid URL`;
        }
        break;

      case 'phone':
        if (!isValidPhone(value, rules.locale)) {
          errors[field] = `${field} must be a valid phone number`;
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors[field] = `${field} must be an array`;
        } else if (rules.minItems !== undefined && value.length < rules.minItems) {
          errors[field] = `${field} must contain at least ${rules.minItems} items`;
        } else if (rules.maxItems !== undefined && value.length > rules.maxItems) {
          errors[field] = `${field} must contain at most ${rules.maxItems} items`;
        } else if (rules.itemType && rules.itemSchema) {
          // Validate each item in the array
          const itemErrors = value.map((item, index) => {
            if (rules.itemType === 'object') {
              const itemValidation = validateObject(item, rules.itemSchema);
              return itemValidation.valid ? null : { index, errors: itemValidation.errors };
            } else {
              // Validate primitive types
              const itemValid = validatePrimitiveType(item, rules.itemType, rules);
              return itemValid ? null : { index, error: `Item at index ${index} is invalid` };
            }
          }).filter(Boolean);

          if (itemErrors.length > 0) {
            errors[field] = { items: itemErrors };
          }
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          errors[field] = `${field} must be an object`;
        } else if (rules.schema) {
          // Validate nested object
          const nestedValidation = validateObject(value, rules.schema);
          if (!nestedValidation.valid) {
            errors[field] = nestedValidation.errors;
          }
        }
        break;

      case 'enum':
        if (!rules.values.includes(value)) {
          errors[field] = `${field} must be one of: ${rules.values.join(', ')}`;
        }
        break;
    }

    // Custom validation function
    if (rules.validate && typeof rules.validate === 'function') {
      const customError = rules.validate(value, data);
      if (customError) {
        errors[field] = customError;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate primitive type
 * @param {any} value - Value to validate
 * @param {string} type - Type to validate against
 * @param {Object} rules - Additional validation rules
 * @returns {boolean} - Whether value is valid
 */
const validatePrimitiveType = (value, type, rules = {}) => {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' || (typeof value === 'string' && validator.isNumeric(value));
    case 'boolean':
      return typeof value === 'boolean';
    case 'date':
      return isValidDate(value, rules);
    case 'email':
      return isValidEmail(value);
    case 'url':
      return isValidUrl(value, rules);
    case 'phone':
      return isValidPhone(value, rules.locale);
    default:
      return false;
  }
};

/**
 * Create validation schema for common entity types
 * @param {string} type - Entity type
 * @returns {Object} - Validation schema
 */
const createValidationSchema = (type) => {
  switch (type) {
    case 'user':
      return {
        name: {
          type: 'string',
          required: true,
          minLength: 2,
          maxLength: 100
        },
        email: {
          type: 'email',
          required: true
        },
        password: {
          type: 'string',
          required: true,
          minLength: 8,
          pattern: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
          patternMessage: 'Password must contain at least one number, one uppercase letter, one lowercase letter, and one special character'
        },
        role: {
          type: 'enum',
          values: ['admin', 'manager', 'user'],
          required: true
        },
        phone: {
          type: 'phone',
          required: false
        }
      };

    case 'product':
      return {
        name: {
          type: 'string',
          required: true,
          minLength: 2,
          maxLength: 100
        },
        description: {
          type: 'string',
          required: false,
          maxLength: 1000
        },
        price: {
          type: 'number',
          required: true,
          min: 0
        },
        category: {
          type: 'string',
          required: true
        },
        sku: {
          type: 'string',
          required: true,
          pattern: /^[A-Z0-9]{6,10}$/,
          patternMessage: 'SKU must be 6-10 uppercase letters and numbers'
        },
        inStock: {
          type: 'boolean',
          required: true
        }
      };

    case 'promotion':
      return {
        name: {
          type: 'string',
          required: true,
          minLength: 2,
          maxLength: 100
        },
        description: {
          type: 'string',
          required: false,
          maxLength: 1000
        },
        startDate: {
          type: 'date',
          required: true,
          min: new Date().toISOString().split('T')[0] // Today
        },
        endDate: {
          type: 'date',
          required: true,
          validate: (value, data) => {
            if (new Date(value) <= new Date(data.startDate)) {
              return 'End date must be after start date';
            }
            return null;
          }
        },
        discount: {
          type: 'number',
          required: true,
          min: 0,
          max: 100
        },
        products: {
          type: 'array',
          required: true,
          minItems: 1,
          itemType: 'string'
        }
      };

    case 'order':
      return {
        customer: {
          type: 'object',
          required: true,
          schema: {
            name: {
              type: 'string',
              required: true
            },
            email: {
              type: 'email',
              required: true
            },
            phone: {
              type: 'phone',
              required: false
            },
            address: {
              type: 'string',
              required: true
            }
          }
        },
        items: {
          type: 'array',
          required: true,
          minItems: 1,
          itemType: 'object',
          itemSchema: {
            productId: {
              type: 'string',
              required: true
            },
            quantity: {
              type: 'number',
              required: true,
              min: 1,
              integer: true
            },
            price: {
              type: 'number',
              required: true,
              min: 0
            }
          }
        },
        totalAmount: {
          type: 'number',
          required: true,
          min: 0,
          validate: (value, data) => {
            if (data.items) {
              const calculatedTotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              if (Math.abs(value - calculatedTotal) > 0.01) {
                return 'Total amount does not match the sum of item prices';
              }
            }
            return null;
          }
        },
        paymentMethod: {
          type: 'enum',
          values: ['credit_card', 'paypal', 'bank_transfer', 'cash'],
          required: true
        },
        status: {
          type: 'enum',
          values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
          required: true
        }
      };

    default:
      return {};
  }
};

module.exports = {
  isValidEmail,
  validatePasswordStrength,
  isValidDate,
  isValidNumber,
  isValidString,
  isValidUrl,
  isValidPhone,
  isValidPostalCode,
  isValidCreditCard,
  validateObject,
  createValidationSchema
};
