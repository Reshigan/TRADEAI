# TRADEAI Sprint 0 — Business Logic Fixes

**Status:** Blocker. Must ship before Sprint 1 of the shell rebuild.
**Agent:** OpenHands + MiniMax 2.7
**Scope:** Backend only. No UI changes. No model schema changes that break existing data.
**Guiding principle:** Every change must be test-backed. A logic bug fixed without a test will regress within 90 days.

---

## Prompt preamble (paste at top of every OpenHands session)

```
You are fixing business-logic defects in the TRADEAI backend. Rules:
1. Work only in files listed under "Files touched" for each task.
2. Every task must ship with a Jest test that fails before the fix and passes after.
3. Do not change MongoDB schema fields (add virtuals/methods only). Data migration is separate work.
4. If a fix requires knowledge of domain values (thresholds, formulas), quote the
   relevant industry reference or flag it for finance-SME review in a TODO comment —
   don't invent numbers.
5. Before writing code, produce a plan with: the bug, the fix, the test, rollback risk.
   Wait for "go" before executing.
6. After each task, run `npm test -- --testPathPattern=<testfile>` and paste output.
```

---

## Defect register

| ID | Severity | Area | One-line |
|---|---|---|---|
| D-01 | **Critical** | Promotion | `approve()` has no state guard — can approve cancelled/draft/completed promotions |
| D-02 | **Critical** | Simulation | Engine queries `tenant` + `type` fields that don't exist → always returns 0 historical data |
| D-03 | **Critical** | Budget | No code path writes `budget.committed` when promotions/tradespends are approved |
| D-04 | **High** | Promotion | Role-to-approval-level map leaves `finance` role producing `undefined` → silent no-op |
| D-05 | **High** | Promotion | ROI formula is `netProfit / totalCost`, not standard `(incrementalRevenue − investment) / investment` |
| D-06 | **High** | Promotion | `findOverlapping` uses `$or` (customer OR product) → massive false positives |
| D-07 | **High** | Deduction | No state-transition guards at all |
| D-08 | **Medium** | Promotion | `grossProfit` declared but never computed |
| D-09 | **Medium** | AIPromotionValidation | "Baseline uplift" formula is a heuristic disguised as ML |
| D-10 | **Medium** | Cannibalization | One bad product throws and kills whole batch response |
| D-11 | **Medium** | Promotion | No lifecycle cron (approved→active on startDate, active→completed on endDate) |
| D-12 | **Medium** | Budget | `recordSpend` update is non-atomic (race condition) |
| D-13 | **Low** | Promotion | No validation: endDate > startDate, percentage 0–100, etc. |
| D-14 | **Low** | Promotion | Duplicate-approve creates duplicate history entries (no idempotency) |

---

## Task S0-1 — Promotion state-machine guard (D-01, D-04)

**Files touched:**
- `backend/src/models/Promotion.js`
- `backend/src/controllers/promotionController.js`
- `backend/src/__tests__/models/Promotion.state.test.js` *(new)*

**Change 1 — Add explicit state transition table at top of `Promotion.js`:**

```js
// ALLOWED status transitions — single source of truth.
// Any caller attempting a transition not in this map MUST throw.
const PROMOTION_TRANSITIONS = {
  draft:             ['pending_approval', 'cancelled'],
  pending_approval:  ['approved', 'rejected', 'draft', 'cancelled'],  // draft = recall
  approved:          ['active', 'cancelled'],
  active:            ['completed', 'cancelled'],
  completed:         [],         // terminal
  cancelled:         [],         // terminal
  rejected:          ['draft'],  // can be re-edited
};

promotionSchema.statics.canTransition = function (from, to) {
  return (PROMOTION_TRANSITIONS[from] || []).includes(to);
};

promotionSchema.methods.transitionTo = function (newStatus, userId, comment) {
  if (!promotionSchema.statics.canTransition(this.status, newStatus)) {
    const err = new Error(
      `Invalid promotion status transition: ${this.status} → ${newStatus}`
    );
    err.code = 'INVALID_TRANSITION';
    err.currentStatus = this.status;
    err.attemptedStatus = newStatus;
    throw err;
  }
  const previous = this.status;
  this.status = newStatus;
  this.history.push({
    action: `status_changed:${previous}→${newStatus}`,
    performedBy: userId,
    performedDate: new Date(),
    comment,
  });
};
```

**Change 2 — Rewrite `submitForApproval`:**

```js
promotionSchema.methods.submitForApproval = async function (userId) {
  this.transitionTo('pending_approval', userId, 'Submitted for approval');
  this.lastModifiedBy = userId;
  await this.save();
};
```

