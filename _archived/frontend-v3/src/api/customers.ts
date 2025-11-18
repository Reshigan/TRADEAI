import apiClient from './client'

export interface Customer {
  id: string
  name: string
  code: string
  type: 'retailer' | 'distributor' | 'wholesaler'
  tier: 'A' | 'B' | 'C'
  region: string
  salesVolume: number
  status: 'active' | 'inactive'
  contactEmail: string
  contactPhone: string
  createdAt: string
}

export const customersApi = {
  getAll: (params?: any) =>
    apiClient.get('/customers', { params }),

  getById: (id: string) =>
    apiClient.get(`/customers/${id}`),

  create: (data: Partial<Customer>) =>
    apiClient.post('/customers', data),

  update: (id: string, data: Partial<Customer>) =>
    apiClient.put(`/customers/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/customers/${id}`),

  getHierarchy: (id: string) =>
    apiClient.get(`/customers/${id}/hierarchy`),

  getPerformance: (id: string) =>
    apiClient.get(`/customers/${id}/performance`),

  getPromotions: (id: string) =>
    apiClient.get(`/customers/${id}/promotions`),
}
