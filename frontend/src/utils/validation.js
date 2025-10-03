/**
 * Frontend Validation Utilities
 * Comprehensive validation functions for form inputs and data
 */

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return 'Email is required';
  }
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

// Password validation
export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
};

// Required field validation
export const validateRequired = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} cannot be empty`;
  }
  return null;
};

// Number validation
export const validateNumber = (value, fieldName = 'This field', options = {}) => {
  const { min, max, allowDecimals = true } = options;
  
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  
  if (!allowDecimals && !Number.isInteger(num)) {
    return `${fieldName} must be a whole number`;
  }
  
  if (min !== undefined && num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  
  if (max !== undefined && num > max) {
    return `${fieldName} must not exceed ${max}`;
  }
  
  return null;
};

// Form validation helper
export const validateForm = (values, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = values[field];
    
    for (const rule of rules) {
      const error = rule(value, values);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validators = {
  email: validateEmail,
  password: validatePassword,
  required: validateRequired,
  number: validateNumber,
};

export default validators;