**Change 3 — Rewrite `approve` with role mapping fixed and state guard:**

```js
// Role → approval level. Explicit, no defaults. Unknown role = hard error.
const ROLE_TO_APPROVAL_LEVEL = {
  kam:      'kam',
  manager:  'manager',
  director: 'director',
  finance:  'finance',       // D-04: finance role now resolves to finance level
  admin:    'finance',       // admin acts on behalf of finance
  super_admin: 'finance',
};

promotionSchema.methods.approve = async function (userId, userRole, comments) {
  if (this.status !== 'pending_approval') {
    const err = new Error(`Cannot approve promotion in status "${this.status}"`);
    err.code = 'INVALID_TRANSITION';
    throw err;
  }

  const level = ROLE_TO_APPROVAL_LEVEL[userRole];
  if (!level) {
    const err = new Error(`Role "${userRole}" cannot approve promotions`);
    err.code = 'FORBIDDEN_ROLE';
    throw err;
  }

  const approval = this.approvals.find((a) => a.level === level);
  if (!approval) {
    const err = new Error(`No pending approval at level "${level}" for this promotion`);
    err.code = 'NO_APPROVAL_SLOT';
    throw err;
  }

  // Idempotency: if this level is already approved by this user, return without pushing history (D-14)
  if (approval.status === 'approved' && String(approval.approver) === String(userId)) {
    return { alreadyApproved: true };
  }

  approval.status = 'approved';
  approval.approver = userId;
  approval.comments = comments;
  approval.date = new Date();

  const allApproved = this.approvals.every((a) => a.status === 'approved');
  if (allApproved) {
    this.transitionTo('approved', userId, `All approvals complete (final: ${level})`);
  } else {
    this.history.push({
      action: `approval_recorded:${level}`,
      performedBy: userId,
      performedDate: new Date(),
      comment: comments,
    });
  }

  await this.save();
  return { alreadyApproved: false, fullyApproved: allApproved };
};
```

**Change 4 — Update controller:**

In `promotionController.js`, replace the body of `exports.approvePromotion`:

```js
exports.approvePromotion = asyncHandler(async (req, res, _next) => {
  const { comments } = req.body;
  const promotion = await Promotion.findById(req.params.id);
  if (!promotion) throw new AppError('Promotion not found', 404);

  try {
    const result = await promotion.approve(req.user._id, req.user.role, comments);
    res.json({
      success: true,
      message: result.fullyApproved
        ? 'Promotion fully approved'
        : 'Approval recorded, further approvals required',
      data: promotion,
    });
  } catch (err) {
    if (err.code === 'INVALID_TRANSITION') throw new AppError(err.message, 409);
    if (err.code === 'FORBIDDEN_ROLE')     throw new AppError(err.message, 403);
    if (err.code === 'NO_APPROVAL_SLOT')   throw new AppError(err.message, 404);
    throw err;
  }
});
```

**Test file `Promotion.state.test.js` (minimum cases):**

```js
describe('Promotion state machine', () => {
  let promo;
  beforeEach(async () => { promo = await makeDraftPromo(); });

  test('draft → pending_approval via submitForApproval', async () => {
    await promo.submitForApproval(userId);
    expect(promo.status).toBe('pending_approval');
  });

  test('approve on draft throws INVALID_TRANSITION', async () => {
    await expect(promo.approve(userId, 'kam', '')).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    });
  });

  test('approve on cancelled throws INVALID_TRANSITION', async () => {
    promo.status = 'cancelled';
    await expect(promo.approve(userId, 'kam', '')).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    });
  });

  test('finance role resolves to finance level', async () => {
    await promo.submitForApproval(userId);
    promo.approvals = [{ level: 'finance', status: 'pending' }];
    await promo.approve(financeUserId, 'finance', 'ok');
    expect(promo.status).toBe('approved');
  });

  test('unknown role throws FORBIDDEN_ROLE', async () => {
    await promo.submitForApproval(userId);
    await expect(promo.approve(userId, 'intern', '')).rejects.toMatchObject({
      code: 'FORBIDDEN_ROLE',
    });
  });

  test('idempotency: double-approve by same user does not duplicate history', async () => {
    await promo.submitForApproval(userId);
    promo.approvals = [{ level: 'kam', status: 'pending' }, { level: 'manager', status: 'pending' }];
    await promo.approve(userId, 'kam', '');
    const histLen = promo.history.length;
    await promo.approve(userId, 'kam', '');
    expect(promo.history.length).toBe(histLen);
  });

  test('canTransition returns false for terminal states', () => {
    expect(Promotion.canTransition('completed', 'active')).toBe(false);
    expect(Promotion.canTransition('cancelled', 'draft')).toBe(false);
  });
});
```

