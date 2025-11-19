/**
 * InsightRulesRegistry
 *
 * Defines deterministic business rules for anomaly detection and insight generation.
 * Each rule specifies conditions, thresholds, and actions for generating insights.
 *
 * Structure: INSIGHT_RULES[module] = { ruleId: { definition } }
 */

const INSIGHT_RULES = {
  budget: {
    budgetOverspend: {
      id: 'budgetOverspend',
      name: 'Budget Overspend',
      description: 'Budget has exceeded allocated amount',
      severity: 'critical',
      category: 'financial',
      condition: (entity) => {
        return entity.spentAmount > entity.totalAmount;
      },
      threshold: {
        type: 'percentage',
        value: 100
      },
      generateInsight: (entity) => {
        const overspend = entity.spentAmount - entity.totalAmount;
        const overspendPercentage = ((overspend / entity.totalAmount) * 100).toFixed(2);

        return {
          title: `Budget Overspend: ${entity.name}`,
          description: `Budget has exceeded allocated amount by ${overspendPercentage}% (${overspend.toLocaleString()} ${entity.currency})`,
          severity: 'critical',
          category: 'financial',
          actualValue: entity.spentAmount,
          expectedValue: entity.totalAmount,
          variance: overspendPercentage,
          recommendedActions: [
            {
              action: 'review_spending',
              description: 'Review and analyze spending patterns',
              priority: 'critical'
            },
            {
              action: 'reallocate_budget',
              description: 'Reallocate budget from other sources',
              priority: 'high'
            },
            {
              action: 'pause_activities',
              description: 'Pause non-critical activities',
              priority: 'high'
            }
          ]
        };
      }
    },

    budgetUnderutilization: {
      id: 'budgetUnderutilization',
      name: 'Budget Under-utilization',
      description: 'Budget utilization is significantly below target',
      severity: 'warning',
      category: 'operational',
      condition: (entity) => {
        const daysElapsed = Math.floor((Date.now() - new Date(entity.startDate)) / (1000 * 60 * 60 * 24));
        const totalDays = Math.floor((new Date(entity.endDate) - new Date(entity.startDate)) / (1000 * 60 * 60 * 24));
        const expectedUtilization = (daysElapsed / totalDays) * 100;
        const actualUtilization = (entity.spentAmount / entity.totalAmount) * 100;

        return actualUtilization < (expectedUtilization - 20) && daysElapsed > 30;
      },
      threshold: {
        type: 'percentage',
        value: 20
      },
      generateInsight: (entity) => {
        const daysElapsed = Math.floor((Date.now() - new Date(entity.startDate)) / (1000 * 60 * 60 * 24));
        const totalDays = Math.floor((new Date(entity.endDate) - new Date(entity.startDate)) / (1000 * 60 * 60 * 24));
        const expectedUtilization = (daysElapsed / totalDays) * 100;
        const actualUtilization = (entity.spentAmount / entity.totalAmount) * 100;
        const gap = (expectedUtilization - actualUtilization).toFixed(2);

        return {
          title: `Budget Under-utilization: ${entity.name}`,
          description: `Budget utilization (${actualUtilization.toFixed(2)}%) is ${gap}% below expected pace (${expectedUtilization.toFixed(2)}%)`,
          severity: 'warning',
          category: 'operational',
          actualValue: actualUtilization,
          expectedValue: expectedUtilization,
          variance: -gap,
          recommendedActions: [
            {
              action: 'accelerate_activities',
              description: 'Accelerate planned activities',
              priority: 'medium'
            },
            {
              action: 'review_pipeline',
              description: 'Review and approve pending initiatives',
              priority: 'medium'
            }
          ]
        };
      }
    },

    budgetBurnRateAnomaly: {
      id: 'budgetBurnRateAnomaly',
      name: 'Budget Burn Rate Anomaly',
      description: 'Budget burn rate has increased significantly',
      severity: 'warning',
      category: 'anomaly',
      condition: (entity, historicalData) => {
        if (!historicalData || !historicalData.averageBurnRate) return false;

        const currentBurnRate = entity.spentAmount / Math.max(1, Math.floor((Date.now() - new Date(entity.startDate)) / (1000 * 60 * 60 * 24)));
        const threshold = historicalData.averageBurnRate * 1.5;

        return currentBurnRate > threshold;
      },
      threshold: {
        type: 'percentage',
        value: 50
      },
      generateInsight: (entity, historicalData) => {
        const currentBurnRate = entity.spentAmount / Math.max(1, Math.floor((Date.now() - new Date(entity.startDate)) / (1000 * 60 * 60 * 24)));
        const increase = ((currentBurnRate - historicalData.averageBurnRate) / historicalData.averageBurnRate * 100).toFixed(2);

        return {
          title: `Budget Burn Rate Spike: ${entity.name}`,
          description: `Current burn rate (${currentBurnRate.toLocaleString()}/day) is ${increase}% higher than average`,
          severity: 'warning',
          category: 'anomaly',
          actualValue: currentBurnRate,
          expectedValue: historicalData.averageBurnRate,
          variance: increase,
          recommendedActions: [
            {
              action: 'investigate_spike',
              description: 'Investigate recent high-spend activities',
              priority: 'high'
            },
            {
              action: 'review_approvals',
              description: 'Review recent approval patterns',
              priority: 'medium'
            }
          ]
        };
      }
    }
  },

  promotion: {
    lowPromotionROI: {
      id: 'lowPromotionROI',
      name: 'Low Promotion ROI',
      description: 'Promotion ROI is below target threshold',
      severity: 'warning',
      category: 'performance',
      condition: (entity) => {
        if (!entity.actualSales || !entity.investedAmount) return false;
        const roi = ((entity.actualSales - entity.investedAmount) / entity.investedAmount) * 100;
        return roi < 50;
      },
      threshold: {
        type: 'percentage',
        value: 50
      },
      generateInsight: (entity) => {
        const roi = ((entity.actualSales - entity.investedAmount) / entity.investedAmount) * 100;

        return {
          title: `Low ROI: ${entity.name}`,
          description: `Promotion ROI (${roi.toFixed(2)}%) is below 50% target threshold`,
          severity: roi < 0 ? 'critical' : 'warning',
          category: 'performance',
          actualValue: roi,
          expectedValue: 50,
          variance: roi - 50,
          recommendedActions: [
            {
              action: 'analyze_performance',
              description: 'Analyze promotion performance drivers',
              priority: 'high'
            },
            {
              action: 'adjust_mechanics',
              description: 'Consider adjusting promotion mechanics',
              priority: 'medium'
            },
            {
              action: 'review_targeting',
              description: 'Review customer and product targeting',
              priority: 'medium'
            }
          ]
        };
      }
    },

    promotionConflict: {
      id: 'promotionConflict',
      name: 'Promotion Conflict',
      description: 'Overlapping promotions detected for same customer/product',
      severity: 'warning',
      category: 'operational',
      condition: (entity, context) => {
        return context.hasOverlappingPromotions === true;
      },
      threshold: {
        type: 'count',
        value: 1
      },
      generateInsight: (entity, context) => {
        return {
          title: `Promotion Conflict: ${entity.name}`,
          description: `${context.conflictCount} overlapping promotion(s) detected for same customer/product combination`,
          severity: 'warning',
          category: 'operational',
          actualValue: context.conflictCount,
          expectedValue: 0,
          variance: context.conflictCount,
          recommendedActions: [
            {
              action: 'review_conflicts',
              description: 'Review and resolve promotion conflicts',
              priority: 'high'
            },
            {
              action: 'adjust_dates',
              description: 'Adjust promotion dates to avoid overlap',
              priority: 'medium'
            }
          ]
        };
      }
    },

    underperformingPromotion: {
      id: 'underperformingPromotion',
      name: 'Underperforming Promotion',
      description: 'Promotion performance is significantly below forecast',
      severity: 'warning',
      category: 'performance',
      condition: (entity) => {
        if (!entity.actualSales || !entity.forecastSales) return false;
        const performance = (entity.actualSales / entity.forecastSales) * 100;
        return performance < 70;
      },
      threshold: {
        type: 'percentage',
        value: 70
      },
      generateInsight: (entity) => {
        const performance = (entity.actualSales / entity.forecastSales) * 100;
        const gap = (100 - performance).toFixed(2);

        return {
          title: `Underperforming: ${entity.name}`,
          description: `Actual sales (${performance.toFixed(2)}%) are ${gap}% below forecast`,
          severity: 'warning',
          category: 'performance',
          actualValue: entity.actualSales,
          expectedValue: entity.forecastSales,
          variance: -gap,
          recommendedActions: [
            {
              action: 'boost_execution',
              description: 'Increase in-store execution support',
              priority: 'high'
            },
            {
              action: 'enhance_communication',
              description: 'Enhance customer communication',
              priority: 'medium'
            },
            {
              action: 'review_pricing',
              description: 'Review promotion pricing and mechanics',
              priority: 'medium'
            }
          ]
        };
      }
    }
  },

  claim: {
    slowClaimProcessing: {
      id: 'slowClaimProcessing',
      name: 'Slow Claim Processing',
      description: 'Claim processing time exceeds target SLA',
      severity: 'warning',
      category: 'operational',
      condition: (entity) => {
        if (!entity.submissionDate || entity.status === 'paid') return false;
        const daysOpen = Math.floor((Date.now() - new Date(entity.submissionDate)) / (1000 * 60 * 60 * 24));
        return daysOpen > 10;
      },
      threshold: {
        type: 'days',
        value: 10
      },
      generateInsight: (entity) => {
        const daysOpen = Math.floor((Date.now() - new Date(entity.submissionDate)) / (1000 * 60 * 60 * 24));

        return {
          title: `Slow Processing: Claim ${entity.claimNumber}`,
          description: `Claim has been open for ${daysOpen} days, exceeding 10-day SLA`,
          severity: daysOpen > 20 ? 'critical' : 'warning',
          category: 'operational',
          actualValue: daysOpen,
          expectedValue: 10,
          variance: daysOpen - 10,
          recommendedActions: [
            {
              action: 'expedite_review',
              description: 'Expedite claim review and approval',
              priority: 'high'
            },
            {
              action: 'contact_customer',
              description: 'Contact customer with status update',
              priority: 'medium'
            }
          ]
        };
      }
    },

    highValueClaim: {
      id: 'highValueClaim',
      name: 'High Value Claim',
      description: 'Claim amount exceeds threshold requiring special attention',
      severity: 'info',
      category: 'financial',
      condition: (entity) => {
        return entity.claimAmount > 100000;
      },
      threshold: {
        type: 'currency',
        value: 100000
      },
      generateInsight: (entity) => {
        return {
          title: `High Value Claim: ${entity.claimNumber}`,
          description: `Claim amount (${entity.claimAmount.toLocaleString()} ${entity.currency}) exceeds 100,000 threshold`,
          severity: 'info',
          category: 'financial',
          actualValue: entity.claimAmount,
          expectedValue: 100000,
          variance: entity.claimAmount - 100000,
          recommendedActions: [
            {
              action: 'senior_review',
              description: 'Route to senior management for review',
              priority: 'high'
            },
            {
              action: 'verify_documentation',
              description: 'Verify all supporting documentation',
              priority: 'high'
            }
          ]
        };
      }
    },

    claimPatternAnomaly: {
      id: 'claimPatternAnomaly',
      name: 'Claim Pattern Anomaly',
      description: 'Unusual claim pattern detected for customer',
      severity: 'warning',
      category: 'anomaly',
      condition: (entity, context) => {
        if (!context.customerClaimHistory) return false;
        return entity.claimAmount > (context.customerClaimHistory.averageAmount * 2);
      },
      threshold: {
        type: 'percentage',
        value: 200
      },
      generateInsight: (entity, context) => {
        const increase = ((entity.claimAmount - context.customerClaimHistory.averageAmount) / context.customerClaimHistory.averageAmount * 100).toFixed(2);

        return {
          title: `Claim Anomaly: ${entity.claimNumber}`,
          description: `Claim amount is ${increase}% higher than customer's average`,
          severity: 'warning',
          category: 'anomaly',
          actualValue: entity.claimAmount,
          expectedValue: context.customerClaimHistory.averageAmount,
          variance: increase,
          recommendedActions: [
            {
              action: 'investigate_anomaly',
              description: 'Investigate unusual claim pattern',
              priority: 'high'
            },
            {
              action: 'verify_validity',
              description: 'Verify claim validity and documentation',
              priority: 'high'
            }
          ]
        };
      }
    }
  },

  deduction: {
    unresolvedDeduction: {
      id: 'unresolvedDeduction',
      name: 'Unresolved Deduction',
      description: 'Deduction remains unresolved beyond target timeframe',
      severity: 'warning',
      category: 'operational',
      condition: (entity) => {
        if (entity.status === 'resolved') return false;
        const daysOpen = Math.floor((Date.now() - new Date(entity.postingDate)) / (1000 * 60 * 60 * 24));
        return daysOpen > 14;
      },
      threshold: {
        type: 'days',
        value: 14
      },
      generateInsight: (entity) => {
        const daysOpen = Math.floor((Date.now() - new Date(entity.postingDate)) / (1000 * 60 * 60 * 24));

        return {
          title: `Unresolved Deduction: ${entity.deductionNumber}`,
          description: `Deduction has been open for ${daysOpen} days, exceeding 14-day target`,
          severity: daysOpen > 30 ? 'critical' : 'warning',
          category: 'operational',
          actualValue: daysOpen,
          expectedValue: 14,
          variance: daysOpen - 14,
          recommendedActions: [
            {
              action: 'prioritize_research',
              description: 'Prioritize deduction research',
              priority: 'high'
            },
            {
              action: 'contact_customer',
              description: 'Contact customer for backup documentation',
              priority: 'medium'
            }
          ]
        };
      }
    },

    highInvalidDeductionRate: {
      id: 'highInvalidDeductionRate',
      name: 'High Invalid Deduction Rate',
      description: 'Customer has high rate of invalid deductions',
      severity: 'warning',
      category: 'compliance',
      condition: (entity, context) => {
        if (!context.customerDeductionHistory) return false;
        const invalidRate = (context.customerDeductionHistory.invalidCount / context.customerDeductionHistory.totalCount) * 100;
        return invalidRate > 30 && context.customerDeductionHistory.totalCount > 5;
      },
      threshold: {
        type: 'percentage',
        value: 30
      },
      generateInsight: (entity, context) => {
        const invalidRate = (context.customerDeductionHistory.invalidCount / context.customerDeductionHistory.totalCount) * 100;

        return {
          title: `High Invalid Deduction Rate: ${entity.customerName}`,
          description: `Customer has ${invalidRate.toFixed(2)}% invalid deduction rate (${context.customerDeductionHistory.invalidCount} of ${context.customerDeductionHistory.totalCount})`,
          severity: 'warning',
          category: 'compliance',
          actualValue: invalidRate,
          expectedValue: 10,
          variance: invalidRate - 10,
          recommendedActions: [
            {
              action: 'customer_training',
              description: 'Provide customer training on deduction policies',
              priority: 'high'
            },
            {
              action: 'review_process',
              description: 'Review deduction submission process with customer',
              priority: 'medium'
            }
          ]
        };
      }
    }
  },

  tradeSpend: {
    highTradeSpendRatio: {
      id: 'highTradeSpendRatio',
      name: 'High Trade Spend Ratio',
      description: 'Trade spend as % of sales exceeds target threshold',
      severity: 'warning',
      category: 'financial',
      condition: (entity, context) => {
        if (!context.netSales) return false;
        const ratio = (entity.accruedAmount / context.netSales) * 100;
        return ratio > 20;
      },
      threshold: {
        type: 'percentage',
        value: 20
      },
      generateInsight: (entity, context) => {
        const ratio = (entity.accruedAmount / context.netSales) * 100;

        return {
          title: `High Trade Spend Ratio: ${entity.name}`,
          description: `Trade spend ratio (${ratio.toFixed(2)}%) exceeds 20% target threshold`,
          severity: 'warning',
          category: 'financial',
          actualValue: ratio,
          expectedValue: 15,
          variance: ratio - 15,
          recommendedActions: [
            {
              action: 'review_terms',
              description: 'Review and renegotiate trade spend terms',
              priority: 'high'
            },
            {
              action: 'analyze_roi',
              description: 'Analyze trade spend ROI and effectiveness',
              priority: 'high'
            }
          ]
        };
      }
    }
  },

  kamWallet: {
    walletNearDepletion: {
      id: 'walletNearDepletion',
      name: 'Wallet Near Depletion',
      description: 'KAM wallet balance is running low',
      severity: 'warning',
      category: 'operational',
      condition: (entity) => {
        const utilization = (entity.spentAmount / entity.totalAllocation) * 100;
        return utilization > 90;
      },
      threshold: {
        type: 'percentage',
        value: 90
      },
      generateInsight: (entity) => {
        const utilization = (entity.spentAmount / entity.totalAllocation) * 100;
        const remaining = entity.totalAllocation - entity.spentAmount;

        return {
          title: `Wallet Near Depletion: ${entity.walletName}`,
          description: `Wallet is ${utilization.toFixed(2)}% utilized with only ${remaining.toLocaleString()} ${entity.currency} remaining`,
          severity: 'warning',
          category: 'operational',
          actualValue: utilization,
          expectedValue: 80,
          variance: utilization - 80,
          recommendedActions: [
            {
              action: 'request_topup',
              description: 'Request wallet top-up',
              priority: 'high'
            },
            {
              action: 'prioritize_spending',
              description: 'Prioritize remaining spend on high-impact activities',
              priority: 'medium'
            }
          ]
        };
      }
    }
  }
};

