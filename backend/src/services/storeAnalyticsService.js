/**
 * Store Analytics Aggregation Service
 * Provides rollup analytics across Region → District → Store hierarchy
 */

const { Region, District, Store } = require('../models/StoreHierarchy');
const SalesHistory = require('../models/SalesHistory');
const Promotion = require('../models/Promotion');

class StoreAnalyticsService {
  /**
   * Get sales performance rollup by region
   */
  async getRegionPerformance(options) {
    const {
      regionId,
      startDate,
      endDate,
      tenantId
    } = options;

    const region = await Region.findOne({ _id: regionId, tenantId });
    if (!region) {
      throw new Error('Region not found');
    }

    // Get all districts in region
    const districts = await District.find({ region: regionId, tenantId, isActive: true });
    const districtIds = districts.map(d => d._id);

    // Get all stores in region
    const stores = await Store.find({ region: regionId, tenantId, isActive: true });
    const storeIds = stores.map(s => s._id);

    // Aggregate sales data
    const salesData = await SalesHistory.aggregate([
      {
        $match: {
          storeId: { $in: storeIds },
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
          tenantId: tenantId
        }
      },
      {
        $group: {
          _id: '$storeId',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$revenue' },
          averagePrice: { $avg: '$unitPrice' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    // Rollup to district level
    const districtPerformance = await Promise.all(districts.map(async (district) => {
      const districtStores = stores.filter(s => s.district.toString() === district._id.toString());
      const districtStoreIds = districtStores.map(s => s._id.toString());
      
      const districtSales = salesData.filter(s => districtStoreIds.includes(s._id.toString()));
      
      return {
        district: {
          _id: district._id,
          code: district.code,
          name: district.name
        },
        storeCount: districtStores.length,
        activeStores: districtStores.filter(s => s.isActive).length,
        totalQuantity: districtSales.reduce((sum, s) => sum + s.totalQuantity, 0),
        totalRevenue: districtSales.reduce((sum, s) => sum + s.totalRevenue, 0),
        averageRevenuePerStore: districtStores.length > 0 ?
          districtSales.reduce((sum, s) => sum + s.totalRevenue, 0) / districtStores.length : 0,
        transactionCount: districtSales.reduce((sum, s) => sum + s.transactionCount, 0)
      };
    }));

    // Region totals
    const regionTotals = {
      totalQuantity: salesData.reduce((sum, s) => sum + s.totalQuantity, 0),
      totalRevenue: salesData.reduce((sum, s) => sum + s.totalRevenue, 0),
      transactionCount: salesData.reduce((sum, s) => sum + s.transactionCount, 0),
      averageRevenuePerStore: stores.length > 0 ?
        salesData.reduce((sum, s) => sum + s.totalRevenue, 0) / stores.length : 0,
      averageRevenuePerDistrict: districts.length > 0 ?
        salesData.reduce((sum, s) => sum + s.totalRevenue, 0) / districts.length : 0
    };

    return {
      region: {
        _id: region._id,
        code: region.code,
        name: region.name
      },
      period: { start: startDate, end: endDate },
      summary: regionTotals,
      districtCount: districts.length,
      storeCount: stores.length,
      districtPerformance,
      topDistricts: districtPerformance
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5),
      bottomDistricts: districtPerformance
        .sort((a, b) => a.totalRevenue - b.totalRevenue)
        .slice(0, 5)
    };
  }

  /**
   * Get sales performance rollup by district
   */
  async getDistrictPerformance(options) {
    const {
      districtId,
      startDate,
      endDate,
      tenantId
    } = options;

    const district = await District.findOne({ _id: districtId, tenantId }).populate('region');
    if (!district) {
      throw new Error('District not found');
    }

    // Get all stores in district
    const stores = await Store.find({ district: districtId, tenantId, isActive: true });
    const storeIds = stores.map(s => s._id);

    // Aggregate sales data by store
    const salesData = await SalesHistory.aggregate([
      {
        $match: {
          storeId: { $in: storeIds },
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
          tenantId: tenantId
        }
      },
      {
        $group: {
          _id: '$storeId',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$revenue' },
          averagePrice: { $avg: '$unitPrice' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    // Store-level performance
    const storePerformance = stores.map(store => {
      const storeSales = salesData.find(s => s._id.toString() === store._id.toString());
      
      return {
        store: {
          _id: store._id,
          storeCode: store.storeCode,
          name: store.name,
          storeType: store.storeType
        },
        totalQuantity: storeSales?.totalQuantity || 0,
        totalRevenue: storeSales?.totalRevenue || 0,
        averagePrice: storeSales?.averagePrice || 0,
        transactionCount: storeSales?.transactionCount || 0,
        salesPerSquareMeter: store.squareMeters && storeSales ?
          storeSales.totalRevenue / store.squareMeters : 0
      };
    });

    // District totals
    const districtTotals = {
      totalQuantity: salesData.reduce((sum, s) => sum + s.totalQuantity, 0),
      totalRevenue: salesData.reduce((sum, s) => sum + s.totalRevenue, 0),
      transactionCount: salesData.reduce((sum, s) => sum + s.transactionCount, 0),
      averageRevenuePerStore: stores.length > 0 ?
        salesData.reduce((sum, s) => sum + s.totalRevenue, 0) / stores.length : 0
    };

    return {
      district: {
        _id: district._id,
        code: district.code,
        name: district.name
      },
      region: {
        _id: district.region._id,
        code: district.region.code,
        name: district.region.name
      },
      period: { start: startDate, end: endDate },
      summary: districtTotals,
      storeCount: stores.length,
      storePerformance,
      topStores: storePerformance
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5),
      bottomStores: storePerformance
        .sort((a, b) => a.totalRevenue - b.totalRevenue)
        .slice(0, 5)
    };
  }

  /**
   * Get individual store performance
   */
  async getStorePerformance(options) {
    const {
      storeId,
      startDate,
      endDate,
      tenantId
    } = options;

    const store = await Store.findOne({ _id: storeId, tenantId })
      .populate(['region', 'district']);
    
    if (!store) {
      throw new Error('Store not found');
    }

    // Get sales data
    const salesData = await SalesHistory.aggregate([
      {
        $match: {
          storeId: store._id,
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
          tenantId: tenantId
        }
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$revenue' },
          averagePrice: { $avg: '$unitPrice' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    // Daily sales trend
    const dailySales = await SalesHistory.aggregate([
      {
        $match: {
          storeId: store._id,
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
          tenantId: tenantId
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          quantity: { $sum: '$quantity' },
          revenue: { $sum: '$revenue' },
          transactions: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Category breakdown
    const categoryBreakdown = await SalesHistory.aggregate([
      {
        $match: {
          storeId: store._id,
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
          tenantId: tenantId
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $group: {
          _id: '$product.category',
          quantity: { $sum: '$quantity' },
          revenue: { $sum: '$revenue' }
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]);

    const summary = salesData[0] || {
      totalQuantity: 0,
      totalRevenue: 0,
      averagePrice: 0,
      transactionCount: 0
    };

    return {
      store: {
        _id: store._id,
        storeCode: store.storeCode,
        name: store.name,
        storeType: store.storeType,
        squareMeters: store.squareMeters
      },
      hierarchy: {
        region: {
          _id: store.region._id,
          code: store.region.code,
          name: store.region.name
        },
        district: {
          _id: store.district._id,
          code: store.district.code,
          name: store.district.name
        }
      },
      period: { start: startDate, end: endDate },
      summary: {
        ...summary,
        salesPerSquareMeter: store.squareMeters ?
          summary.totalRevenue / store.squareMeters : 0,
        averageTransactionValue: summary.transactionCount > 0 ?
          summary.totalRevenue / summary.transactionCount : 0
      },
      dailySales: dailySales.map(d => ({
        date: d._id,
        quantity: d.quantity,
        revenue: d.revenue,
        transactions: d.transactions,
        averageTransactionValue: d.transactions > 0 ? d.revenue / d.transactions : 0
      })),
      categoryBreakdown: categoryBreakdown.map(c => ({
        category: c._id,
        quantity: c.quantity,
        revenue: c.revenue,
        percentOfRevenue: summary.totalRevenue > 0 ?
          (c.revenue / summary.totalRevenue * 100) : 0
      }))
    };
  }

  /**
   * Compare store performance against district/region averages
   */
  async compareStorePerformance(options) {
    const {
      storeId,
      startDate,
      endDate,
      tenantId
    } = options;

    // Get store performance
    const storePerf = await this.getStorePerformance({
      storeId,
      startDate,
      endDate,
      tenantId
    });

    // Get district performance
    const districtPerf = await this.getDistrictPerformance({
      districtId: storePerf.hierarchy.district._id,
      startDate,
      endDate,
      tenantId
    });

    // Get region performance
    const regionPerf = await this.getRegionPerformance({
      regionId: storePerf.hierarchy.region._id,
      startDate,
      endDate,
      tenantId
    });

    // Calculate comparisons
    const storeRevenue = storePerf.summary.totalRevenue;
    const districtAvgRevenue = districtPerf.summary.averageRevenuePerStore;
    const regionAvgRevenue = regionPerf.summary.averageRevenuePerStore;

    return {
      store: storePerf.store,
      performance: storePerf.summary,
      comparison: {
        vsDistrict: {
          revenue: storeRevenue,
          districtAverage: districtAvgRevenue,
          difference: storeRevenue - districtAvgRevenue,
          percentDifference: districtAvgRevenue > 0 ?
            ((storeRevenue - districtAvgRevenue) / districtAvgRevenue * 100) : 0,
          ranking: districtPerf.storePerformance
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .findIndex(s => s.store._id.toString() === storeId) + 1,
          totalStores: districtPerf.storeCount
        },
        vsRegion: {
          revenue: storeRevenue,
          regionAverage: regionAvgRevenue,
          difference: storeRevenue - regionAvgRevenue,
          percentDifference: regionAvgRevenue > 0 ?
            ((storeRevenue - regionAvgRevenue) / regionAvgRevenue * 100) : 0
        }
      },
      interpretation: this.generatePerformanceInterpretation(
        storeRevenue,
        districtAvgRevenue,
        regionAvgRevenue
      )
    };
  }

  /**
   * Generate performance interpretation
   */
  generatePerformanceInterpretation(storeRevenue, districtAvg, regionAvg) {
    const vsDistrictPct = districtAvg > 0 ?
      ((storeRevenue - districtAvg) / districtAvg * 100) : 0;
    const vsRegionPct = regionAvg > 0 ?
      ((storeRevenue - regionAvg) / regionAvg * 100) : 0;

    let performance = '';
    let recommendation = '';

    if (vsDistrictPct > 20) {
      performance = 'EXCELLENT - Significantly outperforming district average';
      recommendation = 'This store is a top performer. Analyze best practices for replication.';
    } else if (vsDistrictPct > 10) {
      performance = 'GOOD - Above district average';
      recommendation = 'Store is performing well. Maintain current strategies.';
    } else if (vsDistrictPct > -10) {
      performance = 'AVERAGE - In line with district performance';
      recommendation = 'Monitor ongoing. Look for improvement opportunities.';
    } else if (vsDistrictPct > -20) {
      performance = 'BELOW AVERAGE - Underperforming district';
      recommendation = 'Investigate causes of underperformance. Implement improvement plan.';
    } else {
      performance = 'POOR - Significantly underperforming district';
      recommendation = 'URGENT: Immediate intervention required. Review operations, staffing, and local market conditions.';
    }

    return {
      performance,
      vsDistrict: `${vsDistrictPct > 0 ? '+' : ''}${vsDistrictPct.toFixed(1)}%`,
      vsRegion: `${vsRegionPct > 0 ? '+' : ''}${vsRegionPct.toFixed(1)}%`,
      recommendation
    };
  }

  /**
   * Analyze promotion performance across hierarchy
   */
  async analyzePromotionByHierarchy(options) {
    const {
      promotionId,
      tenantId
    } = options;

    const promotion = await Promotion.findOne({ _id: promotionId, tenantId });
    if (!promotion) {
      throw new Error('Promotion not found');
    }

    // Get all participating stores (from promotion or customer data)
    // This is a simplified version - actual implementation would depend on data structure
    const stores = await Store.find({
      tenantId,
      isActive: true
    }).populate(['region', 'district']);

    // Group stores by region and district
    const regionPerformance = {};
    const districtPerformance = {};

    for (const store of stores) {
      const regionKey = store.region._id.toString();
      const districtKey = store.district._id.toString();

      // Get sales for this store during promotion
      const storeSales = await SalesHistory.aggregate([
        {
          $match: {
            storeId: store._id,
            productId: { $in: promotion.products.map(p => p.product) },
            date: {
              $gte: promotion.startDate,
              $lte: promotion.endDate
            },
            tenantId
          }
        },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantity' },
            totalRevenue: { $sum: '$revenue' }
          }
        }
      ]);

      const storeData = storeSales[0] || { totalQuantity: 0, totalRevenue: 0 };

      // Aggregate to region level
      if (!regionPerformance[regionKey]) {
        regionPerformance[regionKey] = {
          region: store.region,
          totalQuantity: 0,
          totalRevenue: 0,
          storeCount: 0,
          districts: []
        };
      }
      regionPerformance[regionKey].totalQuantity += storeData.totalQuantity;
      regionPerformance[regionKey].totalRevenue += storeData.totalRevenue;
      regionPerformance[regionKey].storeCount += 1;

      // Aggregate to district level
      if (!districtPerformance[districtKey]) {
        districtPerformance[districtKey] = {
          district: store.district,
          region: store.region,
          totalQuantity: 0,
          totalRevenue: 0,
          storeCount: 0
        };
      }
      districtPerformance[districtKey].totalQuantity += storeData.totalQuantity;
      districtPerformance[districtKey].totalRevenue += storeData.totalRevenue;
      districtPerformance[districtKey].storeCount += 1;
    }

    return {
      promotion: {
        _id: promotion._id,
        name: promotion.name,
        period: {
          start: promotion.startDate,
          end: promotion.endDate
        }
      },
      regionPerformance: Object.values(regionPerformance)
        .sort((a, b) => b.totalRevenue - a.totalRevenue),
      districtPerformance: Object.values(districtPerformance)
        .sort((a, b) => b.totalRevenue - a.totalRevenue),
      topRegions: Object.values(regionPerformance)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 3),
      topDistricts: Object.values(districtPerformance)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5)
    };
  }
}

module.exports = new StoreAnalyticsService();