**Acceptance:**
```bash
cd backend && npm test -- --testPathPattern=Promotion.state
# all tests green
```

---

## Task S0-2 — SimulationEngine field-name fix (D-02)

**Files touched:**
- `backend/src/services/simulationEngine.js`
- `backend/src/__tests__/services/simulationEngine.test.js` *(new)*

**Bug:** `SimulationEngine.simulatePromotionImpact` queries `Promotion.find({ tenant: tenantId, type: promotionType, status: 'completed' })`. The real fields are `tenantId` and `promotionType`. This query always returns `[]`, so every simulation runs with default assumptions, not historical data.

**Fix — in `simulationEngine.js` line ~52:**

```js
historicalPromotions = await Promotion.find({
  tenantId,                                       // was: tenant
  promotionType,                                  // was: type
  status: 'completed',
  'financial.actual.incrementalVolume': { $exists: true, $ne: null },
}).limit(100);
```

**Also audit same file for other misnamed queries** — search for `tenant:` and `type:` usages in `.find()`/`.aggregate()` calls and correct.

**Then grep the whole services directory for the same class of bug:**

```bash
grep -rn "Promotion\.find\|Promotion\.aggregate" backend/src/services backend/src/controllers | grep -E "\btenant:|\btype:"
```

Fix every hit. Document each one in the PR description.

**Test `simulationEngine.test.js`:**

```js
test('simulatePromotionImpact pulls historical promotions for the tenant', async () => {
  const tenantId = new ObjectId();
  await Promotion.create({
    tenantId, promotionType: 'price_discount', status: 'completed',
    name: 'H1', financial: { actual: { incrementalVolume: 1000 } },
    /* ...minimum valid promo fields... */
  });
  const result = await simulationEngine.simulatePromotionImpact({
    promotionType: 'price_discount', discountPercent: 20, duration: 14,
    products: [], budget: 10000, tenantId,
  });
  expect(result.historicalDataPoints).toBeGreaterThanOrEqual(1);
});
```

Note: the test above assumes `result.historicalDataPoints` is exposed. If it isn't today, add it — it's the only way to verify the fix from the outside without mocking.

**Acceptance:**
```bash
cd backend && npm test -- --testPathPattern=simulationEngine
```

---

## Task S0-3 — Budget commitment ledger (D-03, D-12)

**This is the biggest task in Sprint 0.** Budget integrity is the single most audit-sensitive area of a TPM. Do it carefully.

**Files touched:**
- `backend/src/models/BudgetLedger.js` *(new)*
- `backend/src/services/budgetLedgerService.js` *(new)*
- `backend/src/controllers/promotionController.js` (add reservation hooks)
- `backend/src/controllers/tradeSpendController.js` (replace the racy `+=` write)
- `backend/src/models/Promotion.js` (hook into approve/cancel)
- `backend/src/__tests__/services/budgetLedger.test.js` *(new)*

**Design — append-only ledger, not in-place mutation:**

Stop mutating `budget.spent` / `budget.committed` directly. Every change is an immutable ledger entry. Budget totals are a projection, always recomputable from the ledger. This pattern makes race conditions impossible and gives a full audit trail for free.

**New model `BudgetLedger.js`:**

```js
const budgetLedgerSchema = new mongoose.Schema({
  tenantId:   { type: ObjectId, ref: 'Tenant', required: true, index: true },
  budgetId:   { type: ObjectId, ref: 'Budget', required: true, index: true },
  budgetLineMonth: { type: Number, required: true },  // 1–12
  spendType:  { type: String, enum: ['marketing', 'cashCoop', 'tradingTerms', 'promotions'], required: true },

  entryType:  { type: String, enum: ['reserve', 'release', 'spend', 'refund', 'adjustment'], required: true },
  amount:     { type: Number, required: true },      // always positive; entryType determines sign
  // signed effect:
  //   reserve  → +committed
  //   release  → −committed (e.g. promo cancelled)
  //   spend    → −committed, +spent  (when an approved thing actually transacts)
  //   refund   → −spent (rare, e.g. chargeback reversed)
  //   adjustment → manual correction (+committed/+spent/−committed/−spent)

  sourceType: { type: String, enum: ['promotion', 'tradeSpend', 'claim', 'deduction', 'manual'], required: true },
  sourceId:   { type: ObjectId, required: true },
  correlationId: { type: String, required: true },   // dedup key; unique per (sourceId, lifecycle event)

  performedBy: { type: ObjectId, ref: 'User', required: true },
  reason:     String,
  createdAt:  { type: Date, default: Date.now, index: true },
});

budgetLedgerSchema.index({ correlationId: 1 }, { unique: true });  // idempotency
budgetLedgerSchema.index({ budgetId: 1, budgetLineMonth: 1, spendType: 1 });
```

