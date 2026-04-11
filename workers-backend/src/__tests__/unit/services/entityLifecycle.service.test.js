import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityLifecycleService } from '../../../src/services/entityLifecycleService.js';

describe('EntityLifecycleService Unit Tests', () => {
  const mockDB = {
    prepare: vi.fn().mockImplementation((query) => ({
      bind: vi.fn().mockReturnThis(),
      run: vi.fn().mockResolvedValue({ success: true }),
      first: vi.fn().mockResolvedValue({ id: 'ent-1', name: 'Test Entity' })
    }))
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should transition entity to approved status', async () => {
    const service = new EntityLifecycleService(mockDB, 'tenant-1', 'user-1');
    await service.onEntityApprove({
      entityType: 'promotion', 
      entityId: 'promo-1', 
      entityName: 'Promo 1', 
      amount: 1000, 
      requesterId: 'user-2'
    });
    expect(mockDB.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE'));
  });

  it('should transition entity to rejected status', async () => {
    const service = new EntityLifecycleService(mockDB, 'tenant-1', 'user-1');
    await service.onEntityReject({
      entityType: 'promotion', 
      entityId: 'promo-1', 
      entityName: 'Promo 1', 
      amount: 1000, 
      requesterId: 'user-2', 
      reason: 'Too expensive'
    });
    expect(mockDB.prepare).toHaveBeenCalledWith(expect.stringContaining('rejected'));
  });

  it('should transition entity to settled status', async () => {
    const service = new EntityLifecycleService(mockDB, 'tenant-1', 'user-1');
    await service.onEntitySettle({
      entityType: 'claim', 
      entityId: 'claim-1', 
      entityName: 'Claim 1', 
      amount: 500, 
      budgetId: 'budget-1', 
      requesterId: 'user-2'
    });
    expect(mockDB.prepare).toHaveBeenCalledWith(expect.stringContaining('settled'));
  });
});
