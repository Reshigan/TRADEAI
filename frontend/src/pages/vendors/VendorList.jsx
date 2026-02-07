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
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const VendorList = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const token = localStorage.getItem('token');
        const params = search ? `?search=${search}` : '';
        const response = await axios.get(`${API_BASE_URL}/vendors${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          setVendors(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch vendors:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendors();
  }, [search]);

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
            Vendors
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/vendors/new')}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            New Vendor
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
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
          placeholder="Search vendors..."
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

      {/* Vendors Grid */}
      {vendors.length === 0 ? (
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
            No vendors found
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/vendors/new')}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Add Vendor
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {vendors.map(vendor => (
            <Grid item xs={12} sm={6} lg={4} key={vendor._id}>
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
                onClick={() => navigate(`/vendors/${vendor._id}`)}
              >
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <BusinessIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                  <Typography variant="h6" fontWeight={700} color="text.primary">
                    {vendor.name}
                  </Typography>
                </Box>

                <Box sx={{ mt: 'auto' }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      Code
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {vendor.code}
                    </Typography>
                  </Box>

                  {vendor.contactPerson && (
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        Contact
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {vendor.contactPerson}
                      </Typography>
                    </Box>
                  )}

                  {vendor.email && (
                    <Box display="flex" alignItems="center" gap={1} mb={1} mt={2}>
                      <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {vendor.email}
                      </Typography>
                    </Box>
                  )}

                  {vendor.phone && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {vendor.phone}
                      </Typography>
                    </Box>
                  )}

                  {vendor.location && (
                    <Box 
                      sx={{ 
                        mt: 2,
                        p: 1.5,
                        bgcolor: 'primary.lighter',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <LocationIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="caption" color="primary.main">
                        {vendor.location.city}, {vendor.location.state}
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

export default VendorList;