**New service `budgetLedgerService.js`:**

```js
async function post(entry) {
  // Idempotent: if an entry with this correlationId exists, return it, do not insert.
  try {
    return await BudgetLedger.create(entry);
  } catch (e) {
    if (e.code === 11000) {                 // duplicate correlationId
      return BudgetLedger.findOne({ correlationId: entry.correlationId });
    }
    throw e;
  }
}

async function rollup(budgetId, month, spendType) {
  const agg = await BudgetLedger.aggregate([
    { $match: { budgetId, budgetLineMonth: month, spendType } },
    { $group: {
      _id: null,
      committed: { $sum: {
        $switch: { branches: [
          { case: { $eq: ['$entryType', 'reserve'] }, then: '$amount' },
          { case: { $eq: ['$entryType', 'release'] }, then: { $multiply: ['$amount', -1] } },
          { case: { $eq: ['$entryType', 'spend'] },   then: { $multiply: ['$amount', -1] } },
        ], default: 0 }
      }},
      spent: { $sum: {
        $switch: { branches: [
          { case: { $eq: ['$entryType', 'spend'] },  then: '$amount' },
          { case: { $eq: ['$entryType', 'refund'] }, then: { $multiply: ['$amount', -1] } },
        ], default: 0 }
      }},
    }}
  ]);
  return { committed: agg[0]?.committed || 0, spent: agg[0]?.spent || 0 };
}

async function available(budgetId, month, spendType) {
  const budget = await Budget.findById(budgetId);
  const line = budget.budgetLines.find(l => l.month === month);
  const budgeted = line?.tradeSpend?.[spendType]?.budget || 0;
  const { committed, spent } = await rollup(budgetId, month, spendType);
  return { budgeted, committed, spent, available: budgeted - committed - spent };
}

module.exports = { post, rollup, available };
```

**Hook into promotion lifecycle (in `Promotion.js` post-save hook or in controller):**

```js
// When a promotion moves pending_approval → approved: post reserve entries for each allocation
// When cancelled or rejected: post release entries
// When moved to completed and financial.actual.costs is set: convert reserves to spends

// In promotionController.approvePromotion, after the transition to 'approved':
if (result.fullyApproved) {
  const month = new Date(promotion.period.startDate).getMonth() + 1;
  const correlation = `promo:${promotion._id}:reserve:${promotion.version || 1}`;
  for (const [spendType, alloc] of Object.entries({
    marketing:     promotion.budgetAllocation?.marketing,
    cashCoop:      promotion.budgetAllocation?.cashCoop,
    tradingTerms:  promotion.budgetAllocation?.tradingTerms,
  })) {
    if (!alloc?.budgetId || !alloc.amount) continue;
    await budgetLedgerService.post({
      tenantId: promotion.tenantId,
      budgetId: alloc.budgetId,
      budgetLineMonth: month,
      spendType,
      entryType: 'reserve',
      amount: alloc.amount,
      sourceType: 'promotion',
      sourceId: promotion._id,
      correlationId: `${correlation}:${spendType}`,
      performedBy: req.user._id,
      reason: `Reserved on approval of promotion ${promotion.promotionId}`,
    });
  }
}
```

**Replace the racy write in `tradeSpendController.recordSpend`:**

```js
if (tradeSpend.budget) {
  await budgetLedgerService.post({
    tenantId: tradeSpend.tenantId,
    budgetId: tradeSpend.budget,
    budgetLineMonth: new Date(tradeSpend.period.startDate).getMonth() + 1,
    spendType: tradeSpend.spendType,
    entryType: 'spend',
    amount,
    sourceType: 'tradeSpend',
    sourceId: tradeSpend._id,
    correlationId: `tradespend:${tradeSpend._id}:spend:${Date.now()}`,
    performedBy: req.user._id,
    reason: 'Trade spend recorded',
  });
}
```

**Migration — seed the ledger from existing state:**

