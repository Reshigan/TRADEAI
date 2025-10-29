const jwt = require('jsonwebtoken');

/**
 * Generate JWT access token
 * @param {Object} payload - Data to encode in token
 * @returns {String} JWT token
 */
const generateAccessToken = (payload) => {
    const secret = process.env.JWT_SECRET || 'default-secret-change-this';
    // Changed from 15m to 24h for production stability
    const expiresIn = process.env.JWT_EXPIRE || '24h';
    
    return jwt.sign(payload, secret, {
        expiresIn,
        issuer: 'tradeai-api',
        audience: 'tradeai-client'
    });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Data to encode in token
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (payload) => {
    const secret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-this';
    const expiresIn = process.env.JWT_REFRESH_EXPIRE || '7d';
    
    return jwt.sign(payload, secret, {
        expiresIn,
        issuer: 'tradeai-api',
        audience: 'tradeai-client'
    });
};

/**
 * Verify JWT access token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
    const secret = process.env.JWT_SECRET || 'default-secret-change-this';
    
    return jwt.verify(token, secret, {
        issuer: 'tradeai-api',
        audience: 'tradeai-client'
    });
};

/**
 * Verify JWT refresh token
 * @param {String} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
    const secret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-this';
    
    return jwt.verify(token, secret, {
        issuer: 'tradeai-api',
        audience: 'tradeai-client'
    });
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing both tokens
 */
const generateTokenPair = (user) => {
    const payload = {
        id: user._id || user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        tenant: user.tenant
    };
    
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ id: payload.id });
    
    return {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '24h'
    };
};

/**
 * Decode token without verification (for debugging)
 * @param {String} token - JWT token
 * @returns {Object} Decoded token
 */
const decodeToken = (token) => {
    return jwt.decode(token, { complete: true });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateTokenPair,
    decodeToken
};
