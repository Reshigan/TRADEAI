const Rebate = require('../models/Rebate');
const RebateAccrual = require('../models/RebateAccrual');

class RebateCalculationService {
  /**
   * Calculate rebates for a transaction
   * @param {Object} transaction - Transaction object
   * @returns {Array} - Array of applicable rebates
   */
  async calculateRebatesForTransaction(transaction) {
    const applicableRebates = [];
    
    // Find all active rebates
    const rebates = await Rebate.find({
      status: 'active',
      startDate: { $lte: transaction.date || new Date() },
      $or: [
        { endDate: { $gte: transaction.date || new Date() } },
        { endDate: null }
      ]
    });
    
    for (const rebate of rebates) {
      // Check eligibility
      if (!rebate.isCustomerEligible(
        transaction.customerId,
        transaction.customerType,
        transaction.territory
      )) {
        continue;
      }
      
      // Calculate rebate amount
      const rebateAmount = rebate.calculateRebate(transaction);
      
      if (rebateAmount > 0) {
        applicableRebates.push({
          rebateId: rebate._id,
          rebateName: rebate.name,
          rebateType: rebate.type,
          baseAmount: transaction.amount || transaction.totalAmount,
          rebateAmount,
          calculationType: rebate.calculationType,
          rate: rebate.rate
        });
      }
    }
    
    return applicableRebates;
  }
  
  /**
   * Accrue rebates for a period
   * @param {String} period - Period (e.g., "2025-01")
   * @returns {Array} - Array of accruals
   */
  async accrueRebatesForPeriod(period) {
    const accruals = [];
    
    // This would typically:
    // 1. Get all transactions for the period
    // 2. Calculate rebates for each transaction
    // 3. Aggregate by customer and rebate
    // 4. Create accrual records
    
    // For now, return empty array
    return accruals;
  }
  
  /**
   * Calculate net margin considering all rebates
   * @param {Object} transaction - Transaction object
   * @returns {Object} - Margin breakdown
   */
  async calculateNetMargin(transaction) {
    const grossRevenue = transaction.amount || transaction.totalAmount || 0;
    const cogs = transaction.cogs || 0;
    
    // Get all applicable rebates
    const rebates = await this.calculateRebatesForTransaction(transaction);
    const totalRebates = rebates.reduce((sum, r) => sum + r.rebateAmount, 0);
    
    // Calculate waterfall
    const netRevenue = grossRevenue - totalRebates;
    const grossMargin = netRevenue - cogs;
    const grossMarginPercent = netRevenue > 0 ? (grossMargin / netRevenue * 100) : 0;
    
    // Distribution costs (5% of net revenue)
    const distributionCosts = netRevenue * 0.05;
    const netMargin = grossMargin - distributionCosts;
    const netMarginPercent = netRevenue > 0 ? (netMargin / netRevenue * 100) : 0;
    
    return {
      grossRevenue,
      rebates: {
        total: totalRebates,
        breakdown: rebates
      },
      netRevenue,
      cogs,
      grossMargin,
      grossMarginPercent,
      distributionCosts,
      netMargin,
      netMarginPercent,
      
      // Margin erosion analysis
      marginImpact: {
        baseMargin: ((grossRevenue - cogs) / grossRevenue * 100),
        finalMargin: netMarginPercent,
        erosion: ((grossRevenue - cogs) / grossRevenue * 100) - netMarginPercent
      }
    };
  }
  
  /**
   * Handle parallel/overlapping promotions
   * @param {Object} transaction - Transaction with multiple promotions
   * @returns {Object} - Combined margin calculation
   */
  async calculateParallelPromotions(transaction) {
    // This handles the scenario where multiple promotions/rebates apply simultaneously
    // and need to be stacked correctly to calculate true net margin
    
    const promotions = transaction.promotions || [];
    const rebates = await this.calculateRebatesForTransaction(transaction);
    
    let currentPrice = transaction.basePrice || transaction.amount;
    const waterfall = {
      basePrice: currentPrice,
      steps: []
    };
    
    // Apply promotions first (off-invoice)
    for (const promo of promotions) {
      const discount = promo.type === 'percentage' 
        ? currentPrice * (promo.value / 100)
        : promo.value;
      
      waterfall.steps.push({
        type: 'promotion',
        name: promo.name,
        discount,
        priceAfter: currentPrice - discount
      });
      
      currentPrice -= discount;
    }
    
    // Then apply rebates (post-invoice)
    for (const rebate of rebates) {
      waterfall.steps.push({
        type: 'rebate',
        name: rebate.rebateName,
        discount: rebate.rebateAmount,
        priceAfter: currentPrice - rebate.rebateAmount
      });
      
      currentPrice -= rebate.rebateAmount;
    }
    
    waterfall.finalPrice = currentPrice;
    waterfall.totalDiscount = transaction.basePrice - currentPrice;
    waterfall.discountPercent = ((transaction.basePrice - currentPrice) / transaction.basePrice * 100);
    
    return waterfall;
  }
}

module.exports = new RebateCalculationService();
