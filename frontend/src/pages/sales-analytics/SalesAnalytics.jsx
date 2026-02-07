import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress
} from '@mui/material';
import api from '../../services/api';


const SalesAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    revenueByPeriod: [],
    topCustomers: [],
    topProducts: [],
    summary: null
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [revenueRes, customersRes, productsRes] = await Promise.all([
        api.get('/sales-transactions/revenue-by-period'),
        api.get('/sales-transactions/top-customers'),
        api.get('/sales-transactions/top-products')
      ]);

      setData({
        revenueByPeriod: revenueRes.data.data || [],
        topCustomers: customersRes.data.data || [],
        topProducts: productsRes.data.data || []
      });
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
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
      <Typography variant="h4" fontWeight={700} mb={4}>
        📊 Sales Analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              💰 Revenue by Period
            </Typography>
            {data.revenueByPeriod.length > 0 ? (
              <Box>
                {data.revenueByPeriod.map((item, index) => (
                  <Box key={index} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">{item._id?.year}/{item._id?.month}</Typography>
                      <Typography variant="body2" fontWeight={600}>{formatCurrency(item.totalRevenue)}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {item.transactionCount} transactions | {item.totalQuantity} units
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No revenue data available
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              👥 Top Customers
            </Typography>
            {data.topCustomers.length > 0 ? (
              <Box>
                {data.topCustomers.slice(0, 10).map((item, index) => (
                  <Box key={index} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          #{index + 1} {item.customer?.name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.transactionCount} transactions
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(item.totalRevenue)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg: {formatCurrency(item.avgTransactionValue)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No customer data available
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              📦 Top Products
            </Typography>
            {data.topProducts.length > 0 ? (
              <Box>
                {data.topProducts.slice(0, 10).map((item, index) => (
                  <Box key={index} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          #{index + 1} {item.product?.name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.totalQuantity} units sold
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(item.totalRevenue)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg: {formatCurrency(item.avgPrice)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No product data available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesAnalytics;
