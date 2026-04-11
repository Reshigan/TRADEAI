import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTradeInsights, summarizeData } from '../../../src/services/ai.js';

describe('AI Service Unit Tests', () => {
  const mockEnv = {
    AI: {
      run: vi.fn().mockResolvedValue({
        response: 'This is a mock AI response'
      })
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate trade insights successfully when AI binding exists', async () => {
    const result = await generateTradeInsights(mockEnv, {
      dataContext: 'Promotions: 5, Budgets: 2',
      question: 'What is the status?'
    });
    expect(result.response).toBe('This is a mock AI response');
    expect(result.fallback).toBe(false);
    expect(mockEnv.AI.run).toHaveBeenCalled();
  });

  it('should return fallback response when AI binding is missing', async () => {
    const result = await generateTradeInsights({}, {
      dataContext: '...',
      question: '...'
    });
    expect(result.fallback).toBe(true);
    expect(result.reason).toBe('AI binding not available');
  });

  it('should handle AI inference errors gracefully', async () => {
    mockEnv.AI.run.mockRejectedValueOnce(new Error('AI Service Timeout'));
    const result = await generateTradeInsights(mockEnv, {
      dataContext: '...',
      question: '...'
    });
    expect(result.fallback).toBe(true);
    expect(result.reason).toBe('AI Service Timeout');
  });

  it('should summarize data correctly', async () => {
    const result = await summarizeData(mockEnv, {
      dataType: 'promotions',
      data: [{ id: 1, name: 'Promo 1' }]
    });
    expect(result.response).toBe('This is a mock AI response');
  });
});
