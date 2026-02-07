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
  Grid,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { productService } from '../../services/api';

// Static hierarchy options for consistency across the app
const productHierarchyOptions = {
  vendors: ['Unilever', 'Nestle', 'P&G', 'Coca-Cola', 'PepsiCo', 'Kraft Heinz', 'General Mills'],
  categories: ['Beverages', 'Snacks', 'Personal Care', 'Home Care', 'Food', 'Dairy', 'Confectionery'],
  brands: ['Coca-Cola', 'Pepsi', 'Lays', 'Doritos', 'Dove', 'Axe', 'Omo', 'Sunlight', 'Maggi', 'KitKat'],
  subBrands: ['Original', 'Zero Sugar', 'Diet', 'Light', 'Premium', 'Classic', 'Extra', 'Max']
};

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
    description: '',
    // Hierarchy fields
    vendor: '',
    brand: '',
    subBrand: ''
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
      const response = await productService.getById(id);
      const product = response.data || response;
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || '',
        price: product.price || '',
        cost: product.cost || '',
        stock: product.stock || '',
        status: product.status || 'active',
        description: product.description || '',
        // Hierarchy fields
        vendor: product.vendor || '',
        brand: product.brand || '',
        subBrand: product.subBrand || product.sub_brand || ''
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
      
      if (isEditMode) {
        await productService.update(id, payload);
      } else {
        await productService.create(payload);
      }
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
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
            {isEditMode ? 'Edit Product' : 'Create New Product'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => navigate('/products')}
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
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
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
                  required
                  placeholder="Enter product name"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="SKU"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  placeholder="Product SKU"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    label="Category"
                  >
                    <MenuItem value="">Select category</MenuItem>
                    <MenuItem value="beverages">Beverages</MenuItem>
                    <MenuItem value="snacks">Snacks</MenuItem>
                    <MenuItem value="dairy">Dairy</MenuItem>
                    <MenuItem value="bakery">Bakery</MenuItem>
                    <MenuItem value="frozen">Frozen</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="discontinued">Discontinued</MenuItem>
                    <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Pricing & Inventory
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Price (R)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  placeholder="0.00"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Cost (R)"
                  name="cost"
                  type="number"
                  value={formData.cost}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 0.01 }}
                  placeholder="0.00"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Stock Quantity"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                  placeholder="0"
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Description
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={5}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter product description..."
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Product Hierarchy
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Vendor</InputLabel>
                  <Select
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleChange}
                    label="Vendor"
                  >
                    <MenuItem value="">Select Vendor</MenuItem>
                    {productHierarchyOptions.vendors.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Brand</InputLabel>
                  <Select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    label="Brand"
                  >
                    <MenuItem value="">Select Brand</MenuItem>
                    {productHierarchyOptions.brands.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sub Brand</InputLabel>
                  <Select
                    name="subBrand"
                    value={formData.subBrand}
                    onChange={handleChange}
                    label="Sub Brand"
                  >
                    <MenuItem value="">Select Sub Brand</MenuItem>
                    {productHierarchyOptions.subBrands.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => navigate('/products')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
            >
              {saving ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ProductForm;
