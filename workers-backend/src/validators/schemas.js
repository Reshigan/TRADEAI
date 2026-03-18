// Lightweight input validation schemas (no external dependencies)
// Provides Zod-like validation without adding packages

class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.errors = errors;
  }
}

// Validation helpers
const v = {
  string(opts = {}) {
    return (value, field) => {
      if (value === undefined || value === null || value === '') {
        if (opts.optional) return undefined;
        return `${field} is required`;
      }
      if (typeof value !== 'string') return `${field} must be a string`;
      if (opts.max && value.length > opts.max) return `${field} must be at most ${opts.max} characters`;
      if (opts.min && value.length < opts.min) return `${field} must be at least ${opts.min} characters`;
      if (opts.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `${field} must be a valid email`;
      if (opts.pattern && !opts.pattern.test(value)) return `${field} has invalid format`;
      if (opts.enum && !opts.enum.includes(value)) return `${field} must be one of: ${opts.enum.join(', ')}`;
      return null;
    };
  },
  number(opts = {}) {
    return (value, field) => {
      if (value === undefined || value === null || value === '') {
        if (opts.optional) return undefined;
        return `${field} is required`;
      }
      const num = Number(value);
      if (isNaN(num)) return `${field} must be a number`;
      if (opts.min !== undefined && num < opts.min) return `${field} must be at least ${opts.min}`;
      if (opts.max !== undefined && num > opts.max) return `${field} must be at most ${opts.max}`;
      if (opts.integer && !Number.isInteger(num)) return `${field} must be an integer`;
      return null;
    };
  },
  date(opts = {}) {
    return (value, field) => {
      if (value === undefined || value === null || value === '') {
        if (opts.optional) return undefined;
        return `${field} is required`;
      }
      if (typeof value !== 'string' || isNaN(Date.parse(value))) return `${field} must be a valid date (ISO 8601)`;
      return null;
    };
  },
  boolean(opts = {}) {
    return (value, field) => {
      if (value === undefined || value === null) {
        if (opts.optional) return undefined;
        return `${field} is required`;
      }
      if (typeof value !== 'boolean') return `${field} must be a boolean`;
      return null;
    };
  },
  array(opts = {}) {
    return (value, field) => {
      if (value === undefined || value === null) {
        if (opts.optional) return undefined;
        return `${field} is required`;
      }
      if (!Array.isArray(value)) return `${field} must be an array`;
      if (opts.min && value.length < opts.min) return `${field} must have at least ${opts.min} items`;
      if (opts.max && value.length > opts.max) return `${field} must have at most ${opts.max} items`;
      return null;
    };
  },
  object(opts = {}) {
    return (value, field) => {
      if (value === undefined || value === null) {
        if (opts.optional) return undefined;
        return `${field} is required`;
      }
      if (typeof value !== 'object' || Array.isArray(value)) return `${field} must be an object`;
      return null;
    };
  }
};

function validateBody(schema) {
  return async (c, next) => {
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, message: 'Invalid JSON body' }, 400);
    }

    const errors = [];
    const allowedKeys = new Set(Object.keys(schema));

    // Check for unknown keys
    for (const key of Object.keys(body)) {
      if (!allowedKeys.has(key)) {
        errors.push(`Unknown field: ${key}`);
      }
    }

    // Validate each field
    for (const [field, validator] of Object.entries(schema)) {
      const result = validator(body[field], field);
      if (result && result !== undefined) errors.push(result);
    }

    if (errors.length > 0) {
      return c.json({ success: false, message: 'Validation failed', errors }, 400);
    }

    c.set('validatedBody', body);
    await next();
  };
}

