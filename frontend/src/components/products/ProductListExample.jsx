import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Chip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../services/api/apiClient';
import PageLayout from '../layout/PageLayout';
import { EmptyState, ErrorState, SkeletonList } from '../states';

/**
 * ProductListExample - Demonstration of PageLayout usage with standard states
 * 
 * This is an example showing how to use the new PageLayout component
 * with EmptyState, ErrorState, and SkeletonList for consistent UX.
 * 
 * Key improvements:
 * - Consistent page structure using PageLayout
 * - Standard loading state with SkeletonList
 * - Standard empty state with EmptyState
 * - Standard error state with ErrorState
 * - Proper breadcrumbs and navigation
 * - Action buttons in toolbar
 */
const ProductListExample = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/products');
      const data = response.data.data || response.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/products/new');
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  if (loading) {
    return (
      <PageLayout
        title="Products"
        subtitle="Manage your product catalog"
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Products' }
        ]}
      >
        <SkeletonList rows={8} variant="table" />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="Products"
        subtitle="Manage your product catalog"
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Products' }
        ]}
      >
        <ErrorState
          title="Failed to load products"
          message="Unable to load products. Please try again."
          error={error}
          onRetry={loadProducts}
          onGoHome={() => navigate('/dashboard')}
          showGoHome
        />
      </PageLayout>
    );
  }

  if (!products || products.length === 0) {
    return (
      <PageLayout
        title="Products"
        subtitle="Manage your product catalog"
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Products' }
        ]}
        toolbar={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Add Product
          </Button>
        }
      >
        <EmptyState
          title="No products yet"
          description="Get started by creating your first product. Products are the foundation of your trade promotions and budgets."
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Create Product
            </Button>
          }
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Products"
      subtitle={`${products.length} products in your catalog`}
      breadcrumbs={[
        { label: 'Home', path: '/dashboard' },
        { label: 'Products' }
      ]}
      toolbar={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Add Product
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {products.map((product) => (
          <Box
            key={product._id}
            onClick={() => handleProductClick(product._id)}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              bgcolor: 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: 2
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
              <Box>
                <Box sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>
                  {product.name}
                </Box>
                <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                  SKU: {product.sku || 'N/A'}
                </Box>
              </Box>
              <Chip
                label={product.status || 'active'}
                color={product.status === 'active' ? 'success' : 'default'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            {product.description && (
              <Box sx={{ color: 'text.secondary', fontSize: '0.875rem', mt: 1 }}>
                {product.description}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </PageLayout>
  );
};

export default ProductListExample;
