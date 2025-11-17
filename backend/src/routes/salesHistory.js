const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const SalesHistory = require('../models/SalesHistory');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { bulkOperationsLimiter } = require('../middleware/security');

// Get sales history with filters
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    customerId,
    productId,
    aggregateBy = 'day',
    page = 1,
    limit = 100
  } = req.query;

  const query = {};

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  if (customerId) query.customer = customerId;
  if (productId) query.product = productId;

  const salesHistory = await SalesHistory.find(query)
    .populate('customer', 'name code')
    .populate('product', 'name sku')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ date: -1 });

  const count = await SalesHistory.countDocuments(query);

  res.json({
    success: true,
    data: salesHistory,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    total: count
  });
}));

// Get aggregated sales data
router.get('/aggregate', authenticateToken, asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    customerId,
    productId,
    groupBy = 'month'
  } = req.query;

  const matchStage = {};

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  if (customerId) matchStage.customer = mongoose.Types.ObjectId(customerId);
  if (productId) matchStage.product = mongoose.Types.ObjectId(productId);

  let groupStage = {};

  switch (groupBy) {
    case 'day':
      groupStage = {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        totalUnits: { $sum: '$units' },
        totalValue: { $sum: '$value' },
        count: { $sum: 1 }
      };
      break;
    case 'week':
      groupStage = {
        _id: {
          year: { $year: '$date' },
          week: { $week: '$date' }
        },
        totalUnits: { $sum: '$units' },
        totalValue: { $sum: '$value' },
        count: { $sum: 1 }
      };
      break;
    case 'month':
    default:
      groupStage = {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalUnits: { $sum: '$units' },
        totalValue: { $sum: '$value' },
        count: { $sum: 1 }
      };
  }

  const aggregatedData = await SalesHistory.aggregate([
    { $match: matchStage },
    { $group: groupStage },
    { $sort: { '_id': 1 } }
  ]);

  res.json({
    success: true,
    data: aggregatedData,
    groupBy
  });
}));

// Import sales history (bulk upload)
router.post('/import',
  bulkOperationsLimiter,
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      throw new AppError('Invalid data format', 400);
    }

    const salesHistory = await SalesHistory.insertMany(data, {
      ordered: false,
      rawResult: true
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${salesHistory.insertedCount} records`,
      failed: data.length - salesHistory.insertedCount
    });
  })
);

// Get sales trends
router.get('/trends', authenticateToken, asyncHandler(async (req, res) => {
  const { customerId, productId, period = '12months' } = req.query;

  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '3months':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '12months':
    default:
      startDate.setMonth(startDate.getMonth() - 12);
  }

  const matchStage = {
    date: { $gte: startDate, $lte: endDate }
  };

  if (customerId) matchStage.customer = mongoose.Types.ObjectId(customerId);
  if (productId) matchStage.product = mongoose.Types.ObjectId(productId);

  const trends = await SalesHistory.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalUnits: { $sum: '$units' },
        totalValue: { $sum: '$value' },
        avgPrice: { $avg: { $divide: ['$value', '$units'] } }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.json({
    success: true,
    data: trends,
    period,
    startDate,
    endDate
  });
}));

module.exports = router;
