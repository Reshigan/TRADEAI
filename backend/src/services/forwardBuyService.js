/**
 * Forward Buy Detection Service
 * Detects post-promotion sales dips caused by consumers stockpiling during promotions
 * Also known as "pantry loading" or "pre-buying"
 */

const SalesHistory = require('../models/SalesHistory');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const baselineService = require('./baselineService');

class ForwardBuyService {
  /**
   * Detect forward buying effect for a completed promotion
   * Analyzes post-promotion period for sales dips
   */
  async detectForwardBuy(options) {
    const {
      _promotionId,
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate,
      tenantId,
      postPromoPeriodWeeks = 4 // Default: analyze 4 weeks after promotion
    } = options;

    // Calculate post-promotion period
    const postPromoStart = new Date(promotionEndDate);
    postPromoStart.setDate(postPromoStart.getDate() + 1);

    const postPromoEnd = new Date(postPromoStart);
    postPromoEnd.setDate(postPromoEnd.getDate() + (postPromoPeriodWeeks * 7));

    // Get baseline for post-promotion period (what sales SHOULD have been)
    const baselineResult = await baselineService.calculateBaseline({
      productId,
      customerId,
      promotionStartDate: postPromoStart,
      promotionEndDate: postPromoEnd,
      tenantId,
      method: 'pre_period', // Use pre-promotion baseline
      options: {
        lookbackWeeks: 8, // Look further back to avoid promotion period
        excludePeriodStart: promotionStartDate,
        excludePeriodEnd: promotionEndDate
      }
    });

    // Get actual sales in post-promotion period
    const actualSales = await SalesHistory.find({
      productId,
      customerId,
      date: {
        $gte: postPromoStart,
        $lte: postPromoEnd
      },
      tenantId
    }).sort({ date: 1 });

    // Calculate daily differences
    const baseline = baselineResult.recommended.baseline;
    const dailyAnalysis = [];
    let cumulativeForwardBuy = 0;

    for (let i = 0; i < baseline.length; i++) {
      const baselineDay = baseline[i];
      const actualDay = actualSales.find(
        (s) => s.date.toISOString().split('T')[0] ===
             new Date(baselineDay.date).toISOString().split('T')[0]
      );

      const actualQuantity = actualDay ? actualDay.quantity : 0;
      const diff = baselineDay.baselineQuantity - actualQuantity;
      const dipPercentage = baselineDay.baselineQuantity > 0 ?
        (diff / baselineDay.baselineQuantity * 100) : 0;

      cumulativeForwardBuy += diff;

      dailyAnalysis.push({
        date: baselineDay.date,
        baseline: baselineDay.baselineQuantity,
        actual: actualQuantity,
        difference: diff,
        dipPercentage,
        cumulativeDip: cumulativeForwardBuy,
        isSignificantDip: dipPercentage > 15 // >15% below baseline
      });
    }

    // Calculate summary statistics
    const totalBaseline = baseline.reduce((sum, b) => sum + b.baselineQuantity, 0);
    const totalActual = actualSales.reduce((sum, s) => sum + s.quantity, 0);
    const totalDip = totalBaseline - totalActual;
    const dipPercentage = totalBaseline > 0 ? (totalDip / totalBaseline * 100) : 0;

    // Determine forward buy severity
    let severity = 'none';
    let forwardBuyDetected = false;

    if (dipPercentage > 30) {
      severity = 'severe';
      forwardBuyDetected = true;
    } else if (dipPercentage > 20) {
      severity = 'high';
      forwardBuyDetected = true;
    } else if (dipPercentage > 10) {
      severity = 'moderate';
      forwardBuyDetected = true;
    } else if (dipPercentage > 5) {
      severity = 'low';
      forwardBuyDetected = true;
    }

    // Calculate recovery time (how long until sales normalize)
    const recoveryWeek = this.calculateRecoveryTime(dailyAnalysis);

    // Get product details
    const product = await Product.findById(productId);

    return {
      forwardBuyDetected,
      severity,
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku
      },
      promotionPeriod: {
        start: promotionStartDate,
        end: promotionEndDate
      },
      postPromotionPeriod: {
        start: postPromoStart,
        end: postPromoEnd,
        weeks: postPromoPeriodWeeks
      },
      analysis: {
        totalBaseline,
        totalActual,
        totalDip,
        dipPercentage,
        averageDailyDip: dailyAnalysis.length > 0 ?
          totalDip / dailyAnalysis.length : 0,
        daysWithSignificantDip: dailyAnalysis.filter((d) => d.isSignificantDip).length,
        recoveryWeek
      },
      dailyAnalysis,
      interpretation: this.generateInterpretation(
        forwardBuyDetected,
        severity,
        dipPercentage,
        recoveryWeek
      )
    };
  }

  /**
   * Calculate how many weeks it takes for sales to recover to baseline
   */
  calculateRecoveryTime(dailyAnalysis) {
    // Group by week
    const weeks = [];
    for (let i = 0; i < dailyAnalysis.length; i += 7) {
      const weekData = dailyAnalysis.slice(i, i + 7);
      const weekBaseline = weekData.reduce((sum, d) => sum + d.baseline, 0);
      const weekActual = weekData.reduce((sum, d) => sum + d.actual, 0);
      const weekDipPercentage = weekBaseline > 0 ?
        ((weekBaseline - weekActual) / weekBaseline * 100) : 0;

      weeks.push({
        weekNumber: Math.floor(i / 7) + 1,
        baseline: weekBaseline,
        actual: weekActual,
        dipPercentage: weekDipPercentage,
        recovered: weekDipPercentage < 5 // Consider recovered if within 5% of baseline
      });
    }

    // Find first week where sales recovered
    const recoveredWeek = weeks.find((w) => w.recovered);
    return recoveredWeek ? recoveredWeek.weekNumber : null;
  }

  /**
   * Generate human-readable interpretation
   */
  generateInterpretation(detected, severity, dipPercentage, recoveryWeek) {
    if (!detected) {
      return {
        summary: 'No significant forward buying detected',
        details: 'Post-promotion sales remained close to baseline levels.',
        recommendation: 'Promotion did not cause pantry loading. This is a positive outcome.'
      };
    }

    let summary = '';
    let details = '';
    let recommendation = '';

    switch (severity) {
      case 'severe':
        summary = 'SEVERE forward buying detected';
        details = `Post-promotion sales dropped ${dipPercentage.toFixed(1)}% below baseline, indicating significant pantry loading. Consumers stockpiled heavily during the promotion.`;
        recommendation = 'Consider reducing promotion depth or frequency for this product. The short-term sales spike is offset by the severe post-promotion dip.';
        break;
      case 'high':
        summary = 'HIGH forward buying detected';
        details = `Post-promotion sales dropped ${dipPercentage.toFixed(1)}% below baseline. Moderate pantry loading occurred.`;
        recommendation = 'Evaluate if promotion depth is too aggressive. Consider testing shallower discounts or shorter promotion periods.';
        break;
      case 'moderate':
        summary = 'MODERATE forward buying detected';
        details = `Post-promotion sales dropped ${dipPercentage.toFixed(1)}% below baseline. Some pantry loading occurred.`;
        recommendation = 'Monitor this pattern. If it continues, consider adjusting promotion strategy.';
        break;
      case 'low':
        summary = 'LOW forward buying detected';
        details = `Post-promotion sales dropped ${dipPercentage.toFixed(1)}% below baseline. Minimal pantry loading.`;
        recommendation = 'Forward buy impact is within acceptable range.';
        break;
    }

    if (recoveryWeek) {
      details += ` Sales recovered to normal levels in week ${recoveryWeek}.`;
    } else {
      details += ' Sales have not yet recovered to baseline levels.';
      recommendation += ' Extended recovery period suggests promotion may be cannibalizing future sales.';
    }

    return { summary, details, recommendation };
  }

  /**
   * Calculate net promotion impact
   * Incremental sales during promotion MINUS forward buy effect
   */
  async calculateNetPromotionImpact(options) {
    const {
      promotionId,
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate,
      tenantId
    } = options;

    // Get incremental volume during promotion
    const incrementalResult = await baselineService.calculateIncrementalVolume({
      productId,
      customerId,
      promotionStartDate: new Date(promotionStartDate),
      promotionEndDate: new Date(promotionEndDate),
      tenantId
    });

    // Get forward buy impact
    const forwardBuyResult = await this.detectForwardBuy({
      promotionId,
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate,
      tenantId
    });

    const grossIncremental = incrementalResult.summary.totalIncrementalQuantity;
    const forwardBuyVolume = forwardBuyResult.analysis.totalDip;
    const netIncremental = grossIncremental - forwardBuyVolume;

    const grossRevenue = incrementalResult.summary.totalIncrementalRevenue;

    // Get product to calculate revenue impact
    const product = await Product.findById(productId);
    const forwardBuyRevenue = forwardBuyVolume * (product.price || 0);
    const netRevenue = grossRevenue - forwardBuyRevenue;

    return {
      promotion: {
        id: promotionId,
        productId,
        period: { start: promotionStartDate, end: promotionEndDate }
      },
      volumeAnalysis: {
        grossIncremental,
        forwardBuyVolume,
        netIncremental,
        forwardBuyRate: grossIncremental > 0 ?
          (forwardBuyVolume / grossIncremental * 100) : 0,
        trueIncrementalRate: grossIncremental > 0 ?
          (netIncremental / grossIncremental * 100) : 0
      },
      revenueAnalysis: {
        grossRevenue,
        forwardBuyRevenue,
        netRevenue,
        netMarginImpact: netRevenue * 0.3 // Assume 30% margin
      },
      forwardBuyDetails: forwardBuyResult,
      interpretation: this.generateNetImpactInterpretation(
        netIncremental,
        grossIncremental,
        forwardBuyVolume
      )
    };
  }

  /**
   * Generate interpretation for net impact analysis
   */
  generateNetImpactInterpretation(netIncremental, grossIncremental, forwardBuy) {
    const forwardBuyRate = grossIncremental > 0 ?
      (forwardBuy / grossIncremental * 100) : 0;

    let summary = '';
    let recommendation = '';

    if (netIncremental <= 0) {
      summary = 'NEGATIVE NET IMPACT: Promotion generated no true incremental volume. All volume was shifted from future sales.';
      recommendation = 'URGENT: Discontinue this promotion. It is not generating incremental sales, only shifting timing.';
    } else if (forwardBuyRate > 75) {
      summary = `POOR PERFORMANCE: Only ${((netIncremental / grossIncremental) * 100).toFixed(1)}% of promotion lift was truly incremental.`;
      recommendation = 'Consider discontinuing or significantly reducing promotion depth/frequency.';
    } else if (forwardBuyRate > 50) {
      summary = `BELOW TARGET: ${((netIncremental / grossIncremental) * 100).toFixed(1)}% of promotion lift was truly incremental.`;
      recommendation = 'Evaluate promotion strategy. Significant forward buying is occurring.';
    } else if (forwardBuyRate > 25) {
      summary = `ACCEPTABLE: ${((netIncremental / grossIncremental) * 100).toFixed(1)}% of promotion lift was truly incremental.`;
      recommendation = 'Forward buy impact is within acceptable range, but monitor ongoing.';
    } else {
      summary = `EXCELLENT: ${((netIncremental / grossIncremental) * 100).toFixed(1)}% of promotion lift was truly incremental.`;
      recommendation = 'Promotion is performing well with minimal forward buying.';
    }

    return { summary, recommendation };
  }

  /**
   * Predict forward buy risk for planned promotion
   * Uses historical patterns
   */
  async predictForwardBuyRisk(options) {
    const {
      productId,
      customerId,
      plannedDiscountPercent,
      tenantId
    } = options;

    // Find historical promotions for this product
    const product = await Product.findById(productId);
    const historicalPromotions = await Promotion.find({
      'products.product': productId,
      status: 'completed',
      tenantId
    }).limit(5).sort({ endDate: -1 });

    if (historicalPromotions.length === 0) {
      return {
        prediction: 'insufficient_data',
        message: 'No historical promotions found for this product'
      };
    }

    // Analyze forward buy from historical promotions
    const historicalAnalyses = [];

    for (const promo of historicalPromotions) {
      try {
        const analysis = await this.detectForwardBuy({
          promotionId: promo._id,
          productId,
          customerId,
          promotionStartDate: promo.startDate,
          promotionEndDate: promo.endDate,
          tenantId
        });

        // Get discount percent from promotion
        const promoProduct = promo.products.find(
          (p) => p.product.toString() === productId
        );
        const discountPercent = promoProduct ? promoProduct.discountPercent : 0;

        historicalAnalyses.push({
          promotionId: promo._id,
          startDate: promo.startDate,
          discountPercent,
          forwardBuyDetected: analysis.forwardBuyDetected,
          severity: analysis.severity,
          dipPercentage: analysis.analysis.dipPercentage,
          recoveryWeek: analysis.analysis.recoveryWeek
        });
      } catch (error) {
        // Skip promotions with insufficient data
        continue;
      }
    }

    if (historicalAnalyses.length === 0) {
      return {
        prediction: 'insufficient_data',
        message: 'Unable to analyze historical promotions'
      };
    }

    // Predict risk based on planned discount vs historical patterns
    const similarPromotions = historicalAnalyses.filter(
      (h) => Math.abs(h.discountPercent - plannedDiscountPercent) < 10
    );

    let predictedRisk = 'medium';
    let predictedDipPercentage = 0;
    let confidence = 'low';

    if (similarPromotions.length > 0) {
      // Use similar promotions for prediction
      predictedDipPercentage = similarPromotions.reduce(
        (sum, p) => sum + p.dipPercentage, 0
      ) / similarPromotions.length;
      confidence = similarPromotions.length >= 3 ? 'high' : 'medium';
    } else {
      // Interpolate from all historical data
      predictedDipPercentage = historicalAnalyses.reduce(
        (sum, p) => sum + p.dipPercentage, 0
      ) / historicalAnalyses.length;
      confidence = 'low';
    }

    // Adjust prediction based on discount depth
    if (plannedDiscountPercent > 30) {
      predictedDipPercentage *= 1.5; // Higher discount = more forward buying
      predictedRisk = 'high';
    } else if (plannedDiscountPercent > 20) {
      predictedDipPercentage *= 1.2;
      predictedRisk = 'medium';
    } else {
      predictedRisk = 'low';
    }

    // Determine severity
    let predictedSeverity = 'none';
    if (predictedDipPercentage > 30) predictedSeverity = 'severe';
    else if (predictedDipPercentage > 20) predictedSeverity = 'high';
    else if (predictedDipPercentage > 10) predictedSeverity = 'moderate';
    else if (predictedDipPercentage > 5) predictedSeverity = 'low';

    return {
      prediction: 'success',
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku
      },
      plannedPromotion: {
        discountPercent: plannedDiscountPercent
      },
      predictedImpact: {
        risk: predictedRisk,
        severity: predictedSeverity,
        expectedDipPercentage: predictedDipPercentage.toFixed(1),
        confidence
      },
      historicalPromotions: historicalAnalyses,
      recommendation: this.generateRiskRecommendation(
        predictedRisk,
        predictedSeverity,
        plannedDiscountPercent
      )
    };
  }

  /**
   * Generate recommendation based on predicted risk
   */
  generateRiskRecommendation(risk, severity, discountPercent) {
    if (risk === 'high' || severity === 'severe') {
      return {
        action: 'CAUTION',
        message: `This discount level (${discountPercent}%) has historically caused significant forward buying. Consider reducing discount depth or shortening promotion period.`,
        alternatives: [
          `Reduce discount to ${Math.max(15, discountPercent - 10)}%`,
          'Shorten promotion from 2 weeks to 1 week',
          'Add purchase quantity limits'
        ]
      };
    } else if (risk === 'medium' || severity === 'moderate') {
      return {
        action: 'MONITOR',
        message: `This discount level (${discountPercent}%) may cause moderate forward buying. Proceed with monitoring.`,
        alternatives: [
          'Test with limited stores first',
          'Monitor post-promotion sales closely'
        ]
      };
    } else {
      return {
        action: 'PROCEED',
        message: `This discount level (${discountPercent}%) has low forward buy risk based on historical data.`,
        alternatives: []
      };
    }
  }

  /**
   * Analyze forward buy patterns across product category
   */
  async analyzeCategoryForwardBuy(options) {
    const {
      category,
      customerId,
      startDate,
      endDate,
      tenantId
    } = options;

    // Get all products in category
    const products = await Product.find({
      category,
      tenantId,
      isDeleted: false
    });

    // Get completed promotions for these products
    const promotions = await Promotion.find({
      'products.product': { $in: products.map((p) => p._id) },
      status: 'completed',
      startDate: { $gte: startDate },
      endDate: { $lte: endDate },
      tenantId
    });

    const categoryAnalysis = [];

    for (const promotion of promotions) {
      for (const promoProduct of promotion.products) {
        try {
          const analysis = await this.detectForwardBuy({
            promotionId: promotion._id,
            productId: promoProduct.product,
            customerId,
            promotionStartDate: promotion.startDate,
            promotionEndDate: promotion.endDate,
            tenantId
          });

          if (analysis.forwardBuyDetected) {
            categoryAnalysis.push({
              product: analysis.product,
              promotionDate: promotion.startDate,
              severity: analysis.severity,
              dipPercentage: analysis.analysis.dipPercentage,
              recoveryWeek: analysis.analysis.recoveryWeek
            });
          }
        } catch (error) {
          // Skip products with insufficient data
          continue;
        }
      }
    }

    return {
      category,
      period: { start: startDate, end: endDate },
      analyzedPromotions: promotions.length,
      productsWithForwardBuy: categoryAnalysis.length,
      categoryAnalysis,
      summary: {
        averageDipPercentage: categoryAnalysis.length > 0 ?
          categoryAnalysis.reduce((sum, a) => sum + a.dipPercentage, 0) /
          categoryAnalysis.length : 0,
        severeCount: categoryAnalysis.filter((a) => a.severity === 'severe').length,
        highCount: categoryAnalysis.filter((a) => a.severity === 'high').length,
        moderateCount: categoryAnalysis.filter((a) => a.severity === 'moderate').length
      }
    };
  }
}

module.exports = new ForwardBuyService();
