const logger = require('../utils/logger');

/**
 * Custom error class
 */
class AppError extends Error {
    constructor(message, statusCode, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Handle Mongoose CastError (invalid ObjectId)
 */
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400, 'INVALID_ID');
};

/**
 * Handle Mongoose duplicate key error
 */
const handleDuplicateFieldsDB = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${field} = '${value}'. Please use another value.`;
    return new AppError(message, 400, 'DUPLICATE_FIELD');
};

/**
 * Handle Mongoose validation error
 */
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400, 'VALIDATION_ERROR');
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => {
    return new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
};

const handleJWTExpiredError = () => {
    return new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, res) => {
    logger.error('Error details:', {
        status: err.statusCode,
        message: err.message,
        code: err.code,
        stack: err.stack,
        error: err
    });
    
    res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code,
        stack: err.stack,
        details: err
    });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        logger.error('Operational error:', {
            status: err.statusCode,
            message: err.message,
            code: err.code
        });
        
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
            code: err.code
        });
    } 
    // Programming or unknown error: don't leak details
    else {
        logger.error('Unexpected error:', {
            message: err.message,
            stack: err.stack,
            error: err
        });
        
        res.status(500).json({
            success: false,
            error: 'Something went wrong on the server',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;
        error.code = err.code;
        
        // Handle specific error types
        if (err.name === 'CastError') error = handleCastErrorDB(err);
        if (err.code === 11000) error = handleDuplicateFieldsDB(err);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
        
        sendErrorProd(error, res);
    }
};

/**
 * Catch async errors wrapper
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

/**
 * Handle 404 - route not found
 */
const notFound = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
    next(error);
};

module.exports = {
    AppError,
    errorHandler,
    catchAsync,
    notFound
};
