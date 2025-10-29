const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');

// In-memory fallback (when database is not available)
let inMemoryUsers = new Map();

/**
 * Middleware to protect routes - requires valid JWT token
 */
const protect = async (req, res, next) => {
    try {
        let token;
        
        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Check for token in cookies
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        
        // No token provided
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized. No token provided.'
            });
        }
        
        // Verify token
        const decoded = verifyAccessToken(token);
        
        // Check if user exists
        try {
            const User = require('../models/User');
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found or token is invalid'
                });
            }
            
            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    error: 'User account is deactivated'
                });
            }
            
            // Check if account is locked
            if (user.isLocked) {
                return res.status(401).json({
                    success: false,
                    error: 'Account is locked due to multiple failed login attempts'
                });
            }
            
            // Check if password was changed after token was issued
            if (user.changedPasswordAfter(decoded.iat)) {
                return res.status(401).json({
                    success: false,
                    error: 'Password was recently changed. Please log in again.'
                });
            }
            
            // Attach user to request
            req.user = user;
            next();
            
        } catch (dbError) {
            // Fallback to in-memory check (if database is not available)
            logger.warn('Database not available, using in-memory user check');
            
            if (!inMemoryUsers.has(decoded.id)) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found'
                });
            }
            
            req.user = inMemoryUsers.get(decoded.id);
            next();
        }
        
    } catch (error) {
        logger.error('Auth middleware error:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token has expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }
        
        return res.status(401).json({
            success: false,
            error: 'Not authorized'
        });
    }
};

/**
 * Middleware to restrict access to specific roles
 * @param  {...string} roles - Allowed roles
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to perform this action'
            });
        }
        
        next();
    };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        
        if (token) {
            const decoded = verifyAccessToken(token);
            
            try {
                const User = require('../models/User');
                const user = await User.findById(decoded.id).select('-password');
                if (user && user.isActive) {
                    req.user = user;
                }
            } catch (dbError) {
                if (inMemoryUsers.has(decoded.id)) {
                    req.user = inMemoryUsers.get(decoded.id);
                }
            }
        }
        
        next();
    } catch (error) {
        // Just continue without user
        next();
    }
};

// Export in-memory users for use in other modules
module.exports = {
    protect,
    restrictTo,
    optionalAuth,
    inMemoryUsers
};
