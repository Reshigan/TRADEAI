const mongoose = require('mongoose');

/**
 * Query Optimization Utilities for Multi-tenant Performance
 * Provides optimized query patterns and performance monitoring
 */

class QueryOptimizer {
  constructor() {
    this.queryStats = new Map();
    this.slowQueryThreshold = 100; // milliseconds
  }

  /**
   * Execute query with performance monitoring
   */
  async executeWithMonitoring(query, description = 'Unknown query') {
    const startTime = Date.now();
    
    try {
      const result = await query;
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        console.warn(`Slow query detected: ${description} took ${duration}ms`);
      }
      
      // Update statistics
      this.updateQueryStats(description, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Query failed: ${description} after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Update query statistics
   */
  updateQueryStats(description, duration) {
    if (!this.queryStats.has(description)) {
      this.queryStats.set(description, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity
      });
    }
    
    const stats = this.queryStats.get(description);
    stats.count++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.count;
    stats.maxTime = Math.max(stats.maxTime, duration);
    stats.minTime = Math.min(stats.minTime, duration);
  }

  /**
   * Get query statistics
   */
  getQueryStats() {
    const stats = {};
    for (const [description, data] of this.queryStats) {
      stats[description] = { ...data };
    }
    return stats;
  }

  /**
   * Optimized tenant-aware find operations
   */
  static createOptimizedQueries(Model) {
    return {
      /**
       * Find documents by tenant with optimized projection
       */
      findByTenant: async (tenantId, filter = {}, options = {}) => {
        const query = Model.find({ tenantId, ...filter });
        
        // Apply projection if specified
        if (options.select) {
          query.select(options.select);
        }
        
        // Apply sorting with index-friendly patterns
        if (options.sort) {
          query.sort(options.sort);
        } else {
          // Default sort by creation date (indexed)
          query.sort({ createdAt: -1 });
        }
        
        // Apply pagination
        if (options.limit) {
          query.limit(options.limit);
        }
        
        if (options.skip) {
          query.skip(options.skip);
        }
        
        // Use lean for read-only operations
        if (options.lean !== false) {
          query.lean();
        }
        
        return query;
      },

      /**
       * Count documents by tenant with optimized query
       */
      countByTenant: async (tenantId, filter = {}) => {
        return Model.countDocuments({ tenantId, ...filter });
      },

      /**
       * Aggregate with tenant filtering
       */
      aggregateByTenant: async (tenantId, pipeline = []) => {
        // Prepend tenant match stage
        const optimizedPipeline = [
          { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
          ...pipeline
        ];
        
        return Model.aggregate(optimizedPipeline);
      },

      /**
       * Bulk operations optimized for tenant
       */
      bulkWriteByTenant: async (tenantId, operations) => {
        // Add tenant filter to all operations
        const tenantOperations = operations.map(op => {
          if (op.insertOne) {
            op.insertOne.document.tenantId = tenantId;
          } else if (op.updateOne || op.updateMany) {
            const updateOp = op.updateOne || op.updateMany;
            updateOp.filter.tenantId = tenantId;
          } else if (op.deleteOne || op.deleteMany) {
            const deleteOp = op.deleteOne || op.deleteMany;
            deleteOp.filter.tenantId = tenantId;
          }
          return op;
        });
        
        return Model.bulkWrite(tenantOperations, { ordered: false });
      },

      /**
       * Find with text search optimized for tenant
       */
      searchByTenant: async (tenantId, searchText, options = {}) => {
        const query = Model.find({
          tenantId,
          $text: { $search: searchText }
        });
        
        // Add text score for sorting
        query.select({ score: { $meta: 'textScore' } });
        query.sort({ score: { $meta: 'textScore' } });
        
        if (options.limit) {
          query.limit(options.limit);
        }
        
        return query;
      },

      /**
       * Find documents within date range (optimized for time-series data)
       */
      findByTenantAndDateRange: async (tenantId, startDate, endDate, options = {}) => {
        const query = Model.find({
          tenantId,
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        });
        
        // Sort by date (uses index)
        query.sort({ createdAt: options.sortOrder === 'asc' ? 1 : -1 });
        
        if (options.select) {
          query.select(options.select);
        }
        
        if (options.limit) {
          query.limit(options.limit);
        }
        
        return query.lean();
      }
    };
  }

  /**
   * Create optimized aggregation pipelines
   */
  static createAggregationPipelines() {
    return {
      /**
       * Tenant summary statistics
       */
      tenantSummary: (tenantId) => [
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
        {
          $group: {
            _id: null,
            totalDocuments: { $sum: 1 },
            oldestDocument: { $min: '$createdAt' },
            newestDocument: { $max: '$createdAt' },
            avgCreatedPerDay: {
              $avg: {
                $divide: [
                  { $subtract: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                  1000 * 60 * 60 * 24
                ]
              }
            }
          }
        }
      ],

      /**
       * Time-based aggregation (daily, weekly, monthly)
       */
      timeBasedAggregation: (tenantId, dateField = 'createdAt', groupBy = 'day') => {
        const dateFormat = {
          day: '%Y-%m-%d',
          week: '%Y-%U',
          month: '%Y-%m',
          year: '%Y'
        };

        return [
          { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: dateFormat[groupBy],
                  date: `$${dateField}`
                }
              },
              count: { $sum: 1 },
              documents: { $push: '$$ROOT' }
            }
          },
          { $sort: { _id: 1 } }
        ];
      },

      /**
       * Top N aggregation with tenant filtering
       */
      topNByTenant: (tenantId, groupField, limit = 10) => [
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
        {
          $group: {
            _id: `$${groupField}`,
            count: { $sum: 1 },
            documents: { $push: '$$ROOT' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ],

      /**
       * Performance metrics aggregation
       */
      performanceMetrics: (tenantId, startDate, endDate) => [
        {
          $match: {
            tenantId: new mongoose.Types.ObjectId(tenantId),
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            dailyCount: { $sum: 1 },
            avgValue: { $avg: '$value' },
            maxValue: { $max: '$value' },
            minValue: { $min: '$value' }
          }
        },
        { $sort: { _id: 1 } }
      ]
    };
  }

  /**
   * Query optimization recommendations
   */
  static getOptimizationRecommendations() {
    return {
      indexing: [
        'Always include tenantId as the first field in compound indexes',
        'Create indexes for frequently queried fields after tenantId',
        'Use sparse indexes for optional fields',
        'Consider partial indexes for filtered queries'
      ],
      
      querying: [
        'Always filter by tenantId first in queries',
        'Use projection to limit returned fields',
        'Use lean() for read-only operations',
        'Implement pagination for large result sets',
        'Use aggregation pipelines for complex operations'
      ],
      
      performance: [
        'Monitor slow queries (>100ms)',
        'Use explain() to analyze query execution',
        'Implement query result caching where appropriate',
        'Consider read replicas for heavy read workloads',
        'Use bulk operations for multiple document updates'
      ]
    };
  }

  /**
   * Create performance monitoring middleware
   */
  static createPerformanceMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Override res.json to capture response time
      const originalJson = res.json;
      res.json = function(data) {
        const duration = Date.now() - startTime;
        
        // Add performance headers
        res.set('X-Response-Time', `${duration}ms`);
        
        // Log slow requests
        if (duration > 1000) { // 1 second threshold
          console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
        }
        
        return originalJson.call(this, data);
      };
      
      next();
    };
  }

  /**
   * Database connection optimization
   */
  static optimizeConnection() {
    // Set optimal connection pool settings
    const connectionOptions = {
      maxPoolSize: 10, // Maximum number of connections
      minPoolSize: 2,  // Minimum number of connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long to wait for a response
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    };
    
    return connectionOptions;
  }
}

// Global query optimizer instance
const queryOptimizer = new QueryOptimizer();

module.exports = {
  QueryOptimizer,
  queryOptimizer,
  optimizedQueries: QueryOptimizer.createOptimizedQueries,
  aggregationPipelines: QueryOptimizer.createAggregationPipelines(),
  performanceMiddleware: QueryOptimizer.createPerformanceMiddleware(),
  connectionOptions: QueryOptimizer.optimizeConnection()
};