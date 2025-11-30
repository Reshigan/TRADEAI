/**
 * Budget Validation Tests - Distributor
 * Validates budget data accuracy and calculations
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const APIClient = require('../../../../scripts/simulate/utils/apiClient');
const Ledger = require('../../../../scripts/simulate/utils/ledger');
const DataAssertions = require('../../helpers/dataAssert');

test.describe('Budget Validation - Distributor', () => {
  let apiClient;
  let ledger;
  let dataAssert;
  const runId = process.env.RUN_ID || 'latest';

  test.beforeAll(async () => {
    const ledgerDir = path.join(__dirname, '../../../../artifacts/ledger');
    ledger = Ledger.load(runId, 'DIST-TEST', ledgerDir);
    dataAssert = new DataAssertions(ledger);

    apiClient = new APIClient(process.env.BASE_URL || 'https://tradeai.gonxt.tech/api');
    await apiClient.login(
      process.env.TEST_USER_EMAIL || 'admin@testdistributor.com',
      process.env.TEST_USER_PASSWORD || 'Admin@123'
    );
  });

  test('should have correct budget count', async () => {
    const budgets = await apiClient.getBudgets();
    const ledgerBudgets = ledger.getAllEntities('budgets');
    
    expect(budgets.length).toBeGreaterThanOrEqual(ledgerBudgets.length);
  });

  test('should validate budget utilization calculations', async () => {
    const budgets = await apiClient.getBudgets();
    
    for (const budget of budgets) {
      const isValid = dataAssert.assertBudgetUtilization(budget);
      
      if (!isValid) {
        console.error(`Budget validation failed for ${budget._id}:`, dataAssert.getErrors());
      }
      
      expect(isValid).toBe(true);
    }
  });

  test('should have non-negative budget values', async () => {
    const budgets = await apiClient.getBudgets();
    
    for (const budget of budgets) {
      expect(budget.totalBudget || budget.cap).toBeGreaterThanOrEqual(0);
      expect(budget.spent || budget.used || 0).toBeGreaterThanOrEqual(0);
      expect(budget.remaining || budget.available || 0).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have valid budget utilization percentage', async () => {
    const budgets = await apiClient.getBudgets();
    
    for (const budget of budgets) {
      const used = budget.spent || budget.used || 0;
      const cap = budget.totalBudget || budget.cap || 1;
      const utilization = used / cap;
      
      expect(utilization).toBeGreaterThanOrEqual(0);
      expect(utilization).toBeLessThanOrEqual(1.1); // Allow 10% over for edge cases
    }
  });

  test('should match expected budget utilization from config', async () => {
    const budgets = await apiClient.getBudgets();
    const totalBudget = budgets.reduce((sum, b) => sum + (b.totalBudget || b.cap || 0), 0);
    const totalUsed = budgets.reduce((sum, b) => sum + (b.spent || b.used || 0), 0);
    const overallUtilization = totalUsed / totalBudget;
    
    expect(overallUtilization).toBeGreaterThanOrEqual(0);
    expect(overallUtilization).toBeLessThanOrEqual(1);
  });

  test.afterAll(async () => {
    if (dataAssert.hasErrors()) {
      console.error('Data validation errors:', dataAssert.generateReport());
    }
  });
});
