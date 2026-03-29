/**
 * Process API Service
 * Comprehensive API integration for process management
 * World-class REST API client with caching, retries, and error handling
 */

import apiClient from '../../services/apiClient';
import type {
  ProcessMetadata,
  ProcessStep,
  ProcessMetrics,
  ProcessApiResponse,
  WizardApiResponse,
  AISuggestionsResponse,
  AIRecommendation,
  StepChangeEvent,
  ProcessUpdateEvent,
} from './ProcessUI.types';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE = '/processes';
const AI_BASE = '/ai';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// ============================================================================
// Types
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface ApiConfig {
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

// ============================================================================
// Cache Management
// ============================================================================

const cache = new Map<string, CacheEntry<any>>();

const getCache = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
};

const setCache = <T>(key: string, data: T): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

const clearCache = (pattern?: string): void => {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// ============================================================================
// Retry Logic
// ============================================================================

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0 || error.response?.status === 400) {
      throw error;
    }
    
    console.warn(`API request failed, retrying (${retries} attempts left)...`, error);
    await delay(RETRY_DELAY);
    return withRetry(fn, retries - 1);
  }
};

// ============================================================================
// Process API
// ============================================================================

export const ProcessAPI = {
  /**
   * Fetch all processes
   */
  async getAll(config?: ApiConfig): Promise<ProcessMetadata[]> {
    const cacheKey = 'processes:all';
    
    if (config?.cache !== false) {
      const cached = getCache<ProcessMetadata[]>(cacheKey);
      if (cached) return cached;
    }
    
    const response = await withRetry(() => 
      apiClient.get(API_BASE, { timeout: config?.timeout })
    );
    
    const data = response.data as ProcessMetadata[];
    
    if (config?.cache !== false) {
      setCache(cacheKey, data);
    }
    
    return data;
  },

  /**
   * Fetch single process by ID
   */
  async getById(id: string, config?: ApiConfig): Promise<ProcessMetadata & { steps: ProcessStep[] }> {
    const cacheKey = `process:${id}`;
    
    if (config?.cache !== false) {
      const cached = getCache(cacheKey);
      if (cached) return cached;
    }
    
    const response = await withRetry(() => 
      apiClient.get(`${API_BASE}/${id}`, { timeout: config?.timeout })
    );
    
    const data = response.data as ProcessMetadata & { steps: ProcessStep[] };
    
    if (config?.cache !== false) {
      setCache(cacheKey, data);
    }
    
    return data;
  },

  /**
   * Create new process
   */
  async create(process: Partial<ProcessMetadata>): Promise<ProcessMetadata> {
    const response = await withRetry(() => 
      apiClient.post(API_BASE, process)
    );
    
    clearCache('processes');
    
    return response.data as ProcessMetadata;
  },

  /**
   * Update process
   */
  async update(id: string, updates: Partial<ProcessMetadata>): Promise<ProcessMetadata> {
    const response = await withRetry(() => 
      apiClient.put(`${API_BASE}/${id}`, updates)
    );
    
    clearCache(`process:${id}`);
    clearCache('processes');
    
    return response.data as ProcessMetadata;
  },

  /**
   * Delete process
   */
  async delete(id: string): Promise<void> {
    await withRetry(() => 
      apiClient.delete(`${API_BASE}/${id}`)
    );
    
    clearCache(`process:${id}`);
    clearCache('processes');
  },

  /**
   * Update step status
   */
  async updateStepStatus(
    processId: string,
    stepId: string,
    status: ProcessStep['status']
  ): Promise<ProcessStep> {
    const response = await withRetry(() => 
      apiClient.patch(`${API_BASE}/${processId}/steps/${stepId}/status`, { status })
    );
    
    clearCache(`process:${processId}`);
    
    return response.data as ProcessStep;
  },

  /**
   * Advance to next step
   */
  async advanceStep(processId: string): Promise<ProcessApiResponse> {
    const response = await withRetry(() => 
      apiClient.post(`${API_BASE}/${processId}/advance`)
    );
    
    clearCache(`process:${processId}`);
    
    return response.data as ProcessApiResponse;
  },

  /**
   * Go back to previous step
   */
  async retreatStep(processId: string): Promise<ProcessApiResponse> {
    const response = await withRetry(() => 
      apiClient.post(`${API_BASE}/${processId}/retreat`)
    );
    
    clearCache(`process:${processId}`);
    
    return response.data as ProcessApiResponse;
  },

  /**
   * Get process metrics
   */
  async getMetrics(processId: string, config?: ApiConfig): Promise<ProcessMetrics> {
    const cacheKey = `process:${processId}:metrics`;
    
    if (config?.cache !== false) {
      const cached = getCache<ProcessMetrics>(cacheKey);
      if (cached) return cached;
    }
    
    const response = await withRetry(() => 
      apiClient.get(`${API_BASE}/${processId}/metrics`, { timeout: config?.timeout })
    );
    
    const data = response.data as ProcessMetrics;
    
    if (config?.cache !== false) {
      setCache(cacheKey, data);
    }
    
    return data;
  },

  /**
   * Get process history/audit log
   */
  async getHistory(processId: string, config?: ApiConfig): Promise<StepChangeEvent[]> {
    const cacheKey = `process:${processId}:history`;
    
    if (config?.cache !== false) {
      const cached = getCache<StepChangeEvent[]>(cacheKey);
      if (cached) return cached;
    }
    
    const response = await withRetry(() => 
      apiClient.get(`${API_BASE}/${processId}/history`, { timeout: config?.timeout })
    );
    
    const data = response.data as StepChangeEvent[];
    
    if (config?.cache !== false) {
      setCache(cacheKey, data);
    }
    
    return data;
  },

  /**
   * Subscribe to process updates (polling fallback for WebSocket)
   */
  subscribe(processId: string, callback: (event: ProcessUpdateEvent) => void, interval = 5000): () => void {
    let polling = true;
    
    const poll = async () => {
      if (!polling) return;
      
      try {
        const response = await apiClient.get(`${API_BASE}/${processId}/updates`);
        const events = response.data as ProcessUpdateEvent[];
        
        events.forEach(callback);
      } catch (error) {
        console.error('Process update polling failed:', error);
      }
      
      setTimeout(poll, interval);
    };
    
    poll();
    
    return () => {
      polling = false;
    };
  },
};

