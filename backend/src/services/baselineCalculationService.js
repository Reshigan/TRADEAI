const mongoose = require('mongoose');
const SalesTransaction = require('../models/SalesTransaction');
const BaselineConfig = require('../models/BaselineConfig');
const DataLineage = require('../models/DataLineage');

class BaselineCalculationService {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  async calculateBaseline(promotion, config = null) {
    if (!config) {
      config = await BaselineConfig.getDefault(this.tenantId);
      if (!config) {
        config = this.getDefaultConfig();
      }
    }

    const { startDate, customers, products } = promotion;

    const prePeriodEnd = new Date(startDate);
    prePeriodEnd.setDate(prePeriodEnd.getDate() - 1);

    const prePeriodStart = new Date(prePeriodEnd);
    prePeriodStart.setDate(prePeriodStart.getDate() - (config.prePeriod.weeks * 7));

    const salesData = await this.fetchSalesData(
      prePeriodStart,
      prePeriodEnd,
      customers,
      products,
      config
    );

    if (salesData.length < config.minimumDataPoints) {
      return {
        success: false,
        error: `Insufficient data points: ${salesData.length} < ${config.minimumDataPoints} required`,
        dataPoints: salesData.length,
        required: config.minimumDataPoints
      };
    }

    let baseline;
    switch (config.methodology) {
      case 'pre_period_average':
        baseline = this.calculateAverage(salesData, config);
        break;
      case 'pre_period_median':
        baseline = this.calculateMedian(salesData, config);
        break;
      case 'moving_average':
        baseline = this.calculateMovingAverage(salesData, config);
        break;
      case 'weighted_average':
        baseline = this.calculateWeightedAverage(salesData, config);
        break;
      case 'linear_regression':
        baseline = this.calculateLinearRegression(salesData, config);
        break;
      case 'seasonal_adjusted':
        baseline = this.calculateSeasonalAdjusted(salesData, config);
        break;
      default:
        baseline = this.calculateAverage(salesData, config);
    }

    const confidence = this.calculateConfidence(salesData, baseline, config);

    const lineage = await this.recordLineage(promotion, baseline, salesData, config, confidence);

    return {
      success: true,
      baseline,
      confidence,
      methodology: config.methodology,
      dataPoints: salesData.length,
      prePeriod: { start: prePeriodStart, end: prePeriodEnd },
      lineageId: lineage._id
    };
  }

