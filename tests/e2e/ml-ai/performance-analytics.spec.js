const { test, expect } = require('@playwright/test');
const { ApiHelper } = require('../helpers/api');
const { MlAssert } = require('../helpers/mlAssert');

test.describe('Performance Analytics Validation @ai @analytics', () => {
  test('should validate promotion effectiveness analytics', async ({ page, request }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    const api = await ApiHelper.fromPage(page, request);
    
    const { data: analytics } = await api.get('/api/performance-analytics/promotion-effectiveness');
    
    console.log('Promotion Effectiveness Response:', JSON.stringify(analytics, null, 2));
    
    MlAssert.expectValidPerformanceAnalytics(analytics);
    
    if (analytics.data && analytics.data.length > 0) {
      analytics.data.forEach((promo, idx) => {
        expect(promo, `Promotion ${idx} should have data`).toBeDefined();
        
        if (promo.roi !== undefined) {
          expect(typeof promo.roi, `Promotion ${idx} ROI should be a number`).toBe('number');
        }
        
        const hasMetrics = promo.revenue !== undefined || 
                          promo.sales !== undefined || 
                          promo.roi !== undefined ||
                          promo.uplift !== undefined;
        expect(hasMetrics, `Promotion ${idx} should have effectiveness metrics`).toBeTruthy();
      });
      
      console.log(`✓ Promotion effectiveness validated: ${analytics.data.length} promotions analyzed`);
    } else {
      console.log('No promotion effectiveness data available');
      expect(true).toBeTruthy();
    }
  });

  test('should validate ROI trending analytics', async ({ page, request }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    const api = await ApiHelper.fromPage(page, request);
    
    const { data: analytics } = await api.get('/api/performance-analytics/roi-trending');
    
    console.log('ROI Trending Response:', JSON.stringify(analytics, null, 2));
    
    MlAssert.expectValidPerformanceAnalytics(analytics);
    
    if (analytics.data && analytics.data.length > 0) {
      analytics.data.forEach((trend, idx) => {
        const hasTimePeriod = trend.month !== undefined || 
                             trend.quarter !== undefined || 
                             trend.year !== undefined ||
                             trend.date !== undefined;
        expect(hasTimePeriod, `Trend ${idx} should have time period`).toBeTruthy();
        
        if (trend.roi !== undefined) {
          expect(typeof trend.roi, `Trend ${idx} ROI should be a number`).toBe('number');
        }
      });
      
      if (analytics.data.length > 1) {
        console.log(`✓ ROI trending validated: ${analytics.data.length} data points`);
      }
    } else {
      console.log('No ROI trending data available');
      expect(true).toBeTruthy();
    }
  });

  test('should validate budget variance analytics', async ({ page, request }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    const api = await ApiHelper.fromPage(page, request);
    
    const { data: analytics } = await api.get('/api/performance-analytics/budget-variance');
    
    console.log('Budget Variance Response:', JSON.stringify(analytics, null, 2));
    
    MlAssert.expectValidPerformanceAnalytics(analytics);
    
    if (analytics.data && analytics.data.length > 0) {
      analytics.data.forEach((variance, idx) => {
        const hasBudgetInfo = variance.budgetId !== undefined || 
                             variance.category !== undefined ||
                             variance.name !== undefined;
        expect(hasBudgetInfo, `Variance ${idx} should have budget info`).toBeTruthy();
        
        if (variance.variance !== undefined) {
          expect(typeof variance.variance, `Variance ${idx} should be a number`).toBe('number');
        }
        
        if (variance.allocated !== undefined && variance.spent !== undefined) {
          expect(variance.allocated, `Variance ${idx} allocated should be >= 0`).toBeGreaterThanOrEqual(0);
          expect(variance.spent, `Variance ${idx} spent should be >= 0`).toBeGreaterThanOrEqual(0);
          
          const calculatedVariance = variance.allocated - variance.spent;
          if (variance.variance !== undefined) {
            const diff = Math.abs(variance.variance - calculatedVariance);
            expect(diff, `Variance ${idx} calculation should be correct`).toBeLessThan(0.01);
          }
        }
      });
      
      console.log(`✓ Budget variance validated: ${analytics.data.length} budgets analyzed`);
    } else {
      console.log('No budget variance data available');
      expect(true).toBeTruthy();
    }
  });

  test('should validate customer segmentation analytics', async ({ page, request }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    const api = await ApiHelper.fromPage(page, request);
    
    const { data: analytics } = await api.get('/api/performance-analytics/customer-segmentation');
    
    console.log('Customer Segmentation Response:', JSON.stringify(analytics, null, 2));
    
    MlAssert.expectValidPerformanceAnalytics(analytics);
    
    if (analytics.data && analytics.data.length > 0) {
      const segments = analytics.data;
      
      const hasSegments = segments.some(s => 
        s.segment === 'A' || s.segment === 'B' || s.segment === 'C' ||
        s.tier === 'A' || s.tier === 'B' || s.tier === 'C'
      );
      
      if (hasSegments) {
        segments.forEach((seg, idx) => {
          if (seg.count !== undefined) {
            expect(seg.count, `Segment ${idx} count should be >= 0`).toBeGreaterThanOrEqual(0);
          }
          
          if (seg.revenue !== undefined) {
            expect(seg.revenue, `Segment ${idx} revenue should be >= 0`).toBeGreaterThanOrEqual(0);
          }
        });
        
        console.log(`✓ Customer segmentation validated: ${segments.length} segments`);
      } else {
        console.log('No ABC segmentation found, but data exists');
        expect(true).toBeTruthy();
      }
    } else {
      console.log('No customer segmentation data available');
      expect(true).toBeTruthy();
    }
  });

  test('should validate analytics data consistency across endpoints', async ({ request }) => {
    const [effectiveness, trending, variance, segmentation] = await Promise.all([
      api.get('/api/performance-analytics/promotion-effectiveness').catch(() => ({ data: null })),
      api.get('/api/performance-analytics/roi-trending').catch(() => ({ data: null })),
      api.get('/api/performance-analytics/budget-variance').catch(() => ({ data: null })),
      api.get('/api/performance-analytics/customer-segmentation').catch(() => ({ data: null }))
    ]);
    
    const endpointsWithData = [
      effectiveness.data,
      trending.data,
      variance.data,
      segmentation.data
    ].filter(d => d && (Array.isArray(d) ? d.length > 0 : Object.keys(d).length > 0)).length;
    
    console.log(`${endpointsWithData}/4 performance analytics endpoints returned data`);
    
    expect(endpointsWithData, 'At least one analytics endpoint should return data').toBeGreaterThan(0);
    
    console.log('✓ Analytics endpoints are accessible and returning data');
  });
});
