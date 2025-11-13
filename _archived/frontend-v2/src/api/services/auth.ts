import apiClient from '../../lib/axios';
import { AuthResponse, User } from '../../types/api';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    
    // Store refresh token if provided
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    
    // Store user data for quick access
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  async getCurrentUser(): Promise<User> {
    // Try to get from localStorage first (faster)
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        // Still verify with server in background
        this.verifyUser().catch(() => {
          // If verification fails, remove cached user
          localStorage.removeItem('user');
        });
        return user;
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    
    // Fetch from server
    const response = await apiClient.get<{ success: boolean; data: User }>('/users/me');
    const user = response.data.data;
    
    // Cache the user
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  },

  async verifyUser(): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/verify');
      return response.data.valid;
    } catch (error) {
      return false;
    }
  },

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ token: string; refreshToken?: string }>(
      '/auth/refresh',
      { refreshToken }
    );

    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }

    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }

    return response.data.token;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  },
};
