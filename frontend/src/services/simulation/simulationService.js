import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class SimulationService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
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
      const response = await axios.post(
        `${API_BASE_URL}/api/simulations/promotion`,
        promotionData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Promotion simulation failed:', error);
      throw new Error(error.response?.data?.message || 'Simulation failed');
    }
  }

  async compareScenarios(scenarios, baseline = null) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/simulations/compare`,
        { scenarios, baseline },
        { headers: this.getAuthHeaders() }
      );
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
      const response = await axios.post(
        `${API_BASE_URL}/api/recommendations/next-best-promotion`,
        { customerId, limit },
        { headers: this.getAuthHeaders() }
      );
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
      const response = await axios.post(
        `${API_BASE_URL}/api/optimizer/budget/reallocate`,
        { budgetId, minROI },
        { headers: this.getAuthHeaders() }
      );
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Budget reallocation recommendation failed:', error);
      throw new Error(error.response?.data?.message || 'Reallocation failed');
    }
  }

  async previewConflicts(promotionData, excludePromotionId = null) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/promotions/conflicts/preview`,
        { ...promotionData, excludePromotionId },
        { headers: this.getAuthHeaders() }
      );
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

      const response = await axios.get(
        `${API_BASE_URL}/api/promotions/calendar?${params.toString()}`,
        { headers: this.getAuthHeaders() }
      );
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Calendar fetch failed:', error);
      throw new Error(error.response?.data?.message || 'Calendar fetch failed');
    }
  }

  async orchestrateAI(userIntent, context = {}) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai-orchestrator/orchestrate`,
        { userIntent, context },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('AI orchestration failed:', error);
      throw new Error(error.response?.data?.message || 'AI orchestration failed');
    }
  }
}

export default new SimulationService();
