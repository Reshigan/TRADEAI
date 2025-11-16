import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import './ProductForm.css';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    status: 'active',
    description: ''
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditMode) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/products/${id}`);
      const product = response.data.data || response.data;
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || '',
        price: product.price || '',
        cost: product.cost || '',
        stock: product.stock || '',
        status: product.status || 'active',
        description: product.description || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim() || !formData.price) {
      setError('Name, SKU, and price are required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        stock: formData.stock ? parseInt(formData.stock) : 0
      };
      const url = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/products${isEditMode ? `/${id}` : ''}`;
      await axios[isEditMode ? 'put' : 'post'](url, payload);
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="product-form-container">
      <div className="form-header">
        <h1>{isEditMode ? 'Edit Product' : 'Create New Product'}</h1>
        <button onClick={() => navigate('/products')} className="btn-secondary">Cancel</button>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Product Name *</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter product name" />
            </div>
            <div className="form-group">
              <label htmlFor="sku">SKU *</label>
              <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleChange} required placeholder="Product SKU" />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" value={formData.category} onChange={handleChange}>
                <option value="">Select category</option>
                <option value="beverages">Beverages</option>
                <option value="snacks">Snacks</option>
                <option value="dairy">Dairy</option>
                <option value="bakery">Bakery</option>
                <option value="frozen">Frozen</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} required>
                <option value="active">Active</option>
                <option value="discontinued">Discontinued</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Pricing & Inventory</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="price">Price (R) *</label>
              <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" placeholder="0.00" />
            </div>
            <div className="form-group">
              <label htmlFor="cost">Cost (R)</label>
              <input type="number" id="cost" name="cost" value={formData.cost} onChange={handleChange} min="0" step="0.01" placeholder="0.00" />
            </div>
            <div className="form-group">
              <label htmlFor="stock">Stock Quantity</label>
              <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} min="0" placeholder="0" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Description</h2>
          <div className="form-group">
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="5" placeholder="Enter product description..." />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/products')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
