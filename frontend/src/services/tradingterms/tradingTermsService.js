import apiClient from '../apiClient';


class TradingTermsService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  getCacheKey(method, params) {
    return `${method}_${JSON.stringify(params)}`;
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

  async getTradingTermOptions() {
    const cacheKey = this.getCacheKey('getTradingTermOptions', {});
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get(`/trading-terms/options`);

    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getTradingTerms(filters = {}) {
    const cacheKey = this.getCacheKey('getTradingTerms', filters);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });

    const response = await apiClient.get(`/trading-terms?${params.toString()}`);

    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getTradingTerm(id) {
    const response = await apiClient.get(`/trading-terms/${id}`);
    return response.data;
  }

  async createTradingTerm(data) {
    const response = await apiClient.post(`/trading-terms`, data);
    this.clearCache();
    return response.data;
  }

  async updateTradingTerm(id, data) {
    const response = await apiClient.put(`/trading-terms/${id}`, data);
    this.clearCache();
    return response.data;
  }

  async deleteTradingTerm(id) {
    const response = await apiClient.delete(`/trading-terms/${id}`);
    this.clearCache();
    return response.data;
  }

  async submitForApproval(id) {
    const response = await apiClient.post(`/trading-terms/${id}/submit`, {});
    this.clearCache();
    return response.data;
  }

  async approveRejectTradingTerm(id, action, notes) {
    const response = await apiClient.post(`/trading-terms/${id}/approve-reject`, { action, notes });
    this.clearCache();
    return response.data;
  }

  async calculateDiscount(id, volume, value) {
    const response = await apiClient.post(`/trading-terms/${id}/calculate`, { volume, value });
    return response.data;
  }
}

const tradingTermsService = new TradingTermsService();
export default tradingTermsService;
