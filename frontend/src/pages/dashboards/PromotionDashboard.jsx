import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const PromotionDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activePromotions: 0,
    avgROI: 0,
    totalSpend: 0,
    totalRevenue: 0,
    topPromotions: [],
    promotionsByType: [],
    recentPromotions: []
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.get(`${API_BASE_URL}/analytics/promotion-metrics`, { headers }).catch(() => null);

      if (response?.data) {
        setMetrics(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(amount || 0);

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
          Promotion Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Promotion performance and ROI analysis
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
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
              Active Promotions
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1.5 }}>
              {metrics.activePromotions}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
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
              Average ROI
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1.5 }}>
              {metrics.avgROI.toFixed(2)}x
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
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
              Total Spend
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1.5 }}>
              {formatCurrency(metrics.totalSpend)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
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
              Total Revenue
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1.5 }}>
              {formatCurrency(metrics.totalRevenue)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Data Sections */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Top Performing Promotions
            </Typography>
            {metrics.topPromotions.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {metrics.topPromotions.map((promo, index) => (
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
                        #{index + 1} {promo.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ROI: {promo.roi}x
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color="success.main">
                      {formatCurrency(promo.revenue)}
                    </Typography>
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

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Promotions by Type
            </Typography>
            {metrics.promotionsByType.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={2}>
                {metrics.promotionsByType.map((item, index) => (
                  <Box key={index}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">{item.type}</Typography>
                      <Typography variant="body2" fontWeight={600}>{item.count}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(item.count / metrics.activePromotions * 100)}
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
      </Grid>
    </Box>
  );
};

export default PromotionDashboard;
