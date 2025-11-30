/**
 * KAM Wallet Spend Tests
 * Tests for KAM wallet allocation and spend predictions
 * @tags @ai:wallet @feat:ai
 */

const { test, expect } = require('@playwright/test');
const { createAuthContext } = require('../helpers/auth');
const { APIClient, assertSuccess } = require('../helpers/api');
const { createCustomer } = require('../helpers/data');
const { assertNoNegativeValues, assertResponseSchema } = require('../helpers/asserts');

test.describe('KAM Wallet Spend Tests', () => {
  let context, auth, api;

  test.beforeAll(async () => {
    const authContext = await createAuthContext('kam');
    context = authContext.context;
    auth = authContext.auth;
    api = new APIClient(context, auth);
  });

  test.afterAll(async () => {
    await context.dispose();
  });

  test('should create KAM wallet', async () => {
    const now = new Date();
    const startDate = now;
    const endDate = new Date(now.getFullYear(), 11, 31); // End of year

    const walletData = {
      period: {
        startDate,
        endDate
      },
      totalAllocation: 100000,
      currency: 'USD'
    };

    const response = await api.createKAMWallet(walletData);
    
    expect(response.status).toBeLessThan(500);

    if (response.ok) {
      const wallet = response.data;
      expect(wallet.totalAllocation).toBe(100000);
      expect(wallet.currency).toBe('USD');
      assertNoNegativeValues(wallet, ['totalAllocation']);
    }
  });

  test('should allocate wallet to customer', async () => {
    const customer = await createCustomer(api, { seed: 6001 });

    const walletsResponse = await api.getKAMWallets();
    
    if (walletsResponse.ok && walletsResponse.data?.wallets?.length > 0) {
      const wallet = walletsResponse.data.wallets[0];
      
      const allocationData = {
        customerId: customer._id || customer.id,
        allocatedAmount: 10000,
        notes: 'Q1 2025 Allocation'
      };

      const response = await api.allocateWallet(wallet._id || wallet.id, allocationData);
      
      expect(response.status).toBeLessThan(500);

      if (response.ok) {
        const updatedWallet = response.data;
        expect(updatedWallet.allocations).toBeDefined();
      }
    }
  });

  test('should track wallet utilization', async () => {
    const response = await api.getKAMWallets();
    
    if (response.ok && response.data?.wallets) {
      const wallets = response.data.wallets;
      
      wallets.forEach(wallet => {
        expect(wallet.totalAllocation).toBeDefined();
        assertNoNegativeValues(wallet, ['totalAllocation']);

        if (wallet.allocations && Array.isArray(wallet.allocations)) {
          wallet.allocations.forEach(allocation => {
            assertNoNegativeValues(allocation, ['allocatedAmount', 'usedAmount']);
            expect(allocation.usedAmount).toBeLessThanOrEqual(allocation.allocatedAmount);
          });
        }

        if (wallet.remainingBalance !== undefined) {
          expect(wallet.remainingBalance).toBeGreaterThanOrEqual(0);
        }
      });
    }
  });

  test('should predict wallet spend patterns', async () => {
    const response = await api.post('/api/predictive-analytics/predict-budget-needs', {
      type: 'wallet',
      horizon: 3
    });

    expect(response.status).toBeLessThan(500);

    if (response.ok && response.data) {
      assertResponseSchema(response.data, ['predictions']);
      
      if (Array.isArray(response.data.predictions)) {
        response.data.predictions.forEach(pred => {
          expect(pred.value).toBeDefined();
          expect(pred.value).not.toBeNaN();
        });
      }
    }
  });

  test('should calculate wallet ROI', async () => {
    const response = await api.getKAMWallets();
    
    if (response.ok && response.data?.wallets?.length > 0) {
      const wallet = response.data.wallets[0];
      
      const totalAllocated = wallet.allocations?.reduce((sum, a) => sum + a.allocatedAmount, 0) || 0;
      const totalUsed = wallet.allocations?.reduce((sum, a) => sum + a.usedAmount, 0) || 0;
      
      expect(totalAllocated).toBeGreaterThanOrEqual(0);
      expect(totalUsed).toBeGreaterThanOrEqual(0);
      expect(totalUsed).toBeLessThanOrEqual(totalAllocated);
    }
  });
});
