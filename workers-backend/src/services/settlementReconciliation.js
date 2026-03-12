const generateId = () => crypto.randomUUID();

export async function calculateAccruals(db, companyId, period) {
  const now = new Date().toISOString();
  const month = period?.month || new Date().getMonth() + 1;
  const year = period?.year || new Date().getFullYear();
  const periodLabel = `${year}-${String(month).padStart(2, '0')}`;

  const activePromos = await db.prepare(`
    SELECT p.*, c.name as customer_name 
    FROM promotions p
    LEFT JOIN customers c ON c.id = p.customer_id AND c.company_id = p.company_id
    WHERE p.company_id = ? AND p.status IN ('active', 'approved')
  `).bind(companyId).all();

  const accruals = [];
  for (const promo of (activePromos.results || [])) {
    const budgetAmount = promo.budget_amount || 0;
    if (budgetAmount <= 0) continue;

    const startDate = new Date(promo.start_date || now);
    const endDate = new Date(promo.end_date || now);
    const totalDays = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));
    const daysInMonth = 30;
    const monthlyAccrual = Math.round((budgetAmount / totalDays) * daysInMonth);

    const existing = await db.prepare(
      'SELECT id FROM accrual_periods WHERE accrual_id IN (SELECT id FROM accruals WHERE promotion_id = ? AND company_id = ?) AND period_label = ?'
    ).bind(promo.id, companyId, periodLabel).first();

    if (existing) continue;

    let accrualRecord = await db.prepare(
      'SELECT * FROM accruals WHERE promotion_id = ? AND company_id = ?'
    ).bind(promo.id, companyId).first();

    if (!accrualRecord) {
      const accrualId = generateId();
      await db.prepare(`
        INSERT INTO accruals (id, company_id, promotion_id, customer_id, accrual_type, status, amount, posted_amount, reversed_amount, gl_account, cost_center, auto_calculate, auto_post, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'promotion', 'active', ?, 0, 0, '5100', 'TRADE', 1, 1, ?, ?)
      `).bind(accrualId, companyId, promo.id, promo.customer_id || null, budgetAmount, now, now).run();
      accrualRecord = { id: accrualId };
    }

    const periodId = generateId();
    await db.prepare(`
      INSERT INTO accrual_periods (id, company_id, accrual_id, period_start, period_end, period_number, period_label, base_sales, accrual_rate, calculated_amount, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'calculated', ?, ?)
    `).bind(
      periodId, companyId, accrualRecord.id,
      `${periodLabel}-01`, `${periodLabel}-${daysInMonth}`,
      month, periodLabel,
      monthlyAccrual * 5, 0.2, monthlyAccrual,
      now, now
    ).run();

    accruals.push({ promotionId: promo.id, promotionName: promo.name, accrualId: accrualRecord.id, periodId, amount: monthlyAccrual });
  }

  return { period: periodLabel, accruals, count: accruals.length };
}

export async function autoMatchDeductions(db, companyId) {
  const now = new Date().toISOString();

  const unmatched = await db.prepare(`
    SELECT * FROM deductions 
    WHERE company_id = ? AND status IN ('open', 'pending', 'unmatched') AND (matched_amount IS NULL OR matched_amount < deduction_amount)
  `).bind(companyId).all();

  const matched = [];
  for (const ded of (unmatched.results || [])) {
    const dedAmount = ded.deduction_amount || ded.amount || 0;
    const alreadyMatched = ded.matched_amount || 0;
    const remaining = dedAmount - alreadyMatched;
    if (remaining <= 0) continue;

    const claims = await db.prepare(`
      SELECT * FROM claims 
      WHERE company_id = ? AND customer_id = ? AND status IN ('approved', 'pending') 
        AND (claimed_amount - COALESCE(approved_amount, 0)) > 0
      ORDER BY created_at ASC
    `).bind(companyId, ded.customer_id || '').all();

    let matchAmount = 0;
    const matchedClaims = [];

    for (const claim of (claims.results || [])) {
      const claimRemaining = (claim.claimed_amount || 0) - (claim.approved_amount || 0);
      if (claimRemaining <= 0) continue;

      const thisMatch = Math.min(remaining - matchAmount, claimRemaining);
      if (thisMatch <= 0) break;

      matchAmount += thisMatch;
      matchedClaims.push({ claimId: claim.id, amount: thisMatch });

      await db.prepare(`
        UPDATE claims SET approved_amount = COALESCE(approved_amount, 0) + ?, status = 'matched', updated_at = ? WHERE id = ?
      `).bind(thisMatch, now, claim.id).run();
    }

    if (matchAmount > 0) {
      const newMatchedAmount = alreadyMatched + matchAmount;
      const newStatus = newMatchedAmount >= dedAmount ? 'matched' : 'partial';
      const newRemaining = dedAmount - newMatchedAmount;

      await db.prepare(`
        UPDATE deductions SET matched_amount = ?, remaining_amount = ?, status = ?, updated_at = ? WHERE id = ?
      `).bind(newMatchedAmount, newRemaining, newStatus, now, ded.id).run();

      matched.push({ deductionId: ded.id, matchedAmount: matchAmount, claims: matchedClaims, status: newStatus });
    }
  }

  return { matched, count: matched.length };
}

