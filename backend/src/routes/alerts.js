const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Budget = require('../models/Budget');
const Promotion = require('../models/Promotion');
const TradeSpend = require('../models/TradeSpend');
const SalesHistory = require('../models/SalesHistory');

router.get('/', protect, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userRole = req.user.role;
    const alerts = [];

    if (userRole === 'manager' || userRole === 'admin') {
      const budgetOverruns = await Budget.find({
        tenantId,
        status: { $in: ['exceeded', 'warning'] }
      }).select('name category allocated spent status');

      budgetOverruns.forEach((budget) => {
        const utilizationRate = (budget.spent / budget.allocated) * 100;
        alerts.push({
          type: 'budget_overrun',
          severity: budget.status === 'exceeded' ? 'critical' : 'warning',
          title: `Budget ${budget.status === 'exceeded' ? 'Exceeded' : 'Warning'}`,
          message: `${budget.name} is at ${utilizationRate.toFixed(1)}% utilization`,
          data: {
            budgetId: budget._id,
            budgetName: budget.name,
            category: budget.category,
            allocated: budget.allocated,
            spent: budget.spent,
            utilizationRate
          },
          createdAt: new Date()
        });
      });
    }

    if (userRole === 'manager' || userRole === 'admin') {
      const pendingTradeSpends = await TradeSpend.countDocuments({
        tenantId,
        status: 'submitted'
      });

      const pendingPromotions = await Promotion.countDocuments({
        tenantId,
        status: 'pending_approval'
      });

      const totalPending = pendingTradeSpends + pendingPromotions;

      if (totalPending > 0) {
        alerts.push({
          type: 'pending_approvals',
          severity: totalPending > 10 ? 'warning' : 'info',
          title: 'Pending Approvals',
          message: `You have ${totalPending} items pending approval`,
          data: {
            tradeSpends: pendingTradeSpends,
            promotions: pendingPromotions,
            total: totalPending
          },
          createdAt: new Date()
        });
      }
    }

    if (userRole === 'manager' || userRole === 'admin') {
      const activePromotions = await Promotion.find({
        tenantId,
        status: 'active',
        'period.endDate': { $gte: new Date() }
      }).limit(20);

      for (const promo of activePromotions) {
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
              totalVolume: { $sum: '$quantity' }
            }
          }
        ]);

        const expectedLift = promo.financial?.planned?.volumeLift || 1.2;
        const actualRevenue = promoSales[0]?.totalRevenue || 0;

        const daysSinceStart = Math.floor((new Date() - promo.period.startDate) / (1000 * 60 * 60 * 24));
        if (daysSinceStart >= 7 && actualRevenue < 10000) {
          alerts.push({
            type: 'underperforming_promotion',
            severity: 'warning',
            title: 'Underperforming Promotion',
            message: `${promo.name} has low sales performance`,
            data: {
              promotionId: promo._id,
              promotionName: promo.name,
              expectedLift,
              actualRevenue,
              daysSinceStart
            },
            createdAt: new Date()
          });
        }
      }
    }

    if (userRole === 'admin') {
      const totalSales = await SalesHistory.countDocuments({ company: tenantId });
      const salesWithPromotions = await SalesHistory.countDocuments({
        company: tenantId,
        'promotions.0': { $exists: true }
      });

      const promotionalCoverage = totalSales > 0 ? (salesWithPromotions / totalSales) * 100 : 0;

      if (promotionalCoverage < 10) {
        alerts.push({
          type: 'data_quality',
          severity: 'warning',
          title: 'Low Promotional Coverage',
          message: `Only ${promotionalCoverage.toFixed(1)}% of sales have promotions`,
          data: {
            totalSales,
            salesWithPromotions,
            promotionalCoverage
          },
          createdAt: new Date()
        });
      }
    }

    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => {
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.createdAt - a.createdAt;
    });

    res.json({
      alerts,
      count: alerts.length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      info: alerts.filter((a) => a.severity === 'info').length
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Error fetching alerts', error: error.message });
  }
});

router.post('/:id/read', protect, (req, res) => {
  try {
    res.json({ message: 'Alert marked as read' });
  } catch (error) {
    console.error('Mark alert as read error:', error);
    res.status(500).json({ message: 'Error marking alert as read', error: error.message });
  }
});

module.exports = router;
