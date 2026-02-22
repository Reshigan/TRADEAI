import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const deductionResolution = new Hono();
deductionResolution.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => c.get('tenantId') || c.get('companyId') || c.req.header('X-Company-Code') || 'default';
const getUserId = (c) => c.get('userId') || null;

// ─── Resolution Rules CRUD ───

deductionResolution.get('/rules', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, rule_type, is_active, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM deduction_resolution_rules WHERE company_id = ?';
    const params = [companyId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (rule_type) { query += ' AND rule_type = ?'; params.push(rule_type); }
    if (is_active !== undefined && is_active !== '') { query += ' AND is_active = ?'; params.push(parseInt(is_active)); }

    query += ' ORDER BY priority ASC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument), total: result.results?.length || 0 });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

deductionResolution.get('/rules/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const result = await db.prepare('SELECT * FROM deduction_resolution_rules WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!result) return c.json({ success: false, message: 'Rule not found' }, 404);
    return c.json({ success: true, data: rowToDocument(result) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

deductionResolution.post('/rules', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO deduction_resolution_rules (
        id, company_id, name, description, rule_type, status, priority,
        match_field, match_operator, match_value, match_tolerance_pct,
        min_confidence, auto_approve_threshold, max_amount,
        deduction_types, customer_scope, action_on_match,
        gl_account, cost_center, effective_date, expiry_date,
        is_active, created_by, notes, data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
    `).bind(
      id, companyId,
      body.name || '',
      body.description || null,
      body.ruleType || body.rule_type || 'match',
      body.priority || 100,
      body.matchField || body.match_field || 'customer_amount',
      body.matchOperator || body.match_operator || 'equals',
      body.matchValue || body.match_value || null,
      body.matchTolerancePct || body.match_tolerance_pct || 0,
      body.minConfidence || body.min_confidence || 70,
      body.autoApproveThreshold || body.auto_approve_threshold || 90,
      body.maxAmount || body.max_amount || null,
      body.deductionTypes || body.deduction_types || null,
      body.customerScope || body.customer_scope || null,
      body.actionOnMatch || body.action_on_match || 'propose',
      body.glAccount || body.gl_account || null,
      body.costCenter || body.cost_center || null,
      body.effectiveDate || body.effective_date || null,
      body.expiryDate || body.expiry_date || null,
      getUserId(c),
      body.notes || null,
      JSON.stringify(body.data || {}),
      now, now
    ).run();

    const created = await db.prepare('SELECT * FROM deduction_resolution_rules WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

deductionResolution.put('/rules/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();

    const existing = await db.prepare('SELECT * FROM deduction_resolution_rules WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Rule not found' }, 404);

    await db.prepare(`
      UPDATE deduction_resolution_rules SET
        name = ?, description = ?, rule_type = ?, status = ?, priority = ?,
        match_field = ?, match_operator = ?, match_value = ?, match_tolerance_pct = ?,
        min_confidence = ?, auto_approve_threshold = ?, max_amount = ?,
        deduction_types = ?, customer_scope = ?, action_on_match = ?,
        gl_account = ?, cost_center = ?, effective_date = ?, expiry_date = ?,
        is_active = ?, notes = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      body.name || existing.name,
      body.description || existing.description,
      body.ruleType || body.rule_type || existing.rule_type,
      body.status || existing.status,
      body.priority ?? existing.priority,
      body.matchField || body.match_field || existing.match_field,
      body.matchOperator || body.match_operator || existing.match_operator,
      body.matchValue || body.match_value || existing.match_value,
      body.matchTolerancePct ?? body.match_tolerance_pct ?? existing.match_tolerance_pct,
      body.minConfidence ?? body.min_confidence ?? existing.min_confidence,
      body.autoApproveThreshold ?? body.auto_approve_threshold ?? existing.auto_approve_threshold,
      body.maxAmount ?? body.max_amount ?? existing.max_amount,
      body.deductionTypes || body.deduction_types || existing.deduction_types,
      body.customerScope || body.customer_scope || existing.customer_scope,
      body.actionOnMatch || body.action_on_match || existing.action_on_match,
      body.glAccount || body.gl_account || existing.gl_account,
      body.costCenter || body.cost_center || existing.cost_center,
      body.effectiveDate || body.effective_date || existing.effective_date,
      body.expiryDate || body.expiry_date || existing.expiry_date,
      body.isActive ?? body.is_active ?? existing.is_active,
      body.notes ?? existing.notes,
      JSON.stringify(body.data || JSON.parse(existing.data || '{}')),
      now, id
    ).run();

    const updated = await db.prepare('SELECT * FROM deduction_resolution_rules WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

deductionResolution.delete('/rules/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const existing = await db.prepare('SELECT * FROM deduction_resolution_rules WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!existing) return c.json({ success: false, message: 'Rule not found' }, 404);
    await db.prepare('DELETE FROM deduction_resolution_rules WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── Resolution Runs ───

deductionResolution.get('/runs', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM deduction_resolution_runs WHERE company_id = ?';
    const params = [companyId];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument), total: result.results?.length || 0 });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

deductionResolution.get('/runs/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const result = await db.prepare('SELECT * FROM deduction_resolution_runs WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!result) return c.json({ success: false, message: 'Run not found' }, 404);

    const matches = await db.prepare('SELECT * FROM deduction_resolution_matches WHERE run_id = ? AND company_id = ? ORDER BY confidence_score DESC').bind(id, companyId).all();
    const run = rowToDocument(result);
    run.matches = (matches.results || []).map(rowToDocument);
    return c.json({ success: true, data: run });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── Auto-Resolve Engine ───

deductionResolution.post('/resolve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const userId = getUserId(c);
    const body = await c.req.json();
    const startTime = Date.now();

    const runId = generateId();
    const runNumber = `RUN-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO deduction_resolution_runs (id, company_id, run_number, status, run_type, triggered_by, started_at, created_at, updated_at)
      VALUES (?, ?, ?, 'running', ?, ?, ?, ?, ?)
    `).bind(runId, companyId, runNumber, body.runType || 'manual', userId, now, now, now).run();

    const rules = await db.prepare(
      'SELECT * FROM deduction_resolution_rules WHERE company_id = ? AND is_active = 1 AND status = ? ORDER BY priority ASC'
    ).bind(companyId, 'active').all();

    let deductionQuery = `
      SELECT d.*, cu.name as customer_name 
      FROM deductions d LEFT JOIN customers cu ON d.customer_id = cu.id 
      WHERE d.company_id = ? AND d.status IN ('open', 'under_review')
    `;
    const deductionParams = [companyId];

    if (body.deductionIds && body.deductionIds.length > 0) {
      deductionQuery += ` AND d.id IN (${body.deductionIds.map(() => '?').join(',')})`;
      deductionParams.push(...body.deductionIds);
    }
    deductionQuery += ' ORDER BY d.deduction_date ASC';

    const deductions = await db.prepare(deductionQuery).bind(...deductionParams).all();
    const deductionList = deductions.results || [];

    const promotions = await db.prepare(
      "SELECT * FROM promotions WHERE company_id = ? AND status IN ('active', 'completed', 'approved')"
    ).bind(companyId).all();
    const promoList = promotions.results || [];

    const claims = await db.prepare(
      "SELECT * FROM claims WHERE company_id = ? AND status IN ('approved', 'pending', 'submitted')"
    ).bind(companyId).all();
    const claimList = claims.results || [];

    let matchedCount = 0;
    let autoResolvedCount = 0;
    let needsReviewCount = 0;
    let noMatchCount = 0;
    let totalAmount = 0;
    let matchedAmount = 0;
    let resolvedAmount = 0;
    let totalConfidence = 0;
    const activeRules = rules.results || [];

    for (const ded of deductionList) {
      totalAmount += (ded.deduction_amount || 0);
      let bestMatch = null;
      let bestScore = 0;
      let bestEntity = null;
      let bestEntityType = '';
      let matchReasons = [];

      for (const rule of activeRules) {
        const field = rule.match_field || 'customer_amount';
        const tolerance = rule.match_tolerance_pct || 5;
        const minConf = rule.min_confidence || 70;

        for (const promo of promoList) {
          let score = 0;
          const reasons = [];
          const promoData = typeof promo.data === 'string' ? JSON.parse(promo.data || '{}') : (promo.data || {});

          if (ded.customer_id && ded.customer_id === (promo.customer_id || promoData.customerId)) {
            score += 35;
            reasons.push('Customer match');
          }

          const dedAmt = ded.deduction_amount || 0;
          const promoBudget = promoData.budget || promoData.amount || 0;
          if (promoBudget > 0 && dedAmt > 0) {
            const ratio = dedAmt / promoBudget;
            if (ratio >= (1 - tolerance / 100) && ratio <= (1 + tolerance / 100)) {
              score += 30;
              reasons.push(`Amount within ${tolerance}% tolerance`);
            } else if (ratio >= 0.5 && ratio <= 1.5) {
              score += 15;
              reasons.push('Amount partially matches');
            }
          }

          const dedDate = new Date(ded.deduction_date || ded.created_at);
          const promoStart = new Date(promo.start_date || promo.created_at);
          const promoEnd = new Date(promo.end_date || Date.now());
          if (dedDate >= promoStart && dedDate <= new Date(promoEnd.getTime() + 30 * 86400000)) {
            score += 20;
            reasons.push('Date within promotion window');
          }

          if (ded.reason_description && promo.name) {
            const dedWords = (ded.reason_description || '').toLowerCase().split(/\s+/);
            const promoWords = (promo.name || '').toLowerCase().split(/\s+/);
            const overlap = dedWords.filter(w => w.length > 3 && promoWords.includes(w)).length;
            if (overlap > 0) {
              score += Math.min(15, overlap * 5);
              reasons.push(`Description keywords match (${overlap} words)`);
            }
          }

          if (score >= minConf && score > bestScore) {
            bestScore = score;
            bestMatch = promo;
            bestEntityType = 'promotion';
            matchReasons = reasons;
          }
        }

        for (const claim of claimList) {
          let score = 0;
          const reasons = [];

          if (ded.customer_id && ded.customer_id === claim.customer_id) {
            score += 40;
            reasons.push('Customer match');
          }

          const dedAmt = ded.deduction_amount || 0;
          const claimAmt = claim.claimed_amount || claim.approved_amount || 0;
          if (claimAmt > 0 && dedAmt > 0) {
            const ratio = dedAmt / claimAmt;
            if (ratio >= (1 - tolerance / 100) && ratio <= (1 + tolerance / 100)) {
              score += 35;
              reasons.push(`Amount within ${tolerance}% tolerance`);
            } else if (ratio >= 0.8 && ratio <= 1.2) {
              score += 20;
              reasons.push('Amount approximately matches');
            }
          }

          if (ded.invoice_number && claim.claim_number) {
            if (ded.invoice_number === claim.claim_number || (ded.reason_description || '').includes(claim.claim_number)) {
              score += 25;
              reasons.push('Reference number match');
            }
          }

          if (score >= minConf && score > bestScore) {
            bestScore = score;
            bestMatch = claim;
            bestEntityType = 'claim';
            matchReasons = reasons;
          }
        }
      }

      if (bestMatch && bestScore > 0) {
        matchedCount++;
        matchedAmount += (ded.deduction_amount || 0);
        totalConfidence += bestScore;

        const autoApprove = activeRules.some(r => bestScore >= (r.auto_approve_threshold || 90));
        const matchStatus = autoApprove ? 'auto_approved' : 'proposed';

        if (autoApprove) {
          autoResolvedCount++;
          resolvedAmount += (ded.deduction_amount || 0);
        } else {
          needsReviewCount++;
        }

        const matchId = generateId();
        await db.prepare(`
          INSERT INTO deduction_resolution_matches (
            id, company_id, run_id, deduction_id, deduction_number, deduction_amount,
            matched_entity_type, matched_entity_id, matched_entity_name,
            matched_amount, confidence_score, match_reasons,
            rule_id, rule_name, status, auto_approved,
            customer_id, customer_name, data, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          matchId, companyId, runId,
          ded.id, ded.deduction_number, ded.deduction_amount,
          bestEntityType, bestMatch.id, bestMatch.name || bestMatch.claim_number || '',
          ded.deduction_amount, bestScore,
          JSON.stringify(matchReasons),
          activeRules[0]?.id || null, activeRules[0]?.name || null,
          matchStatus, autoApprove ? 1 : 0,
          ded.customer_id, ded.customer_name || null,
          JSON.stringify({}), now, now
        ).run();

        if (autoApprove) {
          let existingMatchedTo = [];
          try { existingMatchedTo = JSON.parse(ded.matched_to || '[]'); } catch (e) {}
          existingMatchedTo.push({
            entityType: bestEntityType,
            entityId: bestMatch.id,
            amount: ded.deduction_amount,
            matchedAt: now,
            autoResolved: true,
            confidence: bestScore
          });

          await db.prepare(`
            UPDATE deductions SET status = 'matched', matched_amount = deduction_amount, remaining_amount = 0, matched_to = ?, updated_at = ?
            WHERE id = ?
          `).bind(JSON.stringify(existingMatchedTo), now, ded.id).run();
        }

        await db.prepare(`
          UPDATE deduction_resolution_rules SET match_count = match_count + 1, last_matched_at = ? WHERE id = ? AND company_id = ?
        `).bind(now, activeRules[0]?.id, companyId).run();
      } else {
        noMatchCount++;
      }
    }

    const processingTime = Date.now() - startTime;
    const avgConfidence = matchedCount > 0 ? Math.round(totalConfidence / matchedCount) : 0;

    await db.prepare(`
      UPDATE deduction_resolution_runs SET
        status = 'completed', completed_at = ?, total_deductions = ?, matched_count = ?,
        auto_resolved_count = ?, needs_review_count = ?, no_match_count = ?,
        total_amount = ?, matched_amount = ?, resolved_amount = ?,
        avg_confidence = ?, rules_applied = ?, processing_time_ms = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      now, deductionList.length, matchedCount,
      autoResolvedCount, needsReviewCount, noMatchCount,
      totalAmount, matchedAmount, resolvedAmount,
      avgConfidence, activeRules.length, processingTime, now, runId
    ).run();

    const run = await db.prepare('SELECT * FROM deduction_resolution_runs WHERE id = ?').bind(runId).first();
    return c.json({ success: true, data: rowToDocument(run) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── Matches ───

deductionResolution.get('/matches', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { status, run_id, deduction_id, limit = 50, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM deduction_resolution_matches WHERE company_id = ?';
    const params = [companyId];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (run_id) { query += ' AND run_id = ?'; params.push(run_id); }
    if (deduction_id) { query += ' AND deduction_id = ?'; params.push(deduction_id); }
    query += ' ORDER BY confidence_score DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument), total: result.results?.length || 0 });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

deductionResolution.post('/matches/:id/approve', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const match = await db.prepare('SELECT * FROM deduction_resolution_matches WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!match) return c.json({ success: false, message: 'Match not found' }, 404);

    await db.prepare(`
      UPDATE deduction_resolution_matches SET status = 'approved', reviewed_by = ?, reviewed_at = ?, resolution_type = 'manual_approve', updated_at = ? WHERE id = ?
    `).bind(userId, now, now, id).run();

    let existingMatchedTo = [];
    try {
      const ded = await db.prepare('SELECT matched_to FROM deductions WHERE id = ?').bind(match.deduction_id).first();
      existingMatchedTo = JSON.parse(ded?.matched_to || '[]');
    } catch (e) {}
    existingMatchedTo.push({
      entityType: match.matched_entity_type,
      entityId: match.matched_entity_id,
      amount: match.matched_amount,
      matchedAt: now,
      confidence: match.confidence_score
    });

    await db.prepare(`
      UPDATE deductions SET status = 'matched', matched_amount = deduction_amount, remaining_amount = 0, matched_to = ?, updated_at = ? WHERE id = ?
    `).bind(JSON.stringify(existingMatchedTo), now, match.deduction_id).run();

    const updated = await db.prepare('SELECT * FROM deduction_resolution_matches WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

deductionResolution.post('/matches/:id/reject', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const userId = getUserId(c);
    const now = new Date().toISOString();

    const match = await db.prepare('SELECT * FROM deduction_resolution_matches WHERE id = ? AND company_id = ?').bind(id, companyId).first();
    if (!match) return c.json({ success: false, message: 'Match not found' }, 404);

    await db.prepare(`
      UPDATE deduction_resolution_matches SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, review_notes = ?, resolution_type = 'manual_reject', updated_at = ? WHERE id = ?
    `).bind(userId, now, body.reason || '', now, id).run();

    const updated = await db.prepare('SELECT * FROM deduction_resolution_matches WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── Summary / Dashboard ───

deductionResolution.get('/summary', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const ruleCount = await db.prepare('SELECT COUNT(*) as count FROM deduction_resolution_rules WHERE company_id = ? AND is_active = 1').bind(companyId).first();
    const runStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_runs,
        SUM(matched_count) as total_matched,
        SUM(auto_resolved_count) as total_auto_resolved,
        SUM(needs_review_count) as total_needs_review,
        SUM(no_match_count) as total_no_match,
        SUM(total_amount) as total_amount_processed,
        SUM(resolved_amount) as total_amount_resolved,
        AVG(avg_confidence) as overall_avg_confidence
      FROM deduction_resolution_runs WHERE company_id = ? AND status = 'completed'
    `).bind(companyId).first();

    const pendingMatches = await db.prepare("SELECT COUNT(*) as count, SUM(matched_amount) as amount FROM deduction_resolution_matches WHERE company_id = ? AND status = 'proposed'").bind(companyId).first();
    const approvedMatches = await db.prepare("SELECT COUNT(*) as count, SUM(matched_amount) as amount FROM deduction_resolution_matches WHERE company_id = ? AND status IN ('approved', 'auto_approved')").bind(companyId).first();

    const openDeductions = await db.prepare("SELECT COUNT(*) as count, SUM(deduction_amount) as amount FROM deductions WHERE company_id = ? AND status IN ('open', 'under_review')").bind(companyId).first();

    const recentRuns = await db.prepare('SELECT * FROM deduction_resolution_runs WHERE company_id = ? ORDER BY created_at DESC LIMIT 5').bind(companyId).all();

    return c.json({
      success: true,
      data: {
        activeRules: ruleCount?.count || 0,
        runStats: {
          totalRuns: runStats?.total_runs || 0,
          totalMatched: runStats?.total_matched || 0,
          totalAutoResolved: runStats?.total_auto_resolved || 0,
          totalNeedsReview: runStats?.total_needs_review || 0,
          totalNoMatch: runStats?.total_no_match || 0,
          totalAmountProcessed: runStats?.total_amount_processed || 0,
          totalAmountResolved: runStats?.total_amount_resolved || 0,
          avgConfidence: Math.round(runStats?.overall_avg_confidence || 0)
        },
        pendingReview: {
          count: pendingMatches?.count || 0,
          amount: pendingMatches?.amount || 0
        },
        resolved: {
          count: approvedMatches?.count || 0,
          amount: approvedMatches?.amount || 0
        },
        openDeductions: {
          count: openDeductions?.count || 0,
          amount: openDeductions?.amount || 0
        },
        recentRuns: (recentRuns.results || []).map(rowToDocument)
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

deductionResolution.get('/options', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);

    const customers = await db.prepare('SELECT id, name FROM customers WHERE company_id = ? AND status != ? ORDER BY name LIMIT 200').bind(companyId, 'inactive').all();
    const rules = await db.prepare('SELECT id, name FROM deduction_resolution_rules WHERE company_id = ? AND is_active = 1 ORDER BY name').bind(companyId).all();

    return c.json({
      success: true,
      data: {
        customers: (customers.results || []).map(r => ({ id: r.id, name: r.name })),
        rules: (rules.results || []).map(r => ({ id: r.id, name: r.name })),
        matchFields: ['customer_amount', 'customer_date', 'invoice_number', 'amount_only', 'reference_match', 'full_match'],
        matchOperators: ['equals', 'contains', 'within_range', 'fuzzy'],
        ruleTypes: ['match', 'threshold', 'pattern', 'composite'],
        actionTypes: ['propose', 'auto_approve', 'escalate', 'write_off'],
        deductionTypes: ['promotion', 'pricing', 'logistics', 'quality', 'other']
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export { deductionResolution as deductionResolutionRoutes };