One-time script `scripts/seed-budget-ledger.js`:
- For every Budget, for every budgetLine, for every spendType where `spent > 0`, insert a single ledger entry with `entryType: 'spend'`, `sourceType: 'manual'`, `correlationId: migration:<budgetId>:<month>:<type>`, `reason: 'Historical balance migrated'`.
- Do the same for any `committed > 0` with `entryType: 'reserve'`.

**Deprecate in-place fields:**

Mark `budget.budgetLines[].tradeSpend[].spent` and `.committed` as read-only computed fields. Update any API that reads them to call `budgetLedgerService.rollup()` instead. Leave the schema fields present for the migration window — delete in Sprint 6.

**Tests — `budgetLedger.test.js`:**

```js
test('posting same correlationId twice only creates one entry', async () => {
  const entry = { /* valid entry */, correlationId: 'test:1' };
  const a = await budgetLedgerService.post(entry);
  const b = await budgetLedgerService.post(entry);
  expect(String(a._id)).toBe(String(b._id));
  const count = await BudgetLedger.countDocuments({ correlationId: 'test:1' });
  expect(count).toBe(1);
});

test('rollup correctly computes committed after reserve + release', async () => {
  await budgetLedgerService.post({ /* reserve 100, correlationId: r1 */ });
  await budgetLedgerService.post({ /* release 30, correlationId: r2 */ });
  const { committed } = await budgetLedgerService.rollup(budgetId, month, 'marketing');
  expect(committed).toBe(70);
});

test('spend converts committed to spent', async () => {
  await budgetLedgerService.post({ /* reserve 100, correlationId: r1 */ });
  await budgetLedgerService.post({ /* spend 40, correlationId: s1 */ });
  const { committed, spent } = await budgetLedgerService.rollup(budgetId, month, 'marketing');
  expect(committed).toBe(60);
  expect(spent).toBe(40);
});

test('promotion approval creates reserve entry', async () => {
  const promo = await makePromoWithAllocation();
  await promo.submitForApproval(userId);
  promo.approvals = [{ level: 'kam', status: 'pending' }];
  await promo.approve(userId, 'kam', '');
  const entries = await BudgetLedger.find({ sourceId: promo._id, entryType: 'reserve' });
  expect(entries.length).toBeGreaterThan(0);
});

test('concurrent recordSpend does not double-charge (idempotency)', async () => {
  // Fire same spend 10x in parallel with same correlationId
  await Promise.all(Array.from({ length: 10 }, () =>
    budgetLedgerService.post({ /* same entry, same correlationId */ })));
  const count = await BudgetLedger.countDocuments({ correlationId: 'race-test' });
  expect(count).toBe(1);
});
```

**Acceptance:**
```bash
npm test -- --testPathPattern=budgetLedger
# + manual: create promo, approve, check GET /api/budgets/:id shows increased committed
# + manual: cancel the promo, check committed goes back down
```

---

## Task S0-4 — Correct ROI formula (D-05, D-08)

**Files touched:**
- `backend/src/models/Promotion.js`
- `backend/src/__tests__/models/Promotion.roi.test.js` *(new)*

**Bug:** Current formula at line 520–526 computes `netProfit = incrementalRevenue − totalCost`, then `ROI = netProfit / totalCost * 100`. This conflates "cost" (COGS of incremental units) with "investment" (trade spend) and double-counts.

**Industry-standard trade promotion ROI:**

```
grossProfit     = incrementalRevenue − incrementalCOGS
netProfit       = grossProfit − promoInvestment
ROI%            = (netProfit / promoInvestment) × 100
```

Where `promoInvestment` = discountCost + marketingCost + cashCoopCost + displayCost + logisticsCost (i.e. the current `totalCost`), and `incrementalCOGS` = (cost of each incremental unit × incrementalVolume).

**Change — in the pre-save hook:**

```js
// Replace the existing profitability calc block
if (this.financial?.actual?.incrementalRevenue != null) {
  const incRev = Number(this.financial.actual.incrementalRevenue) || 0;
  const incVol = Number(this.financial.actual.incrementalVolume) || 0;
  // Unit cost: weighted average of product costs × incremental volume.
  // If per-unit cost is not present on products, leave incrementalCOGS = 0 and flag.
  const incCOGS = this._incrementalCOGS != null
    ? this._incrementalCOGS
    : 0;  // set by controller before save when product cost data available
  const promoInvestment = Number(this.financial.costs?.totalCost) || 0;

  this.financial.profitability = this.financial.profitability || {};
  this.financial.profitability.grossProfit = incRev - incCOGS;
  this.financial.profitability.netProfit   = (incRev - incCOGS) - promoInvestment;

  this.financial.profitability.roi = promoInvestment > 0
    ? (this.financial.profitability.netProfit / promoInvestment) * 100
    : null;     // undefined ROI when no investment, not 0 or Infinity

  this.financial.profitability.profitPerUnit = incVol > 0
    ? this.financial.profitability.netProfit / incVol
    : null;
}
```

