import apiClient from '../apiClient';

class KAMWalletService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000;
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

  async getWallets(filters = {}) {
    const cacheKey = this.getCacheKey('getWallets', filters);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams();
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/kam-wallets?${params.toString()}`);
    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getWallet(id) {
    const response = await apiClient.get(`/kam-wallets/${id}`);
    return response.data;
  }

  async createWallet(walletData) {
    const response = await apiClient.post('/kam-wallets', walletData);
    this.clearCache();
    return response.data;
  }

  async allocateToCustomer(walletId, customerId, amount, notes = '') {
    const response = await apiClient.post(`/kam-wallets/${walletId}/allocate`, {
      customerId,
      amount,
      notes
    });
    this.clearCache();
    return response.data;
  }

  async recordUsage(walletId, customerId, amount) {
    const response = await apiClient.post(`/kam-wallets/${walletId}/record-usage`, {
      customerId,
      amount
    });
    this.clearCache();
    return response.data;
  }

  async getBalance(walletId) {
    const response = await apiClient.get(`/kam-wallets/${walletId}/balance`);
    return response.data;
  }

  async getCustomerAllocations(customerId) {
    const response = await apiClient.get(`/kam-wallets/customer/${customerId}/allocations`);
    return response.data;
  }

  async updateStatus(walletId, status) {
    const response = await apiClient.patch(`/kam-wallets/${walletId}/status`, { status });
    this.clearCache();
    return response.data;
  }
}

const kamWalletService = new KAMWalletService();
export default kamWalletService;
