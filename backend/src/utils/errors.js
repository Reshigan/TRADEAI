/**
 * Custom Error Classes
 * Centralized error handling with proper status codes and messages
 */

/**
 * Base Application Error
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - 400
 */
class ValidationError extends AppError {
  constructor(message, errors = null) {
    super(message, 400, true, errors);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication Error - 401
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, true);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error - 403
 */
class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, true);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error - 404
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, true);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict Error - 409
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, true);
    this.name = 'ConflictError';
  }
}

/**
 * Rate Limit Error - 429
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, true);
    this.name = 'RateLimitError';
  }
}

/**
 * Internal Server Error - 500
 */
class InternalServerError extends AppError {
  constructor(message = 'Internal server error', isOperational = false) {
    super(message, 500, isOperational);
    this.name = 'InternalServerError';
  }
}

/**
 * Service Unavailable Error - 503
 */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, true);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Bad Request Error - 400
 */
class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, true);
    this.name = 'BadRequestError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  BadRequestError
};
