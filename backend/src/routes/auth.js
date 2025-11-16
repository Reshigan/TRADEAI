const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { rateLimitByRole } = require('../middleware/auth');

// Simplified validation rules for login - support both email and username
const loginValidation = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),
  body('username')
    .optional()
    .notEmpty()
    .withMessage('Username is required when not using email')
    .isLength({ max: 100 })
    .withMessage('Username must be less than 100 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 200 })
    .withMessage('Password must be less than 200 characters'),
  body('tenantId')
    .optional()
    .notEmpty()
    .withMessage('Tenant ID must not be empty if provided')
    .isLength({ max: 100 })
    .withMessage('Tenant ID must be less than 100 characters')
].concat([
  // At least one of email or username must be provided
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.username) {
      throw new Error('Either email or username is required');
    }
    return true;
  })
]);

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be 8-128 characters with uppercase, lowercase, number and special character'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name must be less than 100 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name must be less than 100 characters'),
  body('employeeId')
    .trim()
    .notEmpty()
    .withMessage('Employee ID is required')
    .isLength({ max: 50 })
    .withMessage('Employee ID must be less than 50 characters'),
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
