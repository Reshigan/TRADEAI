import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Pause as PauseIcon,
  Celebration as CelebrationIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const ActivityDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalActivities: 0,
    activeActivities: 0,
    completedActivities: 0,
    avgROI: 0,
    totalBudget: 0,
    totalSpent: 0,
    activitiesByType: [],
    activitiesByStatus: [],
    performanceMetrics: []
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.get(`${API_BASE_URL}/activities/metrics`, { headers });

      if (response.data.success) {
        setMetrics(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);

  const getPerformanceIcon = (performance) => {
    switch (performance) {
      case 'On Track': return <CheckIcon color="success" />;
      case 'At Risk': return <WarningIcon color="warning" />;
      case 'Delayed': return <ScheduleIcon color="error" />;
      case 'Not Started': return <PauseIcon color="disabled" />;
      case 'Completed': return <CelebrationIcon color="success" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary" mb={1}>
          Activity Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Activity performance tracking and ROI analysis
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
              color: 'white',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Total Activities
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1.5 }}>
              {metrics.totalActivities}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: 'white',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Active Now
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1.5 }}>
              {metrics.activeActivities}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
              color: 'white',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Completed
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1.5 }}>
              {metrics.completedActivities}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Average ROI
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1.5 }}>
              {metrics.avgROI.toFixed(2)}x
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Total Budget
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mt: 1.5 }}>
              {formatCurrency(metrics.totalBudget)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Total Spent
            </Typography>
            <Typography variant="h5" fontWeight={700} color="error.main" sx={{ mt: 1.5 }}>
              {formatCurrency(metrics.totalSpent)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Data Sections */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Activities by Type
            </Typography>
            {metrics.activitiesByType.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={2}>
                {metrics.activitiesByType.map((item, index) => (
                  <Box key={index}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">{item.type}</Typography>
                      <Typography variant="body2" fontWeight={600}>{item.count}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(item.count / metrics.totalActivities * 100)}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 1,
                          bgcolor: 'primary.main'
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No data available
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Performance Metrics
            </Typography>
            {metrics.performanceMetrics.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {metrics.performanceMetrics.map((item, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {item.performance}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.count} activities
                      </Typography>
                    </Box>
                    <Box sx={{ fontSize: 28 }}>
                      {getPerformanceIcon(item.performance)}
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No data available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ActivityDashboard;
