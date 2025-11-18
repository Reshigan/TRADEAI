import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';

const ProductOverview = ({ product }) => {
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Product Information</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">SKU</Typography>
            <Typography variant="body1">{product.sku || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Brand</Typography>
            <Typography variant="body1">{product.brand || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Category</Typography>
            <Typography variant="body1">{product.category || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Typography variant="body1">{product.status || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Description</Typography>
            <Typography variant="body1">{product.description || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Pricing Information</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Cost Price</Typography>
            <Typography variant="h6">R {product.costPrice?.toLocaleString() || '0'}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Selling Price</Typography>
            <Typography variant="h6">R {product.sellingPrice?.toLocaleString() || '0'}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">Margin</Typography>
            <Typography variant="h6">
              {product.costPrice && product.sellingPrice ? 
                (((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(1) : '0'}%
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProductOverview;
