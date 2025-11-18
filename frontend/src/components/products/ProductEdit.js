import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Box,
  MenuItem,
  Chip,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';


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
  return 'R';
};

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [product, setProduct] = useState({
    name: '',
    sku: '',
    category: '',
    brand: '',
    status: 'active',
    description: '',
    unitPrice: 0,
    cost: 0,
    uom: 'Each',
    packageSize: '',
    barcode: '',
    manufacturer: '',
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    },
    minimumOrderQuantity: 1,
    leadTime: 0,
    notes: ''
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/products/${id}`);
      setProduct({
        ...response.data,
        dimensions: response.data.dimensions || { length: 0, width: 0, height: 0 }
      });
    } catch (err) {
      setError('Error loading product: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProduct(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDimensionChange = (field, value) => {
    setProduct(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!product.name || !product.sku) {
        setError('Name and SKU are required');
        return;
      }

      setSaving(true);
      setError('');

      await apiClient.put(`/products/${id}`, product);
      
      setSuccess('Product updated successfully!');
      setTimeout(() => {
        navigate(`/products/${id}`);
      }, 1500);
    } catch (err) {
      setError('Error updating product: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Container>
    );
  }

  const categories = [
    'Beverages',
    'Snacks',
    'Dairy',
    'Frozen Foods',
    'Bakery',
    'Meat & Seafood',
    'Produce',
    'Pantry',
    'Personal Care',
    'Household',
    'Other'
  ];

  const uomOptions = ['Each', 'Case', 'Box', 'Pallet', 'Dozen', 'Pack'];
  const statusOptions = ['active', 'inactive', 'discontinued'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            <EditIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Edit Product
          </Typography>
          <Chip 
            label={product.status || 'Active'} 
            color={product.status === 'active' ? 'success' : product.status === 'inactive' ? 'warning' : 'error'}
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Product Name"
              value={product.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="SKU"
              value={product.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Category"
              value={product.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Brand"
              value={product.brand || ''}
              onChange={(e) => handleChange('brand', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Status"
              value={product.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              {statusOptions.map(status => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Manufacturer"
              value={product.manufacturer || ''}
              onChange={(e) => handleChange('manufacturer', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={product.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </Grid>

          {/* Pricing & Inventory */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Pricing & Inventory
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Unit Price"
              value={product.unitPrice || 0}
              onChange={(e) => handleChange('unitPrice', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: getCurrencySymbol()
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Cost"
              value={product.cost || 0}
              onChange={(e) => handleChange('cost', parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: getCurrencySymbol()
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Unit of Measure"
              value={product.uom}
              onChange={(e) => handleChange('uom', e.target.value)}
            >
              {uomOptions.map(uom => (
                <MenuItem key={uom} value={uom}>{uom}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Package Size"
              value={product.packageSize || ''}
              onChange={(e) => handleChange('packageSize', e.target.value)}
              placeholder="e.g., 12 oz, 500ml"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Barcode/UPC"
              value={product.barcode || ''}
              onChange={(e) => handleChange('barcode', e.target.value)}
            />
          </Grid>

          {/* Physical Attributes */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Physical Attributes
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Weight (lbs)"
              value={product.weight || 0}
              onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
              InputProps={{
                endAdornment: 'lbs'
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Order Quantity"
              value={product.minimumOrderQuantity || 1}
              onChange={(e) => handleChange('minimumOrderQuantity', parseInt(e.target.value) || 1)}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Length (in)"
              value={product.dimensions.length}
              onChange={(e) => handleDimensionChange('length', e.target.value)}
              InputProps={{
                endAdornment: 'in'
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Width (in)"
              value={product.dimensions.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              InputProps={{
                endAdornment: 'in'
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Height (in)"
              value={product.dimensions.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              InputProps={{
                endAdornment: 'in'
              }}
            />
          </Grid>

          {/* Operations */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Operations
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Lead Time (days)"
              value={product.leadTime || 0}
              onChange={(e) => handleChange('leadTime', parseInt(e.target.value) || 0)}
              InputProps={{
                endAdornment: 'days'
              }}
            />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Notes
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              value={product.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional notes or comments..."
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => navigate(`/products/${id}`)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProductEdit;
