/**
 * Flow Helpers and Utilities
 * Common functions for flow-based components
 */

/**
 * Validate flow step data
 * @param {Object} data - Step data
 * @param {Object} schema - Validation schema
 * @returns {Object} - Validation errors
 */
export const validateStep = (data, schema) => {
  const errors = {};
  
  if (!schema || !schema.fields) return errors;

  Object.entries(schema.fields).forEach(([field, rules]) => {
    const value = data[field];

    // Required validation
    if (rules.required && (!value || value === '')) {
      errors[field] = rules.message || `${field} is required`;
    }

    // Min length validation
    if (rules.minLength && value && value.length < rules.minLength) {
      errors[field] = `Minimum length is ${rules.minLength}`;
    }

    // Max length validation
    if (rules.maxLength && value && value.length > rules.maxLength) {
      errors[field] = `Maximum length is ${rules.maxLength}`;
    }

    // Email validation
    if (rules.email && value && !/^\S+@\S+\.\S+$/.test(value)) {
      errors[field] = 'Invalid email format';
    }

    // Phone validation
    if (rules.phone && value && !/^\+?[\d\s\-()]+$/.test(value)) {
      errors[field] = 'Invalid phone number';
    }

    // Number validation
    if (rules.number && value && isNaN(value)) {
      errors[field] = 'Must be a number';
    }

    // Min value validation
    if (rules.min !== undefined && value < rules.min) {
      errors[field] = `Minimum value is ${rules.min}`;
    }

    // Max value validation
    if (rules.max !== undefined && value > rules.max) {
      errors[field] = `Maximum value is ${rules.max}`;
    }

    // Custom validation
    if (rules.validate && typeof rules.validate === 'function') {
      const customError = rules.validate(value, data);
      if (customError) {
        errors[field] = customError;
      }
    }
  });

  return errors;
};

/**
 * Calculate flow progress percentage
 * @param {number} currentStep - Current step index
 * @param {number} totalSteps - Total number of steps
 * @returns {number} - Progress percentage (0-100)
 */
export const calculateProgress = (currentStep, totalSteps) => {
  if (totalSteps === 0) return 0;
  return Math.round((currentStep / totalSteps) * 100);
};

/**
 * Format AI recommendation for display
 * @param {Object} rawRecommendation - Raw AI response
 * @returns {Object} - Formatted recommendation
 */
export const formatAIRecommendation = (rawRecommendation) => {
  return {
    type: rawRecommendation.type || 'insight',
    priority: rawRecommendation.priority || 'medium',
    title: rawRecommendation.title || '',
    message: rawRecommendation.message || '',
    metric: rawRecommendation.metric,
    action: rawRecommendation.action,
    data: rawRecommendation.data  // Auto-apply data
  };
};

/**
 * Save flow progress to localStorage
 * @param {string} flowId - Unique flow identifier
 * @param {Object} data - Flow data to save
 */
export const saveFlowProgress = (flowId, data) => {
  try {
    const key = `flow_${flowId}_progress`;
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Failed to save flow progress:', error);
  }
};

/**
 * Load flow progress from localStorage
 * @param {string} flowId - Unique flow identifier
 * @returns {Object|null} - Saved flow data or null
 */
export const loadFlowProgress = (flowId) => {
  try {
    const key = `flow_${flowId}_progress`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only return data saved within last 24 hours
      const savedTime = new Date(parsed.timestamp);
      const now = new Date();
      const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        return parsed.data;
      }
    }
  } catch (error) {
    console.error('Failed to load flow progress:', error);
  }
  return null;
};

/**
 * Clear saved flow progress
 * @param {string} flowId - Unique flow identifier
 */
export const clearFlowProgress = (flowId) => {
  try {
    const key = `flow_${flowId}_progress`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear flow progress:', error);
  }
};

/**
 * Merge form data with defaults
 * @param {Object} data - Current form data
 * @param {Object} defaults - Default values
 * @returns {Object} - Merged data
 */
export const mergeWithDefaults = (data, defaults) => {
  const merged = { ...defaults };
  
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      merged[key] = data[key];
    }
  });
  
  return merged;
};

/**
 * Check if step can be skipped
 * @param {Object} step - Step configuration
 * @param {Object} data - Current flow data
 * @returns {boolean} - True if step can be skipped
 */
export const canSkipStep = (step, data) => {
  if (step.optional) return true;
  if (step.skipCondition && typeof step.skipCondition === 'function') {
    return step.skipCondition(data);
  }
  return false;
};

/**
 * Get step completion status
 * @param {Object} step - Step configuration
 * @param {Object} data - Current flow data
 * @returns {boolean} - True if step is complete
 */
export const isStepComplete = (step, data) => {
  if (!step.validation) return true;
  
  const errors = validateStep(data[step.id] || {}, step.validation);
  return Object.keys(errors).length === 0;
};

/**
 * Calculate overall flow completion percentage
 * @param {Array} steps - All flow steps
 * @param {Object} data - Current flow data
 * @returns {number} - Completion percentage (0-100)
 */
export const calculateFlowCompletion = (steps, data) => {
  if (steps.length === 0) return 0;
  
  const completedSteps = steps.filter(step => 
    isStepComplete(step, data)
  ).length;
  
  return Math.round((completedSteps / steps.length) * 100);
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: ZAR)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = 'ZAR') => {
  if (amount === null || amount === undefined) return '-';
  
  const symbols = {
    ZAR: 'R',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };
  
  const symbol = symbols[currency] || currency;
  return `${symbol} ${Number(amount).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Format percentage for display
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '-';
  return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Debounce function for API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 500) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
