const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');
const { authenticateToken } = require('../middleware/auth');

// GET all claims for the tenant
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const { status, type, customerId, startDate, endDate } = req.query;
    
    const query = { company: tenantId };
    if (status && status !== 'all') query.status = status;
    if (type) query.claimType = type;
    if (customerId) query.customer = customerId;
    if (startDate || endDate) {
      query.claimDate = {};
      if (startDate) query.claimDate.$gte = new Date(startDate);
      if (endDate) query.claimDate.$lte = new Date(endDate);
    }
    
    const claims = await Claim.find(query)
      .populate('customer', 'name code')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({
      success: true,
      data: claims,
      total: claims.length
    });
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create a new claim
router.post('/', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const userId = req.user._id;
    
    const claim = await Claim.create({
      ...req.body,
      company: tenantId,
      createdBy: userId,
      status: 'draft'
    });

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

// Submit a claim for approval
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const claim = await Claim.findByIdAndUpdate(
      id,
      { 
        status: 'submitted',
        submittedBy: userId,
        submittedAt: new Date()
      },
      { new: true }
    );

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

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

// Approve a claim
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedAmount } = req.body;
    const userId = req.user._id;
    
    const claim = await Claim.findByIdAndUpdate(
      id,
      { 
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
        approvedAmount: approvedAmount
      },
      { new: true }
    );

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

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

// Reject a claim
router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;
    
    const claim = await Claim.findByIdAndUpdate(
      id,
      { 
        status: 'rejected',
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: reason
      },
      { new: true }
    );

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

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

// Match claim to invoice
router.post('/:id/match-invoice', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { invoiceId, invoiceNumber, matchedAmount } = req.body;
    
    const claim = await Claim.findByIdAndUpdate(
      id,
      { 
        matchStatus: 'matched',
        matchedInvoice: invoiceId,
        matchedInvoiceNumber: invoiceNumber,
        matchedAmount: matchedAmount,
        matchedAt: new Date()
      },
      { new: true }
    );

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

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

// Auto-match claims
router.post('/auto-match', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    
    // Get unmatched claims
    const unmatchedClaims = await Claim.find({
      company: tenantId,
      matchStatus: { $ne: 'matched' }
    });

    res.json({
      success: true,
      data: {
        processed: unmatchedClaims.length,
        matched: 0,
        message: 'Auto-match functionality requires invoice integration'
      }
    });
  } catch (error) {
    console.error('Error auto-matching claims:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get unmatched claims
router.get('/unmatched', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const claims = await Claim.find({
      company: tenantId,
      matchStatus: { $ne: 'matched' }
    })
      .populate('customer', 'name code')
      .sort({ createdAt: -1 });

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

// Get pending approval claims
router.get('/pending-approval', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const claims = await Claim.find({
      company: tenantId,
      status: 'submitted'
    })
      .populate('customer', 'name code')
      .sort({ submittedAt: -1 });

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

// Get claims by customer
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;
    
    const query = {
      company: tenantId,
      customer: customerId
    };
    
    if (startDate || endDate) {
      query.claimDate = {};
      if (startDate) query.claimDate.$gte = new Date(startDate);
      if (endDate) query.claimDate.$lte = new Date(endDate);
    }
    
    const claims = await Claim.find(query)
      .populate('customer', 'name code')
      .sort({ createdAt: -1 });

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

// Get claim statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.company;
    const { startDate, endDate } = req.query;
    
    const query = { company: tenantId };
    if (startDate || endDate) {
      query.claimDate = {};
      if (startDate) query.claimDate.$gte = new Date(startDate);
      if (endDate) query.claimDate.$lte = new Date(endDate);
    }
    
    const totalClaims = await Claim.countDocuments(query);
    const pendingClaims = await Claim.countDocuments({ ...query, status: 'submitted' });
    const approvedClaims = await Claim.countDocuments({ ...query, status: 'approved' });
    const rejectedClaims = await Claim.countDocuments({ ...query, status: 'rejected' });
    
    const totalAmount = await Claim.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$claimAmount' } } }
    ]);
    
    const approvedAmount = await Claim.aggregate([
      { $match: { ...query, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$approvedAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalClaims,
        pendingClaims,
        approvedClaims,
        rejectedClaims,
        totalAmount: totalAmount[0]?.total || 0,
        approvedAmount: approvedAmount[0]?.total || 0
      }
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
