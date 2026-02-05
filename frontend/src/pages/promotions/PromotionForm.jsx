import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';
import './PromotionForm.css';

// Static hierarchy options for consistency across the app
const productHierarchyOptions = {
  vendors: ['Unilever', 'Nestle', 'P&G', 'Coca-Cola', 'PepsiCo', 'Kraft Heinz', 'General Mills'],
  categories: ['Beverages', 'Snacks', 'Personal Care', 'Home Care', 'Food', 'Dairy', 'Confectionery'],
  brands: ['Coca-Cola', 'Pepsi', 'Lays', 'Doritos', 'Dove', 'Axe', 'Omo', 'Sunlight', 'Maggi', 'KitKat'],
  subBrands: ['Original', 'Zero Sugar', 'Diet', 'Light', 'Premium', 'Classic', 'Extra', 'Max']
};

const customerHierarchyOptions = {
  channels: ['Modern Trade', 'Traditional Trade', 'E-Commerce', 'Wholesale', 'Foodservice', 'Convenience'],
  subChannels: ['Hypermarket', 'Supermarket', 'Mini Market', 'Spaza Shop', 'Online Marketplace', 'Quick Service Restaurant'],
  segmentations: ['Premium', 'Value', 'Budget', 'Mainstream', 'Niche'],
  hierarchy1: ['National', 'Regional', 'Local'],
  hierarchy2: ['Key Account', 'Mid-Tier', 'Small Account'],
  hierarchy3: ['Strategic', 'Growth', 'Maintain', 'Decline'],
  headOffices: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein']
};

const PromotionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    status: 'planned',
    priority: 'normal',
    startDate: '',
    endDate: '',
    budget: '',
    description: '',
    dealType: 'off_invoice',
    claimType: 'vendor_invoice',
    products: [],
    customers: [],
    productHierarchy: {
      vendor: '',
      category: '',
      brand: '',
      subBrand: '',
      productId: ''
    },
    customerHierarchy: {
      channel: '',
      subChannel: '',
      segmentation: '',
      hierarchy1: '',
      hierarchy2: '',
      hierarchy3: '',
      headOffice: '',
      customerId: ''
    }
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    if (isEditMode) {
      fetchPromotion();
    }
  }, [id]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || '/api'}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const productsData = response.data.data || response.data;
      setProducts(productsData);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || '/api'}/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const customersData = response.data.data || response.data;
      setCustomers(customersData);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const fetchPromotion = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || '/api'}/promotions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const promotion = response.data.data || response.data;
      
      setFormData({
        name: promotion.name || '',
        type: promotion.type || '',
        status: promotion.status || 'planned',
        priority: promotion.priority || 'normal',
        startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
        endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
        budget: promotion.budget || '',
        description: promotion.description || '',
        products: promotion.products || [],
        customers: promotion.customers || []
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load promotion');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHierarchyChange = (type, level, value) => {
    setFormData(prev => ({
      ...prev,
      [`${type}Hierarchy`]: {
        ...prev[`${type}Hierarchy`],
        [level]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Promotion name is required');
      return;
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('End date must be after start date');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : 0
      };

      if (isEditMode) {
        await axios.put(
          `${process.env.REACT_APP_API_BASE_URL || '/api'}/promotions/${id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_BASE_URL || '/api'}/promotions`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      navigate('/promotions');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save promotion');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            {isEditMode ? 'Edit Promotion' : 'Create New Promotion'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => navigate('/promotions')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Promotion Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter promotion name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="">Select type</option>
                <option value="discount">Discount</option>
                <option value="bogo">Buy One Get One</option>
                <option value="bundle">Bundle</option>
                <option value="rebate">Rebate</option>
                <option value="loyalty">Loyalty</option>
                <option value="seasonal">Seasonal</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Dates</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Financial Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="budget">Budget (R)</label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="dealType">Deal Type</label>
              <select
                id="dealType"
                name="dealType"
                value={formData.dealType}
                onChange={handleChange}
              >
                <option value="off_invoice">Off Invoice</option>
                <option value="on_invoice">On Invoice</option>
                <option value="rebate">Rebate</option>
                <option value="allowance">Allowance</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="claimType">Claim Type</label>
              <select
                id="claimType"
                name="claimType"
                value={formData.claimType}
                onChange={handleChange}
              >
                <option value="vendor_invoice">Vendor Invoice</option>
                <option value="credit_note">Credit Note</option>
                <option value="deduction">Deduction</option>
                <option value="check">Check</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Product Hierarchy Selection</h2>
          <p className="section-description">Vendor - Category - Brand - Sub Brand - Product</p>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="productVendor">Vendor</label>
              <select
                id="productVendor"
                value={formData.productHierarchy.vendor}
                onChange={(e) => handleHierarchyChange('product', 'vendor', e.target.value)}
              >
                <option value="">All Vendors</option>
                {productHierarchyOptions.vendors.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="productCategory">Category</label>
              <select
                id="productCategory"
                value={formData.productHierarchy.category}
                onChange={(e) => handleHierarchyChange('product', 'category', e.target.value)}
              >
                <option value="">All Categories</option>
                {productHierarchyOptions.categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="productBrand">Brand</label>
              <select
                id="productBrand"
                value={formData.productHierarchy.brand}
                onChange={(e) => handleHierarchyChange('product', 'brand', e.target.value)}
              >
                <option value="">All Brands</option>
                {productHierarchyOptions.brands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="productSubBrand">Sub Brand</label>
              <select
                id="productSubBrand"
                value={formData.productHierarchy.subBrand}
                onChange={(e) => handleHierarchyChange('product', 'subBrand', e.target.value)}
              >
                <option value="">All Sub Brands</option>
                {productHierarchyOptions.subBrands.map(sb => (
                  <option key={sb} value={sb}>{sb}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="productId">Specific Product</label>
              <select
                id="productId"
                value={formData.productHierarchy.productId}
                onChange={(e) => handleHierarchyChange('product', 'productId', e.target.value)}
              >
                <option value="">All Products</option>
                {products.map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Customer Hierarchy Selection</h2>
          <p className="section-description">Channel - Sub Channel - Segmentation - Hierarchy 1/2/3 - Head Office - Customer</p>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="customerChannel">Channel</label>
              <select
                id="customerChannel"
                value={formData.customerHierarchy.channel}
                onChange={(e) => handleHierarchyChange('customer', 'channel', e.target.value)}
              >
                <option value="">All Channels</option>
                {customerHierarchyOptions.channels.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="customerSubChannel">Sub Channel</label>
              <select
                id="customerSubChannel"
                value={formData.customerHierarchy.subChannel}
                onChange={(e) => handleHierarchyChange('customer', 'subChannel', e.target.value)}
              >
                <option value="">All Sub Channels</option>
                {customerHierarchyOptions.subChannels.map(sc => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="customerSegmentation">Segmentation</label>
              <select
                id="customerSegmentation"
                value={formData.customerHierarchy.segmentation}
                onChange={(e) => handleHierarchyChange('customer', 'segmentation', e.target.value)}
              >
                <option value="">All Segments</option>
                {customerHierarchyOptions.segmentations.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="customerH1">Hierarchy 1</label>
              <select
                id="customerH1"
                value={formData.customerHierarchy.hierarchy1}
                onChange={(e) => handleHierarchyChange('customer', 'hierarchy1', e.target.value)}
              >
                <option value="">All</option>
                {customerHierarchyOptions.hierarchy1.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="customerH2">Hierarchy 2</label>
              <select
                id="customerH2"
                value={formData.customerHierarchy.hierarchy2}
                onChange={(e) => handleHierarchyChange('customer', 'hierarchy2', e.target.value)}
              >
                <option value="">All</option>
                {customerHierarchyOptions.hierarchy2.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="customerH3">Hierarchy 3</label>
              <select
                id="customerH3"
                value={formData.customerHierarchy.hierarchy3}
                onChange={(e) => handleHierarchyChange('customer', 'hierarchy3', e.target.value)}
              >
                <option value="">All</option>
                {customerHierarchyOptions.hierarchy3.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="customerHeadOffice">Head Office</label>
              <select
                id="customerHeadOffice"
                value={formData.customerHierarchy.headOffice}
                onChange={(e) => handleHierarchyChange('customer', 'headOffice', e.target.value)}
              >
                <option value="">All Head Offices</option>
                {customerHierarchyOptions.headOffices.map(ho => (
                  <option key={ho} value={ho}>{ho}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="customerId">Specific Customer</label>
              <select
                id="customerId"
                value={formData.customerHierarchy.customerId}
                onChange={(e) => handleHierarchyChange('customer', 'customerId', e.target.value)}
              >
                <option value="">All Customers</option>
                {customers.map(c => (
                  <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Description</h2>
          <div className="form-group">
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              placeholder="Enter promotion description..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/promotions')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEditMode ? 'Update Promotion' : 'Create Promotion'}
          </button>
        </div>
      </form>
      </Paper>
    </Box>
  );
};

export default PromotionForm;