// Common schemas for key endpoints
const schemas = {
  login: {
    email: v.string({ email: true, max: 200 }),
    password: v.string({ min: 8, max: 200 })
  },
  register: {
    email: v.string({ email: true, max: 200 }),
    password: v.string({ min: 8, max: 200 }),
    firstName: v.string({ max: 200 }),
    lastName: v.string({ max: 200 }),
    role: v.string({ optional: true, enum: ['admin', 'manager', 'kam', 'user', 'executive'] }),
    companyId: v.string({ optional: true, max: 100 })
  },
  promotion: {
    name: v.string({ max: 200 }),
    description: v.string({ optional: true, max: 2000 }),
    promotionType: v.string({ optional: true, enum: ['percentage_off', 'fixed_amount', 'bogo', 'volume_discount', 'bundle', 'display', 'tpr', 'coupon', 'rebate'] }),
    startDate: v.date(),
    endDate: v.date(),
    customerId: v.string({ optional: true, max: 100 }),
    productId: v.string({ optional: true, max: 100 }),
    budgetId: v.string({ optional: true, max: 100 }),
    amount: v.number({ optional: true, min: 0, max: 999999999 }),
    status: v.string({ optional: true, enum: ['draft', 'pending', 'approved', 'active', 'completed', 'cancelled'] }),
    notes: v.string({ optional: true, max: 2000 }),
    targetVolume: v.number({ optional: true, min: 0, max: 999999999 }),
    targetRevenue: v.number({ optional: true, min: 0, max: 999999999 }),
    discount: v.number({ optional: true, min: 0, max: 100 }),
    roi: v.number({ optional: true }),
    companyId: v.string({ optional: true, max: 100 })
  },
  budget: {
    name: v.string({ max: 200 }),
    description: v.string({ optional: true, max: 2000 }),
    amount: v.number({ min: 0, max: 999999999 }),
    year: v.number({ optional: true, integer: true, min: 2020, max: 2100 }),
    status: v.string({ optional: true, enum: ['draft', 'active', 'closed', 'frozen'] }),
    budgetType: v.string({ optional: true, max: 100 }),
    startDate: v.date({ optional: true }),
    endDate: v.date({ optional: true }),
    customerId: v.string({ optional: true, max: 100 }),
    productId: v.string({ optional: true, max: 100 }),
    category: v.string({ optional: true, max: 200 }),
    companyId: v.string({ optional: true, max: 100 })
  },
  tradeSpend: {
    notes: v.string({ optional: true, max: 2000 }),
    spendType: v.string({ optional: true, enum: ['promotion', 'marketing', 'cash_coop', 'trading_terms', 'rebate'] }),
    category: v.string({ optional: true, max: 200 }),
    amount: v.number({ optional: true, min: 0, max: 999999999 }),
    customerId: v.string({ optional: true, max: 100 }),
    productId: v.string({ optional: true, max: 100 }),
    promotionId: v.string({ optional: true, max: 100 }),
    budgetId: v.string({ optional: true, max: 100 }),
    startDate: v.date({ optional: true }),
    endDate: v.date({ optional: true }),
    status: v.string({ optional: true, enum: ['draft', 'pending', 'approved', 'active', 'completed', 'cancelled'] }),
    companyId: v.string({ optional: true, max: 100 })
  },
  claim: {
    claimType: v.string({ optional: true, max: 200 }),
    customerId: v.string({ optional: true, max: 100 }),
    amount: v.number({ optional: true, min: 0, max: 999999999 }),
    claimDate: v.date({ optional: true }),
    description: v.string({ optional: true, max: 2000 }),
    promotionId: v.string({ optional: true, max: 100 }),
    rebateId: v.string({ optional: true, max: 100 }),
    status: v.string({ optional: true, enum: ['draft', 'pending', 'approved', 'rejected', 'settled'] }),
    supportingDocuments: v.string({ optional: true, max: 2000 }),
    companyId: v.string({ optional: true, max: 100 })
  },
  customer: {
    name: v.string({ max: 200 }),
    code: v.string({ optional: true, max: 100 }),
    channel: v.string({ optional: true, max: 200 }),
    segment: v.string({ optional: true, max: 200 }),
    region: v.string({ optional: true, max: 200 }),
    email: v.string({ optional: true, email: true, max: 200 }),
    phone: v.string({ optional: true, max: 50 }),
    address: v.string({ optional: true, max: 500 }),
    status: v.string({ optional: true, enum: ['active', 'inactive'] }),
    companyId: v.string({ optional: true, max: 100 })
  },
  campaign: {
    name: v.string({ max: 200 }),
    description: v.string({ optional: true, max: 2000 }),
    campaignType: v.string({ optional: true, max: 200 }),
    startDate: v.date({ optional: true }),
    endDate: v.date({ optional: true }),
    budgetAmount: v.number({ optional: true, min: 0, max: 999999999 }),
    status: v.string({ optional: true, enum: ['draft', 'active', 'completed', 'cancelled'] }),
    companyId: v.string({ optional: true, max: 100 })
  },
  settlement: {
    settlementType: v.string({ optional: true, max: 200 }),
    customerId: v.string({ optional: true, max: 100 }),
    amount: v.number({ optional: true, min: 0, max: 999999999 }),
    status: v.string({ optional: true, enum: ['draft', 'pending', 'processing', 'completed', 'cancelled'] }),
    paymentMethod: v.string({ optional: true, max: 100 }),
    notes: v.string({ optional: true, max: 2000 }),
    companyId: v.string({ optional: true, max: 100 })
  },
  rebate: {
    name: v.string({ optional: true, max: 200 }),
    rebateType: v.string({ optional: true, max: 200 }),
    customerId: v.string({ optional: true, max: 100 }),
    rate: v.number({ optional: true, min: 0, max: 100 }),
    startDate: v.date({ optional: true }),
    endDate: v.date({ optional: true }),
    budgetId: v.string({ optional: true, max: 100 }),
    status: v.string({ optional: true, enum: ['active', 'inactive', 'expired'] }),
    companyId: v.string({ optional: true, max: 100 })
  }
};

export { v, validateBody, schemas, ValidationError };
