/**
 * Net Margin Analytics Service
 *
 * Provides comprehensive margin analysis with:
 * - Financial waterfall reporting
 * - Store-level margin tracking
 * - Product-level profitability
 * - Customer-level analysis
 */

class NetMarginService {
  /**
   * Calculate complete financial waterfall
   * @param {Object} transaction - Transaction with all promotions/rebates
   * @returns {Object} - Complete margin breakdown
   */
  calculateFinancialWaterfall(transaction) {
    const {
      basePrice = 0,
      quantity = 1,
      cogs = 0,
      promotions = [],
      rebates = []
    } = transaction;

    let currentAmount = basePrice * quantity;
    const waterfall = {
      steps: [],
      grossRevenue: currentAmount
    };

    // Step 1: Off-Invoice Discounts
    const offInvoiceDiscounts = promotions.filter((p) => p.type === 'off-invoice');
    let offInvoiceTotal = 0;

    offInvoiceDiscounts.forEach((promo) => {
      const discount = promo.discountType === 'percentage'
        ? currentAmount * (promo.value / 100)
        : promo.value;

      waterfall.steps.push({
        type: 'Off-Invoice Discount',
        name: promo.name,
        amount: -discount,
        percentage: ((discount / waterfall.grossRevenue) * 100).toFixed(2)
      });

      currentAmount -= discount;
      offInvoiceTotal += discount;
    });

    waterfall.netInvoiceRevenue = currentAmount;

    // Step 2: Volume Rebates
    const volumeRebates = rebates.filter((r) => r.type === 'volume');
    let volumeRebateTotal = 0;

    volumeRebates.forEach((rebate) => {
      const rebateAmount = currentAmount * (rebate.rate / 100);

      waterfall.steps.push({
        type: 'Volume Rebate',
        name: rebate.name,
        amount: -rebateAmount,
        percentage: ((rebateAmount / waterfall.grossRevenue) * 100).toFixed(2)
      });

      currentAmount -= rebateAmount;
      volumeRebateTotal += rebateAmount;
    });

    // Step 3: Growth Rebates
    const growthRebates = rebates.filter((r) => r.type === 'growth');
    let growthRebateTotal = 0;

    growthRebates.forEach((rebate) => {
      const rebateAmount = currentAmount * (rebate.rate / 100);

      waterfall.steps.push({
        type: 'Growth Rebate',
        name: rebate.name,
        amount: -rebateAmount,
        percentage: ((rebateAmount / waterfall.grossRevenue) * 100).toFixed(2)
      });

      currentAmount -= rebateAmount;
      growthRebateTotal += rebateAmount;
    });

    // Step 4: Co-op Marketing
    const coopRebates = rebates.filter((r) => r.type === 'coop');
    let coopTotal = 0;

    coopRebates.forEach((rebate) => {
      const rebateAmount = currentAmount * (rebate.rate / 100);

      waterfall.steps.push({
        type: 'Co-op Marketing',
        name: rebate.name,
        amount: -rebateAmount,
        percentage: ((rebateAmount / waterfall.grossRevenue) * 100).toFixed(2)
      });

      currentAmount -= rebateAmount;
      coopTotal += rebateAmount;
    });

    waterfall.netNetRevenue = currentAmount;

    // Step 5: COGS
    const cogsTotal = cogs * quantity;
    waterfall.steps.push({
      type: 'Cost of Goods Sold',
      name: 'COGS',
      amount: -cogsTotal,
      percentage: ((cogsTotal / waterfall.grossRevenue) * 100).toFixed(2)
    });

    currentAmount -= cogsTotal;
    waterfall.grossMargin = currentAmount;
    waterfall.grossMarginPercent = (currentAmount / waterfall.netNetRevenue * 100).toFixed(2);

    // Step 6: Distribution Costs (5%)
    const distributionCosts = waterfall.netNetRevenue * 0.05;
    waterfall.steps.push({
      type: 'Distribution Costs',
      name: 'Logistics & Shipping',
      amount: -distributionCosts,
      percentage: '5.00'
    });

    currentAmount -= distributionCosts;

    // Final Net Margin
    waterfall.netMargin = currentAmount;
    waterfall.netMarginPercent = (currentAmount / waterfall.netNetRevenue * 100).toFixed(2);

    // Summary
    waterfall.summary = {
      grossRevenue: waterfall.grossRevenue,
      totalDiscounts: offInvoiceTotal + volumeRebateTotal + growthRebateTotal + coopTotal,
      netNetRevenue: waterfall.netNetRevenue,
      cogs: cogsTotal,
      grossMargin: waterfall.grossMargin,
      grossMarginPercent: waterfall.grossMarginPercent,
      distributionCosts,
      netMargin: waterfall.netMargin,
      netMarginPercent: waterfall.netMarginPercent,
      marginErosion: (((waterfall.grossRevenue - cogsTotal) / waterfall.grossRevenue * 100) - parseFloat(waterfall.netMarginPercent)).toFixed(2)
    };

    return waterfall;
  }

  /**
   * Aggregate margins by store
   * @param {Array} transactions - Array of transactions
   * @returns {Object} - Store-level aggregates
   */
  aggregateByStore(transactions) {
    const stores = {};

    transactions.forEach((transaction) => {
      const storeId = transaction.storeId || 'default';

      if (!stores[storeId]) {
        stores[storeId] = {
          storeId,
          storeName: transaction.storeName || 'Main Store',
          totalRevenue: 0,
          totalCOGS: 0,
          totalMargin: 0,
          transactionCount: 0,
          productCategories: {}
        };
      }

      const waterfall = this.calculateFinancialWaterfall(transaction);

      stores[storeId].totalRevenue += waterfall.grossRevenue;
      stores[storeId].totalCOGS += waterfall.summary.cogs;
      stores[storeId].totalMargin += waterfall.netMargin;
      stores[storeId].transactionCount++;

      // Track by category
      const category = transaction.category || 'Uncategorized';
      if (!stores[storeId].productCategories[category]) {
        stores[storeId].productCategories[category] = {
          revenue: 0,
          margin: 0,
          count: 0
        };
      }

      stores[storeId].productCategories[category].revenue += waterfall.grossRevenue;
      stores[storeId].productCategories[category].margin += waterfall.netMargin;
      stores[storeId].productCategories[category].count++;
    });

    // Calculate percentages
    Object.values(stores).forEach((store) => {
      store.marginPercent = (store.totalMargin / store.totalRevenue * 100).toFixed(2);
      store.avgTransactionValue = (store.totalRevenue / store.transactionCount).toFixed(2);
    });

    return stores;
  }
}

module.exports = new NetMarginService();
