const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { rateLimitByRole } = require('../middleware/auth');

// Simplified validation rules for login (remove normalizeEmail temporarily)
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 8 characters, including uppercase, lowercase, number and special character'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('employeeId')
    .trim()
    .notEmpty()
    .withMessage('Employee ID is required'),
  body('role')
    .isIn(['admin', 'board', 'director', 'manager', 'kam', 'sales_rep', 'sales_admin', 'analyst'])
    .withMessage('Invalid role'),
  body('department')
    .isIn(['sales', 'marketing', 'finance', 'operations', 'admin'])
    .withMessage('Invalid department')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 8 characters, including uppercase, lowercase, number and special character')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 8 characters, including uppercase, lowercase, number and special character')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('New password must be different from current password')
];

// Routes
router.post('/register', ...registerValidation, validate, authController.register);
router.post('/login', ...loginValidation, validate, authController.login);
router.post('/quick-login', authController.quickLogin); // Demo quick login
router.post('/logout', authenticateToken, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', ...forgotPasswordValidation, validate, authController.forgotPassword);
router.post('/reset-password', ...resetPasswordValidation, validate, authController.resetPassword);
router.post('/change-password', authenticateToken, ...changePasswordValidation, validate, authController.changePassword);
router.get('/me', authenticateToken, authController.getMe);
router.put('/me', authenticateToken, authController.updateMe);
router.post('/verify-2fa', authenticateToken, authController.verify2FA);
router.post('/enable-2fa', authenticateToken, authController.enable2FA);
router.post('/disable-2fa', authenticateToken, authController.disable2FA);

module.exports = router;