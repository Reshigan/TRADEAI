import React from 'react';
import {
  Box,
  TextField,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Paper
} from '@mui/material';
import {
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const BusinessProfileStep = ({ data, onChange, errors = {} }) => {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handlePerformanceChange = (field, value) => {
    onChange({
      ...data,
      performance: {
        ...data.performance,
        [field]: value
      }
    });
  };

  const complianceStatuses = [
    { value: 'compliant', label: 'Compliant', color: 'success' },
    { value: 'warning', label: 'Warning', color: 'warning' },
    { value: 'non_compliant', label: 'Non-Compliant', color: 'error' }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessIcon color="primary" />
        Business Profile & Performance
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Define business performance targets and provide additional business context.
      </Typography>

      <Grid container spacing={3}>
        {/* Performance Metrics Section */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon fontSize="small" />
              Performance Metrics
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Last Year Sales"
                  value={data.performance?.lastYearSales || ''}
                  onChange={(e) => handlePerformanceChange('lastYearSales', parseFloat(e.target.value) || 0)}
                  error={!!errors['performance.lastYearSales']}
                  helperText={errors['performance.lastYearSales'] || 'Total sales last year'}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Current Year Target"
                  value={data.performance?.currentYearTarget || ''}
                  onChange={(e) => handlePerformanceChange('currentYearTarget', parseFloat(e.target.value) || 0)}
                  error={!!errors['performance.currentYearTarget']}
                  helperText={errors['performance.currentYearTarget'] || 'Sales target this year'}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Current Year Actual"
                  value={data.performance?.currentYearActual || ''}
                  onChange={(e) => handlePerformanceChange('currentYearActual', parseFloat(e.target.value) || 0)}
                  error={!!errors['performance.currentYearActual']}
                  helperText={errors['performance.currentYearActual'] || 'Sales to date'}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>$</Typography>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Growth Rate (%)"
                  value={data.performance?.growthRate || ''}
                  onChange={(e) => handlePerformanceChange('growthRate', parseFloat(e.target.value) || 0)}
                  error={!!errors['performance.growthRate']}
                  helperText={errors['performance.growthRate'] || 'Expected/actual growth'}
                  InputProps={{
                    endAdornment: <Typography variant="body2" sx={{ ml: 1 }}>%</Typography>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Market Share (%)"
                  value={data.performance?.marketShare || ''}
                  onChange={(e) => handlePerformanceChange('marketShare', parseFloat(e.target.value) || 0)}
                  error={!!errors['performance.marketShare']}
                  helperText={errors['performance.marketShare'] || 'Market share percentage'}
                  InputProps={{
                    endAdornment: <Typography variant="body2" sx={{ ml: 1 }}>%</Typography>
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Business Description */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Business Description"
            value={data.businessDescription || ''}
            onChange={(e) => handleChange('businessDescription', e.target.value)}
            error={!!errors.businessDescription}
            helperText={errors.businessDescription || 'Brief description of the customer business, products, markets'}
            placeholder="Describe the customer's business, main products, target markets, and any unique characteristics..."
          />
        </Grid>

        {/* Compliance Status */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.complianceStatus}>
            <InputLabel>Compliance Status</InputLabel>
            <Select
              value={data.complianceStatus || 'compliant'}
              label="Compliance Status"
              onChange={(e) => handleChange('complianceStatus', e.target.value)}
            >
              {complianceStatuses.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  <Chip label={status.label} color={status.color} size="small" />
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {errors.complianceStatus || 'Regulatory and policy compliance status'}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* Customer Groups */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.customerGroup}>
            <InputLabel>Customer Group</InputLabel>
            <Select
              value={data.customerGroup || ''}
              label="Customer Group"
              onChange={(e) => handleChange('customerGroup', e.target.value)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="GROUP_A">Group A - Strategic Partners</MenuItem>
              <MenuItem value="GROUP_B">Group B - Key Accounts</MenuItem>
              <MenuItem value="GROUP_C">Group C - Regular Customers</MenuItem>
              <MenuItem value="GROUP_D">Group D - Small Accounts</MenuItem>
              <MenuItem value="GROUP_E">Group E - Occasional Buyers</MenuItem>
            </Select>
            <FormHelperText>
              {errors.customerGroup || 'Assign to a customer group for targeted management'}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Internal Notes"
            value={data.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            helperText="Internal notes about this customer (not visible to the customer)"
            placeholder="Add any relevant notes about relationships, preferences, special requirements, history..."
          />
        </Grid>

        {/* Custom Fields */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Custom Fields (Optional)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Industry Vertical"
                  value={data.customFields?.industryVertical || ''}
                  onChange={(e) => handleChange('customFields', { 
                    ...(data.customFields || {}), 
                    industryVertical: e.target.value 
                  })}
                  placeholder="e.g., FMCG, Pharma, Electronics"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Business License Number"
                  value={data.customFields?.businessLicense || ''}
                  onChange={(e) => handleChange('customFields', { 
                    ...(data.customFields || {}), 
                    businessLicense: e.target.value 
                  })}
                  placeholder="Business registration/license number"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BusinessProfileStep;
