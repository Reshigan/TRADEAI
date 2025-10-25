/**
 * Baseline Controller
 * API endpoints for baseline calculations
 */

const baselineService = require('../services/baselineService');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * Calculate baseline using specified method
 */
exports.calculateBaseline = asyncHandler(async (req, res, next) => {
  const {
    method = 'auto',
    productId,
    customerId,
    promotionStartDate,
    promotionEndDate,
    options = {}
  } = req.body;

  if (!productId || !customerId || !promotionStartDate || !promotionEndDate) {
    return next(new AppError('Missing required fields', 400));
  }

  const calcOptions = {
    productId,
    customerId,
    promotionStartDate: new Date(promotionStartDate),
    promotionEndDate: new Date(promotionEndDate),
    tenantId: req.user.tenantId,
    ...options
  };

  let result;

  switch (method) {
    case 'control_store':
      result = await baselineService.controlStoreMethod(calcOptions);
      break;
    case 'pre_period':
      result = await baselineService.prePeriodMethod(calcOptions);
      break;
    case 'moving_average':
      result = await baselineService.movingAverageMethod(calcOptions);
      break;
    case 'exponential_smoothing':
      result = await baselineService.exponentialSmoothingMethod(calcOptions);
      break;
    case 'auto':
    default:
      result = await baselineService.calculateBaseline(calcOptions);
      break;
  }

  res.json({
    success: true,
    data: result
  });
});

/**
 * Calculate incremental volume
 */
exports.calculateIncremental = asyncHandler(async (req, res, next) => {
  const {
    productId,
    customerId,
    promotionStartDate,
    promotionEndDate,
    options = {}
  } = req.body;

  if (!productId || !customerId || !promotionStartDate || !promotionEndDate) {
    return next(new AppError('Missing required fields', 400));
  }

  const result = await baselineService.calculateIncrementalVolume({
    productId,
    customerId,
    promotionStartDate: new Date(promotionStartDate),
    promotionEndDate: new Date(promotionEndDate),
    tenantId: req.user.tenantId,
    ...options
  });

  res.json({
    success: true,
    data: result
  });
});

/**
 * Get available baseline methods
 */
exports.getMethods = asyncHandler(async (req, res, next) => {
  res.json({
    success: true,
    data: {
      methods: [
        {
          id: 'auto',
          name: 'Automatic (Recommended)',
          description: 'Automatically selects the best method based on available data'
        },
        {
          id: 'pre_period',
          name: 'Pre-Period Method',
          description: 'Uses historical sales before promotion with seasonality adjustment'
        },
        {
          id: 'control_store',
          name: 'Control Store Method',
          description: 'Uses stores without promotion to estimate baseline'
        },
        {
          id: 'moving_average',
          name: 'Moving Average',
          description: 'Uses moving average of historical sales'
        },
        {
          id: 'exponential_smoothing',
          name: 'Exponential Smoothing',
          description: 'Applies exponential smoothing to historical data'
        }
      ]
    }
  });
});

module.exports = exports;
