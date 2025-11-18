const express = require('express');
const router = express.Router();
const approvalService = require('../services/approvalService');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { entityType, entityId, amount, metadata } = req.body;
    const tenantId = req.user.company;
    const requestedBy = req.user._id;

    const approval = await approvalService.createApproval(
      tenantId,
      entityType,
      entityId,
      requestedBy,
      amount,
      metadata
    );

    res.status(201).json({
      success: true,
      data: approval
    });
  } catch (error) {
    console.error('Error creating approval:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const approvals = await approvalService.getPendingApprovalsForUser(userId);

    res.json({
      success: true,
      data: approvals
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/overdue', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const approvals = await approvalService.getOverdueApprovals(tenantId);

    res.json({
      success: true,
      data: approvals
    });
  } catch (error) {
    console.error('Error fetching overdue approvals:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/entity/:entityType/:entityId', authenticateToken, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const approvals = await approvalService.getApprovalsByEntity(entityType, entityId);

    res.json({
      success: true,
      data: approvals
    });
  } catch (error) {
    console.error('Error fetching approvals by entity:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const approverId = req.user._id;

    const approval = await approvalService.approveApproval(id, approverId, comments);

    res.json({
      success: true,
      data: approval
    });
  } catch (error) {
    console.error('Error approving approval:', error);
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
    const approverId = req.user._id;

    const approval = await approvalService.rejectApproval(id, approverId, reason);

    res.json({
      success: true,
      data: approval
    });
  } catch (error) {
    console.error('Error rejecting approval:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const approval = await approvalService.cancelApproval(id, userId, reason);

    res.json({
      success: true,
      data: approval
    });
  } catch (error) {
    console.error('Error cancelling approval:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/:id/sla', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const isOverdue = await approvalService.checkSLA(id);

    res.json({
      success: true,
      data: { isOverdue }
    });
  } catch (error) {
    console.error('Error checking SLA:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
