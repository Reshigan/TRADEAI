import apiClient from './client'

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  brand: string
  price: number
  cost: number
  status: 'active' | 'discontinued'
  createdAt: string
}

export const productsApi = {
  getAll: (params?: any) =>
    apiClient.get('/products', { params }),

  getById: (id: string) =>
    apiClient.get(`/products/${id}`),

  create: (data: Partial<Product>) =>
    apiClient.post('/products', data),

  update: (id: string, data: Partial<Product>) =>
    apiClient.put(`/products/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/products/${id}`),

  getCategories: () =>
    apiClient.get('/products/categories'),

  getBrands: () =>
    apiClient.get('/products/brands'),

  getPerformance: (id: string) =>
    apiClient.get(`/products/${id}/performance`),
}
