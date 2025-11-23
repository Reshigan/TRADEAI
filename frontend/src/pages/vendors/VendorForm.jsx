import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';

const VendorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    rating: '3',
    status: 'active',
    address: ''
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEditMode) return;
    
    const fetchVendor = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || '/api'}/vendors/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const vendor = response.data.data || response.data;
        setFormData({
          name: vendor.name || '',
          contactPerson: vendor.contactPerson || '',
          email: vendor.email || '',
          phone: vendor.phone || '',
          rating: vendor.rating || '3',
          status: vendor.status || 'active',
          address: vendor.address || ''
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load vendor');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendor();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const url = `${process.env.REACT_APP_API_BASE_URL || '/api'}/vendors${isEditMode ? `/${id}` : ''}`;
      await axios[isEditMode ? 'put' : 'post'](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/vendors');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vendor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            {isEditMode ? 'Edit Vendor' : 'Create New Vendor'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => navigate('/vendors')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vendor Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter vendor name"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Contact person name"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="vendor@example.com"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+27 123 456 7890"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Rating</InputLabel>
                  <Select
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    label="Rating"
                  >
                    <MenuItem value="1">⭐ (1 - Poor)</MenuItem>
                    <MenuItem value="2">⭐⭐ (2 - Fair)</MenuItem>
                    <MenuItem value="3">⭐⭐⭐ (3 - Good)</MenuItem>
                    <MenuItem value="4">⭐⭐⭐⭐ (4 - Very Good)</MenuItem>
                    <MenuItem value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="blacklisted">Blacklisted</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Address
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter vendor address..."
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => navigate('/vendors')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
            >
              {saving ? 'Saving...' : isEditMode ? 'Update Vendor' : 'Create Vendor'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default VendorForm;
