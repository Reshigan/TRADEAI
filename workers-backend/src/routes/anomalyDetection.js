import { Hono } from 'hono';
import {authMiddleware, requireMinRole } from '../middleware/auth.js';
import { getD1Client } from '../services/d1.js';
import { apiError } from '../utils/apiError.js';
import { resolveBaselineScope } from '../services/hierarchyResolver.js';

const anomalyDetectionRoutes = new Hono();
anomalyDetectionRoutes.use('*', authMiddleware);

anomalyDetectionRoutes.get('/scan', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);

    const [budgets, tradeSpends, claims, deductions, promotions] = await Promise.all([
      db.find('budgets', { company_id: user.companyId }),
      db.find('trade_spends', { company_id: user.companyId }),
      db.find('claims', { company_id: user.companyId }),
      db.find('deductions', { company_id: user.companyId }),
      db.find('promotions', { company_id: user.companyId })
    ]);

    const anomalies = [];

    // Hierarchy-aware baseline resolution for anomaly threshold calibration
    let baselineContext = null;
    try {
      const resolved = await resolveBaselineScope(c.env.DB, user.companyId, {});
      if (resolved && resolved.baseline) {
        baselineContext = {
          baseVolume: resolved.baseline.total_base_volume || 0,
          baseRevenue: resolved.baseline.total_base_revenue || 0,
          avgWeeklyVolume: resolved.baseline.avg_weekly_volume || 0,
          source: resolved.source
        };
      }
    } catch (e) { /* no baseline available */ }

    const overBudgets = budgets.filter(b => { const amt = parseFloat(b.amount); const util = parseFloat(b.utilized); return isFinite(amt) && amt > 0 && isFinite(util) && util > amt; });
    overBudgets.forEach(b => {
      anomalies.push({
        id: `anom-budget-${b.id}`,
        type: 'budget_overrun',
        severity: 'critical',
        entity: 'budget',
        entityId: b.id,
        entityName: b.name,
        title: `Budget overrun: ${b.name}`,
        description: `Utilized R${(parseFloat(b.utilized) || 0).toLocaleString()} exceeds allocated R${(parseFloat(b.amount) || 0).toLocaleString()} by R${((parseFloat(b.utilized) || 0) - (parseFloat(b.amount) || 0)).toLocaleString()}`,
        action: `/budgets/${b.id}`
      });
    });

    const claimAmt = (cl) => { const n = parseFloat(cl.amount || cl.claimed_amount || cl.claimedAmount); return isFinite(n) ? n : 0; };
    const avgClaimAmt = claims.length > 0 ? claims.reduce((s, cl) => s + claimAmt(cl), 0) / claims.length : 0;
    const stdDev = claims.length > 1 ? Math.sqrt(claims.reduce((s, cl) => { const a = claimAmt(cl); return s + Math.pow(a - avgClaimAmt, 2); }, 0) / claims.length) : avgClaimAmt * 0.5;
    claims.forEach(cl => {
      const amt = claimAmt(cl);
      if (amt > avgClaimAmt + 2 * stdDev && amt > 10000) {
        anomalies.push({
          id: `anom-claim-${cl.id}`,
          type: 'unusual_amount',
          severity: 'high',
          entity: 'claim',
          entityId: cl.id,
          entityName: `Claim ${cl.id.slice(-8)}`,
          title: `Unusually high claim: R${amt.toLocaleString()}`,
          description: `This claim is ${((amt / avgClaimAmt) * 100 - 100).toFixed(0)}% above the average claim amount of R${Math.round(avgClaimAmt).toLocaleString()}`,
          action: `/claims/${cl.id}`
        });
      }
    });

    const claimsByCustomer = {};
    claims.forEach(cl => {
      const cid = cl.customer_id || cl.customerId;
      if (cid) {
        if (!claimsByCustomer[cid]) claimsByCustomer[cid] = [];
        claimsByCustomer[cid].push(cl);
      }
    });
    Object.entries(claimsByCustomer).forEach(([cid, custClaims]) => {
      if (custClaims.length >= 5) {
        const total = custClaims.reduce((s, cl) => s + claimAmt(cl), 0);
        anomalies.push({
          id: `anom-freq-${cid}`,
          type: 'high_frequency',
          severity: 'medium',
          entity: 'customer',
          entityId: cid,
          entityName: `Customer ${cid.slice(-8)}`,
          title: `High claim frequency: ${custClaims.length} claims`,
          description: `Customer has ${custClaims.length} claims totalling R${total.toLocaleString()} — investigate for potential abuse`,
          action: `/customers/${cid}`
        });
      }
    });

    const spendAmt = (ts) => { const n = parseFloat(ts.amount); return isFinite(n) ? n : 0; };
    const spendAmounts = tradeSpends.map(ts => spendAmt(ts)).filter(a => a > 0);
    const avgSpend = spendAmounts.length > 0 ? spendAmounts.reduce((a, b) => a + b, 0) / spendAmounts.length : 0;
    tradeSpends.forEach(ts => {
      const tsAmt = spendAmt(ts);
      if (tsAmt > avgSpend * 3 && tsAmt > 50000) {
        anomalies.push({
          id: `anom-spend-${ts.id}`,
          type: 'unusual_spend',
          severity: 'high',
          entity: 'trade_spend',
          entityId: ts.id,
          entityName: ts.description || `Trade Spend ${ts.id.slice(-8)}`,
          title: `Unusual trade spend: R${tsAmt.toLocaleString()}`,
          description: `${((tsAmt / avgSpend) * 100).toFixed(0)}% above average spend of R${Math.round(avgSpend).toLocaleString()}`,
          action: `/trade-spends/${ts.id}`
        });
      }
    });

    const activePromos = promotions.filter(p => p.status === 'active');
    for (let i = 0; i < activePromos.length; i++) {
      for (let j = i + 1; j < activePromos.length; j++) {
        const a = activePromos[i];
        const b = activePromos[j];
        const aData = typeof a.data === 'string' ? JSON.parse(a.data || '{}') : (a.data || {});
        const bData = typeof b.data === 'string' ? JSON.parse(b.data || '{}') : (b.data || {});
        if (aData.customerId && aData.customerId === bData.customerId) {
          anomalies.push({
            id: `anom-overlap-${a.id}-${b.id}`,
            type: 'promotion_overlap',
            severity: 'medium',
            entity: 'promotion',
            entityId: a.id,
            entityName: a.name,
            title: `Overlapping promotions for same customer`,
            description: `"${a.name}" and "${b.name}" are both active for the same customer — may cause cannibalization`,
            action: `/promotions/${a.id}`
          });
        }
      }
    }

    anomalies.sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 };
      return (sev[a.severity] || 3) - (sev[b.severity] || 3);
    });

    return c.json({
      success: true,
      data: {
        anomalies,
        summary: {
          total: anomalies.length,
          critical: anomalies.filter(a => a.severity === 'critical').length,
          high: anomalies.filter(a => a.severity === 'high').length,
          medium: anomalies.filter(a => a.severity === 'medium').length,
          low: anomalies.filter(a => a.severity === 'low').length
        },
        scannedEntities: {
          budgets: budgets.length,
          tradeSpends: tradeSpends.length,
          claims: claims.length,
          deductions: deductions.length,
          promotions: promotions.length
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Anomaly detection error:', error);
    return apiError(c, error, 'anomalyDetection');
  }
});

export { anomalyDetectionRoutes };
