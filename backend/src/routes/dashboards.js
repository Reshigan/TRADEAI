const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const SalesHistory = require('../models/SalesHistory');
const Promotion = require('../models/Promotion');
const Budget = require('../models/Budget');
const TradeSpend = require('../models/TradeSpend');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Deduction = require('../models/Deduction');

router.get('/admin', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const tenantId = req.user.tenantId;

    const totalUsers = await User.countDocuments({ tenantId, isActive: true });
    const totalCustomers = await Customer.countDocuments({ tenantId });
    const totalPromotions = await Promotion.countDocuments({ tenantId });
    const activePromotions = await Promotion.countDocuments({ tenantId, status: 'active' });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await User.countDocuments({
      tenantId,
      lastLogin: { $gte: thirtyDaysAgo }
    });

    const totalSales = await SalesHistory.countDocuments({ company: tenantId });
    const salesWithPromotions = await SalesHistory.countDocuments({
      company: tenantId,
      'promotions.0': { $exists: true }
    });

    const budgetUtilization = await Budget.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: null,
          totalAllocated: { $sum: '$allocated' },
          totalSpent: { $sum: '$spent' }
        }
      }
    ]);

    const utilizationRate = budgetUtilization[0]
      ? (budgetUtilization[0].totalSpent / budgetUtilization[0].totalAllocated) * 100
      : 0;

    res.json({
      systemHealth: {
        totalUsers,
        activeUsers,
        totalCustomers,
        totalPromotions,
        activePromotions
      },
      dataQuality: {
        totalSales,
        salesWithPromotions,
        promotionalCoverage: totalSales > 0 ? (salesWithPromotions / totalSales) * 100 : 0
      },
      budgetMetrics: {
        totalAllocated: budgetUtilization[0]?.totalAllocated || 0,
        totalSpent: budgetUtilization[0]?.totalSpent || 0,
        utilizationRate
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Error fetching admin dashboard data', error: error.message });
  }
});

router.get('/manager', protect, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Manager role required.' });
    }

    const tenantId = req.user.tenantId;

    const pendingTradeSpends = await TradeSpend.find({
      tenantId,
      status: 'submitted'
    }).populate('customer', 'name').limit(10);

    const pendingPromotions = await Promotion.find({
      tenantId,
      status: 'pending_approval'
    }).populate('createdBy', 'firstName lastName').limit(10);

    const budgetByCategory = await Budget.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: '$category',
          allocated: { $sum: '$allocated' },
          spent: { $sum: '$spent' },
          available: { $sum: '$available' }
        }
      },
      {
        $project: {
          category: '$_id',
          allocated: 1,
          spent: 1,
          available: 1,
          utilization: {
            $multiply: [{ $divide: ['$spent', '$allocated'] }, 100]
          }
        }
      }
    ]);

    const topPromotions = await Promotion.aggregate([
      { $match: { tenantId, status: { $in: ['active', 'completed'] } } },
      {
        $lookup: {
          from: 'saleshistories',
          let: { promoId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$$promoId', '$promotions.promotion']
                }
              }
            },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$revenue.gross' },
                totalVolume: { $sum: '$quantity' }
              }
            }
          ],
          as: 'performance'
        }
      },
      { $unwind: { path: '$performance', preserveNullAndEmptyArrays: true } },
      { $sort: { 'performance.totalRevenue': -1 } },
      { $limit: 5 }
    ]);

    // Performance Metrics
    const performanceMetrics = await SalesHistory.aggregate([
      { $match: { company: tenantId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue.gross' },
          totalVolume: { $sum: '$quantity' },
          totalCost: { $sum: '$costs.totalCost' }
        }
      }
    ]);

    const metrics = performanceMetrics[0] || { totalRevenue: 0, totalVolume: 0, totalCost: 0 };
    const grossProfit = metrics.totalRevenue - metrics.totalCost;
    const margin = metrics.totalRevenue > 0 ? (grossProfit / metrics.totalRevenue) * 100 : 0;

    res.json({
      pendingApprovals: {
        tradeSpends: pendingTradeSpends,
        promotions: pendingPromotions,
        totalPending: pendingTradeSpends.length + pendingPromotions.length
      },
      budgetUtilization: budgetByCategory,
      performance: {
        totalRevenue: metrics.totalRevenue,
        totalVolume: metrics.totalVolume,
        grossProfit,
        margin,
        topPromotions
      }
    });
  } catch (error) {
    console.error('Manager dashboard error:', error);
    res.status(500).json({ message: 'Error fetching manager dashboard data', error: error.message });
  }
});

router.get('/kam', protect, async (req, res) => {
  try {
    if (req.user.role !== 'kam' && req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. KAM role required.' });
    }

    const tenantId = req.user.tenantId;
    const userId = req.user._id;

    const user = await User.findById(userId).populate('assignedCustomers');
    const assignedCustomerIds = user.assignedCustomers || [];

    const customerPerformance = await SalesHistory.aggregate([
      {
        $match: {
          company: tenantId,
          customer: { $in: assignedCustomerIds }
        }
      },
      {
        $group: {
          _id: '$customer',
          totalRevenue: { $sum: '$revenue.gross' },
          totalVolume: { $sum: '$quantity' }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { $unwind: '$customerInfo' },
      { $sort: { totalRevenue: -1 } }
    ]);

    const myDeductions = await Deduction.find({
      tenantId,
      createdBy: userId,
      status: { $in: ['pending', 'submitted', 'approved'] }
    }).populate('customer', 'name').sort({ createdAt: -1 }).limit(10);

    const walletBalance = await TradeSpend.aggregate([
      {
        $match: {
          tenantId,
          customer: { $in: assignedCustomerIds },
          spendType: 'cash_coop'
        }
      },
      {
        $group: {
          _id: null,
          totalAllocated: { $sum: '$amount.approved' },
          totalSpent: { $sum: '$amount.spent' }
        }
      }
    ]);

    const wallet = walletBalance[0] || { totalAllocated: 0, totalSpent: 0 };
    const availableBalance = wallet.totalAllocated - wallet.totalSpent;

    res.json({
      myCustomers: {
        count: assignedCustomerIds.length,
        performance: customerPerformance
      },
      myDeductions: {
        pending: myDeductions.filter(d => d.status === 'pending').length,
        submitted: myDeductions.filter(d => d.status === 'submitted').length,
        approved: myDeductions.filter(d => d.status === 'approved').length,
        recent: myDeductions
      },
      myWallet: {
        allocated: wallet.totalAllocated,
        spent: wallet.totalSpent,
        available: availableBalance,
        utilizationRate: wallet.totalAllocated > 0 ? (wallet.totalSpent / wallet.totalAllocated) * 100 : 0
      }
    });
  } catch (error) {
    console.error('KAM dashboard error:', error);
    res.status(500).json({ message: 'Error fetching KAM dashboard data', error: error.message });
  }
});

module.exports = router;
