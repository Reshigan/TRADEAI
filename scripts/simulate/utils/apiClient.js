/**
 * API Client for simulation and validation
 */

const axios = require('axios');

class APIClient {
  constructor(baseURL, token = null) {
    this.baseURL = baseURL || 'https://tradeai.gonxt.tech/api';
    this.token = token;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 30000
    });
  }

  async login(email, password) {
    const response = await this.client.post('/auth/login', { email, password });
    this.token = response.data.token;
    this.client.defaults.headers.Authorization = `Bearer ${this.token}`;
    return response.data;
  }

  async get(endpoint) {
    const response = await this.client.get(endpoint);
    return response.data;
  }

  async post(endpoint, data) {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  async put(endpoint, data) {
    const response = await this.client.put(endpoint, data);
    return response.data;
  }

  async delete(endpoint) {
    const response = await this.client.delete(endpoint);
    return response.data;
  }

  async getBudgets() {
    return this.get('/budgets');
  }

  async getPromotions() {
    return this.get('/promotions');
  }

  async getProducts() {
    return this.get('/products');
  }

  async getCustomers() {
    return this.get('/customers');
  }

  async getTradeSpend() {
    return this.get('/trade-spend');
  }

  async getDashboard() {
    return this.get('/dashboard');
  }

  async getAnalytics() {
    return this.get('/analytics');
  }

  async getReports(type) {
    return this.get(`/reports/${type}`);
  }
}

module.exports = APIClient;
