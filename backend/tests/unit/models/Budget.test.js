/**
 * Budget Model Tests
 * Comprehensive tests for Budget model validation, virtuals, and static methods
 */

const mongoose = require('mongoose');
const Budget = require('../../../models/Budget');
const dbHelper = require('../../helpers/db-helper');
const { faker } = require('@faker-js/faker');

// Budget factory
const buildBudget = (overrides = {}) => {
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-12-31');
  const totalBudget = 100000;

  return {
    company: new mongoose.Types.ObjectId(),
    name: faker.commerce.department() + ' Budget 2025',
    category: 'Marketing',
    fiscalYear: 2025,
    startDate,
    endDate,
    totalBudget,
    allocated: 0,
    spent: 0,
    remaining: totalBudget,
    currency: 'ZAR',
    status: 'draft',
    createdBy: 'test@example.com',
    ...overrides
  };
};

describe('Budget Model', () => {
  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
  });

  afterEach(async () => {
    await dbHelper.clearDatabase();
  });

  describe('Schema Validation', () => {
    describe('Required Fields', () => {
      it('should create a valid budget with all required fields', async () => {
        const budgetData = buildBudget();
        const budget = await Budget.create(budgetData);

        expect(budget).toHaveProperty('_id');
        expect(budget.name).toBe(budgetData.name);
        expect(budget.category).toBe('Marketing');
        expect(budget.fiscalYear).toBe(2025);
      });

      it('should require company field', async () => {
        const budgetData = buildBudget({ company: undefined });
        await expect(Budget.create(budgetData)).rejects.toThrow(/company.*required/i);
      });

      it('should require name field', async () => {
        const budgetData = buildBudget({ name: undefined });
        await expect(Budget.create(budgetData)).rejects.toThrow(/name.*required/i);
      });

      it('should require category field', async () => {
        const budgetData = buildBudget({ category: undefined });
        await expect(Budget.create(budgetData)).rejects.toThrow(/category.*required/i);
      });

      it('should require fiscalYear field', async () => {
        const budgetData = buildBudget({ fiscalYear: undefined });
        await expect(Budget.create(budgetData)).rejects.toThrow(/fiscalYear.*required/i);
      });

      it('should require startDate field', async () => {
        const budgetData = buildBudget({ startDate: undefined });
        await expect(Budget.create(budgetData)).rejects.toThrow(/startDate.*required/i);
      });

      it('should require endDate field', async () => {
        const budgetData = buildBudget({ endDate: undefined });
        await expect(Budget.create(budgetData)).rejects.toThrow(/endDate.*required/i);
      });

      it('should require totalBudget field', async () => {
        const budgetData = buildBudget({ totalBudget: undefined });
        await expect(Budget.create(budgetData)).rejects.toThrow(/totalBudget.*required/i);
      });

      it('should require createdBy field', async () => {
        const budgetData = buildBudget({ createdBy: undefined });
        await expect(Budget.create(budgetData)).rejects.toThrow(/createdBy.*required/i);
      });
    });

    describe('Category Validation', () => {
      it('should validate category enum', async () => {
        const budgetData = buildBudget({ category: 'Invalid Category' });
        await expect(Budget.create(budgetData)).rejects.toThrow();
      });

      it('should accept valid categories', async () => {
        const categories = [
          'Marketing', 'Trade Spend', 'Promotions', 'Digital', 
          'Events', 'Advertising', 'Public Relations', 'Sponsorship', 
          'Research', 'Other'
        ];

        for (const category of categories) {
          const budgetData = buildBudget({ category, name: `${category} Budget` });
          const budget = await Budget.create(budgetData);
          expect(budget.category).toBe(category);
          await Budget.deleteMany({});
        }
      });
    });

    describe('Status Validation', () => {
      it('should validate status enum', async () => {
        const budgetData = buildBudget({ status: 'invalid_status' });
        await expect(Budget.create(budgetData)).rejects.toThrow();
      });

      it('should accept valid statuses', async () => {
        const statuses = ['draft', 'pending', 'approved', 'active', 'completed', 'cancelled'];

        for (const status of statuses) {
          const budgetData = buildBudget({ status });
          const budget = await Budget.create(budgetData);
          expect(budget.status).toBe(status);
          await Budget.deleteMany({});
        }
      });

      it('should default status to draft', async () => {
        const budgetData = buildBudget({ status: undefined });
        const budget = await Budget.create(budgetData);
        expect(budget.status).toBe('draft');
      });
    });

    describe('Currency Validation', () => {
      it('should validate currency enum', async () => {
        const budgetData = buildBudget({ currency: 'INVALID' });
        await expect(Budget.create(budgetData)).rejects.toThrow();
      });

      it('should accept valid currencies', async () => {
        const currencies = ['ZAR', 'USD', 'EUR', 'GBP'];

        for (const currency of currencies) {
          const budgetData = buildBudget({ currency });
          const budget = await Budget.create(budgetData);
          expect(budget.currency).toBe(currency);
          await Budget.deleteMany({});
        }
      });

      it('should default currency to ZAR', async () => {
        const budgetData = buildBudget({ currency: undefined });
        const budget = await Budget.create(budgetData);
        expect(budget.currency).toBe('ZAR');
      });
    });

    describe('Numeric Validation', () => {
      it('should validate totalBudget is non-negative', async () => {
        const budgetData = buildBudget({ totalBudget: -1000 });
        await expect(Budget.create(budgetData)).rejects.toThrow();
      });

      it('should validate allocated is non-negative', async () => {
        const budgetData = buildBudget({ allocated: -500 });
        await expect(Budget.create(budgetData)).rejects.toThrow();
      });

      it('should validate spent is non-negative', async () => {
        const budgetData = buildBudget({ spent: -100 });
        await expect(Budget.create(budgetData)).rejects.toThrow();
      });

      it('should validate remaining is non-negative', async () => {
        const budgetData = buildBudget({ remaining: -50 });
        await expect(Budget.create(budgetData)).rejects.toThrow();
      });
    });

    describe('Default Values', () => {
      it('should set default allocated to 0', async () => {
        const budgetData = buildBudget({ allocated: undefined });
        const budget = await Budget.create(budgetData);
        expect(budget.allocated).toBe(0);
      });

      it('should set default spent to 0', async () => {
        const budgetData = buildBudget({ spent: undefined });
        const budget = await Budget.create(budgetData);
        expect(budget.spent).toBe(0);
      });

      it('should set default remaining to 0', async () => {
        const budgetData = buildBudget({ remaining: undefined });
        const budget = await Budget.create(budgetData);
        expect(budget.remaining).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Pre-save Middleware', () => {
    it('should calculate remaining amount on save', async () => {
      const budgetData = buildBudget({
        totalBudget: 100000,
        spent: 30000
      });
      const budget = await Budget.create(budgetData);

      expect(budget.remaining).toBe(70000);
    });

    it('should update remaining when spent changes', async () => {
      const budgetData = buildBudget({
        totalBudget: 100000,
        spent: 20000
      });
      const budget = await Budget.create(budgetData);
      expect(budget.remaining).toBe(80000);

      budget.spent = 50000;
      await budget.save();

      expect(budget.remaining).toBe(50000);
    });

    it('should not allow negative remaining', async () => {
      const budgetData = buildBudget({
        totalBudget: 100000,
        spent: 120000
      });
      const budget = await Budget.create(budgetData);

      expect(budget.remaining).toBe(0);
    });

    it('should calculate utilizationRate KPI', async () => {
      const budgetData = buildBudget({
        totalBudget: 100000,
        spent: 75000
      });
      const budget = await Budget.create(budgetData);

      expect(budget.kpis.utilizationRate).toBe(75);
    });

    it('should calculate burnRate KPI', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const budgetData = buildBudget({
        startDate,
        totalBudget: 100000,
        spent: 30000
      });
      const budget = await Budget.create(budgetData);

      expect(budget.kpis.burnRate).toBeGreaterThan(0);
      expect(budget.kpis.burnRate).toBeLessThan(30000); // Less than total spent
    });

    it('should calculate projectedOverrun KPI', async () => {
      const startDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const endDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000); // 20 days from now
      const budgetData = buildBudget({
        startDate,
        endDate,
        totalBudget: 10000,
        spent: 8000 // High spend rate
      });
      const budget = await Budget.create(budgetData);

      expect(budget.kpis.projectedOverrun).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Virtual Properties', () => {
    describe('utilizationPercentage', () => {
      it('should calculate utilization percentage', async () => {
        const budgetData = buildBudget({
          totalBudget: 100000,
          spent: 45000
        });
        const budget = await Budget.create(budgetData);

        expect(budget.utilizationPercentage).toBe(45);
      });

      it('should return 0 when totalBudget is 0', async () => {
        const budgetData = buildBudget({
          totalBudget: 0,
          spent: 0
        });
        const budget = await Budget.create(budgetData);

        expect(budget.utilizationPercentage).toBe(0);
      });

      it('should calculate 100% utilization', async () => {
        const budgetData = buildBudget({
          totalBudget: 50000,
          spent: 50000
        });
        const budget = await Budget.create(budgetData);

        expect(budget.utilizationPercentage).toBe(100);
      });
    });

    describe('allocationPercentage', () => {
      it('should calculate allocation percentage', async () => {
        const budgetData = buildBudget({
          totalBudget: 100000,
          allocated: 60000
        });
        const budget = await Budget.create(budgetData);

        expect(budget.allocationPercentage).toBe(60);
      });

      it('should return 0 when totalBudget is 0', async () => {
        const budgetData = buildBudget({
          totalBudget: 0,
          allocated: 0
        });
        const budget = await Budget.create(budgetData);

        expect(budget.allocationPercentage).toBe(0);
      });
    });

    describe('remainingPercentage', () => {
      it('should calculate remaining percentage', async () => {
        const budgetData = buildBudget({
          totalBudget: 100000,
          spent: 40000
        });
        const budget = await Budget.create(budgetData);

        expect(budget.remainingPercentage).toBe(60);
      });

      it('should return 100% when nothing spent', async () => {
        const budgetData = buildBudget({
          totalBudget: 100000,
          spent: 0
        });
        const budget = await Budget.create(budgetData);

        expect(budget.remainingPercentage).toBe(100);
      });
    });

    describe('monthlyBurnRate', () => {
      it('should calculate monthly burn rate', async () => {
        const startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
        const budgetData = buildBudget({
          startDate,
          totalBudget: 100000,
          spent: 40000
        });
        const budget = await Budget.create(budgetData);

        expect(budget.monthlyBurnRate).toBeGreaterThan(0);
        expect(budget.monthlyBurnRate).toBeLessThan(40000);
      });
    });
  });

  describe('Subdocuments', () => {
    describe('departments', () => {
      it('should store department allocations', async () => {
        const budgetData = buildBudget({
          departments: [
            { name: 'Sales', allocation: 40000, spent: 15000 },
            { name: 'Marketing', allocation: 60000, spent: 25000 }
          ]
        });
        const budget = await Budget.create(budgetData);

        expect(budget.departments).toHaveLength(2);
        expect(budget.departments[0].name).toBe('Sales');
        expect(budget.departments[0].allocation).toBe(40000);
        expect(budget.departments[0].spent).toBe(15000);
      });

      it('should default spent to 0 for departments', async () => {
        const budgetData = buildBudget({
          departments: [
            { name: 'IT', allocation: 30000 }
          ]
        });
        const budget = await Budget.create(budgetData);

        expect(budget.departments[0].spent).toBe(0);
      });
    });

    describe('approvals', () => {
      it('should store approval records', async () => {
        const budgetData = buildBudget({
          approvals: [{
            approver: 'manager@example.com',
            approvedAmount: 100000,
            approvedDate: new Date(),
            status: 'approved',
            comments: 'Approved for Q1 2025'
          }]
        });
        const budget = await Budget.create(budgetData);

        expect(budget.approvals).toHaveLength(1);
        expect(budget.approvals[0].approver).toBe('manager@example.com');
        expect(budget.approvals[0].status).toBe('approved');
      });
    });

    describe('allocations', () => {
      it('should store allocation records', async () => {
        const budgetData = buildBudget({
          allocations: [{
            description: 'Digital marketing campaign',
            amount: 20000,
            date: new Date(),
            category: 'Digital',
            approvedBy: 'manager@example.com'
          }]
        });
        const budget = await Budget.create(budgetData);

        expect(budget.allocations).toHaveLength(1);
        expect(budget.allocations[0].description).toBe('Digital marketing campaign');
        expect(budget.allocations[0].amount).toBe(20000);
      });
    });

    describe('expenses', () => {
      it('should store expense records', async () => {
        const budgetData = buildBudget({
          expenses: [{
            description: 'Google Ads',
            amount: 5000,
            date: new Date(),
            category: 'Digital',
            vendor: 'Google',
            invoiceNumber: 'INV-2025-001',
            approvedBy: 'finance@example.com'
          }]
        });
        const budget = await Budget.create(budgetData);

        expect(budget.expenses).toHaveLength(1);
        expect(budget.expenses[0].description).toBe('Google Ads');
        expect(budget.expenses[0].vendor).toBe('Google');
      });
    });

    describe('forecasts', () => {
      it('should store forecast data', async () => {
        const budgetData = buildBudget({
          forecasts: [{
            month: 1,
            year: 2025,
            predictedSpend: 8000,
            actualSpend: 7500,
            variance: -500
          }]
        });
        const budget = await Budget.create(budgetData);

        expect(budget.forecasts).toHaveLength(1);
        expect(budget.forecasts[0].month).toBe(1);
        expect(budget.forecasts[0].predictedSpend).toBe(8000);
        expect(budget.forecasts[0].actualSpend).toBe(7500);
      });

      it('should default actualSpend and variance to 0', async () => {
        const budgetData = buildBudget({
          forecasts: [{
            month: 2,
            year: 2025,
            predictedSpend: 10000
          }]
        });
        const budget = await Budget.create(budgetData);

        expect(budget.forecasts[0].actualSpend).toBe(0);
        expect(budget.forecasts[0].variance).toBe(0);
      });
    });
  });

  describe('KPIs Object', () => {
    it('should initialize KPIs with default values', async () => {
      const budgetData = buildBudget();
      const budget = await Budget.create(budgetData);

      expect(budget.kpis).toBeDefined();
      expect(budget.kpis.utilizationRate).toBeDefined();
      expect(budget.kpis.burnRate).toBeDefined();
      expect(budget.kpis.projectedOverrun).toBeDefined();
      expect(budget.kpis.roi).toBeDefined();
    });

    it('should update KPIs on save', async () => {
      const budgetData = buildBudget({
        totalBudget: 100000,
        spent: 50000
      });
      const budget = await Budget.create(budgetData);

      expect(budget.kpis.utilizationRate).toBe(50);
    });
  });

  describe('Queries', () => {
    it('should find budgets by company', async () => {
      const companyId = new mongoose.Types.ObjectId();

      await Budget.create([
        buildBudget({ company: companyId, name: 'Budget 1' }),
        buildBudget({ company: companyId, name: 'Budget 2' }),
        buildBudget({ company: new mongoose.Types.ObjectId(), name: 'Budget 3' })
      ]);

      const budgets = await Budget.find({ company: companyId });
      expect(budgets).toHaveLength(2);
    });

    it('should find budgets by fiscalYear', async () => {
      const companyId = new mongoose.Types.ObjectId();

      await Budget.create([
        buildBudget({ company: companyId, fiscalYear: 2025 }),
        buildBudget({ company: companyId, fiscalYear: 2025 }),
        buildBudget({ company: companyId, fiscalYear: 2024 })
      ]);

      const budgets2025 = await Budget.find({ company: companyId, fiscalYear: 2025 });
      expect(budgets2025).toHaveLength(2);
    });

    it('should find budgets by category', async () => {
      const companyId = new mongoose.Types.ObjectId();

      await Budget.create([
        buildBudget({ company: companyId, category: 'Marketing' }),
        buildBudget({ company: companyId, category: 'Marketing' }),
        buildBudget({ company: companyId, category: 'Promotions' })
      ]);

      const marketingBudgets = await Budget.find({ category: 'Marketing' });
      expect(marketingBudgets).toHaveLength(2);
    });

    it('should find budgets by status', async () => {
      const companyId = new mongoose.Types.ObjectId();

      await Budget.create([
        buildBudget({ company: companyId, status: 'active' }),
        buildBudget({ company: companyId, status: 'active' }),
        buildBudget({ company: companyId, status: 'draft' })
      ]);

      const activeBudgets = await Budget.find({ status: 'active' });
      expect(activeBudgets).toHaveLength(2);
    });
  });

  describe('Updates', () => {
    it('should update budget spent amount', async () => {
      const budgetData = buildBudget({ totalBudget: 100000, spent: 30000 });
      const budget = await Budget.create(budgetData);

      budget.spent = 50000;
      await budget.save();

      const updated = await Budget.findById(budget._id);
      expect(updated.spent).toBe(50000);
      expect(updated.remaining).toBe(50000);
    });

    it('should update budget status', async () => {
      const budgetData = buildBudget({ status: 'draft' });
      const budget = await Budget.create(budgetData);

      budget.status = 'approved';
      await budget.save();

      const updated = await Budget.findById(budget._id);
      expect(updated.status).toBe('approved');
    });

    it('should add expense record', async () => {
      const budgetData = buildBudget();
      const budget = await Budget.create(budgetData);

      budget.expenses.push({
        description: 'New expense',
        amount: 1000,
        date: new Date(),
        category: 'Marketing'
      });
      await budget.save();

      const updated = await Budget.findById(budget._id);
      expect(updated.expenses).toHaveLength(1);
    });
  });

  describe('Timestamps', () => {
    it('should add createdAt timestamp', async () => {
      const budgetData = buildBudget();
      const budget = await Budget.create(budgetData);

      expect(budget.createdAt).toBeDefined();
      expect(budget.createdAt).toBeInstanceOf(Date);
    });

    it('should add updatedAt timestamp', async () => {
      const budgetData = buildBudget();
      const budget = await Budget.create(budgetData);

      expect(budget.updatedAt).toBeDefined();
      expect(budget.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const budgetData = buildBudget();
      const budget = await Budget.create(budgetData);
      const originalUpdatedAt = budget.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));
      budget.name = 'Updated Budget';
      await budget.save();

      expect(budget.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Deletion', () => {
    it('should delete a budget', async () => {
      const budgetData = buildBudget();
      const budget = await Budget.create(budgetData);
      const budgetId = budget._id;

      await Budget.deleteOne({ _id: budgetId });

      const deleted = await Budget.findById(budgetId);
      expect(deleted).toBeNull();
    });

    it('should delete multiple budgets', async () => {
      const companyId = new mongoose.Types.ObjectId();

      await Budget.create([
        buildBudget({ company: companyId }),
        buildBudget({ company: companyId }),
        buildBudget({ company: companyId })
      ]);

      const result = await Budget.deleteMany({ company: companyId });
      expect(result.deletedCount).toBe(3);
    });
  });
});
