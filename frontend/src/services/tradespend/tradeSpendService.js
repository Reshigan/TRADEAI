import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

class TradeSpendService {
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

  async getTradeSpends(filters = {}) {
    const cacheKey = this.getCacheKey('getTradeSpends', filters);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams();
    if (filters.spendType) params.append('spendType', filters.spendType);
    if (filters.status) params.append('status', filters.status);
    if (filters.customer) params.append('customer', filters.customer);
    if (filters.vendor) params.append('vendor', filters.vendor);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await axios.get(
      `${API_BASE_URL}/api/trade-spends?${params.toString()}`,
      this.getAuthHeaders()
    );

    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getTradeSpend(id) {
    const response = await axios.get(
      `${API_BASE_URL}/api/trade-spends/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async createTradeSpend(data) {
    const response = await axios.post(
      `${API_BASE_URL}/api/trade-spends`,
      data,
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async updateTradeSpend(id, data) {
    const response = await axios.put(
      `${API_BASE_URL}/api/trade-spends/${id}`,
      data,
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async deleteTradeSpend(id) {
    const response = await axios.delete(
      `${API_BASE_URL}/api/trade-spends/${id}`,
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async submitForApproval(id) {
    const response = await axios.post(
      `${API_BASE_URL}/api/trade-spends/${id}/submit`,
      {},
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async approveTradeSpend(id, approvedAmount, comments) {
    const response = await axios.post(
      `${API_BASE_URL}/api/trade-spends/${id}/approve`,
      { approvedAmount, comments },
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async rejectTradeSpend(id, reason) {
    const response = await axios.post(
      `${API_BASE_URL}/api/trade-spends/${id}/reject`,
      { reason },
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async recordSpend(id, amount, documents = []) {
    const response = await axios.post(
      `${API_BASE_URL}/api/trade-spends/${id}/record-spend`,
      { amount, documents },
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async getTradeSpendSummary(year, groupBy = 'month') {
    const cacheKey = this.getCacheKey('getTradeSpendSummary', { year, groupBy });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (groupBy) params.append('groupBy', groupBy);

    const response = await axios.get(
      `${API_BASE_URL}/api/trade-spends/summary?${params.toString()}`,
      this.getAuthHeaders()
    );

    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getWalletBalance(customerId) {
    const response = await axios.get(
      `${API_BASE_URL}/api/trade-spends/wallet/${customerId}`,
      this.getAuthHeaders()
    );
    return response.data;
  }
}

export default new TradeSpendService();
