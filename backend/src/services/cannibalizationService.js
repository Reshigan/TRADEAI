/**
 * Cannibalization Analysis Service
 * Detects when promotions on one product impact sales of related products
 */

const SalesHistory = require('../models/SalesHistory');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const baselineService = require('./baselineService');

class CannibalizationService {
  /**
   * Analyze cannibalization impact of a promotion
   * Identifies which products lost sales during the promotion period
   */
  async analyzePromotion(options) {
    const {
      _promotionId,
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate,
      tenantId
    } = options;

    // Get promoted product details
    const promotedProduct = await Product.findById(productId);
    if (!promotedProduct) {
      throw new Error('Promoted product not found');
    }

    // Find related products (same category, same customer)
    const relatedProducts = await this.findRelatedProducts(
      promotedProduct,
      customerId,
      tenantId
    );

    // Analyze impact on each related product
    const cannibalizationResults = [];

    for (const relatedProduct of relatedProducts) {
      // Skip the promoted product itself
      if (relatedProduct._id.toString() === productId) continue;

      // Calculate baseline for related product
      const baselineResult = await baselineService.calculateBaseline({
        productId: relatedProduct._id,
        customerId,
        promotionStartDate: new Date(promotionStartDate),
        promotionEndDate: new Date(promotionEndDate),
        tenantId
      });

      // Get actual sales for related product during promotion
      const actualSales = await SalesHistory.find({
        productId: relatedProduct._id,
        customerId,
        date: {
          $gte: promotionStartDate,
          $lte: promotionEndDate
        },
        tenantId
      });

      // Calculate cannibalization
      const baseline = baselineResult.recommended.baseline;
      const totalBaseline = baseline.reduce((sum, b) => sum + b.baselineQuantity, 0);
      const totalActual = actualSales.reduce((sum, s) => sum + s.quantity, 0);
      const cannibalizedVolume = totalBaseline - totalActual;
      const cannibalizationRate = totalBaseline > 0 ?
        (cannibalizedVolume / totalBaseline * 100) : 0;

      // Only include if significant cannibalization detected (>10% decline)
      if (cannibalizationRate > 10) {
        cannibalizationResults.push({
          product: {
            _id: relatedProduct._id,
            name: relatedProduct.name,
            sku: relatedProduct.sku,
            category: relatedProduct.category
          },
          baseline: totalBaseline,
          actual: totalActual,
          cannibalizedVolume,
          cannibalizationRate,
          revenueImpact: cannibalizedVolume * (relatedProduct.price || 0),
          relationship: this.determineRelationship(promotedProduct, relatedProduct)
        });
      }
    }

    // Sort by cannibalization rate (highest first)
    cannibalizationResults.sort((a, b) => b.cannibalizationRate - a.cannibalizationRate);

    // Calculate total impact
    const totalCannibalizedVolume = cannibalizationResults.reduce(
      (sum, r) => sum + r.cannibalizedVolume, 0
    );
    const totalRevenueImpact = cannibalizationResults.reduce(
      (sum, r) => sum + r.revenueImpact, 0
    );

    return {
      promotedProduct: {
        _id: promotedProduct._id,
        name: promotedProduct.name,
        sku: promotedProduct.sku
      },
      promotionPeriod: {
        start: promotionStartDate,
        end: promotionEndDate
      },
      affectedProducts: cannibalizationResults,
      summary: {
        totalAffectedProducts: cannibalizationResults.length,
        totalCannibalizedVolume,
        totalRevenueImpact,
        averageCannibalizationRate: cannibalizationResults.length > 0 ?
          cannibalizationResults.reduce((sum, r) => sum + r.cannibalizationRate, 0) /
          cannibalizationResults.length : 0
      }
    };
  }

  /**
   * Find products related to the promoted product
   */
  async findRelatedProducts(promotedProduct, customerId, tenantId) {
    // Find products in same category and subcategory
    const relatedProducts = await Product.find({
      $or: [
        { category: promotedProduct.category },
        { subcategory: promotedProduct.subcategory },
        { brand: promotedProduct.brand }
      ],
      tenantId,
      isDeleted: false
    }).limit(50);

    // Filter products that have sales history with this customer
    const productsWithSales = [];

    for (const product of relatedProducts) {
      const hasSales = await SalesHistory.exists({
        productId: product._id,
        customerId,
        tenantId
      });

      if (hasSales) {
        productsWithSales.push(product);
      }
    }

    return productsWithSales;
  }