**Controller change** — wherever `calculatePerformance` is called, compute incremental COGS from product cost data and set `promotion._incrementalCOGS` before `save()`. If product cost data is missing, log a warning and leave it 0 — do NOT silently inflate ROI.

**Tests:**

```js
test('ROI is netProfit / investment, not netProfit / cost', () => {
  promo.financial.actual.incrementalRevenue = 10000;
  promo._incrementalCOGS = 4000;
  promo.financial.costs.totalCost = 2000;  // promo investment
  // expected: gross = 6000, net = 4000, ROI = 200%
  promo.markModified('financial');
  return promo.save().then(() => {
    expect(promo.financial.profitability.grossProfit).toBe(6000);
    expect(promo.financial.profitability.netProfit).toBe(4000);
    expect(promo.financial.profitability.roi).toBe(200);
  });
});

test('ROI is null when investment is zero (not Infinity, not 0)', async () => {
  promo.financial.actual.incrementalRevenue = 10000;
  promo.financial.costs.totalCost = 0;
  await promo.save();
  expect(promo.financial.profitability.roi).toBeNull();
});
```

**Flag for finance-SME review:** Put a comment block at the top of the pre-save hook: `// TODO(finance-sme): verify ROI definition matches company's accounting policy. Options: (a) gross margin ROI, (b) net margin ROI, (c) ROMI. Current impl = net margin ROI on promo investment only.`

**Acceptance:**
```bash
npm test -- --testPathPattern=Promotion.roi
```

---

## Task S0-5 — `findOverlapping` conflict logic (D-06)

**Files touched:**
- `backend/src/models/Promotion.js`
- `backend/src/__tests__/models/Promotion.overlap.test.js` *(new)*

**Bug:** Current query uses `$or: [{customer}, {product}]` → flags any promo on same customer OR same product. Two promos on the same customer for different products (common) are flagged as conflicts.

**Fix — replace `findOverlapping`:**

```js
// Find promotions that overlap on BOTH customer AND at least one shared product.
// Params accept arrays to support multi-customer, multi-product promos.
promotionSchema.statics.findOverlapping = function ({
  customerIds, productIds, startDate, endDate, tenantId, excludeId,
}) {
  const q = {
    tenantId,
    _id: excludeId ? { $ne: excludeId } : { $exists: true },
    'scope.customers.customer': { $in: customerIds },
    'products.product':         { $in: productIds },
    'period.startDate':         { $lte: endDate },
    'period.endDate':           { $gte: startDate },
    status: { $in: ['approved', 'active'] },
  };
  return this.find(q);
};
```

**Tests:**

```js
test('does not flag same customer, different product', async () => {
  await Promotion.create({ /* customer A, product X, active */ });
  const overlaps = await Promotion.findOverlapping({
    customerIds: [customerA], productIds: [productY],  // different product
    startDate, endDate, tenantId,
  });
  expect(overlaps).toHaveLength(0);
});

test('flags same customer + same product + overlapping dates', async () => {
  await Promotion.create({ /* customer A, product X, Jan 1–Feb 1, active */ });
  const overlaps = await Promotion.findOverlapping({
    customerIds: [customerA], productIds: [productX],
    startDate: new Date('2025-01-15'), endDate: new Date('2025-01-20'),
    tenantId,
  });
  expect(overlaps).toHaveLength(1);
});

test('excludes the promotion being edited (excludeId)', async () => {
  const p = await Promotion.create({ /* etc */ });
  const overlaps = await Promotion.findOverlapping({ ...args, excludeId: p._id });
  expect(overlaps.find(o => String(o._id) === String(p._id))).toBeUndefined();
});
```

**Audit callers:** Any code that calls the old `findOverlapping(customerId, productId, start, end)` 4-positional form must be updated to the new options object. Grep:

```bash
grep -rn "findOverlapping" backend/src
```

Update each site.

**Acceptance:**
```bash
npm test -- --testPathPattern=Promotion.overlap
```

---

## Task S0-6 — Deduction state machine (D-07)

**Files touched:**
- `backend/src/models/Deduction.js`
- `backend/src/controllers/deductionController.js` *(if it exists; otherwise wherever deductions are mutated)*
- `backend/src/__tests__/models/Deduction.state.test.js` *(new)*

