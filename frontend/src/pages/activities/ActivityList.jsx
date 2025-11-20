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
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const ActivityList = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    activityType: 'all',
    performance: 'all'
  });

  useEffect(() => {
    fetchActivities();
  }, [filters]);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.activityType !== 'all') params.append('activityType', filters.activityType);
      if (filters.performance !== 'all') params.append('performance', filters.performance);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_BASE_URL}/activities?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setActivities(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'Planned': 'primary',
      'In Progress': 'warning',
      'Completed': 'success',
      'Cancelled': 'error',
      'On Hold': 'default'
    };
    return statusMap[status] || 'default';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
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
            Activities
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/activities/new')}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            New Activity
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'} found
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
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search activities..."
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
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="Planned">Planned</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
                <MenuItem value="On Hold">On Hold</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.activityType}
                label="Type"
                onChange={(e) => setFilters(prev => ({ ...prev, activityType: e.target.value }))}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="Store Visit">Store Visit</MenuItem>
                <MenuItem value="Merchandising">Merchandising</MenuItem>
                <MenuItem value="Training">Training</MenuItem>
                <MenuItem value="Promotion">Promotion</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 2,
            mb: 3,
            borderRadius: 2,
            bgcolor: 'error.lighter',
            border: '1px solid',
            borderColor: 'error.main'
          }}
        >
          <Typography color="error.main">{error}</Typography>
        </Paper>
      )}

      {/* Activities Grid */}
      {activities.length === 0 ? (
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
            No activities found
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/activities/new')}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Create Activity
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {activities.map(activity => (
            <Grid item xs={12} sm={6} lg={4} key={activity._id}>
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
                onClick={() => navigate(`/activities/${activity._id}`)}
              >
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ flex: 1, mr: 1 }}>
                    {activity.activityName}
                  </Typography>
                  <Chip
                    label={activity.status}
                    color={getStatusColor(activity.status)}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                <Box sx={{ mt: 'auto' }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {activity.activityType}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      Customer
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {activity.customerName}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      Budget
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {formatCurrency(activity.budget?.allocated)}
                    </Typography>
                  </Box>

                  <Box 
                    sx={{ 
                      mt: 2,
                      p: 1.5,
                      bgcolor: 'primary.lighter',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <CalendarIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    <Typography variant="caption" color="primary.main">
                      {formatDate(activity.startDate)} - {formatDate(activity.endDate)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ActivityList;
