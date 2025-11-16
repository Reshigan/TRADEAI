import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Divider
} from '@mui/material';
import { FormDialog } from '../common';

const CustomerForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  customer = null
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'retailer',
    status: 'active',
    contact: {
      name: '',
      email: '',
      phone: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    },
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // If editing an existing customer, populate the form
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        code: customer.code,
        type: customer.type,
        status: customer.status,
        contact: { ...customer.contact },
        address: { ...customer.address },
        notes: customer.notes || ''
      });
    }
  }, [customer]);

  // Handle form field changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error for the field
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

  // Handle nested object changes
  const handleNestedChange = (parent, field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [parent]: {
        ...prevData[parent],
        [field]: value
      }
    }));
    
    // Clear error for the field
    if (errors[`${parent}.${field}`]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [`${parent}.${field}`]: null
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Customer name is required';
    }
    
    if (!formData.code) {
      newErrors.code = 'Customer code is required';
    }
    
    if (!formData.contact.name) {
      newErrors['contact.name'] = 'Contact name is required';
    }
    
    if (!formData.contact.email) {
      newErrors['contact.email'] = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contact.email)) {
      newErrors['contact.email'] = 'Invalid email format';
    }
    
    if (!formData.address.city) {
      newErrors['address.city'] = 'City is required';
    }
    
    if (!formData.address.state) {
      newErrors['address.state'] = 'State is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      setLoading(true);
      
      // Submit form
      onSubmit(formData);
      setLoading(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={customer ? 'Edit Customer' : 'Add Customer'}
      submitText={customer ? 'Update' : 'Create'}
      loading={loading}
      maxWidth="md"
    >
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
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
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Customer Code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              error={!!errors.code}
              helperText={errors.code}
              required
              placeholder="e.g., WMT, TGT"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                name="type"
                value={formData.type}
                onChange={handleChange}
                label="Type"
              >
                <MenuItem value="retailer">Retailer</MenuItem>
                <MenuItem value="wholesaler">Wholesaler</MenuItem>
                <MenuItem value="distributor">Distributor</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Contact Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Name"
              value={formData.contact.name}
              onChange={(e) => handleNestedChange('contact', 'name', e.target.value)}
              error={!!errors['contact.name']}
              helperText={errors['contact.name']}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Email"
              value={formData.contact.email}
              onChange={(e) => handleNestedChange('contact', 'email', e.target.value)}
              error={!!errors['contact.email']}
              helperText={errors['contact.email']}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Phone"
              value={formData.contact.phone}
              onChange={(e) => handleNestedChange('contact', 'phone', e.target.value)}
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Address
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              value={formData.address.street}
              onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="City"
              value={formData.address.city}
              onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
              error={!!errors['address.city']}
              helperText={errors['address.city']}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="State/Province"
              value={formData.address.state}
              onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
              error={!!errors['address.state']}
              helperText={errors['address.state']}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ZIP/Postal Code"
              value={formData.address.zip}
              onChange={(e) => handleNestedChange('address', 'zip', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Country"
              value={formData.address.country}
              onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Additional Information
        </Typography>
        <Grid container spacing={3}>
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
        </Grid>
        
        {customer && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Customer Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(customer.created_at).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated: {new Date(customer.updated_at).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </FormDialog>
  );
};

export default CustomerForm;