**Same pattern as S0-1 for the Deduction model:**

```js
const DEDUCTION_TRANSITIONS = {
  pending:            ['matched', 'disputed', 'rejected'],
  matched:            ['approved', 'disputed', 'rejected'],
  disputed:           ['approved', 'rejected', 'partially_approved'],
  approved:           [],                    // terminal — once approved, settle via Settlement flow
  partially_approved: [],                    // terminal
  rejected:           [],                    // terminal
};

deductionSchema.statics.canTransition = function (from, to) {
  return (DEDUCTION_TRANSITIONS[from] || []).includes(to);
};

deductionSchema.methods.transitionTo = function (newStatus, userId, comment) {
  if (!deductionSchema.statics.canTransition(this.status, newStatus)) {
    const err = new Error(`Invalid deduction status: ${this.status} → ${newStatus}`);
    err.code = 'INVALID_TRANSITION';
    throw err;
  }
  this.status = newStatus;
  // append history entry to an audit log — reuse Deduction's existing history array if present,
  // otherwise emit to AuditLog collection via auditService.
};

deductionSchema.methods.match       = function (txnId, uid) { this.matchedTransaction = txnId; this.transitionTo('matched', uid); return this.save(); };
deductionSchema.methods.dispute     = function (reason, uid) { this.disputeReason = reason; this.transitionTo('disputed', uid, reason); return this.save(); };
deductionSchema.methods.approve     = function (amount, uid) {
  if (amount > this.amount) throw new Error('Approved amount exceeds claimed');
  this.approvedAmount = amount;
  this.transitionTo(amount < this.amount ? 'partially_approved' : 'approved', uid);
  return this.save();
};
deductionSchema.methods.reject      = function (reason, uid) { this.rejectionReason = reason; this.transitionTo('rejected', uid, reason); return this.save(); };
```

**Tests:** Mirror the Promotion state test structure — every invalid transition throws, every valid one works.

---

## Task S0-7 — Promotion lifecycle cron (D-11)

**Files touched:**
- `backend/src/jobs/promotionLifecycle.js` *(new)*
- `backend/src/jobs/index.js` (register the job)
- `backend/src/__tests__/jobs/promotionLifecycle.test.js` *(new)*

**Job logic — runs every 15 minutes:**

```js
module.exports = async function promotionLifecycleJob() {
  const now = new Date();

  // Step 1: approved promos whose start date has arrived → active
  const toActivate = await Promotion.find({
    status: 'approved',
    'period.startDate': { $lte: now },
  });
  for (const p of toActivate) {
    try {
      p.transitionTo('active', SYSTEM_USER_ID, 'Auto-activated on start date');
      await p.save();
      logger.info(`Activated promotion ${p.promotionId}`);
    } catch (e) {
      logger.error(`Failed to activate ${p.promotionId}`, e);
    }
  }

  // Step 2: active promos whose end date has passed → completed
  const toComplete = await Promotion.find({
    status: 'active',
    'period.endDate': { $lt: now },
  });
  for (const p of toComplete) {
    try {
      p.transitionTo('completed', SYSTEM_USER_ID, 'Auto-completed on end date');
      await p.save();
      // Kick off post-event analysis (task P3-4 in main spec)
      logger.info(`Completed promotion ${p.promotionId}`);
    } catch (e) {
      logger.error(`Failed to complete ${p.promotionId}`, e);
    }
  }

  return { activated: toActivate.length, completed: toComplete.length };
};
```

**Register in `jobs/index.js` next to the budget alert:**

```js
await queues.promotionLifecycle.add(
  'lifecycle-tick',
  {},
  { repeat: { cron: '*/15 * * * *' }, ...config.jobs.defaultJobOptions }
);
```

**Test:** Create promotions in `approved`/`active` with past dates; run the job function directly; assert state transitions happened.

---

## Task S0-8 — Honest AI labelling (D-09)

**Files touched:**
- `backend/src/services/aiPromotionValidationService.js`
- `backend/src/services/aiHeuristics/` *(new subfolder — move pure heuristics here)*

**Change — rename and relabel:**

The file is honest about what it is, or it becomes what it pretends to be.

**Option A (fastest, do first):** Rename the service file's class from `AIPromotionValidationService` to `HeuristicPromotionValidationService`, set `modelVersion: 'heuristic-v1'` and add:

