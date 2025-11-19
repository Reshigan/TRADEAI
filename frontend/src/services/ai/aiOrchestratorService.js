import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

class AIOrchestratorService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/ai-orchestrator`;
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

      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${this.baseURL}/orchestrate`,
        { intent, context },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
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
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${this.baseURL}/explain`,
        { result },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
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
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${this.baseURL}/tools`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Get tools error:', error);
      return { tools: [] };
    }
  }

  async healthCheck() {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${this.baseURL}/health`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

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
