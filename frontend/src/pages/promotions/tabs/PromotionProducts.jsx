import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../../services/api/apiClient';

const PromotionProducts = ({ promotionId, promotion, onUpdate }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [promotionId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/promotions/${promotionId}/products`);
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Remove this product from the promotion?')) return;
    
    try {
      await apiClient.delete(`/promotions/${promotionId}/products/${productId}`);
      toast.success('Product removed');
      loadProducts();
      onUpdate();
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('Failed to remove product');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Products in Promotion</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          disabled={promotion.status !== 'draft'}
        >
          Add Products
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Regular Price</TableCell>
              <TableCell>Promotional Price</TableCell>
              <TableCell>Expected Lift</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No products added yet
                </TableCell>
              </TableRow>
            ) : (
              products.map((item) => (
                <TableRow key={item.id || item._id || item.product?.id || item.product?._id}>
                  <TableCell>{item.product?.name || 'N/A'}</TableCell>
                  <TableCell>{item.product?.sku || 'N/A'}</TableCell>
                  <TableCell>R {item.regularPrice?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>R {item.promotionalPrice?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{item.expectedLift || 0}%</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      disabled={promotion.status !== 'draft'}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(item.product?.id || item.product?._id || item.product)}
                      disabled={promotion.status !== 'draft'}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PromotionProducts;
