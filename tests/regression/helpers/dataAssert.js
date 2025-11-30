/**
 * Data Assertion Helpers for Regression Testing
 * Validates data accuracy across API responses and UI
 */

const InvariantValidator = require('../../../scripts/simulate/utils/invariants');

class DataAssertions {
  constructor(ledger) {
    this.ledger = ledger;
    this.validator = new InvariantValidator();
    this.errors = [];
  }

  assertBudgetUtilization(budget) {
    const errors = [];

    if (budget.spent < 0 || budget.used < 0) {
      errors.push(`Budget ${budget._id} has negative used/spent: ${budget.spent || budget.used}`);
    }

    const used = budget.spent || budget.used || 0;
    const cap = budget.totalBudget || budget.cap || 0;
    const available = budget.remaining || budget.available || 0;
    const expectedAvailable = cap - used;

    if (Math.abs(available - expectedAvailable) > 0.01) {
      errors.push(`Budget ${budget._id} available (${available}) != cap - used (${expectedAvailable})`);
    }

    if (used > cap) {
      errors.push(`Budget ${budget._id} used (${used}) > cap (${cap})`);
    }

    const utilization = used / cap;
    if (utilization < 0 || utilization > 1.1) { // Allow 10% over for edge cases
      errors.push(`Budget ${budget._id} utilization (${utilization}) out of range [0, 1.1]`);
    }

    this.errors.push(...errors);
    return errors.length === 0;
  }

  assertPromotionData(promotion) {
    const errors = [];

    if (new Date(promotion.startDate) >= new Date(promotion.endDate)) {
      errors.push(`Promotion ${promotion._id} start date >= end date`);
    }

    if (promotion.actualUnits && promotion.actualUnits < 0) {
      errors.push(`Promotion ${promotion._id} has negative actual units`);
    }

    if (promotion.netSpend && promotion.netSpend < 0) {
      errors.push(`Promotion ${promotion._id} has negative net spend`);
    }

    if (promotion.roi && promotion.netSpend && promotion.incrementalMargin) {
      const expectedROI = promotion.incrementalMargin / promotion.netSpend;
      if (Math.abs(promotion.roi - expectedROI) > 0.01) {
        errors.push(`Promotion ${promotion._id} ROI mismatch: ${promotion.roi} vs ${expectedROI}`);
      }
    }

    this.errors.push(...errors);
    return errors.length === 0;
  }

  assertTransactionData(transaction) {
    const errors = [];

    if (transaction.quantity && transaction.quantity <= 0) {
      errors.push(`Transaction ${transaction._id} has non-positive quantity`);
    }

    if (transaction.amount && transaction.amount <= 0) {
      errors.push(`Transaction ${transaction._id} has non-positive amount`);
    }

    if (transaction.totals) {
      const { subtotal, tax, total } = transaction.totals;
      const expectedTotal = subtotal + tax;
      
      if (Math.abs(total - expectedTotal) > 0.01) {
        errors.push(`Transaction ${transaction._id} total mismatch: ${total} vs ${expectedTotal}`);
      }
    }

    this.errors.push(...errors);
    return errors.length === 0;
  }

  assertReportAggregation(report, expectedTotal) {
    const errors = [];

    if (!report.data || !Array.isArray(report.data)) {
      errors.push(`Report ${report.type} has no data array`);
      this.errors.push(...errors);
      return false;
    }

    const reportTotal = report.data.reduce((sum, row) => {
      const value = row.value || row.amount || row.total || 0;
      return sum + value;
    }, 0);

    const tolerance = Math.max(expectedTotal * 0.01, 0.01);
    if (Math.abs(reportTotal - expectedTotal) > tolerance) {
      errors.push(`Report ${report.type} total (${reportTotal}) != expected (${expectedTotal})`);
    }

    this.errors.push(...errors);
    return errors.length === 0;
  }

  assertMatchesLedger(apiData, entityType) {
    const errors = [];
    const ledgerEntities = this.ledger.getAllEntities(entityType);

    if (apiData.length !== ledgerEntities.length) {
      errors.push(`${entityType} count mismatch: API=${apiData.length}, Ledger=${ledgerEntities.length}`);
    }

    for (const entity of apiData) {
      const ledgerEntity = this.ledger.getEntity(entityType, entity._id || entity.id);
      if (!ledgerEntity) {
        errors.push(`${entityType} ${entity._id || entity.id} not found in ledger`);
      }
    }

    this.errors.push(...errors);
    return errors.length === 0;
  }

  assertKPIInRange(kpiName, actualValue, expectedRange) {
    const errors = [];
    const { min, max } = expectedRange;

    if (actualValue < min || actualValue > max) {
      errors.push(`KPI ${kpiName} (${actualValue}) out of range [${min}, ${max}]`);
    }

    this.errors.push(...errors);
    return errors.length === 0;
  }

  getErrors() {
    return this.errors;
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  reset() {
    this.errors = [];
    this.validator.reset();
  }

  // Generate report
  generateReport() {
    return {
      totalErrors: this.errors.length,
      errors: this.errors,
      validatorViolations: this.validator.getViolations()
    };
  }
}

module.exports = DataAssertions;