// ============================================================================
// Wizard API
// ============================================================================

export const WizardAPI = {
  /**
   * Save wizard draft
   */
  async saveDraft(
    wizardId: string,
    data: Record<string, any>
  ): Promise<WizardApiResponse> {
    const response = await withRetry(() => 
      apiClient.post(`/wizards/${wizardId}/draft`, data)
    );
    
    return response.data as WizardApiResponse;
  },

  /**
   * Load wizard draft
   */
  async loadDraft(wizardId: string): Promise<Record<string, any> | null> {
    try {
      const response = await withRetry(() => 
        apiClient.get(`/wizards/${wizardId}/draft`)
      );
      
      return response.data.data as Record<string, any>;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Submit completed wizard
   */
  async submit(
    wizardId: string,
    data: Record<string, any>
  ): Promise<WizardApiResponse> {
    const response = await withRetry(() => 
      apiClient.post(`/wizards/${wizardId}/submit`, data)
    );
    
    return response.data as WizardApiResponse;
  },

  /**
   * Validate wizard step
   */
  async validateStep(
    wizardId: string,
    stepId: string,
    data: Record<string, any>
  ): Promise<{ valid: boolean; errors: string[] }> {
    const response = await withRetry(() => 
      apiClient.post(`/wizards/${wizardId}/steps/${stepId}/validate`, data)
    );
    
    return response.data as { valid: boolean; errors: string[] };
  },

  /**
   * Delete wizard draft
   */
  async deleteDraft(wizardId: string): Promise<void> {
    await withRetry(() => 
      apiClient.delete(`/wizards/${wizardId}/draft`)
    );
  },
};

// ============================================================================
// AI Service API
// ============================================================================

export const AIServiceAPI = {
  /**
   * Get AI suggestions for a process step
   */
  async getSuggestions(
    processId: string,
    stepId: string,
    context?: Record<string, any>
  ): Promise<AISuggestionsResponse> {
    const response = await withRetry(() => 
      apiClient.post(`${AI_BASE}/suggestions`, {
        processId,
        stepId,
        context,
      })
    );
    
    return response.data as AISuggestionsResponse;
  },

  /**
   * Get AI recommendations for optimization
   */
  async getRecommendations(
    processId: string,
    type?: 'optimization' | 'warning' | 'suggestion' | 'insight'
  ): Promise<AIRecommendation[]> {
    const params = type ? { type } : {};
    
    const response = await withRetry(() => 
      apiClient.get(`${AI_BASE}/recommendations/${processId}`, { params })
    );
    
    return response.data as AIRecommendation[];
  },

  /**
   * Analyze process for bottlenecks
   */
  async analyzeBottlenecks(processId: string): Promise<{
    bottlenecks: string[];
    severity: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    const response = await withRetry(() => 
      apiClient.get(`${AI_BASE}/analyze/${processId}/bottlenecks`)
    );
    
    return response.data as any;
  },

  /**
   * Predict process completion time
   */
  async predictCompletion(processId: string): Promise<{
    estimatedCompletion: Date;
    confidence: number;
    factors: string[];
  }> {
    const response = await withRetry(() => 
      apiClient.get(`${AI_BASE}/predict/${processId}/completion`)
    );
    
    return response.data as any;
  },

  /**
   * Get AI insights for wizard step
   */
  async getWizardInsights(
    wizardId: string,
    stepId: string,
    formData: Record<string, any>
  ): Promise<AISuggestionsResponse> {
    const response = await withRetry(() => 
      apiClient.post(`${AI_BASE}/wizard/${wizardId}/insights`, {
        stepId,
        formData,
      })
    );
    
    return response.data as AISuggestionsResponse;
  },

  /**
   * Optimize process flow
   */
  async optimizeProcess(processId: string): Promise<{
    optimizedSteps: ProcessStep[];
    improvements: string[];
    estimatedTimeSavings: number;
  }> {
    const response = await withRetry(() => 
      apiClient.post(`${AI_BASE}/optimize/${processId}`)
    );
    
    return response.data as any;
  },
};

// ============================================================================
// Export API
// ============================================================================

export default {
  processes: ProcessAPI,
  wizards: WizardAPI,
  ai: AIServiceAPI,
  cache: {
    clear: clearCache,
  },
};
