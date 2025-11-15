import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class ActivityGridService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 2 * 60 * 1000; // 2 minutes (shorter for activity grid)
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

  async getActivityGrid(filters = {}) {
    const cacheKey = this.getCacheKey('getActivityGrid', filters);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams();
    if (filters.view) params.append('view', filters.view);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await axios.get(
      `${API_BASE_URL}/api/activity-grid?${params.toString()}`,
      this.getAuthHeaders()
    );

    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getActivityGrids(filters = {}) {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.activityType) params.append('activityType', filters.activityType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await axios.get(
      `${API_BASE_URL}/api/activity-grid/list?${params.toString()}`,
      this.getAuthHeaders()
    );

    return response.data;
  }

  async getHeatMap(year, month, groupBy) {
    const cacheKey = this.getCacheKey('getHeatMap', { year, month, groupBy });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams();
    params.append('year', year);
    params.append('month', month);
    if (groupBy) params.append('groupBy', groupBy);

    const response = await axios.get(
      `${API_BASE_URL}/api/activity-grid/heat-map?${params.toString()}`,
      this.getAuthHeaders()
    );

    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getConflicts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.severity) params.append('severity', filters.severity);

    const response = await axios.get(
      `${API_BASE_URL}/api/activity-grid/conflicts?${params.toString()}`,
      this.getAuthHeaders()
    );

    return response.data;
  }

  async createActivity(data) {
    const response = await axios.post(
      `${API_BASE_URL}/api/activity-grid`,
      data,
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async updateActivity(id, data) {
    const response = await axios.put(
      `${API_BASE_URL}/api/activity-grid/${id}`,
      data,
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async deleteActivity(id) {
    const response = await axios.delete(
      `${API_BASE_URL}/api/activity-grid/${id}`,
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }

  async syncActivities(source, startDate, endDate) {
    const response = await axios.post(
      `${API_BASE_URL}/api/activity-grid/sync`,
      { source, startDate, endDate },
      this.getAuthHeaders()
    );
    this.clearCache();
    return response.data;
  }
}

export default new ActivityGridService();
