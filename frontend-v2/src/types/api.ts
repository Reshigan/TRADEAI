// Complete API Type Definitions
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: { message: string; code?: string; details?: unknown };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  tenant: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  code?: string;
  type: 'RETAIL' | 'WHOLESALE' | 'PHARMACY' | 'ONLINE';
  tier?: 'A' | 'B' | 'C';
  status: 'active' | 'inactive' | 'prospect';
  contactEmail?: string;
  contactPhone?: string;
  revenue?: number;
  tenant: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  price: number;
  cost: number;
  margin?: number;
  stock?: number;
  status: 'active' | 'discontinued' | 'seasonal';
  tenant: string;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  _id: string;
  name: string;
  description?: string;
  type: 'seasonal' | 'volume' | 'bogo' | 'discount';
  status: 'draft' | 'planned' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  customers: Customer[] | string[];
  products: Product[] | string[];
  budget?: number;
  actualSpend?: number;
  tenant: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  _id: string;
  name: string;
  year: number;
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  totalAmount: number;
  allocatedAmount?: number;
  spentAmount?: number;
  category: 'promotions' | 'tradeSpends' | 'marketing' | 'other';
  status: 'draft' | 'approved' | 'active' | 'closed';
  tenant: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeSpend {
  _id: string;
  title: string;
  type: 'listing_fee' | 'display' | 'promotion' | 'rebate' | 'other';
  customer: Customer | string;
  amount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';
  tenant: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}
