const express = require('express');
const router = express.Router();
const enhancedAuthService = require('../services/enhanced-auth.service');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await enhancedAuthService.login(email, password, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json(result);
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const result = await enhancedAuthService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const result = await enhancedAuthService.refreshToken(refreshToken);
    res.json(result);
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const result = await enhancedAuthService.logout(req.user._id.toString(), req.token);
    res.json(result);
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Verify token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        _id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        companyId: req.user.companyId,
        tenantId: req.user.tenantId
      }
    });
  } catch (error) {
    logger.error(`Verify error: ${error.message}`);
    res.status(401).json({
      success: false,
      message: 'Token verification failed'
    });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Old and new passwords are required'
      });
    }

    const result = await enhancedAuthService.changePassword(
      req.user._id,
      oldPassword,
      newPassword
    );

    res.json(result);
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message || 'Password change failed'
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        _id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        companyId: req.user.companyId,
        tenantId: req.user.tenantId,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

module.exports = router;
