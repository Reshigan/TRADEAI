const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://tradeai.gonxt.tech';
const TEST_USER = {
  email: 'admin@pomades.demo',
  password: 'Demo@123'
};

test.describe('Calculation Accuracy Tests', () => {
  let authToken;
  let page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    
    console.log('🔐 Setting up authentication...');
    const loginResponse = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: TEST_USER
    });
    
    const loginData = await loginResponse.json();
    if (loginData.success && loginData.token) {
      authToken = loginData.token;
      await context.addCookies([{
        name: 'token',
        value: authToken,
        domain: new URL(BASE_URL).hostname,
        path: '/'
      }]);
      console.log('✅ Authentication successful');
    } else {
      throw new Error('Authentication failed');
    }
  });

  test.describe('Promotion Calculations', () => {
    test('should calculate percentage discount correctly', async () => {
      const listPrice = 100;
      const discountPercentage = 15;
      const expectedPromotionalPrice = listPrice * (1 - discountPercentage / 100);
      
      const response = await page.request.get(`${BASE_URL}/api/promotions`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      if (data.data && data.data.length > 0) {
        const percentageDiscountPromo = data.data.find(p => 
          p.mechanics?.discountType === 'percentage' && 
          p.mechanics?.discountValue === 15
        );
        
        if (percentageDiscountPromo) {
          console.log(`✅ Found percentage discount promotion: ${percentageDiscountPromo.name}`);
          console.log(`   Discount: ${percentageDiscountPromo.mechanics.discountValue}%`);
          
          if (percentageDiscountPromo.products && percentageDiscountPromo.products.length > 0) {
            const product = percentageDiscountPromo.products[0];
            if (product.promotionalPrice) {
              const calculatedPrice = product.listPrice * (1 - percentageDiscountPromo.mechanics.discountValue / 100);
              expect(Math.abs(product.promotionalPrice - calculatedPrice)).toBeLessThan(0.01);
              console.log(`   ✅ Promotional price calculation verified: ${product.promotionalPrice}`);
            }
          }
        }
      }
    });

    test('should calculate fixed amount discount correctly', async () => {
      const listPrice = 100;
      const discountAmount = 10;
      const expectedPromotionalPrice = listPrice - discountAmount;
      
      const response = await page.request.get(`${BASE_URL}/api/promotions`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      if (data.data && data.data.length > 0) {
        const fixedDiscountPromo = data.data.find(p => 
          p.mechanics?.discountType === 'fixed' && 
          p.mechanics?.discountValue === 10
        );
        
        if (fixedDiscountPromo) {
          console.log(`✅ Found fixed discount promotion: ${fixedDiscountPromo.name}`);
          console.log(`   Discount: R${fixedDiscountPromo.mechanics.discountValue}`);
          
          if (fixedDiscountPromo.products && fixedDiscountPromo.products.length > 0) {
            const product = fixedDiscountPromo.products[0];
            if (product.promotionalPrice) {
              const calculatedPrice = product.listPrice - fixedDiscountPromo.mechanics.discountValue;
              expect(Math.abs(product.promotionalPrice - calculatedPrice)).toBeLessThan(0.01);
              console.log(`   ✅ Promotional price calculation verified: ${product.promotionalPrice}`);
            }
          }
        }
      }
    });

    test('should calculate ROI correctly', async () => {
      const response = await page.request.get(`${BASE_URL}/api/promotions`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      if (data.data && data.data.length > 0) {
        for (const promo of data.data) {
          if (promo.financial?.profitability?.roi !== undefined && 
              promo.financial?.profitability?.netProfit !== undefined &&
              promo.financial?.costs?.totalCost !== undefined) {
            
            const expectedROI = promo.financial.costs.totalCost > 0 
              ? (promo.financial.profitability.netProfit / promo.financial.costs.totalCost) * 100 
              : 0;
            
            expect(Math.abs(promo.financial.profitability.roi - expectedROI)).toBeLessThan(0.01);
            console.log(`✅ ROI calculation verified for ${promo.name}: ${promo.financial.profitability.roi.toFixed(2)}%`);
          }
        }
      }
    });

    test('should calculate incremental revenue correctly', async () => {
      const response = await page.request.get(`${BASE_URL}/api/promotions`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      if (data.data && data.data.length > 0) {
        for (const promo of data.data) {
          if (promo.financial?.actual?.incrementalRevenue !== undefined &&
              promo.financial?.actual?.promotionalRevenue !== undefined &&
              promo.financial?.baseline?.revenue !== undefined) {
            
            const expectedIncrementalRevenue = 
              promo.financial.actual.promotionalRevenue - promo.financial.baseline.revenue;
            
            expect(Math.abs(promo.financial.actual.incrementalRevenue - expectedIncrementalRevenue)).toBeLessThan(0.01);
            console.log(`✅ Incremental revenue calculation verified for ${promo.name}: R${promo.financial.actual.incrementalRevenue.toFixed(2)}`);
          }
        }
      }
    });

    test('should calculate net profit correctly', async () => {
      const response = await page.request.get(`${BASE_URL}/api/promotions`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      if (data.data && data.data.length > 0) {
        for (const promo of data.data) {
          if (promo.financial?.profitability?.netProfit !== undefined &&
              promo.financial?.actual?.incrementalRevenue !== undefined &&
              promo.financial?.costs?.totalCost !== undefined) {
            
            const expectedNetProfit = 
              promo.financial.actual.incrementalRevenue - promo.financial.costs.totalCost;
            
            expect(Math.abs(promo.financial.profitability.netProfit - expectedNetProfit)).toBeLessThan(0.01);
            console.log(`✅ Net profit calculation verified for ${promo.name}: R${promo.financial.profitability.netProfit.toFixed(2)}`);
          }
        }
      }
    });
  });

  test.describe('Budget Calculations', () => {
    test('should calculate budget remaining correctly', async () => {
      const response = await page.request.get(`${BASE_URL}/api/budgets`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      if (data.data && data.data.length > 0) {
        for (const budget of data.data) {
          if (budget.allocated !== undefined && 
              budget.spent !== undefined && 
              budget.remaining !== undefined) {
            
            const expectedRemaining = budget.allocated - budget.spent;
            
            expect(Math.abs(budget.remaining - expectedRemaining)).toBeLessThan(0.01);
            console.log(`✅ Budget remaining calculation verified for ${budget.name}: R${budget.remaining.toFixed(2)}`);
          }
        }
      }
    });

    test('should calculate annual totals correctly', async () => {
      const response = await page.request.get(`${BASE_URL}/api/budgets`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      if (data.data && data.data.length > 0) {
        for (const budget of data.data) {
          if (budget.budgetLines && budget.budgetLines.length > 0 && budget.annualTotals) {
            let calculatedSalesTotal = 0;
            let calculatedTradeSpendTotal = 0;
            
            for (const line of budget.budgetLines) {
              if (line.sales?.value) {
                calculatedSalesTotal += line.sales.value;
              }
              if (line.tradeSpend) {
                calculatedTradeSpendTotal += 
                  (line.tradeSpend.marketing?.budget || 0) +
                  (line.tradeSpend.cashCoop?.budget || 0) +
                  (line.tradeSpend.tradingTerms?.budget || 0) +
                  (line.tradeSpend.promotions?.budget || 0);
              }
            }
            
            if (budget.annualTotals.sales?.value !== undefined) {
              expect(Math.abs(budget.annualTotals.sales.value - calculatedSalesTotal)).toBeLessThan(0.01);
              console.log(`✅ Annual sales total verified for ${budget.name}: R${budget.annualTotals.sales.value.toFixed(2)}`);
            }
            
            if (budget.annualTotals.tradeSpend?.total !== undefined) {
              expect(Math.abs(budget.annualTotals.tradeSpend.total - calculatedTradeSpendTotal)).toBeLessThan(0.01);
              console.log(`✅ Annual trade spend total verified for ${budget.name}: R${budget.annualTotals.tradeSpend.total.toFixed(2)}`);
            }
          }
        }
      }
    });

    test('should calculate budget ROI correctly', async () => {
      const response = await page.request.get(`${BASE_URL}/api/budgets`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      if (data.data && data.data.length > 0) {
        for (const budget of data.data) {
          if (budget.annualTotals?.profitability?.roi !== undefined &&
              budget.annualTotals?.sales?.value !== undefined &&
              budget.annualTotals?.tradeSpend?.total !== undefined) {
            
            const expectedROI = budget.annualTotals.tradeSpend.total > 0
              ? ((budget.annualTotals.sales.value - budget.annualTotals.tradeSpend.total) / budget.annualTotals.tradeSpend.total) * 100
              : 0;
            
            expect(Math.abs(budget.annualTotals.profitability.roi - expectedROI)).toBeLessThan(0.01);
            console.log(`✅ Budget ROI calculation verified for ${budget.name}: ${budget.annualTotals.profitability.roi.toFixed(2)}%`);
          }
        }
      }
    });
  });

  test.describe('Product Pricing Calculations', () => {
    test('should calculate margin correctly', async () => {
      const response = await page.request.get(`${BASE_URL}/api/products`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      if (data.data && data.data.length > 0) {
        for (const product of data.data) {
          if (product.pricing?.listPrice !== undefined && 
              product.pricing?.costPrice !== undefined) {
            
            const expectedMargin = product.pricing.listPrice > 0
              ? ((product.pricing.listPrice - product.pricing.costPrice) / product.pricing.listPrice) * 100
              : 0;
            
            if (product.pricing.margin !== undefined) {
              expect(Math.abs(product.pricing.margin - expectedMargin)).toBeLessThan(0.01);
              console.log(`✅ Margin calculation verified for ${product.name}: ${product.pricing.margin.toFixed(2)}%`);
            }
          }
        }
      }
    });

    test('should calculate markup correctly', async () => {
      const response = await page.request.get(`${BASE_URL}/api/products`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      if (data.data && data.data.length > 0) {
        for (const product of data.data) {
          if (product.pricing?.listPrice !== undefined && 
              product.pricing?.costPrice !== undefined) {
            
            const expectedMarkup = product.pricing.costPrice > 0
              ? ((product.pricing.listPrice - product.pricing.costPrice) / product.pricing.costPrice) * 100
              : 0;
            
            if (product.pricing.markup !== undefined) {
              expect(Math.abs(product.pricing.markup - expectedMarkup)).toBeLessThan(0.01);
              console.log(`✅ Markup calculation verified for ${product.name}: ${product.pricing.markup.toFixed(2)}%`);
            }
          }
        }
      }
    });
  });

  test.describe('Volume and Uplift Calculations', () => {
    test('should calculate incremental volume correctly', async () => {
      const response = await page.request.get(`${BASE_URL}/api/promotions`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      if (data.data && data.data.length > 0) {
        for (const promo of data.data) {
          if (promo.performance?.metrics?.incrementalVolume !== undefined &&
              promo.performance?.promotion?.volume !== undefined &&
              promo.performance?.baseline?.volume !== undefined) {
            
            const expectedIncrementalVolume = 
              promo.performance.promotion.volume - promo.performance.baseline.volume;
            
            expect(Math.abs(promo.performance.metrics.incrementalVolume - expectedIncrementalVolume)).toBeLessThan(0.01);
            console.log(`✅ Incremental volume calculation verified for ${promo.name}: ${promo.performance.metrics.incrementalVolume.toFixed(2)} units`);
          }
        }
      }
    });

    test('should calculate volume lift percentage correctly', async () => {
      const response = await page.request.get(`${BASE_URL}/api/promotions`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      if (data.data && data.data.length > 0) {
        for (const promo of data.data) {
          if (promo.performance?.metrics?.volumeLift !== undefined &&
              promo.performance?.metrics?.incrementalVolume !== undefined &&
              promo.performance?.baseline?.volume !== undefined) {
            
            const expectedVolumeLift = promo.performance.baseline.volume > 0
              ? (promo.performance.metrics.incrementalVolume / promo.performance.baseline.volume) * 100
              : 0;
            
            expect(Math.abs(promo.performance.metrics.volumeLift - expectedVolumeLift)).toBeLessThan(0.01);
            console.log(`✅ Volume lift calculation verified for ${promo.name}: ${promo.performance.metrics.volumeLift.toFixed(2)}%`);
          }
        }
      }
    });
  });
});
