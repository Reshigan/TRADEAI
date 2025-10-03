const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SalesTransaction = require('../../models/SalesTransaction');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { authenticateToken: auth } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get sales overview/summary
router.get('/overview', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    // Extract the ObjectId from the populated companyId
    let companyId;
    if (req.user.companyId && req.user.companyId._id) {
      companyId = req.user.companyId._id;
    } else {
      companyId = req.user.companyId;
    }
    
    logger.debug('Sales overview request', { 
      userId: req.user._id, 
      companyId, 
      companyIdType: typeof companyId 
    });
    
    const matchQuery = { company: companyId, status: 'completed' };
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const overview = await SalesTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$netAmount' },
          totalTransactions: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          avgTransactionValue: { $avg: '$netAmount' },
          totalDiscount: { $sum: '$discountAmount' }
        }
      }
    ]);
    
    const result = overview[0] || {
      totalRevenue: 0,
      totalTransactions: 0,
      totalQuantity: 0,
      avgTransactionValue: 0,
      totalDiscount: 0
    };
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Sales overview error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales overview'
    });
  }
});

// Get sales by period (monthly/quarterly)
router.get('/by-period', auth, async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;
    let companyId;
    if (req.user.companyId && req.user.companyId._id) {
      companyId = req.user.companyId._id;
    } else {
      companyId = req.user.companyId;
    }
    
    let groupBy;
    if (period === 'monthly') {
      groupBy = {
        year: { $year: '$date' },
        month: { $month: '$date' }
      };
    } else if (period === 'quarterly') {
      groupBy = {
        year: { $year: '$date' },
        quarter: { $ceil: { $divide: [{ $month: '$date' }, 3] } }
      };
    } else {
      groupBy = {
        year: { $year: '$date' }
      };
    }
    
    const salesByPeriod = await SalesTransaction.aggregate([
      {
        $match: {
          company: companyId,
          status: 'completed',
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$netAmount' },
          transactions: { $sum: 1 },
          quantity: { $sum: '$quantity' },
          avgTransactionValue: { $avg: '$netAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.quarter': 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: salesByPeriod
    });
  } catch (error) {
    logger.error('Sales by period error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales by period'
    });
  }
});

// Get top customers by revenue
router.get('/top-customers', auth, async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    let companyId;
    if (req.user.companyId && req.user.companyId._id) {
      companyId = req.user.companyId._id;
    } else {
      companyId = req.user.companyId;
    }
    
    const matchQuery = { company: companyId, status: 'completed' };
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const topCustomers = await SalesTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$customer',
          totalRevenue: { $sum: '$netAmount' },
          totalQuantity: { $sum: '$quantity' },
          transactionCount: { $sum: 1 },
          avgTransactionValue: { $avg: '$netAmount' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $project: {
          customerId: '$_id',
          customerName: '$customer.name',
          customerTier: '$customer.tier',
          totalRevenue: 1,
          totalQuantity: 1,
          transactionCount: 1,
          avgTransactionValue: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      data: topCustomers
    });
  } catch (error) {
    logger.error('Top customers error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top customers'
    });
  }
});

// Get top products by revenue
router.get('/top-products', auth, async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    let companyId;
    if (req.user.companyId && req.user.companyId._id) {
      companyId = req.user.companyId._id;
    } else {
      companyId = req.user.companyId;
    }
    
    const matchQuery = { company: companyId, status: 'completed' };
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const topProducts = await SalesTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$product',
          totalRevenue: { $sum: '$netAmount' },
          totalQuantity: { $sum: '$quantity' },
          transactionCount: { $sum: 1 },
          avgPrice: { $avg: '$unitPrice' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          productSku: '$product.sku',
          category: '$product.category.primary',
          totalRevenue: 1,
          totalQuantity: 1,
          transactionCount: 1,
          avgPrice: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    logger.error('Top products error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top products'
    });
  }
});

// Get sales by channel
router.get('/by-channel', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let companyId;
    if (req.user.companyId && req.user.companyId._id) {
      companyId = req.user.companyId._id;
    } else {
      companyId = req.user.companyId;
    }
    
    const matchQuery = { company: companyId, status: 'completed' };
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const salesByChannel = await SalesTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$channel',
          totalRevenue: { $sum: '$netAmount' },
          totalQuantity: { $sum: '$quantity' },
          transactionCount: { $sum: 1 },
          avgTransactionValue: { $avg: '$netAmount' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    res.json({
      success: true,
      data: salesByChannel
    });
  } catch (error) {
    logger.error('Sales by channel error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales by channel'
    });
  }
});

// Get sales trends (daily/weekly/monthly)
router.get('/trends', auth, async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;
    let companyId;
    if (req.user.companyId && req.user.companyId._id) {
      companyId = req.user.companyId._id;
    } else {
      companyId = req.user.companyId;
    }
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));
    
    let groupBy;
    if (period === 'daily') {
      groupBy = {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' }
      };
    } else if (period === 'weekly') {
      groupBy = {
        year: { $year: '$date' },
        week: { $week: '$date' }
      };
    } else {
      groupBy = {
        year: { $year: '$date' },
        month: { $month: '$date' }
      };
    }
    
    const trends = await SalesTransaction.aggregate([
      {
        $match: {
          company: companyId,
          status: 'completed',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$netAmount' },
          transactions: { $sum: 1 },
          quantity: { $sum: '$quantity' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('Sales trends error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales trends'
    });
  }
});

// Get sales transactions with pagination
router.get('/transactions', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      customer,
      product,
      startDate,
      endDate,
      channel,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;
    
    let companyId;
    if (req.user.companyId && req.user.companyId._id) {
      companyId = req.user.companyId._id;
    } else {
      companyId = req.user.companyId;
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = { company: companyId };
    
    if (customer) query.customer = customer;
    if (product) query.product = product;
    if (channel) query.channel = channel;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const transactions = await SalesTransaction.find(query)
      .populate('customer', 'name tier')
      .populate('product', 'name sku category')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await SalesTransaction.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Sales transactions error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales transactions'
    });
  }
});

module.exports = router;