import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Grid, Paper, CircularProgress,
  InputAdornment, alpha,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Business as BusinessIcon,
  People as PeopleIcon, TrendingUp as ActiveIcon, LocationOn as LocationIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import { formatLabel } from '../../utils/formatters';

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
      const params = search ? `?search=${search}` : '';
      const response = await api.get(`/customers${params}`);
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

  const stats = useMemo(() => {
    const total = customers.length;
    const withCredit = customers.filter(c => c.creditLimit > 0).length;
    const regions = [...new Set(customers.map(c => c.region || c.location?.state).filter(Boolean))].length;
    return { total, withCredit, regions };
  }, [customers]);

  const summaryCards = [
    { label: 'Total Customers', value: stats.total, icon: <PeopleIcon />, color: '#7C3AED', bg: alpha('#7C3AED', 0.08) },
    { label: 'With Credit', value: stats.withCredit, icon: <ActiveIcon />, color: '#059669', bg: alpha('#059669', 0.08) },
    { label: 'Regions', value: stats.regions, icon: <LocationIcon />, color: '#2563EB', bg: alpha('#2563EB', 0.08) },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#7C3AED' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Customers</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>{customers.length} customer{customers.length !== 1 ? 's' : ''}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/customers/new')}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3, py: 1.2, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
          New Customer
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: 22 } })}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
                <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
        <TextField fullWidth placeholder="Search customers by name, code, or location..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }} />
      </Paper>

      {customers.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, borderRadius: '16px', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" mb={2}>No customers found</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/customers/new')}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Add Customer
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {customers.map(customer => (
            <Grid item xs={12} sm={6} md={4} key={customer.id || customer._id}>
              <Paper elevation={0}
                sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                  transition: 'all 0.2s', height: '100%', display: 'flex', flexDirection: 'column',
                  '&:hover': { boxShadow: '0 4px 20px rgba(124,58,237,0.12)', borderColor: '#7C3AED', transform: 'translateY(-2px)' } }}
                onClick={() => navigate(`/customers/${customer.id || customer._id}`)}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha('#7C3AED', 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BusinessIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>{customer.name || customer.customerName}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">Code</Typography>
                    <Typography variant="caption" fontWeight={600}>{customer.code || customer.customerCode}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">Type</Typography>
                    <Typography variant="caption" fontWeight={600}>{formatLabel(customer.customerType)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="caption" color="text.secondary">Location</Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {customer.city || customer.location?.city}{(customer.city || customer.location?.city) && (customer.region || customer.location?.state) ? ', ' : ''}{customer.region || customer.location?.state}
                    </Typography>
                  </Box>
                  {customer.creditLimit > 0 && (
                    <Box sx={{ p: 1.5, bgcolor: alpha('#7C3AED', 0.06), borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" fontWeight={600} color="#7C3AED">Credit Limit</Typography>
                      <Typography variant="caption" fontWeight={700} color="#7C3AED">{formatCurrency(customer.creditLimit)}</Typography>
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
