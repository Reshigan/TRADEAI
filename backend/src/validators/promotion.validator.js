/**
 * Promotion Validation Schemas
 * Input validation using Joi
 */

const Joi = require('joi');

const promotionSchemas = {
  // Create promotion validation
  create: Joi.object({
    company: Joi.string()
      .hex()
      .length(24)
      .required()
      .messages({
        'string.empty': 'Company ID is required',
        'string.hex': 'Invalid company ID format',
        'string.length': 'Invalid company ID length'
      }),

    name: Joi.string()
      .min(3)
      .max(200)
      .pattern(/^[a-zA-Z0-9\s\-&',.]+$/)
      .required()
      .messages({
        'string.empty': 'Promotion name is required',
        'string.min': 'Promotion name must be at least 3 characters',
        'string.max': 'Promotion name cannot exceed 200 characters',
        'string.pattern.base': 'Promotion name contains invalid characters'
      }),

    description: Joi.string()
      .max(1000)
      .allow('', null),

    type: Joi.string()
      .valid(
        'Volume Discount',
        'BOGOF',
        'Price Reduction',
        'Bundle Deal',
        'Loyalty Bonus',
        'New Product Launch',
        'Seasonal Special',
        'Clearance Sale',
        'Trade Allowance',
        'Display Allowance',
        'Advertising Allowance'
      )
      .required()
      .messages({
        'any.only': 'Invalid promotion type',
        'any.required': 'Promotion type is required'
      }),

    status: Joi.string()
      .valid('draft', 'pending', 'active', 'paused', 'completed', 'cancelled')
      .default('draft'),

    startDate: Joi.date()
      .iso()
      .min('now')
      .required()
      .messages({
        'date.base': 'Start date must be a valid date',
        'date.min': 'Start date must be in the future',
        'any.required': 'Start date is required'
      }),

    endDate: Joi.date()
      .iso()
      .greater(Joi.ref('startDate'))
      .required()
      .messages({
        'date.base': 'End date must be a valid date',
        'date.greater': 'End date must be after start date',
        'any.required': 'End date is required'
      }),

    customers: Joi.array()
      .items(Joi.string().hex().length(24))
      .min(0)
      .default([]),

    products: Joi.array()
      .items(Joi.string().hex().length(24))
      .min(0)
      .default([]),

    budget: Joi.object({
      allocated: Joi.number()
        .positive()
        .max(100000000)
        .required()
        .messages({
          'number.base': 'Budget must be a number',
          'number.positive': 'Budget must be positive',
          'number.max': 'Budget cannot exceed 100,000,000',
          'any.required': 'Budget is required'
        }),

      spent: Joi.number()
        .min(0)
        .default(0),

      currency: Joi.string()
        .valid('ZAR', 'USD', 'EUR', 'GBP')
        .default('ZAR')
    }).required(),

    terms: Joi.object({
      discountPercentage: Joi.number()
        .min(0)
        .max(100)
        .when('discountAmount', {
          is: Joi.exist(),
          then: Joi.forbidden(),
          otherwise: Joi.optional()
        }),

      discountAmount: Joi.number()
        .min(0)
        .when('discountPercentage', {
          is: Joi.exist(),
          then: Joi.forbidden(),
          otherwise: Joi.optional()
        }),

      minimumQuantity: Joi.number()
        .min(0)
        .integer(),

      maximumQuantity: Joi.number()
        .min(0)
        .integer()
        .greater(Joi.ref('minimumQuantity')),

      conditions: Joi.array()
        .items(Joi.string().max(500))
        .default([])
    }).default({}),

    metrics: Joi.object({
      impressions: Joi.number().min(0).default(0),
      clicks: Joi.number().min(0).default(0),
      conversions: Joi.number().min(0).default(0),
      revenue: Joi.number().min(0).default(0)
    }).default({})
  }),

  // Update promotion validation
  update: Joi.object({
    name: Joi.string()
      .min(3)
      .max(200)
      .pattern(/^[a-zA-Z0-9\s\-&',.]+$/),

    description: Joi.string()
      .max(1000)
      .allow('', null),

    type: Joi.string()
      .valid(
        'Volume Discount',
        'BOGOF',
        'Price Reduction',
        'Bundle Deal',
        'Loyalty Bonus',
        'New Product Launch',
        'Seasonal Special',
        'Clearance Sale',
        'Trade Allowance',
        'Display Allowance',
        'Advertising Allowance'
      ),

    status: Joi.string()
      .valid('draft', 'pending', 'active', 'paused', 'completed', 'cancelled'),

    startDate: Joi.date().iso(),

    endDate: Joi.date()
      .iso()
      .greater(Joi.ref('startDate')),

    customers: Joi.array()
      .items(Joi.string().hex().length(24)),

    products: Joi.array()
      .items(Joi.string().hex().length(24)),

    budget: Joi.object({
      allocated: Joi.number()
        .positive()
        .max(100000000),

      spent: Joi.number()
        .min(0),

      currency: Joi.string()
        .valid('ZAR', 'USD', 'EUR', 'GBP')
    }),

    terms: Joi.object({
      discountPercentage: Joi.number()
        .min(0)
        .max(100),

      discountAmount: Joi.number()
        .min(0),

      minimumQuantity: Joi.number()
        .min(0)
        .integer(),

      maximumQuantity: Joi.number()
        .min(0)
        .integer(),

      conditions: Joi.array()
        .items(Joi.string().max(500))
    })
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  }),

  // Query parameters validation
  query: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20),

    sort: Joi.string()
      .valid('name', '-name', 'startDate', '-startDate', 'endDate', '-endDate', 'createdAt', '-createdAt')
      .default('-createdAt'),

    status: Joi.string()
      .valid('draft', 'pending', 'active', 'paused', 'completed', 'cancelled'),

    type: Joi.string()
      .valid(
        'Volume Discount',
        'BOGOF',
        'Price Reduction',
        'Bundle Deal',
        'Loyalty Bonus',
        'New Product Launch',
        'Seasonal Special',
        'Clearance Sale',
        'Trade Allowance',
        'Display Allowance',
        'Advertising Allowance'
      ),

    search: Joi.string()
      .max(100),

    startDateFrom: Joi.date().iso(),
    startDateTo: Joi.date().iso(),
    endDateFrom: Joi.date().iso(),
    endDateTo: Joi.date().iso()
  }),

  // ID parameter validation
  id: Joi.object({
    id: Joi.string()
      .hex()
      .length(24)
      .required()
      .messages({
        'string.hex': 'Invalid ID format',
        'string.length': 'Invalid ID length',
        'any.required': 'ID is required'
      })
  })
};

module.exports = promotionSchemas;
