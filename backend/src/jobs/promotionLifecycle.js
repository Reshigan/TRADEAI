/**
 * Promotion Lifecycle Job
 * 
 * D-11: Automates promotion state transitions based on dates:
 * - approved → active when startDate arrives
 * - active → completed when endDate passes
 * 
 * Runs every 15 minutes via cron
 */

const Promotion = require('../models/Promotion');
const logger = require('../utils/logger');

// System user ID for automated transitions (could be configured)
const SYSTEM_USER_ID = 'SYSTEM';

module.exports = {
  /**
   * Process promotion lifecycle transitions
   * This function is called by the job queue processor
   */
  process: async function() {
    return await processPromotionLifecycle();
  }
};

/**
 * Core lifecycle logic - extracted for direct testing
 */
async function processPromotionLifecycle() {
  const now = new Date();
  const results = {
    activated: 0,
    completed: 0,
    errors: []
  };

  try {
    // Step 1: approved promos whose start date has arrived → active
    const toActivate = await Promotion.find({
      status: 'approved',
      'period.startDate': { $lte: now }
    });

    for (const p of toActivate) {
      try {
        p.status = 'active';
        p.history = p.history || [];
        p.history.push({
          action: 'status_changed:approved→active',
          performedBy: SYSTEM_USER_ID,
          performedDate: new Date(),
          comment: 'Auto-activated on start date'
        });
        await p.save();
        results.activated++;
        logger.info(`Activated promotion ${p.promotionId}`);
      } catch (e) {
        results.errors.push({
          promotionId: p.promotionId,
          action: 'activate',
          error: e.message
        });
        logger.error(`Failed to activate ${p.promotionId}`, e);
      }
    }

    // Step 2: active promos whose end date has passed → completed
    const toComplete = await Promotion.find({
      status: 'active',
      'period.endDate': { $lt: now }
    });

    for (const p of toComplete) {
      try {
        p.status = 'completed';
        p.history = p.history || [];
        p.history.push({
          action: 'status_changed:active→completed',
          performedBy: SYSTEM_USER_ID,
          performedDate: new Date(),
          comment: 'Auto-completed on end date'
        });
        await p.save();
        results.completed++;
        logger.info(`Completed promotion ${p.promotionId}`);
        
        // TODO: Kick off post-event analysis (task P3-4 in main spec)
        // This would trigger the postEventAnalysis workflow
      } catch (e) {
        results.errors.push({
          promotionId: p.promotionId,
          action: 'complete',
          error: e.message
        });
        logger.error(`Failed to complete ${p.promotionId}`, e);
      }
    }

    logger.info(`Promotion lifecycle job completed: ${results.activated} activated, ${results.completed} completed`);
    return results;

  } catch (error) {
    logger.error('Promotion lifecycle job failed:', error);
    throw error;
  }
}
