import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { getD1Client } from '../services/d1.js';

const deductionMatchRoutes = new Hono();
deductionMatchRoutes.use('*', authMiddleware);

function calculateMatchScore(deduction, promotion) {
  let score = 0;
  const dData = typeof deduction.data === 'string' ? JSON.parse(deduction.data || '{}') : (deduction.data || {});
  const pData = typeof promotion.data === 'string' ? JSON.parse(promotion.data || '{}') : (promotion.data || {});

  if (deduction.customer_id && deduction.customer_id === (promotion.customer_id || pData.customerId)) score += 35;

  const dAmt = deduction.amount || deduction.deduction_amount || 0;
  const pBudget = promotion.budget || pData.budget || 0;
  if (pBudget > 0 && dAmt > 0) {
    const ratio = dAmt / pBudget;
    if (ratio >= 0.8 && ratio <= 1.2) score += 30;
    else if (ratio >= 0.5 && ratio <= 1.5) score += 15;
  }

  const dDate = new Date(deduction.created_at || deduction.deduction_date);
  const pStart = new Date(pData.startDate || promotion.start_date || promotion.created_at);
  const pEnd = new Date(pData.endDate || promotion.end_date || Date.now());
  if (dDate >= pStart && dDate <= new Date(pEnd.getTime() + 30 * 86400000)) score += 20;

  if (deduction.description && promotion.name) {
    const dWords = deduction.description.toLowerCase().split(/\s+/);
    const pWords = promotion.name.toLowerCase().split(/\s+/);
    const overlap = dWords.filter(w => w.length > 3 && pWords.includes(w)).length;
    if (overlap > 0) score += Math.min(15, overlap * 5);
  }

  return Math.min(100, score);
}

deductionMatchRoutes.post('/auto-match', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    const { deductionId } = await c.req.json();

    const deductions = deductionId
      ? [await db.findOne('deductions', { id: deductionId, company_id: user.companyId })].filter(Boolean)
      : await db.find('deductions', { company_id: user.companyId, status: 'pending' });

    const promotions = await db.find('promotions', { company_id: user.companyId });

    const matches = [];
    for (const ded of deductions) {
      const candidates = promotions
        .map(promo => ({ promotion: promo, score: calculateMatchScore(ded, promo) }))
        .filter(m => m.score > 20)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      matches.push({
        deductionId: ded.id,
        amount: ded.amount || ded.deduction_amount || 0,
        customer: ded.customer_id,
        status: ded.status,
        bestMatch: candidates[0] ? {
          promotionId: candidates[0].promotion.id,
          promotionName: candidates[0].promotion.name,
          confidence: candidates[0].score,
          autoMatchable: candidates[0].score >= 75
        } : null,
        candidates: candidates.map(c => ({
          promotionId: c.promotion.id,
          promotionName: c.promotion.name,
          confidence: c.score,
          reason: c.score >= 75 ? 'Strong match — customer, amount, and timing align' : c.score >= 50 ? 'Partial match — some criteria align' : 'Weak match — limited overlap'
        }))
      });
    }

    const autoMatchable = matches.filter(m => m.bestMatch?.autoMatchable);
    const needsReview = matches.filter(m => !m.bestMatch?.autoMatchable);

    return c.json({
      success: true,
      data: {
        total: matches.length,
        autoMatchable: autoMatchable.length,
        needsReview: needsReview.length,
        totalUnmatched: matches.filter(m => !m.bestMatch).length,
        matches,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Deduction match error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

deductionMatchRoutes.get('/summary', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);

    const deductions = await db.find('deductions', { company_id: user.companyId });
    const total = deductions.length;
    const totalAmount = deductions.reduce((s, d) => s + (d.amount || d.deduction_amount || 0), 0);
    const matched = deductions.filter(d => d.status === 'matched' || d.status === 'resolved');
    const unmatched = deductions.filter(d => d.status === 'pending' || d.status === 'open');
    const disputed = deductions.filter(d => d.status === 'disputed');

    return c.json({
      success: true,
      data: {
        total,
        totalAmount,
        matched: matched.length,
        matchedAmount: matched.reduce((s, d) => s + (d.amount || d.deduction_amount || 0), 0),
        unmatched: unmatched.length,
        unmatchedAmount: unmatched.reduce((s, d) => s + (d.amount || d.deduction_amount || 0), 0),
        disputed: disputed.length,
        matchRate: total > 0 ? ((matched.length / total) * 100).toFixed(1) : 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { deductionMatchRoutes };
