import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  MenuItem,
  TextField,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const RevenueByPeriod = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState('month');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchData();
  }, [period, dateRange]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ period });
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await axios.get(`${API_BASE_URL}/sales-transactions/revenue-by-period?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);

  const getTotalRevenue = () => data.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
  const getTotalTransactions = () => data.reduce((sum, item) => sum + (item.transactionCount || 0), 0);
  const getAvgTransaction = () => {
    const total = getTotalTransactions();
    return total > 0 ? getTotalRevenue() / total : 0;
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
        💰 Revenue by Period
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Time-series revenue analysis
      </Typography>

      <Box display="flex" gap={2} mb={4} flexWrap="wrap">
        <TextField
          select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          sx={{ minWidth: 150 }}
          size="small"
        >
          <MenuItem value="day">Daily</MenuItem>
          <MenuItem value="week">Weekly</MenuItem>
          <MenuItem value="month">Monthly</MenuItem>
          <MenuItem value="quarter">Quarterly</MenuItem>
          <MenuItem value="year">Yearly</MenuItem>
        </TextField>

        <TextField
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          size="small"
          label="Start Date"
        />

        <TextField
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          size="small"
          label="End Date"
        />

        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Apply
        </Button>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Total Revenue
            </Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">
              {formatCurrency(getTotalRevenue())}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Total Transactions
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {getTotalTransactions().toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Avg Transaction
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {formatCurrency(getAvgTransaction())}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Revenue Trend
        </Typography>
        
        <Box>
          {data.map((item, index) => {
            const maxRevenue = Math.max(...data.map(d => d.totalRevenue));
            const barWidth = (item.totalRevenue / maxRevenue * 100);
            
            return (
              <Box key={index} sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" mb={1.5}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {period === 'month' && `${item._id?.year}-${String(item._id?.month).padStart(2, '0')}`}
                      {period === 'quarter' && `Q${item._id?.quarter} ${item._id?.year}`}
                      {period === 'year' && item._id?.year}
                      {period === 'week' && `Week ${item._id?.week} ${item._id?.year}`}
                      {period === 'day' && `${item._id?.year}-${String(item._id?.month).padStart(2, '0')}-${String(item._id?.day).padStart(2, '0')}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.transactionCount} transactions | {item.totalQuantity} units
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="h6" fontWeight={600}>
                      {formatCurrency(item.totalRevenue)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Avg: {formatCurrency(item.avgTransactionValue)}
                    </Typography>
                  </Box>
                </Box>
                
                <LinearProgress 
                  variant="determinate" 
                  value={barWidth} 
                  sx={{ height: 10, borderRadius: 1, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: 'success.main' } }}
                />
              </Box>
            );
          })}
        </Box>

        {data.length === 0 && (
          <Box textAlign="center" py={5}>
            <Typography variant="body2" color="text.secondary">
              No revenue data available for the selected period
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default RevenueByPeriod;
