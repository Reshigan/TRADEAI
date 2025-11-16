const TradeSpend = require('../models/TradeSpend');
const Campaign = require('../models/Campaign');
const Rebate = require('../models/Rebate');
const RebateAccrual = require('../models/RebateAccrual');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

exports.getDashboardMetrics = asyncHandler(async (req, res) => {
  const { startDate, endDate, customerId, productId } = req.query;

  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const matchFilter = {};
  if (Object.keys(dateFilter).length > 0) {
    matchFilter.date = dateFilter;
  }
  if (customerId) matchFilter.customer = customerId;
  if (productId) matchFilter.product = productId;

  const [
    totalSpend,
    activeCampaigns,
    activeRebates,
    totalRebateAccruals,
    spendByCategory,
    topCustomers,
    topProducts,
    monthlyTrends
  ] = await Promise.all([
    TradeSpend.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),

    Campaign.countDocuments({ status: 'active' }),

    Rebate.countDocuments({ status: 'active' }),

    RebateAccrual.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),

    TradeSpend.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { amount: -1 } }
    ]),

    TradeSpend.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$customer',
          totalSpend: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpend: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true } }
    ]),

    TradeSpend.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$product',
          totalSpend: { $sum: '$amount' },
          quantity: { $sum: '$quantity' }
        }
      },
      { $sort: { totalSpend: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } }
    ]),

    TradeSpend.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      summary: {
        totalSpend: totalSpend[0]?.total || 0,
        activeCampaigns,
        activeRebates,
        totalRebateAccruals: totalRebateAccruals[0]?.total || 0,
        roi: totalSpend[0]?.total
          ? ((totalRebateAccruals[0]?.total || 0) / totalSpend[0].total) * 100
          : 0
      },
      spendByCategory,
      topCustomers,
      topProducts,
      monthlyTrends
    }
  });
});

exports.getSpendAnalysis = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'month' } = req.query;

  const matchStage = {};
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  const groupByConfig = {
    day: {
      year: { $year: '$date' },
      month: { $month: '$date' },
      day: { $dayOfMonth: '$date' }
    },
    week: {
      year: { $year: '$date' },
      week: { $week: '$date' }
    },
    month: {
      year: { $year: '$date' },
      month: { $month: '$date' }
    },
    quarter: {
      year: { $year: '$date' },
      quarter: { $ceil: { $divide: [{ $month: '$date' }, 3] } }
    },
    year: {
      year: { $year: '$date' }
    }
  };

  const analysis = await TradeSpend.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupByConfig[groupBy] || groupByConfig.month,
        totalAmount: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.json({
    success: true,
    data: analysis
  });
});

exports.getCampaignPerformance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const matchStage = { status: { $in: ['active', 'completed'] } };
  if (startDate || endDate) {
    matchStage.startDate = {};
    if (startDate) matchStage.startDate.$gte = new Date(startDate);
    if (endDate) matchStage.startDate.$lte = new Date(endDate);
  }

  const campaigns = await Campaign.find(matchStage)
    .populate('products', 'name sku')
    .populate('customers', 'name')
    .lean();

  const campaignMetrics = await Promise.all(
    campaigns.map(async (campaign) => {
      const spendData = await TradeSpend.aggregate([
        {
          $match: {
            campaign: campaign._id,
            date: {
              $gte: new Date(campaign.startDate),
              $lte: new Date(campaign.endDate)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalSpend: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        }
      ]);

      const spend = spendData[0] || { totalSpend: 0, transactionCount: 0 };
      const roi = campaign.budget ? (spend.totalSpend / campaign.budget) * 100 : 0;

      return {
        campaignId: campaign._id,
        name: campaign.name,
        status: campaign.status,
        budget: campaign.budget,
        actualSpend: spend.totalSpend,
        transactionCount: spend.transactionCount,
        roi,
        efficiency: roi / 100
      };
    })
  );

  res.json({
    success: true,
    data: campaignMetrics
  });
});

