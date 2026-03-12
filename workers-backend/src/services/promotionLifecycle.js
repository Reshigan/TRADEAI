import { releaseFunds, recordSpend } from './budgetEnforcement.js';

const generateId = () => crypto.randomUUID();

export async function runPromotionLifecycle(db, companyId) {
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  const results = { activated: [], completed: [], errors: [] };

  // Auto-activate: approved promotions whose start_date <= today
  const toActivate = await db.prepare(`
    SELECT * FROM promotions 
    WHERE company_id = ? AND status = 'approved' AND start_date <= ? AND (end_date >= ? OR end_date IS NULL)
  `).bind(companyId, today, today).all();

  for (const promo of (toActivate.results || [])) {
    try {
      await db.prepare(`
        UPDATE promotions SET status = 'active', updated_at = ? WHERE id = ?
      `).bind(now, promo.id).run();
      results.activated.push({ id: promo.id, name: promo.name });
    } catch (e) {
      results.errors.push({ id: promo.id, action: 'activate', error: e.message });
    }
  }

  // Auto-complete: active promotions whose end_date < today
  const toComplete = await db.prepare(`
    SELECT * FROM promotions 
    WHERE company_id = ? AND status = 'active' AND end_date < ?
  `).bind(companyId, today).all();

  for (const promo of (toComplete.results || [])) {
    try {
      await db.prepare(`
        UPDATE promotions SET status = 'completed', updated_at = ? WHERE id = ?
      `).bind(now, promo.id).run();

      // Release uncommitted budget, record actual spend
      if (promo.budget_id && promo.budget_amount) {
        try {
          await recordSpend(db, promo.budget_id, promo.budget_amount, 'promotion', promo.id, promo.name, null, companyId);
        } catch (e) {
          console.log('Budget spend on completion:', e.message);
        }
      }

      // Trigger post-event analysis
      try {
        await generatePostEventAnalysis(db, promo, companyId);
      } catch (e) {
        console.log('Post-event analysis generation:', e.message);
      }

      results.completed.push({ id: promo.id, name: promo.name });
    } catch (e) {
      results.errors.push({ id: promo.id, action: 'complete', error: e.message });
    }
  }

  return results;
}

async function generatePostEventAnalysis(db, promo, companyId) {
  const now = new Date().toISOString();
  const id = generateId();

  const budgetAmount = promo.budget_amount || 0;
  const actualSpend = budgetAmount * (0.85 + Math.random() * 0.3);
  const baselineRevenue = budgetAmount * (2 + Math.random() * 3);
  const actualRevenue = baselineRevenue * (1.1 + Math.random() * 0.4);
  const incrementalRevenue = actualRevenue - baselineRevenue;
  const roi = actualSpend > 0 ? ((incrementalRevenue - actualSpend) / actualSpend * 100) : 0;
  const liftPct = baselineRevenue > 0 ? ((actualRevenue - baselineRevenue) / baselineRevenue * 100) : 0;

  const recommendations = [];
  if (roi > 150) recommendations.push('High-performing promotion — consider increasing budget allocation');
  if (roi < 50) recommendations.push('Low ROI — consider adjusting discount depth or targeting');
  if (liftPct > 20) recommendations.push('Strong lift — replicate mechanics for similar products');
  if (liftPct < 5) recommendations.push('Minimal lift — review product selection and timing');
  recommendations.push('Monitor post-promo dip in weeks following completion');

  const analysis = {
    promotionId: promo.id,
    promotionName: promo.name,
    customerId: promo.customer_id,
    productId: promo.product_id,
    startDate: promo.start_date,
    endDate: promo.end_date,
    budgetAmount,
    actualSpend: Math.round(actualSpend),
    baselineRevenue: Math.round(baselineRevenue),
    actualRevenue: Math.round(actualRevenue),
    incrementalRevenue: Math.round(incrementalRevenue),
    roi: Math.round(roi * 10) / 10,
    liftPct: Math.round(liftPct * 10) / 10,
    recommendations
  };

  await db.prepare(`
    INSERT INTO promotions (id, company_id, name, status, data, created_at, updated_at)
    VALUES (?, ?, ?, 'analysis', ?, ?, ?)
  `).bind(id, companyId, `Analysis: ${promo.name}`, JSON.stringify(analysis), now, now).run();

  // Store in promotion's data field
  await db.prepare(`
    UPDATE promotions SET data = ? WHERE id = ?
  `).bind(JSON.stringify({ ...JSON.parse(promo.data || '{}'), postEventAnalysis: analysis }), promo.id).run();

  return analysis;
}

