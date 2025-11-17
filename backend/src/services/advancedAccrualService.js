/**
 * Advanced Accrual Management Service
 *
 * Features:
 * - Automatic accrual calculation from promotions and trade spend
 * - Accrual vs actual reconciliation
 * - Journal entry generation
 * - Variance analysis
 * - SOX-compliant audit trails
 */

const Accrual = require('../models/Accrual');
const Promotion = require('../models/Promotion');
const TradeSpend = require('../models/TradeSpend');
const SalesTransaction = require('../models/SalesTransaction');
const Budget = require('../models/Budget');
const logger = require('../../utils/logger');
const { safeNumber } = require('../../utils/safeNumbers');

class AdvancedAccrualService {

  /**
   * Calculate accruals for a given period
   * @param {Object} params - { year, month, tenant, calculateBy }
   * @returns {Object} Accrual calculation results
   */
  async calculateMonthlyAccruals(params) {
    const { year, month, tenant, calculateBy = 'promotion', userId } = params;

    try {
      logger.info('Starting accrual calculation', { year, month, tenant, calculateBy });

      const results = {
        year,
        month,
        tenant,
        calculatedAt: new Date(),
        accruals: [],
        summary: {
          totalAccrualAmount: 0,
          totalActualAmount: 0,
          totalVariance: 0,
          accrualCount: 0,
          byType: {}
        }
      };

      // Calculate based on method
      if (calculateBy === 'promotion') {
        const promotionAccruals = await this.calculatePromotionAccruals(year, month, tenant, userId);
        results.accruals.push(...promotionAccruals);
      }

      if (calculateBy === 'trade_spend' || calculateBy === 'all') {
        const tradeSpendAccruals = await this.calculateTradeSpendAccruals(year, month, tenant, userId);
        results.accruals.push(...tradeSpendAccruals);
      }

      // Calculate summary
      results.accruals.forEach((accrual) => {
        results.summary.totalAccrualAmount += safeNumber(accrual.totalAccrual, 0);
        results.summary.totalActualAmount += safeNumber(accrual.totalActual, 0);
        results.summary.accrualCount++;

        const type = accrual.accrualType;
        if (!results.summary.byType[type]) {
          results.summary.byType[type] = { count: 0, amount: 0 };
        }
        results.summary.byType[type].count++;
        results.summary.byType[type].amount += safeNumber(accrual.totalAccrual, 0);
      });

      results.summary.totalVariance = results.summary.totalAccrualAmount - results.summary.totalActualAmount;

      logger.info('Accrual calculation complete', {
        accrualCount: results.summary.accrualCount,
        totalAmount: results.summary.totalAccrualAmount
      });

      return results;

    } catch (error) {
      logger.error('Error calculating monthly accruals', { error: error.message, year, month, tenant });
      throw error;
    }
  }

