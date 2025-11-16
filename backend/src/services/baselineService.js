/**
 * Baseline Calculation Service
 * Traditional baseline methods for promotion analysis
 */

const SalesHistory = require('../models/SalesHistory');
const Transaction = require('../models/Transaction');
const Promotion = require('../models/Promotion');

class BaselineService {
  /**
   * Calculate baseline using control store method
   * Uses stores without promotion to estimate baseline
   */
  async controlStoreMethod(options) {
    const {
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate,
      controlStores = [],
      tenantId
    } = options;

    // Get sales from control stores during promotion period
    const controlSales = await SalesHistory.aggregate([
      {
        $match: {
          productId,
          customerId,
          date: {
            $gte: promotionStartDate,
            $lte: promotionEndDate
          },
          store: { $in: controlStores },
          tenantId
        }
      },
      {
        $group: {
          _id: '$date',
          avgQuantity: { $avg: '$quantity' },
          avgRevenue: { $avg: '$revenue' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return {
      method: 'control_store',
      baseline: controlSales.map((item) => ({
        date: item._id,
        baselineQuantity: item.avgQuantity,
        baselineRevenue: item.avgRevenue
      })),
      controlStores
    };
  }

  /**
   * Calculate baseline using pre-period method
   * Uses historical sales before promotion
   */
  async prePeriodMethod(options) {
    const {
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate,
      lookbackWeeks = 4,
      tenantId
    } = options;

    // Calculate lookback period
    const lookbackStart = new Date(promotionStartDate);
    lookbackStart.setDate(lookbackStart.getDate() - (lookbackWeeks * 7));

    // Get historical sales
    const historicalSales = await SalesHistory.find({
      productId,
      customerId,
      date: {
        $gte: lookbackStart,
        $lt: promotionStartDate
      },
      tenantId
    }).sort({ date: 1 });

    if (historicalSales.length === 0) {
      return {
        method: 'pre_period',
        baseline: [],
        error: 'Insufficient historical data'
      };
    }

    // Calculate average daily sales
    const totalQuantity = historicalSales.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = historicalSales.reduce((sum, item) => sum + item.revenue, 0);
    const avgDailyQuantity = totalQuantity / historicalSales.length;
    const avgDailyRevenue = totalRevenue / historicalSales.length;

    // Apply seasonality adjustment
    const seasonalAdjustment = await this.calculateSeasonalityIndex(
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate,
      tenantId
    );

    // Generate baseline for promotion period
    const baseline = [];
    const currentDate = new Date(promotionStartDate);

    while (currentDate <= promotionEndDate) {
      const dayOfWeek = currentDate.getDay();
      const seasonalFactor = seasonalAdjustment[dayOfWeek] || 1.0;

      baseline.push({
        date: new Date(currentDate),
        baselineQuantity: avgDailyQuantity * seasonalFactor,
        baselineRevenue: avgDailyRevenue * seasonalFactor,
        seasonalFactor
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      method: 'pre_period',
      baseline,
      historicalAverage: {
        quantity: avgDailyQuantity,
        revenue: avgDailyRevenue
      },
      lookbackPeriod: {
        start: lookbackStart,
        end: new Date(promotionStartDate)
      }
    };
  }

  /**
   * Calculate seasonality index by day of week
   */
  async calculateSeasonalityIndex(productId, customerId, startDate, endDate, tenantId) {
    // Get 3 months of historical data
    const historicalStart = new Date(startDate);
    historicalStart.setMonth(historicalStart.getMonth() - 3);

    const sales = await SalesHistory.find({
      productId,
      customerId,
      date: {
        $gte: historicalStart,
        $lt: startDate
      },
      tenantId
    });

    // Group by day of week
    const dayOfWeekSales = {};
    for (let i = 0; i < 7; i++) {
      dayOfWeekSales[i] = [];
    }

    sales.forEach((sale) => {
      const dayOfWeek = sale.date.getDay();
      dayOfWeekSales[dayOfWeek].push(sale.quantity);
    });

    // Calculate average for each day
    const dayAverages = {};
    let overallAverage = 0;
    let totalDays = 0;

    for (let i = 0; i < 7; i++) {
      if (dayOfWeekSales[i].length > 0) {
        const avg = dayOfWeekSales[i].reduce((a, b) => a + b, 0) / dayOfWeekSales[i].length;
        dayAverages[i] = avg;
        overallAverage += avg * dayOfWeekSales[i].length;
        totalDays += dayOfWeekSales[i].length;
      } else {
        dayAverages[i] = 0;
      }
    }

    overallAverage = overallAverage / totalDays;

    // Calculate seasonality index (ratio to average)
    const seasonalityIndex = {};
    for (let i = 0; i < 7; i++) {
      seasonalityIndex[i] = dayAverages[i] > 0 ? dayAverages[i] / overallAverage : 1.0;
    }

    return seasonalityIndex;
  }

  /**
   * Calculate baseline using moving average
   */
  async movingAverageMethod(options) {
    const {
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate,
      windowWeeks = 4,
      tenantId
    } = options;

    // Get historical data
    const historicalStart = new Date(promotionStartDate);
    historicalStart.setDate(historicalStart.getDate() - (windowWeeks * 7 * 2)); // Get extra data for MA

    const sales = await SalesHistory.find({
      productId,
      customerId,
      date: {
        $gte: historicalStart,
        $lt: promotionStartDate
      },
      tenantId
    }).sort({ date: 1 });

    if (sales.length < windowWeeks * 7) {
      return {
        method: 'moving_average',
        baseline: [],
        error: 'Insufficient historical data'
      };
    }

    // Calculate moving average
    const windowSize = windowWeeks * 7;
    const movingAverages = [];

    for (let i = windowSize - 1; i < sales.length; i++) {
      const window = sales.slice(i - windowSize + 1, i + 1);
      const avgQuantity = window.reduce((sum, item) => sum + item.quantity, 0) / windowSize;
      const avgRevenue = window.reduce((sum, item) => sum + item.revenue, 0) / windowSize;

      movingAverages.push({
        date: sales[i].date,
        baselineQuantity: avgQuantity,
        baselineRevenue: avgRevenue
      });
    }

    // Use last MA value as baseline for promotion period
    const lastMA = movingAverages[movingAverages.length - 1];

    const baseline = [];
    const currentDate = new Date(promotionStartDate);

    while (currentDate <= promotionEndDate) {
      baseline.push({
        date: new Date(currentDate),
        baselineQuantity: lastMA.baselineQuantity,
        baselineRevenue: lastMA.baselineRevenue
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      method: 'moving_average',
      baseline,
      windowWeeks,
      lastMovingAverage: lastMA
    };
  }

  /**
   * Calculate baseline using exponential smoothing
   */
  async exponentialSmoothingMethod(options) {
    const {
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate,
      alpha = 0.3, // Smoothing parameter
      tenantId
    } = options;

    // Get historical data (3 months)
    const historicalStart = new Date(promotionStartDate);
    historicalStart.setMonth(historicalStart.getMonth() - 3);

    const sales = await SalesHistory.find({
      productId,
      customerId,
      date: {
        $gte: historicalStart,
        $lt: promotionStartDate
      },
      tenantId
    }).sort({ date: 1 });

    if (sales.length < 14) {
      return {
        method: 'exponential_smoothing',
        baseline: [],
        error: 'Insufficient historical data'
      };
    }

    // Apply exponential smoothing
    let smoothedQuantity = sales[0].quantity;
    let smoothedRevenue = sales[0].revenue;

    for (let i = 1; i < sales.length; i++) {
      smoothedQuantity = alpha * sales[i].quantity + (1 - alpha) * smoothedQuantity;
      smoothedRevenue = alpha * sales[i].revenue + (1 - alpha) * smoothedRevenue;
    }

    // Use smoothed value as baseline
    const baseline = [];
    const currentDate = new Date(promotionStartDate);

    while (currentDate <= promotionEndDate) {
      baseline.push({
        date: new Date(currentDate),
        baselineQuantity: smoothedQuantity,
        baselineRevenue: smoothedRevenue
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      method: 'exponential_smoothing',
      baseline,
      alpha,
      smoothedValues: {
        quantity: smoothedQuantity,
        revenue: smoothedRevenue
      }
    };
  }

  /**
   * Calculate baseline automatically (chooses best method)
   */
  async calculateBaseline(options) {
    const methods = [];

    // Try pre-period method
    try {
      const prePeriod = await this.prePeriodMethod(options);
      if (prePeriod.baseline.length > 0) {
        methods.push(prePeriod);
      }
    } catch (error) {
      console.error('Pre-period method failed:', error);
    }

    // Try moving average
    try {
      const movingAvg = await this.movingAverageMethod(options);
      if (movingAvg.baseline.length > 0) {
        methods.push(movingAvg);
      }
    } catch (error) {
      console.error('Moving average method failed:', error);
    }

    // Try exponential smoothing
    try {
      const expSmooth = await this.exponentialSmoothingMethod(options);
      if (expSmooth.baseline.length > 0) {
        methods.push(expSmooth);
      }
    } catch (error) {
      console.error('Exponential smoothing method failed:', error);
    }

    if (methods.length === 0) {
      throw new Error('Unable to calculate baseline with available data');
    }

    // Return all methods for comparison
    return {
      recommended: methods[0], // Pre-period is usually best
      alternativeMethods: methods.slice(1),
      allMethods: methods
    };
  }

  /**
   * Calculate incremental volume (actual - baseline)
   */
  async calculateIncrementalVolume(options) {
    const {
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate,
      tenantId
    } = options;

    // Get baseline
    const baselineResult = await this.calculateBaseline(options);
    const baseline = baselineResult.recommended.baseline;

    // Get actual sales during promotion
    const actualSales = await SalesHistory.find({
      productId,
      customerId,
      date: {
        $gte: promotionStartDate,
        $lte: promotionEndDate
      },
      tenantId
    }).sort({ date: 1 });

    // Calculate incremental volume
    const incrementalAnalysis = baseline.map((b) => {
      const actual = actualSales.find((a) =>
        a.date.toISOString().split('T')[0] === b.date.toISOString().split('T')[0]
      );

      const actualQuantity = actual ? actual.quantity : 0;
      const actualRevenue = actual ? actual.revenue : 0;

      return {
        date: b.date,
        baselineQuantity: b.baselineQuantity,
        actualQuantity,
        incrementalQuantity: actualQuantity - b.baselineQuantity,
        baselineRevenue: b.baselineRevenue,
        actualRevenue,
        incrementalRevenue: actualRevenue - b.baselineRevenue,
        liftPercentage: b.baselineQuantity > 0 ?
          ((actualQuantity - b.baselineQuantity) / b.baselineQuantity * 100) : 0
      };
    });

    // Calculate totals
    const totalIncrementalQuantity = incrementalAnalysis.reduce((sum, item) =>
      sum + item.incrementalQuantity, 0);
    const totalIncrementalRevenue = incrementalAnalysis.reduce((sum, item) =>
      sum + item.incrementalRevenue, 0);
    const totalBaselineQuantity = baseline.reduce((sum, item) =>
      sum + item.baselineQuantity, 0);
    const totalActualQuantity = incrementalAnalysis.reduce((sum, item) =>
      sum + item.actualQuantity, 0);

    return {
      incrementalAnalysis,
      summary: {
        totalIncrementalQuantity,
        totalIncrementalRevenue,
        totalBaselineQuantity,
        totalActualQuantity,
        overallLift: totalBaselineQuantity > 0 ?
          (totalIncrementalQuantity / totalBaselineQuantity * 100) : 0
      },
      baselineMethod: baselineResult.recommended.method
    };
  }
}

module.exports = new BaselineService();
