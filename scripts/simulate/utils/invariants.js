/**
 * Data Invariants - Business rules that must always hold true
 */

class InvariantValidator {
  constructor() {
    this.violations = [];
  }

  validateBudget(budget) {
    const violations = [];

    if (budget.used < 0) {
      violations.push({
        type: 'budget_negative_used',
        entity: budget,
        message: `Budget ${budget._id} has negative used amount: ${budget.used}`
      });
    }

    const expectedAvailable = budget.cap - budget.used;
    if (Math.abs(budget.available - expectedAvailable) > 0.01) {
      violations.push({
        type: 'budget_available_mismatch',
        entity: budget,
        message: `Budget ${budget._id} available (${budget.available}) != cap - used (${expectedAvailable})`
      });
    }

    if (budget.used > budget.cap) {
      violations.push({
        type: 'budget_overutilized',
        entity: budget,
        message: `Budget ${budget._id} used (${budget.used}) > cap (${budget.cap})`
      });
    }

    this.violations.push(...violations);
    return violations;
  }

  validatePromotion(promotion) {
    const violations = [];

    if (new Date(promotion.startDate) >= new Date(promotion.endDate)) {
      violations.push({
        type: 'promotion_invalid_dates',
        entity: promotion,
        message: `Promotion ${promotion._id} start date >= end date`
      });
    }

    if (promotion.actualUnits && promotion.actualUnits < 0) {
      violations.push({
        type: 'promotion_negative_units',
        entity: promotion,
        message: `Promotion ${promotion._id} has negative actual units: ${promotion.actualUnits}`
      });
    }

    if (promotion.uplift && promotion.uplift < 0) {
      violations.push({
        type: 'promotion_negative_uplift',
        entity: promotion,
        message: `Promotion ${promotion._id} has negative uplift: ${promotion.uplift}`
      });
    }

    if (promotion.roi && promotion.netSpend) {
      const expectedROI = promotion.incrementalMargin / promotion.netSpend;
      if (Math.abs(promotion.roi - expectedROI) > 0.01) {
        violations.push({
          type: 'promotion_roi_mismatch',
          entity: promotion,
          message: `Promotion ${promotion._id} ROI (${promotion.roi}) != incremental margin / net spend (${expectedROI})`
        });
      }
    }

    this.violations.push(...violations);
    return violations;
  }

  validateClaim(claim) {
    const violations = [];

    if (claim.lineItems && claim.lineItems.length > 0) {
      const sumLineItems = claim.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      if (Math.abs(claim.total - sumLineItems) > 0.01) {
        violations.push({
          type: 'claim_total_mismatch',
          entity: claim,
          message: `Claim ${claim._id} total (${claim.total}) != sum of line items (${sumLineItems})`
        });
      }
    }

    const validTransitions = {
      'draft': ['submitted', 'cancelled'],
      'submitted': ['under_review', 'cancelled'],
      'under_review': ['approved', 'rejected'],
      'approved': ['settled'],
      'rejected': [],
      'settled': [],
      'cancelled': []
    };

    if (claim.statusHistory && claim.statusHistory.length > 1) {
      for (let i = 1; i < claim.statusHistory.length; i++) {
        const prevStatus = claim.statusHistory[i - 1].status;
        const currStatus = claim.statusHistory[i].status;
        
        if (!validTransitions[prevStatus]?.includes(currStatus)) {
          violations.push({
            type: 'claim_invalid_transition',
            entity: claim,
            message: `Claim ${claim._id} invalid transition: ${prevStatus} -> ${currStatus}`
          });
        }
      }
    }

    if (claim.settledAt && claim.submittedAt) {
      if (new Date(claim.settledAt) < new Date(claim.submittedAt)) {
        violations.push({
          type: 'claim_invalid_dates',
          entity: claim,
          message: `Claim ${claim._id} settled date < submitted date`
        });
      }
    }

    this.violations.push(...violations);
    return violations;
  }

  validateReportAggregation(report, ledger) {
    const violations = [];

    if (report.groupBy && report.data) {
      const groups = {};
      
      for (const row of report.data) {
        const groupKey = row[report.groupBy];
        if (!groups[groupKey]) {
          groups[groupKey] = 0;
        }
        groups[groupKey] += row.value || 0;
      }

      const ledgerTotal = this.calculateLedgerTotal(report.metric, ledger);
      const reportTotal = Object.values(groups).reduce((sum, val) => sum + val, 0);

      if (Math.abs(reportTotal - ledgerTotal) > 0.01) {
        violations.push({
          type: 'report_aggregation_mismatch',
          entity: report,
          message: `Report ${report.type} total (${reportTotal}) != ledger total (${ledgerTotal})`
        });
      }
    }

    this.violations.push(...violations);
    return violations;
  }

  calculateLedgerTotal(metric, ledger) {
    switch (metric) {
      case 'budget_used':
        return ledger.getAllEntities('budgets').reduce((sum, b) => sum + (b.used || 0), 0);
      case 'promotion_spend':
        return ledger.getAllEntities('promotions').reduce((sum, p) => sum + (p.netSpend || 0), 0);
      case 'claim_total':
        return ledger.getAllEntities('claims').reduce((sum, c) => sum + (c.total || 0), 0);
      default:
        return 0;
    }
  }

  getViolations() {
    return this.violations;
  }

  hasViolations() {
    return this.violations.length > 0;
  }

  reset() {
    this.violations = [];
  }
}

module.exports = InvariantValidator;
