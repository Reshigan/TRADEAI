import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';

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
    products: [],
    customers: [],
    productHierarchy: {
      level1: '',
      level2: '',
      level3: ''
    },
    customerHierarchy: {
      level1: '',
      level2: '',
      level3: ''
    }
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [productHierarchies, setProductHierarchies] = useState({ level1: [], level2: [], level3: [] });
  const [customerHierarchies, setCustomerHierarchies] = useState({ level1: [], level2: [], level3: [] });

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
      
      // Extract unique hierarchies
      const hierarchies = { level1: [], level2: [], level3: [] };
      productsData.forEach(product => {
        if (product.hierarchy?.level1?.name && !hierarchies.level1.find(h => h === product.hierarchy.level1.name)) {
          hierarchies.level1.push(product.hierarchy.level1.name);
        }
        if (product.hierarchy?.level2?.name && !hierarchies.level2.find(h => h === product.hierarchy.level2.name)) {
          hierarchies.level2.push(product.hierarchy.level2.name);
        }
        if (product.hierarchy?.level3?.name && !hierarchies.level3.find(h => h === product.hierarchy.level3.name)) {
          hierarchies.level3.push(product.hierarchy.level3.name);
        }
      });
      setProductHierarchies(hierarchies);
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
      
      // Extract unique hierarchies
      const hierarchies = { level1: [], level2: [], level3: [] };
      customersData.forEach(customer => {
        if (customer.hierarchy?.level1?.name && !hierarchies.level1.find(h => h === customer.hierarchy.level1.name)) {
          hierarchies.level1.push(customer.hierarchy.level1.name);
        }
        if (customer.hierarchy?.level2?.name && !hierarchies.level2.find(h => h === customer.hierarchy.level2.name)) {
          hierarchies.level2.push(customer.hierarchy.level2.name);
        }
        if (customer.hierarchy?.level3?.name && !hierarchies.level3.find(h => h === customer.hierarchy.level3.name)) {
          hierarchies.level3.push(customer.hierarchy.level3.name);
        }
      });
      setCustomerHierarchies(hierarchies);
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
          </div>
        </div>

        <div className="form-section">
          <h2>Product Hierarchy Selection</h2>
          <p className="section-description">Select product categories to target with this promotion</p>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="productLevel1">Product Category (Level 1)</label>
              <select
                id="productLevel1"
                value={formData.productHierarchy.level1}
                onChange={(e) => handleHierarchyChange('product', 'level1', e.target.value)}
              >
                <option value="">All Categories</option>
                {productHierarchies.level1.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="productLevel2">Product Sub-Category (Level 2)</label>
              <select
                id="productLevel2"
                value={formData.productHierarchy.level2}
                onChange={(e) => handleHierarchyChange('product', 'level2', e.target.value)}
              >
                <option value="">All Sub-Categories</option>
                {productHierarchies.level2.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="productLevel3">Product Type (Level 3)</label>
              <select
                id="productLevel3"
                value={formData.productHierarchy.level3}
                onChange={(e) => handleHierarchyChange('product', 'level3', e.target.value)}
              >
                <option value="">All Types</option>
                {productHierarchies.level3.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Customer Hierarchy Selection</h2>
          <p className="section-description">Select customer segments to target with this promotion</p>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="customerLevel1">Customer Group (Level 1)</label>
              <select
                id="customerLevel1"
                value={formData.customerHierarchy.level1}
                onChange={(e) => handleHierarchyChange('customer', 'level1', e.target.value)}
              >
                <option value="">All Customer Groups</option>
                {customerHierarchies.level1.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="customerLevel2">Customer Segment (Level 2)</label>
              <select
                id="customerLevel2"
                value={formData.customerHierarchy.level2}
                onChange={(e) => handleHierarchyChange('customer', 'level2', e.target.value)}
              >
                <option value="">All Segments</option>
                {customerHierarchies.level2.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="customerLevel3">Customer Type (Level 3)</label>
              <select
                id="customerLevel3"
                value={formData.customerHierarchy.level3}
                onChange={(e) => handleHierarchyChange('customer', 'level3', e.target.value)}
              >
                <option value="">All Types</option>
                {customerHierarchies.level3.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
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
