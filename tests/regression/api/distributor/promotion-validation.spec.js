/**
 * Promotion Validation Tests - Distributor
 * Validates promotion data accuracy and calculations
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const APIClient = require('../../../../scripts/simulate/utils/apiClient');
const Ledger = require('../../../../scripts/simulate/utils/ledger');
const DataAssertions = require('../../helpers/dataAssert');

test.describe('Promotion Validation - Distributor', () => {
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

  test('should have correct promotion count', async () => {
    const promotions = await apiClient.getPromotions();
    const ledgerPromotions = ledger.getAllEntities('promotions');
    
    expect(promotions.length).toBeGreaterThanOrEqual(ledgerPromotions.length);
  });

  test('should validate promotion date ranges', async () => {
    const promotions = await apiClient.getPromotions();
    
    for (const promotion of promotions) {
      const startDate = new Date(promotion.startDate);
      const endDate = new Date(promotion.endDate);
      
      expect(startDate.getTime()).toBeLessThan(endDate.getTime());
    }
  });

  test('should have non-negative promotion values', async () => {
    const promotions = await apiClient.getPromotions();
    
    for (const promotion of promotions) {
      if (promotion.netSpend !== undefined) {
        expect(promotion.netSpend).toBeGreaterThanOrEqual(0);
      }
      
      if (promotion.actualUnits !== undefined) {
        expect(promotion.actualUnits).toBeGreaterThanOrEqual(0);
      }
      
      if (promotion.estimatedUnits !== undefined) {
        expect(promotion.estimatedUnits).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should validate promotion data integrity', async () => {
    const promotions = await apiClient.getPromotions();
    
    for (const promotion of promotions) {
      const isValid = dataAssert.assertPromotionData(promotion);
      
      if (!isValid) {
        console.error(`Promotion validation failed for ${promotion._id}:`, dataAssert.getErrors());
      }
      
      expect(isValid).toBe(true);
    }
  });

  test('should have valid promotion types', async () => {
    const promotions = await apiClient.getPromotions();
    const validTypes = ['Price Reduction', 'BOGOF', 'Volume Discount', 'Bundle Deal', 'Seasonal Special'];
    
    for (const promotion of promotions) {
      if (promotion.type) {
        expect(validTypes).toContain(promotion.type);
      }
    }
  });

  test.afterAll(async () => {
    if (dataAssert.hasErrors()) {
      console.error('Data validation errors:', dataAssert.generateReport());
    }
  });
});
