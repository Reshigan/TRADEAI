import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { formatLabel } from '../../utils/formatters';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get(`/campaigns/${id}`);
      setCampaign(response.data.data || response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/campaigns/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/campaigns/${id}`);
        navigate('/campaigns');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete campaign');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  if (!campaign) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Campaign not found</Alert>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'planned': return 'info';
      case 'paused': return 'warning';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary" mb={1}>
              {campaign.name}
            </Typography>
            {campaign.status && (
              <Chip 
                label={formatLabel(campaign.status)} 
                color={getStatusColor(campaign.status)}
                size="small"
              />
            )}
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/campaigns')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              startIcon={<ViewIcon />}
              onClick={() => navigate(`/promotions?campaignId=${id}`)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Promotions
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
          Basic Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Campaign Name
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {campaign.name}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Type
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {campaign.type || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Status
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {campaign.status}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Timeline
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Start Date
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              End Date
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Duration
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {campaign.startDate && campaign.endDate
                ? `${Math.ceil((new Date(campaign.endDate) - new Date(campaign.startDate)) / (1000 * 60 * 60 * 24))} days`
                : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Budget
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Total Budget
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              R {campaign.budget ? campaign.budget.toLocaleString() : '0'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {campaign.description && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={3}>
            Description
          </Typography>
          <Typography variant="body1">
            {campaign.description}
          </Typography>
        </Paper>
      )}

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
              {campaign.createdAt ? new Date(campaign.createdAt).toLocaleString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Last Updated
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {campaign.updatedAt ? new Date(campaign.updatedAt).toLocaleString() : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default CampaignDetail;
