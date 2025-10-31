import apiClient from './client'

export interface LoginRequest {
  email?: string
  username?: string
  password: string
  tenantId?: string
}

export interface LoginResponse {
  success: boolean
  data: {
    accessToken: string
    refreshToken: string
    user: User
  }
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  department: string
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  quickLogin: () =>
    apiClient.post<LoginResponse>('/auth/quick-login'),

  logout: () =>
    apiClient.post('/auth/logout'),

  getMe: () =>
    apiClient.get<{ success: boolean; data: User }>('/auth/me'),

  updateMe: (data: Partial<User>) =>
    apiClient.put('/auth/me', data),
}
