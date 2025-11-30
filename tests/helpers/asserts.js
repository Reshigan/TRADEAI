/**
 * Assertion Helper
 * Ledger invariants and KPI validation
 */

const { expect } = require('@playwright/test');

/**
 * Assert budget utilization is calculated correctly
 * Budget Utilization = (Total Allocated to Promotions) / (Total Budget)
 */
function assertBudgetUtilization(budgets, promotions) {
  const totalBudget = budgets.reduce((sum, b) => sum + (b.totalBudget || 0), 0);
  const totalAllocated = promotions.reduce((sum, p) => sum + (p.budget?.allocated || 0), 0);
  
  const expectedUtilization = totalBudget > 0 ? totalAllocated / totalBudget : 0;
  
  expect(expectedUtilization, 'Budget utilization should be between 0 and 1').toBeGreaterThanOrEqual(0);
  expect(expectedUtilization, 'Budget utilization should not exceed 100%').toBeLessThanOrEqual(1);
  
  return expectedUtilization;
}

/**
 * Assert revenue is calculated correctly
 * Revenue = Sum of all transaction totals
 */
function assertRevenue(transactions) {
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.totals?.total || 0), 0);
  
  expect(totalRevenue, 'Revenue should be non-negative').toBeGreaterThanOrEqual(0);
  expect(totalRevenue, 'Revenue should not be NaN').not.toBeNaN();
  
  return totalRevenue;
}

/**
 * Assert no negative values in financial data
 */
function assertNoNegativeValues(entity, fields) {
  fields.forEach(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], entity);
    if (value !== undefined && value !== null) {
      expect(value, `${field} should not be negative`).toBeGreaterThanOrEqual(0);
    }
  });
}

/**
 * Assert date ranges are valid
 */
function assertValidDateRange(startDate, endDate, message = 'Date range should be valid') {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  expect(start.getTime(), `${message}: start date should be valid`).not.toBeNaN();
  expect(end.getTime(), `${message}: end date should be valid`).not.toBeNaN();
  expect(start.getTime(), `${message}: start should be before end`).toBeLessThanOrEqual(end.getTime());
}

/**
 * Assert promotion budget does not exceed total budget
 */
function assertPromotionBudgetConstraints(promotion, budget) {
  const allocated = promotion.budget?.allocated || 0;
  const totalBudget = budget.totalBudget || 0;
  
  expect(allocated, 'Promotion allocation should not exceed total budget').toBeLessThanOrEqual(totalBudget);
  expect(allocated, 'Promotion allocation should be non-negative').toBeGreaterThanOrEqual(0);
}

/**
 * Assert transaction totals are calculated correctly
 */
function assertTransactionTotals(transaction) {
  const { quantity, unitPrice, totals } = transaction;
  
  if (quantity && unitPrice && totals) {
    const expectedSubtotal = quantity * unitPrice;
    const expectedTotal = totals.subtotal - totals.discount + totals.tax;
    
    expect(Math.abs(totals.subtotal - expectedSubtotal), 'Subtotal should match quantity * unitPrice').toBeLessThan(0.01);
    expect(Math.abs(totals.total - expectedTotal), 'Total should match subtotal - discount + tax').toBeLessThan(0.01);
  }
}

/**
 * Assert KPI values are within reasonable bounds
 */
function assertKPIBounds(kpis) {
  if (kpis.budgetUtilization !== undefined) {
    expect(kpis.budgetUtilization, 'Budget utilization should be between 0 and 100').toBeGreaterThanOrEqual(0);
    expect(kpis.budgetUtilization, 'Budget utilization should be between 0 and 100').toBeLessThanOrEqual(100);
  }
  
  if (kpis.roi !== undefined) {
    expect(kpis.roi, 'ROI should not be NaN').not.toBeNaN();
  }
  
  if (kpis.revenue !== undefined) {
    expect(kpis.revenue, 'Revenue should be non-negative').toBeGreaterThanOrEqual(0);
    expect(kpis.revenue, 'Revenue should not be NaN').not.toBeNaN();
  }
}

/**
 * Assert response schema matches expected structure
 */
function assertResponseSchema(response, expectedFields) {
  expectedFields.forEach(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], response);
    expect(value, `Field ${field} should exist in response`).toBeDefined();
  });
}

/**
 * Assert AI/ML prediction response schema
 */
function assertPredictionSchema(prediction) {
  assertResponseSchema(prediction, [
    'predictions',
    'confidence',
    'modelVersion'
  ]);
  
  if (Array.isArray(prediction.predictions)) {
    prediction.predictions.forEach((pred, idx) => {
      expect(pred.value, `Prediction ${idx} should have a value`).toBeDefined();
      expect(pred.confidence, `Prediction ${idx} should have confidence`).toBeDefined();
      expect(pred.confidence, `Prediction ${idx} confidence should be between 0 and 1`).toBeGreaterThanOrEqual(0);
      expect(pred.confidence, `Prediction ${idx} confidence should be between 0 and 1`).toBeLessThanOrEqual(1);
    });
  }
}

/**
 * Assert AI suggestions response schema
 */
function assertSuggestionsSchema(suggestions) {
  expect(Array.isArray(suggestions), 'Suggestions should be an array').toBeTruthy();
  
  suggestions.forEach((suggestion, idx) => {
    expect(suggestion.score, `Suggestion ${idx} should have a score`).toBeDefined();
    expect(suggestion.score, `Suggestion ${idx} score should be between 0 and 1`).toBeGreaterThanOrEqual(0);
    expect(suggestion.score, `Suggestion ${idx} score should be between 0 and 1`).toBeLessThanOrEqual(1);
    expect(suggestion.action || suggestion.recommendation, `Suggestion ${idx} should have an action or recommendation`).toBeDefined();
  });
}

/**
 * Assert tenant isolation - user should only see their tenant's data
 */
function assertTenantIsolation(entities, expectedTenantId) {
  entities.forEach((entity, idx) => {
    const tenantId = entity.tenantId || entity.companyId || entity.company;
    if (tenantId) {
      expect(tenantId.toString(), `Entity ${idx} should belong to tenant ${expectedTenantId}`).toBe(expectedTenantId.toString());
    }
  });
}

module.exports = {
  assertBudgetUtilization,
  assertRevenue,
  assertNoNegativeValues,
  assertValidDateRange,
  assertPromotionBudgetConstraints,
  assertTransactionTotals,
  assertKPIBounds,
  assertResponseSchema,
  assertPredictionSchema,
  assertSuggestionsSchema,
  assertTenantIsolation
};
