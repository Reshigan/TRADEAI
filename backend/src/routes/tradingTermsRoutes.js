const express = require('express');
const router = express.Router();
const tradingTermsController = require('../controllers/tradingTermsController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get trading term options (types, statuses, etc.)
router.get('/options', tradingTermsController.getTradingTermOptions);

// Get all trading terms
router.get('/', tradingTermsController.getTradingTerms);

// Get single trading term
router.get('/:id', tradingTermsController.getTradingTerm);

// Create new trading term
router.post('/', tradingTermsController.createTradingTerm);

// Update trading term
router.put('/:id', tradingTermsController.updateTradingTerm);

// Delete trading term
router.delete('/:id', tradingTermsController.deleteTradingTerm);

// Submit trading term for approval
router.post('/:id/submit', tradingTermsController.submitForApproval);

// Approve/Reject trading term
router.post('/:id/approve-reject', tradingTermsController.approveRejectTradingTerm);

// Calculate discount for given parameters
router.post('/:id/calculate', tradingTermsController.calculateDiscount);

module.exports = router;