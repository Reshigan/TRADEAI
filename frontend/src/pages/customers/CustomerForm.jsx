import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import './CustomerForm.css';

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    tier: 'bronze',
    status: 'active',
    address: ''
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditMode) fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || '/api'}/customers/${id}`);
      const customer = response.data.data || response.data;
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        tier: customer.tier || 'bronze',
        status: customer.status || 'active',
        address: customer.address || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      return;
    }

    try {
      setSaving(true);
      const url = `${process.env.REACT_APP_API_BASE_URL || '/api'}/customers${isEditMode ? `/${id}` : ''}`;
      await axios[isEditMode ? 'put' : 'post'](url, formData);
      navigate('/customers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="customer-form-container">
      <div className="form-header">
        <h1>{isEditMode ? 'Edit Customer' : 'Create New Customer'}</h1>
        <button onClick={() => navigate('/customers')} className="btn-secondary">Cancel</button>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="customer-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Customer Name *</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter customer name" />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="customer@example.com" />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+27 123 456 7890" />
            </div>
            <div className="form-group">
              <label htmlFor="company">Company</label>
              <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} placeholder="Company name" />
            </div>
            <div className="form-group">
              <label htmlFor="tier">Tier</label>
              <select id="tier" name="tier" value={formData.tier} onChange={handleChange}>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} required>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Address</h2>
          <div className="form-group">
            <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows="3" placeholder="Enter address..." />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/customers')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEditMode ? 'Update Customer' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
