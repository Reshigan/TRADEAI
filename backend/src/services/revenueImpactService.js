const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const HierarchyManager = require('../utils/hierarchyManager');
const logger = require('../utils/logger');

/**
 * Revenue Impact Service
 * Calculates net revenue impact using customer and product hierarchies
 * with proportional spend allocation
 */
class RevenueImpactService {
  constructor() {
    this.customerHierarchyManager = new HierarchyManager(Customer);
    this.productHierarchyManager = new HierarchyManager(Product);
  }

  /**
   * Calculate net revenue impact for a promotion using hierarchy-based allocation
   */
  async calculatePromotionImpact(tenantId, promotionData) {
    try {
      const {
        customers,
        products,
        discountPercentage,
        startDate,
        endDate,
        promotionType
      } = promotionData;

      const customerNodes = await this.expandCustomerHierarchy(tenantId, customers);
      
      const productNodes = await this.expandProductHierarchy(tenantId, products);

      const baselineRevenue = await this.calculateBaselineRevenue(
        tenantId,
        customerNodes,
        productNodes,
        startDate,
        endDate
      );

      const spendAllocation = this.calculateProportionalAllocation(
        baselineRevenue,
        discountPercentage
      );

      const upliftFactors = await this.calculateUpliftFactors(
        tenantId,
        customerNodes,
        productNodes,
        promotionType,
        discountPercentage
      );

      const netImpact = this.calculateNetRevenue(
        baselineRevenue,
        spendAllocation,
        upliftFactors
      );

      return {
        baselineRevenue: netImpact.baseline,
        promotionalRevenue: netImpact.promotional,
        incrementalRevenue: netImpact.incremental,
        totalSpend: netImpact.totalSpend,
        roi: netImpact.roi,
        breakdown: {
          byCustomer: netImpact.customerBreakdown,
          byProduct: netImpact.productBreakdown,
          byHierarchyLevel: netImpact.hierarchyBreakdown
        },
        confidence: netImpact.confidence,
        assumptions: netImpact.assumptions
      };

    } catch (error) {
      logger.error('Failed to calculate promotion impact', { error: error.message });
      throw error;
    }
  }

  /**
   * Expand customer hierarchy to include all descendants
   */
  async expandCustomerHierarchy(tenantId, customerIds) {
    const allCustomers = new Map();

    for (const customerId of customerIds) {
      const customer = await Customer.findOne({ _id: customerId, tenantId });
      if (!customer) continue;

      allCustomers.set(customerId.toString(), customer);

      const descendants = await this.customerHierarchyManager.getDescendants(
        tenantId,
        customerId
      );

      for (const descendant of descendants) {
        allCustomers.set(descendant._id.toString(), descendant);
      }
    }

    return Array.from(allCustomers.values());
  }

  /**
   * Expand product hierarchy to include all descendants
   */
  async expandProductHierarchy(tenantId, productIds) {
    const allProducts = new Map();

    for (const productId of productIds) {
      const product = await Product.findOne({ _id: productId, tenantId });
      if (!product) continue;

      allProducts.set(productId.toString(), product);

      const descendants = await this.productHierarchyManager.getDescendants(
        tenantId,
        productId
      );

      for (const descendant of descendants) {
        allProducts.set(descendant._id.toString(), descendant);
      }
    }

    return Array.from(allProducts.values());
  }

  /**
   * Calculate baseline revenue for customer-product combinations
   */
  async calculateBaselineRevenue(tenantId, customers, products, startDate, endDate) {
    const baseline = {
      total: 0,
      byCustomer: new Map(),
      byProduct: new Map(),
      byCustomerProduct: new Map()
    };

    const periodDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const periodWeeks = Math.max(1, periodDays / 7);

    for (const customer of customers) {
      const customerRevenue = {
        total: 0,
        products: new Map()
      };

      for (const product of products) {
        const weeklyRevenue = this.estimateWeeklyRevenue(customer, product);
        const periodRevenue = weeklyRevenue * periodWeeks;

        customerRevenue.total += periodRevenue;
        customerRevenue.products.set(product._id.toString(), periodRevenue);

        const productTotal = baseline.byProduct.get(product._id.toString()) || 0;
        baseline.byProduct.set(product._id.toString(), productTotal + periodRevenue);

        const key = `${customer._id}_${product._id}`;
        baseline.byCustomerProduct.set(key, periodRevenue);

        baseline.total += periodRevenue;
      }

      baseline.byCustomer.set(customer._id.toString(), customerRevenue);
    }

    return baseline;
  }

