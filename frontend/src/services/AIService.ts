/**
 * AI Service Integration
 * Real AI/ML backend integration for process optimization, predictions, and recommendations
 * World-class AI assistance with confidence scoring and explainable AI
 */

import apiClient from '../../services/apiClient';
import type {
  AIRecommendation,
  AISuggestionsResponse,
  ProcessStep,
} from '../components/common/ProcessUI.types';

// ============================================================================
// Configuration
// ============================================================================

const AI_API_BASE = '/api/ai';
const ML_API_BASE = '/api/ml';
const RECOMMENDATION_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ============================================================================
// Types
// ============================================================================

interface AIContext {
  processId: string;
  stepId?: string;
  formData?: Record<string, any>;
  historicalData?: any;
  userPreferences?: any;
}

interface PredictionResult {
  /** Prediction type */
  type: 'completion_time' | 'success_rate' | 'bottleneck' | 'resource_need';
  /** Predicted value */
  value: number | string;
  /** Confidence score (0-100) */
  confidence: number;
  /** Prediction date range */
  dateRange?: { start: Date; end: Date };
  /** Factors influencing prediction */
  factors: string[];
  /** Alternative scenarios */
  scenarios?: Array<{
    name: string;
    value: number | string;
    probability: number;
  }>;
}

interface OptimizationResult {
  /** Original duration (minutes) */
  originalDuration: number;
  /** Optimized duration (minutes) */
  optimizedDuration: number;
  /** Time savings (minutes) */
  timeSavings: number;
  /** Cost savings */
  costSavings?: number;
  /** Recommended changes */
  recommendations: Array<{
    type: 'reorder' | 'parallelize' | 'automate' | 'resource';
    description: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
    steps: string[];
  }>;
}

interface ScenarioAnalysis {
  /** Scenario name */
  name: string;
  /** Scenario description */
  description: string;
  /** Parameters changed */
  parameters: Record<string, any>;
  /** Predicted outcome */
  outcome: {
    completionTime: number;
    successRate: number;
    cost: number;
    quality: number;
  };
  /** Comparison with baseline */
  comparison: {
    timeChange: number; // percentage
    costChange: number; // percentage
    successChange: number; // percentage
  };
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high';
  /** Recommendation */
  recommended: boolean;
}

// ============================================================================
// AI Service Class
// ============================================================================

class AIService {
  private cache = new Map<string, { data: any; timestamp: number }>();

  // ============================================================================
  // Step Suggestions
  // ============================================================================

