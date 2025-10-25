const Accrual = require('../models/Accrual');
const TradeSpend = require('../models/TradeSpend');
const Promotion = require('../models/Promotion');
const Invoice = require('../models/Invoice');

/**
 * ACCRUAL MANAGEMENT SERVICE
 * Manages accruals vs actuals, period-end closing, and variance analysis
 */
class AccrualManagementService {
  /**
   * Calculate accrual for trade spend
   */
  async calculateTradeSpendAccrual(tradeSpendId, period) {
    const tradeSpend = await TradeSpend.findById(tradeSpendId)
      .populate('customerId')
      .populate('productId');

    if (!tradeSpend) throw new Error('Trade spend not found');

    const accrualAmount = this._calculateAccrualAmount(tradeSpend, period);

    const accrual = new Accrual({
      accrualNumber: await this._generateAccrualNumber(),
      period: period,
      accrualType: 'trade_spend',
      customerId: tradeSpend.customerId,
      tradeSpendId: tradeSpend._id,
      accrualDate: new Date(),
      startDate: period.startDate,
      endDate: period.endDate,
      lines: [{
        lineNumber: 1,
        description: tradeSpend.description || `Trade Spend - ${tradeSpend.customerId.name}`,
        glAccount: tradeSpend.glAccount || '5100',
        costCenter: tradeSpend.costCenter,
        productId: tradeSpend.productId,
        customerId: tradeSpend.customerId,
        accrualAmount: accrualAmount,
        actualAmount: 0
      }],
      totalAccrual: accrualAmount,
      calculationMethod: tradeSpend.calculationMethod || 'percentage',
      calculationBasis: tradeSpend.calculationBasis || 'sales',
      currency: tradeSpend.currency || 'USD',
      createdBy: tradeSpend.createdBy
    });

    await accrual.save();
    return accrual;
  }

  /**
   * Calculate accrual for promotion
   */
  async calculatePromotionAccrual(promotionId, period) {
    const promotion = await Promotion.findById(promotionId)
      .populate('customerId');

    if (!promotion) throw new Error('Promotion not found');

    const accrualAmount = promotion.budget || promotion.estimatedCost || 0;

    const accrual = new Accrual({
      accrualNumber: await this._generateAccrualNumber(),
      period: period,
      accrualType: 'promotion',
      customerId: promotion.customerId,
      promotionId: promotion._id,
      accrualDate: new Date(),
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      lines: [{
        lineNumber: 1,
        description: `Promotion - ${promotion.name}`,
        glAccount: promotion.glAccount || '5200',
        customerId: promotion.customerId,
        accrualAmount: accrualAmount,
        actualAmount: 0
      }],
      totalAccrual: accrualAmount,
      calculationMethod: 'fixed_amount',
      calculationBasis: 'contract',
      currency: promotion.currency || 'USD',
      createdBy: promotion.createdBy
    });

    await accrual.save();
    return accrual;
  }

