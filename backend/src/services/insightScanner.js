/**
 * InsightScanner Service
 * 
 * Background service that scans entities and generates insights
 * based on InsightRulesRegistry rules
 */

const { evaluateRules, getAllModules } = require('../config/registries/insightRulesRegistry');
const Insight = require('../models/Insight');
const { emitInsightUpdate } = require('./socketService');

class InsightScanner {
  constructor() {
    this.isRunning = false;
    this.scanInterval = 5 * 60 * 1000; // 5 minutes
    this.intervalId = null;
  }

  /**
   * Start the insight scanner
   */
  start() {
    if (this.isRunning) {
      console.log('InsightScanner is already running');
      return;
    }

    console.log('Starting InsightScanner...');
    this.isRunning = true;

    this.scan();

    this.intervalId = setInterval(() => {
      this.scan();
    }, this.scanInterval);
  }

  /**
   * Stop the insight scanner
   */
  stop() {
    if (!this.isRunning) {
      console.log('InsightScanner is not running');
      return;
    }

    console.log('Stopping InsightScanner...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Run a full scan across all modules
   */
  async scan() {
    console.log('InsightScanner: Starting scan...');
    const startTime = Date.now();

    try {
      const modules = getAllModules();
      let totalInsights = 0;

      for (const module of modules) {
        const count = await this.scanModule(module);
        totalInsights += count;
      }

      const duration = Date.now() - startTime;
      console.log(`InsightScanner: Scan complete. Generated ${totalInsights} insights in ${duration}ms`);
    } catch (error) {
      console.error('InsightScanner: Error during scan:', error);
    }
  }

  /**
   * Scan a specific module
   */
  async scanModule(module) {
    try {
      const Model = this.getModelForModule(module);
      if (!Model) {
        console.warn(`InsightScanner: No model found for module ${module}`);
        return 0;
      }

      const entities = await Model.find({
        status: { $in: ['active', 'pending', 'approved', 'draft'] }
      })
        .limit(100)
        .lean();

      let insightCount = 0;

      for (const entity of entities) {
        const insights = await this.scanEntity(module, entity, Model);
        insightCount += insights.length;
      }

      return insightCount;
    } catch (error) {
      console.error(`InsightScanner: Error scanning module ${module}:`, error);
      return 0;
    }
  }

  /**
   * Scan a specific entity and generate insights
   */
  async scanEntity(module, entity, Model) {
    try {
      const context = await this.getEntityContext(module, entity, Model);

      const insights = evaluateRules(module, entity, context);

      const savedInsights = [];
      for (const insightData of insights) {
        const { insight, isNew } = await Insight.findOrUpdateByFingerprint(
          insightData.fingerprint,
          {
            ...insightData,
            createdBy: null // System-generated
          }
        );

        if (isNew) {
          savedInsights.push(insight);

          if (insight.owner) {
            emitInsightUpdate(insight.owner, insight);
          }
        }
      }

      return savedInsights;
    } catch (error) {
      console.error(`InsightScanner: Error scanning entity ${entity._id}:`, error);
      return [];
    }
  }

  /**
   * Get context data for an entity
   */
  async getEntityContext(module, entity, Model) {
    const context = {};

    try {
      switch (module) {
        case 'budget':
          context.historicalData = {
            averageBurnRate: 50000 // Mock value
          };
          break;

        case 'promotion':
          // Check for overlapping promotions
          context.hasOverlappingPromotions = false;
          context.conflictCount = 0;
          break;

        case 'claim':
          if (entity.customerId) {
            context.customerClaimHistory = {
              averageAmount: 25000,
              totalCount: 10
            };
          }
          break;

        case 'deduction':
          if (entity.customerId) {
            context.customerDeductionHistory = {
              invalidCount: 3,
              totalCount: 10
            };
          }
          break;

        case 'tradeSpend':
          context.netSales = 1000000; // Mock value
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`Error getting context for ${module}:`, error);
    }

    return context;
  }

  /**
   * Get the Mongoose model for a module
   */
  getModelForModule(module) {
    try {
      const modelMap = {
        budget: require('../models/Budget'),
        promotion: require('../models/Promotion'),
        tradeSpend: require('../models/TradeSpend'),
        tradingTerm: require('../models/TradingTerm'),
        activityGrid: require('../models/ActivityGrid'),
        claim: require('../models/Claim'),
        deduction: require('../models/Deduction'),
        kamWallet: require('../models/KAMWallet'),
        campaign: require('../models/Campaign'),
        customer: require('../models/Customer'),
        product: require('../models/Product')
      };

      return modelMap[module] || null;
    } catch (error) {
      console.error(`Error loading model for ${module}:`, error);
      return null;
    }
  }

  /**
   * Scan a specific entity on-demand
   */
  async scanEntityOnDemand(module, entityId) {
    try {
      const Model = this.getModelForModule(module);
      if (!Model) {
        throw new Error(`No model found for module ${module}`);
      }

      const entity = await Model.findById(entityId).lean();
      if (!entity) {
        throw new Error(`Entity not found: ${entityId}`);
      }

      return await this.scanEntity(module, entity, Model);
    } catch (error) {
      console.error(`Error scanning entity on-demand:`, error);
      throw error;
    }
  }
}

// Singleton instance
const insightScanner = new InsightScanner();

module.exports = insightScanner;