exports.getCustomerAnalytics = asyncHandler(async (req, res) => {
  const { customerId, startDate, endDate } = req.query;

  const matchStage = {};
  if (customerId) matchStage.customer = customerId;
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  const customerAnalytics = await TradeSpend.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$customer',
        totalSpend: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        avgTransactionValue: { $avg: '$amount' },
        firstPurchase: { $min: '$date' },
        lastPurchase: { $max: '$date' }
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
    { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'rebateaccruals',
        localField: '_id',
        foreignField: 'customer',
        as: 'rebates'
      }
    },
    {
      $addFields: {
        totalRebates: { $sum: '$rebates.amount' },
        netSpend: { $subtract: ['$totalSpend', { $sum: '$rebates.amount' }] }
      }
    },
    { $sort: { totalSpend: -1 } }
  ]);

  res.json({
    success: true,
    data: customerAnalytics
  });
});

exports.getProductPerformance = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 20 } = req.query;

  const matchStage = {};
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  const productPerformance = await TradeSpend.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$product',
        totalRevenue: { $sum: '$amount' },
        totalQuantity: { $sum: '$quantity' },
        avgPrice: { $avg: { $divide: ['$amount', '$quantity'] } },
        orderCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
    { $sort: { totalRevenue: -1 } },
    { $limit: parseInt(limit) }
  ]);

  res.json({
    success: true,
    data: productPerformance
  });
});

exports.getRebateEffectiveness = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const matchStage = {};
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  const rebateEffectiveness = await RebateAccrual.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$rebate',
        totalAccrued: { $sum: '$amount' },
        customerCount: { $addToSet: '$customer' },
        avgAccrual: { $avg: '$amount' }
      }
    },
    {
      $addFields: {
        customerCount: { $size: '$customerCount' }
      }
    },
    {
      $lookup: {
        from: 'rebates',
        localField: '_id',
        foreignField: '_id',
        as: 'rebateInfo'
      }
    },
    { $unwind: { path: '$rebateInfo', preserveNullAndEmptyArrays: true } },
    { $sort: { totalAccrued: -1 } }
  ]);

  const totalRebatesAccrued = rebateEffectiveness.reduce(
    (sum, r) => sum + r.totalAccrued,
    0
  );

  const totalSpendResult = await TradeSpend.aggregate([
    { $match: matchStage },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const totalSpend = totalSpendResult[0]?.total || 0;
  const rebatePercentage = totalSpend ? (totalRebatesAccrued / totalSpend) * 100 : 0;

  res.json({
    success: true,
    data: {
      rebateEffectiveness,
      summary: {
        totalRebatesAccrued,
        totalSpend,
        rebatePercentage,
        avgRebatePerCustomer:
          rebateEffectiveness.length > 0
            ? totalRebatesAccrued /
              rebateEffectiveness.reduce((sum, r) => sum + r.customerCount, 0)
            : 0
      }
    }
  });
});

exports.getForecastData = asyncHandler(async (req, res) => {
  const { months = 3 } = req.query;

  const historicalData = await TradeSpend.aggregate([
    {
      $match: {
        date: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        amount: { $sum: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const amounts = historicalData.map((d) => d.amount);
  const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;

  const trend =
    amounts.length > 1
      ? (amounts[amounts.length - 1] - amounts[0]) / amounts.length
      : 0;

  const forecast = [];
  for (let i = 1; i <= parseInt(months); i++) {
    const forecastDate = new Date();
    forecastDate.setMonth(forecastDate.getMonth() + i);

    forecast.push({
      period: {
        year: forecastDate.getFullYear(),
        month: forecastDate.getMonth() + 1
      },
      predictedAmount: avgAmount + trend * i,
      confidence: Math.max(0.5, 1 - i * 0.1)
    });
  }

  res.json({
    success: true,
    data: {
      historical: historicalData,
      forecast
    }
  });
});
