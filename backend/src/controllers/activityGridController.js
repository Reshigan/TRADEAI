const ActivityGrid = require('../models/ActivityGrid');
const Promotion = require('../models/Promotion');
const TradeSpend = require('../models/TradeSpend');
const _Campaign = require('../models/Campaign');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// ✅ PRODUCTION: All mock data removed - using real MongoDB only

// Get all activity grids (list view)
exports.getActivityGrids = asyncHandler(async (req, res, _next) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    search,
    status,
    activityType,
    customer,
    product,
    vendor,
    startDate,
    endDate,
    ...filters
  } = req.query;

  // Build query with tenant isolation
  const query = {
    tenantId: req.user.tenantId,
    company: req.user.company
  };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { activityType: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.status = status;
  }

  if (activityType) {
    query.activityType = activityType;
  }

  if (customer) {
    query.customer = customer;
  }

  if (product) {
    query.product = product;
  }

  if (vendor) {
    query.vendor = vendor;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  // Apply additional filters
  Object.assign(query, filters);

  const activities = await ActivityGrid.find(query)
    .populate('customer', 'name sapCustomerId')
    .populate('product', 'name sku')
    .populate('vendor', 'name')
    .populate('createdBy', 'firstName lastName')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await ActivityGrid.countDocuments(query);

  res.json({
    success: true,
    data: activities,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});

// Get activity grid (calendar/heatmap view)
exports.getActivityGrid = asyncHandler(async (req, res, _next) => {
  const {
    startDate,
    endDate,
    view = 'month',
    customers,
    products,
    vendors,
    activityTypes,
    page = 1,
    limit = 100
  } = req.query;

  // ✅ PRODUCTION: Always use real MongoDB - no mock data fallback
  // Build query with tenant isolation
  const query = {
    tenantId: req.user.tenantId,
    company: req.user.company
  };

  // Filter by date range
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (customers) {
    query.customer = { $in: Array.isArray(customers) ? customers : [customers] };
  }

  if (products) {
    query.products = { $in: Array.isArray(products) ? products : [products] };
  }

  if (vendors) {
    query.vendor = { $in: Array.isArray(vendors) ? vendors : [vendors] };
  }

  if (activityTypes) {
    query.activityType = { $in: Array.isArray(activityTypes) ? activityTypes : [activityTypes] };
  }

  // Apply user-based filtering
  if (req.user.role === 'kam' || req.user.role === 'sales_rep') {
    query.customer = { $in: req.user.assignedCustomers };
  }

  const activities = await ActivityGrid.find(query)
    .populate('customer', 'name code')
    .populate('products', 'name sku')
    .populate('vendor', 'name code')
    .populate('linkedPromotion', 'promotionId name')
    .populate('linkedTradeSpend', 'spendId category')
    .populate('linkedCampaign', 'campaignId name')
    .sort('date')
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await ActivityGrid.countDocuments(query);

  // Format for grid view
  const gridData = formatGridData(activities, view);

  res.json({
    success: true,
    data: {
      activities: gridData,
      view,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// Create activity
exports.createActivity = asyncHandler(async (req, res, _next) => {
  const activityData = {
    ...req.body,
    createdBy: req.user._id
  };

  // Check for conflicts
  const conflicts = await ActivityGrid.checkConflicts(
    activityData.customer,
    activityData.products,
    activityData.date,
    activityData.date
  );

  if (conflicts.length > 0) {
    activityData.conflicts = conflicts.map((c) => ({
      activity: c._id,
      type: 'overlap',
      severity: c.priority === 'high' ? 'high' : 'medium'
    }));
  }

  const activity = await ActivityGrid.create(activityData);

  // Update heat map
  await activity.updateHeatMap();

  logger.logAudit('activity_created', req.user._id, {
    activityId: activity._id,
    type: activity.activityType
  });

  res.status(201).json({
    success: true,
    data: activity
  });
});

// Update activity
exports.updateActivity = asyncHandler(async (req, res, _next) => {
  const activity = await ActivityGrid.findById(req.params.id);

  if (!activity) {
    throw new AppError('Activity not found', 404);
  }

  if (activity.status === 'completed') {
    throw new AppError('Cannot update completed activities', 400);
  }

  Object.assign(activity, req.body);
  activity.lastModifiedBy = req.user._id;

  // Re-check conflicts if date changed
  if (req.body.date) {
    const conflicts = await ActivityGrid.checkConflicts(
      activity.customer,
      activity.products,
      activity.date,
      activity.date,
      activity._id
    );

    activity.conflicts = conflicts.map((c) => ({
      activity: c._id,
      type: 'overlap',
      severity: c.priority === 'high' ? 'high' : 'medium'
    }));
  }

  await activity.save();
  await activity.updateHeatMap();

  res.json({
    success: true,
    data: activity
  });
});

// Delete activity
exports.deleteActivity = asyncHandler(async (req, res, _next) => {
  const activity = await ActivityGrid.findById(req.params.id);

  if (!activity) {
    throw new AppError('Activity not found', 404);
  }

  if (activity.status === 'completed') {
    throw new AppError('Cannot delete completed activities', 400);
  }

  await activity.remove();

  res.json({
    success: true,
    message: 'Activity deleted successfully'
  });
});

// Get heat map
exports.getHeatMap = asyncHandler(async (req, res, _next) => {
  const { year, month, groupBy = 'customer' } = req.query;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const pipeline = [
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          groupBy: `$${groupBy}`
        },
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
        activities: { $push: '$activityType' }
      }
    },
    {
      $group: {
        _id: '$_id.groupBy',
        days: {
          $push: {
            date: '$_id.date',
            count: '$count',
            value: '$totalValue',
            activities: '$activities'
          }
        }
      }
    }
  ];

  if (groupBy === 'customer') {
    pipeline.push({
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'entity'
      }
    });
  } else if (groupBy === 'product') {
    pipeline.push({
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'entity'
      }
    });
  }

  pipeline.push({
    $unwind: '$entity'
  });

  const heatMapData = await ActivityGrid.aggregate(pipeline);

  // Calculate intensity scores
  const processedData = heatMapData.map((item) => {
    const maxCount = Math.max(...item.days.map((d) => d.count));

    return {
      entity: {
        id: item.entity._id,
        name: item.entity.name,
        code: item.entity.code || item.entity.sku
      },
      days: item.days.map((day) => ({
        ...day,
        intensity: (day.count / maxCount) * 100
      }))
    };
  });

  res.json({
    success: true,
    data: {
      period: { year, month },
      groupBy,
      heatMap: processedData
    }
  });
});

// Get conflicts
exports.getConflicts = asyncHandler(async (req, res, _next) => {
  const { startDate, endDate, severity } = req.query;

  // ✅ PRODUCTION: Always use real MongoDB queries
  const query = {
    tenantId: req.user.tenantId,
    company: req.user.company,
    'conflicts.0': { $exists: true }
  };

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (severity) {
    query['conflicts.severity'] = severity;
  }

  const activities = await ActivityGrid.find(query)
    .populate('customer', 'name')
    .populate('products', 'name')
    .populate('conflicts.activity');

  const conflicts = activities.map((activity) => ({
    activity: {
      id: activity._id,
      type: activity.activityType,
      date: activity.date,
      customer: activity.customer.name,
      products: activity.products.map((p) => p.name)
    },
    conflicts: activity.conflicts.map((c) => ({
      conflictingActivity: c.activity,
      type: c.type,
      severity: c.severity
    }))
  }));

  res.json({
    success: true,
    data: conflicts
  });
});

// Sync activities from other modules
exports.syncActivities = asyncHandler(async (req, res, _next) => {
  const { source, startDate, endDate } = req.body;

  const activities = [];

  if (source === 'promotions' || source === 'all') {
    const promotions = await Promotion.find({
      'period.startDate': { $gte: new Date(startDate), $lte: new Date(endDate) },
      status: { $in: ['approved', 'active', 'completed'] }
    });

    for (const promotion of promotions) {
      const existingActivity = await ActivityGrid.findOne({
        linkedPromotion: promotion._id
      });

      if (!existingActivity) {
        const activity = await ActivityGrid.create({
          date: promotion.period.startDate,
          activityType: 'promotion',
          customer: promotion.scope.customers[0].customer,
          products: promotion.products.map((p) => p.product),
          vendor: promotion.vendor,
          title: promotion.name,
          description: `Promotion: ${promotion.promotionType}`,
          value: promotion.financial.costs.totalCost,
          status: promotion.status === 'completed' ? 'completed' : 'scheduled',
          priority: 'high',
          linkedPromotion: promotion._id
        });

        activities.push(activity);
      }
    }
  }

  if (source === 'tradespends' || source === 'all') {
    const tradeSpends = await TradeSpend.find({
      'period.startDate': { $gte: new Date(startDate), $lte: new Date(endDate) },
      status: { $in: ['approved', 'active', 'completed'] }
    });

    for (const tradeSpend of tradeSpends) {
      const existingActivity = await ActivityGrid.findOne({
        linkedTradeSpend: tradeSpend._id
      });

      if (!existingActivity) {
        const activity = await ActivityGrid.create({
          date: tradeSpend.period.startDate,
          activityType: 'trade_spend',
          customer: tradeSpend.customer,
          products: tradeSpend.products,
          vendor: tradeSpend.vendor,
          title: `${tradeSpend.spendType} - ${tradeSpend.category}`,
          description: tradeSpend.description,
          value: tradeSpend.amount.approved,
          status: tradeSpend.status === 'completed' ? 'completed' : 'scheduled',
          priority: 'medium',
          linkedTradeSpend: tradeSpend._id
        });

        activities.push(activity);
      }
    }
  }

  logger.logAudit('activities_synced', req.user._id, {
    source,
    count: activities.length
  });

  res.json({
    success: true,
    data: {
      synced: activities.length,
      activities
    }
  });
});

// Helper functions
function formatGridData(activities, view) {
  if (view === 'list') {
    return activities;
  }

  const gridData = {};

  activities.forEach((activity) => {
    const dateKey = activity.date.toISOString().split('T')[0];

    if (!gridData[dateKey]) {
      gridData[dateKey] = [];
    }

    gridData[dateKey].push({
      id: activity._id,
      type: activity.activityType,
      title: activity.title,
      customer: activity.customer?.name,
      value: activity.value,
      status: activity.status,
      priority: activity.priority,
      conflicts: activity.conflicts.length
    });
  });

  return gridData;
}