  /**
   * Estimate weekly revenue based on historical performance
   */
  estimateWeeklyRevenue(customer, product) {
    const customerSales = customer.performance?.lastYearSales || 0;
    
    const productPrice = product.pricing?.listPrice || 0;
    const productVolume = product.performance?.lastYearSales?.units || 0;

    if (productVolume > 0 && productPrice > 0) {
      return (productVolume * productPrice) / 52; // Weekly average
    }

    const estimatedWeeklyUnits = Math.max(10, customerSales / 52 / 100);
    return estimatedWeeklyUnits * productPrice;
  }

  /**
   * Calculate proportional spend allocation across hierarchy
   */
  calculateProportionalAllocation(baselineRevenue, discountPercentage) {
    const allocation = {
      total: 0,
      byCustomer: new Map(),
      byProduct: new Map(),
      byCustomerProduct: new Map()
    };

    for (const [customerId, customerData] of baselineRevenue.byCustomer) {
      const customerAllocation = {
        total: 0,
        products: new Map()
      };

      for (const [productId, revenue] of customerData.products) {
        const spend = revenue * (discountPercentage / 100);
        
        customerAllocation.total += spend;
        customerAllocation.products.set(productId, spend);

        const productTotal = allocation.byProduct.get(productId) || 0;
        allocation.byProduct.set(productId, productTotal + spend);

        const key = `${customerId}_${productId}`;
        allocation.byCustomerProduct.set(key, spend);

        allocation.total += spend;
      }

      allocation.byCustomer.set(customerId, customerAllocation);
    }

    return allocation;
  }

  /**
   * Calculate uplift factors based on historical promotion performance
   */
  async calculateUpliftFactors(tenantId, customers, products, promotionType, discountPercentage) {
    const factors = {
      average: 1.2, // Default 20% uplift
      byCustomer: new Map(),
      byProduct: new Map(),
      confidence: 0.7
    };

    const historicalPromotions = await Promotion.find({
      tenantId,
      promotionType,
      status: 'completed',
      'aiPredictions.actualUplift.volume': { $exists: true }
    }).limit(50);

    if (historicalPromotions.length > 0) {
      const uplifts = historicalPromotions
        .map(p => {
          const baseline = p.financial?.planned?.baselineVolume || 0;
          const actual = p.financial?.actual?.promotionalVolume || 0;
          return baseline > 0 ? actual / baseline : 1;
        })
        .filter(u => u > 0 && u < 5); // Filter outliers

      if (uplifts.length > 0) {
        factors.average = uplifts.reduce((sum, u) => sum + u, 0) / uplifts.length;
        factors.confidence = Math.min(0.95, 0.5 + (uplifts.length / 100));
      }
    }

    const discountFactor = 1 + (discountPercentage / 100) * 2; // Higher discount = higher uplift
    factors.average = Math.min(3.0, factors.average * discountFactor);

    for (const customer of customers) {
      const responsiveness = customer.aiInsights?.promotionResponsiveness?.score || 1.0;
      factors.byCustomer.set(customer._id.toString(), factors.average * responsiveness);
    }

    for (const product of products) {
      const marginFactor = product.pricing?.marginPercentage 
        ? 1 + (product.pricing.marginPercentage / 100)
        : 1.0;
      factors.byProduct.set(product._id.toString(), factors.average * marginFactor);
    }

    return factors;
  }

