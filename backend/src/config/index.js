const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
// Load project root .env first (so production overrides dev), then backend/.env for missing keys
// Note: dotenv does not override existing keys by default.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import AI configuration
const { aiConfig, _validateLocalOnlyConfig } = require('./ai.config');

const isProduction = process.env.NODE_ENV === 'production';

const DEFAULT_JWT_SECRET = 'your-super-secret-jwt-key-change-this';
const DEFAULT_JWT_REFRESH_SECRET = 'your-refresh-secret-key';

if (isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET must be set to a strong random value in production. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === DEFAULT_JWT_REFRESH_SECRET) {
    throw new Error('FATAL: JWT_REFRESH_SECRET must be set to a strong random value in production. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  }
}

const jwtSecret = process.env.JWT_SECRET || (isProduction ? crypto.randomBytes(64).toString('hex') : DEFAULT_JWT_SECRET);
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || (isProduction ? crypto.randomBytes(64).toString('hex') : DEFAULT_JWT_REFRESH_SECRET);

module.exports = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5002,

  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fmcg-trade-spend',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    }
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 0,
    keyPrefix: 'fmcg:',
    ttl: {
      default: 3600, // 1 hour
      session: 86400, // 24 hours
      cache: 1800, // 30 minutes
      grid: 3600, // 1 hour
      report: 7200 // 2 hours
    }
  },

  // JWT
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: jwtRefreshSecret,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // Security
  security: {
    bcryptRounds: 10,
    maxLoginAttempts: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    passwordMinLength: 8,
    passwordRequirements: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }
  },

  // CORS
  cors: {
    origin: '*', // Allow all origins for development
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // File Upload
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ],
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    tempDir: process.env.TEMP_DIR || './temp'
  },

  // Email
  email: {
    provider: process.env.EMAIL_PROVIDER || 'sendgrid',
    from: process.env.EMAIL_FROM || 'noreply@fmcg-tradespend.com',
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      templates: {
        welcome: process.env.SENDGRID_WELCOME_TEMPLATE,
        resetPassword: process.env.SENDGRID_RESET_PASSWORD_TEMPLATE,
        approval: process.env.SENDGRID_APPROVAL_TEMPLATE,
        notification: process.env.SENDGRID_NOTIFICATION_TEMPLATE
      }
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  },

  // SAP Integration
  sap: {
    baseUrl: process.env.SAP_BASE_URL,
    username: process.env.SAP_USERNAME,
    password: process.env.SAP_PASSWORD,
    client: process.env.SAP_CLIENT || '100',
    language: process.env.SAP_LANGUAGE || 'EN',
    syncInterval: process.env.SAP_SYNC_INTERVAL || '0 2 * * *', // Daily at 2 AM
    batchSize: 1000,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 5000
  },

  // ML/AI Configuration - LOCAL ONLY
  ml: {
    tensorflow: {
      modelPath: './models/tensorflow',
      batchSize: 32,
      epochs: 100
    },
    forecasting: {
      historicalDays: 365,
      forecastDays: 90,
      confidenceInterval: 0.95,
      seasonalityPeriods: [7, 30, 365] // Weekly, monthly, yearly
    }
  },

  // AI Configuration - LOCAL PROCESSING ONLY
  ai: aiConfig,

  // Business Rules
  businessRules: {
    tradeSpend: {
      maxPercentageOfSales: 15,
      approvalLevels: [
        { max: 5000, level: 'kam' },
        { max: 20000, level: 'manager' },
        { max: 50000, level: 'director' },
        { max: Infinity, level: 'board' }
      ]
    },
    promotions: {
      maxDiscountPercentage: 50,
      minLeadTimeDays: 14,
      maxDurationDays: 90,
      analysisWindowWeeks: 6
    },
    budget: {
      varianceThresholdPercentage: 10,
      forecastUpdateFrequency: 'monthly'
    }
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    transports: ['console', 'file'],
    file: {
      filename: 'logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }
  },

  // Jobs and Queues
  jobs: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    },
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    }
  },

  // Cache
  cache: {
    ttl: {
      user: 300, // 5 minutes
      product: 3600, // 1 hour
      customer: 3600, // 1 hour
      report: 7200, // 2 hours
      dashboard: 300 // 5 minutes
    }
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },

  // API Documentation
  swagger: {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'FMCG Trade Spend Management API',
        version: '1.0.0',
        description: 'Comprehensive API for managing trade spend, promotions, and budgets in FMCG industry'
      },
      servers: [
        {
          url: process.env.API_URL || `http://localhost:${process.env.PORT || 5002}`,
          description: 'API Server'
        }
      ]
    },
    apis: ['./src/routes/*.js', './src/models/*.js']
  }
};
