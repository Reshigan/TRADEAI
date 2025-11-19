import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const PerformanceMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    avgResponseTime: 0,
    requestsPerMinute: 0,
    errorRate: 0,
    uptime: 0,
    slowestEndpoints: [],
    recentErrors: []
  });

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.get(`${API_BASE_URL}/admin/performance/metrics`, { headers }).catch(() => ({ data: { data: {} } }));

      setMetrics(response.data.data || {
        avgResponseTime: 0,
        requestsPerMinute: 0,
        errorRate: 0,
        uptime: 0,
        slowestEndpoints: [],
        recentErrors: []
      });
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getResponseTimeColor = (time) => {
    if (time < 200) return 'success.main';
    if (time < 500) return 'warning.main';
    return 'error.main';
  };

  const getErrorRateColor = (rate) => {
    if (rate < 1) return 'success.main';
    if (rate < 5) return 'warning.main';
    return 'error.main';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        ⚡ Performance Metrics
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        System performance and monitoring
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Avg Response Time
            </Typography>
            <Typography variant="h4" fontWeight={700} color={getResponseTimeColor(metrics.avgResponseTime)}>
              {metrics.avgResponseTime}ms
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Requests/Min
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {metrics.requestsPerMinute.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Error Rate
            </Typography>
            <Typography variant="h4" fontWeight={700} color={getErrorRateColor(metrics.errorRate)}>
              {metrics.errorRate.toFixed(2)}%
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              System Uptime
            </Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">
              {formatUptime(metrics.uptime)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight={600}>
                🐌 Slowest Endpoints
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={fetchMetrics}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Refresh
              </Button>
            </Box>
            
            <Box>
              {metrics.slowestEndpoints.map((endpoint, index) => (
                <Box key={index} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" fontFamily="monospace">
                      {endpoint.method} {endpoint.path}
                    </Typography>
                    <Chip 
                      label={`${endpoint.avgTime}ms`}
                      size="small"
                      color={endpoint.avgTime > 1000 ? 'error' : endpoint.avgTime > 500 ? 'warning' : 'success'}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Requests: {endpoint.count} | Max: {endpoint.maxTime}ms
                  </Typography>
                </Box>
              ))}
              {metrics.slowestEndpoints.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  No data available
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              ❌ Recent Errors
            </Typography>
            
            <Box>
              {metrics.recentErrors.map((error, index) => (
                <Box key={index} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight={600} color="error.main" mb={0.5}>
                    {error.statusCode} - {error.message}
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" color="text.secondary" mb={0.5}>
                    {error.method} {error.path}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(error.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              ))}
              {metrics.recentErrors.length === 0 && (
                <Box textAlign="center" py={3}>
                  <Typography variant="body1" color="success.main">
                    ✅ No recent errors
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceMetrics;