  /**
   * Determine relationship type between products
   */
  determineRelationship(promotedProduct, relatedProduct) {
    if (promotedProduct.category === relatedProduct.category) {
      if (promotedProduct.subcategory === relatedProduct.subcategory) {
        if (promotedProduct.brand === relatedProduct.brand) {
          return 'same_brand_same_category';
        }
        return 'different_brand_same_category';
      }
      return 'same_category_different_subcategory';
    }
    if (promotedProduct.brand === relatedProduct.brand) {
      return 'same_brand_different_category';
    }
    return 'unrelated';
  }

  /**
   * Calculate substitution matrix
   * Shows which products are commonly substituted for each other
   */
  async calculateSubstitutionMatrix(options) {
    const {
      categoryId,
      customerId,
      startDate,
      endDate,
      tenantId
    } = options;

    // Get all products in category
    const products = await Product.find({
      category: categoryId,
      tenantId,
      isDeleted: false
    });

    // Get all promotions in this period
    const promotions = await Promotion.find({
      'products.product': { $in: products.map((p) => p._id) },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      tenantId
    });

    const substitutionMatrix = [];

    // Analyze each promotion
    for (const promotion of promotions) {
      for (const promoProduct of promotion.products) {
        const cannibalization = await this.analyzePromotion({
          promotionId: promotion._id,
          productId: promoProduct.product,
          customerId,
          promotionStartDate: promotion.startDate,
          promotionEndDate: promotion.endDate,
          tenantId
        });

        // Add to matrix
        for (const affected of cannibalization.affectedProducts) {
          substitutionMatrix.push({
            fromProduct: cannibalization.promotedProduct,
            toProduct: affected.product,
            cannibalizationRate: affected.cannibalizationRate,
            volume: affected.cannibalizedVolume,
            revenueImpact: affected.revenueImpact,
            promotionDate: promotion.startDate
          });
        }
      }
    }

    return {
      category: categoryId,
      period: { start: startDate, end: endDate },
      substitutionMatrix,
      summary: {
        totalAnalyzedPromotions: promotions.length,
        totalSubstitutionPairs: substitutionMatrix.length
      }
    };
  }

  /**
   * Analyze category-level cannibalization
   * How promotion in one category affects another category
   */
  async analyzeCategoryImpact(options) {
    const {
      promotedCategory,
      customerId,
      promotionStartDate,
      promotionEndDate,
      tenantId
    } = options;

    // Get all categories
    const allCategories = await Product.distinct('category', {
      tenantId,
      isDeleted: false
    });

    const categoryImpacts = [];

    for (const category of allCategories) {
      // Skip the promoted category
      if (category === promotedCategory) continue;

      // Get products in this category
      const categoryProducts = await Product.find({
        category,
        tenantId,
        isDeleted: false
      });

      let totalBaseline = 0;
      let totalActual = 0;

      // Aggregate sales for all products in category
      for (const product of categoryProducts) {
        try {
          const baselineResult = await baselineService.calculateBaseline({
            productId: product._id,
            customerId,
            promotionStartDate: new Date(promotionStartDate),
            promotionEndDate: new Date(promotionEndDate),
            tenantId
          });

          const baseline = baselineResult.recommended.baseline;
          totalBaseline += baseline.reduce((sum, b) => sum + b.baselineQuantity, 0);

          const actualSales = await SalesHistory.find({
            productId: product._id,
            customerId,
            date: {
              $gte: promotionStartDate,
              $lte: promotionEndDate
            },
            tenantId
          });

          totalActual += actualSales.reduce((sum, s) => sum + s.quantity, 0);
        } catch (error) {
          // Skip products with insufficient data
          continue;
        }
      }

      const impact = totalBaseline - totalActual;
      const impactRate = totalBaseline > 0 ? (impact / totalBaseline * 100) : 0;

      if (Math.abs(impactRate) > 5) {
        categoryImpacts.push({
          category,
          baseline: totalBaseline,
          actual: totalActual,
          impact,
          impactRate,
          type: impactRate > 0 ? 'cannibalization' : 'halo_effect'
        });
      }
    }

    return {
      promotedCategory,
      period: { start: promotionStartDate, end: promotionEndDate },
      categoryImpacts,
      summary: {
        affectedCategories: categoryImpacts.length,
        totalCannibalization: categoryImpacts
          .filter((c) => c.type === 'cannibalization')
          .reduce((sum, c) => sum + c.impact, 0),
        totalHaloEffect: categoryImpacts
          .filter((c) => c.type === 'halo_effect')
          .reduce((sum, c) => sum + Math.abs(c.impact), 0)
      }
    };
  }

