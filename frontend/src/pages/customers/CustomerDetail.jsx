import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Alert
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AccountBalance as TradeSpendIcon
} from '@mui/icons-material';
import api from '../../services/api';
import CustomerAIInsights from '../../components/ai/customers/CustomerAIInsights';
import { DetailPageSkeleton } from '../../components/common/SkeletonLoader';
import { useToast } from '../../components/common/ToastNotification';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    analytics.trackPageView('customer_detail', { customerId: id });
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startTime = Date.now();
      const response = await api.get(`/customers/${id}`);
      setData(response.data.data || response.data);
      setError(null);
      
      analytics.trackEvent('customer_detail_loaded', {
        customerId: id,
        loadTime: Date.now() - startTime
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load customer details';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    analytics.trackEvent('customer_edit_clicked', { customerId: id });
    navigate(`/customers/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`);
        analytics.trackEvent('customer_deleted', { customerId: id });
        toast.success('Customer deleted successfully!');
        navigate('/customers');
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to delete customer';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    }
  };

  if (loading) return <DetailPageSkeleton />;
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Customer not found</Alert>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary" mb={1}>
              {data.name}
            </Typography>
            {data.status && (
              <Chip 
                label={formatLabel(data.status)} 
                color={getStatusColor(data.status)}
                size="small"
              />
            )}
          </Box>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/customers')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              startIcon={<ViewIcon />}
              onClick={() => navigate(`/promotions?customerId=${id}`)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Promotions
            </Button>
            <Button
              variant="outlined"
              startIcon={<TradeSpendIcon />}
              onClick={() => navigate(`/trade-spends?customerId=${id}`)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Trade Spends
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <CustomerAIInsights 
          customer={data}
          onApplySegmentation={(segmentData) => {
            console.log('Apply segmentation:', segmentData);
          }}
          onApplyNextBestAction={(actionData) => {
            console.log('Apply next best action:', actionData);
          }}
          onApplyRecommendations={(recommendations) => {
            console.log('Apply recommendations:', recommendations);
          }}
        />
      </Box>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Information
        </Typography>
        <Grid container spacing={3}>
          {Object.keys(data).filter(key => !['_id', '__v', 'createdAt', 'updatedAt'].includes(key)).map(key => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Typography variant="body2" color="text.secondary" mb={0.5}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {typeof data[key] === 'object' ? JSON.stringify(data[key]) : (data[key] || 'N/A')}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Metadata
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Created At
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Last Updated
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default CustomerDetail;
