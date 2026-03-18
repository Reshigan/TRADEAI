import { Hono } from 'hono';
import {authMiddleware, requireMinRole } from '../middleware/auth.js';
import { getD1Client } from '../services/d1.js';
import { generateTradeInsights } from '../services/ai.js';

const aiCopilotRoutes = new Hono();
aiCopilotRoutes.use('*', authMiddleware);

function summarizeNumber(n) {
  if (n >= 1e9) return `R${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `R${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `R${(n / 1e3).toFixed(0)}K`;
  return `R${n.toFixed(0)}`;
}

aiCopilotRoutes.post('/ask', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    const { question, context } = await c.req.json();
    const q = (question || '').toLowerCase();

    const [customers, products, promotions, budgets, tradeSpends, claims, deductions, approvals] = await Promise.all([
      db.find('customers', { company_id: user.companyId }),
      db.find('products', { company_id: user.companyId }),
      db.find('promotions', { company_id: user.companyId }),
      db.find('budgets', { company_id: user.companyId }),
      db.find('trade_spends', { company_id: user.companyId }),
      db.find('claims', { company_id: user.companyId }),
      db.find('deductions', { company_id: user.companyId }),
      db.find('approvals', { company_id: user.companyId })
    ]);

    let answer = '';
    let data = null;
    let suggestions = [];
    let chartData = null;
    let aiEnhanced = false;

    // Build data context for Workers AI LLM
    const totalBudget = budgets.reduce((s, b) => s + (b.amount || 0), 0);
    const totalUtilized = budgets.reduce((s, b) => s + (b.utilized || 0), 0);
    const totalSpendAmt = tradeSpends.reduce((s, ts) => s + (ts.amount || 0), 0);
    const pendingCount = approvals.filter(a => a.status === 'pending').length;
    const totalClaimAmt = claims.reduce((s, cl) => s + (cl.amount || cl.claimed_amount || 0), 0);
    const totalDeductionAmt = deductions.reduce((s, d) => s + (d.amount || d.deduction_amount || 0), 0);

    const dataContext = `Company: ${user.companyId}
Customers: ${customers.length}, Products: ${products.length}
Promotions: ${promotions.length} (active: ${promotions.filter(p => p.status === 'active').length}, completed: ${promotions.filter(p => p.status === 'completed').length})
Budgets: ${budgets.length}, Total: R${totalBudget.toLocaleString()}, Utilized: R${totalUtilized.toLocaleString()} (${totalBudget > 0 ? ((totalUtilized / totalBudget) * 100).toFixed(1) : 0}%)
Trade Spends: ${tradeSpends.length}, Total: R${totalSpendAmt.toLocaleString()}
Claims: ${claims.length}, Total: R${totalClaimAmt.toLocaleString()}
Deductions: ${deductions.length}, Total: R${totalDeductionAmt.toLocaleString()}
Pending Approvals: ${pendingCount}`;

    // Try LLM-powered response via Workers AI binding
    const aiResult = await generateTradeInsights(c.env, { dataContext, question });
    if (!aiResult.fallback && aiResult.response) {
      answer = aiResult.response;
      aiEnhanced = true;
      data = { customers: customers.length, products: products.length, promotions: promotions.length, totalBudget, totalSpend: totalSpendAmt, pendingApprovals: pendingCount, claims: claims.length, deductions: deductions.length };
      suggestions = [
        { text: 'Show budget utilization', action: 'ask' },
        { text: 'Analyze promotion ROI', action: 'ask' },
        { text: 'Review pending approvals', action: '/approvals' }
      ];
    } else if (q.includes('budget') && (q.includes('utiliz') || q.includes('spend') || q.includes('how much'))) {
      const totalBudget = budgets.reduce((s, b) => s + (b.amount || 0), 0);
      const totalUtilized = budgets.reduce((s, b) => s + (b.utilized || 0), 0);
      const pct = totalBudget > 0 ? ((totalUtilized / totalBudget) * 100).toFixed(1) : 0;
      const remaining = totalBudget - totalUtilized;
      answer = `Your total budget is ${summarizeNumber(totalBudget)} with ${pct}% utilized (${summarizeNumber(totalUtilized)} spent, ${summarizeNumber(remaining)} remaining). You have ${budgets.length} active budgets.`;
      data = { totalBudget, totalUtilized, remaining, utilization: pct, budgetCount: budgets.length };
      chartData = budgets.slice(0, 8).map(b => ({ name: b.name || b.budget_type, allocated: b.amount || 0, utilized: b.utilized || 0 }));
      if (parseFloat(pct) > 80) suggestions.push({ text: 'Budget utilization is high — consider reviewing upcoming commitments', action: '/budgets' });
      if (parseFloat(pct) < 30) suggestions.push({ text: 'Budget utilization is low — explore promotion opportunities', action: '/promotions/new' });
    } else if (q.includes('promotion') && (q.includes('perform') || q.includes('roi') || q.includes('best'))) {
      const completed = promotions.filter(p => p.status === 'completed');
      const active = promotions.filter(p => p.status === 'active');
      const avgROI = completed.length > 0 ? completed.reduce((s, p) => { const d = typeof p.data === 'string' ? JSON.parse(p.data || '{}') : (p.data || {}); return s + (d.performance?.roi || d.roi || 0); }, 0) / completed.length : 0;
      answer = `You have ${promotions.length} promotions (${active.length} active, ${completed.length} completed). Average ROI across completed promotions is ${avgROI.toFixed(2)}x.`;
      data = { total: promotions.length, active: active.length, completed: completed.length, avgROI: avgROI.toFixed(2) };
      suggestions.push({ text: 'View top-performing promotions', action: '/promotions?status=completed' });
      if (avgROI < 1.5) suggestions.push({ text: 'ROI is below target — run AI optimization', action: '/simulation-studio' });
    } else if (q.includes('claim') || q.includes('deduction')) {
      const totalClaims = claims.reduce((s, cl) => s + (cl.amount || cl.claimed_amount || cl.claimAmount || cl.claimedAmount || 0), 0);
      const totalDeductions = deductions.reduce((s, d) => s + (d.amount || d.deduction_amount || 0), 0);
      const pendingClaims = claims.filter(cl => cl.status === 'pending' || cl.status === 'submitted');
      answer = `You have ${claims.length} claims totalling ${summarizeNumber(totalClaims)} and ${deductions.length} deductions totalling ${summarizeNumber(totalDeductions)}. ${pendingClaims.length} claims are pending review.`;
      data = { claims: claims.length, totalClaims, deductions: deductions.length, totalDeductions, pendingClaims: pendingClaims.length };
      if (pendingClaims.length > 0) suggestions.push({ text: `Review ${pendingClaims.length} pending claims`, action: '/claims?status=pending' });
    } else if (q.includes('approv') || q.includes('pending')) {
      const pending = approvals.filter(a => a.status === 'pending');
      const approved = approvals.filter(a => a.status === 'approved');
      const rejected = approvals.filter(a => a.status === 'rejected');
      answer = `You have ${approvals.length} total approvals: ${pending.length} pending, ${approved.length} approved, ${rejected.length} rejected.`;
      data = { total: approvals.length, pending: pending.length, approved: approved.length, rejected: rejected.length };
      if (pending.length > 0) suggestions.push({ text: `Process ${pending.length} pending approvals`, action: '/approvals' });
    } else if (q.includes('customer') && (q.includes('top') || q.includes('best') || q.includes('segment'))) {
      const tiers = {};
      customers.forEach(c => { const t = c.tier || 'standard'; tiers[t] = (tiers[t] || 0) + 1; });
      answer = `You have ${customers.length} customers. Breakdown by tier: ${Object.entries(tiers).map(([t, c]) => `${t}: ${c}`).join(', ')}.`;
      data = { total: customers.length, tiers };
      suggestions.push({ text: 'View customer 360 for top accounts', action: '/customers' });
    } else if (q.includes('product') && (q.includes('top') || q.includes('categor') || q.includes('inventory'))) {
      const categories = {};
      products.forEach(p => { const cat = p.category || 'Uncategorized'; categories[cat] = (categories[cat] || 0) + 1; });
      answer = `You have ${products.length} products across ${Object.keys(categories).length} categories: ${Object.entries(categories).slice(0, 5).map(([c, n]) => `${c}: ${n}`).join(', ')}.`;
      data = { total: products.length, categories };
      suggestions.push({ text: 'Explore product hierarchy', action: '/hierarchy/products' });
    } else if (q.includes('trade spend') || q.includes('trade-spend') || q.includes('spend overview')) {
      const totalSpend = tradeSpends.reduce((s, ts) => s + (ts.amount || 0), 0);
      const byStatus = {};
      tradeSpends.forEach(ts => { const st = ts.status || 'unknown'; byStatus[st] = (byStatus[st] || 0) + 1; });
      answer = `Total trade spend: ${summarizeNumber(totalSpend)} across ${tradeSpends.length} entries. Status breakdown: ${Object.entries(byStatus).map(([s, c]) => `${s}: ${c}`).join(', ')}.`;
      data = { total: tradeSpends.length, totalSpend, byStatus };
      suggestions.push({ text: 'Analyze trade spend efficiency', action: '/analytics' });
    } else if (q.includes('help') || q.includes('what can') || q.includes('how do')) {
      answer = 'I can help you with: budget utilization, promotion performance & ROI, claims & deductions summary, pending approvals, customer segmentation, product categories, trade spend overview, and next best actions. Try asking "How are my budgets performing?" or "What promotions have the best ROI?"';
      suggestions = [
        { text: 'How are my budgets performing?', action: 'ask' },
        { text: 'What is my promotion ROI?', action: 'ask' },
        { text: 'Show me pending approvals', action: 'ask' },
        { text: 'Summarize claims and deductions', action: 'ask' }
      ];
    } else {
      const totalBudget = budgets.reduce((s, b) => s + (b.amount || 0), 0);
      const totalSpend = tradeSpends.reduce((s, ts) => s + (ts.amount || 0), 0);
      const pendingApprovals = approvals.filter(a => a.status === 'pending').length;
      answer = `Here's your overview: ${customers.length} customers, ${products.length} products, ${promotions.length} promotions, ${summarizeNumber(totalBudget)} in budgets, ${summarizeNumber(totalSpend)} in trade spend, ${pendingApprovals} pending approvals, ${claims.length} claims, ${deductions.length} deductions.`;
      data = { customers: customers.length, products: products.length, promotions: promotions.length, totalBudget, totalSpend, pendingApprovals, claims: claims.length, deductions: deductions.length };
      suggestions = [
        { text: 'Show budget utilization', action: 'ask' },
        { text: 'Analyze promotion ROI', action: 'ask' },
        { text: 'Review pending approvals', action: '/approvals' }
      ];
    }

    return c.json({ success: true, data: { answer, data, suggestions, chartData, aiEnhanced, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error('AI Copilot error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

aiCopilotRoutes.post('/suggest-actions', async (c) => {
  try {
    const user = c.get('user');
    const db = getD1Client(c);
    let page = 'dashboard';
    try { const body = await c.req.json(); page = body.page || 'dashboard'; } catch { }

    const [budgets, approvals, claims, promotions] = await Promise.all([
      db.find('budgets', { company_id: user.companyId, status: 'active' }),
      db.find('approvals', { company_id: user.companyId, status: 'pending' }),
      db.find('claims', { company_id: user.companyId, status: 'pending' }),
      db.find('promotions', { company_id: user.companyId, status: 'active' })
    ]);

    const actions = [];

    if (approvals.length > 0) actions.push({ priority: 'high', icon: 'approval', title: `${approvals.length} pending approvals`, description: 'Review and process pending approval requests', action: '/approvals' });

    const overBudgets = budgets.filter(b => b.amount && ((b.utilized || 0) / b.amount) > 0.9);
    if (overBudgets.length > 0) actions.push({ priority: 'high', icon: 'budget', title: `${overBudgets.length} budgets near limit`, description: 'Budgets are >90% utilized — review allocations', action: '/budgets' });

    if (claims.length > 0) actions.push({ priority: 'medium', icon: 'claim', title: `${claims.length} claims to review`, description: 'Process pending customer claims', action: '/claims' });

    const endingSoon = promotions.filter(p => { try { const d = typeof p.data === 'string' ? JSON.parse(p.data) : p.data; const end = new Date(d?.endDate || p.end_date); return end < new Date(Date.now() + 7 * 86400000); } catch { return false; } });
    if (endingSoon.length > 0) actions.push({ priority: 'medium', icon: 'promo', title: `${endingSoon.length} promotions ending soon`, description: 'Promotions ending within 7 days — plan post-event analysis', action: '/promotions' });

    if (actions.length === 0) actions.push({ priority: 'low', icon: 'check', title: 'All caught up', description: 'No urgent actions needed right now', action: '/dashboard' });

    return c.json({ success: true, data: { actions, timestamp: new Date().toISOString() } });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Sprint 5: Context-aware query endpoint
aiCopilotRoutes.post('/context-query', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const companyId = user?.companyId || c.get('tenantId') || c.get('companyId') || 'default';
    const { query, entityType, entityId } = await c.req.json();

    let context = {};
    if (entityType === 'promotion' && entityId) {
      const promo = await db.prepare('SELECT * FROM promotions WHERE id = ? AND company_id = ?').bind(entityId, companyId).first();
      const accruals = await db.prepare('SELECT SUM(accrued_amount) as total FROM accruals WHERE promotion_id = ? AND company_id = ?').bind(entityId, companyId).first();
      const conflicts = await db.prepare("SELECT COUNT(*) as count FROM promotions WHERE company_id = ? AND id != ? AND status IN ('active','approved') AND start_date <= ? AND end_date >= ?")
        .bind(companyId, entityId, promo?.end_date || '2099-12-31', promo?.start_date || '2000-01-01').first();
      context = { promotion: promo, totalAccruals: accruals?.total || 0, conflictCount: conflicts?.count || 0 };
    } else if (entityType === 'budget' && entityId) {
      const budget = await db.prepare('SELECT * FROM budgets WHERE id = ? AND company_id = ?').bind(entityId, companyId).first();
      const wallets = await db.prepare('SELECT COUNT(*) as count, SUM(total_allocated) as allocated FROM kam_wallets WHERE company_id = ?').bind(companyId).first();
      context = { budget, walletCount: wallets?.count || 0, walletAllocated: wallets?.allocated || 0 };
    } else if (entityType === 'customer' && entityId) {
      const customer = await db.prepare('SELECT * FROM customers WHERE id = ? AND company_id = ?').bind(entityId, companyId).first();
      const promos = await db.prepare("SELECT COUNT(*) as count FROM promotions WHERE customer_id = ? AND company_id = ? AND status IN ('active','completed')").bind(entityId, companyId).first();
      const spend = await db.prepare('SELECT SUM(amount) as total FROM trade_spends WHERE customer_id = ? AND company_id = ?').bind(entityId, companyId).first();
      context = { customer, promoCount: promos?.count || 0, totalSpend: spend?.total || 0 };
    }

    // Try Workers AI LLM
    let response = '';
    let aiEnhanced = false;
    if (c.env.AI) {
      try {
        const contextStr = JSON.stringify(context, null, 2);
        const result = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            { role: 'system', content: `You are TradeAI, an FMCG trade promotion management assistant. Answer questions about the following entity data concisely. Format currency in South African Rand (R). Data context:\n${contextStr}` },
            { role: 'user', content: query || 'Give me insights about this entity.' }
          ],
          max_tokens: 300
        });
        if (result?.response) { response = result.response; aiEnhanced = true; }
      } catch (e) { /* fallback below */ }
    }

    if (!response) {
      // Rule-based fallback
      if (context.promotion) {
        const p = context.promotion;
        const data = JSON.parse(p.data || '{}');
        response = `Promotion "${p.name}" is ${p.status}. Budget: R${(p.budget_amount || 0).toLocaleString()}. Accruals: R${(context.totalAccruals || 0).toLocaleString()}. ${context.conflictCount > 0 ? `⚠ ${context.conflictCount} overlapping promotions detected.` : 'No conflicts.'}`;
      } else if (context.budget) {
        const b = context.budget;
        response = `Budget "${b.name}" — Allocated: R${(b.amount || 0).toLocaleString()}, Utilized: R${(b.utilized || 0).toLocaleString()} (${b.amount > 0 ? ((b.utilized / b.amount) * 100).toFixed(1) : 0}%). ${context.walletCount} KAM wallets linked.`;
      } else if (context.customer) {
        response = `Customer "${context.customer.name}" has ${context.promoCount} promotions and R${(context.totalSpend || 0).toLocaleString()} in trade spend.`;
      } else {
        response = 'No entity context provided. Try asking about a specific promotion, budget, or customer.';
      }
    }

    return c.json({ success: true, data: { response, context, aiEnhanced, timestamp: new Date().toISOString() } });
  } catch (error) {
    console.error('Context query error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// AI health check endpoint
aiCopilotRoutes.get('/status', async (c) => {
  const hasAI = !!c.env.AI;
  let aiWorking = false;

  if (hasAI) {
    try {
      const result = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: 'Say "ok"' }],
        max_tokens: 5,
      });
      aiWorking = !!(result.response || result.result);
    } catch (e) {
      console.error('AI status check failed:', e);
    }
  }

  return c.json({
    success: true,
    data: {
      aiBinding: hasAI,
      aiWorking,
      model: '@cf/meta/llama-3.1-8b-instruct',
      capabilities: ['text-generation', 'trade-insights', 'anomaly-explanation', 'intent-classification', 'data-summarization'],
      timestamp: new Date().toISOString()
    }
  });
});

export { aiCopilotRoutes };
