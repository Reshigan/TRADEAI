import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

class TradingTermsService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
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

    const response = await axios.get(
      `${API_BASE_URL}/api/trading-terms/options`,
      this.getAuthHeaders()
    );

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

    const response = await axios.get(
      `${API_BASE_URL}/api/trading-terms?${params.toString()}`,
      this.getAuthHeaders()
    );

    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getTradingTerm(id) {
    const response = await axios.get(
      `${API_BASE_URL}/api/trading-terms/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async createTradingTerm(data) {
    const response = await axios.post(
      `${API_BASE_URL}/api/trading-terms`,
      data,
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async updateTradingTerm(id, data) {
    const response = await axios.put(
      `${API_BASE_URL}/api/trading-terms/${id}`,
      data,
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async deleteTradingTerm(id) {
    const response = await axios.delete(
      `${API_BASE_URL}/api/trading-terms/${id}`,
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async submitForApproval(id) {
    const response = await axios.post(
      `${API_BASE_URL}/api/trading-terms/${id}/submit`,
      {},
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async approveRejectTradingTerm(id, action, notes) {
    const response = await axios.post(
      `${API_BASE_URL}/api/trading-terms/${id}/approve-reject`,
      { action, notes },
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async calculateDiscount(id, volume, value) {
    const response = await axios.post(
      `${API_BASE_URL}/api/trading-terms/${id}/calculate`,
      { volume, value },
      this.getAuthHeaders()
    );
    return response.data;
  }
}

export default new TradingTermsService();
