import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import api from '../../services/api';


const BudgetAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    utilizationTrend: [],
    topSpendingCategories: [],
    departmentAllocation: [],
    forecastVsActual: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/budgets/analytics');

      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);

  const getUtilizationColor = (utilization) => {
    if (utilization > 90) return 'error';
    if (utilization > 75) return 'warning';
    return 'success';
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
        📊 Budget Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Detailed budget analysis and insights
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              📈 Utilization Trend
            </Typography>
            {analytics.utilizationTrend.map((item, index) => (
              <Box key={index} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{item.month}</Typography>
                  <Typography variant="body2" fontWeight={600}>{item.utilization}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={item.utilization} 
                  color={getUtilizationColor(item.utilization)}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            ))}
            {analytics.utilizationTrend.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No trend data available
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              💰 Top Spending Categories
            </Typography>
            {analytics.topSpendingCategories.map((item, index) => (
              <Box key={index} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    #{index + 1} {item.category}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.percentage}% of total
                  </Typography>
                </Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {formatCurrency(item.amount)}
                </Typography>
              </Box>
            ))}
            {analytics.topSpendingCategories.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No spending data available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              🏢 Department Allocation
            </Typography>
            {analytics.departmentAllocation.map((dept, index) => (
              <Box key={index} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{dept.department}</Typography>
                  <Typography variant="body2">{formatCurrency(dept.allocated)}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(dept.spent / dept.allocated) * 100} 
                  sx={{ height: 6, borderRadius: 1, mb: 0.5 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Spent: {formatCurrency(dept.spent)} ({((dept.spent / dept.allocated) * 100).toFixed(1)}%)
                </Typography>
              </Box>
            ))}
            {analytics.departmentAllocation.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No allocation data available
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              🎯 Forecast vs Actual
            </Typography>
            {analytics.forecastVsActual.map((item, index) => (
              <Box key={index} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                  {item.period}
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">Forecast:</Typography>
                  <Typography variant="body2">{formatCurrency(item.forecast)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">Actual:</Typography>
                  <Typography variant="body2">{formatCurrency(item.actual)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Variance:</Typography>
                  <Typography variant="body2" color={item.variance >= 0 ? 'success.main' : 'error.main'}>
                    {item.variance >= 0 ? '+' : ''}{item.variance}%
                  </Typography>
                </Box>
              </Box>
            ))}
            {analytics.forecastVsActual.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No forecast data available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BudgetAnalytics;
