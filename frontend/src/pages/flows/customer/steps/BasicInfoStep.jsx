import React from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  FormHelperText,
  Chip
} from '@mui/material';
import {
  Business as BusinessIcon,
  Store as StoreIcon,
  AccountBalance as BankIcon
} from '@mui/icons-material';

const BasicInfoStep = ({ data, onChange, errors = {} }) => {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const customerTypes = [
    { value: 'retailer', label: 'Retailer', icon: <StoreIcon /> },
    { value: 'wholesaler', label: 'Wholesaler', icon: <BusinessIcon /> },
    { value: 'distributor', label: 'Distributor', icon: <BankIcon /> },
    { value: 'chain', label: 'Chain Store', icon: <StoreIcon /> },
    { value: 'independent', label: 'Independent', icon: <StoreIcon /> },
    { value: 'online', label: 'E-commerce', icon: <StoreIcon /> }
  ];

  const channels = [
    { value: 'modern_trade', label: 'Modern Trade' },
    { value: 'traditional_trade', label: 'Traditional Trade' },
    { value: 'horeca', label: 'HORECA (Hotels/Restaurants/Cafes)' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'b2b', label: 'B2B' },
    { value: 'export', label: 'Export' }
  ];

  const tiers = [
    { value: 'platinum', label: 'Platinum', color: '#E5E4E2' },
    { value: 'gold', label: 'Gold', color: '#FFD700' },
    { value: 'silver', label: 'Silver', color: '#C0C0C0' },
    { value: 'bronze', label: 'Bronze', color: '#CD7F32' },
    { value: 'standard', label: 'Standard', color: '#808080' }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessIcon color="primary" />
        Basic Customer Information
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Enter the fundamental details about the customer. Fields marked with * are required.
      </Typography>

      <Grid container spacing={3}>
        {/* Company Name */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Company Name"
            value={data.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name || 'Official registered company name'}
            placeholder="e.g., ABC Retailers Ltd"
          />
        </Grid>

        {/* Customer Code */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Customer Code"
            value={data.code || ''}
            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
            error={!!errors.code}
            helperText={errors.code || 'Unique identifier (uppercase)'}
            placeholder="e.g., CUST001"
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />
        </Grid>

        {/* Customer Type */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!errors.customerType}>
            <InputLabel>Customer Type</InputLabel>
            <Select
              value={data.customerType || 'retailer'}
              label="Customer Type"
              onChange={(e) => handleChange('customerType', e.target.value)}
            >
              {customerTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {type.icon}
                    {type.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {errors.customerType || 'Select the business model type'}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* Channel */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!errors.channel}>
            <InputLabel>Channel</InputLabel>
            <Select
              value={data.channel || 'modern_trade'}
              label="Channel"
              onChange={(e) => handleChange('channel', e.target.value)}
            >
              {channels.map((channel) => (
                <MenuItem key={channel.value} value={channel.value}>
                  {channel.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {errors.channel || 'Distribution channel'}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* Tier */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.tier}>
            <InputLabel>Customer Tier</InputLabel>
            <Select
              value={data.tier || 'standard'}
              label="Customer Tier"
              onChange={(e) => handleChange('tier', e.target.value)}
            >
              {tiers.map((tier) => (
                <MenuItem key={tier.value} value={tier.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={tier.label}
                      size="small"
                      sx={{ 
                        bgcolor: tier.color,
                        color: tier.value === 'gold' ? '#000' : '#fff',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {errors.tier || 'Classification tier based on value/volume'}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* SAP Customer ID */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="SAP Customer ID"
            value={data.sapCustomerId || ''}
            onChange={(e) => handleChange('sapCustomerId', e.target.value)}
            error={!!errors.sapCustomerId}
            helperText={errors.sapCustomerId || 'Optional: For SAP integration'}
            placeholder="e.g., 1000123456"
          />
        </Grid>

        {/* Status */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.status}>
            <InputLabel>Status</InputLabel>
            <Select
              value={data.status || 'active'}
              label="Status"
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <MenuItem value="active">
                <Chip label="Active" color="success" size="small" />
              </MenuItem>
              <MenuItem value="pending">
                <Chip label="Pending" color="warning" size="small" />
              </MenuItem>
              <MenuItem value="inactive">
                <Chip label="Inactive" color="default" size="small" />
              </MenuItem>
              <MenuItem value="blocked">
                <Chip label="Blocked" color="error" size="small" />
              </MenuItem>
            </Select>
            <FormHelperText>
              {errors.status || 'Current account status'}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* Tags */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Tags"
            value={data.tags || ''}
            onChange={(e) => handleChange('tags', e.target.value)}
            helperText="Optional: Comma-separated tags for categorization (e.g., VIP, High-Volume, Key-Account)"
            placeholder="e.g., VIP, High-Volume, Key-Account"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default BasicInfoStep;