  async fetchSalesData(startDate, endDate, customers, products, config) {
    const match = {
      company: mongoose.Types.ObjectId(this.tenantId),
      date: { $gte: startDate, $lte: endDate },
      status: 'completed'
    };

    if (customers && customers.length > 0) {
      match.customer = { $in: customers.map((c) => mongoose.Types.ObjectId(c)) };
    }

    if (products && products.length > 0) {
      match.product = { $in: products.map((p) => mongoose.Types.ObjectId(p)) };
    }

    if (config.prePeriod.excludePromotions) {
      match.promotion = null;
    }

    const aggregationGrain = this.getAggregationGrain(config.aggregation.grain);

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: aggregationGrain,
          volume: { $sum: '$quantity' },
          revenue: { $sum: '$netAmount' },
          transactions: { $sum: 1 },
          avgPrice: { $avg: '$unitPrice' }
        }
      },
      { $sort: { '_id': 1 } }
    ];

    const results = await SalesTransaction.aggregate(pipeline);

    if (config.prePeriod.excludeOutliers) {
      return this.removeOutliers(results, config.prePeriod.outlierThreshold);
    }

    return results;
  }

  getAggregationGrain(grain) {
    switch (grain) {
      case 'daily':
        return {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
      case 'weekly':
        return {
          year: { $year: '$date' },
          week: { $week: '$date' }
        };
      case 'monthly':
        return {
          year: { $year: '$date' },
          month: { $month: '$date' }
        };
      default:
        return {
          year: { $year: '$date' },
          week: { $week: '$date' }
        };
    }
  }

  removeOutliers(data, threshold) {
    if (data.length < 4) return data;

    const volumes = data.map((d) => d.volume);
    const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const stdDev = Math.sqrt(
      volumes.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / volumes.length
    );

    return data.filter((d) => {
      const zScore = Math.abs((d.volume - mean) / stdDev);
      return zScore <= threshold;
    });
  }

  calculateAverage(data, config) {
    const volumes = data.map((d) => d.volume);
    const revenues = data.map((d) => d.revenue);

    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;

    const promotionWeeks = this.getPromotionWeeks(config);

    return {
      volumePerPeriod: avgVolume,
      revenuePerPeriod: avgRevenue,
      totalBaselineVolume: avgVolume * promotionWeeks,
      totalBaselineRevenue: avgRevenue * promotionWeeks,
      periodsUsed: data.length
    };
  }

  calculateMedian(data, config) {
    const sortedVolumes = [...data.map((d) => d.volume)].sort((a, b) => a - b);
    const sortedRevenues = [...data.map((d) => d.revenue)].sort((a, b) => a - b);

    const mid = Math.floor(sortedVolumes.length / 2);

    const medianVolume = sortedVolumes.length % 2 !== 0
      ? sortedVolumes[mid]
      : (sortedVolumes[mid - 1] + sortedVolumes[mid]) / 2;

    const medianRevenue = sortedRevenues.length % 2 !== 0
      ? sortedRevenues[mid]
      : (sortedRevenues[mid - 1] + sortedRevenues[mid]) / 2;

    const promotionWeeks = this.getPromotionWeeks(config);

    return {
      volumePerPeriod: medianVolume,
      revenuePerPeriod: medianRevenue,
      totalBaselineVolume: medianVolume * promotionWeeks,
      totalBaselineRevenue: medianRevenue * promotionWeeks,
      periodsUsed: data.length
    };
  }

  calculateMovingAverage(data, config) {
    const windowSize = Math.min(config.prePeriod.weeks, data.length);
    const recentData = data.slice(-windowSize);

    return this.calculateAverage(recentData, config);
  }

  calculateWeightedAverage(data, config) {
    const n = data.length;
    let weightedVolumeSum = 0;
    let weightedRevenueSum = 0;
    let weightSum = 0;

    data.forEach((d, i) => {
      const weight = i + 1;
      weightedVolumeSum += d.volume * weight;
      weightedRevenueSum += d.revenue * weight;
      weightSum += weight;
    });

    const weightedAvgVolume = weightedVolumeSum / weightSum;
    const weightedAvgRevenue = weightedRevenueSum / weightSum;

    const promotionWeeks = this.getPromotionWeeks(config);

    return {
      volumePerPeriod: weightedAvgVolume,
      revenuePerPeriod: weightedAvgRevenue,
      totalBaselineVolume: weightedAvgVolume * promotionWeeks,
      totalBaselineRevenue: weightedAvgRevenue * promotionWeeks,
      periodsUsed: n
    };
  }

  calculateLinearRegression(data, config) {
    const n = data.length;
    const volumes = data.map((d) => d.volume);
    const revenues = data.map((d) => d.revenue);

    const xMean = (n - 1) / 2;
    const yVolumeMean = volumes.reduce((a, b) => a + b, 0) / n;
    const yRevenueMean = revenues.reduce((a, b) => a + b, 0) / n;

    let volumeNumerator = 0, revenueNumerator = 0, denominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      volumeNumerator += xDiff * (volumes[i] - yVolumeMean);
      revenueNumerator += xDiff * (revenues[i] - yRevenueMean);
      denominator += xDiff * xDiff;
    }

    const volumeSlope = denominator !== 0 ? volumeNumerator / denominator : 0;
    const revenueSlope = denominator !== 0 ? revenueNumerator / denominator : 0;

    const volumeIntercept = yVolumeMean - volumeSlope * xMean;
    const revenueIntercept = yRevenueMean - revenueSlope * xMean;

    const projectedVolume = volumeSlope * n + volumeIntercept;
    const projectedRevenue = revenueSlope * n + revenueIntercept;

    const promotionWeeks = this.getPromotionWeeks(config);

    return {
      volumePerPeriod: Math.max(0, projectedVolume),
      revenuePerPeriod: Math.max(0, projectedRevenue),
      totalBaselineVolume: Math.max(0, projectedVolume) * promotionWeeks,
      totalBaselineRevenue: Math.max(0, projectedRevenue) * promotionWeeks,
      periodsUsed: n,
      trend: {
        volumeSlope,
        revenueSlope,
        direction: volumeSlope > 0 ? 'increasing' : volumeSlope < 0 ? 'decreasing' : 'flat'
      }
    };
  }

  calculateSeasonalAdjusted(data, config) {
    const baseline = this.calculateAverage(data, config);
    return baseline;
  }

  getPromotionWeeks() {
    return 4;
  }

  calculateConfidence(data, baseline, config) {
    const factors = [];
    let score = 1.0;

    const dataPointFactor = Math.min(data.length / config.minimumDataPoints, 1.5);
    score *= (0.5 + dataPointFactor * 0.3);
    factors.push({
      factor: 'data_points',
      impact: dataPointFactor >= 1 ? 'positive' : 'negative',
      weight: dataPointFactor
    });

    const volumes = data.map((d) => d.volume);
    const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const variance = volumes.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / volumes.length;
    const cv = mean !== 0 ? Math.sqrt(variance) / mean : 1;

    const variabilityFactor = Math.max(0, 1 - cv);
    score *= (0.7 + variabilityFactor * 0.3);
    factors.push({
      factor: 'data_variability',
      impact: cv < 0.3 ? 'positive' : cv > 0.5 ? 'negative' : 'neutral',
      weight: variabilityFactor
    });

    if (config.prePeriod.excludeOutliers) {
      score *= 1.05;
      factors.push({
        factor: 'outlier_removal',
        impact: 'positive',
        weight: 1.05
      });
    }

    score = Math.min(Math.max(score, 0), 1);

    return { score: Math.round(score * 100) / 100, factors };
  }

  async recordLineage(promotion, baseline, salesData, config, confidence) {
    const inputs = [{
      sourceType: 'sales_transaction',
      sourceCollection: 'salestransactions',
      field: 'volume_and_revenue',
      aggregation: config.methodology.includes('median') ? 'median' : 'avg',
      recordCount: salesData.length,
      dateRange: {
        start: salesData[0]?._id,
        end: salesData[salesData.length - 1]?._id
      }
    }];

    const formula = {
      expression: this.getFormulaExpression(config.methodology),
      variables: {
        prePeriodWeeks: config.prePeriod.weeks,
        excludeOutliers: config.prePeriod.excludeOutliers,
        outlierThreshold: config.prePeriod.outlierThreshold
      },
      description: config.methodologyDescription || `${config.methodology} baseline calculation`
    };

    const lineageRecords = [];

    const volumeLineage = new DataLineage({
      tenantId: this.tenantId,
      entityType: 'promotion',
      entityId: promotion._id,
      metricType: 'baseline_volume',
      calculatedValue: baseline.totalBaselineVolume,
      calculationVersion: '1.0',
      calculationMethod: config.methodology,
      baselineConfig: config._id,
      inputs,
      formula,
      confidence,
      validation: { isValid: true, warnings: [], errors: [] }
    });
    lineageRecords.push(await volumeLineage.save());

    const revenueLineage = new DataLineage({
      tenantId: this.tenantId,
      entityType: 'promotion',
      entityId: promotion._id,
      metricType: 'baseline_revenue',
      calculatedValue: baseline.totalBaselineRevenue,
      calculationVersion: '1.0',
      calculationMethod: config.methodology,
      baselineConfig: config._id,
      inputs,
      formula,
      confidence,
      validation: { isValid: true, warnings: [], errors: [] }
    });
    lineageRecords.push(await revenueLineage.save());

    return lineageRecords[0];
  }

  getFormulaExpression(methodology) {
    const formulas = {
      'pre_period_average': 'SUM(pre_period_values) / COUNT(pre_period_values)',
      'pre_period_median': 'MEDIAN(pre_period_values)',
      'moving_average': 'SUM(recent_n_values) / n',
      'weighted_average': 'SUM(value_i * weight_i) / SUM(weight_i)',
      'linear_regression': 'slope * projection_period + intercept',
      'seasonal_adjusted': 'base_average * seasonal_index'
    };
    return formulas[methodology] || 'custom_calculation';
  }

  async calculateUplift(promotion, actualSales) {
    const baselineLineage = await DataLineage.findOne({
      tenantId: this.tenantId,
      entityType: 'promotion',
      entityId: promotion._id,
      metricType: 'baseline_volume'
    });

    if (!baselineLineage) {
      return { success: false, error: 'Baseline not calculated' };
    }

    const baselineVolume = baselineLineage.calculatedValue;
    const actualVolume = actualSales.reduce((sum, s) => sum + s.quantity, 0);

    const incrementalVolume = actualVolume - baselineVolume;
    const upliftPercentage = baselineVolume !== 0
      ? (incrementalVolume / baselineVolume) * 100
      : 0;

    const upliftLineage = new DataLineage({
      tenantId: this.tenantId,
      entityType: 'promotion',
      entityId: promotion._id,
      metricType: 'incremental_volume',
      calculatedValue: incrementalVolume,
      calculationVersion: '1.0',
      calculationMethod: 'actual_minus_baseline',
      inputs: [
        {
          sourceType: 'promotion',
          sourceId: baselineLineage._id,
          field: 'baseline_volume',
          value: baselineVolume
        },
        {
          sourceType: 'sales_transaction',
          field: 'actual_volume',
          value: actualVolume,
          recordCount: actualSales.length
        }
      ],
      formula: {
        expression: 'actual_volume - baseline_volume',
        variables: { baselineVolume, actualVolume },
        description: 'Incremental volume = Actual sales - Baseline'
      }
    });
    await upliftLineage.save();

    return {
      success: true,
      baselineVolume,
      actualVolume,
      incrementalVolume,
      upliftPercentage: Math.round(upliftPercentage * 100) / 100,
      lineageId: upliftLineage._id
    };
  }

  async calculateROI(promotion, costs, revenue) {
    const totalCost = Object.values(costs).reduce((sum, c) => sum + (c || 0), 0);
    const incrementalRevenue = revenue.incremental || 0;

    const roi = totalCost !== 0
      ? ((incrementalRevenue - totalCost) / totalCost) * 100
      : 0;

    const roiLineage = new DataLineage({
      tenantId: this.tenantId,
      entityType: 'promotion',
      entityId: promotion._id,
      metricType: 'roi',
      calculatedValue: roi,
      calculationVersion: '1.0',
      calculationMethod: 'incremental_revenue_over_cost',
      inputs: [
        {
          sourceType: 'trade_spend',
          field: 'costs',
          value: costs
        },
        {
          sourceType: 'promotion',
          field: 'incremental_revenue',
          value: incrementalRevenue
        }
      ],
      formula: {
        expression: '((incremental_revenue - total_cost) / total_cost) * 100',
        variables: { incrementalRevenue, totalCost, ...costs },
        description: 'ROI = (Incremental Revenue - Total Cost) / Total Cost * 100'
      }
    });
    await roiLineage.save();

    return {
      success: true,
      roi: Math.round(roi * 100) / 100,
      totalCost,
      incrementalRevenue,
      netProfit: incrementalRevenue - totalCost,
      lineageId: roiLineage._id
    };
  }

  getDefaultConfig() {
    return {
      methodology: 'pre_period_average',
      prePeriod: {
        weeks: 4,
        excludePromotions: true,
        excludeOutliers: true,
        outlierThreshold: 2.0
      },
      postPeriod: {
        weeks: 2,
        includeInAnalysis: true
      },
      aggregation: {
        grain: 'weekly',
        level: 'customer_sku'
      },
      minimumDataPoints: 4,
      confidenceLevel: 0.95
    };
  }
}

module.exports = BaselineCalculationService;