  /**
   * Calculate net incremental volume
   * Promoted product lift minus cannibalized volume
   */
  async calculateNetIncremental(options) {
    const {
      promotionId,
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate,
      tenantId
    } = options;

    // Get incremental volume for promoted product
    const incrementalResult = await baselineService.calculateIncrementalVolume({
      productId,
      customerId,
      promotionStartDate: new Date(promotionStartDate),
      promotionEndDate: new Date(promotionEndDate),
      tenantId
    });

    // Get cannibalization impact
    const cannibalization = await this.analyzePromotion({
      promotionId,
      productId,
      customerId,
      promotionStartDate,
      promotionEndDate,
      tenantId
    });

    const grossIncremental = incrementalResult.summary.totalIncrementalQuantity;
    const cannibalizedVolume = cannibalization.summary.totalCannibalizedVolume;
    const netIncremental = grossIncremental - cannibalizedVolume;

    const grossRevenueImpact = incrementalResult.summary.totalIncrementalRevenue;
    const cannibalizedRevenue = cannibalization.summary.totalRevenueImpact;
    const netRevenueImpact = grossRevenueImpact - cannibalizedRevenue;

    return {
      promotion: {
        id: promotionId,
        productId,
        period: { start: promotionStartDate, end: promotionEndDate }
      },
      volumeAnalysis: {
        grossIncremental,
        cannibalizedVolume,
        netIncremental,
        cannibalizationRate: grossIncremental > 0 ?
          (cannibalizedVolume / grossIncremental * 100) : 0
      },
      revenueAnalysis: {
        grossRevenueImpact,
        cannibalizedRevenue,
        netRevenueImpact,
        netMarginImpact: netRevenueImpact * 0.3 // Assume 30% margin
      },
      affectedProducts: cannibalization.affectedProducts
    };
  }

  /**
   * Predict cannibalization for planned promotion
   * Uses historical patterns to estimate impact
   */
  async predictCannibalization(options) {
    const {
      productId,
      customerId,
      plannedStartDate,
      plannedEndDate,
      tenantId
    } = options;

    // Find historical promotions for this product
    const _product = await Product.findById(productId);
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

    // Analyze cannibalization from historical promotions
    const historicalCannibalization = [];

    for (const promo of historicalPromotions) {
      const analysis = await this.analyzePromotion({
        promotionId: promo._id,
        productId,
        customerId,
        promotionStartDate: promo.startDate,
        promotionEndDate: promo.endDate,
        tenantId
      });
      historicalCannibalization.push(analysis);
    }

    // Calculate average cannibalization rate
    const avgCannibalizationRate = historicalCannibalization.reduce(
      (sum, h) => sum + h.summary.averageCannibalizationRate, 0
    ) / historicalCannibalization.length;

    const avgRevenueImpact = historicalCannibalization.reduce(
      (sum, h) => sum + h.summary.totalRevenueImpact, 0
    ) / historicalCannibalization.length;

    // Identify commonly affected products
    const affectedProductCounts = {};
    historicalCannibalization.forEach((h) => {
      h.affectedProducts.forEach((ap) => {
        const key = ap.product._id.toString();
        if (!affectedProductCounts[key]) {
          affectedProductCounts[key] = {
            product: ap.product,
            count: 0,
            totalImpact: 0
          };
        }
        affectedProductCounts[key].count++;
        affectedProductCounts[key].totalImpact += ap.cannibalizedVolume;
      });
    });

    const likelyAffectedProducts = Object.values(affectedProductCounts)
      .filter((p) => p.count >= historicalPromotions.length * 0.5)
      .map((p) => ({
        ...p.product,
        frequency: p.count / historicalPromotions.length,
        avgImpact: p.totalImpact / p.count
      }));

    return {
      prediction: 'success',
      plannedPromotion: {
        productId,
        startDate: plannedStartDate,
        endDate: plannedEndDate
      },
      predictedImpact: {
        expectedCannibalizationRate: avgCannibalizationRate,
        expectedRevenueImpact: avgRevenueImpact,
        confidence: historicalPromotions.length >= 3 ? 'high' : 'medium'
      },
      likelyAffectedProducts,
      historicalPromotions: historicalPromotions.map((p) => ({
        id: p._id,
        startDate: p.startDate,
        endDate: p.endDate,
        cannibalizationRate: historicalCannibalization.find(
          (h) => h.promotionPeriod.start.getTime() === p.startDate.getTime()
        )?.summary.averageCannibalizationRate || 0
      }))
    };
  }
}

module.exports = new CannibalizationService();
