/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid
 * Prevents application startup with incomplete configuration
 */

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'REDIS_HOST',
  'REDIS_PORT'
];

const optionalEnvVars = {
  'FRONTEND_URL': 'http://localhost:3000',
  'RATE_LIMIT_WINDOW_MS': '900000',
  'RATE_LIMIT_MAX': '100',
  'SESSION_SECRET': 'change-this-secret',
  'CORS_ORIGIN': '*',
  'REDIS_PASSWORD': '' // Optional - leave empty for no auth
};

/**
 * Validate that a string is not empty and not a placeholder
 */
function isValidValue(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();

  // Check for empty or placeholder values
  const invalidPatterns = [
    /^your[-_].*$/i,
    /^change[-_].*$/i,
    /^replace[-_].*$/i,
    /^placeholder$/i,
    /^xxx+$/i,
    /^<.*>$/,
    /^\[.*\]$/,
    /^example/i
  ];

  return trimmed.length > 0 && !invalidPatterns.some((pattern) => pattern.test(trimmed));
}

/**
 * Validate JWT secret strength
 */
function validateJWTSecret(secret) {
  if (!secret || secret.length < 32) {
    return {
      valid: false,
      message: 'JWT secret must be at least 32 characters long'
    };
  }

  if (/^(secret|password|admin|test)/i.test(secret)) {
    return {
      valid: false,
      message: 'JWT secret must not contain common words'
    };
  }

  return { valid: true };
}

/**
 * Validate MongoDB URI format
 */
function validateMongoURI(uri) {
  if (!uri || !uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    return {
      valid: false,
      message: 'MongoDB URI must start with mongodb:// or mongodb+srv://'
    };
  }

  // Check for embedded credentials with weak passwords
  const match = uri.match(/mongodb(?:\+srv)?:\/\/([^:]+):([^@]+)@/);
  if (match) {
    const password = match[2];
    if (password.length < 8) {
      return {
        valid: false,
        message: 'MongoDB password should be at least 8 characters'
      };
    }
  }

  return { valid: true };
}

/**
 * Validate Redis configuration
 */
function validateRedis(host, port, password) {
  // Skip validation if Redis is disabled
  if (process.env.REDIS_ENABLED === 'false') {
    return { valid: true };
  }

  if (!host || !isValidValue(host)) {
    return {
      valid: false,
      message: 'Redis host is required'
    };
  }

  const portNum = parseInt(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return {
      valid: false,
      message: 'Redis port must be a valid port number (1-65535)'
    };
  }

  if (process.env.NODE_ENV === 'production' && (!password || !isValidValue(password))) {
    return {
      valid: false,
      message: 'Redis password is required in production'
    };
  }

  return { valid: true };
}

/**
 * Main validation function
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];

    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`);
      continue;
    }

    if (!isValidValue(value)) {
      errors.push(`Invalid value for ${varName}: appears to be a placeholder or empty`);
    }
  }

  // Validate JWT secrets
  if (process.env.JWT_SECRET) {
    const jwtValidation = validateJWTSecret(process.env.JWT_SECRET);
    if (!jwtValidation.valid) {
      errors.push(`JWT_SECRET: ${jwtValidation.message}`);
    }
  }

  if (process.env.JWT_REFRESH_SECRET) {
    const refreshValidation = validateJWTSecret(process.env.JWT_REFRESH_SECRET);
    if (!refreshValidation.valid) {
      errors.push(`JWT_REFRESH_SECRET: ${refreshValidation.message}`);
    }
  }

  // Check that JWT secrets are different
  if (process.env.JWT_SECRET && process.env.JWT_REFRESH_SECRET) {
    if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
      errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
    }
  }

  // Validate MongoDB URI
  if (process.env.MONGODB_URI) {
    const mongoValidation = validateMongoURI(process.env.MONGODB_URI);
    if (!mongoValidation.valid) {
      errors.push(`MONGODB_URI: ${mongoValidation.message}`);
    }
  }

  // Validate Redis (only if enabled)
  if (process.env.REDIS_ENABLED !== 'false') {
    const redisValidation = validateRedis(
      process.env.REDIS_HOST,
      process.env.REDIS_PORT,
      process.env.REDIS_PASSWORD
    );
    if (!redisValidation.valid) {
      errors.push(`Redis: ${redisValidation.message}`);
    }
  }

  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test', 'staging'];
  if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
    warnings.push(`NODE_ENV '${process.env.NODE_ENV}' is not standard. Expected: ${validEnvs.join(', ')}`);
  }

  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    // Check for development-like values in production
    const productionChecks = [
      { var: 'SESSION_SECRET', value: 'change-this-secret' },
      { var: 'FRONTEND_URL', value: 'http://localhost' },
      { var: 'CORS_ORIGIN', value: '*' }
    ];

    for (const check of productionChecks) {
      const value = process.env[check.var];
      if (value && (value === check.value || value.includes(check.value))) {
        errors.push(`${check.var} must be changed from default value in production`);
      }
    }

    // Warn about missing optional but recommended variables
    if (!process.env.SENTRY_DSN && !process.env.ERROR_REPORTING_URL) {
      warnings.push('No error reporting configured (SENTRY_DSN or ERROR_REPORTING_URL)');
    }
  }

  // Set defaults for optional variables
  for (const [varName, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      warnings.push(`Using default value for ${varName}: ${defaultValue}`);
    }
  }

  // Return validation results
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate environment and exit if invalid
 */
function validateOrExit() {
  const result = validateEnvironment();

  // Display warnings
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    console.warn('');
  }

  // Display errors and exit if invalid
  if (!result.valid) {
    console.error('\n❌ Environment Validation Failed!\n');
    console.error('The following errors must be fixed before starting the application:\n');
    result.errors.forEach((error) => console.error(`  ❌ ${error}`));
    console.error('\n📝 Please check your .env file and ensure all required variables are set.\n');
    console.error('📖 See .env.example for reference.\n');
    process.exit(1);
  }

  console.log('✅ Environment validation passed\n');
}

module.exports = {
  validateEnvironment,
  validateOrExit,
  isValidValue,
  validateJWTSecret,
  validateMongoURI,
  validateRedis
};