  /**
   * Calculate net revenue impact
   */
  calculateNetRevenue(baselineRevenue, spendAllocation, upliftFactors) {
    const result = {
      baseline: baselineRevenue.total,
      promotional: 0,
      incremental: 0,
      totalSpend: spendAllocation.total,
      roi: 0,
      customerBreakdown: [],
      productBreakdown: [],
      hierarchyBreakdown: [],
      confidence: upliftFactors.confidence,
      assumptions: []
    };

    for (const [customerId, customerData] of baselineRevenue.byCustomer) {
      const customerUplift = upliftFactors.byCustomer.get(customerId) || upliftFactors.average;
      const customerBaseline = customerData.total;
      const customerPromotional = customerBaseline * customerUplift;
      const customerIncremental = customerPromotional - customerBaseline;
      const customerSpend = spendAllocation.byCustomer.get(customerId)?.total || 0;
      const customerROI = customerSpend > 0 
        ? ((customerIncremental - customerSpend) / customerSpend) * 100 
        : 0;

      result.promotional += customerPromotional;
      result.incremental += customerIncremental;

      result.customerBreakdown.push({
        customerId,
        baseline: customerBaseline,
        promotional: customerPromotional,
        incremental: customerIncremental,
        spend: customerSpend,
        roi: customerROI,
        upliftFactor: customerUplift
      });
    }

    for (const [productId, productBaseline] of baselineRevenue.byProduct) {
      const productUplift = upliftFactors.byProduct.get(productId) || upliftFactors.average;
      const productPromotional = productBaseline * productUplift;
      const productIncremental = productPromotional - productBaseline;
      const productSpend = spendAllocation.byProduct.get(productId) || 0;
      const productROI = productSpend > 0 
        ? ((productIncremental - productSpend) / productSpend) * 100 
        : 0;

      result.productBreakdown.push({
        productId,
        baseline: productBaseline,
        promotional: productPromotional,
        incremental: productIncremental,
        spend: productSpend,
        roi: productROI,
        upliftFactor: productUplift
      });
    }

    result.roi = result.totalSpend > 0 
      ? ((result.incremental - result.totalSpend) / result.totalSpend) * 100 
      : 0;

    result.assumptions = [
      `Average uplift factor: ${upliftFactors.average.toFixed(2)}x`,
      `Confidence level: ${(upliftFactors.confidence * 100).toFixed(0)}%`,
      `Based on ${baselineRevenue.byCustomer.size} customers and ${baselineRevenue.byProduct.size} products`,
      'Calculations use proportional allocation across hierarchy levels'
    ];

    return result;
  }

