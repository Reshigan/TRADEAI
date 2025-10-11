import React, { useState } from 'react';

interface Budget {
  id?: string;
  name: string;
  description?: string;
  budget_type: string;
  total_amount: number;
  currency: string;
  period_start: string;
  period_end: string;
  customer_id?: string;
  product_id?: string;
}

interface BudgetFormProps {
  budget?: Budget;
  onSubmit: (data: Omit<Budget, 'id'>) => void;
  onCancel: () => void;
  loading?: boolean;
  customers?: Array<{id: string, name: string}>;
  products?: Array<{id: string, name: string}>;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  budget,
  onSubmit,
  onCancel,
  loading = false,
  customers = [],
  products = []
}) => {
  const [formData, setFormData] = useState<Omit<Budget, 'id'>>({
    name: budget?.name || '',
    description: budget?.description || '',
    budget_type: budget?.budget_type || 'marketing',
    total_amount: budget?.total_amount || 0,
    currency: budget?.currency || 'USD',
    period_start: budget?.period_start || new Date().toISOString().split('T')[0],
    period_end: budget?.period_end || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
    customer_id: budget?.customer_id || '',
    product_id: budget?.product_id || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      customer_id: formData.customer_id || undefined,
      product_id: formData.product_id || undefined,
    };
    onSubmit(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="budget-form">
      <h2>{budget ? 'Edit Budget' : 'Create Budget'}</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Budget Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="budget_type">Budget Type *</label>
            <select
              id="budget_type"
              name="budget_type"
              value={formData.budget_type}
              onChange={handleChange}
              required
              className="form-control"
            >
              <option value="marketing">Marketing</option>
              <option value="trade_spend">Trade Spend</option>
              <option value="promotion">Promotion</option>
              <option value="advertising">Advertising</option>
              <option value="events">Events</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-control"
            rows={3}
            placeholder="Budget description and objectives..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="total_amount">Total Amount *</label>
            <input
              type="number"
              id="total_amount"
              name="total_amount"
              value={formData.total_amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="form-control"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="period_start">Period Start *</label>
            <input
              type="date"
              id="period_start"
              name="period_start"
              value={formData.period_start}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="period_end">Period End *</label>
            <input
              type="date"
              id="period_end"
              name="period_end"
              value={formData.period_end}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="customer_id">Customer (Optional)</label>
            <select
              id="customer_id"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              className="form-control"
            >
              <option value="">-- Select Customer --</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="product_id">Product (Optional)</label>
            <select
              id="product_id"
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              className="form-control"
            >
              <option value="">-- Select Product --</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Saving...' : budget ? 'Update Budget' : 'Create Budget'}
          </button>
        </div>
      </form>
    </div>
  );
};