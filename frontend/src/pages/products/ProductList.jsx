import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: 'all' });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category !== 'all') params.append('category', filters.category);

      const response = await axios.get(`${API_BASE_URL}/products?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        const normalizedProducts = response.data.data.map(product => ({
          ...product,
          category: typeof product.category === 'object' ? (product.category?.primary || 'Uncategorized') : product.category,
          brand: typeof product.brand === 'object' ? (product.brand?.name || 'Unknown') : product.brand
        }));
        setProducts(normalizedProducts);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Products
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/products/new')}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            New Product
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Filters */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2.5, 
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="Beverages">Beverages</MenuItem>
                <MenuItem value="Snacks">Snacks</MenuItem>
                <MenuItem value="Dairy">Dairy</MenuItem>
                <MenuItem value="Bakery">Bakery</MenuItem>
                <MenuItem value="Frozen">Frozen</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Paper 
          elevation={0}
          sx={{ 
            p: 8,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" color="text.secondary" mb={2}>
            No products found
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/products/new')}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Add Product
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {products.map(product => (
            <Grid item xs={12} sm={6} md={4} key={product._id}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                    borderColor: 'primary.main'
                  }
                }}
                onClick={() => navigate(`/products/${product._id}`)}
              >
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Box 
                    sx={{ 
                      p: 1, 
                      borderRadius: 2, 
                      bgcolor: 'success.light',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <InventoryIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    {product.name || product.productName}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      SKU
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {product.sku || product.productCode}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      Category
                    </Typography>
                    <Chip 
                      label={product.category} 
                      size="small" 
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                    />
                  </Box>

                  {product.brand && (
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        Brand
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {product.brand}
                      </Typography>
                    </Box>
                  )}

                  <Box 
                    sx={{ 
                      p: 1.5,
                      bgcolor: 'success.light',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: product.inventory ? 1.5 : 0
                    }}
                  >
                    <Typography variant="caption" fontWeight={600} color="success.main">
                      Price
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color="success.main">
                      {formatCurrency(product.unitPrice)}
                    </Typography>
                  </Box>

                  {product.inventory && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Stock
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {product.inventory.availableQuantity || 0} units
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ProductList;
