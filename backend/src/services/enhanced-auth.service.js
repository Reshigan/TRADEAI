const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const config = require('../config');
const logger = require('../utils/logger');

class EnhancedAuthService {
  constructor() {
    this.tokenBlacklist = new Set();
    this.sessionStore = new Map();
  }

  async login(email, password, options = {}) {
    try {
      logger.info(`Login attempt for email: ${email}`);

      // Find user by email
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        logger.warn(`Login failed: User not found - ${email}`);
        throw new Error('Invalid credentials');
      }

      // Check if account is active
      if (!user.isActive) {
        logger.warn(`Login failed: Account inactive - ${email}`);
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        logger.warn(`Login failed: Invalid password - ${email}`);
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Store session
      this.storeSession(user._id.toString(), {
        accessToken,
        refreshToken,
        ip: options.ip,
        userAgent: options.userAgent,
        loginAt: new Date()
      });

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      logger.info(`Login successful for user: ${email}`);

      return {
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
          tenantId: user.tenantId
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      throw error;
    }
  }

  async register(userData) {
    try {
      const { email, password, firstName, lastName, role, companyId, tenantId } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'User',
        companyId,
        tenantId,
        isActive: true
      });

      logger.info(`User registered successfully: ${email}`);

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      return {
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      logger.error(`Registration error: ${error.message}`);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret || config.jwt.secret);

      // Check if token is blacklisted
      if (this.tokenBlacklist.has(refreshToken)) {
        throw new Error('Token is blacklisted');
      }

      // Get user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Blacklist old refresh token
      this.tokenBlacklist.add(refreshToken);

      return {
        success: true,
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      };
    } catch (error) {
      logger.error(`Refresh token error: ${error.message}`);
      throw error;
    }
  }

  logout(userId, token) {
    try {
      // Blacklist the token
      this.tokenBlacklist.add(token);

      // Remove session
      this.sessionStore.delete(userId);

      logger.info(`User logged out: ${userId}`);

      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      logger.error(`Logout error: ${error.message}`);
      throw error;
    }
  }

  async verifyToken(token) {
    try {
      // Check if token is blacklisted
      if (this.tokenBlacklist.has(token)) {
        throw new Error('Token is blacklisted');
      }

      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);

      // Get user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return { valid: true, user };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isValid = await bcrypt.compare(oldPassword, user.password);
      if (!isValid) {
        throw new Error('Invalid current password');
      }

      // Hash new password
      user.password = await bcrypt.hash(newPassword, 10);
      user.passwordChangedAt = new Date();
      await user.save();

      // Invalidate all existing sessions
      this.clearUserSessions(userId);

      logger.info(`Password changed for user: ${userId}`);

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      logger.error(`Change password error: ${error.message}`);
      throw error;
    }
  }

  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        tenantId: user.tenantId
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn || '24h' }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        type: 'refresh'
      },
      config.jwt.refreshSecret || config.jwt.secret,
      { expiresIn: '7d' }
    );
  }

  storeSession(userId, sessionData) {
    this.sessionStore.set(userId, sessionData);
  }

  getSession(userId) {
    return this.sessionStore.get(userId);
  }

  clearUserSessions(userId) {
    this.sessionStore.delete(userId);
  }

  isTokenBlacklisted(token) {
    return this.tokenBlacklist.has(token);
  }

  // Cleanup expired tokens from blacklist (run periodically)
  cleanupBlacklist() {
    // In production, use Redis with TTL instead of in-memory Set
    const now = Date.now();
    for (const token of this.tokenBlacklist) {
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp * 1000 < now) {
          this.tokenBlacklist.delete(token);
        }
      } catch (error) {
        this.tokenBlacklist.delete(token);
      }
    }
  }
}

// Singleton instance
const enhancedAuthService = new EnhancedAuthService();

// Cleanup blacklist every hour
setInterval(() => {
  enhancedAuthService.cleanupBlacklist();
}, 60 * 60 * 1000);

module.exports = enhancedAuthService;
