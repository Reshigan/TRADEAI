import apiClient from '../apiClient';

class ActivityGridService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 2 * 60 * 1000; // 2 minutes (shorter for activity grid)
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

    const response = await apiClient.get(`/activity-grid?${params.toString()}`);

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

    const response = await apiClient.get(`/activity-grid/list?${params.toString()}`);

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

    const response = await apiClient.get(`/activity-grid/heat-map?${params.toString()}`);

    this.setCache(cacheKey, response.data);
    return response.data;
  }

  async getConflicts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.severity) params.append('severity', filters.severity);

    const response = await apiClient.get(`/activity-grid/conflicts?${params.toString()}`);

    return response.data;
  }

  async createActivity(data) {
    const response = await apiClient.post('/activity-grid', data);
    this.clearCache();
    return response.data;
  }

  async updateActivity(id, data) {
    const response = await apiClient.put(`/activity-grid/${id}`, data);
    this.clearCache();
    return response.data;
  }

  async deleteActivity(id) {
    const response = await apiClient.delete(`/activity-grid/${id}`);
    this.clearCache();
    return response.data;
  }

  async syncActivities(source, startDate, endDate) {
    const response = await apiClient.post('/activity-grid/sync', { source, startDate, endDate });
    this.clearCache();
    return response.data;
  }
}

const activityGridService = new ActivityGridService();
export default activityGridService;
