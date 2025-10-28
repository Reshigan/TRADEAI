/**
 * Advanced Promotion Management Service
 * 
 * Features:
 * - Promotion ROI calculation
 * - Lift analysis (incremental sales)
 * - Promotion effectiveness scoring
 * - Template management
 * - Approval workflows
 */

const Promotion = require('../models/Promotion');
const SalesTransaction = require('../models/SalesTransaction');
const Customer = require('../models/Customer');
const logger = require('../../utils/logger');
const { safeNumber, calculatePercentage } = require('../../utils/safeNumbers');

class AdvancedPromotionService {
  
  /**
   * Calculate comprehensive ROI for a promotion
   */
  async calculatePromotionROI(promotionId) {
    try {
      const promotion = await Promotion.findById(promotionId)
        .populate('customerId')
        .populate('productId');
      
      if (!promotion) {
        throw new Error('Promotion not found');
      }
      
      // Get sales during promotion period
      const promotionSales = await this.getPromotionSales(promotion);
      
      // Get baseline sales (same period last year or previous period)
      const baselineSales = await this.getBaselineSales(promotion);
      
      // Calculate metrics
      const totalCost = safeNumber(promotion.totalBudget, 0);
      const revenue = promotionSales.totalRevenue;
      const baselineRevenue = baselineSales.totalRevenue;
      const incrementalRevenue = revenue - baselineRevenue;
      const incrementalUnits = promotionSales.totalQuantity - baselineSales.totalQuantity;
      
      // Assume 40% gross margin
      const grossMarginPercent = 40;
      const incrementalProfit = incrementalRevenue * (grossMarginPercent / 100);
      const netProfit = incrementalProfit - totalCost;
      const roi = calculatePercentage(netProfit, totalCost);
      
      // Lift calculations
      const unitLift = baselineSales.totalQuantity > 0 
        ? calculatePercentage(incrementalUnits, baselineSales.totalQuantity)
        : 0;
      const revenueLift = baselineRevenue > 0 
        ? calculatePercentage(incrementalRevenue, baselineRevenue)
        : 0;
      
      // Efficiency metrics
      const costPerIncrementalUnit = incrementalUnits > 0 ? totalCost / incrementalUnits : 0;
      const costPerIncrementalRevenue = incrementalRevenue > 0 ? totalCost / incrementalRevenue : 0;
      
      // Effectiveness score (0-100)
      const effectivenessScore = this.calculateEffectivenessScore({
        roi,
        revenueLift,
        unitLift,
        redemptionRate: promotionSales.transactionCount / (promotionSales.transactionCount + baselineSales.transactionCount)
      });
      
      const result = {
        promotion: {
          id: promotion._id,
          name: promotion.name,
          type: promotion.promotionType,
          customer: promotion.customerId?.name,
          startDate: promotion.startDate,
          endDate: promotion.endDate,
          duration: Math.ceil((promotion.endDate - promotion.startDate) / (1000 * 60 * 60 * 24))
        },
        costs: {
          totalBudget: totalCost,
          costPerUnit: costPerIncrementalUnit,
          costPerRevenue: costPerIncrementalRevenue
        },
        sales: {
          promotion: {
            revenue: revenue,
            units: promotionSales.totalQuantity,
            transactions: promotionSales.transactionCount,
            avgTransactionValue: promotionSales.transactionCount > 0 
              ? revenue / promotionSales.transactionCount 
              : 0
          },
          baseline: {
            revenue: baselineRevenue,
            units: baselineSales.totalQuantity,
            transactions: baselineSales.transactionCount
          },
          incremental: {
            revenue: incrementalRevenue,
            units: incrementalUnits,
            profit: incrementalProfit
          }
        },
        performance: {
          roi: roi,
          netProfit: netProfit,
          revenueLift: revenueLift,
          unitLift: unitLift,
          effectivenessScore: effectivenessScore,
          paybackPeriod: netProfit > 0 ? totalCost / (netProfit / promotion.duration) : null
        },
        rating: this.getRating(effectivenessScore),
        recommendations: this.generateRecommendations({
          roi,
          revenueLift,
          unitLift,
          effectivenessScore,
          promotionType: promotion.promotionType
        })
      };
      
      logger.info('Promotion ROI calculated', {
        promotionId,
        roi,
        effectivenessScore,
        incrementalRevenue
      });
      
      return result;
      
    } catch (error) {
      logger.error('Error calculating promotion ROI', { promotionId, error: error.message });
      throw error;
    }
  }
  
