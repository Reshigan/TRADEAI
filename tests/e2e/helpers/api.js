/**
 * API Helper for E2E Tests
 * Provides authenticated API requests with tenant scoping
 */

class ApiHelper {
  constructor(request, authToken, tenantId) {
    this.request = request;
    this.authToken = authToken;
    this.tenantId = tenantId;
    this.baseURL = process.env.BASE_URL || 'https://tradeai.gonxt.tech';
  }

  /**
   * Get headers with authentication
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * GET request with authentication
   */
  async get(path, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${this.baseURL}${path}?${queryString}` : `${this.baseURL}${path}`;
    
    const response = await this.request.get(url, {
      headers: this.getHeaders()
    });
    const data = await response.json().catch(() => ({}));
    
    return { response, data };
  }

  /**
   * POST request with authentication
   */
  async post(path, body = {}) {
    const response = await this.request.post(`${this.baseURL}${path}`, {
      headers: this.getHeaders(),
      data: body
    });
    const data = await response.json().catch(() => ({}));
    
    return { response, data };
  }

  /**
   * PUT request with authentication
   */
  async put(path, body = {}) {
    const response = await this.request.put(`${this.baseURL}${path}`, {
      headers: this.getHeaders(),
      data: body
    });
    const data = await response.json().catch(() => ({}));
    
    return { response, data };
  }

  /**
   * DELETE request with authentication
   */
  async delete(path) {
    const response = await this.request.delete(`${this.baseURL}${path}`, {
      headers: this.getHeaders()
    });
    const data = await response.json().catch(() => ({}));
    
    return { response, data };
  }

  /**
   * Extract auth token from page context
   */
  static async extractAuthToken(page) {
    const token = await page.evaluate(() => {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    });
    return token;
  }

  /**
   * Extract tenant ID from page context
   */
  static async extractTenantId(page) {
    const user = await page.evaluate(() => {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    });
    return user?.tenantId;
  }

  /**
   * Create API helper from page context
   */
  static async fromPage(page, request) {
    const token = await ApiHelper.extractAuthToken(page);
    const tenantId = await ApiHelper.extractTenantId(page);
    
    if (!token) {
      throw new Error('No auth token found in page context');
    }
    
    return new ApiHelper(request, token, tenantId);
  }
}

module.exports = { ApiHelper };
