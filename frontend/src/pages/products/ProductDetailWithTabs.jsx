import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Tabs, Tab, Button, Paper, Chip, Skeleton } from '@mui/material';
import { ArrowBack as BackIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../services/api/apiClient';
import analytics from '../../utils/analytics';
import { usePageVariants } from '../../hooks/usePageVariants';
import ProcessShell from '../../components/ProcessShell';

import ProductOverview from './tabs/ProductOverview';
import ProductPromotions from './tabs/ProductPromotions';
import ProductCampaigns from './tabs/ProductCampaigns';
import ProductTradingTerms from './tabs/ProductTradingTerms';
import ProductSalesHistory from './tabs/ProductSalesHistory';

const ProductDetailWithTabs = () => {
  const { id, tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab || 'overview');

  const pageVariant = usePageVariants('productDetail');
  const tabs = pageVariant?.tabs || [
    { id: 'overview', label: 'Overview', path: 'overview' },
    { id: 'promotions', label: 'Promotions', path: 'promotions' },
    { id: 'campaigns', label: 'Campaigns', path: 'campaigns' },
    { id: 'trading-terms', label: 'Trading Terms', path: 'trading-terms' },
    { id: 'sales-history', label: 'Sales History', path: 'sales-history' }
  ];

  useEffect(() => {
    loadProduct();
    analytics.trackPageView('product_detail', { productId: id, tab: activeTab });
  }, [id]);

  useEffect(() => {
    setActiveTab(tab || 'overview');
  }, [tab]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/products/${id}`);
      setProduct(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/products/${id}/${newValue}`);
    analytics.trackEvent('product_tab_changed', { productId: id, tab: newValue });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={400} />
        </Box>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">Product not found</Typography>
      </Container>
    );
  }

  return (
    <ProcessShell module="product" entityId={id} entity={product}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button startIcon={<BackIcon />} onClick={() => navigate('/products')}>Back</Button>
            <Box>
              <Typography variant="h4">{product.name}</Typography>
              <Typography variant="body2" color="text.secondary">{product.sku}</Typography>
            </Box>
            <Chip label={product.status} color={product.status === 'active' ? 'success' : 'default'} size="small" />
          </Box>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/products/${id}/edit`)}>Edit</Button>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            {tabs.map((tab) => (
              <Tab key={tab.id} value={tab.path} label={tab.label} />
            ))}
          </Tabs>
        </Paper>

        <Box sx={{ mt: 3 }}>
          {activeTab === 'overview' && <ProductOverview product={product} onUpdate={loadProduct} />}
          {activeTab === 'promotions' && <ProductPromotions productId={id} product={product} />}
          {activeTab === 'campaigns' && <ProductCampaigns productId={id} product={product} />}
          {activeTab === 'trading-terms' && <ProductTradingTerms productId={id} product={product} />}
          {activeTab === 'sales-history' && <ProductSalesHistory productId={id} product={product} />}
        </Box>
      </Container>
    </ProcessShell>
  );
};

export default ProductDetailWithTabs;