  /**
   * Get sales during promotion period
   */
  async getPromotionSales(promotion) {
    const result = await SalesTransaction.aggregate([
      {
        $match: {
          tenant: promotion.tenant,
          transactionDate: {
            $gte: promotion.startDate,
            $lte: promotion.endDate
          },
          customerId: promotion.customerId,
          ...(promotion.productId && { productId: promotion.productId })
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalQuantity: { $sum: '$quantity' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);
    
    return result[0] || { totalRevenue: 0, totalQuantity: 0, transactionCount: 0 };
  }
  
  /**
   * Get baseline sales (same period, previous year or pre-promotion)
   */
  async getBaselineSales(promotion) {
    // Use same period last year as baseline
    const promotionDuration = promotion.endDate - promotion.startDate;
    const baselineStart = new Date(promotion.startDate);
    baselineStart.setFullYear(baselineStart.getFullYear() - 1);
    const baselineEnd = new Date(baselineStart.getTime() + promotionDuration);
    
    const result = await SalesTransaction.aggregate([
      {
        $match: {
          tenant: promotion.tenant,
          transactionDate: {
            $gte: baselineStart,
            $lte: baselineEnd
          },
          customerId: promotion.customerId,
          ...(promotion.productId && { productId: promotion.productId })
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalQuantity: { $sum: '$quantity' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);
    
    return result[0] || { totalRevenue: 0, totalQuantity: 0, transactionCount: 0 };
  }
  
  /**
   * Calculate effectiveness score (0-100)
   */
  calculateEffectivenessScore(metrics) {
    let score = 0;
    
    // ROI contribution (40 points)
    if (metrics.roi >= 100) score += 40;
    else if (metrics.roi >= 50) score += 30;
    else if (metrics.roi >= 0) score += 20;
    else score += 10;
    
    // Revenue lift contribution (30 points)
    if (metrics.revenueLift >= 50) score += 30;
    else if (metrics.revenueLift >= 25) score += 20;
    else if (metrics.revenueLift >= 10) score += 15;
    else score += 10;
    
    // Unit lift contribution (20 points)
    if (metrics.unitLift >= 50) score += 20;
    else if (metrics.unitLift >= 25) score += 15;
    else if (metrics.unitLift >= 10) score += 10;
    else score += 5;
    
    // Redemption rate contribution (10 points)
    if (metrics.redemptionRate >= 0.5) score += 10;
    else if (metrics.redemptionRate >= 0.3) score += 7;
    else if (metrics.redemptionRate >= 0.1) score += 5;
    else score += 2;
    
    return Math.min(100, score);
  }
  
  /**
   * Get rating based on effectiveness score
   */
  getRating(score) {
    if (score >= 80) return { grade: 'A', description: 'Excellent', color: 'green' };
    if (score >= 60) return { grade: 'B', description: 'Good', color: 'blue' };
    if (score >= 40) return { grade: 'C', description: 'Fair', color: 'yellow' };
    if (score >= 20) return { grade: 'D', description: 'Poor', color: 'orange' };
    return { grade: 'F', description: 'Failed', color: 'red' };
  }
  
  /**
   * Generate recommendations
   */
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.roi < 0) {
      recommendations.push({
        type: 'critical',
        title: 'Negative ROI',
        message: 'This promotion is losing money. Consider discontinuing or restructuring.',
        action: 'Review promotion mechanics and reduce costs'
      });
    } else if (metrics.roi < 50) {
      recommendations.push({
        type: 'warning',
        title: 'Low ROI',
        message: 'ROI is below optimal levels.',
        action: 'Reduce promotion costs or increase customer targeting'
      });
    }
    
    if (metrics.revenueLift < 10) {
      recommendations.push({
        type: 'warning',
        title: 'Low Revenue Lift',
        message: 'Promotion not generating significant incremental sales.',
        action: 'Increase promotion visibility or offer more compelling value'
      });
    }
    
    if (metrics.effectivenessScore >= 80) {
      recommendations.push({
        type: 'success',
        title: 'High Performance',
        message: 'Excellent promotion performance. Consider replicating.',
        action: 'Create template for similar future promotions'
      });
    }
    
    // Type-specific recommendations
    if (metrics.promotionType === 'discount_percentage' && metrics.roi < 50) {
      recommendations.push({
        type: 'info',
        title: 'Discount Optimization',
        message: 'Consider tiered discounts instead of flat percentage.',
        action: 'Test volume-based discount tiers'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Compare multiple promotions
   */
  async comparePromotions(promotionIds) {
    try {
      const comparisons = [];
      
      for (const id of promotionIds) {
        const roi = await this.calculatePromotionROI(id);
        comparisons.push(roi);
      }
      
      // Sort by effectiveness score
      comparisons.sort((a, b) => b.performance.effectivenessScore - a.performance.effectivenessScore);
      
      // Find best practices
      const bestPromotion = comparisons[0];
      const avgROI = comparisons.reduce((sum, p) => sum + p.performance.roi, 0) / comparisons.length;
      const avgLift = comparisons.reduce((sum, p) => sum + p.performance.revenueLift, 0) / comparisons.length;
      
      return {
        promotions: comparisons,
        summary: {
          totalPromotions: comparisons.length,
          averageROI: avgROI,
          averageLift: avgLift,
          bestPerformer: {
            name: bestPromotion.promotion.name,
            roi: bestPromotion.performance.roi,
            effectivenessScore: bestPromotion.performance.effectivenessScore
          }
        },
        insights: this.generateInsights(comparisons)
      };
      
    } catch (error) {
      logger.error('Error comparing promotions', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Generate insights from promotion comparison
   */
  generateInsights(comparisons) {
    const insights = [];
    
    // Best promotion type
    const byType = {};
    comparisons.forEach(p => {
      const type = p.promotion.type;
      if (!byType[type]) byType[type] = [];
      byType[type].push(p.performance.roi);
    });
    
    const avgByType = Object.entries(byType).map(([type, rois]) => ({
      type,
      avgROI: rois.reduce((sum, roi) => sum + roi, 0) / rois.length,
      count: rois.length
    })).sort((a, b) => b.avgROI - a.avgROI);
    
    if (avgByType.length > 0) {
      insights.push({
        category: 'Promotion Type',
        insight: `${avgByType[0].type} promotions perform best with avg ROI of ${avgByType[0].avgROI.toFixed(1)}%`,
        data: avgByType
      });
    }
    
    // Duration analysis
    const shortTerm = comparisons.filter(p => p.promotion.duration <= 7);
    const longTerm = comparisons.filter(p => p.promotion.duration > 7);
    
    if (shortTerm.length > 0 && longTerm.length > 0) {
      const shortAvg = shortTerm.reduce((sum, p) => sum + p.performance.roi, 0) / shortTerm.length;
      const longAvg = longTerm.reduce((sum, p) => sum + p.performance.roi, 0) / longTerm.length;
      
      insights.push({
        category: 'Duration',
        insight: shortAvg > longAvg 
          ? `Short-term promotions (≤7 days) perform better with ${shortAvg.toFixed(1)}% avg ROI`
          : `Long-term promotions (>7 days) perform better with ${longAvg.toFixed(1)}% avg ROI`,
        data: { shortTerm: shortAvg, longTerm: longAvg }
      });
    }
    
    return insights;
  }
  
  /**
   * Create promotion template from successful promotion
   */
  async createPromotionTemplate(promotionId, templateName) {
    try {
      const promotion = await Promotion.findById(promotionId);
      
      if (!promotion) {
        throw new Error('Promotion not found');
      }
      
      // Calculate ROI to ensure it's worthy of being a template
      const roi = await this.calculatePromotionROI(promotionId);
      
      if (roi.performance.effectivenessScore < 60) {
        throw new Error('Promotion effectiveness score too low to create template (must be ≥60)');
      }
      
      const template = {
        name: templateName,
        basedOn: promotionId,
        promotionType: promotion.promotionType,
        structure: {
          discountPercentage: promotion.discountPercentage,
          discountAmount: promotion.discountAmount,
          rebatePerUnit: promotion.rebatePerUnit,
          minimumPurchase: promotion.minimumPurchase,
          targetVolume: promotion.targetVolume
        },
        recommendedDuration: promotion.endDate - promotion.startDate,
        recommendedBudget: promotion.totalBudget,
        expectedROI: roi.performance.roi,
        expectedLift: roi.performance.revenueLift,
        createdAt: new Date()
      };
      
      logger.info('Promotion template created', { templateName, basedOn: promotionId });
      
      return template;
      
    } catch (error) {
      logger.error('Error creating promotion template', { promotionId, error: error.message });
      throw error;
    }
  }
}

module.exports = new AdvancedPromotionService();