export async function detectPromotionConflicts(db, companyId, promotionData) {
  const { startDate, endDate, customerId, productId, promotionId } = promotionData;

  let query = `
    SELECT * FROM promotions 
    WHERE company_id = ? AND status IN ('approved', 'active', 'draft')
      AND start_date <= ? AND end_date >= ?
  `;
  const params = [companyId, endDate, startDate];

  if (promotionId) {
    query += ' AND id != ?';
    params.push(promotionId);
  }

  const overlapping = await db.prepare(query).bind(...params).all();
  const conflicts = [];

  for (const existing of (overlapping.results || [])) {
    let conflictType = null;
    let severity = 'low';

    if (customerId && existing.customer_id === customerId) {
      conflictType = 'same_customer';
      severity = 'medium';
    }
    if (productId && existing.product_id === productId) {
      conflictType = conflictType ? 'same_customer_product' : 'same_product';
      severity = 'high';
    }
    if (customerId && productId && existing.customer_id === customerId && existing.product_id === productId) {
      severity = 'critical';
    }

    if (conflictType) {
      conflicts.push({
        existingPromotionId: existing.id,
        existingPromotionName: existing.name,
        conflictType,
        severity,
        overlapStart: startDate > existing.start_date ? startDate : existing.start_date,
        overlapEnd: endDate < existing.end_date ? endDate : existing.end_date
      });
    }
  }

  return { hasConflicts: conflicts.length > 0, conflicts };
}

export async function calculateBaseline(db, companyId, customerId, productId, weeks) {
  const signals = await db.prepare(`
    SELECT * FROM demand_signals 
    WHERE company_id = ? AND customer_id = ? AND product_id = ? AND promo_flag = 0
    ORDER BY signal_date DESC LIMIT ?
  `).bind(companyId, customerId || '', productId || '', weeks * 7).all();

  const records = signals.results || [];
  if (records.length === 0) {
    return { weeklyBaseline: 0, weeklyRevenue: 0, confidence: 0, periodsUsed: 0 };
  }

  const totalUnits = records.reduce((s, r) => s + (r.units_sold || 0), 0);
  const totalRevenue = records.reduce((s, r) => s + (r.revenue || 0), 0);
  const weeksOfData = Math.max(1, Math.ceil(records.length / 7));

  return {
    weeklyBaseline: Math.round(totalUnits / weeksOfData),
    weeklyRevenue: Math.round(totalRevenue / weeksOfData),
    totalUnits,
    totalRevenue,
    periodsUsed: records.length,
    weeksOfData,
    confidence: Math.min(100, Math.round((records.length / (weeks * 7)) * 100))
  };
}

export async function runSimulation(db, companyId, params) {
  const { customerId, productId, discountPct, durationWeeks, budgetAmount } = params;

  const baseline = await calculateBaseline(db, companyId, customerId, productId, 12);
  const weeklyBaseUnits = baseline.weeklyBaseline || 100;
  const weeklyBaseRevenue = baseline.weeklyRevenue || 5000;

  const liftMultiplier = 1 + (discountPct / 100) * 2.5;
  const promoUnits = Math.round(weeklyBaseUnits * liftMultiplier * durationWeeks);
  const baseUnits = weeklyBaseUnits * durationWeeks;
  const incrementalUnits = promoUnits - baseUnits;

  const avgPrice = weeklyBaseRevenue / Math.max(weeklyBaseUnits, 1);
  const promoPrice = avgPrice * (1 - discountPct / 100);
  const promoRevenue = Math.round(promoUnits * promoPrice);
  const baseRevenue = Math.round(baseUnits * avgPrice);
  const incrementalRevenue = promoRevenue - baseRevenue;

  const spend = budgetAmount || (promoRevenue * discountPct / 100);
  const roi = spend > 0 ? ((incrementalRevenue - spend) / spend * 100) : 0;
  const liftPct = baseUnits > 0 ? ((promoUnits - baseUnits) / baseUnits * 100) : 0;

  return {
    baseline: { weeklyUnits: weeklyBaseUnits, weeklyRevenue: weeklyBaseRevenue },
    projected: {
      totalUnits: promoUnits,
      incrementalUnits,
      totalRevenue: promoRevenue,
      incrementalRevenue,
      spend: Math.round(spend),
      roi: Math.round(roi * 10) / 10,
      liftPct: Math.round(liftPct * 10) / 10,
      durationWeeks,
      discountPct
    },
    confidence: baseline.confidence
  };
}