export async function generateMonthlySettlement(db, companyId, customerId, period) {
  const now = new Date().toISOString();
  const month = period?.month || new Date().getMonth() + 1;
  const year = period?.year || new Date().getFullYear();
  const periodLabel = `${year}-${String(month).padStart(2, '0')}`;

  const customer = await db.prepare(
    'SELECT * FROM customers WHERE id = ? AND company_id = ?'
  ).bind(customerId, companyId).first();

  if (!customer) throw new Error('Customer not found');

  const claims = await db.prepare(`
    SELECT * FROM claims WHERE company_id = ? AND customer_id = ? AND status IN ('approved', 'matched')
  `).bind(companyId, customerId).all();

  const deductions = await db.prepare(`
    SELECT * FROM deductions WHERE company_id = ? AND customer_id = ? AND status IN ('matched', 'partial')
  `).bind(companyId, customerId).all();

  const totalClaims = (claims.results || []).reduce((s, c) => s + (c.approved_amount || c.claimed_amount || 0), 0);
  const totalDeductions = (deductions.results || []).reduce((s, d) => s + (d.matched_amount || d.deduction_amount || 0), 0);
  const netAmount = totalClaims - totalDeductions;

  const settlementId = generateId();
  const settlementNumber = `STL-${periodLabel}-${customerId.substring(0, 6)}`.toUpperCase();

  await db.prepare(`
    INSERT INTO settlements (id, company_id, customer_id, settlement_number, settlement_type, amount, status, payment_method, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'monthly', ?, 'pending', 'bank_transfer', ?, ?, ?)
  `).bind(
    settlementId, companyId, customerId, settlementNumber,
    Math.abs(netAmount),
    JSON.stringify({ period: periodLabel, totalClaims, totalDeductions, netAmount, claimCount: (claims.results || []).length, deductionCount: (deductions.results || []).length }),
    now, now
  ).run();

  let lineNum = 0;
  for (const claim of (claims.results || [])) {
    lineNum++;
    await db.prepare(`
      INSERT INTO settlement_lines (id, company_id, settlement_id, line_number, claim_id, amount, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'included', ?, ?)
    `).bind(generateId(), companyId, settlementId, lineNum, claim.id, claim.approved_amount || claim.claimed_amount || 0, now, now).run();
  }

  return {
    settlementId,
    settlementNumber,
    customerId,
    customerName: customer.name,
    period: periodLabel,
    totalClaims,
    totalDeductions,
    netAmount,
    status: 'pending'
  };
}

export async function calculatePnL(db, companyId, customerId, period) {
  const year = period?.year || new Date().getFullYear();

  const customer = await db.prepare(
    'SELECT * FROM customers WHERE id = ? AND company_id = ?'
  ).bind(customerId, companyId).first();

  const promos = await db.prepare(`
    SELECT * FROM promotions WHERE company_id = ? AND customer_id = ?
  `).bind(companyId, customerId).all();

  const claims = await db.prepare(`
    SELECT * FROM claims WHERE company_id = ? AND customer_id = ?
  `).bind(companyId, customerId).all();

  const deductions = await db.prepare(`
    SELECT * FROM deductions WHERE company_id = ? AND customer_id = ?
  `).bind(companyId, customerId).all();

  const settlements = await db.prepare(`
    SELECT * FROM settlements WHERE company_id = ? AND customer_id = ?
  `).bind(companyId, customerId).all();

  const totalPromoSpend = (promos.results || []).reduce((s, p) => s + (p.budget_amount || 0), 0);
  const totalClaims = (claims.results || []).reduce((s, c) => s + (c.approved_amount || c.claimed_amount || 0), 0);
  const totalDeductions = (deductions.results || []).reduce((s, d) => s + (d.deduction_amount || 0), 0);
  const totalSettled = (settlements.results || []).reduce((s, st) => s + (st.amount || 0), 0);

  const grossSales = totalPromoSpend * 8;
  const netSales = grossSales - totalDeductions;
  const cogs = grossSales * 0.55;
  const grossProfit = netSales - cogs;
  const netTradeCost = totalPromoSpend + totalClaims;
  const netProfit = grossProfit - netTradeCost;

  const now = new Date().toISOString();
  const reportId = generateId();

  await db.prepare(`
    INSERT INTO pnl_reports (id, company_id, customer_id, report_type, year, gross_sales, net_sales, cogs, gross_profit, gross_margin_pct, trade_spend, net_trade_cost, net_profit, net_margin_pct, budget_variance, data, generated_at, generated_by, created_at, updated_at)
    VALUES (?, ?, ?, 'customer', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'system', ?, ?)
  `).bind(
    reportId, companyId, customerId, year,
    grossSales, netSales, cogs, grossProfit,
    grossSales > 0 ? Math.round((grossProfit / grossSales) * 100 * 10) / 10 : 0,
    totalPromoSpend, netTradeCost, netProfit,
    netSales > 0 ? Math.round((netProfit / netSales) * 100 * 10) / 10 : 0,
    0,
    JSON.stringify({ totalClaims, totalDeductions, totalSettled, promoCount: (promos.results || []).length }),
    now, now, now
  ).run();

  return {
    reportId,
    customerId,
    customerName: customer?.name,
    year,
    grossSales,
    netSales,
    cogs,
    grossProfit,
    grossMarginPct: grossSales > 0 ? Math.round((grossProfit / grossSales) * 100 * 10) / 10 : 0,
    tradeSpend: totalPromoSpend,
    netTradeCost,
    netProfit,
    netMarginPct: netSales > 0 ? Math.round((netProfit / netSales) * 100 * 10) / 10 : 0,
    totalClaims,
    totalDeductions,
    totalSettled
  };
}
