import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { D1Client } from '../services/d1.js';

const tradeFundRoutes = new Hono();

tradeFundRoutes.use('*', authMiddleware);

const getCompanyId = (c, body = null) => {
  return body?.companyId || c.req.query('companyId') || c.get('tenantId') || c.req.header('X-Company-Code') || 'default';
};

const getUserId = (c) => {
  return c.get('userId') || c.get('user')?.id || c.get('user')?.email || null;
};

// ===== FUND CRUD =====

// GET /summary - Fund summary analytics
tradeFundRoutes.get('/summary', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const user = c.get('user');
    const companyId = c.req.query('companyId') || user.tenantId || user.companyId;

    const funds = await db.find('trade_funds', { companyId }, { limit: 1000 });
    const rows = funds.results || funds || [];

    const totalOriginal = rows.reduce((s, r) => s + (parseFloat(r.originalAmount || r.original_amount) || 0), 0);
    const totalDrawn = rows.reduce((s, r) => s + (parseFloat(r.drawnAmount || r.drawn_amount) || 0), 0);
    const totalRemaining = rows.reduce((s, r) => s + (parseFloat(r.remainingAmount || r.remaining_amount) || 0), 0);
    const totalCommitted = rows.reduce((s, r) => s + (parseFloat(r.committedAmount || r.committed_amount) || 0), 0);
    const totalCarryover = rows.reduce((s, r) => s + (parseFloat(r.carryoverAmount || r.carryover_amount) || 0), 0);
    const activeFunds = rows.filter(r => (r.status) === 'active').length;
    const utilizationPct = totalOriginal > 0 ? ((totalDrawn / totalOriginal) * 100).toFixed(1) : 0;

    return c.json({
      success: true,
      data: {
        totalFunds: rows.length,
        activeFunds,
        totalOriginal,
        totalDrawn,
        totalRemaining,
        totalCommitted,
        totalCarryover,
        utilizationPct: parseFloat(utilizationPct),
        byStatus: {
          active: rows.filter(r => r.status === 'active').length,
          frozen: rows.filter(r => r.status === 'frozen').length,
          closed: rows.filter(r => r.status === 'closed').length,
          expired: rows.filter(r => r.status === 'expired').length,
        },
        byType: rows.reduce((acc, r) => {
          const t = r.fundType || r.fund_type || 'other';
          acc[t] = (acc[t] || 0) + 1;
          return acc;
        }, {}),
      }
    });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// GET / - List all funds
tradeFundRoutes.get('/', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const user = c.get('user');
    const companyId = c.req.query('companyId') || user.tenantId || user.companyId;
    const status = c.req.query('status');
    const fundType = c.req.query('fundType');
    const fiscalYear = c.req.query('fiscalYear');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');

    const filter = { companyId };
    if (status) filter.status = status;
    if (fundType) filter.fundType = fundType;
    if (fiscalYear) filter.fiscalYear = parseInt(fiscalYear);

    const total = await db.countDocuments('trade_funds', filter);
    const results = await db.find('trade_funds', filter, {
      skip: (page - 1) * limit,
      limit,
      sort: { createdAt: -1 }
    });

    return c.json({
      success: true,
      data: results.results || results || [],
      pagination: { page, limit, total: total || 0, pages: Math.ceil((total || 0) / limit) }
    });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// GET /options - Fund options for dropdowns
tradeFundRoutes.get('/options', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const user = c.get('user');
    const companyId = c.req.query('companyId') || user.tenantId || user.companyId;

    const funds = await db.find('trade_funds', { companyId, status: 'active' }, { limit: 500 });
    const rows = funds.results || funds || [];

    return c.json({
      success: true,
      data: rows.map(r => ({
        id: r.id,
        name: r.fundName || r.fund_name,
        code: r.fundCode || r.fund_code,
        remaining: parseFloat(r.remainingAmount || r.remaining_amount) || 0,
        type: r.fundType || r.fund_type,
      }))
    });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// GET /:id - Get fund by ID
tradeFundRoutes.get('/:id', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const id = c.req.param('id');
    const fund = await db.findOne('trade_funds', { _id: id });
    if (!fund) return c.json({ success: false, message: 'Fund not found' }, 404);

    // Get child funds
    const children = await db.find('trade_funds', { parentFundId: id }, { limit: 100 });

    // Get recent transactions
    const transactions = await db.find('trade_fund_transactions', { fundId: id }, {
      limit: 20,
      sort: { createdAt: -1 }
    });

    // Get rules
    const rules = await db.find('trade_fund_rules', { fundId: id }, { limit: 50 });

    return c.json({
      success: true,
      data: {
        ...fund,
        children: children.results || children || [],
        recentTransactions: transactions.results || transactions || [],
        rules: rules.results || rules || [],
      }
    });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// POST / - Create a fund
tradeFundRoutes.post('/', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const user = c.get('user');
    const body = await c.req.json();

    const companyId = body.companyId || user.tenantId || user.companyId;
    const originalAmount = parseFloat(body.originalAmount) || 0;

    const doc = {
      companyId,
      fundName: body.fundName,
      fundCode: body.fundCode || null,
      fundType: body.fundType || 'trade_promotion',
      parentFundId: body.parentFundId || null,
      budgetId: body.budgetId || null,
      fiscalYear: body.fiscalYear || new Date().getFullYear(),
      currency: body.currency || 'ZAR',
      originalAmount,
      allocatedAmount: 0,
      drawnAmount: 0,
      remainingAmount: originalAmount,
      committedAmount: 0,
      carryoverAmount: parseFloat(body.carryoverAmount) || 0,
      status: body.status || 'active',
      ownerId: body.ownerId || null,
      ownerName: body.ownerName || null,
      region: body.region || null,
      channel: body.channel || null,
      customerId: body.customerId || null,
      customerName: body.customerName || null,
      productCategory: body.productCategory || null,
      effectiveDate: body.effectiveDate || null,
      expiryDate: body.expiryDate || null,
      carryoverPolicy: body.carryoverPolicy || 'forfeit',
      maxCarryoverPct: parseFloat(body.maxCarryoverPct) || 0,
      notes: body.notes || null,
      createdBy: user.userId || user.email,
    };

    const result = await db.insertOne('trade_funds', doc);

    // Create initial funding transaction
    await db.insertOne('trade_fund_transactions', {
      companyId,
      fundId: result.id,
      transactionType: 'initial_funding',
      amount: originalAmount,
      runningBalance: originalAmount,
      description: `Initial funding for ${body.fundName}`,
      postedBy: user.userId || user.email,
      postedAt: new Date().toISOString(),
      status: 'posted',
    });

    return c.json({ success: true, data: result }, 201);
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// PUT /:id - Update a fund
tradeFundRoutes.put('/:id', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db.findOne('trade_funds', { _id: id });
    if (!existing) return c.json({ success: false, message: 'Fund not found' }, 404);

    const updates = {};
    const fields = ['fundName', 'fundCode', 'fundType', 'parentFundId', 'budgetId', 'fiscalYear',
      'currency', 'status', 'ownerId', 'ownerName', 'region', 'channel', 'customerId',
      'customerName', 'productCategory', 'effectiveDate', 'expiryDate', 'carryoverPolicy',
      'maxCarryoverPct', 'notes'];

    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f];
    }

    if (body.originalAmount !== undefined) {
      const newOriginal = parseFloat(body.originalAmount);
      const diff = newOriginal - (parseFloat(existing.originalAmount || existing.original_amount) || 0);
      updates.originalAmount = newOriginal;
      updates.remainingAmount = (parseFloat(existing.remainingAmount || existing.remaining_amount) || 0) + diff;

      if (diff !== 0) {
        await db.insertOne('trade_fund_transactions', {
          companyId: existing.companyId || existing.company_id,
          fundId: id,
          transactionType: diff > 0 ? 'top_up' : 'reduction',
          amount: diff,
          runningBalance: updates.remainingAmount,
          description: `Fund amount ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)}`,
          postedBy: c.get('user').userId || c.get('user').email,
          postedAt: new Date().toISOString(),
          status: 'posted',
        });
      }
    }

    const result = await db.updateOne('trade_funds', { _id: id }, { $set: updates });
    return c.json({ success: true, data: result });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// DELETE /:id - Delete a fund
tradeFundRoutes.delete('/:id', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const id = c.req.param('id');
    const fund = await db.findOne('trade_funds', { _id: id });
    if (!fund) return c.json({ success: false, message: 'Fund not found' }, 404);

    const drawnAmount = parseFloat(fund.drawnAmount || fund.drawn_amount) || 0;
    if (drawnAmount > 0) {
      return c.json({ success: false, message: 'Cannot delete fund with drawn amounts. Close the fund instead.' }, 400);
    }

    await db.deleteMany('trade_fund_transactions', { fundId: id });
    await db.deleteMany('trade_fund_rules', { fundId: id });
    await db.deleteOne('trade_funds', { _id: id });
    return c.json({ success: true, message: 'Fund deleted' });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// ===== FUND OPERATIONS =====

// POST /:id/drawdown - Draw funds
tradeFundRoutes.post('/:id/drawdown', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();

    const fund = await db.findOne('trade_funds', { _id: id });
    if (!fund) return c.json({ success: false, message: 'Fund not found' }, 404);
    if (fund.status !== 'active') return c.json({ success: false, message: 'Fund is not active' }, 400);

    const amount = parseFloat(body.amount);
    if (!amount || amount <= 0) return c.json({ success: false, message: 'Amount must be positive' }, 400);

    const remaining = parseFloat(fund.remainingAmount || fund.remaining_amount) || 0;
    if (amount > remaining) return c.json({ success: false, message: `Insufficient funds. Available: ${remaining}` }, 400);

    const newRemaining = remaining - amount;
    const newDrawn = (parseFloat(fund.drawnAmount || fund.drawn_amount) || 0) + amount;

    await db.updateOne('trade_funds', { _id: id }, {
      $set: { drawnAmount: newDrawn, remainingAmount: newRemaining }
    });

    const txn = await db.insertOne('trade_fund_transactions', {
      companyId: fund.companyId || fund.company_id,
      fundId: id,
      transactionType: 'drawdown',
      amount: -amount,
      runningBalance: newRemaining,
      referenceType: body.referenceType || null,
      referenceId: body.referenceId || null,
      referenceName: body.referenceName || null,
      customerId: body.customerId || null,
      customerName: body.customerName || null,
      productId: body.productId || null,
      productName: body.productName || null,
      promotionId: body.promotionId || null,
      promotionName: body.promotionName || null,
      description: body.description || `Drawdown of ${amount}`,
      postedBy: user.userId || user.email,
      postedAt: new Date().toISOString(),
      status: 'posted',
    });

    return c.json({ success: true, data: { transaction: txn, newBalance: newRemaining } });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// POST /:id/topup - Top up fund
tradeFundRoutes.post('/:id/topup', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();

    const fund = await db.findOne('trade_funds', { _id: id });
    if (!fund) return c.json({ success: false, message: 'Fund not found' }, 404);

    const amount = parseFloat(body.amount);
    if (!amount || amount <= 0) return c.json({ success: false, message: 'Amount must be positive' }, 400);

    const newRemaining = (parseFloat(fund.remainingAmount || fund.remaining_amount) || 0) + amount;
    const newOriginal = (parseFloat(fund.originalAmount || fund.original_amount) || 0) + amount;

    await db.updateOne('trade_funds', { _id: id }, {
      $set: { originalAmount: newOriginal, remainingAmount: newRemaining }
    });

    await db.insertOne('trade_fund_transactions', {
      companyId: fund.companyId || fund.company_id,
      fundId: id,
      transactionType: 'top_up',
      amount,
      runningBalance: newRemaining,
      description: body.description || `Top-up of ${amount}`,
      postedBy: user.userId || user.email,
      postedAt: new Date().toISOString(),
      status: 'posted',
    });

    return c.json({ success: true, data: { newBalance: newRemaining, newOriginal } });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// POST /transfer - Transfer between funds
tradeFundRoutes.post('/transfer', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const user = c.get('user');
    const body = await c.req.json();

    const { fromFundId, toFundId, amount: rawAmount, description } = body;
    const amount = parseFloat(rawAmount);

    if (!fromFundId || !toFundId) return c.json({ success: false, message: 'fromFundId and toFundId required' }, 400);
    if (!amount || amount <= 0) return c.json({ success: false, message: 'Amount must be positive' }, 400);

    const fromFund = await db.findOne('trade_funds', { _id: fromFundId });
    const toFund = await db.findOne('trade_funds', { _id: toFundId });
    if (!fromFund) return c.json({ success: false, message: 'Source fund not found' }, 404);
    if (!toFund) return c.json({ success: false, message: 'Destination fund not found' }, 404);

    const fromRemaining = parseFloat(fromFund.remainingAmount || fromFund.remaining_amount) || 0;
    if (amount > fromRemaining) return c.json({ success: false, message: `Insufficient funds in source. Available: ${fromRemaining}` }, 400);

    const newFromRemaining = fromRemaining - amount;
    const newFromDrawn = (parseFloat(fromFund.drawnAmount || fromFund.drawn_amount) || 0) + amount;
    const newToRemaining = (parseFloat(toFund.remainingAmount || toFund.remaining_amount) || 0) + amount;
    const newToOriginal = (parseFloat(toFund.originalAmount || toFund.original_amount) || 0) + amount;

    await db.updateOne('trade_funds', { _id: fromFundId }, {
      $set: { drawnAmount: newFromDrawn, remainingAmount: newFromRemaining }
    });
    await db.updateOne('trade_funds', { _id: toFundId }, {
      $set: { originalAmount: newToOriginal, remainingAmount: newToRemaining }
    });

    const fromTxn = await db.insertOne('trade_fund_transactions', {
      companyId: fromFund.companyId || fromFund.company_id,
      fundId: fromFundId,
      transactionType: 'transfer_out',
      amount: -amount,
      runningBalance: newFromRemaining,
      fromFundId,
      toFundId,
      description: description || `Transfer to ${toFund.fundName || toFund.fund_name}`,
      postedBy: user.userId || user.email,
      postedAt: new Date().toISOString(),
      status: 'posted',
    });

    const toTxn = await db.insertOne('trade_fund_transactions', {
      companyId: toFund.companyId || toFund.company_id,
      fundId: toFundId,
      transactionType: 'transfer_in',
      amount,
      runningBalance: newToRemaining,
      fromFundId,
      toFundId,
      description: description || `Transfer from ${fromFund.fundName || fromFund.fund_name}`,
      postedBy: user.userId || user.email,
      postedAt: new Date().toISOString(),
      status: 'posted',
    });

    return c.json({
      success: true,
      data: {
        fromTransaction: fromTxn,
        toTransaction: toTxn,
        fromBalance: newFromRemaining,
        toBalance: newToRemaining,
      }
    });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// ===== TRANSACTIONS =====

// GET /:id/transactions - Get fund transactions
tradeFundRoutes.get('/:id/transactions', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const id = c.req.param('id');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const txnType = c.req.query('type');

    const filter = { fundId: id };
    if (txnType) filter.transactionType = txnType;

    const total = await db.countDocuments('trade_fund_transactions', filter);
    const results = await db.find('trade_fund_transactions', filter, {
      skip: (page - 1) * limit,
      limit,
      sort: { createdAt: -1 }
    });

    return c.json({
      success: true,
      data: results.results || results || [],
      pagination: { page, limit, total: total || 0, pages: Math.ceil((total || 0) / limit) }
    });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// ===== RULES =====

// GET /:id/rules - Get fund rules
tradeFundRoutes.get('/:id/rules', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const id = c.req.param('id');
    const rules = await db.find('trade_fund_rules', { fundId: id }, { limit: 100, sort: { priority: 1 } });
    return c.json({ success: true, data: rules.results || rules || [] });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// POST /:id/rules - Create a fund rule
tradeFundRoutes.post('/:id/rules', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();

    const fund = await db.findOne('trade_funds', { _id: id });
    if (!fund) return c.json({ success: false, message: 'Fund not found' }, 404);

    const rule = await db.insertOne('trade_fund_rules', {
      companyId: fund.companyId || fund.company_id,
      fundId: id,
      ruleName: body.ruleName,
      ruleType: body.ruleType,
      conditionField: body.conditionField || null,
      conditionOperator: body.conditionOperator || null,
      conditionValue: body.conditionValue || null,
      actionType: body.actionType || null,
      actionValue: body.actionValue || null,
      priority: body.priority || 0,
      isActive: body.isActive !== undefined ? (body.isActive ? 1 : 0) : 1,
      effectiveDate: body.effectiveDate || null,
      expiryDate: body.expiryDate || null,
      description: body.description || null,
      createdBy: user.userId || user.email,
    });

    return c.json({ success: true, data: rule }, 201);
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// PUT /rules/:ruleId - Update a rule
tradeFundRoutes.put('/rules/:ruleId', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const ruleId = c.req.param('ruleId');
    const body = await c.req.json();

    const existing = await db.findOne('trade_fund_rules', { _id: ruleId });
    if (!existing) return c.json({ success: false, message: 'Rule not found' }, 404);

    const updates = {};
    const fields = ['ruleName', 'ruleType', 'conditionField', 'conditionOperator', 'conditionValue',
      'actionType', 'actionValue', 'priority', 'isActive', 'effectiveDate', 'expiryDate', 'description'];
    for (const f of fields) {
      if (body[f] !== undefined) {
        updates[f] = f === 'isActive' ? (body[f] ? 1 : 0) : body[f];
      }
    }

    const result = await db.updateOne('trade_fund_rules', { _id: ruleId }, { $set: updates });
    return c.json({ success: true, data: result });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// DELETE /rules/:ruleId - Delete a rule
tradeFundRoutes.delete('/rules/:ruleId', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const ruleId = c.req.param('ruleId');
    await db.deleteOne('trade_fund_rules', { _id: ruleId });
    return c.json({ success: true, message: 'Rule deleted' });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// POST /:id/carryover - Process carryover
tradeFundRoutes.post('/:id/carryover', async (c) => {
  try {
    const db = new D1Client(c.env.DB);
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();

    const fund = await db.findOne('trade_funds', { _id: id });
    if (!fund) return c.json({ success: false, message: 'Fund not found' }, 404);

    const remaining = parseFloat(fund.remainingAmount || fund.remaining_amount) || 0;
    const policy = fund.carryoverPolicy || fund.carryover_policy || 'forfeit';
    const maxPct = parseFloat(fund.maxCarryoverPct || fund.max_carryover_pct) || 0;

    let carryoverAmount = 0;
    let forfeitedAmount = 0;

    if (policy === 'full') {
      carryoverAmount = remaining;
    } else if (policy === 'percentage') {
      const originalAmt = parseFloat(fund.originalAmount || fund.original_amount) || 0;
      const maxCarry = originalAmt * (maxPct / 100);
      carryoverAmount = Math.min(remaining, maxCarry);
      forfeitedAmount = remaining - carryoverAmount;
    } else {
      forfeitedAmount = remaining;
    }

    const targetYear = body.targetYear || ((fund.fiscalYear || fund.fiscal_year || new Date().getFullYear()) + 1);

    // Close current fund
    await db.updateOne('trade_funds', { _id: id }, {
      $set: { status: 'closed', carryoverAmount, remainingAmount: 0 }
    });

    let newFund = null;
    if (carryoverAmount > 0) {
      newFund = await db.insertOne('trade_funds', {
        companyId: fund.companyId || fund.company_id,
        fundName: `${fund.fundName || fund.fund_name} (Carryover ${targetYear})`,
        fundCode: fund.fundCode || fund.fund_code,
        fundType: fund.fundType || fund.fund_type,
        parentFundId: id,
        budgetId: fund.budgetId || fund.budget_id,
        fiscalYear: targetYear,
        currency: fund.currency || 'ZAR',
        originalAmount: carryoverAmount,
        allocatedAmount: 0,
        drawnAmount: 0,
        remainingAmount: carryoverAmount,
        committedAmount: 0,
        carryoverAmount: 0,
        status: 'active',
        ownerId: fund.ownerId || fund.owner_id,
        ownerName: fund.ownerName || fund.owner_name,
        region: fund.region,
        channel: fund.channel,
        customerId: fund.customerId || fund.customer_id,
        customerName: fund.customerName || fund.customer_name,
        productCategory: fund.productCategory || fund.product_category,
        carryoverPolicy: fund.carryoverPolicy || fund.carryover_policy || 'forfeit',
        maxCarryoverPct: maxPct,
        createdBy: user.userId || user.email,
      });

      await db.insertOne('trade_fund_transactions', {
        companyId: fund.companyId || fund.company_id,
        fundId: newFund.id,
        transactionType: 'carryover_in',
        amount: carryoverAmount,
        runningBalance: carryoverAmount,
        fromFundId: id,
        description: `Carryover from ${fund.fundName || fund.fund_name} (${fund.fiscalYear || fund.fiscal_year})`,
        postedBy: user.userId || user.email,
        postedAt: new Date().toISOString(),
        status: 'posted',
      });
    }

    if (forfeitedAmount > 0) {
      await db.insertOne('trade_fund_transactions', {
        companyId: fund.companyId || fund.company_id,
        fundId: id,
        transactionType: 'forfeiture',
        amount: -forfeitedAmount,
        runningBalance: 0,
        description: `Forfeited amount: ${forfeitedAmount}`,
        postedBy: user.userId || user.email,
        postedAt: new Date().toISOString(),
        status: 'posted',
      });
    }

    return c.json({
      success: true,
      data: {
        carryoverAmount,
        forfeitedAmount,
        newFund,
        policy,
        targetYear,
      }
    });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

export { tradeFundRoutes };
