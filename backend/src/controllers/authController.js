const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { cacheService } = require('../services/cacheService');
const emailService = require('../services/emailService');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate tokens
const generateTokens = (user) => {
  try {
    console.log('Generating access token for user:', user._id);
    const accessToken = user.generateAuthToken();
    console.log('Access token generated successfully');
    
    const refreshToken = jwt.sign(
      { _id: user._id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
    console.log('Refresh token generated successfully');
    
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error in generateTokens:', error);
    throw error;
  }
};

// Register new user
exports.register = asyncHandler(async (req, res, next) => {
  const { email, password, firstName, lastName, employeeId, role, department } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { employeeId }] });
  if (existingUser) {
    throw new AppError('User with this email or employee ID already exists', 400);
  }
  
  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    employeeId,
    role,
    department
  });
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);
  
  // Cache user data
  await cacheService.cacheUser(user._id.toString(), user);
  
  // Send welcome email
  await emailService.sendWelcomeEmail(user);
  
  // Log registration
  logger.logAudit('user_registered', user._id, {
    email: user.email,
    role: user.role
  });
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

// Quick login for demo
exports.quickLogin = asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  
  // Map role to demo user email
  const demoUsers = {
    admin: 'admin@tradeai.com',
    manager: 'manager@tradeai.com',
    kam: 'kam@tradeai.com'
  };
  
  const email = demoUsers[role];
  if (!email) {
    throw new AppError('Invalid demo role', 400);
  }
  
  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Demo user not found', 404);
  }
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);
  
  // Cache user data
  await cacheService.cacheUser(user._id.toString(), user);
  
  // Log login
  logger.logAudit('quick_login', user._id, {
    email: user.email,
    role: user.role
  });
  
  res.json({
    success: true,
    message: 'Quick login successful',
    data: {
      user: user.toJSON(),
      accessToken,
      refreshToken
    }
  });
});

// Login
exports.login = asyncHandler(async (req, res, next) => {
  const { email, username, password, tenantId } = req.body;
  
  if ((!email && !username) || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email/username and password'
    });
  }
  
  try {
    const loginIdentifier = email || username;
    logger.info(`Login attempt for: ${loginIdentifier}${tenantId ? ` (tenant: ${tenantId})` : ''}`);
    
    // Find user by email or username
    const searchQuery = email 
      ? { email: email.toLowerCase() }
      : { $or: [
          { email: username.toLowerCase() },
          { employeeId: username },
          { username: username }
        ]};
    
    const user = await User.findOne(searchQuery);
    
    logger.info(`User found: ${user ? 'Yes' : 'No'}`);
    if (user) {
      logger.info(`User active: ${user.isActive}`);
      logger.info(`User has password: ${user.password ? 'Yes' : 'No'}`);
    }
    
    if (!user || !user.isActive) {
      logger.warn(`Authentication failed for ${loginIdentifier}: User not found or inactive`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password using bcrypt
    logger.info('Checking password...');
    const isPasswordCorrect = await user.comparePassword(password);
    logger.info(`Password correct: ${isPasswordCorrect}`);
    
    if (!isPasswordCorrect) {
      logger.warn(`Authentication failed for ${email}: Invalid password`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    // Cache user data if cache service is available
    try {
      if (cacheService && cacheService.cacheUser) {
        await cacheService.cacheUser(user._id.toString(), user);
      }
    } catch (cacheError) {
      logger.warn('Failed to cache user data:', cacheError);
    }
    
    // Log successful login
    logger.info(`User logged in: ${user.email} (${user.role})`);
    
    // Return success with token
    return res.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
    
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify 2FA
exports.verify2FA = asyncHandler(async (req, res, next) => {
  const { token } = req.body;
  
  // Verify the token is valid
  const verified = speakeasy.totp.verify({
    secret: req.user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 2
  });
  
  if (!verified) {
    throw new AppError('Invalid 2FA token', 401);
  }
  
  // Generate real tokens
  const { accessToken, refreshToken } = generateTokens(req.user);
  
  // Update last login
  req.user.lastLogin = new Date();
  await req.user.save();
  
  res.json({
    success: true,
    message: '2FA verification successful',
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

// Enable 2FA
exports.enable2FA = asyncHandler(async (req, res, next) => {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `FMCG Trade Spend (${req.user.email})`
  });
  
  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  
  // Save secret temporarily (not enabled yet)
  req.user.twoFactorSecret = secret.base32;
  await req.user.save();
  
  res.json({
    success: true,
    message: '2FA setup initiated',
    data: {
      secret: secret.base32,
      qrCode
    }
  });
});

// Disable 2FA
exports.disable2FA = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  
  // Verify password
  const isMatch = await req.user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid password', 401);
  }
  
  // Disable 2FA
  req.user.twoFactorEnabled = false;
  req.user.twoFactorSecret = undefined;
  await req.user.save();
  
  logger.logAudit('2fa_disabled', req.user._id);
  
  res.json({
    success: true,
    message: '2FA disabled successfully'
  });
});

// Logout
exports.logout = asyncHandler(async (req, res, next) => {
  // Invalidate cache
  await cacheService.deleteSession(req.token);
  
  // Log logout
  logger.logAudit('user_logout', req.user._id);
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Refresh token
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new AppError('Refresh token required', 400);
  }
  
  // Verify refresh token
  const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  
  // Find user
  const user = await User.findById(decoded._id);
  if (!user || !user.isActive) {
    throw new AppError('Invalid refresh token', 401);
  }
  
  // Generate new tokens
  const tokens = generateTokens(user);
  
  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens
    }
  });
});

// Forgot password
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  
  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists
    return res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent'
    });
  }
  
  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Save reset token
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save();
  
  // Send reset email
  const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
  await emailService.sendPasswordResetEmail(user, resetUrl);
  
  logger.logAudit('password_reset_requested', user._id);
  
  res.json({
    success: true,
    message: 'If the email exists, a reset link has been sent'
  });
});

// Reset password
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;
  
  // Hash token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with valid token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }
  
  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  
  logger.logAudit('password_reset_completed', user._id);
  
  res.json({
    success: true,
    message: 'Password reset successful'
  });
});

// Change password
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  
  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  // Generate new tokens
  const { accessToken, refreshToken } = generateTokens(user);
  
  logger.logAudit('password_changed', user._id);
  
  res.json({
    success: true,
    message: 'Password changed successfully',
    data: {
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

// Get current user
exports.getMe = asyncHandler(async (req, res, next) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// Update current user
exports.updateMe = asyncHandler(async (req, res, next) => {
  const updates = {};
  const allowedUpdates = ['firstName', 'lastName', 'preferences'];
  
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });
  
  // Update user
  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );
  
  // Invalidate cache
  await cacheService.delete(cacheService.generateKey('user', user._id.toString()));
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});