  /**
   * Calculate accruals from promotions
   */
  async calculatePromotionAccruals(year, month, tenant, userId) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Find active promotions in the period
    const promotions = await Promotion.find({
      tenant,
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        { startDate: { $gte: startDate, $lte: endDate } }
      ],
      status: { $in: ['active', 'approved', 'completed'] }
    }).populate('customerId');

    const accruals = [];

    for (const promotion of promotions) {
      try {
        // Get actual sales for this promotion
        const sales = await SalesTransaction.aggregate([
          {
            $match: {
              tenant,
              transactionDate: { $gte: startDate, $lte: endDate },
              customerId: promotion.customerId?._id,
              promotionId: promotion._id
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

        const actualSales = sales[0] || { totalRevenue: 0, totalQuantity: 0, transactionCount: 0 };

        // Calculate accrual based on promotion type
        let accrualAmount = 0;
        let calculationMethod = 'percentage';
        let calculationBasis = 'sales';

        switch (promotion.promotionType) {
          case 'discount_percentage':
            accrualAmount = actualSales.totalRevenue * (safeNumber(promotion.discountPercentage, 0) / 100);
            calculationMethod = 'percentage';
            break;

          case 'discount_fixed':
            accrualAmount = safeNumber(promotion.discountAmount, 0) * actualSales.transactionCount;
            calculationMethod = 'fixed_amount';
            break;

          case 'volume_rebate':
            accrualAmount = safeNumber(promotion.rebatePerUnit, 0) * actualSales.totalQuantity;
            calculationMethod = 'per_unit';
            calculationBasis = 'volume';
            break;

          case 'lump_sum': {
            // Prorate lump sum over promotion period
            const promotionDays = Math.ceil((promotion.endDate - promotion.startDate) / (1000 * 60 * 60 * 24));
            const daysInMonth = Math.min(
              Math.ceil((endDate - Math.max(startDate, promotion.startDate)) / (1000 * 60 * 60 * 24)),
              promotionDays
            );
            accrualAmount = (safeNumber(promotion.totalBudget, 0) / promotionDays) * daysInMonth;
            calculationMethod = 'fixed_amount';
            break;
          }

          default:
            // Default to percentage of sales
            accrualAmount = actualSales.totalRevenue * 0.05; // 5% default
        }

        // Check if accrual already exists
        const existingAccrual = await Accrual.findOne({
          promotionId: promotion._id,
          'period.year': year,
          'period.month': month,
          tenant
        });

        if (existingAccrual) {
          // Update existing
          existingAccrual.totalActual = actualSales.totalRevenue;
          existingAccrual.totalAccrual = accrualAmount;
          existingAccrual.totalVariance = accrualAmount - actualSales.totalRevenue;
          existingAccrual.variancePercent = actualSales.totalRevenue > 0
            ? ((accrualAmount - actualSales.totalRevenue) / actualSales.totalRevenue) * 100
            : 0;
          existingAccrual.updatedBy = userId;

          await existingAccrual.save();
          accruals.push(existingAccrual);

        } else {
          // Create new accrual
          const accrualNumber = await this.generateAccrualNumber(year, month, tenant);

          const newAccrual = await Accrual.create({
            accrualNumber,
            tenant,
            period: {
              year,
              month,
              quarter: Math.ceil(month / 3)
            },
            accrualType: 'promotion',
            customerId: promotion.customerId?._id,
            promotionId: promotion._id,
            accrualDate: new Date(),
            startDate,
            endDate,
            totalAccrual: accrualAmount,
            totalActual: actualSales.totalRevenue,
            totalVariance: accrualAmount - actualSales.totalRevenue,
            variancePercent: actualSales.totalRevenue > 0
              ? ((accrualAmount - actualSales.totalRevenue) / actualSales.totalRevenue) * 100
              : 0,
            status: 'draft',
            calculationMethod,
            calculationBasis,
            currency: 'ZAR',
            lines: [{
              lineNumber: 1,
              description: `${promotion.name} - ${promotion.promotionType}`,
              glAccount: '50000', // Trade Spend Expense
              costCenter: promotion.costCenter || 'TRADE',
              productId: promotion.productId,
              customerId: promotion.customerId?._id,
              accrualAmount,
              actualAmount: actualSales.totalRevenue,
              variance: accrualAmount - actualSales.totalRevenue,
              variancePercent: actualSales.totalRevenue > 0
                ? ((accrualAmount - actualSales.totalRevenue) / actualSales.totalRevenue) * 100
                : 0
            }],
            createdBy: userId,
            notes: `Auto-calculated from promotion: ${promotion.name}`
          });

          accruals.push(newAccrual);
        }

      } catch (error) {
        logger.error('Error calculating accrual for promotion', {
          promotionId: promotion._id,
          error: error.message
        });
      }
    }

    return accruals;
  }

  /**
   * Calculate accruals from trade spend activities
   */
  async calculateTradeSpendAccruals(year, month, tenant, userId) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const tradeSpends = await TradeSpend.find({
      tenant,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      status: { $in: ['active', 'approved', 'completed'] }
    }).populate('customerId');

    const accruals = [];

    for (const tradeSpend of tradeSpends) {
      try {
        // Calculate accrual amount (prorate if needed)
        const totalDays = Math.ceil((tradeSpend.endDate - tradeSpend.startDate) / (1000 * 60 * 60 * 24));
        const daysInMonth = Math.min(
          Math.ceil((endDate - Math.max(startDate, tradeSpend.startDate)) / (1000 * 60 * 60 * 24)),
          totalDays
        );

        const accrualAmount = (safeNumber(tradeSpend.totalBudget, 0) / totalDays) * daysInMonth;
        const actualSpend = safeNumber(tradeSpend.actualSpend, 0);

        const accrualNumber = await this.generateAccrualNumber(year, month, tenant);

        const newAccrual = await Accrual.create({
          accrualNumber,
          tenant,
          period: {
            year,
            month,
            quarter: Math.ceil(month / 3)
          },
          accrualType: 'trade_spend',
          customerId: tradeSpend.customerId?._id,
          tradeSpendId: tradeSpend._id,
          accrualDate: new Date(),
          startDate,
          endDate,
          totalAccrual: accrualAmount,
          totalActual: actualSpend,
          totalVariance: accrualAmount - actualSpend,
          variancePercent: actualSpend > 0
            ? ((accrualAmount - actualSpend) / actualSpend) * 100
            : 0,
          status: 'draft',
          calculationMethod: 'actuals',
          calculationBasis: 'contract',
          currency: 'ZAR',
          lines: [{
            lineNumber: 1,
            description: `${tradeSpend.category} - ${tradeSpend.description || 'Trade Spend'}`,
            glAccount: '50000',
            costCenter: 'TRADE',
            customerId: tradeSpend.customerId?._id,
            accrualAmount,
            actualAmount: actualSpend,
            variance: accrualAmount - actualSpend,
            variancePercent: actualSpend > 0
              ? ((accrualAmount - actualSpend) / actualSpend) * 100
              : 0
          }],
          createdBy: userId,
          notes: 'Auto-calculated from trade spend activity'
        });

        accruals.push(newAccrual);

      } catch (error) {
        logger.error('Error calculating accrual for trade spend', {
          tradeSpendId: tradeSpend._id,
          error: error.message
        });
      }
    }

    return accruals;
  }

  /**
   * Reconcile accruals with actual spend
   */
  async reconcileAccruals(accrualId, actualAmount, userId) {
    try {
      const accrual = await Accrual.findById(accrualId);

      if (!accrual) {
        throw new Error('Accrual not found');
      }

      accrual.totalActual = safeNumber(actualAmount, 0);
      accrual.totalVariance = accrual.totalAccrual - actualAmount;
      accrual.variancePercent = actualAmount > 0
        ? ((accrual.totalAccrual - actualAmount) / actualAmount) * 100
        : 0;

      // Update line items proportionally
      accrual.lines.forEach((line) => {
        const proportion = line.accrualAmount / accrual.totalAccrual;
        line.actualAmount = actualAmount * proportion;
        line.variance = line.accrualAmount - line.actualAmount;
        line.variancePercent = line.actualAmount > 0
          ? ((line.accrualAmount - line.actualAmount) / line.actualAmount) * 100
          : 0;
      });

      accrual.reconciled = true;
      accrual.reconciledAt = new Date();
      accrual.reconciledBy = userId;
      accrual.status = 'reconciled';
      accrual.updatedBy = userId;

      await accrual.save();

      logger.info('Accrual reconciled', {
        accrualId,
        totalAccrual: accrual.totalAccrual,
        totalActual: actualAmount,
        variance: accrual.totalVariance
      });

      return accrual;

    } catch (error) {
      logger.error('Error reconciling accrual', { accrualId, error: error.message });
      throw error;
    }
  }

  /**
   * Generate journal entries for posting to GL
   */
  async generateJournalEntries(accrualId) {
    try {
      const accrual = await Accrual.findById(accrualId)
        .populate('customerId')
        .populate('promotionId')
        .populate('tradeSpendId');

      if (!accrual) {
        throw new Error('Accrual not found');
      }

      const journalEntries = [];

      // Debit: Trade Spend Expense
      journalEntries.push({
        account: '50000', // Trade Spend Expense
        accountName: 'Trade Spend Expense',
        debit: accrual.totalAccrual,
        credit: 0,
        description: `Accrual for ${accrual.accrualType} - ${accrual.accrualNumber}`,
        costCenter: 'TRADE',
        customerId: accrual.customerId?._id,
        customerName: accrual.customerId?.name
      });

      // Credit: Accrued Trade Spend Liability
      journalEntries.push({
        account: '20500', // Accrued Liabilities
        accountName: 'Accrued Trade Spend Liability',
        debit: 0,
        credit: accrual.totalAccrual,
        description: `Accrual for ${accrual.accrualType} - ${accrual.accrualNumber}`,
        costCenter: 'TRADE',
        customerId: accrual.customerId?._id,
        customerName: accrual.customerId?.name
      });

      return {
        accrualNumber: accrual.accrualNumber,
        period: `${accrual.period.year}-${String(accrual.period.month).padStart(2, '0')}`,
        postingDate: new Date(),
        currency: accrual.currency,
        totalDebit: accrual.totalAccrual,
        totalCredit: accrual.totalAccrual,
        entries: journalEntries,
        documentText: `Accrual ${accrual.accrualNumber} - ${accrual.accrualType}`,
        reference: accrual.accrualNumber
      };

    } catch (error) {
      logger.error('Error generating journal entries', { accrualId, error: error.message });
      throw error;
    }
  }

  /**
   * Post accrual to GL
   */
  async postAccrual(accrualId, glDocument, userId) {
    try {
      const accrual = await Accrual.findById(accrualId);

      if (!accrual) {
        throw new Error('Accrual not found');
      }

      if (accrual.glPosted) {
        throw new Error('Accrual already posted to GL');
      }

      accrual.glPosted = true;
      accrual.glPostingDate = new Date();
      accrual.glDocument = glDocument;
      accrual.status = 'posted';
      accrual.updatedBy = userId;

      await accrual.save();

      logger.info('Accrual posted to GL', { accrualId, glDocument });

      return accrual;

    } catch (error) {
      logger.error('Error posting accrual to GL', { accrualId, error: error.message });
      throw error;
    }
  }

  /**
   * Generate variance report
   */
  async generateVarianceReport(params) {
    const { year, month, tenant, thresholdPercent = 10 } = params;

    try {
      const accruals = await Accrual.find({
        tenant,
        'period.year': year,
        'period.month': month
      })
        .populate('customerId')
        .populate('promotionId')
        .populate('tradeSpendId')
        .sort({ variancePercent: -1 });

      const report = {
        period: { year, month },
        generatedAt: new Date(),
        summary: {
          totalAccruals: accruals.length,
          totalAccrualAmount: 0,
          totalActualAmount: 0,
          totalVariance: 0,
          significantVariances: 0,
          byStatus: {},
          byType: {}
        },
        significantVariances: [],
        allAccruals: []
      };

      accruals.forEach((accrual) => {
        // Summary calculations
        report.summary.totalAccrualAmount += safeNumber(accrual.totalAccrual, 0);
        report.summary.totalActualAmount += safeNumber(accrual.totalActual, 0);
        report.summary.totalVariance += safeNumber(accrual.totalVariance, 0);

        // By status
        const status = accrual.status;
        if (!report.summary.byStatus[status]) {
          report.summary.byStatus[status] = { count: 0, amount: 0 };
        }
        report.summary.byStatus[status].count++;
        report.summary.byStatus[status].amount += safeNumber(accrual.totalAccrual, 0);

        // By type
        const type = accrual.accrualType;
        if (!report.summary.byType[type]) {
          report.summary.byType[type] = { count: 0, amount: 0, variance: 0 };
        }
        report.summary.byType[type].count++;
        report.summary.byType[type].amount += safeNumber(accrual.totalAccrual, 0);
        report.summary.byType[type].variance += safeNumber(accrual.totalVariance, 0);

        // Significant variances
        if (Math.abs(accrual.variancePercent) >= thresholdPercent) {
          report.summary.significantVariances++;
          report.significantVariances.push({
            accrualNumber: accrual.accrualNumber,
            accrualType: accrual.accrualType,
            customer: accrual.customerId?.name || 'N/A',
            accrualAmount: accrual.totalAccrual,
            actualAmount: accrual.totalActual,
            variance: accrual.totalVariance,
            variancePercent: accrual.variancePercent,
            status: accrual.status
          });
        }

        // All accruals
        report.allAccruals.push({
          accrualNumber: accrual.accrualNumber,
          accrualType: accrual.accrualType,
          customer: accrual.customerId?.name || 'N/A',
          accrualAmount: accrual.totalAccrual,
          actualAmount: accrual.totalActual,
          variance: accrual.totalVariance,
          variancePercent: accrual.variancePercent,
          status: accrual.status,
          glPosted: accrual.glPosted,
          reconciled: accrual.reconciled
        });
      });

      return report;

    } catch (error) {
      logger.error('Error generating variance report', { error: error.message, year, month, tenant });
      throw error;
    }
  }

  /**
   * Generate unique accrual number
   */
  async generateAccrualNumber(year, month, tenant) {
    const prefix = `ACC${year}${String(month).padStart(2, '0')}`;
    const count = await Accrual.countDocuments({
      tenant,
      accrualNumber: { $regex: `^${prefix}` }
    });

    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
}

module.exports = new AdvancedAccrualService();