/**
 * Get insight rules for a specific module
 */
const getInsightRules = (module) => {
  return INSIGHT_RULES[module] || {};
};

/**
 * Get all insight rules across all modules
 */
const getAllInsightRules = () => {
  return INSIGHT_RULES;
};

/**
 * Get insight rule by module and rule ID
 */
const getInsightRule = (module, ruleId) => {
  const moduleRules = INSIGHT_RULES[module];
  if (!moduleRules) {
    return null;
  }

  const rule = moduleRules[ruleId];
  if (!rule) {
    return null;
  }

  return rule;
};

/**
 * Evaluate all rules for an entity
 */
const evaluateRules = (module, entity, context = {}) => {
  const moduleRules = INSIGHT_RULES[module];
  if (!moduleRules) return [];

  const insights = [];

  for (const [ruleId, rule] of Object.entries(moduleRules)) {
    try {
      if (rule.condition(entity, context)) {
        const insightData = rule.generateInsight(entity, context);
        insights.push({
          ruleId,
          ...insightData,
          module,
          entityType: module,
          entityId: entity._id || entity.id,
          entityName: entity.name || entity.code || entity.number,
          fingerprint: `${module}-${ruleId}-${entity._id || entity.id}`
        });
      }
    } catch (error) {
      logger.error(`Error evaluating rule ${ruleId} for module ${module}:`, error);
    }
  }

  return insights;
};

/**
 * Get all modules with insight rules
 */
const getAllModules = () => {
  return Object.keys(INSIGHT_RULES);
};

module.exports = {
  INSIGHT_RULES,
  getInsightRules,
  getAllInsightRules,
  getInsightRule,
  evaluateRules,
  getAllModules
};
