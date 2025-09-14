import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

import { PageHeader } from '../common';

// Mock data for development
const mockCompany = {
  id: '3',
  name: 'Tech Innovations Inc',
  industry: 'Technology',
  region: 'North America',
  address: '123 Tech Blvd, San Francisco, CA 94105',
  phone: '+1 (555) 123-4567',
  website: 'https://techinnovations.example.com',
  status: 'active',
  currency: 'USD',
  taxId: 'US-987654321',
  notes: 'Leading technology company specializing in AI solutions.',
  createdAt: '2025-03-10T14:45:00Z'
};

// Available currencies
const currencies = [
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' }
];

// Available industries
const industries = [
  'Technology',
  'Manufacturing',
  'Retail',
  'Food & Beverage',
  'Healthcare',
  'Financial Services',
  'Energy',
  'Transportation',
  'Telecommunications',
  'Entertainment',
  'Education',
  'Construction',
  'Agriculture',
  'Hospitality',
  'Other'
];

// Available regions
const regions = [
  'North America',
  'South America',
  'Europe',
  'Asia Pacific',
  'Middle East',
  'Africa',
  'Australia & Oceania'
];

const CompanyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = id && id !== 'new';
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    region: '',
    address: '',
    phone: '',
    website: '',
    status: 'active',
    currency: 'ZAR',
    taxId: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Load company data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      // In a real app, we would fetch data from the API
      // For now, we'll use mock data
      setLoading(true);
      
    }
  }, [isEditMode]);
  
  // Handle form input change
  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === 'status' ? (checked ? 'active' : 'inactive') : value
    }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }
    
    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }
    
    if (!formData.region) {
      newErrors.region = 'Region is required';
    }
    
    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }
    
    if (formData.website && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(formData.website)) {
      newErrors.website = 'Invalid website URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    // In a real app, we would call the API to save the company
    setTimeout(() => {
      setSaving(false);
      
      setSnackbar({
        open: true,
        message: isEditMode
          ? `Company ${formData.name} has been updated`
          : `Company ${formData.name} has been created`,
        severity: 'success'
      });
      
      // Navigate back to company list after successful save
      setTimeout(() => {
        navigate('/companies');
      }, 1500);
    }, 1500);
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate('/companies');
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar((prevSnackbar) => ({
      ...prevSnackbar,
      open: false
    }));
  };
  
  return (
    <Box>
      <PageHeader
        title={isEditMode ? 'Edit Company' : 'Create Company'}
        subtitle={isEditMode ? 'Update company information' : 'Add a new company to the system'}
      />
      
      <Paper sx={{ p: 3, mb: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Company Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={Boolean(errors.industry)} required>
                  <InputLabel id="industry-label">Industry</InputLabel>
                  <Select
                    labelId="industry-label"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    label="Industry"
                  >
                    {industries.map((industry) => (
                      <MenuItem key={industry} value={industry}>
                        {industry}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.industry && <FormHelperText>{errors.industry}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={Boolean(errors.region)} required>
                  <InputLabel id="region-label">Region</InputLabel>
                  <Select
                    labelId="region-label"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    label="Region"
                  >
                    {regions.map((region) => (
                      <MenuItem key={region} value={region}>
                        {region}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.region && <FormHelperText>{errors.region}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={Boolean(errors.currency)} required>
                  <InputLabel id="currency-label">Currency</InputLabel>
                  <Select
                    labelId="currency-label"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    label="Currency"
                  >
                    {currencies.map((currency) => (
                      <MenuItem key={currency.code} value={currency.code}>
                        {currency.symbol} - {currency.name} ({currency.code})
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.currency && <FormHelperText>{errors.currency}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  error={Boolean(errors.website)}
                  helperText={errors.website}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tax ID"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.status === 'active'}
                      onChange={handleChange}
                      name="status"
                      color="primary"
                    />
                  }
                  label={formData.status === 'active' ? 'Active' : 'Inactive'}
                />
                <FormHelperText>
                  {formData.status === 'active'
                    ? 'Company is active and can be used in the system'
                    : 'Company is inactive and cannot be used in the system'
                  }
                </FormHelperText>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={4}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    startIcon={<ArrowBackIcon />}
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        Saving...
                      </>
                    ) : (
                      isEditMode ? 'Update Company' : 'Create Company'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        )}
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyForm;