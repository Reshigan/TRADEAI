import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Alert,
  Container,
  Skeleton
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as TradeSpendIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { formatLabel } from '../../utils/formatters';

const VendorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/vendors/${id}`);
        setData(response.data.data || response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load vendor details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleEdit = () => {
    navigate(`/vendors/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await api.delete(`/vendors/${id}`);
        navigate('/vendors');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete vendor');
      }
    }
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
        <Alert severity="error">Vendor not found</Alert>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'blacklisted': return 'error';
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
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={() => navigate('/vendors')}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Back
              </Button>
              <Button
                variant="outlined"
                startIcon={<TradeSpendIcon />}
                onClick={() => navigate(`/trade-spends?vendorId=${id}`)}
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

        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={3}>
            Information
          </Typography>
          <Grid container spacing={3}>
              {Object.keys(data).filter(key => !['_id', 'id', '__v', 'createdAt', 'updatedAt', 'companyId'].includes(key) && data[key] != null && data[key] !== '').map(key => {
                const val = data[key];
                const isEnum = typeof val === 'string' && /^[a-z_]+$/.test(val);
                return (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    {formatLabel(key)}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {typeof val === 'object' && val !== null ? JSON.stringify(val) : isEnum ? formatLabel(val) : (val || 'N/A')}
                  </Typography>
                </Grid>
                );
              })}
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

export default VendorDetail;
