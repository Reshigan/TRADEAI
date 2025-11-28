const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const SalesHistory = require('../models/SalesHistory');
const Promotion = require('../models/Promotion');
const TradeSpend = require('../models/TradeSpend');
const Budget = require('../models/Budget');

router.get('/promotion-effectiveness', protect, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { startDate, endDate, promotionType } = req.query;

    const matchCriteria = {
      tenantId,
      status: { $in: ['active', 'completed'] }
    };

    if (startDate && endDate) {
      matchCriteria['period.startDate'] = { $gte: new Date(startDate) };
      matchCriteria['period.endDate'] = { $lte: new Date(endDate) };
    }

    if (promotionType) {
      matchCriteria.promotionType = promotionType;
    }

    const promotions = await Promotion.find(matchCriteria);

    const scorecard = [];

    for (const promo of promotions) {
      const promoSales = await SalesHistory.aggregate([
        {
          $match: {
            company: tenantId,
            'promotions.promotion': promo._id
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$revenue.gross' },
            totalVolume: { $sum: '$quantity' },
            totalCost: { $sum: '$costs.totalCost' }
          }
        }
      ]);

      const tradeSpend = await TradeSpend.findOne({
        tenantId,
        promotion: promo._id
      });

      const sales = promoSales[0] || { totalRevenue: 0, totalVolume: 0, totalCost: 0 };
      const grossProfit = sales.totalRevenue - sales.totalCost;
      const spendAmount = tradeSpend?.amount?.approved || 0;
      const roi = spendAmount > 0 ? ((grossProfit - spendAmount) / spendAmount) * 100 : 0;
      const expectedLift = promo.financial?.planned?.volumeLift || 1.2;

      scorecard.push({
        promotionId: promo._id,
        promotionName: promo.name,
        promotionType: promo.promotionType,
        startDate: promo.period.startDate,
        endDate: promo.period.endDate,
        status: promo.status,
        metrics: {
          revenue: sales.totalRevenue,
          volume: sales.totalVolume,
          grossProfit,
          tradeSpend: spendAmount,
          roi,
          expectedLift,
          margin: sales.totalRevenue > 0 ? (grossProfit / sales.totalRevenue) * 100 : 0
        },
        performance: roi > 100 ? 'excellent' : roi > 50 ? 'good' : roi > 0 ? 'fair' : 'poor'
      });
    }

    scorecard.sort((a, b) => b.metrics.roi - a.metrics.roi);

    res.json({
      scorecard,
      summary: {
        totalPromotions: scorecard.length,
        averageROI: scorecard.reduce((sum, p) => sum + p.metrics.roi, 0) / scorecard.length || 0,
        totalRevenue: scorecard.reduce((sum, p) => sum + p.metrics.revenue, 0),
        totalSpend: scorecard.reduce((sum, p) => sum + p.metrics.tradeSpend, 0),
        excellent: scorecard.filter(p => p.performance === 'excellent').length,
        good: scorecard.filter(p => p.performance === 'good').length,
        fair: scorecard.filter(p => p.performance === 'fair').length,
        poor: scorecard.filter(p => p.performance === 'poor').length
      }
    });
  } catch (error) {
    console.error('Promotion effectiveness error:', error);
    res.status(500).json({ message: 'Error calculating promotion effectiveness', error: error.message });
  }
});

router.get('/roi-trending', protect, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { startDate, endDate, granularity = 'month' } = req.query;

    const matchCriteria = {
      tenantId,
      status: { $in: ['active', 'completed'] }
    };

    if (startDate && endDate) {
      matchCriteria['period.startDate'] = { $gte: new Date(startDate) };
      matchCriteria['period.endDate'] = { $lte: new Date(endDate) };
    }

    let groupBy;
    if (granularity === 'week') {
      groupBy = { year: { $year: '$period.startDate' }, week: { $week: '$period.startDate' } };
    } else if (granularity === 'quarter') {
      groupBy = { year: { $year: '$period.startDate' }, quarter: { $ceil: { $divide: [{ $month: '$period.startDate' }, 3] } } };
    } else {
      groupBy = { year: { $year: '$period.startDate' }, month: { $month: '$period.startDate' } };
    }

    const promotions = await Promotion.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: groupBy,
          promotions: { $push: '$_id' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.quarter': 1 } }
    ]);

    const trending = [];

    for (const period of promotions) {
      let totalRevenue = 0;
      let totalCost = 0;
      let totalSpend = 0;

      for (const promoId of period.promotions) {
        const sales = await SalesHistory.aggregate([
          {
            $match: {
              company: tenantId,
              'promotions.promotion': promoId
            }
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: '$revenue.gross' },
              cost: { $sum: '$costs.totalCost' }
            }
          }
        ]);

        const tradeSpend = await TradeSpend.findOne({
          tenantId,
          promotion: promoId
        });

        totalRevenue += sales[0]?.revenue || 0;
        totalCost += sales[0]?.cost || 0;
        totalSpend += tradeSpend?.amount?.approved || 0;
      }

      const grossProfit = totalRevenue - totalCost;
      const roi = totalSpend > 0 ? ((grossProfit - totalSpend) / totalSpend) * 100 : 0;

      trending.push({
        period: period._id,
        promotionCount: period.count,
        revenue: totalRevenue,
        grossProfit,
        tradeSpend: totalSpend,
        roi
      });
    }

    res.json({ trending });
  } catch (error) {
    console.error('ROI trending error:', error);
    res.status(500).json({ message: 'Error calculating ROI trending', error: error.message });
  }
});

