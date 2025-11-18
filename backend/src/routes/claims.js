const express = require('express');
const router = express.Router();
const claimService = require('../services/claimService');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const userId = req.user._id;
    const claim = await claimService.createClaim(tenantId, req.body, userId);

    res.status(201).json({
      success: true,
      data: claim
    });
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const claim = await claimService.submitClaim(id, userId);

    res.json({
      success: true,
      data: claim
    });
  } catch (error) {
    console.error('Error submitting claim:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedAmount } = req.body;
    const userId = req.user._id;
    const claim = await claimService.approveClaim(id, userId, approvedAmount);

    res.json({
      success: true,
      data: claim
    });
  } catch (error) {
    console.error('Error approving claim:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;
    const claim = await claimService.rejectClaim(id, userId, reason);

    res.json({
      success: true,
      data: claim
    });
  } catch (error) {
    console.error('Error rejecting claim:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/match-invoice', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { invoiceId, invoiceNumber, matchedAmount } = req.body;
    const claim = await claimService.matchClaimToInvoice(id, invoiceId, invoiceNumber, matchedAmount);

    res.json({
      success: true,
      data: claim
    });
  } catch (error) {
    console.error('Error matching claim to invoice:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/auto-match', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const results = await claimService.autoMatchClaims(tenantId);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error auto-matching claims:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/unmatched', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const claims = await claimService.getUnmatchedClaims(tenantId);

    res.json({
      success: true,
      data: claims
    });
  } catch (error) {
    console.error('Error fetching unmatched claims:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/pending-approval', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const claims = await claimService.getPendingApprovalClaims(tenantId);

    res.json({
      success: true,
      data: claims
    });
  } catch (error) {
    console.error('Error fetching pending approval claims:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;
    const claims = await claimService.getClaimsByCustomer(tenantId, customerId, startDate, endDate);

    res.json({
      success: true,
      data: claims
    });
  } catch (error) {
    console.error('Error fetching claims by customer:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const { startDate, endDate } = req.query;
    const stats = await claimService.getClaimStatistics(tenantId, startDate, endDate);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching claim statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
