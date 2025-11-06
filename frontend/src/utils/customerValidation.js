/**
 * Customer Flow Validation Utilities
 * Provides comprehensive validation for all customer entry flow steps
 */

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format (basic international format)
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phone && phone.length >= 10 && phoneRegex.test(phone);
};

/**
 * Validate required field
 */
const isRequired = (value) => {
  if (typeof value === 'string') {
    return value && value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== '';
};

/**
 * Validate Basic Info Step (Step 1)
 */
export const validateBasicInfo = (data) => {
  const errors = {};

  if (!isRequired(data.name)) {
    errors.name = 'Company name is required';
  } else if (data.name.trim().length < 3) {
    errors.name = 'Company name must be at least 3 characters';
  }

  if (!isRequired(data.code)) {
    errors.code = 'Customer code is required';
  } else if (data.code.trim().length < 2) {
    errors.code = 'Customer code must be at least 2 characters';
  } else if (!/^[A-Z0-9]+$/.test(data.code)) {
    errors.code = 'Customer code must be uppercase letters and numbers only';
  }

  if (!isRequired(data.customerType)) {
    errors.customerType = 'Customer type is required';
  }

  if (!isRequired(data.channel)) {
    errors.channel = 'Channel is required';
  }

  return errors;
};

/**
 * Validate Business Profile Step (Step 2)
 */
export const validateBusinessProfile = (data) => {
  const errors = {};

  // Performance metrics validation (optional but if provided, must be valid)
  if (data.performance) {
    if (data.performance.lastYearSales && data.performance.lastYearSales < 0) {
      errors['performance.lastYearSales'] = 'Last year sales cannot be negative';
    }
    if (data.performance.currentYearTarget && data.performance.currentYearTarget < 0) {
      errors['performance.currentYearTarget'] = 'Current year target cannot be negative';
    }
    if (data.performance.currentYearActual && data.performance.currentYearActual < 0) {
      errors['performance.currentYearActual'] = 'Current year actual cannot be negative';
    }
    if (data.performance.growthRate && (data.performance.growthRate < -100 || data.performance.growthRate > 1000)) {
      errors['performance.growthRate'] = 'Growth rate must be between -100% and 1000%';
    }
    if (data.performance.marketShare && (data.performance.marketShare < 0 || data.performance.marketShare > 100)) {
      errors['performance.marketShare'] = 'Market share must be between 0% and 100%';
    }
  }

  return errors;
};

/**
 * Validate Contact Details Step (Step 3)
 */
export const validateContactDetails = (data) => {
  const errors = {};

  // Validate contacts array
  if (!data.contacts || data.contacts.length === 0) {
    errors.contacts = 'At least one contact is required';
  } else {
    let hasPrimary = false;
    data.contacts.forEach((contact, index) => {
      if (!isRequired(contact.name)) {
        errors[`contacts.${index}.name`] = 'Contact name is required';
      }
      if (!isRequired(contact.position)) {
        errors[`contacts.${index}.position`] = 'Position is required';
      }
      if (!isRequired(contact.email)) {
        errors[`contacts.${index}.email`] = 'Email is required';
      } else if (!isValidEmail(contact.email)) {
        errors[`contacts.${index}.email`] = 'Invalid email format';
      }
      if (!isRequired(contact.phone)) {
        errors[`contacts.${index}.phone`] = 'Phone is required';
      } else if (!isValidPhone(contact.phone)) {
        errors[`contacts.${index}.phone`] = 'Invalid phone format';
      }
      if (contact.isPrimary) {
        hasPrimary = true;
      }
    });

    if (!hasPrimary) {
      errors.contacts = 'One contact must be marked as primary';
    }
  }

  // Validate address
  if (!data.address) {
    errors.address = 'Address is required';
  } else {
    if (!isRequired(data.address.street)) {
      errors['address.street'] = 'Street address is required';
    }
    if (!isRequired(data.address.city)) {
      errors['address.city'] = 'City is required';
    }
    if (!isRequired(data.address.state)) {
      errors['address.state'] = 'State/Province is required';
    }
    if (!isRequired(data.address.country)) {
      errors['address.country'] = 'Country is required';
    }
    if (!isRequired(data.address.postalCode)) {
      errors['address.postalCode'] = 'Postal code is required';
    }
  }

  return errors;
};

/**
 * Validate Payment Terms Step (Step 4)
 */
export const validatePaymentTerms = (data) => {
  const errors = {};

  if (!isRequired(data.creditLimit)) {
    errors.creditLimit = 'Credit limit is required';
  } else if (parseFloat(data.creditLimit) < 0) {
    errors.creditLimit = 'Credit limit cannot be negative';
  } else if (parseFloat(data.creditLimit) > 10000000) {
    errors.creditLimit = 'Credit limit exceeds maximum allowed ($10M)';
  }

  if (!isRequired(data.paymentTerms)) {
    errors.paymentTerms = 'Payment terms are required';
  }

  if (!isRequired(data.currency)) {
    errors.currency = 'Currency is required';
  }

  return errors;
};

/**
 * Validate Rebate Eligibility Step (Step 5)
 */
export const validateRebateEligibility = (data) => {
  const errors = {};

  // All fields in this step are optional, but if provided, validate them
  if (data.tradingTerms) {
    if (data.tradingTerms.retroActive) {
      const percentage = data.tradingTerms.retroActive.percentage;
      if (percentage && (percentage < 0 || percentage > 100)) {
        errors['tradingTerms.retroActive.percentage'] = 'Percentage must be between 0 and 100';
      }
    }

    if (data.tradingTerms.promptPayment) {
      const percentage = data.tradingTerms.promptPayment.percentage;
      if (percentage && (percentage < 0 || percentage > 100)) {
        errors['tradingTerms.promptPayment.percentage'] = 'Percentage must be between 0 and 100';
      }
      
      const days = data.tradingTerms.promptPayment.days;
      if (days && (days < 0 || days > 180)) {
        errors['tradingTerms.promptPayment.days'] = 'Days must be between 0 and 180';
      }
    }

    if (data.tradingTerms.volumeRebate && Array.isArray(data.tradingTerms.volumeRebate)) {
      data.tradingTerms.volumeRebate.forEach((tier, index) => {
        if (tier.minVolume < 0) {
          errors[`tradingTerms.volumeRebate.${index}.minVolume`] = 'Min volume cannot be negative';
        }
        if (tier.maxVolume < tier.minVolume) {
          errors[`tradingTerms.volumeRebate.${index}.maxVolume`] = 'Max volume must be greater than min volume';
        }
        if (tier.percentage && (tier.percentage < 0 || tier.percentage > 100)) {
          errors[`tradingTerms.volumeRebate.${index}.percentage`] = 'Percentage must be between 0 and 100';
        }
      });
    }
  }

  return errors;
};

/**
 * Validate AI Analysis Step (Step 6)
 * This step is read-only, no validation needed
 */
export const validateAIAnalysis = (data) => {
  return {}; // No errors, this step is informational only
};

/**
 * Validate Review & Submit Step (Step 7)
 * Performs comprehensive validation of all previous steps
 */
export const validateReviewSubmit = (data) => {
  return {
    ...validateBasicInfo(data),
    ...validateBusinessProfile(data),
    ...validateContactDetails(data),
    ...validatePaymentTerms(data),
    ...validateRebateEligibility(data)
  };
};

/**
 * Validate entire customer form
 */
export const validateCustomerForm = (data) => {
  const errors = validateReviewSubmit(data);
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Export all validators as an array for easy iteration
 */
export const stepValidators = [
  validateBasicInfo,
  validateBusinessProfile,
  validateContactDetails,
  validatePaymentTerms,
  validateRebateEligibility,
  validateAIAnalysis,
  validateReviewSubmit
];
