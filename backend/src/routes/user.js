const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// Get all users (admin only)
router.get('/', authenticateToken, authorize('admin'), asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    count: users.length,
    data: users
  });
}));

// IMPORTANT: Route order matters! 
// The /me route must be defined BEFORE /:id route
// Otherwise, Express will treat 'me' as an ID parameter
// and route to /:id handler instead of /me handler

// Get current user profile
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  
  res.json({
    success: true,
    data: user
  });
}));

// Get user by ID (admin only)
router.get('/:id', authenticateToken, authorize('admin'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.json({
    success: true,
    data: user
  });
}));

// Update current user profile
// Note: Only allows updating safe fields. Protected fields like role, 
// company, password, etc. must be updated through admin endpoints
router.put('/me', authenticateToken, asyncHandler(async (req, res) => {
  const allowedUpdates = ['firstName', 'lastName', 'phone', 'preferences'];
  
  // Validate that at least one field is being updated
  const updateKeys = Object.keys(req.body).filter(key => allowedUpdates.includes(key));
  if (updateKeys.length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }
  
  // Filter to only allowed updates
  const updates = updateKeys.reduce((obj, key) => {
    obj[key] = req.body[key];
    return obj;
  }, {});
  
  // Validate input lengths
  if (updates.firstName && updates.firstName.length > 100) {
    throw new AppError('First name must be less than 100 characters', 400);
  }
  if (updates.lastName && updates.lastName.length > 100) {
    throw new AppError('Last name must be less than 100 characters', 400);
  }
  if (updates.phone && updates.phone.length > 20) {
    throw new AppError('Phone number must be less than 20 characters', 400);
  }
  
  let user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Remove password from response
  const userObj = user.toObject ? user.toObject() : {...user};
  delete userObj.password;
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: userObj
  });
}));

// Update user by ID (admin only)
router.put('/:id', authenticateToken, authorize('admin'), asyncHandler(async (req, res) => {
  const { password, ...updates } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.json({
    success: true,
    data: user
  });
}));

// Delete user (admin only)
router.delete('/:id', authenticateToken, authorize('admin'), asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

module.exports = router;