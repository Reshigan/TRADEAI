const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const Campaign = require('../models/Campaign');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

// Get all campaigns
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, year } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (year) query.year = parseInt(year);
  
  const campaigns = await Campaign.find(query)
    .populate('promotions', 'name promotionId')
    .populate('createdBy', 'firstName lastName')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });
  
  const count = await Campaign.countDocuments(query);
  
  res.json({
    success: true,
    data: campaigns,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    total: count
  });
}));

// Get campaign by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate('promotions')
    .populate('createdBy', 'firstName lastName');
  
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }
  
  res.json({
    success: true,
    data: campaign
  });
}));

// Create new campaign
router.post('/', authenticateToken, authorize('admin', 'manager', 'kam'), asyncHandler(async (req, res) => {
  const campaign = await Campaign.create({
    ...req.body,
    createdBy: req.user._id
  });
  
  res.status(201).json({
    success: true,
    data: campaign
  });
}));

// Update campaign
router.put('/:id', authenticateToken, authorize('admin', 'manager', 'kam'), asyncHandler(async (req, res) => {
  const campaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }
  
  res.json({
    success: true,
    data: campaign
  });
}));

// Delete campaign
router.delete('/:id', authenticateToken, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const campaign = await Campaign.findByIdAndDelete(req.params.id);
  
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }
  
  res.json({
    success: true,
    message: 'Campaign deleted successfully'
  });
}));

// Add promotion to campaign
router.post('/:id/promotions', authenticateToken, authorize('admin', 'manager', 'kam'), asyncHandler(async (req, res) => {
  const { promotionId } = req.body;
  
  const campaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { promotions: promotionId } },
    { new: true }
  ).populate('promotions');
  
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }
  
  res.json({
    success: true,
    data: campaign
  });
}));

// Remove promotion from campaign
router.delete('/:id/promotions/:promotionId', authenticateToken, authorize('admin', 'manager', 'kam'), asyncHandler(async (req, res) => {
  const campaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    { $pull: { promotions: req.params.promotionId } },
    { new: true }
  ).populate('promotions');
  
  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }
  
  res.json({
    success: true,
    data: campaign
  });
}));

module.exports = router;