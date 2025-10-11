// API Types for TRADEAI v2.0

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  customer_type: 'retail' | 'wholesale' | 'distributor' | 'corporate';
  status: 'active' | 'inactive' | 'suspended';
  credit_limit?: number;
  payment_terms?: string;
  tax_id?: string;
  parent_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreate {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  customer_type: 'retail' | 'wholesale' | 'distributor' | 'corporate';
  status: 'active' | 'inactive' | 'suspended';
  credit_limit?: number;
  payment_terms?: string;
  tax_id?: string;
  parent_customer_id?: string;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
}