```js
/**
 * HEURISTIC (NOT ML) promotion validation.
 * Formula: baselineUplift = sqrt(discount%) × 3.5 × categoryFactor.
 * This is a rule-of-thumb based on industry averages, NOT a trained model.
 * For real predictions, see forecastingService.predictPromotionPerformance,
 * which uses historical regression on completed promotions.
 */
```

Add to every response payload: `source: 'heuristic'`, `warning: 'Not a trained ML prediction. Use forecastingService for model-based forecasts.'`

**Option B (Sprint 1+):** Replace the heuristic function with a call to `forecastingService.predictPromotionPerformance(tenantId, promotionData)` whenever the tenant has ≥ 5 completed historical promotions in the same category. Fall back to the heuristic only when there's no history.

Ship Option A now, put Option B in the Shell v4 AI-layer sprint (Task A of the main spec — the findings service adapter for this service should prefer forecasting output when available).

**Test:** Snapshot test on the response — ensure the new `source` and `warning` fields are always present.

---

## Task S0-9 — Cannibalization error isolation (D-10)

**File touched:** `backend/src/services/cannibalizationService.js`

**Change — wrap the per-product loop in try/catch, collect errors, return partial results:**

```js
const cannibalizationResults = [];
const errors = [];

for (const relatedProduct of relatedProducts) {
  if (relatedProduct._id.toString() === productId) continue;
  try {
    // ... existing per-product logic ...
    if (cannibalizationRate > 10) cannibalizationResults.push({ /* ... */ });
  } catch (err) {
    errors.push({ productId: relatedProduct._id, message: err.message });
    logger.warn(`Cannibalization analysis failed for product ${relatedProduct._id}`, err);
  }
}

return {
  cannibalizationResults,
  errors,              // callers can decide how to surface
  partial: errors.length > 0,
};
```

**Test:** Inject one product that will throw (e.g., force a null baseline) — assert that other products still produce results and `partial: true`.

---

## Task S0-10 — Input validation (D-13)

**Files touched:**
- `backend/src/models/Promotion.js`
- `backend/src/validators/promotionValidators.js` *(likely exists — extend it)*

**Add as pre-save validator on Promotion:**

```js
promotionSchema.pre('validate', function (next) {
  const errors = [];

  if (this.period?.startDate && this.period?.endDate &&
      this.period.endDate <= this.period.startDate) {
    errors.push('period.endDate must be after period.startDate');
  }

  if (this.mechanics?.discountType === 'percentage' &&
      (this.mechanics.discountValue < 0 || this.mechanics.discountValue > 100)) {
    errors.push('percentage discountValue must be 0–100');
  }

  if (this.mechanics?.discountType === 'fixed_amount' && this.mechanics.discountValue < 0) {
    errors.push('fixed_amount discountValue must be >= 0');
  }

  if (this.products?.length === 0) {
    errors.push('promotion must have at least one product');
  }

  if (errors.length > 0) return next(new mongoose.Error.ValidationError({ errors }));
  next();
});
```

**Test each rule.** Don't write one giant test — one test per rule, so failures are self-describing.

---

## Sprint 0 sequencing

| Day | Task | Blocker for |
|---|---|---|
| 1 | S0-1 Promotion state machine | Everything downstream |
| 2 | S0-2 Simulation field names | Scenario UI work |
| 3–5 | S0-3 Budget ledger | Shell UI showing budget tiles; any financial dashboard |
| 6 | S0-4 ROI formula + S0-8 AI labelling | Post-mortem reports; AI advisory strip |
| 7 | S0-5 Overlap fix + S0-6 Deduction states | Conflict tab in promotion UI; Deduction Hub |
| 8 | S0-7 Lifecycle cron + S0-9 Canib isolation + S0-10 Validation | Low risk, parallelizable |

**~8 working days for one engineer.** All tasks are independently mergeable.

---

## Sprint 0 Definition of Done

Every task must:
1. Have a failing-first-then-passing Jest test.
2. Not break any currently-passing test (`npm test` clean).
3. Have its fix described in one paragraph in the PR body, linking to the defect ID.
4. Include an entry in `CHANGELOG.md` under a new `## Sprint 0 — Business Logic Fixes` section.
5. Include a note in `RUNBOOK.md` for any behaviour change that ops needs to know (e.g. "approvals now 409 on invalid state — was previously silent").

**Regression exit criteria before Sprint 1 starts:**
- `npm test` in `backend/` — all green
- Manual smoke: create → submit → approve → cancel → confirm budget ledger entries exist and net to zero
- Manual smoke: try to approve a completed promo → 409
- Manual smoke: run simulation — confirm historical data is actually pulled (log line shows count > 0 with real data)
