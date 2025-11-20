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
  Campaign as CampaignIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const CampaignList = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: 'all' });

  useEffect(() => {
    fetchCampaigns();
  }, [filters]);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_BASE_URL}/campaigns?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setCampaigns(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const getStatusColor = (status) => {
    const statusMap = {
      'Active': 'success',
      'Planned': 'primary',
      'Completed': 'default',
      'Paused': 'warning'
    };
    return statusMap[status] || 'default';
  };

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
            Campaigns
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/campaigns/new')}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            New Campaign
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
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
              placeholder="Search campaigns..."
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
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Planned">Planned</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Paused">Paused</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
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
            No campaigns found
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/campaigns/new')}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Create Campaign
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {campaigns.map(campaign => (
            <Grid item xs={12} sm={6} lg={4} key={campaign._id}>
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
                onClick={() => navigate(`/campaigns/${campaign._id}`)}
              >
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1.5} sx={{ flex: 1, mr: 1 }}>
                    <Box 
                      sx={{ 
                        p: 1, 
                        borderRadius: 2, 
                        bgcolor: 'warning.lighter',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <CampaignIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                      {campaign.campaignName}
                    </Typography>
                  </Box>
                  <Chip
                    label={campaign.status}
                    color={getStatusColor(campaign.status)}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2} sx={{ flex: 1 }}>
                  {campaign.description}
                </Typography>

                <Box sx={{ mt: 'auto' }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      Objective
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {campaign.campaignObjective}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      Budget
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {formatCurrency(campaign.budget)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                    </Typography>
                  </Box>

                  {campaign.promotions && campaign.promotions.length > 0 && (
                    <Box 
                      sx={{ 
                        p: 1.5,
                        bgcolor: 'primary.lighter',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography variant="caption" fontWeight={600} color="primary.main">
                        Promotions
                      </Typography>
                      <Chip 
                        label={campaign.promotions.length} 
                        size="small" 
                        color="primary"
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                      />
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

export default CampaignList;
