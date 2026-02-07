import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  MenuItem,
  TextField,
  CircularProgress,
  Avatar,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const TopProducts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchProducts();
  }, [limit]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/sales-transactions/top-products?limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);

  const getTotalRevenue = () => products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
  const getTotalQuantity = () => products.reduce((sum, p) => sum + (p.totalQuantity || 0), 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        📦 Top Products
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Product ranking by revenue and sales volume
      </Typography>

      <Box display="flex" gap={2} mb={4}>
        <TextField
          select
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value))}
          sx={{ minWidth: 120 }}
          size="small"
        >
          <MenuItem value={5}>Top 5</MenuItem>
          <MenuItem value={10}>Top 10</MenuItem>
          <MenuItem value={20}>Top 20</MenuItem>
          <MenuItem value={50}>Top 50</MenuItem>
        </TextField>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchProducts}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Total Products
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {products.length}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Combined Revenue
            </Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">
              {formatCurrency(getTotalRevenue())}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Units Sold
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {getTotalQuantity().toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {products.map((product, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={() => navigate(`/products/${product.product?.id || product.product?._id || product.id || product._id}`)}
            >
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar
                  sx={{
                    width: 50,
                    height: 50,
                    bgcolor: index < 3 ? 'warning.main' : 'primary.main',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    borderRadius: 2
                  }}
                >
                  #{index + 1}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight={600}>
                    {product.product?.name || product.productName || 'Unknown Product'}
                  </Typography>
                  {product.product?.sku && (
                    <Typography variant="caption" color="text.secondary">
                      SKU: {product.product.sku}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Total Revenue</Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  {formatCurrency(product.totalRevenue)}
                </Typography>
              </Paper>

              <Grid container spacing={1} mb={2}>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">Units Sold</Typography>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {product.totalQuantity.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">Avg Price</Typography>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {formatCurrency(product.avgPrice)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">Min Price</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(product.minPrice)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">Max Price</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(product.maxPrice)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {product.product?.category && (
                <Box mt={2}>
                  <Chip label={product.product.category} size="small" sx={{ width: '100%' }} />
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {products.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h1" mb={2}>📦</Typography>
          <Typography variant="h6">No product data available</Typography>
        </Box>
      )}
    </Box>
  );
};

export default TopProducts;
