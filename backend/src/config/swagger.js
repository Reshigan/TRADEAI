/**
 * SWAGGER API DOCUMENTATION CONFIGURATION
 *
 * Auto-generates interactive API documentation at /api-docs
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TRADEAI API Documentation',
      version: '1.0.0',
      description: 'Transaction-Level Trade Promotion Management Platform - Complete API Reference',
      contact: {
        name: 'TRADEAI Support',
        email: 'support@tradeai.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://tradeai.com/license'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.tradeai.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /api/auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string', example: 'Detailed error description' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7g8h9i0j1' },
            type: { type: 'string', enum: ['accrual', 'settlement', 'rebate', 'allowance'] },
            amount: { type: 'number', example: 50000 },
            status: { type: 'string', enum: ['draft', 'pending', 'approved', 'rejected', 'settled'] },
            customerId: { type: 'string' },
            productId: { type: 'string' },
            promotionId: { type: 'string' },
            description: { type: 'string' },
            tenantId: { type: 'string' },
            createdBy: { type: 'string' },
            approvedBy: { type: 'string' },
            approvedAt: { type: 'string', format: 'date-time' },
            settledAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        BaselineRequest: {
          type: 'object',
          required: ['productId', 'customerId', 'promotionStartDate', 'promotionEndDate'],
          properties: {
            productId: { type: 'string', description: 'Product ObjectId' },
            customerId: { type: 'string', description: 'Customer ObjectId' },
            promotionStartDate: { type: 'string', format: 'date', example: '2025-10-01' },
            promotionEndDate: { type: 'string', format: 'date', example: '2025-10-14' },
            method: {
              type: 'string',
              enum: ['pre_period', 'control_store', 'moving_average', 'exponential_smoothing', 'auto'],
              default: 'pre_period'
            }
          }
        },
        BaselineResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                method: { type: 'string', example: 'pre_period' },
                baseline: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string', format: 'date' },
                      baselineQuantity: { type: 'number' },
                      actualQuantity: { type: 'number' },
                      incrementalQuantity: { type: 'number' },
                      lift: { type: 'number' }
                    }
                  }
                },
                summary: {
                  type: 'object',
                  properties: {
                    totalBaseline: { type: 'number', example: 1680 },
                    totalActual: { type: 'number', example: 3010 },
                    totalIncremental: { type: 'number', example: 1330 },
                    averageLift: { type: 'number', example: 79.2 },
                    totalIncrementalRevenue: { type: 'number', example: 199500 }
                  }
                }
              }
            }
          }
        },
        CannibalizationResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                grossIncremental: { type: 'number', example: 1330 },
                totalCannibalized: { type: 'number', example: 480 },
                netIncremental: { type: 'number', example: 850 },
                cannibalizationRate: { type: 'number', example: 36.1 },
                severity: { type: 'string', enum: ['NONE', 'LOW', 'MODERATE', 'HIGH', 'SEVERE'] },
                cannibalizedProducts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      productId: { type: 'string' },
                      productName: { type: 'string' },
                      volumeImpact: { type: 'number' },
                      percentageImpact: { type: 'number' }
                    }
                  }
                },
                recommendations: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        ForwardBuyResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                forwardBuyDetected: { type: 'boolean', example: true },
                grossIncremental: { type: 'number', example: 1330 },
                totalDip: { type: 'number', example: 420 },
                netImpact: { type: 'number', example: 910 },
                dipPercentage: { type: 'number', example: 31.6 },
                recoveryWeek: { type: 'number', example: 4 },
                severity: { type: 'string', enum: ['NONE', 'LOW', 'MODERATE', 'HIGH', 'SEVERE'] },
                postPromoData: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      week: { type: 'number' },
                      actualSales: { type: 'number' },
                      baseline: { type: 'number' },
                      dip: { type: 'number' }
                    }
                  }
                },
                recommendations: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Transactions',
        description: 'Trade promotion transaction management'
      },
      {
        name: 'POS Import',
        description: 'Point-of-sale data import and processing'
      },
      {
        name: 'Baseline',
        description: 'Baseline calculation and incremental analysis'
      },
      {
        name: 'Cannibalization',
        description: 'Product cannibalization detection and analysis'
      },
      {
        name: 'Forward Buy',
        description: 'Forward buying and pantry loading detection'
      },
      {
        name: 'Store Hierarchy',
        description: 'Store hierarchy and geographic analytics'
      },
      {
        name: 'Analytics',
        description: 'Advanced analytics and reporting'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
