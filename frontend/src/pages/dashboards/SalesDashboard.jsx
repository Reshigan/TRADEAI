import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import api from '../../services/api';


const SalesDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    salesGrowth: 0,
    topTerritory: '',
    avgDealSize: 0,
    salesByTeam: [],
    salesByProduct: [],
    salesByChannel: []
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/analytics/sales-metrics').catch(() => null);

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
          Sales Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sales team performance and territory analysis
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={4}>
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
              Total Sales
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ my: 1.5 }}>
              {formatCurrency(metrics.totalSales)}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <TrendingUpIcon fontSize="small" />
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {metrics.salesGrowth}% growth
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
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
              Top Territory
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1.5 }}>
              {metrics.topTerritory || 'N/A'}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
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
              Avg Deal Size
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1.5 }}>
              {formatCurrency(metrics.avgDealSize)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Data Sections */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Sales by Team
            </Typography>
            {metrics.salesByTeam.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {metrics.salesByTeam.map((item, index) => (
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
                    <Typography variant="body2">{item.team}</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(item.amount)}
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

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Sales by Product
            </Typography>
            {metrics.salesByProduct.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {metrics.salesByProduct.map((item, index) => (
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
                    <Typography variant="body2">{item.product}</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(item.amount)}
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

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Sales by Channel
            </Typography>
            {metrics.salesByChannel.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {metrics.salesByChannel.map((item, index) => (
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
                    <Typography variant="body2">{item.channel}</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {formatCurrency(item.amount)}
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
      </Grid>
    </Box>
  );
};

export default SalesDashboard;