// Get budget variance analysis
router.get('/budget-variance', protect, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { year } = req.query;

    const matchCriteria = { tenantId };

    if (year) {
      matchCriteria.year = parseInt(year);
    }

    const budgetVariance = await Budget.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: '$category',
          totalAllocated: { $sum: '$allocated' },
          totalSpent: { $sum: '$spent' },
          totalRemaining: { $sum: '$remaining' }
        }
      },
      {
        $project: {
          category: '$_id',
          allocated: '$totalAllocated',
          spent: '$totalSpent',
          remaining: '$totalRemaining',
          variance: { $subtract: ['$totalAllocated', '$totalSpent'] },
          utilizationRate: {
            $multiply: [
              { $divide: ['$totalSpent', '$totalAllocated'] },
              100
            ]
          },
          status: {
            $cond: {
              if: { $gte: [{ $divide: ['$totalSpent', '$totalAllocated'] }, 1] },
              then: 'exceeded',
              else: {
                $cond: {
                  if: { $gte: [{ $divide: ['$totalSpent', '$totalAllocated'] }, 0.9] },
                  then: 'warning',
                  else: 'ok'
                }
              }
            }
          }
        }
      },
      { $sort: { utilizationRate: -1 } }
    ]);

    const summary = {
      totalAllocated: budgetVariance.reduce((sum, b) => sum + b.allocated, 0),
      totalSpent: budgetVariance.reduce((sum, b) => sum + b.spent, 0),
      totalRemaining: budgetVariance.reduce((sum, b) => sum + b.remaining, 0),
      overallUtilization: 0,
      categoriesExceeded: budgetVariance.filter(b => b.status === 'exceeded').length,
      categoriesWarning: budgetVariance.filter(b => b.status === 'warning').length
    };

    summary.overallUtilization = summary.totalAllocated > 0
      ? (summary.totalSpent / summary.totalAllocated) * 100
      : 0;

    res.json({
      budgetVariance,
      summary
    });
  } catch (error) {
    console.error('Budget variance error:', error);
    res.status(500).json({ message: 'Error calculating budget variance', error: error.message });
  }
});

router.get('/customer-segmentation', protect, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const customerSegmentation = await SalesHistory.aggregate([
      { $match: { company: tenantId } },
      {
        $group: {
          _id: '$customer',
          totalRevenue: { $sum: '$revenue.gross' },
          totalVolume: { $sum: '$quantity' },
          totalCost: { $sum: '$costs.totalCost' },
          transactionCount: { $sum: 1 }
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
      {
        $project: {
          customerId: '$_id',
          customerName: '$customerInfo.name',
          customerType: '$customerInfo.customerType',
          tier: '$customerInfo.tier',
          revenue: '$totalRevenue',
          volume: '$totalVolume',
          grossProfit: { $subtract: ['$totalRevenue', '$totalCost'] },
          transactionCount: 1,
          avgTransactionValue: { $divide: ['$totalRevenue', '$transactionCount'] }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    const totalRevenue = customerSegmentation.reduce((sum, c) => sum + c.revenue, 0);

    const segmented = customerSegmentation.map((customer, index) => {
      const revenuePercentage = (customer.revenue / totalRevenue) * 100;
      let segment;

      if (index < customerSegmentation.length * 0.2) {
        segment = 'A'; // Top 20%
      } else if (index < customerSegmentation.length * 0.5) {
        segment = 'B'; // Next 30%
      } else {
        segment = 'C'; // Bottom 50%
      }

      return {
        ...customer,
        revenuePercentage,
        segment
      };
    });

    const summary = {
      totalCustomers: segmented.length,
      totalRevenue,
      segmentA: {
        count: segmented.filter(c => c.segment === 'A').length,
        revenue: segmented.filter(c => c.segment === 'A').reduce((sum, c) => sum + c.revenue, 0)
      },
      segmentB: {
        count: segmented.filter(c => c.segment === 'B').length,
        revenue: segmented.filter(c => c.segment === 'B').reduce((sum, c) => sum + c.revenue, 0)
      },
      segmentC: {
        count: segmented.filter(c => c.segment === 'C').length,
        revenue: segmented.filter(c => c.segment === 'C').reduce((sum, c) => sum + c.revenue, 0)
      }
    };

    res.json({
      customers: segmented,
      summary
    });
  } catch (error) {
    console.error('Customer segmentation error:', error);
    res.status(500).json({ message: 'Error calculating customer segmentation', error: error.message });
  }
});

module.exports = router;
