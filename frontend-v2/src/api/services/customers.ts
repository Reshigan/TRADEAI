import apiClient from '../../lib/axios';
import { ApiResponse, Customer, PaginatedResponse } from '../../types/api';

export const customersService = {
  async getAll(params?: any): Promise<PaginatedResponse<Customer>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Customer>>>('/customers', { params });
    return response.data.data;
  },

  async getById(id: string): Promise<Customer> {
    const response = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data.data;
  },

  async create(data: Partial<Customer>): Promise<Customer> {
    const response = await apiClient.post<ApiResponse<Customer>>('/customers', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const response = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  },
};
