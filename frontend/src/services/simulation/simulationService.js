import apiClient from '../apiClient';

class SimulationService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000;
  }

  getCacheKey(endpoint, params) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  async simulatePromotion(promotionData) {
    try {
      const response = await apiClient.post(`/simulations/promotion`, promotionData);
      return response.data;
    } catch (error) {
      console.error('Promotion simulation failed:', error);
      throw new Error(error.response?.data?.message || 'Simulation failed');
    }
  }

  async compareScenarios(scenarios, baseline = null) {
    try {
      const response = await apiClient.post(`/simulations/compare`, { scenarios, baseline });
      return response.data;
    } catch (error) {
      console.error('Scenario comparison failed:', error);
      throw new Error(error.response?.data?.message || 'Comparison failed');
    }
  }

  async getNextBestPromotions(customerId = null, limit = 5) {
    const cacheKey = this.getCacheKey('next-best', { customerId, limit });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.post(`/recommendations/next-best-promotion`, { customerId, limit });
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Next-best promotion recommendation failed:', error);
      throw new Error(error.response?.data?.message || 'Recommendation failed');
    }
  }

  async getBudgetReallocation(budgetId = null, minROI = 100) {
    const cacheKey = this.getCacheKey('budget-realloc', { budgetId, minROI });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.post(`/optimizer/budget/reallocate`, { budgetId, minROI });
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Budget reallocation recommendation failed:', error);
      throw new Error(error.response?.data?.message || 'Reallocation failed');
    }
  }

  async previewConflicts(promotionData, excludePromotionId = null) {
    try {
      const response = await apiClient.post(`/promotions/conflicts/preview`, { ...promotionData, excludePromotionId });
      return response.data;
    } catch (error) {
      console.error('Conflict preview failed:', error);
      throw new Error(error.response?.data?.message || 'Conflict check failed');
    }
  }

  async getPromotionCalendar(year, month = null, view = 'month') {
    const cacheKey = this.getCacheKey('calendar', { year, month, view });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({ year, view });
      if (month) params.append('month', month);

      const response = await apiClient.get(`/promotions/calendar?${params.toString()}`);
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Calendar fetch failed:', error);
      throw new Error(error.response?.data?.message || 'Calendar fetch failed');
    }
  }

  async orchestrateAI(userIntent, context = {}) {
    try {
      const response = await apiClient.post(`/ai-orchestrator/orchestrate`, { userIntent, context });
      return response.data;
    } catch (error) {
      console.error('AI orchestration failed:', error);
      throw new Error(error.response?.data?.message || 'AI orchestration failed');
    }
  }
}

const simulationService = new SimulationService();
export default simulationService;