  /**
   * Analyze customer segmentation using hierarchy and RFM
   */
  async segmentCustomers(tenantId, method = 'rfm', rootCustomerId = null) {
    try {
      let customers;

      if (rootCustomerId) {
        const descendants = await this.customerHierarchyManager.getDescendants(
          tenantId,
          rootCustomerId
        );
        customers = descendants;
      } else {
        customers = await Customer.find({ tenantId, status: 'active' });
      }

      if (method === 'rfm') {
        return this.performRFMSegmentation(customers);
      } else if (method === 'hierarchy') {
        return this.performHierarchySegmentation(tenantId, customers);
      } else if (method === 'value') {
        return this.performValueSegmentation(customers);
      }

      throw new Error(`Unknown segmentation method: ${method}`);

    } catch (error) {
      logger.error('Customer segmentation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Perform RFM (Recency, Frequency, Monetary) segmentation
   */
  performRFMSegmentation(customers) {
    const segments = {
      Champions: [],
      Loyal: [],
      'Potential Loyalists': [],
      'At Risk': [],
      'Need Attention': [],
      Lost: [],
      New: []
    };

    for (const customer of customers) {
      const rfm = customer.aiInsights?.segment?.rfm;
      const segment = customer.aiInsights?.segment?.current || 'New';

      if (segments[segment]) {
        segments[segment].push({
          customerId: customer._id,
          name: customer.name,
          rfmScore: rfm?.score || 0,
          recency: rfm?.recency || 0,
          frequency: rfm?.frequency || 0,
          monetary: rfm?.monetary || 0,
          revenue: customer.performance?.currentYearActual || 0
        });
      }
    }

    const segmentStats = Object.keys(segments).map(segmentName => ({
      name: segmentName,
      count: segments[segmentName].length,
      percentage: (segments[segmentName].length / customers.length) * 100,
      avgRevenue: segments[segmentName].length > 0
        ? segments[segmentName].reduce((sum, c) => sum + c.revenue, 0) / segments[segmentName].length
        : 0,
      totalRevenue: segments[segmentName].reduce((sum, c) => sum + c.revenue, 0)
    }));

    return {
      method: 'rfm',
      segments: segmentStats,
      details: segments,
      totalCustomers: customers.length
    };
  }

  /**
   * Perform hierarchy-based segmentation
   */
  async performHierarchySegmentation(tenantId, customers) {
    const segments = new Map();

    for (const customer of customers) {
      const hierarchyLevel = customer.level || 0;
      const levelKey = `Level ${hierarchyLevel}`;

      if (!segments.has(levelKey)) {
        segments.set(levelKey, []);
      }

      segments.get(levelKey).push({
        customerId: customer._id,
        name: customer.name,
        level: hierarchyLevel,
        path: customer.path,
        revenue: customer.performance?.currentYearActual || 0,
        hasChildren: customer.hasChildren
      });
    }

    const segmentStats = Array.from(segments.entries()).map(([level, customers]) => ({
      name: level,
      count: customers.length,
      percentage: (customers.length / customers.length) * 100,
      avgRevenue: customers.reduce((sum, c) => sum + c.revenue, 0) / customers.length,
      totalRevenue: customers.reduce((sum, c) => sum + c.revenue, 0)
    }));

    return {
      method: 'hierarchy',
      segments: segmentStats,
      details: Object.fromEntries(segments),
      totalCustomers: customers.length
    };
  }

  /**
   * Perform value-based segmentation (ABC analysis)
   */
  performValueSegmentation(customers) {
    const sortedCustomers = customers
      .map(c => ({
        customerId: c._id,
        name: c.name,
        revenue: c.performance?.currentYearActual || 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = sortedCustomers.reduce((sum, c) => sum + c.revenue, 0);
    
    const segments = {
      'A - High Value': [],
      'B - Medium Value': [],
      'C - Low Value': []
    };

    let cumulativeRevenue = 0;
    
    for (const customer of sortedCustomers) {
      cumulativeRevenue += customer.revenue;
      const cumulativePercentage = (cumulativeRevenue / totalRevenue) * 100;

      if (cumulativePercentage <= 80) {
        segments['A - High Value'].push(customer);
      } else if (cumulativePercentage <= 95) {
        segments['B - Medium Value'].push(customer);
      } else {
        segments['C - Low Value'].push(customer);
      }
    }

    const segmentStats = Object.keys(segments).map(segmentName => ({
      name: segmentName,
      count: segments[segmentName].length,
      percentage: (segments[segmentName].length / customers.length) * 100,
      avgRevenue: segments[segmentName].length > 0
        ? segments[segmentName].reduce((sum, c) => sum + c.revenue, 0) / segments[segmentName].length
        : 0,
      totalRevenue: segments[segmentName].reduce((sum, c) => sum + c.revenue, 0),
      revenuePercentage: (segments[segmentName].reduce((sum, c) => sum + c.revenue, 0) / totalRevenue) * 100
    }));

    return {
      method: 'value',
      segments: segmentStats,
      details: segments,
      totalCustomers: customers.length,
      totalRevenue
    };
  }

  /**
   * Recommend products for a customer based on hierarchy and performance
   */
  async recommendProducts(tenantId, customerId, options = {}) {
    try {
      const { limit = 10, excludeCurrentProducts = true } = options;

      const customer = await Customer.findOne({ _id: customerId, tenantId });
      if (!customer) {
        throw new Error('Customer not found');
      }

      const currentProductIds = new Set(); // Would be populated from order history

      const allProducts = await Product.find({ 
        tenantId, 
        status: 'active',
        'promotionSettings.isPromotable': true
      });

      const scoredProducts = allProducts.map(product => {
        let score = 0;

        if (customer.tier === 'platinum' && product.pricing?.listPrice > 100) {
          score += 30;
        }

        if (customer.channel === 'modern_trade' && product.productType === 'own_brand') {
          score += 25;
        }

        const productPerformance = product.performance?.currentYearActual?.value || 0;
        score += Math.min(20, productPerformance / 10000);

        const margin = product.pricing?.marginPercentage || 0;
        score += Math.min(15, margin / 2);

        const customerResponsiveness = customer.aiInsights?.promotionResponsiveness?.score || 1.0;
        score += customerResponsiveness * 10;

        return {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          price: product.pricing?.listPrice || 0,
          margin: margin,
          score: score,
          category: product.category?.primary || 'Unknown',
          brand: product.brand?.name || 'Unknown'
        };
      });

      const filteredProducts = excludeCurrentProducts
        ? scoredProducts.filter(p => !currentProductIds.has(p.productId.toString()))
        : scoredProducts;

      const recommendations = filteredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return {
        customerId,
        customerName: customer.name,
        recommendations,
        totalEvaluated: allProducts.length,
        confidence: 0.75
      };

    } catch (error) {
      logger.error('Product recommendation failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = new RevenueImpactService();
