import api from '../api';

class AIOrchestratorService {
  constructor() {
    this.basePath = '/ai-orchestrator';
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000;
  }

  async orchestrate(intent, context = {}) {
    try {
      const cacheKey = `${intent}_${JSON.stringify(context)}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        return cached;
      }

      const response = await api.post(
        `${this.basePath}/orchestrate`,
        { intent, context },
        { timeout: 30000 }
      );

      const result = response.data;
      this.setCache(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('AI Orchestrator error:', error);
      throw new Error(
        error.response?.data?.error || 
        'Failed to get AI insights. Please ensure Ollama is running.'
      );
    }
  }

  async explain(result) {
    try {
      const response = await api.post(
        `${this.basePath}/explain`,
        { result },
        { timeout: 30000 }
      );

      return response.data;
    } catch (error) {
      console.error('AI Explanation error:', error);
      throw new Error(
        error.response?.data?.error || 
        'Failed to generate explanation'
      );
    }
  }

  async getTools() {
    try {
      const response = await api.get(`${this.basePath}/tools`);

      return response.data;
    } catch (error) {
      console.error('Get tools error:', error);
      return { tools: [] };
    }
  }

  async healthCheck() {
    try {
      const response = await api.get(`${this.basePath}/health`);

      return response.data;
    } catch (error) {
      return { 
        status: 'error', 
        message: error.message,
        ollamaAvailable: false,
        mlServiceAvailable: false
      };
    }
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const { data, timestamp } = cached;
    const age = Date.now() - timestamp;
    
    if (age > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return data;
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
}

export default new AIOrchestratorService();
