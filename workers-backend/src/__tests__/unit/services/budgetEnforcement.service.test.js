import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetEnforcementService } from '../../../src/services/budgetEnforcement.js';

describe('BudgetEnforcementService Unit Tests', () => {
  const mockDB = {
    prepare: vi.fn().mockImplementation((query) => ({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({ amount: 1000, utilized: 200 }),
      all: vi.fn().mockResolvedValue({ results: [] })
    }))
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check budget availability and return true if funds are sufficient', async () => {
    const service = new BudgetEnforcementService(mockDB);
    const available = await service.checkAvailability('budget-1', 100);
    expect(available).toBe(true);
  });

  it('should return false if requested amount exceeds available budget', async () => {
    const service = new BudgetEnforcementService(mockDB);
    // Mock DB to return only 100 available
    mockDB.prepare.mockImplementationOnce(() => ({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({ amount: 300, utilized: 200 })
    }));
    
    const available = await service.checkAvailability('budget-1', 200);
    expect(available).toBe(false);
  });

  it('should handle missing budgets gracefully', async () => {
    const service = new BudgetEnforcementService(mockDB);
    mockDB.prepare.mockImplementationOnce(() => ({
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null)
    }));
    
    await expect(service.checkAvailability('invalid-id', 100))
      .rejects.toThrow('Budget not found');
  });
});
