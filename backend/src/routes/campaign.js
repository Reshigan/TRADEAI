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

router.get('/:id/budget', authenticateToken, asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  res.json({
    success: true,
    data: campaign.budget || {}
  });
}));

router.get('/:id/performance', authenticateToken, asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).populate('promotions');

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  const Promotion = require('../models/Promotion');
  const promotions = await Promotion.find({ campaign: req.params.id });

  const performance = {
    totalPromotions: promotions.length,
    totalCost: promotions.reduce((sum, p) => sum + (p.financial?.costs?.totalCost || 0), 0),
    totalRevenue: promotions.reduce((sum, p) => sum + (p.financial?.actual?.incrementalRevenue || 0), 0),
    avgROI: promotions.length > 0 ? promotions.reduce((sum, p) => sum + (p.financial?.profitability?.roi || 0), 0) / promotions.length : 0
  };

  res.json({
    success: true,
    data: performance
  });
}));

router.get('/:id/history', authenticateToken, asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    throw new AppError('Campaign not found', 404);
  }

  res.json({
    success: true,
    data: campaign.history || []
  });
}));

module.exports = router;
