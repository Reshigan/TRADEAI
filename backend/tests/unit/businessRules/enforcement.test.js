const mongoose = require('mongoose');

jest.mock('../../../src/middleware/errorHandler', () => {
  const actual = jest.requireActual('../../../src/middleware/errorHandler');
  return {
    ...actual,
    asyncHandler: (fn) => (req, res, next) => fn(req, res, next)
  };
});

jest.mock('../../../src/models/BusinessRulesConfig', () => ({
  getOrCreate: jest.fn()
}));
jest.mock('../../../src/models/Promotion', () => {
  const M = function () {};
  M.countDocuments = jest.fn().mockResolvedValue(0);
  M.create = jest.fn().mockImplementation(d => Promise.resolve({ _id: 'promo1', ...d }));
  M.findOverlapping = jest.fn().mockResolvedValue([]);
  return M;
});
jest.mock('../../../src/models/Product', () => {
  const M = function () {};
  M.find = jest.fn().mockResolvedValue([{ _id: 'p1', name: 'TestProduct', category: 'snacks', isPromotableInPeriod: () => true }]);
  return M;
});
jest.mock('../../../src/models/SalesHistory');
jest.mock('../../../src/services/mlService', () => ({ predictPromotionEffectiveness: jest.fn(), generateBudgetForecast: jest.fn() }));
jest.mock('../../../src/utils/logger', () => ({ logAudit: jest.fn(), info: jest.fn(), error: jest.fn(), warn: jest.fn() }));

jest.mock('../../../src/models/Budget', () => {
  const M = function () {};
  M.create = jest.fn().mockImplementation(d => Promise.resolve({ _id: 'bud1', ...d }));
  return M;
});
jest.mock('../../../src/services/cacheService', () => ({ cacheService: { get: jest.fn(), set: jest.fn() } }));

jest.mock('../../../src/models/Rebate', () => {
  const M = function () {};
  M.create = jest.fn().mockImplementation(d => Promise.resolve({ _id: 'reb1', ...d }));
  return M;
});
jest.mock('../../../src/models/RebateAccrual');
jest.mock('../../../src/models/Transaction');
jest.mock('../../../src/services/rebateCalculationService');

jest.mock('../../../src/models/TradeSpend', () => {
  const M = function () {};
  M.create = jest.fn().mockImplementation(d => Promise.resolve({ _id: 'ts1', ...d }));
  return M;
});
jest.mock('../../../src/models/User');

jest.mock('../../../src/models/Allocation', () => {
  const M = function (data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); };
  M.findBySource = jest.fn().mockResolvedValue(null);
  return M;
});
jest.mock('../../../src/services/allocationService', () => ({
  executeAllocation: jest.fn().mockResolvedValue({
    success: true,
    allocation: { allocations: [] },
    metadata: { totalAllocated: 1000, hasHistoricalData: true }
  })
}));
jest.mock('../../../src/utils/scopeResolver');

jest.mock('../../../src/models/Claim', () => {
  const M = function (data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); };
  M.findUnmatched = jest.fn().mockResolvedValue([]);
  return M;
});
jest.mock('../../../src/models/Deduction', () => {
  const M = function (data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); };
  M.findUnmatched = jest.fn().mockResolvedValue([]);
  return M;
});
jest.mock('../../../src/models/Invoice');

const BusinessRulesConfig = require('../../../src/models/BusinessRulesConfig');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

const defaultRules = (overrides = {}) => ({
  promotions: {
    discountCaps: { maxPercent: 60, maxAbsolute: 0, requireJustificationOverPercent: 40 },
    stacking: { allowStacking: false, maxStackedPromotions: 1, overlapPolicy: 'disallow' },
    duration: { minDays: 1, maxDays: 90 },
    roi: { minExpectedROI: 0, requireSimulation: false }
  },
  budgets: {
    allocationCaps: { overallPercentOfRevenue: 20 },
    guardrails: { requireROIForSpendOverAmount: 0 },
    approvals: { thresholds: [] }
  },
  rebates: {
    accrualRates: new Map(),
    settlement: { cycle: 'quarterly', settlementWindowDays: 30 }
  },
  claims: { autoMatching: true, writeoffLimits: 0 },
  ...overrides
});

