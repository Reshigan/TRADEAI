import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  MenuItem,
  TextField,
  CircularProgress,
  Avatar
} from '@mui/material';
import {
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://tradeai.gonxt.tech/api';

const TopCustomers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('revenue');

  useEffect(() => {
    fetchCustomers();
  }, [limit, sortBy]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: limit.toString(), sortBy });

      const response = await axios.get(`${API_BASE_URL}/sales-transactions/top-customers?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);

  const getTotalRevenue = () => customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
  const getTotalTransactions = () => customers.reduce((sum, c) => sum + (c.transactionCount || 0), 0);

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
        👥 Top Customers
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Customer ranking by revenue and transactions
      </Typography>

      <Box display="flex" gap={2} mb={4} flexWrap="wrap">
        <TextField
          select
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value))}
          sx={{ minWidth: 120 }}
          size="small"
        >
          <MenuItem value={5}>Top 5</MenuItem>
          <MenuItem value={10}>Top 10</MenuItem>
          <MenuItem value={20}>Top 20</MenuItem>
          <MenuItem value={50}>Top 50</MenuItem>
          <MenuItem value={100}>Top 100</MenuItem>
        </TextField>

        <TextField
          select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          sx={{ minWidth: 180 }}
          size="small"
        >
          <MenuItem value="revenue">Sort by Revenue</MenuItem>
          <MenuItem value="transactions">Sort by Transactions</MenuItem>
          <MenuItem value="quantity">Sort by Quantity</MenuItem>
          <MenuItem value="avgValue">Sort by Avg Value</MenuItem>
        </TextField>

        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchCustomers}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Total Customers
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {customers.length}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Combined Revenue
            </Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">
              {formatCurrency(getTotalRevenue())}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Combined Transactions
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {getTotalTransactions().toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Customer Rankings
        </Typography>
        
        <Box>
          {customers.map((customer, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 3,
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'grey.50' }
              }}
              onClick={() => navigate(`/customers/${customer.customer?._id}`)}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: index < 3 ? 'warning.main' : 'primary.main',
                      fontWeight: 700,
                      fontSize: '1.125rem'
                    }}
                  >
                    #{index + 1}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {customer.customer?.name || customer.customerName || 'Unknown Customer'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {customer.transactionCount} transactions | {customer.totalQuantity} units
                    </Typography>
                  </Box>
                </Box>
                
                <Box textAlign="right">
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {formatCurrency(customer.totalRevenue)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg: {formatCurrency(customer.avgTransactionValue)}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">First Purchase</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {customer.firstPurchase ? new Date(customer.firstPurchase).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">Last Purchase</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">Avg Order Size</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {(customer.totalQuantity / customer.transactionCount).toFixed(1)} units
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>

        {customers.length === 0 && (
          <Box textAlign="center" py={5}>
            <Typography variant="body2" color="text.secondary">
              No customer data available
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TopCustomers;
