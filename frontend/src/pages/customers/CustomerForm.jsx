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
  Grid,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';

// Static hierarchy options for consistency across the app
const customerHierarchyOptions = {
  channels: ['Modern Trade', 'Traditional Trade', 'E-Commerce', 'Wholesale', 'Foodservice', 'Convenience'],
  subChannels: ['Hypermarket', 'Supermarket', 'Mini Market', 'Spaza Shop', 'Online Marketplace', 'Quick Service Restaurant'],
  segmentations: ['Premium', 'Value', 'Budget', 'Mainstream', 'Niche'],
  hierarchy1: ['National', 'Regional', 'Local'],
  hierarchy2: ['Key Account', 'Mid-Tier', 'Small Account'],
  hierarchy3: ['Strategic', 'Growth', 'Maintain', 'Decline'],
  headOffices: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein']
};

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    tier: 'bronze',
    status: 'active',
    address: '',
    // Hierarchy fields
    channel: '',
    subChannel: '',
    segmentation: '',
    hierarchy1: '',
    hierarchy2: '',
    hierarchy3: '',
    headOffice: ''
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditMode) fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || '/api'}/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const customer = response.data.data || response.data;
      setFormData({
        name: customer.name || '',
        email: customer.contactEmail || customer.email || '',
        phone: customer.contactPhone || customer.phone || '',
        company: customer.company || '',
        tier: customer.tier || 'bronze',
        status: customer.status || 'active',
        address: customer.address || '',
        // Hierarchy fields
        channel: customer.channel || '',
        subChannel: customer.subChannel || customer.sub_channel || '',
        segmentation: customer.segmentation || '',
        hierarchy1: customer.hierarchy1 || customer.hierarchy_1 || '',
        hierarchy2: customer.hierarchy2 || customer.hierarchy_2 || '',
        hierarchy3: customer.hierarchy3 || customer.hierarchy_3 || '',
        headOffice: customer.headOffice || customer.head_office || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

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
      const url = `${process.env.REACT_APP_API_BASE_URL || '/api'}/customers${isEditMode ? `/${id}` : ''}`;
      
      // Transform hierarchy fields to snake_case for backend
      const payload = {
        ...formData,
        contactEmail: formData.email,
        contactPhone: formData.phone,
        sub_channel: formData.subChannel,
        hierarchy_1: formData.hierarchy1,
        hierarchy_2: formData.hierarchy2,
        hierarchy_3: formData.hierarchy3,
        head_office: formData.headOffice
      };
      delete payload.subChannel;
      delete payload.hierarchy1;
      delete payload.hierarchy2;
      delete payload.hierarchy3;
      delete payload.headOffice;
      
      await axios[isEditMode ? 'put' : 'post'](url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/customers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer');
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
            {isEditMode ? 'Edit Customer' : 'Create New Customer'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => navigate('/customers')}
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
                  label="Customer Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter customer name"
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
                  placeholder="customer@example.com"
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
                <TextField
                  fullWidth
                  label="Company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Company name"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tier</InputLabel>
                  <Select
                    name="tier"
                    value={formData.tier}
                    onChange={handleChange}
                    label="Tier"
                  >
                    <MenuItem value="bronze">Bronze</MenuItem>
                    <MenuItem value="silver">Silver</MenuItem>
                    <MenuItem value="gold">Gold</MenuItem>
                    <MenuItem value="platinum">Platinum</MenuItem>
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
                    <MenuItem value="suspended">Suspended</MenuItem>
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
              placeholder="Enter address..."
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Customer Hierarchy
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Channel</InputLabel>
                  <Select
                    name="channel"
                    value={formData.channel}
                    onChange={handleChange}
                    label="Channel"
                  >
                    <MenuItem value="">Select Channel</MenuItem>
                    {customerHierarchyOptions.channels.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sub Channel</InputLabel>
                  <Select
                    name="subChannel"
                    value={formData.subChannel}
                    onChange={handleChange}
                    label="Sub Channel"
                  >
                    <MenuItem value="">Select Sub Channel</MenuItem>
                    {customerHierarchyOptions.subChannels.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Segmentation</InputLabel>
                  <Select
                    name="segmentation"
                    value={formData.segmentation}
                    onChange={handleChange}
                    label="Segmentation"
                  >
                    <MenuItem value="">Select Segmentation</MenuItem>
                    {customerHierarchyOptions.segmentations.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Hierarchy 1</InputLabel>
                  <Select
                    name="hierarchy1"
                    value={formData.hierarchy1}
                    onChange={handleChange}
                    label="Hierarchy 1"
                  >
                    <MenuItem value="">Select Hierarchy 1</MenuItem>
                    {customerHierarchyOptions.hierarchy1.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Hierarchy 2</InputLabel>
                  <Select
                    name="hierarchy2"
                    value={formData.hierarchy2}
                    onChange={handleChange}
                    label="Hierarchy 2"
                  >
                    <MenuItem value="">Select Hierarchy 2</MenuItem>
                    {customerHierarchyOptions.hierarchy2.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Hierarchy 3</InputLabel>
                  <Select
                    name="hierarchy3"
                    value={formData.hierarchy3}
                    onChange={handleChange}
                    label="Hierarchy 3"
                  >
                    <MenuItem value="">Select Hierarchy 3</MenuItem>
                    {customerHierarchyOptions.hierarchy3.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Head Office</InputLabel>
                  <Select
                    name="headOffice"
                    value={formData.headOffice}
                    onChange={handleChange}
                    label="Head Office"
                  >
                    <MenuItem value="">Select Head Office</MenuItem>
                    {customerHierarchyOptions.headOffices.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => navigate('/customers')}
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
              {saving ? 'Saving...' : isEditMode ? 'Update Customer' : 'Create Customer'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default CustomerForm;