describe('Business Rules Enforcement', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockNext.mockReset();
  });

  describe('Promotion Rules', () => {
    let promotionController;
    const Promotion = require('../../../src/models/Promotion');

    beforeAll(() => {
      promotionController = require('../../../src/controllers/promotionController');
    });

    const baseReq = (overrides = {}) => ({
      tenantId: 'tenant1',
      user: { _id: 'user1', tenantId: 'tenant1' },
      body: {
        name: 'Test Promo',
        products: [{ product: 'p1' }],
        period: {
          startDate: new Date('2026-03-01'),
          endDate: new Date('2026-03-15')
        },
        mechanics: { discountType: 'percentage', discountValue: 10 },
        scope: { customers: [{ customer: 'c1' }] },
        ...overrides
      }
    });

    test('POSITIVE: allows promotion within duration limits', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules());
      Promotion.findOverlapping.mockResolvedValue([]);
      const req = baseReq();
      const res = mockRes();
      await promotionController.createPromotion(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('NEGATIVE: rejects promotion below minDays', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        promotions: {
          ...defaultRules().promotions,
          duration: { minDays: 30, maxDays: 90 }
        }
      }));
      Promotion.findOverlapping.mockResolvedValue([]);
      const req = baseReq({
        period: { startDate: new Date('2026-03-01'), endDate: new Date('2026-03-05') }
      });
      const res = mockRes();
      await expect(
        promotionController.createPromotion(req, res, mockNext)
      ).rejects.toThrow(/below minimum/);
    });

    test('NEGATIVE: rejects promotion exceeding maxDays', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        promotions: {
          ...defaultRules().promotions,
          duration: { minDays: 1, maxDays: 10 }
        }
      }));
      Promotion.findOverlapping.mockResolvedValue([]);
      const req = baseReq({
        period: { startDate: new Date('2026-03-01'), endDate: new Date('2026-06-01') }
      });
      const res = mockRes();
      await expect(
        promotionController.createPromotion(req, res, mockNext)
      ).rejects.toThrow(/exceeds maximum/);
    });

    test('POSITIVE: allows percentage discount within cap', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules());
      Promotion.findOverlapping.mockResolvedValue([]);
      const req = baseReq({
        mechanics: { discountType: 'percentage', discountValue: 50 }
      });
      const res = mockRes();
      await promotionController.createPromotion(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('NEGATIVE: rejects percentage discount exceeding cap', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        promotions: {
          ...defaultRules().promotions,
          discountCaps: { maxPercent: 30, maxAbsolute: 0, requireJustificationOverPercent: 20 }
        }
      }));
      Promotion.findOverlapping.mockResolvedValue([]);
      const req = baseReq({
        mechanics: { discountType: 'percentage', discountValue: 50 }
      });
      const res = mockRes();
      await expect(
        promotionController.createPromotion(req, res, mockNext)
      ).rejects.toThrow(/exceeds cap/);
    });

    test('NEGATIVE: rejects fixed_amount discount exceeding maxAbsolute', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        promotions: {
          ...defaultRules().promotions,
          discountCaps: { maxPercent: 60, maxAbsolute: 100, requireJustificationOverPercent: 40 }
        }
      }));
      Promotion.findOverlapping.mockResolvedValue([]);
      const req = baseReq({
        mechanics: { discountType: 'fixed_amount', discountValue: 200 }
      });
      const res = mockRes();
      await expect(
        promotionController.createPromotion(req, res, mockNext)
      ).rejects.toThrow(/exceeds cap/);
    });

    test('NEGATIVE: rejects overlapping promotion when stacking disallowed', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules());
      Promotion.findOverlapping.mockResolvedValue([{ _id: 'existing1' }]);
      const req = baseReq();
      const res = mockRes();
      await expect(
        promotionController.createPromotion(req, res, mockNext)
      ).rejects.toThrow(/not allowed by policy/);
    });

    test('NEGATIVE: rejects when stacking limit exceeded', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        promotions: {
          ...defaultRules().promotions,
          stacking: { allowStacking: true, maxStackedPromotions: 2, overlapPolicy: 'allow_all' }
        }
      }));
      Promotion.findOverlapping.mockResolvedValue([{ _id: 'e1' }, { _id: 'e2' }]);
      const req = baseReq();
      const res = mockRes();
      await expect(
        promotionController.createPromotion(req, res, mockNext)
      ).rejects.toThrow(/Stacking limit/);
    });

    test('POSITIVE: allows stacking within limit', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        promotions: {
          ...defaultRules().promotions,
          stacking: { allowStacking: true, maxStackedPromotions: 3, overlapPolicy: 'allow_all' }
        }
      }));
      Promotion.findOverlapping.mockResolvedValue([{ _id: 'e1' }]);
      const req = baseReq();
      const res = mockRes();
      await promotionController.createPromotion(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Budget Rules', () => {
    let budgetController;

    beforeAll(() => {
      budgetController = require('../../../src/controllers/budgetController');
    });

    const baseReq = (bodyOverrides = {}) => ({
      user: { _id: 'user1', company: 'comp1' },
      body: {
        year: 2026,
        budgetType: 'marketing',
        totalAmount: 5000,
        ...bodyOverrides
      }
    });

    test('POSITIVE: allows budget creation when no guardrails triggered', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules());
      const req = baseReq({ total_amount: 5000 });
      const res = mockRes();
      await budgetController.createBudget(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('NEGATIVE: rejects budget over ROI threshold without ROI', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        budgets: {
          ...defaultRules().budgets,
          guardrails: { requireROIForSpendOverAmount: 10000 }
        }
      }));
      const req = baseReq({ total_amount: 20000 });
      const res = mockRes();
      await expect(
        budgetController.createBudget(req, res, mockNext)
      ).rejects.toThrow(/ROI justification required/);
    });

    test('POSITIVE: allows budget over ROI threshold with expectedROI', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        budgets: {
          ...defaultRules().budgets,
          guardrails: { requireROIForSpendOverAmount: 10000 }
        }
      }));
      const req = baseReq({ total_amount: 20000, expectedROI: 1.5 });
      const res = mockRes();
      await budgetController.createBudget(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('NEGATIVE: rejects budget exceeding overall revenue % cap', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        budgets: {
          ...defaultRules().budgets,
          allocationCaps: { overallPercentOfRevenue: 10 }
        }
      }));
      const req = baseReq({ total_amount: 15000, revenueBase: 100000 });
      const res = mockRes();
      await expect(
        budgetController.createBudget(req, res, mockNext)
      ).rejects.toThrow(/exceeds.*revenue cap/);
    });

    test('POSITIVE: allows budget within overall revenue % cap', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        budgets: {
          ...defaultRules().budgets,
          allocationCaps: { overallPercentOfRevenue: 20 }
        }
      }));
      const req = baseReq({ total_amount: 15000, revenueBase: 100000 });
      const res = mockRes();
      await budgetController.createBudget(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Rebate Rules', () => {
    let rebateController;

    beforeAll(() => {
      rebateController = require('../../../src/controllers/rebateController');
    });

    const baseReq = (bodyOverrides = {}) => ({
      user: { _id: 'user1', company: 'comp1' },
      body: {
        name: 'Test Rebate',
        type: 'volume',
        rate: 5,
        customer: 'cust1',
        ...bodyOverrides
      }
    });

    test('POSITIVE: allows rebate within accrual rate limit', async () => {
      const rules = defaultRules();
      rules.rebates.accrualRates = new Map([['volume', 10]]);
      BusinessRulesConfig.getOrCreate.mockResolvedValue(rules);
      const req = baseReq({ type: 'volume', rate: 8 });
      const res = mockRes();
      await rebateController.createRebate(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('NEGATIVE: rejects rebate rate exceeding max for type', async () => {
      const rules = defaultRules();
      rules.rebates.accrualRates = new Map([['volume', 5]]);
      BusinessRulesConfig.getOrCreate.mockResolvedValue(rules);
      const req = baseReq({ type: 'volume', rate: 8 });
      const res = mockRes();
      await expect(
        rebateController.createRebate(req, res, mockNext)
      ).rejects.toThrow(/exceeds max.*for type/);
    });

    test('POSITIVE: allows accrual period within settlement cycle', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        rebates: {
          accrualRates: new Map(),
          settlement: { cycle: 'quarterly', settlementWindowDays: 30 }
        }
      }));
      const req = baseReq({ accrualPeriod: 'monthly' });
      const res = mockRes();
      await rebateController.createRebate(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('NEGATIVE: rejects accrual period exceeding settlement cycle', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        rebates: {
          accrualRates: new Map(),
          settlement: { cycle: 'monthly', settlementWindowDays: 30 }
        }
      }));
      const req = baseReq({ accrualPeriod: 'quarterly' });
      const res = mockRes();
      await expect(
        rebateController.createRebate(req, res, mockNext)
      ).rejects.toThrow(/exceeds settlement cycle/);
    });
  });

  describe('Trade Spend Rules', () => {
    let tradeSpendController;

    beforeAll(() => {
      tradeSpendController = require('../../../src/controllers/tradeSpendController');
    });

    describe('getRequiredApprovals', () => {
      test('uses config thresholds when provided', () => {
        const thresholds = [
          { amount: 1000, approverRole: 'teamlead' },
          { amount: 5000, approverRole: 'vp' }
        ];
        const result = tradeSpendController.getRequiredApprovals(6000, 'marketing', thresholds);
        expect(result).toEqual([
          { level: 'teamlead', status: 'pending' },
          { level: 'vp', status: 'pending' }
        ]);
      });

      test('falls back to defaults when no config thresholds', () => {
        const result = tradeSpendController.getRequiredApprovals(3000, 'marketing');
        expect(result).toEqual([{ level: 'kam', status: 'pending' }]);
      });

      test('default: amount <= 5000 gets kam only', () => {
        const result = tradeSpendController.getRequiredApprovals(5000, 'marketing');
        expect(result).toHaveLength(1);
        expect(result[0].level).toBe('kam');
      });

      test('default: amount <= 20000 gets kam + manager', () => {
        const result = tradeSpendController.getRequiredApprovals(10000, 'marketing');
        expect(result).toHaveLength(2);
        expect(result.map(r => r.level)).toEqual(['kam', 'manager']);
      });

      test('default: amount <= 50000 gets kam + manager + director', () => {
        const result = tradeSpendController.getRequiredApprovals(30000, 'marketing');
        expect(result).toHaveLength(3);
        expect(result.map(r => r.level)).toEqual(['kam', 'manager', 'director']);
      });

      test('default: amount > 50000 gets kam + manager + director + board', () => {
        const result = tradeSpendController.getRequiredApprovals(100000, 'marketing');
        expect(result).toHaveLength(4);
        expect(result.map(r => r.level)).toEqual(['kam', 'manager', 'director', 'board']);
      });

      test('cash_coop over 10000 adds finance approval', () => {
        const result = tradeSpendController.getRequiredApprovals(15000, 'cash_coop');
        expect(result.some(r => r.level === 'finance')).toBe(true);
      });

      test('rebate over 10000 adds finance approval', () => {
        const result = tradeSpendController.getRequiredApprovals(15000, 'rebate');
        expect(result.some(r => r.level === 'finance')).toBe(true);
      });

      test('non-cash_coop/rebate does not add finance', () => {
        const result = tradeSpendController.getRequiredApprovals(15000, 'marketing');
        expect(result.some(r => r.level === 'finance')).toBe(false);
      });

      test('config thresholds: only matches amounts >= threshold', () => {
        const thresholds = [
          { amount: 10000, approverRole: 'manager' },
          { amount: 50000, approverRole: 'director' }
        ];
        const result = tradeSpendController.getRequiredApprovals(10000, 'marketing', thresholds);
        expect(result).toEqual([{ level: 'manager', status: 'pending' }]);
      });
    });
  });

  describe('Allocation Rules', () => {
    let allocationController;
    const allocationService = require('../../../src/services/allocationService');

    beforeAll(() => {
      allocationController = require('../../../src/controllers/allocationController');
    });

    const baseReq = (bodyOverrides = {}) => ({
      user: { _id: 'user1', companyId: 'comp1', company: 'comp1' },
      body: {
        sourceType: 'budget',
        sourceId: 'src1',
        sourceName: 'Budget 2026',
        entityType: 'product',
        selector: { level: 1 },
        amount: 1000,
        metric: 'revenue',
        periodStart: '2026-01-01',
        periodEnd: '2026-12-31',
        ...bodyOverrides
      }
    });

    test('POSITIVE: allows allocation within revenue % cap', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        budgets: {
          ...defaultRules().budgets,
          allocationCaps: { overallPercentOfRevenue: 20 }
        }
      }));
      allocationService.executeAllocation.mockResolvedValue({
        success: true,
        allocation: { allocations: [] },
        metadata: { totalAllocated: 1000, hasHistoricalData: true }
      });
      const req = baseReq({ amount: 1000, revenueBase: 100000 });
      const res = mockRes();
      await allocationController.createAllocation(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('NEGATIVE: rejects allocation exceeding revenue % cap', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        budgets: {
          ...defaultRules().budgets,
          allocationCaps: { overallPercentOfRevenue: 10 }
        }
      }));
      const req = baseReq({ amount: 15000, revenueBase: 100000 });
      const res = mockRes();
      await expect(
        allocationController.createAllocation(req, res, mockNext)
      ).rejects.toThrow(/exceeds.*revenue cap/);
    });

    test('POSITIVE: skips cap check when no revenueBase provided', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        budgets: {
          ...defaultRules().budgets,
          allocationCaps: { overallPercentOfRevenue: 10 }
        }
      }));
      allocationService.executeAllocation.mockResolvedValue({
        success: true,
        allocation: { allocations: [] },
        metadata: { totalAllocated: 15000, hasHistoricalData: true }
      });
      const req = baseReq({ amount: 15000 });
      const res = mockRes();
      await allocationController.createAllocation(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Claims Rules', () => {
    let claimService;

    beforeAll(() => {
      claimService = require('../../../src/services/claimService');
    });

    test('POSITIVE: allows claim within writeoff limit', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        claims: { autoMatching: true, writeoffLimits: 5000 }
      }));
      const result = await claimService.createClaim('tenant1', {
        claimType: 'promotion',
        customer: 'cust1',
        claimAmount: 3000,
        currency: 'ZAR'
      }, 'user1');
      expect(result.claimAmount).toBe(3000);
    });

    test('NEGATIVE: rejects claim exceeding writeoff limit', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        claims: { autoMatching: true, writeoffLimits: 5000 }
      }));
      await expect(
        claimService.createClaim('tenant1', {
          claimType: 'promotion',
          customer: 'cust1',
          claimAmount: 8000,
          currency: 'ZAR'
        }, 'user1')
      ).rejects.toThrow(/exceeds write-off limit/);
    });

    test('POSITIVE: allows claim of any amount when writeoffLimits is 0 (unlimited)', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        claims: { autoMatching: true, writeoffLimits: 0 }
      }));
      const result = await claimService.createClaim('tenant1', {
        claimType: 'promotion',
        customer: 'cust1',
        claimAmount: 999999,
        currency: 'ZAR'
      }, 'user1');
      expect(result.claimAmount).toBe(999999);
    });

    test('POSITIVE: auto-match runs when autoMatching is true', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        claims: { autoMatching: true, writeoffLimits: 0 }
      }));
      const result = await claimService.autoMatchClaims('tenant1');
      expect(result.skipped).toBeUndefined();
    });

    test('NEGATIVE: auto-match skips when autoMatching is false', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        claims: { autoMatching: false, writeoffLimits: 0 }
      }));
      const result = await claimService.autoMatchClaims('tenant1');
      expect(result.skipped).toBe(true);
      expect(result.reason).toContain('disabled');
    });
  });

  describe('Deduction Rules', () => {
    let deductionService;

    beforeAll(() => {
      deductionService = require('../../../src/services/deductionService');
    });

    test('POSITIVE: allows deduction within writeoff limit', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        claims: { autoMatching: true, writeoffLimits: 5000 }
      }));
      const result = await deductionService.createDeduction('tenant1', {
        deductionType: 'promo',
        customer: 'cust1',
        deductionAmount: 3000,
        currency: 'ZAR'
      }, 'user1');
      expect(result.deductionAmount).toBe(3000);
    });

    test('NEGATIVE: rejects deduction exceeding writeoff limit', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        claims: { autoMatching: true, writeoffLimits: 5000 }
      }));
      await expect(
        deductionService.createDeduction('tenant1', {
          deductionType: 'promo',
          customer: 'cust1',
          deductionAmount: 8000,
          currency: 'ZAR'
        }, 'user1')
      ).rejects.toThrow(/exceeds write-off limit/);
    });

    test('POSITIVE: allows deduction of any amount when writeoffLimits is 0', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        claims: { autoMatching: true, writeoffLimits: 0 }
      }));
      const result = await deductionService.createDeduction('tenant1', {
        deductionType: 'promo',
        customer: 'cust1',
        deductionAmount: 999999,
        currency: 'ZAR'
      }, 'user1');
      expect(result.deductionAmount).toBe(999999);
    });

    test('POSITIVE: auto-match runs when autoMatching is true', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        claims: { autoMatching: true, writeoffLimits: 0 }
      }));
      const result = await deductionService.autoMatchDeductions('tenant1');
      expect(result.skipped).toBeUndefined();
    });

    test('NEGATIVE: auto-match skips when autoMatching is false', async () => {
      BusinessRulesConfig.getOrCreate.mockResolvedValue(defaultRules({
        claims: { autoMatching: false, writeoffLimits: 0 }
      }));
      const result = await deductionService.autoMatchDeductions('tenant1');
      expect(result.skipped).toBe(true);
      expect(result.reason).toContain('disabled');
    });
  });

  describe('BusinessRulesConfig defaults', () => {
    test('defaultRules() helper returns expected shape', () => {
      const rules = defaultRules();
      expect(rules.promotions.discountCaps.maxPercent).toBe(60);
      expect(rules.promotions.stacking.allowStacking).toBe(false);
      expect(rules.promotions.duration.maxDays).toBe(90);
      expect(rules.budgets.allocationCaps.overallPercentOfRevenue).toBe(20);
      expect(rules.budgets.guardrails.requireROIForSpendOverAmount).toBe(0);
      expect(rules.rebates.settlement.cycle).toBe('quarterly');
      expect(rules.claims.autoMatching).toBe(true);
      expect(rules.claims.writeoffLimits).toBe(0);
    });
  });
});
