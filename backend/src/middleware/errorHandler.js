const logger = require('../utils/logger');
const config = require('../config');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// MongoDB error handler
const handleMongoError = (error) => {
  if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    return new AppError(
      `${field} '${value}' already exists`,
      400,
      'DUPLICATE_ENTRY'
    );
  }

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err) => err.message);
    return new AppError(
      `Validation error: ${errors.join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }

  if (error.name === 'CastError') {
    return new AppError(
      `Invalid ${error.path}: ${error.value}`,
      400,
      'INVALID_ID'
    );
  }

  return error;
};

// JWT error handler
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.logError(err, req, {
    statusCode: err.statusCode,
    code: err.code
  });

  // MongoDB errors
  if (err.name === 'MongoError' || err.name === 'ValidationError' || err.name === 'CastError') {
    error = handleMongoError(err);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('File too large', 400, 'FILE_TOO_LARGE');
    } else {
      error = new AppError('File upload error', 400, 'FILE_UPLOAD_ERROR');
    }
  }

  // Set default values
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  // Send error response
  const response = {
    success: false,
    error: {
      message: error.message,
      code: error.code
    }
  };

  // Add stack trace in development
  if (config.env === 'development') {
    response.error.stack = err.stack;
    response.error.details = err;
  }

  // Don't leak error details in production
  if (config.env === 'production' && !error.isOperational) {
    response.error.message = 'Something went wrong';
    response.error.code = 'INTERNAL_ERROR';
  }

  res.status(error.statusCode).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found handler
const notFound = (req, res, next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFound
};
