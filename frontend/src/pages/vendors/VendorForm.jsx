import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import './VendorForm.css';

const VendorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    rating: '3',
    status: 'active',
    address: ''
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditMode) fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/vendors/${id}`);
      const vendor = response.data.data || response.data;
      setFormData({
        name: vendor.name || '',
        contactPerson: vendor.contactPerson || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        rating: vendor.rating || '3',
        status: vendor.status || 'active',
        address: vendor.address || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vendor');
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
      const url = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/vendors${isEditMode ? `/${id}` : ''}`;
      await axios[isEditMode ? 'put' : 'post'](url, formData);
      navigate('/vendors');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vendor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="vendor-form-container">
      <div className="form-header">
        <h1>{isEditMode ? 'Edit Vendor' : 'Create New Vendor'}</h1>
        <button onClick={() => navigate('/vendors')} className="btn-secondary">Cancel</button>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="vendor-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Vendor Name *</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter vendor name" />
            </div>
            <div className="form-group">
              <label htmlFor="contactPerson">Contact Person</label>
              <input type="text" id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="Contact person name" />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="vendor@example.com" />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+27 123 456 7890" />
            </div>
            <div className="form-group">
              <label htmlFor="rating">Rating</label>
              <select id="rating" name="rating" value={formData.rating} onChange={handleChange}>
                <option value="1">⭐ (1 - Poor)</option>
                <option value="2">⭐⭐ (2 - Fair)</option>
                <option value="3">⭐⭐⭐ (3 - Good)</option>
                <option value="4">⭐⭐⭐⭐ (4 - Very Good)</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} required>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Address</h2>
          <div className="form-group">
            <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows="3" placeholder="Enter vendor address..." />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/vendors')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEditMode ? 'Update Vendor' : 'Create Vendor'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorForm;