  /**
   * Update accruals with actual amounts from invoices
   */
  async updateAccrualsWithActuals(period) {
    const accruals = await Accrual.getPeriodAccruals(period.year, period.month);

    const results = {
      total: accruals.length,
      updated: 0,
      reconciled: 0,
      needsReview: []
    };

    for (const accrual of accruals) {
      try {
        // Find actual invoices for the accrual
        const actualAmount = await this._getActualAmount(accrual);

        // Update accrual lines with actuals
        for (const line of accrual.lines) {
          line.actualAmount = actualAmount / accrual.lines.length; // Simple distribution
        }

        await accrual.save();
        results.updated++;

        // Auto-reconcile if variance is within tolerance
        if (Math.abs(accrual.variancePercent) < 5) {
          await accrual.reconcile(accrual.createdBy);
          results.reconciled++;
        } else if (Math.abs(accrual.variancePercent) > 10) {
          results.needsReview.push({
            accrualNumber: accrual.accrualNumber,
            variance: accrual.totalVariance,
            variancePercent: accrual.variancePercent
          });
        }
      } catch (error) {
        console.error(`Error updating accrual ${accrual.accrualNumber}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Get actual amount from invoices
   */
  async _getActualAmount(accrual) {
    const query = {
      status: { $in: ['approved', 'paid'] },
      invoiceDate: {
        $gte: accrual.startDate || new Date(accrual.period.year, accrual.period.month - 1, 1),
        $lte: accrual.endDate || new Date(accrual.period.year, accrual.period.month, 0)
      }
    };

    if (accrual.customerId) {
      query.customerId = accrual.customerId;
    }

    if (accrual.tradeSpendId) {
      query['metadata.tradeSpendId'] = accrual.tradeSpendId;
    }

    if (accrual.promotionId) {
      query['metadata.promotionId'] = accrual.promotionId;
    }

    const invoices = await Invoice.find(query);
    return invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  }

  /**
   * Calculate accrual amount based on method
   */
  _calculateAccrualAmount(tradeSpend, period) {
    switch (tradeSpend.calculationMethod) {
      case 'percentage':
        return (tradeSpend.amount || 0) * ((tradeSpend.percentage || 0) / 100);
      
      case 'fixed_amount':
        return tradeSpend.amount || 0;
      
      case 'per_unit':
        return (tradeSpend.volume || 0) * (tradeSpend.ratePerUnit || 0);
      
      case 'tiered':
        return this._calculateTieredAmount(tradeSpend);
      
      default:
        return tradeSpend.amount || 0;
    }
  }

  /**
   * Calculate tiered accrual amount
   */
  _calculateTieredAmount(tradeSpend) {
    if (!tradeSpend.tiers || tradeSpend.tiers.length === 0) {
      return tradeSpend.amount || 0;
    }

    const volume = tradeSpend.volume || 0;
    let amount = 0;

    for (const tier of tradeSpend.tiers) {
      if (volume >= tier.minVolume && volume <= tier.maxVolume) {
        amount = tier.rate * volume;
        break;
      }
    }

    return amount;
  }

  /**
   * Period-end closing
   */
  async closePeriod(year, month, userId) {
    const accruals = await Accrual.getPeriodAccruals(year, month);

    const results = {
      total: accruals.length,
      closed: 0,
      reconciled: 0,
      needsReview: [],
      errors: []
    };

    // Step 1: Update all accruals with actuals
    const updateResult = await this.updateAccrualsWithActuals({ year, month });
    results.needsReview = updateResult.needsReview;

    // Step 2: Close reconciled accruals
    for (const accrual of accruals) {
      try {
        if (accrual.reconciled) {
          await accrual.close();
          results.closed++;
        } else if (Math.abs(accrual.variancePercent) < 5) {
          await accrual.reconcile(userId);
          await accrual.close();
          results.reconciled++;
          results.closed++;
        } else {
          results.needsReview.push({
            accrualNumber: accrual.accrualNumber,
            variance: accrual.totalVariance,
            variancePercent: accrual.variancePercent,
            status: accrual.status
          });
        }
      } catch (error) {
        results.errors.push({
          accrualNumber: accrual.accrualNumber,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Adjust accrual
   */
  async adjustAccrual(accrualId, adjustmentAmount, reason, userId) {
    const accrual = await Accrual.findById(accrualId);
    if (!accrual) throw new Error('Accrual not found');

    await accrual.adjust(adjustmentAmount, reason, userId);

    // Update first line with adjustment
    if (accrual.lines.length > 0) {
      accrual.lines[0].accrualAmount += adjustmentAmount;
      await accrual.save();
    }

    return accrual;
  }

  /**
   * Reverse accrual
   */
  async reverseAccrual(accrualId, reason, userId) {
    const accrual = await Accrual.findById(accrualId);
    if (!accrual) throw new Error('Accrual not found');

    await accrual.reverse(reason, userId);

    // Create reversing accrual
    const reversingAccrual = new Accrual({
      accrualNumber: await this._generateAccrualNumber(),
      period: accrual.period,
      accrualType: accrual.accrualType,
      customerId: accrual.customerId,
      tradeSpendId: accrual.tradeSpendId,
      promotionId: accrual.promotionId,
      accrualDate: new Date(),
      startDate: accrual.startDate,
      endDate: accrual.endDate,
      lines: accrual.lines.map(line => ({
        ...line.toObject(),
        accrualAmount: -line.accrualAmount,
        actualAmount: 0
      })),
      totalAccrual: -accrual.totalAccrual,
      calculationMethod: accrual.calculationMethod,
      calculationBasis: accrual.calculationBasis,
      currency: accrual.currency,
      notes: `Reversal of ${accrual.accrualNumber}: ${reason}`,
      createdBy: userId
    });

    await reversingAccrual.save();
    await reversingAccrual.post();

    return { original: accrual, reversing: reversingAccrual };
  }

  /**
   * Get variance analysis
   */
  async getVarianceAnalysis(options = {}) {
    const query = {
      status: { $nin: ['draft', 'reversed'] }
    };

    if (options.customerId) {
      query.customerId = options.customerId;
    }

    if (options.period) {
      query['period.year'] = options.period.year;
      query['period.month'] = options.period.month;
    }

    if (options.accrualType) {
      query.accrualType = options.accrualType;
    }

    const accruals = await Accrual.find(query)
      .populate('customerId')
      .populate('tradeSpendId')
      .populate('promotionId');

    const analysis = {
      totalAccrual: 0,
      totalActual: 0,
      totalVariance: 0,
      variancePercent: 0,
      favorableVariance: 0,
      unfavorableVariance: 0,
      withinTolerance: 0,
      needsReview: 0,
      byType: {},
      byCustomer: {},
      details: []
    };

    for (const accrual of accruals) {
      analysis.totalAccrual += accrual.totalAccrual;
      analysis.totalActual += accrual.totalActual;
      analysis.totalVariance += accrual.totalVariance;

      if (Math.abs(accrual.variancePercent) < 10) {
        analysis.withinTolerance++;
      } else {
        analysis.needsReview++;
      }

      if (accrual.totalVariance < 0) {
        analysis.favorableVariance += Math.abs(accrual.totalVariance);
      } else {
        analysis.unfavorableVariance += accrual.totalVariance;
      }

      // By type
      if (!analysis.byType[accrual.accrualType]) {
        analysis.byType[accrual.accrualType] = {
          count: 0,
          accrual: 0,
          actual: 0,
          variance: 0
        };
      }
      analysis.byType[accrual.accrualType].count++;
      analysis.byType[accrual.accrualType].accrual += accrual.totalAccrual;
      analysis.byType[accrual.accrualType].actual += accrual.totalActual;
      analysis.byType[accrual.accrualType].variance += accrual.totalVariance;

      // By customer
      if (accrual.customerId) {
        const customerId = accrual.customerId._id.toString();
        if (!analysis.byCustomer[customerId]) {
          analysis.byCustomer[customerId] = {
            name: accrual.customerId.name,
            count: 0,
            accrual: 0,
            actual: 0,
            variance: 0
          };
        }
        analysis.byCustomer[customerId].count++;
        analysis.byCustomer[customerId].accrual += accrual.totalAccrual;
        analysis.byCustomer[customerId].actual += accrual.totalActual;
        analysis.byCustomer[customerId].variance += accrual.totalVariance;
      }

      analysis.details.push({
        accrualNumber: accrual.accrualNumber,
        type: accrual.accrualType,
        customer: accrual.customerId?.name,
        accrual: accrual.totalAccrual,
        actual: accrual.totalActual,
        variance: accrual.totalVariance,
        variancePercent: accrual.variancePercent,
        status: accrual.status
      });
    }

    if (analysis.totalAccrual !== 0) {
      analysis.variancePercent = (analysis.totalVariance / analysis.totalAccrual) * 100;
    }

    return analysis;
  }

  /**
   * Generate accrual number
   */
  async _generateAccrualNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const count = await Accrual.countDocuments({
      'period.year': date.getFullYear(),
      'period.month': date.getMonth() + 1
    });

    return `ACC-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
}

module.exports = new AccrualManagementService();
