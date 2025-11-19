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
        case 'budget': {
          const historicalBudgets = await Model.find({
            company: entity.company,
            year: { $lt: entity.year },
            status: { $in: ['approved', 'locked'] }
          }).limit(3).lean();

          if (historicalBudgets.length > 0) {
            const totalBurnRate = historicalBudgets.reduce((sum, budget) => {
              const spent = budget.spent || 0;
              const startDate = new Date(budget.year, 0, 1);
              const endDate = new Date(budget.year, 11, 31);
              const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
              return sum + (spent / days);
            }, 0);
            context.historicalData = {
              averageBurnRate: totalBurnRate / historicalBudgets.length
            };
          } else {
            context.historicalData = {
              averageBurnRate: 0
            };
          }
          break;
        }

        case 'promotion': {
          // Check for overlapping promotions using the static method
          const PromotionModel = require('../models/Promotion');
          const overlapping = await PromotionModel.findOverlapping(
            entity.scope?.customers?.[0]?.customer,
            entity.products?.[0]?.product,
            entity.period?.startDate,
            entity.period?.endDate
          );
          context.hasOverlappingPromotions = overlapping.length > 0;
          context.conflictCount = overlapping.length;
          break;
        }

        case 'claim': {
          if (entity.customer) {
            const ClaimModel = require('../models/Claim');
            const customerClaims = await ClaimModel.find({
              customer: entity.customer,
              status: { $in: ['approved', 'paid'] }
            }).lean();

            if (customerClaims.length > 0) {
              const totalAmount = customerClaims.reduce((sum, claim) => sum + (claim.claimAmount || 0), 0);
              context.customerClaimHistory = {
                averageAmount: totalAmount / customerClaims.length,
                totalCount: customerClaims.length
              };
            } else {
              context.customerClaimHistory = {
                averageAmount: 0,
                totalCount: 0
              };
            }
          }
          break;
        }

        case 'deduction': {
          if (entity.customer) {
            const DeductionModel = require('../models/Deduction');
            const customerDeductions = await DeductionModel.find({
              customer: entity.customer
            }).lean();

            const invalidCount = customerDeductions.filter((d) => d.resolution === 'invalid').length;
            context.customerDeductionHistory = {
              invalidCount,
              totalCount: customerDeductions.length
            };
          }
          break;
        }

        case 'tradeSpend': {
          const SalesTransaction = require('../models/SalesTransaction');
          const salesData = await SalesTransaction.aggregate([
            {
              $match: {
                company: entity.company,
                date: {
                  $gte: entity.period?.startDate || new Date(new Date().getFullYear(), 0, 1),
                  $lte: entity.period?.endDate || new Date()
                }
              }
            },
            {
              $group: {
                _id: null,
                totalSales: { $sum: '$netSales' }
              }
            }
          ]);
          context.netSales = salesData[0]?.totalSales || 0;
          break;
        }

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
      console.error('Error scanning entity on-demand:', error);
      throw error;
    }
  }
}

// Singleton instance
const insightScanner = new InsightScanner();

module.exports = insightScanner;