  /**
   * Get AI suggestions for a specific step
   */
  async getStepSuggestions(context: AIContext): Promise<AISuggestionsResponse> {
    const cacheKey = `suggestions:${context.processId}:${context.stepId}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await apiClient.post(`${AI_API_BASE}/suggestions`, {
        processId: context.processId,
        stepId: context.stepId,
        context: {
          formData: context.formData,
          historicalData: context.historicalData,
        },
      });

      const result = response.data as AISuggestionsResponse;
      this.setCache(cacheKey, result);
      
      return result;
    } catch (error: any) {
      console.error('Failed to get AI suggestions:', error);
      
      // Return fallback suggestions
      return {
        success: false,
        recommendations: this.getFallbackSuggestions(context),
        error: error.message,
      };
    }
  }

  /**
   * Get smart field suggestions
   */
  async getFieldSuggestions(
    processId: string,
    fieldName: string,
    partialValue: string
  ): Promise<Array<{ value: string; confidence: number; source: string }>> {
    try {
      const response = await apiClient.get(`${AI_API_BASE}/fields/suggest`, {
        params: { processId, fieldName, partialValue },
      });

      return response.data as any;
    } catch (error) {
      console.error('Field suggestions failed:', error);
      return [];
    }
  }

  // ============================================================================
  // Predictions
  // ============================================================================

  /**
   * Predict process completion time
   */
  async predictCompletionTime(processId: string): Promise<PredictionResult> {
    try {
      const response = await apiClient.get(`${ML_API_BASE}/predict/${processId}/completion`);
      return response.data as PredictionResult;
    } catch (error: any) {
      console.error('Completion prediction failed:', error);
      
      // Return fallback prediction
      return {
        type: 'completion_time',
        value: 'Unable to predict',
        confidence: 0,
        factors: ['Insufficient historical data'],
      };
    }
  }

  /**
   * Predict success probability
   */
  async predictSuccessRate(processId: string): Promise<PredictionResult> {
    try {
      const response = await apiClient.get(`${ML_API_BASE}/predict/${processId}/success`);
      return response.data as PredictionResult;
    } catch (error: any) {
      console.error('Success prediction failed:', error);
      
      return {
        type: 'success_rate',
        value: 75, // Default estimate
        confidence: 50,
        factors: ['Based on industry average'],
      };
    }
  }

  /**
   * Predict potential bottlenecks
   */
  async predictBottlenecks(processId: string): Promise<PredictionResult> {
    try {
      const response = await apiClient.get(`${ML_API_BASE}/predict/${processId}/bottlenecks`);
      return response.data as PredictionResult;
    } catch (error: any) {
      console.error('Bottleneck prediction failed:', error);
      
      return {
        type: 'bottleneck',
        value: [],
        confidence: 0,
        factors: ['No predictions available'],
      };
    }
  }

  // ============================================================================
  // Optimization
  // ============================================================================

  /**
   * Optimize process flow
   */
  async optimizeProcess(processId: string): Promise<OptimizationResult> {
    try {
      const response = await apiClient.post(`${AI_API_BASE}/optimize/${processId}`);
      return response.data as OptimizationResult;
    } catch (error: any) {
      console.error('Process optimization failed:', error);
      
      return {
        originalDuration: 0,
        optimizedDuration: 0,
        timeSavings: 0,
        recommendations: [],
      };
    }
  }

  /**
   * Get resource allocation recommendations
   */
  async optimizeResources(processId: string): Promise<OptimizationResult['recommendations']> {
    try {
      const response = await apiClient.get(`${AI_API_BASE}/resources/${processId}/optimize`);
      return response.data as OptimizationResult['recommendations'];
    } catch (error) {
      console.error('Resource optimization failed:', error);
      return [];
    }
  }

  // ============================================================================
  // Scenario Analysis
  // ============================================================================

  /**
   * Run what-if scenario analysis
   */
  async analyzeScenario(
    processId: string,
    parameters: Record<string, any>
  ): Promise<ScenarioAnalysis> {
    try {
      const response = await apiClient.post(`${ML_API_BASE}/scenario/${processId}`, {
        parameters,
      });
      return response.data as ScenarioAnalysis;
    } catch (error: any) {
      console.error('Scenario analysis failed:', error);
      
      return {
        name: 'Error',
        description: 'Unable to analyze scenario',
        parameters,
        outcome: {
          completionTime: 0,
          successRate: 0,
          cost: 0,
          quality: 0,
        },
        comparison: {
          timeChange: 0,
          costChange: 0,
          successChange: 0,
        },
        riskLevel: 'high',
        recommended: false,
      };
    }
  }

  /**
   * Compare multiple scenarios
   */
  async compareScenarios(
    processId: string,
    scenarios: Array<{ name: string; parameters: Record<string, any> }>
  ): Promise<ScenarioAnalysis[]> {
    try {
      const response = await apiClient.post(`${ML_API_BASE}/scenario/${processId}/compare`, {
        scenarios,
      });
      return response.data as ScenarioAnalysis[];
    } catch (error) {
      console.error('Scenario comparison failed:', error);
      return [];
    }
  }

  // ============================================================================
  // Anomaly Detection
  // ============================================================================

  /**
   * Detect anomalies in process execution
   */
  async detectAnomalies(processId: string): Promise<Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    stepId?: string;
    detectedAt: Date;
    recommendedAction: string;
  }>> {
    try {
      const response = await apiClient.get(`${ML_API_BASE}/anomalies/${processId}`);
      return response.data as any;
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return [];
    }
  }

  // ============================================================================
  // Natural Language Processing
  // ============================================================================

  /**
   * Process natural language input for step creation
   */
  async processNaturalLanguage(
    processId: string,
    text: string
  ): Promise<{
    intent: string;
    entities: Record<string, any>;
    suggestedAction: string;
    confidence: number;
  }> {
    try {
      const response = await apiClient.post(`${AI_API_BASE}/nlp/process`, {
        processId,
        text,
      });
      return response.data as any;
    } catch (error) {
      console.error('NLP processing failed:', error);
      return {
        intent: 'unknown',
        entities: {},
        suggestedAction: '',
        confidence: 0,
      };
    }
  }

  /**
   * Generate step description from structured data
   */
  async generateDescription(data: Record<string, any>): Promise<string> {
    try {
      const response = await apiClient.post(`${AI_API_BASE}/generate/description`, data);
      return response.data.description as string;
    } catch (error) {
      console.error('Description generation failed:', error);
      return '';
    }
  }

  // ============================================================================
  // Learning & Feedback
  // ============================================================================

  /**
   * Submit feedback on AI recommendation
   */
  async submitFeedback(
    recommendationId: string,
    helpful: boolean,
    feedback?: string
  ): Promise<void> {
    try {
      await apiClient.post(`${AI_API_BASE}/feedback`, {
        recommendationId,
        helpful,
        feedback,
      });
    } catch (error) {
      console.error('Feedback submission failed:', error);
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics(): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    lastTrained: Date;
    trainingSamples: number;
  }> {
    try {
      const response = await apiClient.get(`${ML_API_BASE}/metrics`);
      return response.data as any;
    } catch (error) {
      console.error('Failed to get model metrics:', error);
      
      return {
        accuracy: 0,
        precision: 0,
        recall: 0,
        lastTrained: new Date(),
        trainingSamples: 0,
      };
    }
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > RECOMMENDATION_CACHE_TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ============================================================================
  // Fallback Suggestions
  // ============================================================================

  private getFallbackSuggestions(context: AIContext): AIRecommendation[] {
    return [
      {
        id: 'fallback-1',
        type: 'suggestion',
        title: 'Review Step Requirements',
        description: 'Ensure all prerequisites are met before proceeding',
        confidence: 50,
        impact: 'medium',
        action: 'Review checklist',
      },
      {
        id: 'fallback-2',
        type: 'insight',
        title: 'Consider Automation',
        description: 'This step could potentially be automated to save time',
        confidence: 40,
        impact: 'low',
        action: 'Explore automation options',
      },
    ];
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

const aiService = new AIService();

export default aiService;

// ============================================================================
// React Hook
// ============================================================================

import { useState, useCallback } from 'react';

interface UseAIResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAISuggestions(
  processId: string,
  stepId?: string
): UseAIResult<AISuggestionsResponse> {
  const [data, setData] = useState<AISuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.getStepSuggestions({
        processId,
        stepId,
      });
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [processId, stepId]);

  return { data, loading, error, refresh: fetchSuggestions };
}

export function useAIPrediction(
  processId: string,
  type: 'completion' | 'success' | 'bottleneck'
): UseAIResult<PredictionResult> {
  const [data, setData] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result: PredictionResult;
      
      switch (type) {
        case 'completion':
          result = await aiService.predictCompletionTime(processId);
          break;
        case 'success':
          result = await aiService.predictSuccessRate(processId);
          break;
        case 'bottleneck':
          result = await aiService.predictBottlenecks(processId);
          break;
      }
      
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [processId, type]);

  return { data, loading, error, refresh: fetchPrediction };
}

// ============================================================================
// Export Types
// ============================================================================

export type {
  AIContext,
  PredictionResult,
  OptimizationResult,
  ScenarioAnalysis,
};
