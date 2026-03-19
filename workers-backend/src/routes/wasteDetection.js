import { Hono } from 'hono';
import {authMiddleware, requireMinRole } from '../middleware/auth.js';
import { getD1Client } from '../services/d1.js';
import { apiError } from '../utils/apiError.js';
import { resolveBaselineScope } from '../services/hierarchyResolver.js';

export const wasteDetectionRoutes = new Hono();
wasteDetectionRoutes.use('*', authMiddleware);

wasteDetectionRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);

    const promotions = await db.find('promotions', {
      company_id: user.companyId,
      status: 'completed'
    });

    const wastePatterns = [];
    const customerPerformance = {};
    const productPerformance = {};
    const typePerformance = {};

    for (const promo of promotions) {
      const data = typeof promo.data === 'string' ? JSON.parse(promo.data || '{}') : (promo.data || {});
      const roi = data.actualROI || data.roi || data.performance?.roi || 0;
      const uplift = data.actualUplift || data.uplift || data.performance?.uplift || 0;
      const forwardBuy = data.forwardBuyPct || 0;
      const cannibalization = data.cannibalizationPct || 0;
      const customerId = data.customerId || promo.customer_id;
      const promoType = promo.promotion_type || data.promotionType || 'unknown';

      if (customerId) {
        if (!customerPerformance[customerId]) customerPerformance[customerId] = { promos: [], totalROI: 0, losers: 0 };
        customerPerformance[customerId].promos.push({ id: promo.id, name: promo.name, roi, type: promoType });
        customerPerformance[customerId].totalROI += roi;
        if (roi < 0.5) customerPerformance[customerId].losers++;
      }

      const productIds = data.productIds || [];
      for (const pid of productIds) {
        if (!productPerformance[pid]) productPerformance[pid] = { promos: [], totalROI: 0, lowUplift: 0, forwardBuys: 0 };
        productPerformance[pid].promos.push({ id: promo.id, name: promo.name, roi, uplift, type: promoType });
        productPerformance[pid].totalROI += roi;
        if (uplift < 10) productPerformance[pid].lowUplift++;
        if (forwardBuy > 30) productPerformance[pid].forwardBuys++;
      }

      if (!typePerformance[promoType]) typePerformance[promoType] = { promos: [], totalROI: 0, count: 0 };
      typePerformance[promoType].promos.push({ id: promo.id, roi });
      typePerformance[promoType].totalROI += roi;
      typePerformance[promoType].count++;
    }

    for (const [customerId, perf] of Object.entries(customerPerformance)) {
      const count = perf.promos.length;
      if (count >= 2 && perf.losers > count * 0.5) {
        const avgROI = (perf.totalROI / count).toFixed(2);
        const bestType = perf.promos.reduce((best, p) => p.roi > (best?.roi || 0) ? p : best, null);
        wastePatterns.push({
          type: 'customer_waste',
          severity: avgROI < 0.3 ? 'critical' : 'high',
          entityId: customerId,
          entityType: 'customer',
          title: `Customer consistently underperforms`,
          description: `${perf.losers} of ${count} promotions lost money. Average ROI: ${avgROI}x.`,
          recommendation: bestType ? `STOP price discounts. ${bestType.type} promotions work better (${bestType.roi.toFixed(1)}x ROI).` : 'Consider pausing promotions for this customer.',
          impact: `Potential savings from stopping underperforming promotions`,
          dataPoints: count,
          avgROI: parseFloat(avgROI)
        });
      }
    }

    for (const [productId, perf] of Object.entries(productPerformance)) {
      const count = perf.promos.length;
      if (count >= 2 && perf.lowUplift > count * 0.5) {
        wastePatterns.push({
          type: 'product_low_uplift',
          severity: 'high',
          entityId: productId,
          entityType: 'product',
          title: `Product shows low promotion uplift`,
          description: `${perf.lowUplift} of ${count} promotions had <10% real uplift.`,
          recommendation: 'Product may have low price elasticity. Switch to loyalty or display programs.',
          dataPoints: count
        });
      }
      if (perf.forwardBuys > 0) {
        wastePatterns.push({
          type: 'forward_buy',
          severity: 'medium',
          entityId: productId,
          entityType: 'product',
          title: `Forward buying detected`,
          description: `Consumers load up during promotions — post-promo sales drop significantly.`,
          recommendation: 'STOP BOGO. Switch to loyalty program to build sustained demand.',
          dataPoints: count
        });
      }
    }

    for (const [promoType, perf] of Object.entries(typePerformance)) {
      if (perf.count >= 3) {
        const avgROI = perf.totalROI / perf.count;
        if (avgROI < 0.8) {
          wastePatterns.push({
            type: 'type_underperform',
            severity: 'medium',
            entityType: 'promotion_type',
            entityId: promoType,
            title: `${promoType} promotions underperform`,
            description: `Average ROI across ${perf.count} promotions: ${avgROI.toFixed(2)}x.`,
            recommendation: `Consider replacing ${promoType} with higher-performing promotion types.`,
            dataPoints: perf.count,
            avgROI: parseFloat(avgROI.toFixed(2))
          });
        }
      }
    }

    // Kill List: promotions that should NOT be repeated (ROI < 0.5 for 3+ consecutive periods)
    const killList = [];
    const custProdHistory = {};
    for (const promo of promotions) {
      const data = typeof promo.data === 'string' ? JSON.parse(promo.data || '{}') : (promo.data || {});
      const roi = data.actualROI || data.roi || data.performance?.roi || 0;
      const key = `${data.customerId || promo.customer_id}|${(data.productIds || [])[0] || promo.product_id || 'all'}`;
      if (!custProdHistory[key]) custProdHistory[key] = [];
      custProdHistory[key].push({ id: promo.id, name: promo.name, roi, type: promo.promotion_type || data.promotionType, date: promo.end_date || promo.created_at });
    }
    for (const [key, history] of Object.entries(custProdHistory)) {
      const sorted = history.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      let consecutiveLow = 0;
      for (const h of sorted) {
        if (h.roi < 0.5) consecutiveLow++;
        else consecutiveLow = 0;
      }
      if (consecutiveLow >= 3) {
        const [custId, prodId] = key.split('|');
        const bestType = sorted.reduce((best, h) => h.roi > (best?.roi || 0) ? h : best, null);
        killList.push({
          customerId: custId,
          productId: prodId,
          consecutiveFailures: consecutiveLow,
          lastROI: sorted[sorted.length - 1]?.roi || 0,
          recommendation: bestType ? `Try ${bestType.type} instead (best ROI: ${bestType.roi.toFixed(1)}x)` : 'Pause promotions for this combination',
          promotions: sorted.slice(-3).map(h => ({ id: h.id, name: h.name, roi: h.roi }))
        });
      }
    }

    // Diminishing Returns: promotions where each repeat shows lower uplift
    const diminishingReturns = [];
    for (const [key, history] of Object.entries(custProdHistory)) {
      if (history.length < 3) continue;
      const sorted = history.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      let declining = true;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].roi >= sorted[i - 1].roi) { declining = false; break; }
      }
      if (declining && sorted.length >= 3) {
        const [custId, prodId] = key.split('|');
        const firstROI = sorted[0].roi;
        const lastROI = sorted[sorted.length - 1].roi;
        const declinePct = firstROI > 0 ? Math.round(((firstROI - lastROI) / firstROI) * 100) : 0;
        diminishingReturns.push({
          customerId: custId,
          productId: prodId,
          periods: sorted.length,
          firstROI: firstROI.toFixed(2),
          lastROI: lastROI.toFixed(2),
          declinePct,
          trend: sorted.map(h => ({ name: h.name, roi: h.roi }))
        });
      }
    }

    wastePatterns.sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 };
      return (sev[a.severity] || 3) - (sev[b.severity] || 3);
    });

    const totalWaste = wastePatterns.length;
    const criticalCount = wastePatterns.filter(w => w.severity === 'critical').length;

    return c.json({
      success: true,
      data: {
        patterns: wastePatterns,
        killList,
        diminishingReturns,
        summary: {
          totalPatterns: totalWaste,
          critical: criticalCount,
          high: wastePatterns.filter(w => w.severity === 'high').length,
          medium: wastePatterns.filter(w => w.severity === 'medium').length,
          analyzedPromotions: promotions.length,
          killListCount: killList.length,
          diminishingCount: diminishingReturns.length
        },
        overallRating: criticalCount > 0 ? 'needs_attention' : totalWaste > 3 ? 'review_recommended' : 'healthy',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Waste detection error:', error);
    return apiError(c, error, 'wasteDetection');
  }
});

wasteDetectionRoutes.get('/summary', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    const promotions = await db.find('promotions', { company_id: user.companyId, status: 'completed' });
    let losers = 0;
    let totalROI = 0;
    for (const p of promotions) {
      const data = typeof p.data === 'string' ? JSON.parse(p.data || '{}') : (p.data || {});
      const roi = data.actualROI || data.roi || data.performance?.roi || 0;
      totalROI += roi;
      if (roi < 0.5) losers++;
    }
    const avgROI = promotions.length > 0 ? (totalROI / promotions.length).toFixed(2) : 0;
    return c.json({
      success: true,
      data: {
        totalCompleted: promotions.length,
        underperformers: losers,
        avgROI: parseFloat(avgROI),
        wastePercentage: promotions.length > 0 ? Math.round((losers / promotions.length) * 100) : 0
      }
    });
  } catch (error) {
    return apiError(c, error, 'wasteDetection');
  }
});
