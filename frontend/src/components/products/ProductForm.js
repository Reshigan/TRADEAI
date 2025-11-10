import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { FormDialog } from '../common';

// Get currency symbol from user's company settings
const getCurrencySymbol = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.company && user.company.currency) {
        const currencyMap = {
          'USD': '$', 'EUR': '€', 'GBP': '£', 'ZAR': 'R', 'AUD': 'A$',
          'CAD': 'C$', 'JPY': '¥', 'CNY': '¥', 'INR': '₹'
        };
        return currencyMap[user.company.currency] || 'R';
      }
    }
  } catch (error) {
    console.warn('Error getting currency symbol:', error);
  }
  return 'R'; // Fallback to ZAR
};

const ProductForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  product = null
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    status: 'active',
    price: '',
    cost: '',
    inventory: '',
    description: '',
    specifications: '',
    is_taxable: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // If editing an existing product, populate the form
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category,
        status: product.status,
        price: product.price,
        cost: product.cost,
        inventory: product.inventory,
        description: product.description || '',
        specifications: product.specifications || '',
        is_taxable: product.is_taxable !== undefined ? product.is_taxable : true
      });
    }
  }, [product]);

  // Handle form field changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error for the field
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  // Handle switch changes
  const handleSwitchChange = (event) => {
    const { name, checked } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: checked
    }));
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.sku) {
      newErrors.sku = 'SKU is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be a positive number';
    }
    
    if (!formData.cost) {
      newErrors.cost = 'Cost is required';
    } else if (isNaN(formData.cost) || parseFloat(formData.cost) < 0) {
      newErrors.cost = 'Cost must be a positive number';
    }
    
    if (!formData.inventory) {
      newErrors.inventory = 'Inventory is required';
    } else if (isNaN(formData.inventory) || parseInt(formData.inventory) < 0) {
      newErrors.inventory = 'Inventory must be a non-negative integer';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      setLoading(true);
      
      // Format data for API
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        inventory: parseInt(formData.inventory)
      };
      
      // Submit form
      onSubmit(productData);
      setLoading(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={product ? 'Edit Product' : 'Add Product'}
      submitText={product ? 'Update' : 'Create'}
      loading={loading}
      maxWidth="md"
    >
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          Basic Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="SKU"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              error={!!errors.sku}
              helperText={errors.sku}
              required
              placeholder="e.g., PRD-001"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              error={!!errors.category}
              helperText={errors.category}
              required
              select
            >
              <MenuItem value="Breakfast">Breakfast</MenuItem>
              <MenuItem value="Snacks">Snacks</MenuItem>
              <MenuItem value="Beverages">Beverages</MenuItem>
              <MenuItem value="Dairy">Dairy</MenuItem>
              <MenuItem value="Frozen">Frozen</MenuItem>
              <MenuItem value="Canned Goods">Canned Goods</MenuItem>
              <MenuItem value="Baking">Baking</MenuItem>
              <MenuItem value="Condiments">Condiments</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Pricing & Inventory
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              error={!!errors.price}
              helperText={errors.price}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">{getCurrencySymbol()}</InputAdornment>,
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Cost"
              name="cost"
              type="number"
              value={formData.cost}
              onChange={handleChange}
              error={!!errors.cost}
              helperText={errors.cost}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">{getCurrencySymbol()}</InputAdornment>,
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Inventory"
              name="inventory"
              type="number"
              value={formData.inventory}
              onChange={handleChange}
              error={!!errors.inventory}
              helperText={errors.inventory}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_taxable}
                  onChange={handleSwitchChange}
                  name="is_taxable"
                  color="primary"
                />
              }
              label="Taxable Product"
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Product Details
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Specifications"
              name="specifications"
              value={formData.specifications}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Enter product specifications, ingredients, or other details"
            />
          </Grid>
        </Grid>
        
        {product && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Product Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(product.created_at).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated: {new Date(product.updated_at).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </FormDialog>
  );
};

export default ProductForm;