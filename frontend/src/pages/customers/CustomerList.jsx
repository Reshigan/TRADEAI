import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = search ? `?search=${search}` : '';
      const response = await axios.get(`${API_BASE_URL}/customers${params}`, {
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
            Customers
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/customers/new')}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            New Customer
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {customers.length} customer{customers.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Search */}
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
        <TextField
          fullWidth
          placeholder="Search customers by name, code, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
      </Paper>

      {/* Customers Grid */}
      {customers.length === 0 ? (
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
            No customers found
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/customers/new')}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Add Customer
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {customers.map(customer => (
            <Grid item xs={12} sm={6} md={4} key={customer._id}>
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
                onClick={() => navigate(`/customers/${customer._id}`)}
              >
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Box 
                    sx={{ 
                      p: 1, 
                      borderRadius: 2, 
                      bgcolor: 'primary.lighter',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <BusinessIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    {customer.name}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      Code
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {customer.code}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {customer.customerType || customer.type || 'N/A'}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {customer.addresses?.[0]?.city || 'N/A'}, {customer.addresses?.[0]?.state || ''}
                    </Typography>
                  </Box>

                  {customer.creditLimit && (
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
                        Credit Limit
                      </Typography>
                      <Typography variant="caption" fontWeight={700} color="primary.main">
                        {formatCurrency(customer.creditLimit)}
                      </Typography>
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

export default CustomerList;
