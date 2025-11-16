const express = require('express');
const router = express.Router();
const deductionService = require('../services/deductionService');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const userId = req.user._id;
    const deduction = await deductionService.createDeduction(tenantId, req.body, userId);
    
    res.status(201).json({
      success: true,
      data: deduction
    });
  } catch (error) {
    console.error('Error creating deduction:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/validate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { validatedAmount } = req.body;
    const userId = req.user._id;
    const deduction = await deductionService.validateDeduction(id, userId, validatedAmount);
    
    res.json({
      success: true,
      data: deduction
    });
  } catch (error) {
    console.error('Error validating deduction:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/dispute', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;
    const deduction = await deductionService.disputeDeduction(id, userId, reason);
    
    res.json({
      success: true,
      data: deduction
    });
  } catch (error) {
    console.error('Error disputing deduction:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionType, finalAmount, notes } = req.body;
    const userId = req.user._id;
    const deduction = await deductionService.resolveDeduction(id, userId, resolutionType, finalAmount, notes);
    
    res.json({
      success: true,
      data: deduction
    });
  } catch (error) {
    console.error('Error resolving deduction:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/match-claim', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { claimId, matchedAmount } = req.body;
    const deduction = await deductionService.matchDeductionToClaim(id, claimId, matchedAmount);
    
    res.json({
      success: true,
      data: deduction
    });
  } catch (error) {
    console.error('Error matching deduction to claim:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/auto-match', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const results = await deductionService.autoMatchDeductions(tenantId);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error auto-matching deductions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/unmatched', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const deductions = await deductionService.getUnmatchedDeductions(tenantId);
    
    res.json({
      success: true,
      data: deductions
    });
  } catch (error) {
    console.error('Error fetching unmatched deductions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/disputed', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const deductions = await deductionService.getDisputedDeductions(tenantId);
    
    res.json({
      success: true,
      data: deductions
    });
  } catch (error) {
    console.error('Error fetching disputed deductions:', error);
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
    const deductions = await deductionService.getDeductionsByCustomer(tenantId, customerId, startDate, endDate);
    
    res.json({
      success: true,
      data: deductions
    });
  } catch (error) {
    console.error('Error fetching deductions by customer:', error);
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
    const stats = await deductionService.getDeductionStatistics(tenantId, startDate, endDate);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching deduction statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/reconcile/:customerId', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;
    const reconciliation = await deductionService.reconcileDeductionsWithClaims(tenantId, customerId, startDate, endDate);
    
    res.json({
      success: true,
      data: reconciliation
    });
  } catch (error) {
    console.error('Error reconciling deductions with claims:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
