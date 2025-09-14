const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get all users (with role-based filtering)
router.get('/', userController.getUsers);

// Get single user
router.get('/:id', userController.getUser);

// Create new user (admin only)
router.post('/', authorize(['super_admin', 'admin']), userController.createUser);

// Update user
router.put('/:id', userController.updateUser);

// Delete user (admin only)
router.delete('/:id', authorize(['super_admin', 'admin']), userController.deleteUser);

// Toggle user status (admin only)
router.patch('/:id/toggle-status', authorize(['super_admin', 'admin']), userController.toggleUserStatus);

// Assign role to user (admin only)
router.patch('/:id/assign-role', authorize(['super_admin', 'admin']), userController.assignRole);

// Get available roles and permissions
router.get('/roles/available', userController.getUserRoles);

module.exports = router;